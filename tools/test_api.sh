#!/bin/bash

# -------------------------------
# Configuration Variables
# -------------------------------

# Backend URL
BACKEND_URL="http://localhost:8000"

# Admin JWT (must be a valid JWT with is_admin=True)
# IMPORTANT: Ensure this is set to the generated Admin JWT.
ADMIN_JWT="${ADMIN_JWT:-your_admin_jwt_here}"

# Check if ADMIN_JWT is set correctly
if [ "$ADMIN_JWT" == "your_admin_jwt_here" ]; then
    echo "[WARNING] ADMIN_JWT is set to the default placeholder. Please update it to a valid admin JWT." >&2
fi

# Function to generate a random username
generate_username() {
    echo "john_doe_$(date +%s)"
}

# -------------------------------
# Utility Functions
# -------------------------------

# Function to perform HTTP requests using curl
perform_curl() {
    local method=$1
    local url=$2
    shift 2
    local headers=()
    local data=""
    local auth_token=""

    # Parse all arguments first
    while [[ "$#" -gt 0 ]]; do
        case "$1" in
            -H)
                headers+=("-H" "$2")
                shift 2
                ;;
            -d)
                data=("-d" "$2")
                shift 2
                ;;
            --auth)
                auth_token="Bearer $2"
                headers+=("-H" "Authorization: $auth_token")
                shift 2
                ;;
            *)
                echo "[ERROR] Unsupported option: $1" >&2
                return 1
                ;;
        esac
    done

    # Logging request details to stderr
    echo "----------------------------------------" >&2
    echo "Performing $method request to $url" >&2
    echo "Headers: ${headers[@]}" >&2
    if [ "${#data[@]}" -ne 0 ]; then
        echo "Data: ${data[1]}" >&2
    fi

    # Execute curl command and capture body and status code
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" "${headers[@]}")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" "${headers[@]}" "${data[@]}")
    else
        echo "[ERROR] Unsupported HTTP method: $method" >&2
        return 1
    fi

    # Split response and status code
    http_body=$(echo "$response" | sed '$d')
    http_status=$(echo "$response" | tail -n1)

    # Output the results to stderr
    echo "HTTP Status Code: $http_status" >&2
    echo "HTTP Response Body: $http_body" >&2
    echo "----------------------------------------" >&2

    # Return body and status
    printf "%s\n%s\n" "$http_body" "$http_status"
}

# Function to print info messages
print_info() {
    echo "[INFO] $1"
}

# Function to print success messages
print_success() {
    echo "[SUCCESS] $1"
}

# Function to print failure messages
print_failure() {
    echo "[FAILURE] $1"
}

# -------------------------------
# Test Steps
# -------------------------------

# Step 1: Register a New User
register_user() {
    USER1_USERNAME=$(generate_username)
    USER1_EMAIL="${USER1_USERNAME}@example.com"
    USER1_COMPANY="Example Corp"

    print_info "Registering a new user: $USER1_USERNAME"

    payload=$(cat <<EOF
{
  "username": "$USER1_USERNAME",
  "email": "$USER1_EMAIL",
  "company": "$USER1_COMPANY"
}
EOF
    )

    echo "Registration Payload:"
    echo "$payload"

    # Capture response
    response=$(perform_curl "POST" "$BACKEND_URL/users/register" -H "Content-Type: application/json" -d "$payload")

    # Extract body and status using separate read commands
    IFS= read -r body <<< "$(echo "$response" | head -n1)"
    IFS= read -r status <<< "$(echo "$response" | tail -n1)"

    echo "Parsed Status Code: $status"
    echo "Parsed Response Body: $body"

    if [[ "$status" == "200" || "$status" == "201" ]]; then
        token=$(echo "$body" | jq -r '.token')
        if [ "$token" != "null" ] && [ -n "$token" ]; then
            print_success "User registered successfully. Token: $token"
        else
            print_failure "User registered but failed to retrieve token."
            echo "Response Body: $body"
            exit 1
        fi
    elif [[ "$status" == "000" ]]; then
        print_failure "No response received from the server."
        exit 1
    else
        error_message=$(echo "$body" | jq -r '.detail // .message // "Unknown error"')
        print_failure "Failed to register user. Status Code: $status, Response: $error_message"
        exit 1
    fi

    REGISTERED_USER_TOKEN="$token"
}

# Step 2: Validate the Token and Receive JWT
validate_token() {
    print_info "Validating token to receive JWT."

    payload=$(cat <<EOF
{
  "token": "$REGISTERED_USER_TOKEN"
}
EOF
    )

    echo "Validation Payload:"
    echo "$payload"

    # Capture response
    response=$(perform_curl "POST" "$BACKEND_URL/users/validate-token" -H "Content-Type: application/json" -d "$payload")

    # Extract body and status using separate read commands
    IFS= read -r body <<< "$(echo "$response" | head -n1)"
    IFS= read -r status <<< "$(echo "$response" | tail -n1)"

    echo "Parsed Status Code: $status"
    echo "Parsed Response Body: $body"

    if [[ "$status" == "200" || "$status" == "201" ]]; then
        jwt=$(echo "$body" | jq -r '.access_token')
        if [ "$jwt" != "null" ] && [ -n "$jwt" ]; then
            print_success "Token validated successfully. JWT: $jwt"
        else
            print_failure "Token validated but failed to retrieve JWT."
            echo "Response Body: $body"
            exit 1
        fi
    else
        error_message=$(echo "$body" | jq -r '.detail // .message // "Unknown error"')
        print_failure "Failed to validate token. Status Code: $status, Response: $error_message"
        exit 1
    fi

    REGISTERED_USER_JWT="$jwt"
}

# Step 3: Attempt to Reuse the Token
reuse_token() {
    print_info "Attempting to reuse the same token (should fail)."

    payload=$(cat <<EOF
{
  "token": "$REGISTERED_USER_TOKEN"
}
EOF
    )

    echo "Reuse Token Payload:"
    echo "$payload"

    # Capture response
    response=$(perform_curl "POST" "$BACKEND_URL/users/validate-token" -H "Content-Type: application/json" -d "$payload")

    # Extract body and status using separate read commands
    IFS= read -r body <<< "$(echo "$response" | head -n1)"
    IFS= read -r status <<< "$(echo "$response" | tail -n1)"

    echo "Parsed Status Code: $status"
    echo "Parsed Response Body: $body"

    if [[ "$status" == "403" ]]; then
        print_success "Reusing token failed as expected. Status Code: $status, Response: $body"
    else
        print_failure "Reusing token did not fail as expected. Status Code: $status, Response: $body"
        exit 1
    fi
}

# Step 4: Access Protected Route with JWT
access_protected_route() {
    print_info "Accessing protected route '/game/settings' with JWT."

    # Capture response
    response=$(perform_curl "GET" "$BACKEND_URL/game/settings" --auth "$REGISTERED_USER_JWT" -H "Content-Type: application/json")

    # Extract body and status using separate read commands
    IFS= read -r body <<< "$(echo "$response" | head -n1)"
    IFS= read -r status <<< "$(echo "$response" | tail -n1)"

    echo "Parsed Status Code: $status"
    echo "Parsed Response Body: $body"

    if [[ "$status" == "200" || "$status" == "201" ]]; then
        print_success "Accessed protected route successfully. Response: $body"
    else
        error_message=$(echo "$body" | jq -r '.detail // .message // "Unknown error"')
        print_failure "Failed to access protected route. Status Code: $status, Response: $error_message"
        exit 1
    fi
}

# Step 5: Attempt to Access Admin Route with User JWT (Should Fail)
access_admin_route_with_user_jwt() {
    print_info "Attempting to access admin route '/admin/settings' with user JWT (should fail)."

    # Example payload to update settings
    payload=$(cat <<EOF
{
  "target_price": 150.0,
  "time_limit": 400
}
EOF
    )

    echo "Admin Update Game Settings Payload:"
    echo "$payload"

    # Capture response
    response=$(perform_curl "POST" "$BACKEND_URL/admin/settings" --auth "$REGISTERED_USER_JWT" -H "Content-Type: application/json" -d "$payload")

    # Extract body and status using separate read commands
    IFS= read -r body <<< "$(echo "$response" | head -n1)"
    IFS= read -r status <<< "$(echo "$response" | tail -n1)"

    echo "Parsed Status Code: $status"
    echo "Parsed Response Body: $body"

    if [[ "$status" == "403" ]]; then
        print_success "Accessing admin route with user JWT failed as expected. Status Code: $status, Response: $body"
    else
        print_failure "Accessing admin route with user JWT did not fail as expected. Status Code: $status, Response: $body"
        exit 1
    fi
}

# Step 6: Access Admin Route with Admin JWT
access_admin_route_with_admin_jwt() {
    print_info "Accessing admin route '/admin/settings' with Admin JWT."

    # Example payload to update settings
    payload=$(cat <<EOF
{
  "target_price": 150.0,
  "time_limit": 400
}
EOF
    )

    echo "Admin Update Game Settings Payload:"
    echo "$payload"

    # Capture response with correct --auth flag
    response=$(perform_curl "POST" "$BACKEND_URL/admin/settings" --auth "$ADMIN_JWT" -H "Content-Type: application/json" -d "$payload")

    # Extract body and status using separate read commands
    IFS= read -r body <<< "$(echo "$response" | head -n1)"
    IFS= read -r status <<< "$(echo "$response" | tail -n1)"

    echo "Parsed Status Code: $status"
    echo "Parsed Response Body: $body"

    if [[ "$status" == "200" || "$status" == "201" ]]; then
        print_success "Accessed admin route successfully. Response: $body"
    else
        error_message=$(echo "$body" | jq -r '.detail // .message // "Unknown error"')
        print_failure "Failed to access admin route. Status Code: $status, Response: $error_message"
        exit 1
    fi
}

# -------------------------------
# Execution Flow
# -------------------------------

echo "Starting API Tests..."

# Step 1: Register a New User
print_info "STEP 1: Register a New User"
register_user

# Step 2: Validate the Token and Receive JWT
print_info "STEP 2: Validate the Token and Receive JWT"
validate_token

# Step 3: Attempt to Reuse the Token
print_info "STEP 3: Attempt to Reuse the Token"
reuse_token

# Step 4: Access Protected Route with JWT
print_info "STEP 4: Access Protected Route with JWT"
access_protected_route

# Step 5: Attempt to Access Admin Route with User JWT (Should Fail)
print_info "STEP 5: Attempt to Access Admin Route with User JWT (Should Fail)"
access_admin_route_with_user_jwt

# Step 6: Access Admin Route with Admin JWT
print_info "STEP 6: Access Admin Route with Admin JWT"
access_admin_route_with_admin_jwt

echo "[SUCCESS] All tests completed successfully!"
