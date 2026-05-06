const API_CACHE_TTL_MS = 5 * 60 * 1000;
const apiCache = new Map<string, { expiresAt: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();

type PartyRef = {
  id: string;
  path: string;
};

type RelationshipKind = 'TRANSFER' | 'REWARD' | 'GOVERNANCE' | 'APP' | 'CONTRACT' | 'EVENT' | 'UPDATE';

type SemanticRelationship = {
  kind: RelationshipKind;
  confidence: number;
  fromId: string;
  toId: string;
  targetRole: string;
  counterpartyIds: string[];
  amount?: number;
  direction: 'INBOUND' | 'OUTBOUND' | 'NEUTRAL';
  semanticTags: string[];
};

const SYSTEM_PARTIES = new Set(['DSO']);

const stableParamString = (params: Record<string, any>) => {
  return JSON.stringify(
    Object.keys(params || {})
      .sort()
      .reduce((acc: Record<string, any>, key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') acc[key] = value;
        return acc;
      }, {})
  );
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetryModoError = (error: any) => {
  const status = error.response?.status;
  return !status || status === 408 || status === 429 || status >= 500;
};

export const modoFetch = async (endpoint: string, params: Record<string, any> = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = `${cleanEndpoint}?${stableParamString(params)}`;
  const cached = apiCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const existingRequest = inFlightRequests.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const query = new URLSearchParams({
          endpoint: cleanEndpoint,
          params: JSON.stringify(params || {})
        });

        const response = await fetch(`/api/modo?${query.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const requestError = {
            response: {
              status: response.status,
              data: errorData?.error || errorData
            }
          };
          throw requestError;
        }

        const data = await response.json();
        apiCache.set(cacheKey, { expiresAt: Date.now() + API_CACHE_TTL_MS, data });
        return data;
      } catch (error: any) {
        if (error.response?.status === 403) {
          console.warn(`[API_WARNING] ${cleanEndpoint}: Forbidden (403). Endpoint may be restricted.`);
          return null;
        }

        if (attempt < 2 && shouldRetryModoError(error)) {
          await wait(350 * (attempt + 1));
          continue;
        }

        console.error(`[API_ERROR] ${cleanEndpoint}:`, error.response?.data || error.message);
        return null;
      }
    }
    return null;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};

export const fetchDeepPages = async (endpoint: string, maxPages = 4, sortBy?: string) => {
  const promises = [];
  for (let i = 0; i < maxPages; i++) {
    const queryParams: any = { page: i, size: 100 };
    if (sortBy) {
      queryParams.sortBy = sortBy;
      queryParams.orderBy = "DESC";
    }
    promises.push(modoFetch(endpoint, queryParams));
  }
  const results = await Promise.all(promises);
  return results.flatMap(res => res?.content || (Array.isArray(res) ? res : []));
};

export const normalizeValidatorMetadata = (validators: any) => {
  const standard = (validators.standard || []).map((item: any) => ({
    ...item,
    partyId: item.validator,
    accountName: item.validatorName || item.validator?.split('::')[0],
    imageUrl: item.validatorImg || item.sponsorImg || null,
    _roleHint: 'VALIDATOR',
    _metadataSource: 'validators',
    _isActiveValidator: item.active ?? true,
  }));

  const superValidators = (validators.super || []).map((item: any) => ({
    ...item,
    partyId: item.svId,
    accountName: item.validatorName || item.svName || item.svId?.split('::')[0],
    imageUrl: item.validatorImg || null,
    _roleHint: 'SUPER_VALIDATOR',
    _metadataSource: 'super-validators',
    _isActiveValidator: true,
  }));

  const newValidators = (validators.new || []).map((item: any) => ({
    ...item,
    partyId: item.validator,
    accountName: item.validatorName || item.validator?.split('::')[0],
    imageUrl: item.validatorImg || item.sponsorImg || null,
    _roleHint: 'VALIDATOR',
    _metadataSource: 'validators-new',
    _isActiveValidator: item.active ?? false,
  }));

  return [...standard, ...superValidators, ...newValidators];
};

export const isPartyLike = (value: unknown): value is string => {
  return typeof value === 'string' && value.includes('::') && value.length > 12;
};

const safeParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const collectPartyRefs = (value: unknown, path = '', refs: PartyRef[] = [], depth = 0): PartyRef[] => {
  if (value == null || depth > 7) return refs;

  const parsed = safeParseJson(value);
  if (parsed !== value) return collectPartyRefs(parsed, path, refs, depth + 1);

  if (isPartyLike(value)) {
    refs.push({ id: value, path });
    return refs;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectPartyRefs(entry, `${path}[${index}]`, refs, depth + 1));
    return refs;
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      collectPartyRefs(entry, path ? `${path}.${key}` : key, refs, depth + 1);
    });
  }

  return refs;
};

export const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

const partyName = (partyId: string): string => partyId.split('::')[0] || partyId;

const isSystemParty = (partyId: string): boolean => SYSTEM_PARTIES.has(partyName(partyId).toUpperCase());

const firstPartyId = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.map((entry: any) => entry?.partyId || entry?.id || entry?.party).find(isPartyLike);
};

const relationHubId = (prefix: string, item: any): string => {
  const label = item.templateName || item.provider || item.packageName || item.workflowId || item.voteRequestId || item.contractId || item.eventId || item.updateId || 'LEDGER';
  return `${prefix}:${String(label).slice(0, 64)}`;
};

const numericAmount = (item: any): number | undefined => {
  const direct = Number(item.amount ?? item.initialAmount ?? item.rewardAmount ?? item.inputAppRewardAmount);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const parsedArgs = safeParseJson(item.createArguments);
  if (typeof parsedArgs === 'object' && parsedArgs) {
    const amount = Number((parsedArgs as any).amount?.initialAmount ?? (parsedArgs as any).amount);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  return undefined;
};

const getConfidenceLabel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.65) return 'medium';
  return 'low';
};

const buildSemanticTags = (
  source: string,
  item: any,
  relationship: Pick<SemanticRelationship, 'kind' | 'counterpartyIds' | 'amount' | 'confidence'>,
): string[] => {
  const tags = new Set<string>();

  tags.add(`kind:${relationship.kind.toLowerCase()}`);
  tags.add(`confidence:${getConfidenceLabel(relationship.confidence)}`);

  if ((relationship.counterpartyIds || []).length >= 3) tags.add('multi-counterparty');
  if ((relationship.amount || 0) > 0) tags.add('value-bearing');
  if ((relationship.amount || 0) >= 100) tags.add('high-value');

  if (source === 'APP' || item.provider || item.creatorAccount) tags.add('app-linked');
  if (source === 'VOT' || item.voteRequestId || item.voteBefore) tags.add('governance-linked');
  if (source === 'RWD' || item.rewardAmount !== undefined || item.inputAppRewardAmount !== undefined) tags.add('reward-linked');
  if (item.validator || item.svId || item.validatorName || item.svName) tags.add('validator-linked');
  if (item.symbol || item.tokenSymbol) tags.add('token-linked');

  return Array.from(tags);
};

export const annotateArtifact = (item: any, source: string, partyId: string): any | null => {
  if (!item || !partyId) return null;

  const senderIds = unique([
    firstPartyId(item.senders),
    item.fromId,
    item.senderId,
    item.senderPartyId,
    item.transferor,
  ].filter(isPartyLike));

  const receiverIds = unique([
    firstPartyId(item.receivers),
    item.toId,
    item.receiverId,
    item.receiverPartyId,
    item.transferee,
  ].filter(isPartyLike));

  const amount = numericAmount(item);
  let relationship: SemanticRelationship | null = null;

  if (source === 'RWD') {
    relationship = {
      kind: 'REWARD',
      confidence: 0.95,
      fromId: 'CANTON_REWARDS',
      toId: partyId,
      targetRole: 'reward_beneficiary',
      counterpartyIds: [],
      amount,
      direction: 'INBOUND',
      semanticTags: [],
    };
  }

  if (senderIds.includes(partyId) || receiverIds.includes(partyId)) {
    const targetIsSender = senderIds.includes(partyId);
    const counterpartyIds = unique([...(targetIsSender ? receiverIds : senderIds), ...senderIds, ...receiverIds])
      .filter(id => id !== partyId && !isSystemParty(id));

    relationship = {
      kind: 'TRANSFER',
      confidence: 1,
      fromId: targetIsSender ? partyId : (senderIds[0] || 'TRANSFER_SOURCE'),
      toId: targetIsSender ? (receiverIds[0] || 'TRANSFER_SINK') : partyId,
      targetRole: targetIsSender ? 'sender' : 'receiver',
      counterpartyIds,
      amount,
      direction: targetIsSender ? 'OUTBOUND' : 'INBOUND',
      semanticTags: [],
    };
  }

  const refs = collectPartyRefs(item);
  const targetRefs = refs.filter(ref => ref.id === partyId);
  if (!relationship && targetRefs.length === 0) return null;

  if (!relationship) {
    const parties = unique(refs.map(ref => ref.id)).filter(id => id !== partyId && !isSystemParty(id));
    const targetPath = targetRefs[0]?.path.toLowerCase() || '';
    const hubPrefix = source === 'VOT' ? 'GOVERNANCE' : source === 'APP' ? 'APP' : 'CONTRACT';

    let kind: RelationshipKind = 'EVENT';
    if (source === 'RWD' || targetPath.includes('reward')) kind = 'REWARD';
    else if (source === 'VOT') kind = 'GOVERNANCE';
    else if (source === 'APP') kind = 'APP';
    else if (source === 'CTR' || source === 'TKN') kind = 'CONTRACT';
    else if (source === 'UPD') kind = 'UPDATE';

    const targetLooksLikeOwner = /owner|sender|from|provider|requester|voter|act/i.test(targetPath);
    const otherParty = parties[0];
    const hub = relationHubId(hubPrefix, item);

    relationship = {
      kind,
      confidence: otherParty ? 0.72 : 0.55,
      fromId: targetLooksLikeOwner ? partyId : (otherParty || hub),
      toId: targetLooksLikeOwner ? (otherParty || hub) : partyId,
      targetRole: targetPath || 'mentioned_party',
      counterpartyIds: parties,
      amount,
      direction: targetLooksLikeOwner ? 'OUTBOUND' : 'INBOUND',
      semanticTags: [],
    };
  }

  relationship.semanticTags = buildSemanticTags(source, item, relationship);

  return {
    ...item,
    _relationship: relationship,
    _fromId: relationship.fromId,
    _toId: relationship.toId,
    _amount: relationship.amount,
    _confidence: relationship.confidence,
    _counterpartyIds: relationship.counterpartyIds,
    _direction: relationship.direction,
    _semanticTags: relationship.semanticTags,
    _confidenceLabel: getConfidenceLabel(relationship.confidence),
  };
};

export const fetchPersonalTransferPages = async (partyId: string, maxPages = 4, role = 'ANY') => {
  const collected: any[] = [];
  let cursor = '';

  for (let i = 0; i < maxPages; i++) {
    const params: Record<string, string | number> = {
      role,
      sortBy: "AGE",
      size: 50,
      orderBy: "DESC"
    };

    if (cursor) {
      params.nextCursor = cursor;
    }

    const page = await modoFetch(`/transfers/${encodeURIComponent(partyId)}`, params);
    const content = page?.content || [];
    collected.push(...content);
    if (!page?.hasNextPage || !page?.nextCursor) break;
    cursor = page.nextCursor;
  }

  return collected;
};

export const collectProfileTargets = (artifacts: any[], targetPartyId: string, limit = 25): string[] => {
  const scores = new Map<string, number>();

  artifacts.forEach((item) => {
    const ids = [
      item._fromId,
      item._toId,
      ...(item._counterpartyIds || []),
    ].filter((id) => isPartyLike(id) && id !== targetPartyId);

    ids.forEach((id) => {
      const valueScore = Number(item._amount || item.amount || 0) || 0;
      scores.set(id, (scores.get(id) || 0) + 1 + Math.log10(valueScore + 1));
    });
  });

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
};

export const fetchPartyProfileMap = async (partyIds: string[]) => {
  const entries = await Promise.all(
    partyIds.map(async (id) => {
      const profile = await modoFetch(`/parties/${encodeURIComponent(id)}`);
      if (!profile) return null;
      return [id, {
        ...profile,
        _metadataSource: 'party-detail',
      }] as const;
    })
  );

  return new Map(entries.filter(Boolean) as Array<readonly [string, any]>);
};

export const attachPartyProfiles = (artifacts: any[], profiles: Map<string, any>) => {
  if (profiles.size === 0) return artifacts;

  return artifacts.map((item) => {
    const relatedIds = unique([
      item._fromId,
      item._toId,
      ...(item._counterpartyIds || []),
    ].filter(isPartyLike));

    const relatedProfiles = relatedIds.reduce((acc: Record<string, any>, id) => {
      const profile = profiles.get(id);
      if (profile) acc[id] = profile;
      return acc;
    }, {});

    return {
      ...item,
      _partyProfiles: relatedProfiles,
    };
  });
};

export const strictEpoch = (val: any): number => {
  if (!val) return 0;
  const num = typeof val === 'string' ? (val.includes('-') ? Date.parse(val) : Number(val)) : val;
  if (isNaN(num) || num <= 0) return 0;
  const len = num.toString().length;
  if (len === 10) return num * 1000;
  if (len === 13) return num;
  if (len === 16) return Math.floor(num / 1000);
  if (len >= 19) return Math.floor(num / 1000000);
  return num;
};
