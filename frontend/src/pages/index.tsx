import type { NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { AppLayout } from '../components/AppLayout';

const Home: NextPage = () => {
  return (
    <AppLayout title="Биржа Telegram-автоматизации">
      <Head>
        <title>TG Биржа Автоматизации</title>
        <meta
          name="description"
          content="Биржа специалистов по Telegram-ботам, Mini Apps, интеграциям и AI-автоматизации."
        />
      </Head>

      <div className="card-grid">
        <section className="hero">
          <p className="hero-kicker">Niche-first фриланс платформа</p>
          <h2>Проекты по Telegram-ботам, интеграциям и AI-автоматизации</h2>
          <p>
            Отклики бесплатные. Монетизация платформы через комиссию сделок и
            платные бусты профиля.
          </p>
          <div className="action-row">
            <Link className="primary-btn" href="/auth/register">
              Начать сейчас
            </Link>
            <Link className="secondary-btn" href="/projects">
              Смотреть проекты
            </Link>
          </div>
        </section>

        <section className="card two-col">
          <div>
            <h3>Для заказчика</h3>
            <div className="badge-list">
              <span className="badge">Шаблон ТЗ под TG-автоматизацию</span>
              <span className="badge">Авто-теги и матчиннг исполнителей</span>
              <span className="badge">Инвайт топов в один клик</span>
              <span className="badge">Escrow и безопасная сделка</span>
            </div>
          </div>
          <div>
            <h3>Для исполнителя</h3>
            <div className="badge-list">
              <span className="badge">Бесплатные отклики</span>
              <span className="badge">Профиль и кошелек</span>
              <span className="badge">Выплаты и история сделок</span>
              <span className="badge">Буст профиля для роста видимости</span>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Home;
