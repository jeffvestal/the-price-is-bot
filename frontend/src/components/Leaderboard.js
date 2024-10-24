import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function Leaderboard() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/game/leaderboard`);
        setScores(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchScores();
  }, []);

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Leaderboard
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="leaderboard">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Total Price</TableCell>
              <TableCell>Time Taken (s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scores.map((score, idx) => (
              <TableRow key={idx}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{score.username}</TableCell>
                <TableCell>{score.score}</TableCell>
                <TableCell>${score.total_price ? score.total_price.toFixed(2) : '0.00'}</TableCell>
                <TableCell>{score.time_taken !== undefined ? score.time_taken : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Leaderboard;
