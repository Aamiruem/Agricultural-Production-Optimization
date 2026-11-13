import { Component } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";

/** Catches rendering errors in a page so the rest of the app keeps working. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Alert variant="danger">
        <Alert.Heading className="h5">Something went wrong on this page.</Alert.Heading>
        <p className="small mb-2">{this.state.error.message}</p>
        <Button size="sm" variant="outline-danger" onClick={() => this.setState({ error: null })}>
          Try again
        </Button>
      </Alert>
    );
  }
}
