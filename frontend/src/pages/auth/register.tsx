import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isReady } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      void router.replace('/dashboard');
    }
  }, [isAuthenticated, isReady, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ firstName, lastName, email, password, role });
      await router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Create Account">
      <form className="card card-grid" onSubmit={onSubmit}>
        <div className="two-col">
          <label className="field">
            <span>First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              data-testid="firstName"
            />
          </label>

          <label className="field">
            <span>Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              data-testid="lastName"
            />
          </label>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            data-testid="email"
          />
        </label>

        <label className="field">
          <span>Password (min 8 chars)</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={8}
            required
            data-testid="password"
          />
        </label>

        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as 'freelancer' | 'client')}>
            <option value="freelancer">Freelancer</option>
            <option value="client">Client</option>
          </select>
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary-btn" type="submit" disabled={loading} data-testid="register-button">
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AppLayout>
  );
}
