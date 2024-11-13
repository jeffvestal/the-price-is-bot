#!/bin/bash

# Print the header at the start of the output

echo
echo "COMPLETE CODE BASE"
echo "================================================================================================================================================================================================"
echo "================================================================================================================================================================================================"
echo ""

# Function to recursively list files and their contents, excluding __pycache__, .env files, .svg files, and .png files
function list_files {
    for file in "$1"/*; do
        if [ -d "$file" ]; then
            # If it's the __pycache__ directory, skip it
            if [[ "$(basename "$file")" == "__pycache__" ]]; then
                continue
            fi
            # If it's another directory, recurse into it
            list_files "$file"
        elif [ -f "$file" ]; then
            # If it's a .env, .svg, or .png file, skip it
            if [[ "$(basename "$file")" == ".env" || "$file" == *.svg || "$file" == *.png ]]; then
                continue
            fi
            # If it's a file, echo the path and name, then cat its content
            echo "File: $file"
            cat "$file"
            echo '---'
        fi
    done
}

# Start from the directories ./backend/app and ./frontend/src
list_files "../backend/app"
list_files "../frontend/src"

echo "../backend/Dockerfile"
cat "../backend/Dockerfile"
echo '---'
echo "../frontend/Dockerfile"
cat "../frontend/Dockerfile"
echo '---'
echo "../deploy.sh"
cat "../deploy.sh"
