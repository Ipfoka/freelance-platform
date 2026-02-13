import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';

const strengths = [
  {
    title: 'Фокус только на автоматизации',
    text: 'Заявки только по Telegram-ботам, интеграциям, AI и бизнес-процессам. Без нерелевантного шума.',
  },
  {
    title: 'Умный подбор исполнителей',
    text: 'После публикации заказа сразу показываются топ-исполнители по навыкам, сделкам и рейтингу.',
  },
  {
    title: 'Бесплатные отклики',
    text: 'Исполнители откликаются бесплатно. Монетизация платформы: комиссия + буст профиля.',
  },
];

const steps = [
  'Заполняете бриф-конструктор под TG/автоматизацию.',
  'Система ставит авто-теги и подбирает релевантных исполнителей.',
  'В 1 клик приглашаете лучших, получаете отклики и выбираете подрядчика.',
  'Запускаете сделку и контролируете оплату через безопасный флоу.',
];

const niches = [
  'Telegram-боты для продаж и лидогенерации',
  'Telegram Mini App + WebApp сценарии',
  'CRM-интеграции (Bitrix24, amoCRM, HubSpot)',
  'AI-ассистенты и GPT-автоматизация',
  'Workflow no-code/low-code (n8n, Make, Zapier)',
  'Платежи, webhooks, аналитика и уведомления',
];

const plans = [
  {
    name: 'Start',
    invites: 'до 3 приглашений',
    who: 'для первых проектов',
  },
  {
    name: 'Pro',
    invites: 'до 10 приглашений',
    who: 'для регулярных заказчиков',
  },
  {
    name: 'Business',
    invites: 'до 25 приглашений',
    who: 'для команд и агентств',
  },
];

export default function HomePage() {
  return (
    <AppLayout title="Биржа TG и автоматизации">
      <div className="landing-page">
        <section className="landing-hero">
          <p className="hero-kicker">Ниша: Telegram + Automation</p>
          <h2>Запускайте проекты быстрее и без фриланс-хаоса</h2>
          <p>
            Платформа для заказов по ботам, интеграциям и автоматизации. Публикация проекта
            занимает 3-5 минут, а релевантные исполнители подбираются автоматически.
          </p>
          <div className="action-row">
            <Link className="primary-btn" href="/projects/new">
              Создать проект
            </Link>
            <Link className="secondary-btn" href="/projects">
              Посмотреть проекты
            </Link>
          </div>
          <div className="landing-stats">
            <article>
              <strong>30 сек</strong>
              <span>первичный подбор исполнителей</span>
            </article>
            <article>
              <strong>0 ₽</strong>
              <span>за отклик для фрилансера</span>
            </article>
            <article>
              <strong>1 клик</strong>
              <span>инвайт топ-исполнителей</span>
            </article>
          </div>
        </section>

        <section className="landing-section">
          <h3>Почему эта биржа сильнее классических площадок</h3>
          <div className="feature-grid">
            {strengths.map((item) => (
              <article className="feature-card" key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h3>Как работает платформа</h3>
          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step}>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h3>Специализация по нишам</h3>
          <div className="niche-grid">
            {niches.map((niche) => (
              <article className="niche-card" key={niche}>
                {niche}
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h3>Тарифы и монетизация</h3>
          <div className="plans-grid">
            {plans.map((plan) => (
              <article className="plan-card" key={plan.name}>
                <h4>{plan.name}</h4>
                <p>{plan.invites}</p>
                <span>{plan.who}</span>
              </article>
            ))}
          </div>
          <p className="muted">
            Модель платформы: комиссия со сделок + буст профиля исполнителя. Отклики остаются
            бесплатными, как ты и хотел.
          </p>
        </section>

        <section className="landing-cta">
          <h3>Готовы запустить первый заказ?</h3>
          <p>
            Начните с шаблона под Telegram/автоматизацию, получите авто-теги и пригласите лучших
            исполнителей в один клик.
          </p>
          <div className="action-row">
            <Link className="primary-btn" href="/auth/register">
              Зарегистрироваться
            </Link>
            <Link className="secondary-btn" href="/projects/new">
              Открыть конструктор ТЗ
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
