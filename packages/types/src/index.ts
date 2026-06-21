export type UserRole = 'USER' | 'ADMIN';

export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';

export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'EXCLUDE';

export type ExpenseCategory = 'FOOD' | 'TRANSPORT' | 'ACCOMMODATION' | 'ACTIVITY' | 'SHOPPING' | 'UTILITIES' | 'OTHER';

export type TripStatus = 'PLANNING' | 'ACTIVE' | 'SETTLING' | 'SETTLED' | 'ARCHIVED';

export type TripMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type SettlementStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export type SubStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';

export type NotifType = 
  | 'EXPENSE_ADDED'
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'CONTRIBUTION_ADDED'
  | 'SETTLEMENT_CREATED'
  | 'SETTLEMENT_COMPLETED'
  | 'TRIP_SETTLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'TRIP_INVITE';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  username: string;
  avatarUrl?: string | null;
  fcmToken?: string | null;
  googleId?: string | null;
  passwordHash?: string | null;
  isVerified: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Trip {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  budget?: number | null; // represented as Decimal or number
  currency: string;
  inviteCode: string;
  status: TripStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  coverImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: TripMemberRole;
  displayName?: string | null;
  preContribution: number; // represented as Decimal or number
  joinedAt: Date;
  leftAt?: Date | null;
}

export interface PreContribution {
  id: string;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  amount: number; // represented as Decimal or number
  note?: string | null;
  createdAt: Date;
}

export interface Expense {
  id: string;
  tripId: string;
  paidByUserId: string;
  title: string;
  description?: string | null;
  totalAmount: number; // represented as Decimal or number
  category: ExpenseCategory;
  receiptUrl?: string | null;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  splitType: SplitType;
  amount: number; // represented as Decimal or number
  percentage?: number | null;
  isSettled: boolean;
  createdAt: Date;
}

export interface Settlement {
  id: string;
  tripId: string;
  payerId: string;
  payeeId: string;
  amount: number; // represented as Decimal or number
  status: SettlementStatus;
  method?: string | null;
  txnRef?: string | null;
  settledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceYearly: number;
  maxTrips: number;
  maxMembersPerTrip: number;
  canScanReceipts: boolean;
  canExport: boolean;
  canCustomSplit: boolean;
  canCurrencyConvert: boolean;
  canAISettle: boolean;
  cashfreePlanIdMonthly?: string | null;
  cashfreePlanIdYearly?: string | null;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  cashfreeCustomerId?: string | null;
  cashfreeSubscriptionId?: string | null;
  cashfreeOrderId?: string | null;
  status: SubStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  data?: any;
  readAt?: Date | null;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  upgradeRequired?: boolean;
  requiredTier?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  role: UserRole;
  isVerified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface TripWithMembers extends Trip {
  members: Array<TripMember & { user: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'> }>;
  memberCount?: number;
  expenseTotal?: number;
}

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
  paidBy: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;
}

export interface SettlementWithUsers extends Settlement {
  payer: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;
  payee: Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;
}

export type UserPublic = Pick<User, 'id' | 'name' | 'username' | 'avatarUrl'>;

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendWithUser extends Friendship {
  user: UserPublic;
}

export type FriendRelationStatus =
  | 'NONE'
  | 'FRIENDS'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED';

export interface UserSearchResult extends UserPublic {
  friendshipStatus: FriendRelationStatus;
  friendshipId?: string;
}
