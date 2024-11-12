// File: ./frontend/src/components/MainGame.js

import React, { useState } from "react";
import SignUpForm from "./SignUpForm";
import ChatInterface from "./ChatInterface";
import GameDisplay from "./GameDisplay";
import Leaderboard from "./Leaderboard";
import Timer from "./Timer";
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiCallOut,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiText,
} from "@elastic/eui";
import PropTypes from "prop-types";

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
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);

  const handleFinalSubmit = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    const gameResult = {
      items: items,
      total_price: totalPrice,
      time_taken: elapsedTime,
    };

    setSubmitted(true);

    try {
      const response = await handleSubmit(gameResult);
      setSubmissionSuccess(`Your score is ${response.score}`);
      setSubmissionError("");
    } catch (error) {
      console.error(error);
      setSubmissionError(
        error.response?.data?.detail ||
          "Submission failed. Please try again later."
      );
      setSubmissionSuccess("");
    }
  };

  const closeResetModal = () => {
    setIsResetModalVisible(false);
  };

  const showResetModal = () => {
    setIsResetModalVisible(true);
  };

  const resetSession = () => {
    handleLogin(null);
    setIsResetModalVisible(false);
  };

  return (
    <EuiPanel paddingSize="l" style={{ position: "relative" }}>
      {user && (
        <EuiButtonEmpty
          color="danger"
          onClick={showResetModal}
          style={{ position: "absolute", top: 16, right: 16 }}
        >
          Reset Session
        </EuiButtonEmpty>
      )}
      {!user ? (
        <SignUpForm onLogin={handleLogin} />
      ) : (
        <>
          {!timeUp && (
            <Timer onTimeUp={handleTimeUp} setElapsedTime={setElapsedTime} />
          )}
          <EuiSpacer size="l" />
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <ChatInterface
                sessionId={sessionId}
                items={items}
                setItems={setItems}
                setTotalPrice={setTotalPrice}
                timeUp={timeUp}
                setHasAcceptedSolution={setHasAcceptedSolution}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <GameDisplay
                items={items}
                totalPrice={totalPrice}
                proposedSolution={!hasAcceptedSolution}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m" />
          {submissionError && (
            <EuiCallOut title="Error" color="danger" iconType="alert">
              <p>{submissionError}</p>
            </EuiCallOut>
          )}
          {submissionSuccess && (
            <EuiCallOut title="Success" color="success" iconType="check">
              <p>{submissionSuccess}</p>
            </EuiCallOut>
          )}
          <EuiSpacer size="m" />
          <EuiButton
            color="primary"
            onClick={handleFinalSubmit}
            isDisabled={
              !items.length || !hasAcceptedSolution || submitted || timeUp
            }
          >
            {submitted ? "Submitted" : "Submit"}
          </EuiButton>
        </>
      )}
      {/* <Leaderboard /> */}

      {isResetModalVisible && (
        <EuiModal onClose={closeResetModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Reset Session</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText>
              Are you sure you want to reset the session? This will clear all
              your current progress and return you to the registration page.
            </EuiText>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButtonEmpty onClick={closeResetModal}>Cancel</EuiButtonEmpty>
            <EuiButton color="danger" onClick={resetSession} fill>
              Reset
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
    </EuiPanel>
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
