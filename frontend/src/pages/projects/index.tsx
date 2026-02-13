import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../lib/types';

function formatSkills(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProjectsPage() {
  const { apiFetch, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const canCreateProject = useMemo(() => user?.role === 'client', [user]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (budget.trim()) params.set('budget', budget.trim());
      const skills = formatSkills(skillsInput);
      for (const skill of skills) {
        params.append('skills', skill);
      }

      const suffix = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<Project[]>(`/api/projects${suffix}`, { skipAuth: true });
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить проекты');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, budget, query, skillsInput]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void loadProjects();
  }

  return (
    <AppLayout title="Проекты">
      <div className="card-grid">
        <section className="card">
          <form className="card-grid" onSubmit={onSubmit}>
            <div className="two-col">
              <label className="field">
                <span>Поиск</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название или описание" />
              </label>

              <label className="field">
                <span>Бюджет от</span>
                <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0" />
              </label>
            </div>

            <label className="field">
              <span>Навыки (через запятую)</span>
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="react, nestjs, stripe"
              />
            </label>

            <div className="action-row">
              <button type="submit" className="primary-btn">
                Применить фильтры
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setQuery('');
                  setBudget('');
                  setSkillsInput('');
                }}
              >
                Сбросить
              </button>
              {canCreateProject && (
                <Link className="secondary-btn" href="/projects/new">
                  Новый проект
                </Link>
              )}
            </div>
          </form>
        </section>

        {loading && <p className="muted">Загрузка проектов...</p>}
        {error && <p className="error">{error}</p>}

        {projects.map((project) => (
          <article key={project.id} className="card card-grid">
            <div className="action-row" style={{ justifyContent: 'space-between' }}>
              <h3>{project.title}</h3>
              <strong>${project.budget.toFixed(2)}</strong>
            </div>

            <p className="muted">{project.description}</p>

            <div className="badge-list">
              {project.skills.length > 0 ? (
                project.skills.map((skill) => (
                  <span className="badge" key={`${project.id}-${skill}`}>
                    {skill}
                  </span>
                ))
              ) : (
                <span className="muted">Навыки не указаны</span>
              )}
            </div>

            <p className="muted">
              Заказчик: {project.user?.firstName} {project.user?.lastName} ({project.user?.email})
            </p>

            <div className="action-row">
              <Link className="primary-btn" href={`/projects/${project.id}`}>
                Открыть проект
              </Link>
            </div>
          </article>
        ))}

        {!loading && projects.length === 0 && <p className="muted">Проекты не найдены.</p>}
      </div>
    </AppLayout>
  );
}
