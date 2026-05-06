// Zustand importu eklendi
import { create } from 'zustand';
import {
  type EntityClass,
  type RelationAggregate,
  type RelationDirection,
  type TimelineBucket,
  classifyEntity,
  emptyAggregate,
  getActionColor,
  getCounterpartyId,
  getRelationWeight,
  getRelationshipScore,
  getRiskFlags,
  getTimelineBucket,
  isRenderableNodeId,
  readPartyKeys,
  resolveAggregateDirection,
  shortPartyLabel,
} from './cityStore.helpers';

// ============================================================================
// 0. INTERFACES & TYPES (ZUSTAND STORE İÇİN EKLENDİ)
// ============================================================================

export interface Building {
  id: string;      
  party: string;   
  height: number;  
  color: string;   
  type: 'PARTICIPANT' | 'VALIDATOR' | 'SUPER_VALIDATOR' | 'CENTER'; 
  transactionCount: number; 
  coinHoldings?: number; 
  isVerified?: boolean;  
}

export interface Transaction {
  id: string;          
  templateId: string;  
  fromId: string;      
  toId: string;        
  timestamp: number;   
  effectiveAt: number; 
  action: string;      
  migrationId: number | string; 
  round: number | string; 
  payload: any; 
  relationshipKind?: string;
  confidence?: number;
  confidenceLabel?: 'high' | 'medium' | 'low';
  amount?: number;
  counterpartyIds?: string[];
  semanticTags?: string[];
  relationDirection?: RelationDirection;
  riskFlags?: string[];
  relationshipScore?: number;
  entityClass?: EntityClass;
  timelineBucket?: TimelineBucket;
  aggregate?: {
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
}

export interface MarketMetrics {
  tps: number;
  cps: number;
  totalTransactions: number;
  amuletPrice: number;
  activeValidators: number;
  totalSuperValidators: number;
  totalStakeUsd: number;
  marketCapUsd: number;
}

export interface ApiHealthReport {
  updates?: { fetched: number; linked: number };
  contracts?: { fetched: number; linked: number };
  events?: { fetched: number; linked: number };
  transfers?: { fetched: number; linked: number };
  personalTransfers?: { fetched: number; linked: number };
  rewards?: { fetched: number; linked: number };
  governance?: { fetched: number; linked: number };
  apps?: { fetched: number; linked: number };
  profiles?: { requested: number; enriched: number };
  warnings?: string[];
}

export interface CounterpartyRank {
  partyId: string;
  score: number;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  entityClass: EntityClass;
  direction: RelationDirection;
  totalAmount: number;
  transferCount: number;
  firstSeen: number;
  riskFlags: string[];
  lastSeen: number;
  interactionKinds: string[];
  semanticTags: string[];
}

export interface WalletSummary {
  totalIncoming: number;
  totalOutgoing: number;
  netFlow: number;
  uniqueCounterparties: number;
  strongestCounterparty: CounterpartyRank | null;
  mostRecentCounterparty: CounterpartyRank | null;
  riskFlags: string[];
  validatorInteractions: number;
  appInteractions: number;
}

export interface RelationshipSummary {
  totalRelationships: number;
  highConfidenceRelationships: number;
  mediumConfidenceRelationships: number;
  lowConfidenceRelationships: number;
  validatorRelationships: number;
  appRelationships: number;
  governanceRelationships: number;
  rewardRelationships: number;
}

export interface TemporalSummary {
  firstSeen: number;
  lastSeen: number;
  peakWindow: TimelineBucket;
  recentActivityScore: number;
  activeDays: number;
}

export interface ClusterHint {
  id: string;
  type: 'VALIDATOR' | 'APP' | 'GOVERNANCE' | 'OPERATIONS';
  label: string;
  memberPartyIds: string[];
  strength: number;
}

export interface NoiseSuppressionSummary {
  suppressedPartyIds: string[];
  promotedPartyIds: string[];
}

export interface CityState {
  centralNodeId: string | null;   
  isScannerActive: boolean;       
  isScanning: boolean;            
  error: string | null;           
  buildings: Building[];          
  transactions: Transaction[];    
  marketMetrics: MarketMetrics | null;
  apiHealth: ApiHealthReport | null;
  counterpartyRanking: CounterpartyRank[];
  walletSummary: WalletSummary | null;
  relationshipSummary: RelationshipSummary | null;
  temporalSummary: TemporalSummary | null;
  clusterHints: ClusterHint[];
  noiseSuppression: NoiseSuppressionSummary | null;
  focusedPartyId: string | null;
  highlightedPartyIds: string[];
  highlightedClusterId: string | null;
  selectedTransactionId: string | null; 
  isInspectorOpen: boolean;             
  isHUDVisible: boolean; 
  isLeftPanelCollapsed: boolean; 

  startScan: (partyId: string) => void;
  finishScan: (rawParties: any[], rawData: any[], globalStats?: any) => Promise<void>;
  setError: (error: string) => void;
  resetScanner: () => void;
  setFocusedParty: (partyId: string | null) => void;
  setHighlightedParties: (partyIds: string[]) => void;
  setHighlightedCluster: (clusterId: string | null) => void;
  clearHighlights: () => void;
  setSelectedTransaction: (id: string | null) => void;
  closeInspector: () => void;
  toggleHUD: () => void;
  toggleLeftPanel: () => void; 
}

export {
  fetchContractDetails,
  fetchContractEvents,
  fetchContracts,
  fetchDashboard,
  fetchEventDetails,
  fetchEvents,
  fetchFeaturedAppDetails,
  fetchFeaturedApps,
  fetchGovernanceSuite,
  fetchMarketIntelligence,
  fetchNetworkParties,
  fetchPartyDetails,
  fetchPartyTypes,
  fetchPersonalTransfers,
  fetchRewards,
  fetchTokenDetails,
  fetchTopParties,
  fetchUpdateRawDetails,
  fetchUpdates,
  fetchValidators,
  fetchVoteRequestDetails,
  fetchVotesByRequest,
  getHybridContractHistory,
  modoFetch,
} from '../services/cantonApi';
// ============================================================================
// 5. CENTRAL DATA COMMAND (ZUSTAND STORE)
// (Binaların ve işlemlerin 3D şehre aktarıldığı tam entegre motor)
// ============================================================================

export const useCityStore = create<CityState>((set, get) => ({
  centralNodeId: null,
  isScannerActive: true, 
  isScanning: false,
  error: null,
  buildings: [],
  transactions: [],
  marketMetrics: null,
  apiHealth: null,
  counterpartyRanking: [],
  walletSummary: null,
  relationshipSummary: null,
  temporalSummary: null,
  clusterHints: [],
  noiseSuppression: null,
  focusedPartyId: null,
  highlightedPartyIds: [],
  highlightedClusterId: null,
  selectedTransactionId: null,
  isInspectorOpen: false,
  isHUDVisible: true,
  isLeftPanelCollapsed: false,

  startScan: (partyId) => set({
    centralNodeId: partyId,
    isScanning: true,
    error: null,
    buildings: [],
    transactions: [],
    apiHealth: null,
    counterpartyRanking: [],
    walletSummary: null,
    relationshipSummary: null,
    temporalSummary: null,
    clusterHints: [],
    noiseSuppression: null,
    focusedPartyId: null,
    highlightedPartyIds: [],
    highlightedClusterId: null,
    selectedTransactionId: null,
    isInspectorOpen: false
  }),

  finishScan: async (rawParties, rawData, globalStats) => {
    const centralId = get().centralNodeId;
    if (!centralId) return;

    if (globalStats) {
      set({
        marketMetrics: {
          tps: globalStats.dashboard?.tps || 0,
          cps: globalStats.dashboard?.cps || 0,
          totalTransactions: globalStats.dashboard?.totalTransactions || 0,
          amuletPrice: globalStats.market?.price?.price || 0,
          activeValidators: globalStats.dashboard?.totalActiveValidators || 0,
          totalSuperValidators: globalStats.dashboard?.totalSuperValidators || 0,
          totalStakeUsd: globalStats.market?.market?.totalStakeDto?.valueUsd || 0,
          marketCapUsd: globalStats.market?.market?.marketCapDto?.valueUsd || 0,
        }
      });
    }

    const rawArtifacts = Array.isArray(rawData) ? rawData : [];
    const txCountMap = new Map<string, number>();
    const valueMap = new Map<string, number>();
    const recencyMap = new Map<string, number>();

    const mappedTransactions: Transaction[] = rawArtifacts.map((c: any) => {
      const from = c._fromId || c._relationship?.fromId || c.fromId || c.synchronizerId || c.requester || c.senders?.[0]?.partyId || centralId;
      const to = c._toId || c._relationship?.toId || c.toId || c.receivers?.[0]?.partyId || c._counterpartyIds?.[0] || 'LEDGER_DOMAIN';
      const action = c._source || (c._relationship?.kind === 'TRANSFER' ? 'TRF' : 'SIGNAL');
      const amount = Number(c._amount ?? c._relationship?.amount ?? c.amount ?? 0) || 0;
      const timestamp = c._safeEpoch || 0;
      
      [from, to].filter(isRenderableNodeId).forEach((id) => {
        txCountMap.set(id, (txCountMap.get(id) || 0) + 1);
        valueMap.set(id, (valueMap.get(id) || 0) + amount);
        recencyMap.set(id, Math.max(recencyMap.get(id) || 0, timestamp));
      });

      return {
        id: c._uniqueKey || c.updateId || c.eventId || c.contractId || `id-${Math.random()}`,
        templateId: c.workflowId || c.templateId || c.templateName || c._relationship?.kind || 'MODO_RELATIONSHIP_CORE',
        fromId: from,
        toId: to,
        timestamp,
        effectiveAt: c.effectiveAt ? (c.effectiveAt.toString().length === 13 ? c.effectiveAt : timestamp) : timestamp,
        action,
        migrationId: c.migrationId || c._relationship?.targetRole || '4',
        round: c.eventsCount || amount || c._confidence || '0',
        payload: c,
        relationshipKind: c._relationship?.kind,
        confidence: c._confidence ?? c._relationship?.confidence,
        confidenceLabel: c._confidenceLabel,
        amount,
        counterpartyIds: c._counterpartyIds || c._relationship?.counterpartyIds || [],
        semanticTags: c._semanticTags || c._relationship?.semanticTags || []
      };
    }).filter(tx => isRenderableNodeId(tx.fromId) && isRenderableNodeId(tx.toId)).sort((a: any, b: any) => b.timestamp - a.timestamp);

    const activePartyIds = new Set<string>();
    activePartyIds.add(centralId);
    mappedTransactions.forEach(tx => {
      activePartyIds.add(tx.fromId);
      activePartyIds.add(tx.toId);
      tx.counterpartyIds?.forEach(id => activePartyIds.add(id));
    });

    const partyDataMap = new Map<string, any>();
    if (Array.isArray(rawParties)) {
      rawParties.forEach(p => readPartyKeys(p).forEach(key => partyDataMap.set(key, p)));
    }
    rawArtifacts.forEach((artifact: any) => {
      Object.entries(artifact?._partyProfiles || {}).forEach(([id, profile]) => {
        if (isRenderableNodeId(id)) partyDataMap.set(id, profile);
      });
    });

    const newestTimestamp = Math.max(...mappedTransactions.map(tx => tx.timestamp), 0);
    const aggregateMap = new Map<string, RelationAggregate>();

    mappedTransactions.forEach((tx) => {
      const counterpartyId = getCounterpartyId(tx, centralId);
      const aggregate = aggregateMap.get(counterpartyId) || emptyAggregate(counterpartyId);
      const amount = Number(tx.amount || 0);

      aggregate.transferCount += 1;
      aggregate.totalAmount += amount;
      aggregate.firstSeen = aggregate.firstSeen ? Math.min(aggregate.firstSeen, tx.timestamp) : tx.timestamp;
      aggregate.lastSeen = Math.max(aggregate.lastSeen, tx.timestamp);

      if (tx.fromId === centralId && tx.toId === centralId) {
        aggregate.direction = 'SELF';
        aggregate.incomingAmount += amount;
        aggregate.outgoingAmount += amount;
      } else if (tx.fromId === centralId) {
        aggregate.outgoingAmount += amount;
        aggregate.direction = aggregate.incomingAmount > 0 ? 'BIDIRECTIONAL' : 'OUT';
      } else if (tx.toId === centralId) {
        aggregate.incomingAmount += amount;
        aggregate.direction = aggregate.outgoingAmount > 0 ? 'BIDIRECTIONAL' : 'IN';
      }

      aggregate.averageAmount = aggregate.transferCount > 0 ? aggregate.totalAmount / aggregate.transferCount : 0;
      aggregate.confidenceAverage = aggregate.transferCount > 0
        ? (((aggregate.confidenceAverage * (aggregate.transferCount - 1)) + (tx.confidence ?? 0.5)) / aggregate.transferCount)
        : (tx.confidence ?? 0.5);
      aggregate.interactionKinds = Array.from(new Set([...aggregate.interactionKinds, tx.relationshipKind || 'UNKNOWN']));
      aggregate.semanticTags = Array.from(new Set([...(aggregate.semanticTags || []), ...(tx.semanticTags || [])]));
      aggregate.direction = resolveAggregateDirection(aggregate);
      aggregateMap.set(counterpartyId, aggregate);
    });

    const enrichedTransactions = mappedTransactions.map((tx) => {
      const counterpartyId = getCounterpartyId(tx, centralId);
      const aggregate = aggregateMap.get(counterpartyId) || emptyAggregate(counterpartyId);
      const pData = partyDataMap.get(counterpartyId);
      const riskFlags = getRiskFlags(tx, aggregate, pData);
      const timelineBucket = getTimelineBucket(tx.timestamp, newestTimestamp);
      const entityClass = classifyEntity(counterpartyId, pData, tx);
      const relationshipScore = getRelationshipScore(tx, aggregate, newestTimestamp);

      return {
        ...tx,
        relationDirection: aggregate.direction,
        timelineBucket,
        riskFlags,
        entityClass,
        relationshipScore,
        aggregate,
        payload: {
          ...tx.payload,
          _aggregate: aggregate,
          _riskFlags: riskFlags,
          _timelineBucket: timelineBucket,
          _entityClass: entityClass,
          _relationshipScore: relationshipScore,
          _counterpartyProfile: pData || null,
        }
      };
    });

    const counterpartyRanking: CounterpartyRank[] = Array.from(aggregateMap.values())
      .map((aggregate) => {
        const sampleTx = enrichedTransactions.find(tx => getCounterpartyId(tx, centralId) === aggregate.counterpartyId);
        const pData = partyDataMap.get(aggregate.counterpartyId);
        const entityClass = classifyEntity(aggregate.counterpartyId, pData, sampleTx);
        const score = sampleTx ? getRelationshipScore(sampleTx, aggregate, newestTimestamp) : 0;
        const riskFlags = sampleTx ? getRiskFlags(sampleTx, aggregate, pData) : [];
        const confidence = Number(aggregate.confidenceAverage || sampleTx?.confidence || 0.5);
        const confidenceLabel: 'high' | 'medium' | 'low' = confidence >= 0.85 ? 'high' : confidence >= 0.65 ? 'medium' : 'low';

        return {
          partyId: aggregate.counterpartyId,
          score,
          confidence,
          confidenceLabel,
          entityClass,
          direction: aggregate.direction,
          totalAmount: aggregate.totalAmount,
          transferCount: aggregate.transferCount,
          firstSeen: aggregate.firstSeen,
          riskFlags,
          lastSeen: aggregate.lastSeen,
          interactionKinds: aggregate.interactionKinds,
          semanticTags: aggregate.semanticTags,
        };
      })
      .sort((a, b) => b.score - a.score || b.totalAmount - a.totalAmount || b.transferCount - a.transferCount);

    const totalIncoming = counterpartyRanking.reduce((sum, item) => {
      const aggregate = aggregateMap.get(item.partyId);
      return sum + (aggregate?.incomingAmount || 0);
    }, 0);
    const totalOutgoing = counterpartyRanking.reduce((sum, item) => {
      const aggregate = aggregateMap.get(item.partyId);
      return sum + (aggregate?.outgoingAmount || 0);
    }, 0);
    const walletRiskFlags = Array.from(new Set(counterpartyRanking.flatMap(item => item.riskFlags)));
    const walletSummary: WalletSummary = {
      totalIncoming,
      totalOutgoing,
      netFlow: totalIncoming - totalOutgoing,
      uniqueCounterparties: counterpartyRanking.length,
      strongestCounterparty: counterpartyRanking[0] || null,
      mostRecentCounterparty: [...counterpartyRanking].sort((a, b) => b.lastSeen - a.lastSeen)[0] || null,
      riskFlags: walletRiskFlags,
      validatorInteractions: counterpartyRanking.filter(item => item.entityClass === 'VALIDATOR' || item.entityClass === 'SUPER_VALIDATOR').length,
      appInteractions: counterpartyRanking.filter(item => item.entityClass === 'APP' || item.entityClass === 'FEE_ACCOUNT').length,
    };

    const relationshipSummary: RelationshipSummary = {
      totalRelationships: counterpartyRanking.length,
      highConfidenceRelationships: counterpartyRanking.filter(item => item.confidenceLabel === 'high').length,
      mediumConfidenceRelationships: counterpartyRanking.filter(item => item.confidenceLabel === 'medium').length,
      lowConfidenceRelationships: counterpartyRanking.filter(item => item.confidenceLabel === 'low').length,
      validatorRelationships: counterpartyRanking.filter(item => item.entityClass === 'VALIDATOR' || item.entityClass === 'SUPER_VALIDATOR').length,
      appRelationships: counterpartyRanking.filter(item => item.entityClass === 'APP' || item.entityClass === 'FEE_ACCOUNT').length,
      governanceRelationships: counterpartyRanking.filter(item => item.entityClass === 'GOVERNANCE' || item.interactionKinds.includes('GOVERNANCE')).length,
      rewardRelationships: counterpartyRanking.filter(item => item.entityClass === 'REWARD_SOURCE' || item.interactionKinds.includes('REWARD')).length,
    };

    const firstSeen = counterpartyRanking.reduce((min, item) => {
      if (!item.firstSeen) return min;
      return min === 0 ? item.firstSeen : Math.min(min, item.firstSeen);
    }, 0);
    const lastSeen = counterpartyRanking.reduce((max, item) => Math.max(max, item.lastSeen || 0), 0);

    const timelineCounts = enrichedTransactions.reduce<Record<TimelineBucket, number>>((acc, tx) => {
      const bucket = tx.timelineBucket || 'UNKNOWN';
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {
      HOT_24H: 0,
      ACTIVE_7D: 0,
      ACTIVE_30D: 0,
      STALE: 0,
      UNKNOWN: 0,
    });

    const peakWindow = (Object.entries(timelineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN') as TimelineBucket;
    const activeDays = firstSeen && lastSeen ? Math.max(1, Math.ceil((lastSeen - firstSeen) / 86400000)) : 0;
    const recentActivityScore = Math.min(
      100,
      Math.round(
        (timelineCounts.HOT_24H * 12) +
        (timelineCounts.ACTIVE_7D * 6) +
        (timelineCounts.ACTIVE_30D * 3) +
        Math.min(20, counterpartyRanking.length)
      )
    );

    const temporalSummary: TemporalSummary = {
      firstSeen,
      lastSeen,
      peakWindow,
      recentActivityScore,
      activeDays,
    };

    const clusterBuckets = new Map<ClusterHint['type'], CounterpartyRank[]>();
    counterpartyRanking.forEach((item) => {
      let clusterType: ClusterHint['type'] | null = null;
      if (item.entityClass === 'VALIDATOR' || item.entityClass === 'SUPER_VALIDATOR') clusterType = 'VALIDATOR';
      else if (item.entityClass === 'APP' || item.entityClass === 'FEE_ACCOUNT') clusterType = 'APP';
      else if (item.entityClass === 'GOVERNANCE' || item.interactionKinds.includes('GOVERNANCE')) clusterType = 'GOVERNANCE';
      else if (item.transferCount >= 2 || item.score >= 45) clusterType = 'OPERATIONS';

      if (!clusterType) return;
      const existing = clusterBuckets.get(clusterType) || [];
      existing.push(item);
      clusterBuckets.set(clusterType, existing);
    });

    const clusterHints: ClusterHint[] = Array.from(clusterBuckets.entries())
      .map(([type, items]) => ({
        id: `cluster-${type.toLowerCase()}`,
        type,
        label: `${type.toLowerCase()}_district`,
        memberPartyIds: items.map(item => item.partyId),
        strength: Math.round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(1, items.length)),
      }))
      .filter(cluster => cluster.memberPartyIds.length > 0)
      .sort((a, b) => b.strength - a.strength);

    const suppressedPartyIds = counterpartyRanking
      .filter(item =>
        item.partyId !== centralId &&
        item.confidenceLabel === 'low' &&
        item.transferCount <= 1 &&
        item.score < 35
      )
      .map(item => item.partyId);

    const promotedPartyIds = counterpartyRanking
      .filter(item =>
        item.confidenceLabel === 'high' ||
        item.score >= 70 ||
        item.entityClass === 'VALIDATOR' ||
        item.entityClass === 'SUPER_VALIDATOR' ||
        item.entityClass === 'GOVERNANCE'
      )
      .slice(0, 12)
      .map(item => item.partyId);

    const noiseSuppression: NoiseSuppressionSummary = {
      suppressedPartyIds,
      promotedPartyIds,
    };

    const scoreMap = new Map<string, number>();
    enrichedTransactions.forEach((tx) => {
      const score = tx.relationshipScore || 0;
      scoreMap.set(tx.fromId, Math.max(scoreMap.get(tx.fromId) || 0, score));
      scoreMap.set(tx.toId, Math.max(scoreMap.get(tx.toId) || 0, score));
      tx.counterpartyIds?.forEach(id => scoreMap.set(id, Math.max(scoreMap.get(id) || 0, score)));
    });

    const allBuildings: Building[] = Array.from(activePartyIds).map((id) => {
      const isCenter = id === centralId;
      const txCount = txCountMap.get(id) || 0;
      const pData = partyDataMap.get(id);
      
      let bType: Building['type'] = 'PARTICIPANT';
      if (isCenter) bType = 'CENTER';
      else if (pData?._roleHint === 'SUPER_VALIDATOR' || pData?.svId) bType = 'SUPER_VALIDATOR';
      else if (pData?._roleHint === 'VALIDATOR' || pData?.validator || id.toLowerCase().includes('validator')) bType = 'VALIDATOR';

      const holdings = Number(pData?.balance || pData?.totalRewards || valueMap.get(id) || 0);
      const relationshipScore = scoreMap.get(id) || 0;
      const lastSeen = recencyMap.get(id) || 0;
      const recentScore = newestTimestamp && lastSeen ? Math.max(0, 10 - ((newestTimestamp - lastSeen) / 86400000)) : 0;
      const dominantAction = enrichedTransactions.find(tx => tx.fromId === id || tx.toId === id)?.action || 'SIGNAL';

      return {
        id,
        party: shortPartyLabel(id),
        height: isCenter ? 85 : Math.max(getRelationWeight(txCount, holdings, recentScore), Math.min(95, relationshipScore)), 
        color: isCenter ? '#06b6d4' : getActionColor(dominantAction, (bType === 'SUPER_VALIDATOR' ? '#fbbf24' : (bType === 'VALIDATOR' ? '#ec4899' : '#1e40af'))), 
        type: bType,
        transactionCount: txCount,
        coinHoldings: holdings,
        isVerified: pData?.isVerified || pData?._isActiveValidator || false
      };
    });

    const apiHealth = (rawData as any)?._apiHealth || rawArtifacts[0]?._apiHealth || null;
    set({
      transactions: enrichedTransactions,
      counterpartyRanking,
      walletSummary,
      relationshipSummary,
      temporalSummary,
      clusterHints,
      noiseSuppression,
      apiHealth,
      isScanning: false
    }); 

    const BATCH_SIZE = 40;
    for (let i = 0; i < allBuildings.length; i += BATCH_SIZE) {
      const chunk = allBuildings.slice(i, i + BATCH_SIZE);
      set((state) => ({ buildings: [...state.buildings, ...chunk] }));
      await new Promise(resolve => setTimeout(resolve, 16));
    }
  },

  setError: (error) => set({ error, isScanning: false }),

  setFocusedParty: (partyId) => set({ focusedPartyId: partyId }),

  setHighlightedParties: (partyIds) => set({ highlightedPartyIds: Array.from(new Set(partyIds.filter(Boolean))) }),

  setHighlightedCluster: (clusterId) => set({ highlightedClusterId: clusterId }),

  clearHighlights: () => set({
    focusedPartyId: null,
    highlightedPartyIds: [],
    highlightedClusterId: null,
  }),

  resetScanner: () => set({
    centralNodeId: null, isScannerActive: true, isScanning: false,
    error: null, buildings: [], transactions: [], marketMetrics: null, apiHealth: null,
    counterpartyRanking: [], walletSummary: null, relationshipSummary: null, temporalSummary: null,
    clusterHints: [], noiseSuppression: null, focusedPartyId: null, highlightedPartyIds: [],
    highlightedClusterId: null, selectedTransactionId: null,
    isInspectorOpen: false, isHUDVisible: true, isLeftPanelCollapsed: false
  }),

  setSelectedTransaction: (id) => set({ selectedTransactionId: id, isInspectorOpen: !!id }),
  closeInspector: () => set({ isInspectorOpen: false, selectedTransactionId: null }),
  toggleHUD: () => set((state) => ({ isHUDVisible: !state.isHUDVisible })),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelCollapsed: !state.isLeftPanelCollapsed }))
}));
