import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import BlisterDivider from '../../components/BlisterDivider';

export default function PharmacistLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('pharmacist@medicare.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);
    try {
      await login(email, password);
      navigate('/pharmacist/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" rounded="xl" className="w-full max-w-md p-8 relative overflow-hidden shadow-level-2 border border-outline-variant/30">
        <BlisterDivider count={12} className="py-2 opacity-20" />

        <div className="mt-4 mb-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-3xl">verified_user</span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-primary mb-1">Pharmacist Portal</h1>
          <p className="font-body text-xs text-on-surface-variant">Clinical authentication & POS system login</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2 text-sm font-body">
              {error}
            </div>
          )}
          <FormInput
            label="Email Address"
            type="email"
            placeholder="pharmacist@medicare.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<span className="material-symbols-outlined">mail</span>}
            required
          />

          <div className="flex flex-col gap-1">
            <div className="relative">
              <FormInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<span className="material-symbols-outlined">lock</span>}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-outline hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            <button type="button" className="text-[11px] text-primary hover:underline text-right font-medium mt-1">
              Forgot Store Password?
            </button>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="submit"
            disabled={isAuthenticating}
            icon={<span className="material-symbols-outlined text-sm">arrow_forward</span>}
            iconPosition="right"
          >
            {isAuthenticating ? 'Authenticating...' : 'Authenticate & Access POS'}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-outline-variant/30 pt-4">
          <p className="font-body text-xs text-on-surface-variant flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">security</span>
            <span>256-bit encrypted clinical session</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
