// src/components/GameDisplay.js

import React from "react";
import { EuiPanel, EuiText, EuiTitle } from "@elastic/eui";
import PropTypes from "prop-types";

function GameDisplay({ items, totalPrice }) {
  const formattedTotalPrice =
    typeof totalPrice === "number" ? totalPrice.toFixed(2) : "0.00";

  return (
    <EuiPanel style={{ maxWidth: "400px" }}>
      <EuiTitle size="m">
        <h2>Your Selections</h2>
      </EuiTitle>
      {items.length > 0 ? (
        items.map((item, idx) => (
          <EuiText key={idx}>
            <p>
              <strong>Podium {item.podium}:</strong> {item.quantity} x{" "}
              {item.item_name} @ ${item.item_price.toFixed(2)}
            </p>
            <p>Total: ${(item.item_price * item.quantity).toFixed(2)}</p>
          </EuiText>
        ))
      ) : (
        <EuiText>
          <p>No items selected yet.</p>
        </EuiText>
      )}
      <EuiText>
        <h3>Total Price: ${formattedTotalPrice}</h3>
      </EuiText>
    </EuiPanel>
  );
}

GameDisplay.propTypes = {
  items: PropTypes.array.isRequired,
  totalPrice: PropTypes.number.isRequired,
};

export default GameDisplay;
