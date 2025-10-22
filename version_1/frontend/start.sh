#!/bin/sh

set -e  # Exit immediately if a command exits with a non-zero status

# Check if REACT_APP_BACKEND_URL is set
if [ -z "$REACT_APP_BACKEND_URL" ]; then
  echo "Error: REACT_APP_BACKEND_URL is not set."
  exit 1
fi

echo "REACT_APP_BACKEND_URL is set to: $REACT_APP_BACKEND_URL"

# Start the static server on the port specified by Cloud Run
PORT=${PORT:-8080}
echo "Starting serve on port ${PORT}..."
serve -s /app/build -l ${PORT}
