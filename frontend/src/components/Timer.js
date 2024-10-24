// src/components/Timer.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

function Timer({ onTimeUp, setElapsedTime }) { // Accept setElapsedTime as a prop
  const [timeLeft, setTimeLeft] = useState(null); // Initialize as null
  const [elapsed, setLocalElapsed] = useState(0); // Local state for elapsed time

  useEffect(() => {
    const fetchTimeLimit = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/game/settings`);
        console.log("Fetched time_limit:", response.data.time_limit);
        setTimeLeft(response.data.time_limit);
      } catch (error) {
        console.error(error);
        setTimeLeft(300); // Default to 5 minutes
      }
    };
    fetchTimeLimit();
  }, []);

  useEffect(() => {
    if (timeLeft === null) return; // Don't start the timer until timeLeft is set
    if (timeLeft <= 0) {
      onTimeUp(elapsed);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((t) => t - 1);
      setLocalElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, elapsed, onTimeUp]);

  useEffect(() => {
    // Update the parent with the current elapsed time
    setElapsedTime(elapsed);
  }, [elapsed, setElapsedTime]);

  if (timeLeft === null) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Loading Timer...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Time Left: {timeLeft} seconds</Typography>
    </Box>
  );
}

Timer.propTypes = {
  onTimeUp: PropTypes.func.isRequired,
  setElapsedTime: PropTypes.func.isRequired,
};

export default Timer;
