export type RelationDirection = 'IN' | 'OUT' | 'BIDIRECTIONAL' | 'SELF' | 'CONTEXT';
export type TimelineBucket = 'HOT_24H' | 'ACTIVE_7D' | 'ACTIVE_30D' | 'STALE' | 'UNKNOWN';
export type EntityClass = 'USER_WALLET' | 'APP' | 'FEE_ACCOUNT' | 'VALIDATOR' | 'SUPER_VALIDATOR' | 'REWARD_SOURCE' | 'GOVERNANCE' | 'CONTRACT' | 'UNKNOWN';

export type RelationAggregate = {
  counterpartyId: string;
  transferCount: number;
  totalAmount: number;
  incomingAmount: number;
  outgoingAmount: number;
  averageAmount: number;
  firstSeen: number;
  lastSeen: number;
  direction: RelationDirection;
  confidenceAverage: number;
  interactionKinds: string[];
  semanticTags: string[];
};

type TransactionLike = {
  fromId: string;
  toId: string;
  amount?: number;
  confidence?: number;
  relationshipKind?: string;
  counterpartyIds?: string[];
};

export const isRenderableNodeId = (id: unknown): id is string => {
  return typeof id === 'string' && id.length > 0 && id !== 'Unknown';
};

export const shortPartyLabel = (id: string): string => {
  if (id.includes('::')) return id.split('::')[0];
  if (id.includes(':')) return id.split(':')[0];
  return id.slice(0, 14);
};

export const readPartyKeys = (party: any): string[] => {
  return [
    party?.validator,
    party?.partyAddress,
    party?.svId,
    party?.partyId,
    party?.id,
    party?.provider,
    party?.contractId ? `APP:${party.contractId}` : undefined,
  ].filter(isRenderableNodeId);
};

export const getActionColor = (action: string, fallback: string): string => {
  if (action === 'RWD') return '#f59e0b';
  if (action === 'VOT') return '#8b5cf6';
  if (action === 'APP') return '#10b981';
  if (action === 'CTR' || action === 'EVT') return '#22c55e';
  if (action === 'TRF') return '#2563eb';
  return fallback;
};

export const getRelationWeight = (txCount: number, holdings: number, recentScore: number): number => {
  const activity = Math.log10(txCount + 1) * 18;
  const value = holdings > 0 ? Math.log10(holdings + 1) * 8 : 0;
  return Math.min(95, Math.max(10, 14 + activity + value + recentScore));
};

export const getTimelineBucket = (timestamp: number, newestTimestamp: number): TimelineBucket => {
  if (!timestamp || !newestTimestamp) return 'UNKNOWN';
  const ageMs = newestTimestamp - timestamp;
  if (ageMs <= 86400000) return 'HOT_24H';
  if (ageMs <= 7 * 86400000) return 'ACTIVE_7D';
  if (ageMs <= 30 * 86400000) return 'ACTIVE_30D';
  return 'STALE';
};

export const getCounterpartyId = (tx: Pick<TransactionLike, 'fromId' | 'toId' | 'counterpartyIds'>, centralId: string): string => {
  if (tx.fromId === centralId && tx.toId === centralId) return centralId;
  if (tx.fromId === centralId) return tx.toId;
  if (tx.toId === centralId) return tx.fromId;
  return tx.counterpartyIds?.find(id => id !== centralId) || tx.toId || tx.fromId;
};

export const emptyAggregate = (counterpartyId: string): RelationAggregate => ({
  counterpartyId,
  transferCount: 0,
  totalAmount: 0,
  incomingAmount: 0,
  outgoingAmount: 0,
  averageAmount: 0,
  firstSeen: 0,
  lastSeen: 0,
  direction: 'CONTEXT',
  confidenceAverage: 0,
  interactionKinds: [],
  semanticTags: [],
});

export const resolveAggregateDirection = (aggregate: RelationAggregate): RelationDirection => {
  if (aggregate.counterpartyId && aggregate.incomingAmount > 0 && aggregate.outgoingAmount > 0) return 'BIDIRECTIONAL';
  if (aggregate.incomingAmount > 0) return 'IN';
  if (aggregate.outgoingAmount > 0) return 'OUT';
  return aggregate.direction;
};

export const getRiskFlags = (
  tx: TransactionLike,
  aggregate: RelationAggregate,
  pData: any,
): string[] => {
  const flags = new Set<string>();

  if (tx.fromId === tx.toId) flags.add('SELF_TRANSFER');
  if ((tx.amount || 0) >= 100) flags.add('HIGH_VALUE_TRANSFER');
  if (aggregate.transferCount >= 5 && aggregate.averageAmount > 0 && aggregate.averageAmount < 1) flags.add('MANY_SMALL_TRANSFERS');
  if ((aggregate.direction === 'IN' || aggregate.direction === 'OUT') && aggregate.transferCount >= 2) flags.add('ONE_WAY_FLOW');
  if ((tx.confidence ?? 1) < 0.7) flags.add('LOW_CONFIDENCE_RELATION');
  if (pData?._roleHint === 'VALIDATOR' || pData?._roleHint === 'SUPER_VALIDATOR' || pData?.validator || pData?.svId) flags.add('VALIDATOR_INTERACTION');
  if (pData?.creatorAccount || pData?.accountName?.toLowerCase?.().includes('fee')) flags.add('APP_OR_FEE_ACCOUNT');

  return Array.from(flags);
};

export const classifyEntity = (id: string, pData: any, tx?: TransactionLike): EntityClass => {
  const name = `${pData?.accountName || pData?.validatorName || pData?.svName || id}`.toLowerCase();
  const metadataSource = `${pData?._metadataSource || ''}`.toLowerCase();

  if (id === 'CANTON_REWARDS' || tx?.relationshipKind === 'REWARD') return 'REWARD_SOURCE';
  if (tx?.relationshipKind === 'GOVERNANCE' || id.startsWith('GOVERNANCE:')) return 'GOVERNANCE';
  if (pData?._roleHint === 'SUPER_VALIDATOR' || pData?.svId) return 'SUPER_VALIDATOR';
  if (pData?._roleHint === 'VALIDATOR' || pData?.validator || id.toLowerCase().includes('validator')) return 'VALIDATOR';
  if (name.includes('fee') || name.includes('fees') || id.toLowerCase().includes('fee')) return 'FEE_ACCOUNT';
  if (pData?.creatorAccount || metadataSource.includes('featured') || id.startsWith('APP:')) return 'APP';
  if (id.startsWith('CONTRACT:') || tx?.relationshipKind === 'CONTRACT') return 'CONTRACT';
  if (id.includes('::')) return 'USER_WALLET';
  return 'UNKNOWN';
};

export const getRelationshipScore = (
  tx: TransactionLike,
  aggregate: RelationAggregate,
  newestTimestamp: number,
): number => {
  const volumeScore = Math.min(25, Math.log10((aggregate.totalAmount || tx.amount || 0) + 1) * 8);
  const frequencyScore = Math.min(25, Math.log10(aggregate.transferCount + 1) * 16);
  const confidenceScore = Math.min(25, (tx.confidence ?? 0.5) * 25);
  const ageMs = newestTimestamp && aggregate.lastSeen ? newestTimestamp - aggregate.lastSeen : Number.MAX_SAFE_INTEGER;
  const recencyScore = ageMs <= 86400000 ? 25 : ageMs <= 7 * 86400000 ? 18 : ageMs <= 30 * 86400000 ? 10 : 3;

  return Math.round(Math.min(100, volumeScore + frequencyScore + confidenceScore + recencyScore));
};
