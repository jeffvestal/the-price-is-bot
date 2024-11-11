// src/components/AdminPanel.js

import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

function AdminPanel() {
  const [adminToken, setAdminToken] = useState('');
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenCount, setTokenCount] = useState(1);
  const [generatedTokens, setGeneratedTokens] = useState([]);

  // New state variables for deactivation
  const [tokenToDeactivate, setTokenToDeactivate] = useState('');
  const [deactivationMessage, setDeactivationMessage] = useState('');

  // New state variables for listing tokens
  const [tokensList, setTokensList] = useState([]);

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${window.REACT_APP_BACKEND_URL}/admin/settings`, {
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
        `${window.REACT_APP_BACKEND_URL}/admin/settings`,
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

  const generateTokens = async () => {
    try {
      const response = await axios.post(
        `${window.REACT_APP_BACKEND_URL}/admin/generate-tokens`,
        { count: tokenCount },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );
      setGeneratedTokens(response.data.tokens);
      setError('');
    } catch (error) {
      console.error(error);
      setError('Failed to generate tokens');
    }
  };

  // Function to handle token deactivation
  const deactivateToken = async () => {
    try {
      const response = await axios.post(
        `${window.REACT_APP_BACKEND_URL}/admin/deactivate-token`,
        { token: tokenToDeactivate },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );
      setDeactivationMessage(response.data.message);
      setError('');
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 404) {
        setError('Token not found or already deactivated.');
      } else {
        setError('Failed to deactivate token.');
      }
      setDeactivationMessage('');
    }
  };

  // Function to list all tokens
const listTokens = async (status) => {
  try {
    const response = await axios.get(
      `${window.REACT_APP_BACKEND_URL}/admin/tokens`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        params: {
          status: status !== 'all' ? status : undefined,
        },
      }
    );
    setTokensList(response.data);
    setError('');
  } catch (error) {
    console.error(error);
    setError('Failed to retrieve tokens list.');
  }
};


  return (
    <Container maxWidth="md">
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

            {/* Token Generation Section */}
            <Box sx={{ mt: 5 }}>
              <Typography variant="h5" gutterBottom>
                Generate Access Tokens
              </Typography>
              <TextField
                label="Number of Tokens"
                type="number"
                value={tokenCount}
                onChange={(e) => setTokenCount(parseInt(e.target.value, 10))}
                fullWidth
                margin="normal"
              />
              <Button variant="contained" color="primary" onClick={generateTokens} sx={{ mt: 2 }}>
                Generate Tokens
              </Button>
              {generatedTokens.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6">Generated Tokens:</Typography>
                  <List>
                    {generatedTokens.map((token, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={token} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            {/* Token Deactivation Section */}
            <Box sx={{ mt: 5 }}>
              <Typography variant="h5" gutterBottom>
                Deactivate Token
              </Typography>
              <TextField
                label="Token to Deactivate"
                value={tokenToDeactivate}
                onChange={(e) => setTokenToDeactivate(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button variant="contained" color="primary" onClick={deactivateToken} sx={{ mt: 2 }}>
                Deactivate Token
              </Button>
              {deactivationMessage && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {deactivationMessage}
                </Alert>
              )}
            </Box>

          {/* Tokens List Section */}
          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom>
              View Tokens
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" color="primary" onClick={() => listTokens('all')}>
                Show All Tokens
              </Button>
              <Button variant="contained" color="primary" onClick={() => listTokens('active')}>
                Show Active Tokens
              </Button>
              <Button variant="contained" color="primary" onClick={() => listTokens('inactive')}>
                Show Inactive Tokens
              </Button>
            </Box>
            {tokensList.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Token</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tokensList.map((tokenObj, index) => (
                      <TableRow key={index}>
                        <TableCell>{tokenObj.token}</TableCell>
                        <TableCell>{tokenObj.active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell>{new Date(tokenObj.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default AdminPanel;
