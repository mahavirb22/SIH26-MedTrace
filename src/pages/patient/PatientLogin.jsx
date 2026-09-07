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
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await register({ email, password, name, phone, role: 'patient' });
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

      <main className="flex-1 w-full max-w-content mx-auto pt-24 pb-16 px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mb-3 flex items-center justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-primary transition-colors py-1 px-3 rounded-lg bg-surface-container-low border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Home</span>
          </Link>
        </div>

        <Card variant="elevated" rounded="xl" className="p-8 sm:p-10 w-full max-w-md shadow-level-2 border border-outline-variant/20">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <img src={logoImg} alt="MedTrace Logo" className="h-10 w-auto object-contain mb-1" />
              <h2 className="font-headline text-2xl font-bold text-primary">
                {isSignUp ? 'Patient Account Registration' : 'Patient Portal Sign In'}
              </h2>
              <p className="font-body text-xs text-on-surface-variant max-w-xs">
                {isSignUp
                  ? 'Register to track verified prescriptions and your personal medicine history.'
                  : 'Access your verified prescription cabinet and history.'}
              </p>
            </div>

            {error && (
              <div className="bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2.5 text-xs font-body leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-error shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isSignUp && (
                <>
                  <FormInput
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <FormInput
                    label="Mobile Number (Optional)"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </>
              )}

              <FormInput
                label="Email Address"
                type="email"
                placeholder="name@example.com"
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
                {loading ? 'Processing...' : isSignUp ? 'Create Patient Account' : 'Sign In'}
              </Button>
            </form>

            <div className="relative flex items-center justify-center border-t border-outline-variant/20 pt-4">
              <span className="bg-surface-container-lowest px-3 text-xs text-outline font-label-caps">OR</span>
            </div>

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="font-body text-xs text-center text-primary font-bold hover:underline"
            >
              {isSignUp ? 'Already have a patient account? Sign In' : "New patient? Create an account"}
            </button>

            <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <Link to="/pharmacist/login" className="text-outline hover:text-primary transition-colors">
                Pharmacist Portal →
              </Link>
              <Link to="/admin/login" className="text-outline hover:text-primary transition-colors font-semibold">
                Regulator Admin Portal →
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
