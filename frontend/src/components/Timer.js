// frontend/src/components/Timer.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { EuiText, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
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
      <EuiFlexGroup justifyContent="center">
        <EuiFlexItem grow={false}>
          <EuiText>
            <h6>Loading Timer...</h6>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <EuiFlexGroup justifyContent="center" className='game-timer'>
      <EuiFlexItem grow={false}>
        <EuiText>
          <h6>Time Left: {timeLeft} seconds</h6>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

Timer.propTypes = {
  onTimeUp: PropTypes.func.isRequired,
  setElapsedTime: PropTypes.func.isRequired,
};

export default Timer;
