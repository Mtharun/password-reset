import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    try {
      await registerUser(form.name, form.email, form.password);
      setStatus({ loading: false, error: "", success: "Account created! Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: "" });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon-badge">
          <i className="bi bi-person-plus" />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Sign up to try the password reset flow</p>

        {status.error && <div className="alert alert-danger py-2">{status.error}</div>}
        {status.success && <div className="alert alert-success py-2">{status.success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person" /></span>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope" /></span>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
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

          <button type="submit" className="btn btn-brand w-100 py-2" disabled={status.loading}>
            {status.loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
