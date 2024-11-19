// frontend/src/components/Timer.js

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { EuiText, EuiFlexGroup, EuiFlexItem } from "@elastic/eui";
import PropTypes from 'prop-types';

function Timer({ 
  onTimeUp, 
  setElapsedTime, 
  hasGameEnded, 
  isShowInfoModalVisible = false, 
  hasGameRestarted = false, 
}) { 
  const [timeLeft, setTimeLeft] = useState(null); // Initialize as null
  const [elapsed, setLocalElapsed] = useState(0); // Local state for elapsed time
  const [hasTimerStarted, setHasTimerStarted] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fetchTimeLimit = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/game/settings`);
      setTimeLeft(response.data.time_limit);
    } catch (error) {
      console.error(error);
      setTimeLeft(300); // Default to 5 minutes
    }
  };

  // Reset timer states when game is restarted
  useEffect(() => {
    if (hasGameRestarted) {
      clearTimer();
      setHasTimerStarted(false);
      setLocalElapsed(0);
      fetchTimeLimit();
    }
  }, [hasGameRestarted]);

  // Initial time limit fetch
  useEffect(() => {
    fetchTimeLimit();
  }, []);

  // Start timer when modal is closed for the first time or when the game is restarted start right away
  useEffect(() => {
    if ((!isShowInfoModalVisible || hasGameRestarted) && !hasTimerStarted && timeLeft !== null) {
      setHasTimerStarted(true);
    }
  }, [isShowInfoModalVisible, hasTimerStarted, timeLeft, hasGameRestarted]);

  // Timer countdown logic
  useEffect(() => {
    if (!hasTimerStarted || timeLeft === null || hasGameEnded) {
      return;
    }

    if (timeLeft <= 0) {
      clearTimer();
      onTimeUp(elapsed);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
      setLocalElapsed((e) => e + 1);
    }, 1000);

    return () => clearTimer();
  }, [timeLeft, elapsed, onTimeUp, hasTimerStarted, hasGameEnded]);


  useEffect(() => {
    // Update the parent with the current elapsed time
    setElapsedTime(elapsed);
  }, [elapsed, setElapsedTime]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, []);

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
