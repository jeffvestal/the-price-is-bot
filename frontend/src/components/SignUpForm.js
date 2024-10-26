// src/components/SignUpForm.js

import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box, Alert, CircularProgress } from '@mui/material';

function SignUpForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  // const [password, setPassword] = useState(''); // Password field removed as per your instructions
  const [error, setError] = useState(''); // State to hold error messages
  const [loading, setLoading] = useState(false); // State to manage loading

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message
    setLoading(true); // Start loading
    try {
      // Register the user
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/users/register`, {
        username,
        email,
        company, // Exclude password
      });
      onLogin(response.data);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 400) {
        // Display specific error message from backend
        setError(error.response.data.detail || 'Registration failed');
      } else {
        // Generic error message
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          The Price is Bot
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username (to be displayed on leaderboard)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            fullWidth
            margin="normal"
          />
          {/* Password Field Removed */}
          {/*
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          */}
          <Box sx={{ position: 'relative', mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              Start
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  color: 'primary.main',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </form>
      </Box>
    </Container>
  );
}

export default SignUpForm;
