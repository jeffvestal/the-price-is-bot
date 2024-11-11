#!/bin/sh

set -e  # Exit immediately if a command exits with a non-zero status

# Check if REACT_APP_BACKEND_URL is set
if [ -z "$REACT_APP_BACKEND_URL" ]; then
  echo "Error: REACT_APP_BACKEND_URL is not set."
  exit 1
fi

echo "REACT_APP_BACKEND_URL is set to: $REACT_APP_BACKEND_URL"

# Verify that env.js exists
if [ ! -f /app/build/env.js ]; then
  echo "env.js not found in /app/build/"
  exit 1
fi

# Replace the placeholder in env.js with the actual backend URL
echo "Replacing __BACKEND_URL__ with ${REACT_APP_BACKEND_URL} in env.js..."
sed -i "s|__BACKEND_URL__|${REACT_APP_BACKEND_URL}|g" /app/build/env.js

# Verify replacement
echo "Verifying replacement in env.js..."
grep "REACT_APP_BACKEND_URL" /app/build/env.js

# Start the static server on the port specified by Cloud Run
PORT=${PORT:-8080}
echo "Starting serve on port ${PORT}..."
serve -s /app/build -l ${PORT}
