import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, changePassword } from '../api';
import { Car, Lock, Eye, EyeOff } from 'lucide-react';

function PasswordInput({ value, onChange, placeholder, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 40 }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: 'var(--text-muted)',
        }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Change password state
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      if (data.mustChangePassword) {
        setCurrentPwd(password);
        setMustChange(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPwd, newPassword);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mustChange) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleChangePassword}>
          <div className="login-logo">
            <Lock size={28} />
          </div>
          <p className="login-subtitle" style={{ fontWeight: 600, fontSize: 18 }}>Set New Password</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
            You must change your password before continuing.
          </p>

          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">New Password</label>
            <PasswordInput
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <PasswordInput
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <Car size={28} />
          YallaRent
        </div>
        <p className="login-subtitle">Admin Portal</p>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <PasswordInput
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
