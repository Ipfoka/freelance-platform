import type { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { AppLayout } from '../components/AppLayout';

const Home: NextPage = () => {
  return (
    <AppLayout title="Freelance Marketplace MVP">
      <Head>
        <title>Freelance Platform</title>
        <meta name="description" content="Freelance platform MVP" />
      </Head>

      <div className="card-grid">
        <section className="card">
          <h2>Current MVP Scope</h2>
          <p className="muted">
            Auth, projects, proposals, deals, payouts and profile management are wired to the backend API.
          </p>
          <div className="action-row">
            <Link className="primary-btn" href="/auth/register">
              Create account
            </Link>
            <Link className="secondary-btn" href="/auth/login">
              Sign in
            </Link>
            <Link className="secondary-btn" href="/projects">
              Browse projects
            </Link>
          </div>
        </section>

        <section className="card two-col">
          <div>
            <h3>Client flow</h3>
            <div className="badge-list">
              <span className="badge">Register as client</span>
              <span className="badge">Create project</span>
              <span className="badge">Review proposals</span>
              <span className="badge">Create and confirm deal</span>
            </div>
          </div>
          <div>
            <h3>Freelancer flow</h3>
            <div className="badge-list">
              <span className="badge">Register as freelancer</span>
              <span className="badge">Apply to projects</span>
              <span className="badge">Receive released funds</span>
              <span className="badge">Request payout</span>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Home;
