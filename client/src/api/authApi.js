// Thin wrapper around fetch for talking to the password-reset backend.
// VITE_API_URL is set at build time (see .env.example) — point it at your
// deployed Render URL for production, or leave it as localhost for dev.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || "Something went wrong. Please try again.");
  }
  return body;
}

export function registerUser(name, email, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function forgotPassword(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function validateResetToken(token) {
  return request(`/api/auth/reset-password/${token}`, { method: "GET" });
}

export function resetPassword(token, password) {
  return request(`/api/auth/reset-password/${token}`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
