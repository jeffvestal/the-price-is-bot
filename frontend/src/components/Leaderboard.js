// frontend/src/components/Leaderboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  EuiText,
  EuiPanel,
  EuiTable,
  EuiTableHeader,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiTableHeaderCell,
  EuiSpacer,
  EuiCallOut,
  EuiLoadingSpinner,
} from "@elastic/eui";

function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error state

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/game/leaderboard`
        );
        setScores(response.data);
        setError("");
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setError("Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  return (
    <EuiPanel paddingSize="l">
      {/* Great Job! Message */}
      <EuiText textAlign="center">
        <h1>Great Job!</h1>
      </EuiText>

      {/* Slightly Smaller Text */}
      <EuiText textAlign="center">
        <p>Keep up the great work! Here's the leaderboard:</p>
      </EuiText>

      <EuiSpacer size="l" />

      {/* Loading State */}
      {loading && (
        <EuiText textAlign="center">
          <p>Loading leaderboard...</p>
          <EuiSpacer size="m" />
          <EuiLoadingSpinner size="xl" />
        </EuiText>
      )}

      {/* Error Message */}
      {error && (
        <EuiCallOut title="Error" color="danger" iconType="alert">
          {error}
        </EuiCallOut>
      )}

      {/* Leaderboard Table */}
      {!loading && !error && (
        <>
          {scores.length > 0 ? (
            <EuiTable aria-label="Leaderboard">
              <EuiTableHeader>
                <EuiTableHeaderCell>Rank</EuiTableHeaderCell>
                <EuiTableHeaderCell>Username</EuiTableHeaderCell>
                <EuiTableHeaderCell>Score</EuiTableHeaderCell>
                <EuiTableHeaderCell>Total Price</EuiTableHeaderCell>
                <EuiTableHeaderCell>Time Taken (s)</EuiTableHeaderCell>
              </EuiTableHeader>
              <EuiTableBody>
                {scores.map((score, idx) => (
                  <EuiTableRow key={idx}>
                    <EuiTableRowCell>{idx + 1}</EuiTableRowCell>
                    <EuiTableRowCell>{score.username}</EuiTableRowCell>
                    <EuiTableRowCell>{score.score}</EuiTableRowCell>
                    <EuiTableRowCell>
                      $
                      {score.total_price
                        ? score.total_price.toFixed(2)
                        : "0.00"}
                    </EuiTableRowCell>
                    <EuiTableRowCell>
                      {score.time_taken !== undefined
                        ? score.time_taken
                        : "N/A"}
                    </EuiTableRowCell>
                  </EuiTableRow>
                ))}
              </EuiTableBody>
            </EuiTable>
          ) : (
            <EuiText textAlign="center">
              <p>No scores available yet.</p>
            </EuiText>
          )}
        </>
      )}
    </EuiPanel>
  );
}

export default Leaderboard;
