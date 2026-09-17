import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { validateResetToken, resetPassword } from "../api/authApi";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  // Check the token's validity as soon as the page loads, so the user
  // immediately sees "expired/invalid link" instead of only on submit.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await validateResetToken(token);
        if (!cancelled) setLinkValid(true);
      } catch {
        if (!cancelled) {
          setLinkValid(false);
          // The task explicitly requires an alert when the link has expired.
          window.alert("This password reset link has expired or is invalid. Please request a new one.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      setStatus({ loading: false, error: "Password must be at least 6 characters long", success: "" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus({ loading: false, error: "Passwords do not match", success: "" });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    try {
      await resetPassword(token, form.password);
      setStatus({ loading: false, error: "", success: "Your password has been reset successfully!" });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      // Covers the case where the link expired WHILE the user was typing.
      window.alert(err.message);
      setStatus({ loading: false, error: err.message, success: "" });
      setLinkValid(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon-badge">
          <i className="bi bi-shield-check" />
        </div>
        <h1 className="auth-title">Reset Password</h1>

        {checking && <p className="auth-subtitle">Checking your reset link...</p>}

        {!checking && !linkValid && (
          <>
            <div className="alert alert-danger py-2">
              <i className="bi bi-exclamation-triangle me-1" />
              This reset link is invalid or has expired.
            </div>
            <Link to="/forgot-password" className="btn btn-brand w-100 py-2">
              Request a New Link
            </Link>
          </>
        )}

        {!checking && linkValid && !status.success && (
          <>
            <p className="auth-subtitle">Choose a new password for your account</p>
            {status.error && <div className="alert alert-danger py-2">{status.error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock" /></span>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Re-enter new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-brand w-100 py-2" disabled={status.loading}>
                {status.loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {status.success && (
          <div className="alert alert-success py-2">
            <i className="bi bi-check-circle me-1" />
            {status.success}
          </div>
        )}

        <p className="auth-footer-link">
          <Link to="/login"><i className="bi bi-arrow-left me-1" />Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
