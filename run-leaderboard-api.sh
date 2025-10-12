#!/bin/bash  
# Run leaderboard API using unified venv
source ../venv/bin/activate
cd leaderboard-api
uvicorn main:app --reload "$@"
