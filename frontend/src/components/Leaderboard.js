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
} from "@elastic/eui";

function Leaderboard() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/game/leaderboard`
        );
        setScores(response.data);
      } catch (error) {
        console.error(error);
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

      {/* Leaderboard Table */}
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
                ${score.total_price ? score.total_price.toFixed(2) : "0.00"}
              </EuiTableRowCell>
              <EuiTableRowCell>
                {score.time_taken !== undefined ? score.time_taken : "N/A"}
              </EuiTableRowCell>
            </EuiTableRow>
          ))}
        </EuiTableBody>
      </EuiTable>
    </EuiPanel>
  );
}

export default Leaderboard;
