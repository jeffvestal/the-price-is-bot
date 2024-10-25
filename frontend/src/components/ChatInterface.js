// File: ./frontend/src/components/ChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Alert,
  Modal,
  ListItemIcon
} from '@mui/material';
import PropTypes from 'prop-types';

function ChatInterface({
  sessionId,
  items,
  setItems,
  setTotalPrice,
  timeUp,
  setHasAcceptedSolution
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef();

  // State variables for proposed solution handling
  const [isProposedSolutionPending, setIsProposedSolutionPending] = useState(false);
  const [pendingProposedSolution, setPendingProposedSolution] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. Please log in.");
      return;
    }

    const socket = io(process.env.REACT_APP_BACKEND_URL, {
      query: { token: sessionId },
      transports: ['websocket'],
      path: '/socket.io',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      setError('');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError('Failed to connect to chat server. Please try again.');
    });

    socket.on('message', (message) => {
      if (message && message.content) {
        try {
          // Parse the incoming message content as JSON
          const parsedMessage = JSON.parse(message.content);

          if (parsedMessage.podiums && parsedMessage.overall_total !== undefined) {
            // Handle messages that include podiums and total
            setItems(parsedMessage.podiums.map(p => ({
              podium: p.podium,
              item_name: p.item_name,
              item_price: p.item_price,
              quantity: p.quantity,
            })));
            setTotalPrice(parsedMessage.overall_total);

            setMessages((prev) => [...prev, { sender: 'bot', content: 'Here are your current selections:' }]);

            // Display each podium
            parsedMessage.podiums.forEach(podium => {
              setMessages((prev) => [...prev, {
                sender: 'bot',
                content: `Podium ${podium.podium}: ${podium.quantity} x ${podium.item_name} @ $${podium.item_price.toFixed(2)} each (Total: $${podium.total_price.toFixed(2)})`
              }]);
            });

            // Handle proposed_solution flag
            if (parsedMessage.proposed_solution) {
              setPendingProposedSolution({
                podiums: parsedMessage.podiums,
                overall_total: parsedMessage.overall_total
              });
              setIsProposedSolutionPending(true);
              setHasAcceptedSolution(false);
              setMessages(prev => [...prev, { sender: 'bot', content: 'I have a proposed solution for you. Please review and accept or modify it.' }]);
            } else {
              // If not a proposed solution, check for other_info
              if (parsedMessage.other_info) {
                setAlertMessage(parsedMessage.other_info);
              }
              // Allow user to submit regardless of the proposed_solution flag
              setHasAcceptedSolution(true);
            }
          } else if (parsedMessage.other_info) {
            // Handle messages that only contain other_info
            setMessages((prev) => [...prev, { sender: 'bot', content: parsedMessage.other_info }]);
          } else {
            // Handle other types of messages
            setMessages((prev) => [...prev, { sender: 'bot', content: message.content }]);
          }
        } catch (e) {
          // If parsing fails, treat as regular message
          console.error('Failed to parse message content as JSON:', e);
          setMessages((prev) => [...prev, { sender: 'bot', content: message.content }]);
        }
      } else {
        console.error('Received malformed message:', message);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      if (reason !== 'io client disconnect') {
        setError('Disconnected from chat server. Attempting to reconnect...');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, setItems, setTotalPrice, timeUp, setHasAcceptedSolution]);

  const sendMessage = () => {
    if (input.trim() === '') return;
    setMessages((prev) => [...prev, { sender: 'user', content: input }]);
    socketRef.current.emit('message', { content: input });
    setInput('');
  };

  // Functions to handle Accept and Modify actions
  const acceptSolution = () => {
    if (pendingProposedSolution) {
      setHasAcceptedSolution(true);
      setIsProposedSolutionPending(false);
      setPendingProposedSolution(null);
      setAlertMessage('');
      setMessages(prev => [...prev, { sender: 'system', content: 'Proposed solution accepted. You can now submit your selections.' }]);
    }
  };

  const modifySolution = () => {
    setIsProposedSolutionPending(false);
    setPendingProposedSolution(null);
    setHasAcceptedSolution(false);
    setAlertMessage('');
    setMessages(prev => [...prev, { sender: 'system', content: 'Please modify your selections by interacting with the bot.' }]);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Chat with the Bot
      </Typography>

      {/* Added Instructions */}
      <Box
        sx={{
          mb: 2,
          userSelect: 'none', // Prevents text selection
          WebkitUserSelect: 'none', // Safari
          MozUserSelect: 'none', // Firefox
          msUserSelect: 'none', // IE10+
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Game Rules:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <Typography variant="body1">•</Typography>
            </ListItemIcon>
            <ListItemText primary="5 podiums" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Typography variant="body1">•</Typography>
            </ListItemIcon>
            <ListItemText primary="1 unique item per podium" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Typography variant="body1">•</Typography>
            </ListItemIcon>
            <ListItemText primary="Unlimited of that item per podium" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Typography variant="body1">•</Typography>
            </ListItemIcon>
            <ListItemText primary="Total of all items must be under or equal to $100" />
          </ListItem>
        </List>
        <Typography variant="body2" color="text.secondary">
          Use prompting to instruct the LLM how to accomplish this task using grocery store inventory from Elasticsearch.
        </Typography>
      </Box>
      {/* End of Added Instructions */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {alertMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: 2, height: '300px', overflowY: 'scroll' }}>
        <List>
          {messages.map((msg, idx) => (
            <ListItem
              key={idx}
              sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    align={msg.sender === 'user' ? 'right' : 'left'}
                  >
                    <strong>{msg.sender === 'user' ? 'You' : msg.sender === 'bot' ? 'Bot' : 'System'}:</strong> {msg.content}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      {!timeUp && (
        <Box sx={{ mt: 2, display: 'flex' }}>
          <TextField
            label="Type your message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            fullWidth
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button variant="contained" color="primary" onClick={sendMessage} sx={{ ml: 2 }}>
            Send
          </Button>
        </Box>
      )}

      {/* Proposed Solution Modal */}
      <Modal
        open={isProposedSolutionPending}
        onClose={() => {}}
        aria-labelledby="proposed-solution-modal"
        aria-describedby="proposed-solution-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="proposed-solution-modal" variant="h6" component="h2" gutterBottom>
            Proposed Solution
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflowY: 'auto' }}>
            {pendingProposedSolution && pendingProposedSolution.podiums.map((podium, idx) => (
              <Typography key={idx} variant="body1" gutterBottom>
                <strong>Podium {podium.podium}:</strong> {podium.quantity} x {podium.item_name} @ ${podium.item_price.toFixed(2)} each (Total: ${podium.total_price.toFixed(2)})
              </Typography>
            ))}
            <Typography variant="h6" sx={{ mt: 2 }}>
              Overall Total: ${pendingProposedSolution ? pendingProposedSolution.overall_total.toFixed(2) : '0.00'}
            </Typography>
          </Paper>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={acceptSolution}>
              Accept
            </Button>
            <Button variant="outlined" color="secondary" onClick={modifySolution}>
              Modify
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

ChatInterface.propTypes = {
  sessionId: PropTypes.string,
  items: PropTypes.array.isRequired,
  setItems: PropTypes.func.isRequired,
  setTotalPrice: PropTypes.func.isRequired,
  timeUp: PropTypes.bool.isRequired,
  setHasAcceptedSolution: PropTypes.func.isRequired,
};

export default ChatInterface;
