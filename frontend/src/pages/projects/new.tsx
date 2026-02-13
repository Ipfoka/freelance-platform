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

  lines.push(`Project focus: ${input.automationType}`);
  lines.push(`Current stage: ${input.botStage || 'not specified'}`);
  lines.push(`Main goal: ${input.mainGoal || 'not specified'}`);
  lines.push(`Core user flow: ${input.userFlow || 'not specified'}`);
  lines.push(
    `Integrations: ${input.integrations.length > 0 ? input.integrations.join(', ') : 'not specified'}`,
  );
  lines.push(
    `Preferred stack: ${input.stack.length > 0 ? input.stack.join(', ') : 'flexible'}`,
  );
  lines.push(
    `Deadline target: ${input.deadlineDays ? `${input.deadlineDays} days` : 'flexible'}`,
  );
  lines.push(
    `Post-launch support: ${input.supportNeeded ? 'required' : 'not required'}`,
  );

  if (input.notes.trim()) {
    lines.push(`Additional details: ${input.notes.trim()}`);
  }

  return [`${input.title}`, '', 'Automation brief:', ...lines.map((line) => `- ${line}`)].join(
    '\n',
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const { apiFetch } = useAuth();

  const [title, setTitle] = useState('');
  const [automationType, setAutomationType] =
    useState<AutomationType>('telegram_bot');
  const [botStage, setBotStage] = useState('new product');
  const [mainGoal, setMainGoal] = useState('');
  const [userFlow, setUserFlow] = useState('');
  const [integrationsInput, setIntegrationsInput] = useState(
    'telegram, crm, stripe',
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
      setError(err.message || 'Cannot create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Create TG Automation Project" requireAuth allowedRoles={['client']}>
      <form className="card card-grid" onSubmit={onSubmit}>
        <p className="muted">
          Proposals are free for freelancers. Monetization is based on commission and boosts.
        </p>

        <label className="field">
          <span>Project title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-testid="project-title"
            placeholder="Telegram sales bot for online school"
          />
        </label>

        <div className="two-col">
          <label className="field">
            <span>Automation type</span>
            <select
              value={automationType}
              onChange={(e) => setAutomationType(e.target.value as AutomationType)}
            >
              <option value="telegram_bot">Telegram bot</option>
              <option value="telegram_mini_app">Telegram Mini App</option>
              <option value="automation_pipeline">Automation pipeline</option>
              <option value="ai_assistant">AI assistant</option>
              <option value="integration">Integration project</option>
            </select>
          </label>

          <label className="field">
            <span>Stage</span>
            <input
              value={botStage}
              onChange={(e) => setBotStage(e.target.value)}
              placeholder="MVP from scratch / rewrite / support"
            />
          </label>
        </div>

        <label className="field">
          <span>Main business goal</span>
          <input
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
            placeholder="Lead qualification and auto-routing to CRM"
            required
          />
        </label>

        <label className="field">
          <span>Main user flow</span>
          <textarea
            value={userFlow}
            onChange={(e) => setUserFlow(e.target.value)}
            placeholder="User starts bot -> quiz -> payment -> CRM deal -> manager alert"
            required
          />
        </label>

        <div className="two-col">
          <label className="field">
            <span>Integrations (comma separated)</span>
            <input
              value={integrationsInput}
              onChange={(e) => setIntegrationsInput(e.target.value)}
              placeholder="telegram, bitrix24, stripe, google sheets"
            />
          </label>

          <label className="field">
            <span>Preferred stack (comma separated)</span>
            <input
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              placeholder="typescript, nestjs, python"
            />
          </label>
        </div>

        <div className="two-col">
          <label className="field">
            <span>Budget</span>
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
            <span>Deadline target (days)</span>
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
            <span>Max proposals (optional)</span>
            <input
              value={maxProposals}
              onChange={(e) => setMaxProposals(e.target.value)}
              type="number"
              min="1"
            />
          </label>

          <label className="field">
            <span>Additional tags (comma separated)</span>
            <input
              value={extraSkillsInput}
              onChange={(e) => setExtraSkillsInput(e.target.value)}
              placeholder="telegram-webapp, webhook, qa"
            />
          </label>
        </div>

        <label className="field">
          <span>Extra notes for executor</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any constraints, security notes, preferred communication, etc."
          />
        </label>

        <label className="field">
          <span>
            <input
              type="checkbox"
              checked={supportNeeded}
              onChange={(e) => setSupportNeeded(e.target.checked)}
            />{' '}
            Need post-launch support
          </span>
        </label>

        <section className="card card-grid">
          <h3>Generated matching tags</h3>
          <div className="badge-list">
            {generatedTags.map((tag) => (
              <span className="badge" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {generatedTags.length === 0 && <p className="muted">No tags yet.</p>}
        </section>

        <section className="card card-grid">
          <h3>Generated brief preview</h3>
          <pre className="muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {generatedDescription}
          </pre>
        </section>

        {error && <p className="error">{error}</p>}

        <button
          className="primary-btn"
          type="submit"
          disabled={loading}
          data-testid="submit-project"
        >
          {loading ? 'Creating...' : 'Create project'}
        </button>
      </form>
    </AppLayout>
  );
}
