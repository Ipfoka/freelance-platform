import { FormEvent, useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function DealsPage() {
  const { apiFetch } = useAuth();

  const [confirmDealId, setConfirmDealId] = useState('');
  const [disputeDealId, setDisputeDealId] = useState('');
  const [disputeTitle, setDisputeTitle] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onConfirmDeal(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const result = await apiFetch<{
        platformFee?: number;
        freelancerAmount?: number;
      }>(`/api/deals/${confirmDealId}/confirm`, {
        method: 'POST',
      });
      if (result.platformFee !== undefined && result.freelancerAmount !== undefined) {
        setMessage(
          `Deal confirmed. Net payout: ${result.freelancerAmount}. Platform fee: ${result.platformFee}.`,
        );
      } else {
        setMessage('Deal confirmed and funds released to freelancer wallet.');
      }
      setConfirmDealId('');
    } catch (err: any) {
      setError(err.message || 'Cannot confirm deal');
    }
  }

  async function onCreateDispute(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await apiFetch(`/api/deals/${disputeDealId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({
          title: disputeTitle,
          description: disputeDescription,
        }),
      });

      setMessage('Dispute created. Admin review required.');
      setDisputeDealId('');
      setDisputeTitle('');
      setDisputeDescription('');
    } catch (err: any) {
      setError(err.message || 'Cannot create dispute');
    }
  }

  return (
    <AppLayout title="Deals" requireAuth>
      <div className="card-grid">
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <section className="card">
          <h2>Confirm completed deal</h2>
          <p className="muted">Use this after Stripe payment succeeds and work is accepted.</p>
          <form className="card-grid" onSubmit={onConfirmDeal}>
            <label className="field">
              <span>Deal ID</span>
              <input
                value={confirmDealId}
                onChange={(e) => setConfirmDealId(e.target.value)}
                required
                data-testid="confirm-work"
              />
            </label>
            <button className="primary-btn" type="submit">
              Confirm deal
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Create dispute</h2>
          <form className="card-grid" onSubmit={onCreateDispute}>
            <label className="field">
              <span>Deal ID</span>
              <input value={disputeDealId} onChange={(e) => setDisputeDealId(e.target.value)} required />
            </label>

            <label className="field">
              <span>Title</span>
              <input value={disputeTitle} onChange={(e) => setDisputeTitle(e.target.value)} required />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                required
              />
            </label>

            <button className="danger-btn" type="submit">
              Open dispute
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
