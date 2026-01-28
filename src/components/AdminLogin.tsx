import { useState } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLogin = ({ isOpen, onClose }: AdminLoginProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, setShowAdminPanel } = useAdmin();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(password)) {
      setPassword('');
      onClose();
      setShowAdminPanel(true);
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        border: '1px solid var(--border)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              backgroundColor: 'var(--viral-high)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Admin Access
              </h2>
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '4px 0 0 0'
              }}>
                Enter password to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              borderRadius: 8
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: error ? '2px solid var(--viral-high)' : '2px solid transparent',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 8,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p style={{
                fontSize: 13,
                color: 'var(--viral-high)',
                margin: '8px 0 0 0'
              }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Lock size={18} />
            Login
          </button>

          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            margin: '16px 0 0 0'
          }}>
            Default password: <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>viral2025</code>
          </p>
        </form>
      </div>
    </div>
  );
};
