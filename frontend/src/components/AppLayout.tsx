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
    return <div className="container">Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <div className="container">Redirecting to login...</div>;
  }

  if (requireAuth && allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="container">Redirecting to dashboard...</div>;
  }

  return (
    <div className="page-shell">
      <header className="header">
        <div className="container nav-row">
          <Link href="/" className="logo">
            Freelance Platform
          </Link>
          <nav className="nav">
            <Link href="/projects">Projects</Link>
            {isAuthenticated && <Link href="/dashboard">Dashboard</Link>}
            {isAuthenticated && <Link href="/deals">Deals</Link>}
            {isAuthenticated && <Link href="/wallet">Wallet</Link>}
            {!isAuthenticated && <Link href="/auth/login">Login</Link>}
            {!isAuthenticated && <Link href="/auth/register">Register</Link>}
            {isAuthenticated && (
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  logout();
                  void router.push('/auth/login');
                }}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <div className="page-title-row">
          <h1>{title}</h1>
          {user && <span className="role-badge">Role: {user.role}</span>}
        </div>
        {children}
      </main>
    </div>
  );
}
