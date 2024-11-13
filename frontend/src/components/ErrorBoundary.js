// src/components/ErrorBoundary.js

import React from 'react';
import { EuiCallOut } from '@elastic/eui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <EuiCallOut title="Something went wrong." color="danger" iconType="alert">
          <p>{this.state.error.toString()}</p>
        </EuiCallOut>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
