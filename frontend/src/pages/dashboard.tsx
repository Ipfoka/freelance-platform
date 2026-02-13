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
      setSuccess('Профиль обновлен');
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить профиль');
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
        `Профиль поднят на ${result.boostDays} дней, до ${new Date(result.boostedUntil).toLocaleString()}.`,
      );
    } catch (err: any) {
      setError(err.message || 'Не удалось купить буст профиля');
    } finally {
      setBoostLoading(false);
    }
  }

  return (
    <AppLayout title="Кабинет" requireAuth>
      <div className="card-grid">
        <section className="card">
          <h2>Быстрые действия</h2>
          <div className="action-row">
            <Link className="secondary-btn" href="/projects">
              Смотреть проекты
            </Link>
            {user?.role === 'client' && (
              <Link className="primary-btn" href="/projects/new" data-testid="create-project">
                Создать проект
              </Link>
            )}
            <Link className="secondary-btn" href="/wallet">
              Открыть кошелек
            </Link>
            <Link className="secondary-btn" href="/deals">
              Работа со сделками
            </Link>
          </div>
        </section>

        <section className="card">
          <h2>Профиль</h2>
          <form className="card-grid" onSubmit={onSubmit}>
            <div className="two-col">
              <label className="field">
                <span>Имя</span>
                <input
                  value={formState.firstName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </label>

              <label className="field">
                <span>Фамилия</span>
                <input
                  value={formState.lastName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </label>
            </div>

            <label className="field">
              <span>О себе</span>
              <textarea
                value={formState.bio}
                onChange={(e) => setFormState((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </label>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить профиль'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Состояние кошелька</h2>
          {wallet ? (
            <div className="card-grid">
              <p>
                <strong>Баланс:</strong> {wallet.balance.toFixed(2)} {wallet.currency}
              </p>
              <p>
                <strong>В ожидании:</strong> {wallet.pending.toFixed(2)} {wallet.currency}
              </p>
              <p>
                <strong>Тариф:</strong> {profile?.plan}
              </p>
              {profile?.boostedUntil && (
                <p>
                  <strong>Буст активен до:</strong>{' '}
                  {new Date(profile.boostedUntil).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="muted">Кошелек не найден.</p>
          )}
        </section>

        {user?.role === 'freelancer' && (
          <section className="card card-grid">
            <h2>Буст профиля</h2>
            <p className="muted">
              Временный буст дает приоритет в блоке рекомендованных исполнителей.
            </p>
            {boostOffer ? (
              <p>
                Цена: <strong>{boostOffer.price.toFixed(2)} {boostOffer.currency}</strong> на{' '}
                {boostOffer.days} дней.
              </p>
            ) : (
              <p className="muted">Предложение буста сейчас недоступно.</p>
            )}
            <button
              className="primary-btn"
              type="button"
              disabled={!boostOffer || boostLoading}
              onClick={() => void onBuyBoost()}
            >
              {boostLoading ? 'Проводим оплату...' : 'Купить буст профиля'}
            </button>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
