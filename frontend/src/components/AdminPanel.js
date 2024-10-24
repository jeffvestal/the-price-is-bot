// src/components/AdminPanel.js

import React, { useState } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';

function AdminPanel() {
  const [adminToken, setAdminToken] = useState('');
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      setSettings(response.data);
      setError('');
    } catch (error) {
      console.error(error);
      setError('Invalid admin token');
      setSettings(null);
    }
  };

  const updateSettings = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/admin/settings`,
        settings,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );
      setSuccess('Settings updated successfully');
      setError('');
    } catch (error) {
      console.error(error);
      setError('Failed to update settings');
      setSuccess('');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 5 }}>
        {!settings ? (
          <Box>
            <Typography variant="h4" gutterBottom>
              Admin Login
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Admin Token"
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="contained" color="primary" onClick={handleLogin} sx={{ mt: 2 }}>
              Login
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h4" gutterBottom>
              Game Settings
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <TextField
              label="Target Price"
              type="number"
              value={settings.target_price}
              onChange={(e) =>
                setSettings({ ...settings, target_price: parseFloat(e.target.value) })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Time Limit (seconds)"
              type="number"
              value={settings.time_limit}
              onChange={(e) =>
                setSettings({ ...settings, time_limit: parseInt(e.target.value, 10) })
              }
              fullWidth
              margin="normal"
            />
            <Button variant="contained" color="primary" onClick={updateSettings} sx={{ mt: 2 }}>
              Update Settings
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default AdminPanel;
