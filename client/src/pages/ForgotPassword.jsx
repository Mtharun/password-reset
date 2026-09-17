import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    try {
      const body = await forgotPassword(email);
      setStatus({ loading: false, error: "", success: body.message });
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: "" });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon-badge">
          <i className="bi bi-key" />
        </div>
        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password
        </p>

        {status.error && <div className="alert alert-danger py-2">{status.error}</div>}
        {status.success && (
          <div className="alert alert-success py-2">
            <i className="bi bi-check-circle me-1" />
            {status.success}
          </div>
        )}

        {!status.success && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope" /></span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-brand w-100 py-2" disabled={status.loading}>
              {status.loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-footer-link">
          <Link to="/login"><i className="bi bi-arrow-left me-1" />Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
