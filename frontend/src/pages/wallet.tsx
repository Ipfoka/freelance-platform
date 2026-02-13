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
      setMessage('Заявка на вывод создана. Ожидает обработки администратором.');
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать заявку на вывод');
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
      setMessage('Заявка на вывод обработана.');
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Не удалось обработать выплату');
    }
  }

  return (
    <AppLayout title="Кошелек" requireAuth>
      <div className="card-grid">
        <section className="card">
          <h2>Текущий баланс</h2>
          <p>
            <strong>
              {profile?.wallet?.balance?.toFixed(2) || '0.00'} {profile?.wallet?.currency || 'USD'}
            </strong>
          </p>
          <p className="muted">В ожидании: {profile?.wallet?.pending?.toFixed(2) || '0.00'}</p>
        </section>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <section className="card">
          <h2>Вывод средств</h2>
          <form className="card-grid" onSubmit={requestPayout}>
            <label className="field">
              <span>Сумма</span>
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
              Отправить заявку
            </button>
          </form>
        </section>

        {user?.role === 'admin' && (
          <section className="card">
            <h2>Обработка выплат (админ)</h2>
            <form className="card-grid" onSubmit={processPayout}>
              <label className="field">
                <span>ID заявки на вывод</span>
                <input value={payoutId} onChange={(e) => setPayoutId(e.target.value)} required />
              </label>
              <button className="secondary-btn" type="submit">
                Обработать выплату
              </button>
            </form>
          </section>
        )}

        {lastPayout && (
          <section className="card">
            <h2>Последняя заявка на вывод</h2>
            <p>
              <strong>ID:</strong> {lastPayout.id}
            </p>
            <p>
              <strong>Сумма:</strong> {lastPayout.amount}
            </p>
            <p>
              <strong>Комиссия:</strong> {lastPayout.fee}
            </p>
            <p>
              <strong>Статус:</strong> {lastPayout.status}
            </p>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
