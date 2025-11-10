import React from "react";

/**
 * Fångar render-fel så att sidan inte kraschar även om en komponent/feature saknas.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(error) {
    return { err: error };
  }
  componentDidCatch(error, info) {
    // Här kan du logga till analytics/sentry senare
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16 }}>
          <div className="card">
            <div className="card-pad">
              <div className="h2">Något gick fel här</div>
              <p className="small" style={{ marginTop: 6, opacity: .85 }}>
                Funktionen är inte tillgänglig just nu. Du kan fortsätta använda resten av sidan.
              </p>
              <a className="btn btn-acc" href="/">Till startsidan</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
