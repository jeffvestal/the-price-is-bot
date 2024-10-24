// src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainGame from './components/MainGame';
import AdminPanel from './components/AdminPanel';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';

function App() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0); // Ensure this is a number
  const [timeTaken, setTimeTaken] = useState(0);
  const [timeUp, setTimeUp] = useState(false); // Initially false

  const handleLogin = (userData) => {
    setUser({
      username: userData.username,
      email: userData.email,
      company: userData.company,
    });
    setSessionId(userData.token);
    setTimeUp(false); // Reset timeUp on new login
    setTotalPrice(0); // Reset totalPrice on new login
    setItems([]); // Reset items on new login
  };

  const handleTimeUp = (elapsedTime) => {
    console.log("Timer expired. Elapsed Time:", elapsedTime);
    setTimeUp(true);
    setTimeTaken(elapsedTime);
    alert('Time is up!');
  };

  const handleSubmit = async (gameResult) => {
    if (!user) {
      throw new Error('User not logged in');
    }
    // Submit game result to backend
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/game/submit`,
        gameResult,
        {
          headers: {
            'Authorization': `Bearer ${sessionId}`, // Use Authorization header
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2', // Customize as needed
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div>
          <Routes>
            <Route path="/admin" element={<AdminPanel />} />
            <Route
              path="/"
              element={
                <MainGame
                  user={user}
                  handleLogin={handleLogin}
                  sessionId={sessionId}
                  items={items}
                  setItems={setItems}
                  setTotalPrice={setTotalPrice}
                  totalPrice={totalPrice}
                  timeUp={timeUp}
                  timeTaken={timeTaken}
                  handleTimeUp={handleTimeUp}
                  handleSubmit={handleSubmit} // Pass the handleSubmit function
                />
              }
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
