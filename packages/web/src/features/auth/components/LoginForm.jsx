import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const { email, password } = formData;
      await authService.login(email, password);

      // Redirect to dashboard on successful login
      navigate("/dashboard");
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          if (err.field) {
            fieldErrors[err.field] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message || "Login failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Welcome Back</h2>

      {errors.general && <div className="error-message">{errors.general}</div>}

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
        />
        {errors.password && (
          <span className="field-error">{errors.password}</span>
        )}
      </div>

      <div className="form-footer-links">
        <a href="/forgot-password">Forgot password?</a>
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? "Logging in..." : "Login"}
      </button>

      <p className="form-footer">
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </form>
  );
}
