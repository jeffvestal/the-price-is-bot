// src/components/MainGame.js

import React, { useState } from 'react';
import SignUpForm from './SignUpForm';
import ChatInterface from './ChatInterface';
import GameDisplay from './GameDisplay';
import Leaderboard from './Leaderboard';
import Timer from './Timer';
import { Box, Button, Alert } from '@mui/material';
import PropTypes from 'prop-types';

function MainGame({
  user,
  handleLogin,
  sessionId,
  items,
  setItems,
  setTotalPrice,
  totalPrice,
  timeUp,
  timeTaken,
  handleTimeUp,
  handleSubmit,
}) {
  const [hasAcceptedSolution, setHasAcceptedSolution] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState('');
  const [submitted, setSubmitted] = useState(false); // Track if submitted

  const [elapsedTime, setElapsedTime] = useState(0); // New state variable

  const handleFinalSubmit = async () => {
    if (!user) {
      alert('Please log in first.');
      return;
    }
    // Prepare game result data
    const gameResult = {
      items: items,
      total_price: totalPrice,
      time_taken: elapsedTime, // Use elapsedTime from Timer component
    };

    // Log the payload
    console.log('Submitting Game Result:', gameResult);

    // Disable further interactions by marking as submitted
    setSubmitted(true); // Mark as submitted

    // Submit game result to backend
    try {
      const response = await handleSubmit(gameResult);
      setSubmissionSuccess(`Your score is ${response.score}`);
      setSubmissionError('');
    } catch (error) {
      console.error(error);
      if (error.response) {
        setSubmissionError(`Submission failed: ${error.response.data.detail || 'Unknown error'}`);
      } else if (error.request) {
        setSubmissionError('No response from server. Please try again later.');
      } else {
        setSubmissionError('An unexpected error occurred.');
      }
      setSubmissionSuccess('');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {!user ? (
        <SignUpForm onLogin={handleLogin} />
      ) : (
        <>
          {!timeUp && <Timer onTimeUp={handleTimeUp} setElapsedTime={setElapsedTime} />}
          <ChatInterface
            sessionId={sessionId}
            items={items}
            setItems={setItems}
            setTotalPrice={setTotalPrice}
            timeUp={timeUp}
            setHasAcceptedSolution={setHasAcceptedSolution}
          />
          <GameDisplay items={items} totalPrice={totalPrice} proposedSolution={!hasAcceptedSolution} />
          {submissionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submissionError}
            </Alert>
          )}
          {submissionSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {submissionSuccess}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinalSubmit}
            disabled={!items.length || !hasAcceptedSolution || submitted || timeUp} // Disable based on multiple conditions
            sx={{ mt: 2 }}
          >
            {submitted ? 'Submitted' : 'Submit'}
          </Button>
        </>
      )}
      <Leaderboard />
    </Box>
  );
}

MainGame.propTypes = {
  user: PropTypes.object,
  handleLogin: PropTypes.func.isRequired,
  sessionId: PropTypes.string,
  items: PropTypes.array.isRequired,
  setItems: PropTypes.func.isRequired,
  setTotalPrice: PropTypes.func.isRequired,
  totalPrice: PropTypes.number.isRequired,
  timeUp: PropTypes.bool.isRequired,
  timeTaken: PropTypes.number.isRequired,
  handleTimeUp: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default MainGame;
