import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../api/authApi";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    try {
      const body = await loginUser(form.email, form.password);
      setStatus({ loading: false, error: "", success: `Welcome back, ${body.data.name}!` });
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: "" });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon-badge">
          <i className="bi bi-shield-lock" />
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {status.error && <div className="alert alert-danger py-2">{status.error}</div>}
        {status.success && <div className="alert alert-success py-2">{status.success}</div>}

        <form onSubmit={handleSubmit} noValidate>
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

          <div className="mb-2">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock" /></span>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="text-end mb-3">
            <Link to="/forgot-password" className="small text-decoration-none">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-brand w-100 py-2" disabled={status.loading}>
            {status.loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
