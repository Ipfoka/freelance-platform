import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../lib/types';

type AutomationType =
  | 'telegram_bot'
  | 'telegram_mini_app'
  | 'automation_pipeline'
  | 'ai_assistant'
  | 'integration';

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function buildAutoTags(input: {
  automationType: AutomationType;
  botStage: string;
  integrations: string[];
  stack: string[];
  mainGoal: string;
  notes: string;
  extraSkills: string[];
}) {
  const tags = new Set<string>();
  const text = [
    input.botStage,
    input.mainGoal,
    input.notes,
    input.integrations.join(' '),
    input.stack.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  tags.add(normalizeTag(input.automationType));
  tags.add('telegram');

  for (const integration of input.integrations) {
    tags.add(normalizeTag(integration));
  }

  for (const tech of input.stack) {
    tags.add(normalizeTag(tech));
  }

  for (const item of input.extraSkills) {
    tags.add(normalizeTag(item));
  }

  if (text.includes('mini app') || input.automationType === 'telegram_mini_app') {
    tags.add('telegram-mini-app');
  }

  if (text.includes('ai') || text.includes('gpt') || text.includes('openai')) {
    tags.add('ai-automation');
  }

  if (text.includes('crm') || text.includes('bitrix') || text.includes('amo')) {
    tags.add('crm');
  }

  if (text.includes('stripe') || text.includes('оплат') || text.includes('payment')) {
    tags.add('payments');
  }

  if (text.includes('webhook')) {
    tags.add('webhooks');
  }

  if (text.includes('n8n') || text.includes('zapier') || text.includes('make.com')) {
    tags.add('workflow-automation');
  }

  return Array.from(tags).filter(Boolean).slice(0, 20);
}

function getAutomationTypeLabel(type: AutomationType) {
  switch (type) {
    case 'telegram_bot':
      return 'Telegram-бот';
    case 'telegram_mini_app':
      return 'Telegram Mini App';
    case 'automation_pipeline':
      return 'Автоматизационный пайплайн';
    case 'ai_assistant':
      return 'AI-ассистент';
    case 'integration':
      return 'Интеграционный проект';
    default:
      return type;
  }
}

function buildDescription(input: {
  title: string;
  automationType: AutomationType;
  botStage: string;
  mainGoal: string;
  userFlow: string;
  integrations: string[];
  stack: string[];
  deadlineDays: string;
  supportNeeded: boolean;
  notes: string;
}) {
  const lines: string[] = [];

  lines.push(`Тип проекта: ${getAutomationTypeLabel(input.automationType)}`);
  lines.push(`Стадия: ${input.botStage || 'не указано'}`);
  lines.push(`Главная цель: ${input.mainGoal || 'не указано'}`);
  lines.push(`Ключевой пользовательский сценарий: ${input.userFlow || 'не указано'}`);
  lines.push(
    `Интеграции: ${input.integrations.length > 0 ? input.integrations.join(', ') : 'не указаны'}`,
  );
  lines.push(
    `Предпочтительный стек: ${input.stack.length > 0 ? input.stack.join(', ') : 'гибко'}`,
  );
  lines.push(
    `Желаемый срок: ${input.deadlineDays ? `${input.deadlineDays} дней` : 'обсуждаемо'}`,
  );
  lines.push(
    `Поддержка после запуска: ${input.supportNeeded ? 'нужна' : 'не требуется'}`,
  );

  if (input.notes.trim()) {
    lines.push(`Дополнительные условия: ${input.notes.trim()}`);
  }

  return [
    `${input.title || 'Проект без названия'}`,
    '',
    'Бриф по проекту:',
    ...lines.map((line) => `- ${line}`),
  ].join('\n');
}

export default function NewProjectPage() {
  const router = useRouter();
  const { apiFetch } = useAuth();

  const [title, setTitle] = useState('');
  const [automationType, setAutomationType] =
    useState<AutomationType>('telegram_bot');
  const [botStage, setBotStage] = useState('Новый запуск');
  const [mainGoal, setMainGoal] = useState('');
  const [userFlow, setUserFlow] = useState('');
  const [integrationsInput, setIntegrationsInput] = useState(
    'telegram, bitrix24, stripe',
  );
  const [stackInput, setStackInput] = useState('typescript, nestjs');
  const [extraSkillsInput, setExtraSkillsInput] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [supportNeeded, setSupportNeeded] = useState(true);
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [maxProposals, setMaxProposals] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const integrations = useMemo(
    () => parseList(integrationsInput),
    [integrationsInput],
  );
  const stack = useMemo(() => parseList(stackInput), [stackInput]);
  const extraSkills = useMemo(
    () => parseList(extraSkillsInput),
    [extraSkillsInput],
  );

  const generatedTags = useMemo(
    () =>
      buildAutoTags({
        automationType,
        botStage,
        integrations,
        stack,
        mainGoal,
        notes,
        extraSkills,
      }),
    [automationType, botStage, extraSkills, integrations, mainGoal, notes, stack],
  );

  const generatedDescription = useMemo(
    () =>
      buildDescription({
        title,
        automationType,
        botStage,
        mainGoal,
        userFlow,
        integrations,
        stack,
        deadlineDays,
        supportNeeded,
        notes,
      }),
    [
      automationType,
      botStage,
      deadlineDays,
      integrations,
      mainGoal,
      notes,
      stack,
      supportNeeded,
      title,
      userFlow,
    ],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await apiFetch<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: generatedDescription,
          budget: Number(budget),
          skills: generatedTags,
          automationType,
          botStage,
          integrations,
          mainGoal,
          supportNeeded,
          ...(deadlineDays ? { deadlineDays: Number(deadlineDays) } : {}),
          ...(maxProposals ? { maxProposals: Number(maxProposals) } : {}),
        }),
      });

      await router.push(`/projects/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Не удалось создать проект');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Конструктор проекта" requireAuth allowedRoles={['client']}>
      <form className="project-builder" onSubmit={onSubmit}>
        <div className="builder-main">
          <section className="section-card card-grid">
            <div>
              <h2>Быстрый бриф под TG и автоматизацию</h2>
              <p className="muted">
                Отклики для исполнителей бесплатные. Монетизация платформы идет через комиссию и
                бусты профиля.
              </p>
            </div>

            <label className="field">
              <span>Название проекта</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="project-title"
                placeholder="Telegram-бот для онлайн-школы с оплатой и CRM"
              />
            </label>

            <div className="two-col">
              <label className="field">
                <span>Тип автоматизации</span>
                <select
                  value={automationType}
                  onChange={(e) => setAutomationType(e.target.value as AutomationType)}
                >
                  <option value="telegram_bot">Telegram-бот</option>
                  <option value="telegram_mini_app">Telegram Mini App</option>
                  <option value="automation_pipeline">Автоматизационный пайплайн</option>
                  <option value="ai_assistant">AI-ассистент</option>
                  <option value="integration">Интеграционный проект</option>
                </select>
              </label>

              <label className="field">
                <span>Стадия проекта</span>
                <input
                  value={botStage}
                  onChange={(e) => setBotStage(e.target.value)}
                  placeholder="MVP с нуля / доработка / поддержка"
                />
              </label>
            </div>
          </section>

          <section className="section-card card-grid">
            <h3>Что должно получиться</h3>

            <label className="field">
              <span>Главная бизнес-цель</span>
              <input
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                placeholder="Квалификация лидов и передача в CRM"
                required
              />
            </label>

            <label className="field">
              <span>Основной пользовательский сценарий</span>
              <textarea
                value={userFlow}
                onChange={(e) => setUserFlow(e.target.value)}
                placeholder="Пользователь пишет боту -> мини-квиз -> оплата -> сделка в CRM -> уведомление менеджеру"
                required
              />
            </label>
          </section>

          <section className="section-card card-grid">
            <h3>Интеграции и стек</h3>
            <div className="two-col">
              <label className="field">
                <span>Интеграции (через запятую)</span>
                <input
                  value={integrationsInput}
                  onChange={(e) => setIntegrationsInput(e.target.value)}
                  placeholder="telegram, bitrix24, stripe, google sheets"
                />
              </label>

              <label className="field">
                <span>Предпочтительный стек (через запятую)</span>
                <input
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  placeholder="typescript, nestjs, python"
                />
              </label>
            </div>

            <label className="field">
              <span>Дополнительные навыки/теги (через запятую)</span>
              <input
                value={extraSkillsInput}
                onChange={(e) => setExtraSkillsInput(e.target.value)}
                placeholder="telegram-webapp, webhook, qa"
              />
            </label>
          </section>

          <section className="section-card card-grid">
            <h3>Бюджет и ограничения</h3>
            <div className="two-col">
              <label className="field">
                <span>Бюджет</span>
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  data-testid="project-budget"
                />
              </label>

              <label className="field">
                <span>Желаемый срок (в днях)</span>
                <input
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  type="number"
                  min="1"
                />
              </label>
            </div>

            <div className="two-col">
              <label className="field">
                <span>Лимит откликов (опционально)</span>
                <input
                  value={maxProposals}
                  onChange={(e) => setMaxProposals(e.target.value)}
                  type="number"
                  min="1"
                />
              </label>

              <label className="field field-checkbox">
                <span>
                  <input
                    type="checkbox"
                    checked={supportNeeded}
                    onChange={(e) => setSupportNeeded(e.target.checked)}
                  />{' '}
                  Нужна поддержка после запуска
                </span>
              </label>
            </div>
          </section>

          <section className="section-card card-grid">
            <h3>Дополнительные комментарии</h3>
            <label className="field">
              <span>Уточнения для исполнителя</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ограничения по безопасности, доступам, инфраструктуре, формату связи и т.д."
              />
            </label>
          </section>
        </div>

        <aside className="builder-side">
          <section className="section-card card-grid">
            <h3>Авто-теги для матчинга</h3>
            <div className="badge-list">
              {generatedTags.map((tag) => (
                <span className="badge" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            {generatedTags.length === 0 && <p className="muted">Теги появятся после заполнения.</p>}
          </section>

          <section className="section-card card-grid">
            <h3>Превью ТЗ</h3>
            <pre className="muted project-preview">{generatedDescription}</pre>
          </section>

          <section className="section-card card-grid">
            <h3>Перед публикацией</h3>
            <ul className="checklist">
              <li>Проверь, что цель и сценарий описаны простыми шагами.</li>
              <li>Укажи реальные интеграции и ограничения.</li>
              <li>Если сроки гибкие, напиши это в комментарии.</li>
            </ul>
          </section>

          {error && <p className="error">{error}</p>}

          <button
            className="primary-btn submit-wide"
            type="submit"
            disabled={loading}
            data-testid="submit-project"
          >
            {loading ? 'Публикуем проект...' : 'Опубликовать проект'}
          </button>
        </aside>
      </form>
    </AppLayout>
  );
}
