import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import BlisterDivider from '../../components/BlisterDivider';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);
    try {
      if (isSignUp) {
        await register({
          email,
          password,
          name,
          phone,
          role: 'admin',
        });
      } else {
        await login(email, password);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-3 flex items-center justify-start">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-primary transition-colors py-1 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Home</span>
        </Link>
      </div>

      <Card variant="elevated" rounded="xl" className="w-full max-w-md p-8 relative overflow-hidden shadow-level-2 border border-outline-variant/30">
        <BlisterDivider count={12} className="py-2 opacity-20" />

        <div className="mt-2 mb-6 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center mb-3 shadow-sm">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-primary mb-1">Regulator Admin Portal</h1>
          <p className="font-body text-xs text-on-surface-variant">
            {isSignUp ? 'Register official regulator credentials' : 'National Supply Chain Integrity Access'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2.5 text-xs font-body leading-relaxed flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-error shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {isSignUp && (
            <>
              <FormInput
                label="Regulator Full Name"
                type="text"
                placeholder="Inspector Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<span className="material-symbols-outlined">badge</span>}
                required
              />
              <FormInput
                label="Official Phone"
                type="tel"
                placeholder="+91-9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<span className="material-symbols-outlined">phone</span>}
              />
            </>
          )}

          <FormInput
            label="Official Government / Regulator Email"
            type="email"
            placeholder="admin@medtrace.in"
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
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="submit"
            disabled={isAuthenticating}
            icon={<span className="material-symbols-outlined text-sm">shield_person</span>}
            iconPosition="right"
            className="mt-2"
          >
            {isAuthenticating
              ? 'Authenticating...'
              : isSignUp
              ? 'Register Regulator Credentials'
              : 'Authenticate Admin Access'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="font-body text-xs text-primary font-bold hover:underline"
          >
            {isSignUp ? 'Already registered? Sign In' : 'New regulator? Register admin account'}
          </button>

          <Link to="/pharmacist/login" className="font-body text-xs text-outline hover:text-primary transition-colors">
            Switch to <strong>Pharmacist Portal Login →</strong>
          </Link>
        </div>
      </Card>
    </div>
  );
}
