// src/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { registerOTel } from './otel';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './styles.css';


registerOTel();

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Adjust this to your preferred primary color
    },
    secondary: {
      main: '#dc004e', // Adjust this to your preferred secondary color
    },
  },
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>,
  document.getElementById('root')
);
