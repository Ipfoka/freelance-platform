import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/types';

type Props = {
  title: string;
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
};

function roleLabel(role: UserRole) {
  if (role === 'client') return 'Заказчик';
  if (role === 'freelancer') return 'Исполнитель';
  return 'Администратор';
}

export function AppLayout({
  title,
  children,
  requireAuth = false,
  allowedRoles,
}: Props) {
  const router = useRouter();
  const { isReady, isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    if (!isReady || !requireAuth) return;

    if (!isAuthenticated) {
      void router.replace('/auth/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      void router.replace('/dashboard');
    }
  }, [allowedRoles, isAuthenticated, isReady, requireAuth, router, user]);

  if (!isReady) {
    return <div className="container">Загрузка...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <div className="container">Переход на страницу входа...</div>;
  }

  if (requireAuth && allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="container">Переход в личный кабинет...</div>;
  }

  return (
    <div className="page-shell">
      <header className="header">
        <div className="container nav-row">
          <Link href="/" className="logo">
            TG Биржа Автоматизации
          </Link>
          <nav className="nav">
            <Link href="/projects">Проекты</Link>
            {isAuthenticated && <Link href="/dashboard">Кабинет</Link>}
            {isAuthenticated && <Link href="/deals">Сделки</Link>}
            {isAuthenticated && <Link href="/wallet">Кошелек</Link>}
            {!isAuthenticated && <Link href="/auth/login">Вход</Link>}
            {!isAuthenticated && <Link href="/auth/register">Регистрация</Link>}
            {isAuthenticated && (
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  logout();
                  void router.push('/auth/login');
                }}
              >
                Выйти
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <div className="page-title-row">
          <h1>{title}</h1>
          {user && <span className="role-badge">Роль: {roleLabel(user.role)}</span>}
        </div>
        {children}
      </main>
    </div>
  );
}
