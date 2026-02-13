import { FormEvent, useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { PayoutRequest, Profile } from '../lib/types';

export default function WalletPage() {
  const { profile, refreshProfile, apiFetch, user } = useAuth();

  const [amount, setAmount] = useState('');
  const [payoutId, setPayoutId] = useState('');
  const [lastPayout, setLastPayout] = useState<PayoutRequest | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  async function requestPayout(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const payout = await apiFetch<PayoutRequest>('/api/payouts', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount) }),
      });

      setLastPayout(payout);
      setAmount('');
      setMessage('Payout request created. Admin has to process it.');
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Cannot create payout');
    }
  }

  async function processPayout(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const payout = await apiFetch<PayoutRequest>(`/api/payouts/${payoutId}/process`, {
        method: 'POST',
      });
      setLastPayout(payout);
      setPayoutId('');
      setMessage('Payout request processed.');
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Cannot process payout');
    }
  }

  return (
    <AppLayout title="Wallet" requireAuth>
      <div className="card-grid">
        <section className="card">
          <h2>Current balance</h2>
          <p>
            <strong>
              {profile?.wallet?.balance?.toFixed(2) || '0.00'} {profile?.wallet?.currency || 'USD'}
            </strong>
          </p>
          <p className="muted">Pending: {profile?.wallet?.pending?.toFixed(2) || '0.00'}</p>
        </section>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <section className="card">
          <h2>Request payout</h2>
          <form className="card-grid" onSubmit={requestPayout}>
            <label className="field">
              <span>Amount</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0.01"
                required
                data-testid="payout-amount"
              />
            </label>
            <button className="primary-btn" type="submit" data-testid="request-payout">
              Request payout
            </button>
          </form>
        </section>

        {user?.role === 'admin' && (
          <section className="card">
            <h2>Admin payout processing</h2>
            <form className="card-grid" onSubmit={processPayout}>
              <label className="field">
                <span>Payout request ID</span>
                <input value={payoutId} onChange={(e) => setPayoutId(e.target.value)} required />
              </label>
              <button className="secondary-btn" type="submit">
                Process payout
              </button>
            </form>
          </section>
        )}

        {lastPayout && (
          <section className="card">
            <h2>Latest payout request</h2>
            <p>
              <strong>ID:</strong> {lastPayout.id}
            </p>
            <p>
              <strong>Amount:</strong> {lastPayout.amount}
            </p>
            <p>
              <strong>Fee:</strong> {lastPayout.fee}
            </p>
            <p>
              <strong>Status:</strong> {lastPayout.status}
            </p>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
