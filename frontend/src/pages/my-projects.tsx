import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../lib/types';

export default function MyProjectsPage() {
  const { apiFetch, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  const myProjects = useMemo(
    () => projects.filter((project) => project.userId === user?.id),
    [projects, user?.id],
  );

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Project[]>('/api/projects', { skipAuth: true });
        setProjects(data);
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить проекты');
      }
    }

    void load();
  }, [apiFetch]);

  return (
    <AppLayout title="Мои проекты" requireAuth allowedRoles={['client']}>
      <div className="card-grid">
        {error && <p className="error">{error}</p>}
        {myProjects.length === 0 && <p className="muted">Вы пока не создали ни одного проекта.</p>}

        {myProjects.map((project) => (
          <article className="card" key={project.id}>
            <h3>{project.title}</h3>
            <p className="muted">{project.description}</p>
            <div className="action-row">
              <Link className="primary-btn" href={`/projects/${project.id}`} data-testid="view-proposals">
                Смотреть отклики
              </Link>
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}
