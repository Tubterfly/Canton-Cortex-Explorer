import {
  annotateArtifact,
  attachPartyProfiles,
  collectProfileTargets,
  fetchDeepPages,
  fetchPartyProfileMap,
  fetchPersonalTransferPages,
  modoFetch,
  normalizeValidatorMetadata,
  strictEpoch,
} from './cantonApi.helpers';
export { modoFetch };


// ============================================================================
// 3. FULL OMNI-API SUITE (DOCUMENTATION V8 - ULTIMATE SYNC)
// ============================================================================

// --- DASHBOARD ---
export const fetchDashboard = async () => modoFetch('/dashboard');

// --- UPDATES ---
export const fetchUpdates = async () => 
  fetchDeepPages('/updates', 4, "AGE");

export const fetchUpdateRawDetails = async (updateId: string) => {
  // UpdateID genellikle safe'tir, ancak WAF koruması için encodeURIComponent eklendi.
  return modoFetch(`/updates/${encodeURIComponent(updateId)}/raw-details`); 
}

// --- CONTRACTS ---
export const fetchContracts = async () => 
  fetchDeepPages('/contracts', 2, "AGE");

export const fetchContractDetails = async (contractId: string) => 
  modoFetch(`/contracts/${encodeURIComponent(contractId)}`);

export const fetchContractEvents = async (contractId: string, cursor = '', size = 20) => {
  const params: Record<string, string | number> = {
    sortBy: "AGE",
    size: size,
    orderBy: "DESC"
  };

  if (cursor) {
    params.nextCursor = cursor;
  }

  return modoFetch(`/contracts/${encodeURIComponent(contractId)}/events`, params);
};

// --- PARTIES & IDENTITY ---
export const fetchNetworkParties = async (_token?: string) => {
  const [parties, validators] = await Promise.all([
    fetchDeepPages('/parties', 2, "LAST_ACTIVITY_AT"),
    fetchValidators()
  ]);

  return [
    ...(parties || []).map((item: any) => ({ ...item, _metadataSource: item._metadataSource || 'parties' })),
    ...normalizeValidatorMetadata(validators)
  ];
};

export const fetchTopParties = async () => 
  fetchDeepPages('/parties/top', 4, "BALANCE");

export const fetchPartyDetails = async (id: string) => {
  // PartyID'ler çift nokta (::) içerdiği için kesinlikle encode edilmelidir.
  return modoFetch(`/parties/${encodeURIComponent(id)}`);
}

export const fetchPartyTypes = async (id: string) => {
  return modoFetch(`/parties/${encodeURIComponent(id)}/types`);
}

// --- VALIDATORS & SUPER VALIDATORS ---
export const fetchValidators = async () => {
  const [standard, superVals, newValids] = await Promise.all([
    modoFetch('/validators', { sortBy: "LAST_ACTIVE", status: "ALL", page: 0, size: 100, orderBy: "DESC" }),
    fetchDeepPages('/super-validators', 2, "REWARD"),
    modoFetch('/validators/new', { size: 20 })
  ]);
  return { standard: standard?.content || [], super: superVals || [], new: newValids || [] };
};

// --- GLOBAL EVENTS ---
export const fetchEvents = async () => 
  fetchDeepPages('/events', 4, "AGE");

export const fetchEventDetails = async (eventId: string) => 
  modoFetch(`/events/${encodeURIComponent(eventId)}`);

// --- FEATURED APPS ---
export const fetchFeaturedApps = async () => 
  fetchDeepPages('/featured-apps', 2);

export const fetchFeaturedAppDetails = async (contractId: string) => 
  modoFetch(`/featured-apps/${encodeURIComponent(contractId)}`);

// --- GOVERNANCE & VOTING ---
export const fetchGovernanceSuite = async () => {
  const [requests, votes] = await Promise.all([
    fetchDeepPages('/governance/vote-requests', 2), 
    fetchDeepPages('/governance/vote-requests/votes', 2) 
  ]);
  return { requests: requests || [], votes: votes || [] };
};

export const fetchVoteRequestDetails = async (id: string) => 
  modoFetch(`/governance/vote-requests/${encodeURIComponent(id)}/details`);

export const fetchVotesByRequest = async (id: string) => 
  fetchDeepPages(`/governance/vote-requests/${encodeURIComponent(id)}/votes`, 2);

// --- MARKET & TOKENS ---
export const fetchMarketIntelligence = async () => {
  const [market, price, tokens] = await Promise.all([
    modoFetch('/market/get-market-info'),
    modoFetch('/market/get-price'),
    fetchDeepPages('/tokens', 2, "CREATED_AT")
  ]);
  return { market, price, tokens: tokens || [] };
};

export const fetchTokenDetails = async (contractId: string) => 
  modoFetch(`/tokens/${encodeURIComponent(contractId)}`);

// --- TRANSFERS & REWARDS ---
export const fetchRewards = async (partyId: string) => {
   // PartyID'ler çift nokta (::) içerdiği için encodeURIComponent ile sarmalandı.
  return fetchDeepPages(`/rewards/${encodeURIComponent(partyId)}`, 4);
}

export const fetchPersonalTransfers = async (partyId: string, cursor = '', role = 'ANY') => {
  const params: Record<string, string | number> = {
    role: role,
    sortBy: "AGE",
    size: 50,
    orderBy: "DESC"
  };

  if (cursor) {
    params.nextCursor = cursor;
  }

  return modoFetch(`/transfers/${encodeURIComponent(partyId)}`, params);
};

// ============================================================================
// 4. MASTER NEXUS ENGINE (CHRONOS & KEY PROTECTOR)
// ============================================================================

export const getHybridContractHistory = async (_token: string, partyId: string) => {
  addLogToConsole(`Initiating Targeted Relationship Scan...`);
  
  const [updates, contracts, events, transfers, voteRequests, voteEntries, apps, partyRewards, personalTransfers] = await Promise.all([
    fetchDeepPages('/updates', 2, "AGE"),        
    fetchDeepPages('/contracts', 2, "AGE"),      
    fetchDeepPages('/events', 3, "AGE"),         
    fetchDeepPages('/transfers', 1, "CREATED_AT"),
    fetchDeepPages('/governance/vote-requests', 2), 
    fetchDeepPages('/governance/vote-requests/votes', 2), 
    fetchDeepPages('/featured-apps', 1),
    partyId ? fetchRewards(partyId) : [],
    partyId ? fetchPersonalTransferPages(partyId, 6) : []
  ]);

  const rawPool = [
    ...(personalTransfers || []).map((item: any) => ({ item, source: 'TRF', healthSource: 'personalTransfers' })),
    ...(partyRewards || []).map((item: any) => ({ item, source: 'RWD', healthSource: 'rewards' })),
    ...(transfers || []).map((item: any) => ({ item, source: 'TRF', healthSource: 'transfers' })),
    ...(events || []).map((item: any) => ({ item, source: 'EVT', healthSource: 'events' })),
    ...(contracts || []).map((item: any) => ({ item, source: item.provider ? 'APP' : (item.symbol ? 'TKN' : 'CTR'), healthSource: 'contracts' })),
    ...(updates || []).map((item: any) => ({ item, source: 'UPD', healthSource: 'updates' })),
    ...(voteRequests || []).map((item: any) => ({ item, source: 'VOT', healthSource: 'governance' })),
    ...(voteEntries || []).map((item: any) => ({ item, source: 'VOT', healthSource: 'governance' })),
    ...(apps || []).map((item: any) => ({ item, source: 'APP', healthSource: 'apps' })),
  ];

  const apiHealth: any = {
    updates: { fetched: updates?.length || 0, linked: 0 },
    contracts: { fetched: contracts?.length || 0, linked: 0 },
    events: { fetched: events?.length || 0, linked: 0 },
    transfers: { fetched: transfers?.length || 0, linked: 0 },
    personalTransfers: { fetched: personalTransfers?.length || 0, linked: 0 },
    rewards: { fetched: partyRewards?.length || 0, linked: 0 },
    governance: { fetched: (voteRequests?.length || 0) + (voteEntries?.length || 0), linked: 0 },
    apps: { fetched: apps?.length || 0, linked: 0 },
    profiles: { requested: 0, enriched: 0 },
    warnings: [] as string[],
  };

  const sourceToHealthKey: Record<string, string> = {
    UPD: 'updates',
    CTR: 'contracts',
    TKN: 'contracts',
    EVT: 'events',
    TRF: 'transfers',
    RWD: 'rewards',
    VOT: 'governance',
    APP: 'apps',
  };

  if (rawPool.length > 0) {
    const processedMap = new Map();

    rawPool.forEach(({ item, source, healthSource }: any) => {
      const rawId = item.updateld || item.updateId || item.eventId || item.eventld || item.contractid || item.contractId || item.transferId || item.voteRequestId || item.trackingCid || item.id;
      let type = source;
      if (source === 'EVT' && item.inputAppRewardAmount !== undefined) type = 'RWD';

      const uniqueKey = `${type}-${rawId || Math.random()}`;

      if (!processedMap.has(uniqueKey)) {
        const rawTime = item.recordTime || item.effectiveAt || item.createdAt || item.timestamp || item.updateTimestamp || item.optCastAt || item.voteBefore || 0;
        const safeMs = strictEpoch(rawTime);
        const semanticItem = annotateArtifact(item, type, partyId);
        if (!semanticItem) return;
        const healthKey = healthSource || sourceToHealthKey[type] || 'events';
        if (apiHealth[healthKey]) apiHealth[healthKey].linked += 1;

        processedMap.set(uniqueKey, {
          ...semanticItem,
          _uniqueKey: uniqueKey, 
          _safeEpoch: safeMs,    
          _source: type          
        });
      }
    });

    const sorted = Array.from(processedMap.values()).sort((a, b) => b._safeEpoch - a._safeEpoch);
    const profileTargets = collectProfileTargets(sorted, partyId, 25);
    apiHealth.profiles.requested = profileTargets.length;
    const profiles = await fetchPartyProfileMap(profileTargets);
    apiHealth.profiles.enriched = profiles.size;
    if (sorted.length === 0) apiHealth.warnings.push('NO_SEMANTIC_RELATIONSHIPS_LINKED');
    if (profileTargets.length > profiles.size) apiHealth.warnings.push('PARTIAL_PROFILE_ENRICHMENT');
    const enriched = attachPartyProfiles(sorted, profiles).map((item: any) => ({ ...item, _apiHealth: apiHealth }));
    addLogToConsole(`Relationship Scan Complete: ${enriched.length} Target-Linked Artifacts Unified. ${profiles.size} Party Profiles Enriched.`);
    return Object.assign(enriched, { _apiHealth: apiHealth });
  }

  apiHealth.warnings.push('NO_RAW_ENDPOINT_DATA');
  return Object.assign([], { _apiHealth: apiHealth });
};
const addLogToConsole = (msg: string) => console.log(`[Nexus_Strict_Uplink] ${msg}`);

