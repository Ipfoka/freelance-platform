import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '../../components/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  DealCreationResult,
  InviteQuota,
  Project,
  ProjectInvite,
  ProjectInvitesResponse,
  Proposal,
  RecommendedExecutor,
  TopExecutorsResponse,
} from '../../lib/types';

type DealDraft = {
  amount: string;
  currency: 'USD' | 'EUR' | 'GBP';
};

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { apiFetch, user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [recommendedExecutors, setRecommendedExecutors] = useState<
    RecommendedExecutor[]
  >([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [inviteQuota, setInviteQuota] = useState<InviteQuota | null>(null);
  const [invitingFreelancerId, setInvitingFreelancerId] = useState<string | null>(
    null,
  );
  const [dealDrafts, setDealDrafts] = useState<Record<string, DealDraft>>({});

  const [proposalContent, setProposalContent] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dealResult, setDealResult] = useState<DealCreationResult | null>(null);

  const projectId = typeof id === 'string' ? id : '';

  const isOwnerClient = useMemo(
    () => user?.role === 'client' && project?.userId === user.id,
    [project?.userId, user],
  );

  const isFreelancer = user?.role === 'freelancer';

  const loadProject = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const allProjects = await apiFetch<Project[]>('/api/projects', {
        skipAuth: true,
      });
      const current = allProjects.find((item) => item.id === projectId) || null;

      if (!current) {
        setProject(null);
        setError('Project not found');
        return;
      }

      setProject(current);

      if (user?.role === 'client' && current.userId === user.id) {
        setRecommendationsLoading(true);
        const [projectProposals, recommendations, invitesResponse] =
          await Promise.all([
            apiFetch<Proposal[]>(`/api/projects/${projectId}/proposals`),
            apiFetch<TopExecutorsResponse>(
              `/api/projects/${projectId}/top-executors`,
            ),
            apiFetch<ProjectInvitesResponse>(`/api/projects/${projectId}/invites`),
          ]);
        setProposals(projectProposals);
        setRecommendedExecutors(recommendations.recommended);
        setInviteQuota(recommendations.inviteQuota);
        setInvites(invitesResponse.invites);

        const nextDrafts: Record<string, DealDraft> = {};
        for (const proposal of projectProposals) {
          nextDrafts[proposal.id] = {
            amount: proposal.price.toString(),
            currency: 'USD',
          };
        }
        setDealDrafts(nextDrafts);
      } else {
        setProposals([]);
        setRecommendedExecutors([]);
        setInvites([]);
        setInviteQuota(null);
      }
    } catch (err: any) {
      setError(err.message || 'Cannot load project');
      setRecommendedExecutors([]);
      setInvites([]);
      setInviteQuota(null);
    } finally {
      setLoading(false);
      setRecommendationsLoading(false);
    }
  }, [apiFetch, projectId, user]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  async function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!projectId) return;

    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/projects/${projectId}/proposals`, {
        method: 'POST',
        body: JSON.stringify({
          content: proposalContent,
          price: Number(proposalPrice),
        }),
      });

      setSuccess('Proposal submitted. Proposals are free for freelancers.');
      setProposalContent('');
      setProposalPrice('');
    } catch (err: any) {
      setError(err.message || 'Cannot submit proposal');
    }
  }

  async function createDeal(proposal: Proposal) {
    const draft = dealDrafts[proposal.id];
    if (!draft) return;

    setError(null);
    setSuccess(null);

    try {
      const result = await apiFetch<DealCreationResult>('/api/deals', {
        method: 'POST',
        body: JSON.stringify({
          proposalId: proposal.id,
          amount: Number(draft.amount),
          currency: draft.currency,
        }),
      });

      setDealResult(result);
      setSuccess('Deal created. Complete payment using returned client secret.');
    } catch (err: any) {
      setError(err.message || 'Cannot create deal');
    }
  }

  async function inviteFreelancer(freelancerId: string) {
    if (!projectId) return;

    setError(null);
    setSuccess(null);
    setInvitingFreelancerId(freelancerId);

    try {
      const result = await apiFetch<{
        invite: ProjectInvite;
        inviteQuota: InviteQuota;
      }>(`/api/projects/${projectId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ freelancerId }),
      });

      setInvites((prev) => [result.invite, ...prev]);
      setInviteQuota(result.inviteQuota);
      setRecommendedExecutors((prev) =>
        prev.map((item) =>
          item.id === freelancerId ? { ...item, alreadyInvited: true } : item,
        ),
      );
      setSuccess('Invitation sent.');
    } catch (err: any) {
      setError(err.message || 'Cannot invite freelancer');
    } finally {
      setInvitingFreelancerId(null);
    }
  }

  return (
    <AppLayout title="Project details">
      <div className="card-grid">
        {loading && <p className="muted">Loading project...</p>}
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {project && (
          <section className="card card-grid">
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <p>
              <strong>Budget:</strong> ${project.budget.toFixed(2)}
            </p>
            <div className="badge-list">
              {project.skills.map((skill) => (
                <span className="badge" key={`${project.id}-${skill}`}>
                  {skill}
                </span>
              ))}
            </div>
            <p className="muted">
              Posted by: {project.user?.firstName} {project.user?.lastName} (
              {project.user?.email})
            </p>
          </section>
        )}

        {project && isFreelancer && (
          <section className="card">
            <h3>Submit proposal</h3>
            <p className="muted">
              You can submit proposals for free. No paywall per response.
            </p>
            <form className="card-grid" onSubmit={submitProposal}>
              <label className="field">
                <span>Cover note</span>
                <textarea
                  value={proposalContent}
                  onChange={(e) => setProposalContent(e.target.value)}
                  required
                  data-testid="proposal-content"
                />
              </label>

              <label className="field">
                <span>Price</span>
                <input
                  value={proposalPrice}
                  onChange={(e) => setProposalPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  data-testid="proposal-price"
                />
              </label>

              <button
                type="submit"
                className="primary-btn"
                data-testid="submit-proposal"
              >
                Submit proposal
              </button>
            </form>
          </section>
        )}

        {project && isOwnerClient && (
          <section className="card card-grid">
            <h3>Top recommended executors</h3>
            {inviteQuota && (
              <p className="muted">
                Plan: {inviteQuota.plan}. Invites used: {inviteQuota.used}/
                {inviteQuota.limit}. Remaining: {inviteQuota.remaining}.
              </p>
            )}
            {recommendationsLoading && (
              <p className="muted">Ranking freelancers...</p>
            )}
            {!recommendationsLoading && recommendedExecutors.length === 0 && (
              <p className="muted">
                No ranked freelancers yet. They will appear after completed
                deals in similar skills.
              </p>
            )}

            {recommendedExecutors.map((freelancer) => (
              <article className="card" key={freelancer.id}>
                <p>
                  <strong>
                    {freelancer.firstName} {freelancer.lastName}
                  </strong>{' '}
                  ({freelancer.email})
                </p>
                <p>
                  <strong>Score:</strong> {freelancer.score.toFixed(1)}
                </p>
                <p className="muted">
                  Completed deals: {freelancer.stats.completedDeals}. Skill
                  matches: {freelancer.stats.matchedSkillDeals}. Avg deal: $
                  {freelancer.stats.averageAmount.toFixed(2)}.
                </p>
                {freelancer.isBoosted && (
                  <p className="success">Boosted profile active</p>
                )}

                <button
                  type="button"
                  className="secondary-btn"
                  disabled={
                    freelancer.alreadyInvited ||
                    invitingFreelancerId === freelancer.id ||
                    (inviteQuota?.remaining || 0) <= 0
                  }
                  onClick={() => void inviteFreelancer(freelancer.id)}
                >
                  {freelancer.alreadyInvited
                    ? 'Already invited'
                    : invitingFreelancerId === freelancer.id
                      ? 'Inviting...'
                      : 'Invite'}
                </button>
              </article>
            ))}
          </section>
        )}

        {project && isOwnerClient && (
          <section className="card card-grid">
            <h3>Sent invites</h3>
            {invites.length === 0 && <p className="muted">No invites sent yet.</p>}
            {invites.map((invite) => (
              <article className="card" key={invite.id}>
                <p>
                  <strong>
                    {invite.freelancer?.firstName} {invite.freelancer?.lastName}
                  </strong>{' '}
                  ({invite.freelancer?.email})
                </p>
                <p className="muted">Status: {invite.status}</p>
              </article>
            ))}
          </section>
        )}

        {project && isOwnerClient && (
          <section className="card card-grid">
            <h3>Received proposals</h3>
            {proposals.length === 0 && <p className="muted">No proposals yet.</p>}

            {proposals.map((proposal) => (
              <article className="card" key={proposal.id}>
                <p>
                  <strong>
                    {proposal.sender?.firstName} {proposal.sender?.lastName}
                  </strong>{' '}
                  ({proposal.sender?.email})
                </p>
                <p>{proposal.content}</p>
                <p>
                  <strong>Price:</strong> ${proposal.price.toFixed(2)}
                </p>
                {proposal.sender?.boostedUntil && (
                  <p className="success">Boosted freelancer</p>
                )}

                <div className="two-col">
                  <label className="field">
                    <span>Deal amount</span>
                    <input
                      value={dealDrafts[proposal.id]?.amount || ''}
                      onChange={(e) =>
                        setDealDrafts((prev) => ({
                          ...prev,
                          [proposal.id]: {
                            ...(prev[proposal.id] || { currency: 'USD' as const }),
                            amount: e.target.value,
                          },
                        }))
                      }
                      type="number"
                      step="0.01"
                      min="0.01"
                    />
                  </label>

                  <label className="field">
                    <span>Currency</span>
                    <select
                      value={dealDrafts[proposal.id]?.currency || 'USD'}
                      onChange={(e) =>
                        setDealDrafts((prev) => ({
                          ...prev,
                          [proposal.id]: {
                            ...(prev[proposal.id] || {
                              amount: proposal.price.toString(),
                            }),
                            currency: e.target.value as 'USD' | 'EUR' | 'GBP',
                          },
                        }))
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  data-testid="accept-proposal"
                  onClick={() => void createDeal(proposal)}
                >
                  Create deal from proposal
                </button>
              </article>
            ))}
          </section>
        )}

        {dealResult && (
          <section className="card">
            <h3>Latest deal result</h3>
            <p>
              <strong>Deal ID:</strong> {dealResult.deal.id}
            </p>
            <p>
              <strong>Status:</strong> {dealResult.deal.status}
            </p>
            <p>
              <strong>Stripe client secret:</strong> {dealResult.clientSecret || 'N/A'}
            </p>
            <p className="muted">
              After completing Stripe payment, confirm the deal on the deals page.
            </p>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
