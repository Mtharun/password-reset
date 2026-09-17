const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 15;

// Hash a raw token the same way every time, so we can compare it against
// what's stored in the DB without ever storing the raw token itself.
function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// ------------------------------------------------------------------
// Helper endpoints (not strictly part of the "password reset flow"
// requirement, but included so the flow can actually be tested end to
// end: you need a user with a known password to log in with before and
// after resetting it).
// ------------------------------------------------------------------

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "A user with this email already exists" });
    }

    const user = await User.create({ name, email, password });
    return res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------------------------------------------------------
// The actual password-reset flow requested by the task.
// ------------------------------------------------------------------

// STEP 1: user submits their email on the "forgot password" page.
// POST /api/auth/forgot-password
// body: { email }
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // "If the user is not present send an error message."
      return res.status(404).json({ success: false, message: "No account found with this email address" });
    }

    // Generate a random string (raw token) — this is what goes in the email link.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the HASH of the token in the DB, plus its expiry time.
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    // validateModifiedOnly: only the fields we actually changed need to pass
    // validation here — an older document that predates a schema change (or
    // was inserted by hand) shouldn't block an unrelated field update.
    await user.save({ validateModifiedOnly: true });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the link below to choose a new password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in ${RESET_TOKEN_EXPIRY_MINUTES} minutes. If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Roll back the token if the email genuinely couldn't be sent, so a
      // broken mail config doesn't leave a dangling, unusable token.
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save({ validateModifiedOnly: true });
      console.error("Failed to send reset email:", emailError.message);
      return res.status(500).json({ success: false, message: "Could not send reset email. Please try again later." });
    }

    return res.status(200).json({
      success: true,
      message: "A password reset link has been sent to your email address",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// STEP 2 (optional but useful): when the reset page first loads, check
// whether the token in the URL is still valid BEFORE the user types a new
// password, so the UI can immediately show "This link has expired" instead
// of only failing on submit.
// GET /api/auth/reset-password/:token
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, valid: false, message: "This reset link is invalid or has expired" });
    }

    return res.status(200).json({ success: true, valid: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// STEP 3: user submits the new password from the reset-password form.
// POST /api/auth/reset-password/:token
// body: { password }
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    const hashedToken = hashToken(token);

    // "Retrieve the random string and pass it to DB. Check if the random
    // string matches" — and also that it hasn't expired.
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      // "If the string does not match send an error message" (this also
      // covers the expired-link case, per the expiry requirement).
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired" });
    }

    // "Store the new password and clear the random string in the DB."
    user.password = password; // hashed automatically by the pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save({ validateModifiedOnly: true });

    return res.status(200).json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
