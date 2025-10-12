// SignUpForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  EuiFieldText,
  EuiButton,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiCallOut,
  EuiFormRow,
  EuiLoadingSpinner,
  useCurrentEuiBreakpoint,
} from '@elastic/eui';
import { useBackground } from "../contexts/BackgroundContext";
import './SignUpForm.css';

function SignUpForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const currentBreakpoint = useCurrentEuiBreakpoint();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/users/register`,
        { username }
      );
      onLogin(response.data);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <EuiTitle size="l">
          <h2>The Price is Bot</h2>
        </EuiTitle>
        
        <EuiSpacer size="l" />
        
        <EuiText>
          <p>
          Think you are a master of AI prompts? Put your skills to the test and see how Elasticsearch
            can amplify your results with our powerful Generative AI.
          </p>
        </EuiText>

        <EuiSpacer size="xl" />

        <form onSubmit={handleSubmit}>
          {error && (
            <>
              <EuiCallOut title="Error" color="danger">
                {error}
              </EuiCallOut>
              <EuiSpacer size="m" />
            </>
          )}
          <EuiFormRow
            label="Choose a nickname (ensure you nickname allows us to identify you based on the information you provided in the registration form)"
            fullWidth={['xs', 's'].includes(currentBreakpoint)}
          >
            <EuiFieldText
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth={['xs', 's'].includes(currentBreakpoint)}
            />
          </EuiFormRow>

          <EuiSpacer size="l" />

          <EuiButton
            type="submit"
            fill
            fullWidth={['xs', 's'].includes(currentBreakpoint)}
            isLoading={loading}
          >
            Start the game
          </EuiButton>
        </form>
      </div>
    </div>
  );
}

export default SignUpForm;