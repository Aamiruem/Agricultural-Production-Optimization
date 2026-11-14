import { Component } from "react";

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
      <div className="alert alert-danger" role="alert">
        <h2 className="alert-heading h5">Something went wrong on this page.</h2>
        <p className="small mb-2">{this.state.error.message}</p>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}
