import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  Profile,
  ProfileBoostOffer,
  ProfileBoostPurchaseResult,
} from '../lib/types';

export default function DashboardPage() {
  const { profile, refreshProfile, apiFetch, user } = useAuth();

  const [formState, setFormState] = useState({ firstName: '', lastName: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [boostOffer, setBoostOffer] = useState<ProfileBoostOffer | null>(null);
  const [boostLoading, setBoostLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!profile) return;
    setFormState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      bio: profile.profile?.bio || '',
    });
  }, [profile]);

  useEffect(() => {
    if (user?.role !== 'freelancer') return;

    async function loadBoostOffer() {
      try {
        const offer = await apiFetch<ProfileBoostOffer>('/api/users/me/boost-offer');
        setBoostOffer(offer);
      } catch {
        setBoostOffer(null);
      }
    }

    void loadBoostOffer();
  }, [apiFetch, user?.role]);

  const wallet = useMemo(() => profile?.wallet, [profile]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<Profile>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(formState),
      });
      await refreshProfile();
      setSuccess('Profile updated');
    } catch (err: any) {
      setError(err.message || 'Cannot update profile');
    } finally {
      setSaving(false);
    }
  }

  async function onBuyBoost() {
    setBoostLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiFetch<ProfileBoostPurchaseResult>(
        '/api/users/me/boost-profile',
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
      await refreshProfile();
      setSuccess(
        `Profile boosted for ${result.boostDays} days until ${new Date(result.boostedUntil).toLocaleString()}.`,
      );
    } catch (err: any) {
      setError(err.message || 'Cannot purchase profile boost');
    } finally {
      setBoostLoading(false);
    }
  }

  return (
    <AppLayout title="Dashboard" requireAuth>
      <div className="card-grid">
        <section className="card">
          <h2>Quick actions</h2>
          <div className="action-row">
            <Link className="secondary-btn" href="/projects">
              Browse projects
            </Link>
            {user?.role === 'client' && (
              <Link className="primary-btn" href="/projects/new" data-testid="create-project">
                Create project
              </Link>
            )}
            <Link className="secondary-btn" href="/wallet">
              Open wallet
            </Link>
            <Link className="secondary-btn" href="/deals">
              Deal actions
            </Link>
          </div>
        </section>

        <section className="card">
          <h2>Profile</h2>
          <form className="card-grid" onSubmit={onSubmit}>
            <div className="two-col">
              <label className="field">
                <span>First name</span>
                <input
                  value={formState.firstName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </label>

              <label className="field">
                <span>Last name</span>
                <input
                  value={formState.lastName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </label>
            </div>

            <label className="field">
              <span>Bio</span>
              <textarea
                value={formState.bio}
                onChange={(e) => setFormState((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </label>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Wallet snapshot</h2>
          {wallet ? (
            <div className="card-grid">
              <p>
                <strong>Balance:</strong> {wallet.balance.toFixed(2)} {wallet.currency}
              </p>
              <p>
                <strong>Pending:</strong> {wallet.pending.toFixed(2)} {wallet.currency}
              </p>
              <p>
                <strong>Plan:</strong> {profile?.plan}
              </p>
              {profile?.boostedUntil && (
                <p>
                  <strong>Boosted until:</strong>{' '}
                  {new Date(profile.boostedUntil).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="muted">Wallet not found.</p>
          )}
        </section>

        {user?.role === 'freelancer' && (
          <section className="card card-grid">
            <h2>Profile boost</h2>
            <p className="muted">
              Buy a temporary boost to get higher placement in top-executor ranking.
            </p>
            {boostOffer ? (
              <p>
                Price: <strong>{boostOffer.price.toFixed(2)} {boostOffer.currency}</strong> for{' '}
                {boostOffer.days} days.
              </p>
            ) : (
              <p className="muted">Boost offer is currently unavailable.</p>
            )}
            <button
              className="primary-btn"
              type="button"
              disabled={!boostOffer || boostLoading}
              onClick={() => void onBuyBoost()}
            >
              {boostLoading ? 'Processing...' : 'Buy profile boost'}
            </button>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
