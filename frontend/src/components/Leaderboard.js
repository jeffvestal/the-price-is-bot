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

function Leaderboard({heading, subHeading, user}) {
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
    <EuiPanel className="panel-leaderboard">
      {heading && (
        <EuiText textAlign="center">
          <h1>{heading}</h1>
        </EuiText>
      )}

      {subHeading && (
        <EuiText textAlign="center">
          <p>{subHeading}</p>
        </EuiText>
      )}

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
              <EuiTableHeader style={{display: 'table-header-group'}}>
                <EuiTableHeaderCell className="table-header-cell first">
                  <span className="table-header-cell first">Rank</span>
                </EuiTableHeaderCell>
                <EuiTableHeaderCell className="table-header-cell second">
                  <span className="table-header-cell">Username</span>
                </EuiTableHeaderCell>
                <EuiTableHeaderCell className="table-header-cell third">
                  <span className="table-header-cell third">Score</span>
                </EuiTableHeaderCell>
                <EuiTableHeaderCell><span className="table-header-cell">Total Price</span></EuiTableHeaderCell>
                <EuiTableHeaderCell><span className="table-header-cell">Time Taken</span></EuiTableHeaderCell>
              </EuiTableHeader>
              <EuiTableBody className="leaderboard-table-body">
                {scores.map((score, idx) => (
                  <EuiTableRow key={idx} className={user && score.username === user.username ? 'current-user' : ''}>
                    <EuiTableRowCell>{idx + 1}</EuiTableRowCell>
                    <EuiTableRowCell><span className="overflow-ellipsis">{score.username}</span></EuiTableRowCell>
                    <EuiTableRowCell>{score.score}</EuiTableRowCell>
                    <EuiTableRowCell>
                      $
                      {score.total_price
                        ? score.total_price.toFixed(2)
                        : "0.00"}
                    </EuiTableRowCell>
                    <EuiTableRowCell>
                      {score.time_taken !== undefined
                        ? `${score.time_taken}s`
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
