// src/components/GameDisplay.js

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PropTypes from 'prop-types';

function GameDisplay({ items, totalPrice, proposedSolution }) {
  // Ensure totalPrice is a number; if not, default to 0
  const formattedTotalPrice = typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00';

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Your Selections
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {items.length > 0 ? (
          items.map((item, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Podium {item.podium}:</strong> {item.quantity} x {item.item_name} @ ${item.item_price.toFixed(2)} each
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: ${(item.item_price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body1">No items selected yet.</Typography>
        )}
        <Typography variant="h6" sx={{ mt: 2 }}>
          Total Price: ${formattedTotalPrice}
        </Typography>
        {proposedSolution && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            * This solution exceeds the set limits and may be marked as unsuccessful upon submission.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

GameDisplay.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      podium: PropTypes.number.isRequired,
      item_name: PropTypes.string.isRequired,
      item_price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  totalPrice: PropTypes.number.isRequired,
  proposedSolution: PropTypes.bool,
};

GameDisplay.defaultProps = {
  proposedSolution: false,
};

export default GameDisplay;
