export type UserRole = 'freelancer' | 'client' | 'admin';
export type UserPlan = 'free' | 'pro' | 'business';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  plan?: UserPlan;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface Wallet {
  id: string;
  balance: number;
  pending: number;
  currency: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  plan: UserPlan;
  avatar?: string | null;
  boostedUntil?: string | null;
  profile?: {
    id: string;
    bio?: string | null;
    avatar?: string | null;
  } | null;
  wallet?: Wallet | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  skills: string[];
  maxProposals?: number | null;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    plan?: UserPlan;
  };
  createdAt: string;
}

export interface Proposal {
  id: string;
  content: string;
  price: number;
  projectId: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    boostedUntil?: string | null;
  };
}

export interface DealCreationResult {
  deal: {
    id: string;
    projectId: string;
    proposalId?: string | null;
    senderId: string;
    receiverId: string;
    amount: number;
    currency: string;
    status: string;
    escrowPaymentId?: string | null;
    createdAt: string;
  };
  clientSecret: string | null;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  userId: string;
  status: string;
  fee: number;
  createdAt: string;
}

export interface InviteQuota {
  plan: UserPlan;
  limit: number;
  used: number;
  remaining: number;
}

export interface RecommendedExecutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  boostedUntil?: string | null;
  isBoosted: boolean;
  alreadyInvited: boolean;
  score: number;
  stats: {
    completedDeals: number;
    matchedSkillDeals: number;
    averageAmount: number;
  };
}

export interface TopExecutorsResponse {
  projectId: string;
  totalCandidates: number;
  inviteQuota: InviteQuota;
  recommended: RecommendedExecutor[];
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  message?: string | null;
  status: string;
  createdAt: string;
  freelancer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    boostedUntil?: string | null;
  } | null;
}

export interface ProjectInvitesResponse {
  projectId: string;
  inviteQuota: InviteQuota;
  invites: ProjectInvite[];
}

export interface ProfileBoostOffer {
  price: number;
  days: number;
  currency: string;
}

export interface ProfileBoostPurchaseResult {
  chargedAmount: number;
  currency: string;
  boostedUntil: string;
  boostDays: number;
}
