// File: ./frontend/src/components/MainGame.js

import React, { useState, useRef } from "react";
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
import './MainGame.css';
import './Override.css';

function MainGame({
  user,
  handleLogin,
  sessionId,
  items,
  setItems,
  setTotalPrice,
  totalPrice,
  timeUp,
  handleTimeUp,
  handleSubmit,
}) {
  const [hasAcceptedSolution, setHasAcceptedSolution] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [isShowInfoModalVisible, setShowInfoModalVisible] = useState(true);
  const [hasGameRestarted, setHasGameRestarted] = useState(false);
  const leaderboardRef = useRef(null)
  const [localTimeUp, setLocalTimeUp] = useState(timeUp);


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

      // Scroll to leaderboard after successful submission
      setTimeout(() => {
        leaderboardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 250); 
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

  const closeInfoModal = () => {
    setShowInfoModalVisible(false);
  };

  const showResetModal = () => {
    setIsResetModalVisible(true);
  };

  const showInfoModal = () => {
    setShowInfoModalVisible(true);
  }

  const resetSession = () => {
    // Reset all game states
    setHasAcceptedSolution(false);
    setSubmissionError("");
    setSubmissionSuccess("");
    setSubmitted(false);
    setElapsedTime(0);
    setItems([]);
    setTotalPrice(0);
    setLocalTimeUp(false);
    setShowInfoModalVisible(false);
    setHasGameRestarted(prev => !prev); // Toggle to trigger timer reset
    setIsResetModalVisible(false);
    handleLogin(null);
  };

  const handleLocalTimeUp = (elapsed) => {
    setLocalTimeUp(true);
    handleTimeUp(elapsed);
  };

  return (
    <EuiPanel paddingSize="l" style={{ position: "relative" }} className="game-main-panel">
      {!user ? (
        <SignUpForm onLogin={handleLogin} />
      ) : (
        <>
          {!localTimeUp && (
            <Timer 
              onTimeUp={handleLocalTimeUp} 
              setElapsedTime={setElapsedTime} 
              hasGameEnded={submitted}
              isShowInfoModalVisible={isShowInfoModalVisible}
              hasGameRestarted={hasGameRestarted}
            />
          )}
          <EuiFlexGroup className="game-main-wrapper" gutterSize="l">
            <EuiFlexItem className="game-main-chat-wrapper">
              <ChatInterface
                sessionId={sessionId}
                items={items}
                setItems={setItems}
                setTotalPrice={setTotalPrice}
                timeUp={localTimeUp}
                setHasAcceptedSolution={setHasAcceptedSolution}
              />
            </EuiFlexItem>
            <EuiFlexItem className="game-main-podiums-wrapper">
              <GameDisplay
                items={items}
                totalPrice={totalPrice}
                proposedSolution={!hasAcceptedSolution}
                onSubmit={handleFinalSubmit}
                isDisabled={!items.length || !hasAcceptedSolution || submitted || timeUp}
                submitted={submitted}
                onReset={showResetModal}
                onShow={showInfoModal}
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
              <p className="success-submission">{submissionSuccess}</p>
            </EuiCallOut>
          )}
          <EuiSpacer size="m" />
        </>
      )}
      <div ref={leaderboardRef}>
        <Leaderboard heading="Leaderboard" user={user} />
      </div>
      {isShowInfoModalVisible && user && (
        <EuiModal onClose={closeInfoModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Our challenge:</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText className="modal-main-text">
              <p>
                Fill 5 shopping bags with items from our grocery inventory in Elasticsearch.
              </p>
              <p>The twist:</p>
              <p>Each bag can contain an unlimited number of any unique items, but your total
                must stay under $100.
              </p>
              <p>Use creative prompting to guide the LLM and build the perfect shopping cart.</p>
              <p>Are you up to for the challenge? Let's see what you can do.</p>
            </EuiText>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButton color="primary" onClick={closeInfoModal} fill className="got-it-button">
              Got it!
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
      {isResetModalVisible && (
        <EuiModal onClose={closeResetModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Reset Session</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText className="modal-main-text">
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
  handleTimeUp: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default MainGame;
