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
          `Сделка подтверждена. Исполнителю: ${result.freelancerAmount}. Комиссия платформы: ${result.platformFee}.`,
        );
      } else {
        setMessage('Сделка подтверждена, средства отправлены в кошелек исполнителя.');
      }
      setConfirmDealId('');
    } catch (err: any) {
      setError(err.message || 'Не удалось подтвердить сделку');
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

      setMessage('Спор создан. Требуется проверка администратора.');
      setDisputeDealId('');
      setDisputeTitle('');
      setDisputeDescription('');
    } catch (err: any) {
      setError(err.message || 'Не удалось создать спор');
    }
  }

  return (
    <AppLayout title="Сделки" requireAuth>
      <div className="card-grid">
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <section className="card">
          <h2>Подтверждение завершенной сделки</h2>
          <p className="muted">Используйте после успешной оплаты и приемки работы.</p>
          <form className="card-grid" onSubmit={onConfirmDeal}>
            <label className="field">
              <span>ID сделки</span>
              <input
                value={confirmDealId}
                onChange={(e) => setConfirmDealId(e.target.value)}
                required
                data-testid="confirm-work"
              />
            </label>
            <button className="primary-btn" type="submit">
              Подтвердить сделку
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Открыть спор</h2>
          <form className="card-grid" onSubmit={onCreateDispute}>
            <label className="field">
              <span>ID сделки</span>
              <input value={disputeDealId} onChange={(e) => setDisputeDealId(e.target.value)} required />
            </label>

            <label className="field">
              <span>Заголовок</span>
              <input value={disputeTitle} onChange={(e) => setDisputeTitle(e.target.value)} required />
            </label>

            <label className="field">
              <span>Описание</span>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                required
              />
            </label>

            <button className="danger-btn" type="submit">
              Открыть спор
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
