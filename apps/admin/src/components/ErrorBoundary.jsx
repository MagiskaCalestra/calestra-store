// D:\WebProjects\Calestra\apps\admin\src\components\ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, errorMsg: String(err?.message || err || "Unknown error") };
  }

  componentDidCatch(err, info) {
    console.error("ADMIN UI error:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Oj! Admin UI kraschade.</h2>
          <p>Uppdatera sidan. Om felet kvarstår: backa senaste ändring.</p>
          <p style={{ opacity: 0.75, fontSize: 12, marginTop: 12 }}>
            {this.state.errorMsg}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
