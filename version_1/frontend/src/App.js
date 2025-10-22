// frontend/src/App.js

import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainGame from "./components/MainGame";
import AdminPanel from "./components/AdminPanel";
import axios from "axios";
import { EuiProvider, EuiPageTemplate } from "@elastic/eui";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { BackgroundProvider, useBackground } from "./contexts/BackgroundContext";
import "./App.css";

function AppContent() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const { showBackground } = useBackground();

  const handleLogin = (userData) => {
    console.log("handleLogin called with:", userData); // Debugging
    if (userData) {
      // If userData is provided, set user and sessionId
      setUser({
        username: userData.username,
        // email and company are no longer provided
      });
      setSessionId(userData.access_token); // Use access_token as before
    } else {
      // If userData is null, reset user and sessionId
      setUser(null);
      setSessionId(null);
    }
    // Reset other states regardless of userData
    setTimeUp(false); // Reset timeUp on new login or reset
    setTotalPrice(0); // Reset totalPrice on new login or reset
    setItems([]); // Reset items on new login or reset
  };

  const handleTimeUp = (elapsedTime) => {
    console.log("Timer expired. Elapsed Time:", elapsedTime);
    setTimeUp(true);
    alert("Time is up!");
  };

  const handleSubmit = async (gameResult) => {
    if (!user) {
      throw new Error("User not logged in");
    }
    // Submit game result to backend
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/game/submit`,
        gameResult,
        {
          headers: {
            Authorization: `Bearer ${sessionId}`, // Use Authorization header
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <Router>
      <EuiPageTemplate css={{
        backgroundColor: '#101c3f'
      }} className={showBackground ? "page-decorate-background" : ""}>
        <Navbar />
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
                handleTimeUp={handleTimeUp}
                handleSubmit={handleSubmit} // Pass the handleSubmit function
              />
            }
          />
        </Routes>
      </EuiPageTemplate>
    </Router>
  );
}

function App() {
  return (
    <EuiProvider colorMode="dark">
      <BackgroundProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </BackgroundProvider>
    </EuiProvider>
  );
}

export default App;
