// src/components/GameDisplay.js

import React from "react";
import { EuiPanel, EuiText, EuiTitle, EuiButton, EuiButtonEmpty } from "@elastic/eui";
import PropTypes from "prop-types";

function GameDisplay({ items, totalPrice, onSubmit, isDisabled, submitted, onReset, onShow }) {
  const formattedTotalPrice =
    typeof totalPrice === "number" ? totalPrice.toFixed(2) : "0.00";

  return (
    <EuiPanel>
      <div className="game-main-show-info-wrapper">
        <EuiButtonEmpty
          color="text"
          onClick={onShow}
          style={{fontSize: '0.9rem', blockSize: '24px'}}
          className="game-main-show-info-button"
        >
          Show the rules
        </EuiButtonEmpty>
      </div>
      <EuiTitle size="m" className="selections-heading">
        <h2>Your selection</h2>
      </EuiTitle>
      {items.length > 0 ? (
        items.map((item, idx) => (
          <div className="podium-item" key={idx}>
            <div className="podium-heading">Shopping bag {item.podium}</div>
            <div className="podium-content">
              <div>{item.quantity}x</div>
              <div>{item.item_name}</div>
              <div>${item.item_price.toFixed(2)}</div>
            </div>
            <div className="podium-total">Shopping bag total: ${(item.item_price * item.quantity).toFixed(2)}</div>
          </div>
        ))
      ) : (
        <div className="selections-empty-wrapper">
          <p>Waiting for items</p>
        </div>
      )}
      <EuiText>
        <h3 className="selections-total">Total : ${formattedTotalPrice}</h3>
      </EuiText>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <EuiButton
          color="primary"
          onClick={onSubmit}
          isDisabled={isDisabled}
          className="podiums-submit-button"
        >
          {submitted ? "Submitted selection" : "Submit your selection"}
        </EuiButton>
      </div>
      <div className="game-main-reset-button-wrapper">
        <EuiButtonEmpty
          color="danger"
          onClick={onReset}
          style={{fontSize: '0.9rem', blockSize: '24px'}}
          className="game-main-reset-button"
        >
          Reset the game
        </EuiButtonEmpty>
      </div>
    </EuiPanel>
  );
}

GameDisplay.propTypes = {
  items: PropTypes.array.isRequired,
  totalPrice: PropTypes.number.isRequired,
};

export default GameDisplay;
