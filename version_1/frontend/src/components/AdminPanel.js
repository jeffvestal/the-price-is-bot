// src/components/AdminPanel.js

import React, { useState } from "react";
import axios from "axios";
import {
  EuiFieldPassword,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiButton,
  EuiPanel,
  EuiText,
  EuiCallOut,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
  EuiListGroup,
  EuiListGroupItem,
} from "@elastic/eui";

function AdminPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenCount, setTokenCount] = useState(1);
  const [generatedTokens, setGeneratedTokens] = useState([]);

  // New state variables for deactivation
  const [tokenToDeactivate, setTokenToDeactivate] = useState("");
  const [deactivationMessage, setDeactivationMessage] = useState("");

  // New state variables for listing tokens
  const [tokensList, setTokensList] = useState([]);

  const handleLogin = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/admin/settings`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      setSettings(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Invalid admin token");
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
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      setSuccess("Settings updated successfully");
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to update settings");
      setSuccess("");
    }
  };

  const generateTokens = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/admin/generate-tokens`,
        { count: tokenCount },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      setGeneratedTokens(response.data.tokens);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to generate tokens");
    }
  };

  // Function to handle token deactivation
  const deactivateToken = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/admin/deactivate-token`,
        { token: tokenToDeactivate },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      setDeactivationMessage(response.data.message);
      setError("");
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 404) {
        setError("Token not found or already deactivated.");
      } else {
        setError("Failed to deactivate token.");
      }
      setDeactivationMessage("");
    }
  };

  // Function to list all tokens
  const listTokens = async (status) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/admin/tokens`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          params: {
            status: status !== "all" ? status : undefined,
          },
        }
      );
      setTokensList(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to retrieve tokens list.");
    }
  };

  return (
    <EuiPanel
      style={{
        maxWidth: "800px",
        margin: "auto",
        marginTop: "40px",
        backgroundColor: "#282E40",
      }}
    >
      {!settings ? (
        <div>
          <EuiText>
            <h2>Admin Login</h2>
          </EuiText>
          <EuiSpacer size="m" />

          {error && (
            <EuiCallOut title="Error" color="danger">
              {error}
            </EuiCallOut>
          )}

          <EuiSpacer size="m" />

          <EuiForm component="form">
            <EuiFormRow label="Admin Token">
              <EuiFieldPassword
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                fullWidth
              />
            </EuiFormRow>
            <EuiSpacer size="m" />
            <EuiButton onClick={handleLogin} fill color="primary" fullWidth>
              Login
            </EuiButton>
          </EuiForm>
        </div>
      ) : (
        <div>
          <EuiText>
            <h2>Game Settings</h2>
          </EuiText>
          <EuiSpacer size="m" />

          {error && (
            <EuiCallOut title="Error" color="danger">
              {error}
            </EuiCallOut>
          )}
          {success && (
            <EuiCallOut title="Success" color="success">
              {success}
            </EuiCallOut>
          )}

          <EuiSpacer size="m" />

          <EuiForm component="form">
            <EuiFormRow label="Target Price">
              <EuiFieldText
                value={settings?.target_price}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    target_price: parseFloat(e.target.value),
                  })
                }
                fullWidth
              />
            </EuiFormRow>
            <EuiFormRow label="Time Limit (seconds)">
              <EuiFieldText
                value={settings?.time_limit}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    time_limit: parseInt(e.target.value, 10),
                  })
                }
                fullWidth
              />
            </EuiFormRow>

            <EuiSpacer size="m" />

            <EuiButton onClick={updateSettings} fill color="primary" fullWidth>
              Update Settings
            </EuiButton>
          </EuiForm>

          <EuiSpacer size="l" />

          <EuiText>
            <h3>Generate Access Tokens</h3>
          </EuiText>
          <EuiFormRow label="Number of Tokens">
            <EuiFieldText
              value={tokenCount}
              onChange={(e) => setTokenCount(parseInt(e.target.value, 10))}
              fullWidth
            />
          </EuiFormRow>
          <EuiButton onClick={generateTokens} fill color="primary" fullWidth>
            Generate Tokens
          </EuiButton>

          {generatedTokens.length > 0 && (
            <EuiPanel style={{ marginTop: "20px" }}>
              <EuiText>
                <h4>Generated Tokens:</h4>
              </EuiText>
              <EuiListGroup flush>
                {generatedTokens.map((token, index) => (
                  <EuiListGroupItem key={index} label={token} />
                ))}
              </EuiListGroup>
            </EuiPanel>
          )}

          <EuiSpacer size="l" />

          <EuiText>
            <h3>Deactivate Token</h3>
          </EuiText>
          <EuiFormRow label="Token to Deactivate">
            <EuiFieldText
              value={tokenToDeactivate}
              onChange={(e) => setTokenToDeactivate(e.target.value)}
              fullWidth
            />
          </EuiFormRow>
          <EuiButton onClick={deactivateToken} fill color="primary" fullWidth>
            Deactivate Token
          </EuiButton>

          {deactivationMessage && (
            <EuiCallOut
              title="Success"
              color="success"
              style={{ marginTop: "20px" }}
            >
              {deactivationMessage}
            </EuiCallOut>
          )}

          <EuiSpacer size="l" />

          <EuiText>
            <h3>View Tokens</h3>
          </EuiText>
          <EuiFlexGroup gutterSize="m">
            <EuiFlexItem>
              <EuiButton onClick={() => listTokens("all")} fill fullWidth>
                Show All Tokens
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton onClick={() => listTokens("active")} fill fullWidth>
                Show Active Tokens
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiButton onClick={() => listTokens("inactive")} fill fullWidth>
                Show Inactive Tokens
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>

          {tokensList.length > 0 && (
            <EuiTable style={{ marginTop: "20px" }}>
              <EuiTableHeader>
                <EuiTableHeaderCell>Token</EuiTableHeaderCell>
                <EuiTableHeaderCell>Status</EuiTableHeaderCell>
                <EuiTableHeaderCell>Created At</EuiTableHeaderCell>
              </EuiTableHeader>
              <EuiTableBody>
                {tokensList.map((tokenObj, index) => (
                  <EuiTableRow key={index}>
                    <EuiTableRowCell>{tokenObj.token}</EuiTableRowCell>
                    <EuiTableRowCell>
                      {tokenObj.active ? "Active" : "Inactive"}
                    </EuiTableRowCell>
                    <EuiTableRowCell>
                      {new Date(tokenObj.created_at).toLocaleString()}
                    </EuiTableRowCell>
                  </EuiTableRow>
                ))}
              </EuiTableBody>
            </EuiTable>
          )}
        </div>
      )}
    </EuiPanel>
  );
}

export default AdminPanel;
