import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import logoImg from '../../assets/f36fe9f878904277a25160df72df9f1a_verimed_logo.png';

export default function PatientLogin() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await register({ email, password, name, role: 'patient' });
      } else {
        await login(email, password);
      }
      navigate('/patient');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-content mx-auto pt-24 pb-16 px-4 sm:px-8 flex items-center justify-center">
        <Card variant="elevated" rounded="xl" className="p-8 sm:p-12 w-full max-w-md shadow-level-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <img src={logoImg} alt="MedTrace Logo" className="h-10 w-auto object-contain mb-1" />
              <h2 className="font-headline text-2xl font-bold text-primary">
                {isSignUp ? 'Create MedTrace Account' : 'Sign in to MedTrace'}
              </h2>
              <p className="font-body text-xs text-on-surface-variant max-w-xs">
                {isSignUp
                  ? 'Access your personal verified medicine cabinet and transaction history.'
                  : 'Manage your verified prescription ledger and patient credentials.'}
              </p>
            </div>

            {error && (
              <div className="bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2 text-sm font-body">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <FormInput
                  label="Full Name"
                  type="text"
                  placeholder="Aisha Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <FormInput
                label="Email or Mobile Number"
                type="text"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <FormInput
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button variant="primary" size="lg" fullWidth type="submit" className="mt-2" disabled={loading}>
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="relative flex items-center justify-center border-t border-outline-variant/20 pt-4">
              <span className="bg-surface-container-lowest px-3 text-xs text-outline font-label-caps">OR</span>
            </div>

            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="font-body text-xs text-center text-primary font-bold hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
            </button>

            <div className="pt-4 border-t border-outline-variant/20 text-center">
              <Link to="/pharmacist" className="font-body text-xs text-outline hover:text-primary transition-colors">
                Are you a licensed pharmacist? <strong>Portal Login →</strong>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
