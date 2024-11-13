// src/components/SignUpForm.js

import React, { useState } from "react";
import axios from "axios";
import {
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiButton,
  EuiPanel,
  EuiText,
  EuiCallOut,
  EuiSpacer,
  EuiLoadingSpinner,
} from "@elastic/eui";
import { ReactComponent as LeftSvg } from "../images/left-svg.svg";
import { ReactComponent as RightSvg } from "../images/right-svg.svg";
import "./SignUpForm.css";

function SignUpForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [token, setToken] = useState(""); // New state for the token
  const [error, setError] = useState(""); // State to hold error messages
  const [loading, setLoading] = useState(false); // State to manage loading

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message
    setLoading(true); // Start loading
    try {
      // Register the user
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/users/register`,
        {
          username,
          email,
          company,
          token, // Include the token in the registration request
        }
      );
      onLogin(response.data);
    } catch (error) {
      console.error(error);
      if (error.response) {
        // Display specific error message from backend
        setError(error.response.data.detail || "Registration failed");
      } else {
        // Generic error message
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <>
      {/* Left Bottom SVG */}
      <LeftSvg className="svg-left" />
      {/* Right Bottom SVG */}
      <RightSvg className="svg-right" />
      <EuiPanel
        paddingSize="l"
        style={{ maxWidth: "600px", margin: "auto", marginTop: "40px" }}
      >
        <EuiText>
          <h2>The Price is Bot</h2>
        </EuiText>
        <EuiSpacer size="m" />

        {error && (
          <EuiCallOut title="Error" color="danger" iconType="alert">
            {error}
          </EuiCallOut>
        )}

        <EuiSpacer size="m" />

        <EuiForm component="form" onSubmit={handleSubmit}>
          <EuiFormRow
            label="Username (to be displayed on leaderboard)"
            fullWidth
          >
            <EuiFieldText
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </EuiFormRow>

          <EuiFormRow label="Email" fullWidth>
            <EuiFieldText
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </EuiFormRow>

          <EuiFormRow label="Company (optional)" fullWidth>
            <EuiFieldText
              fullWidth
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </EuiFormRow>

          <EuiFormRow
            label="Access Token"
            helpText="Enter the access token provided to you"
            fullWidth
          >
            <EuiFieldText
              fullWidth
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          <div style={{ position: "relative" }}>
            <EuiButton type="submit" fill isDisabled={loading} fullWidth>
              Start
            </EuiButton>

            {loading && (
              <EuiLoadingSpinner
                size="m"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </div>
        </EuiForm>
      </EuiPanel>
    </>
  );
}

export default SignUpForm;
