'use client';

import React, { useState, useMemo, memo, useCallback, useTransition } from 'react';
import { useCityStore, type Transaction } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow';
import { 
  Activity, Search, ShieldAlert, 
  Database, Copy, Check, Binary,
  Clock, ArrowRight, Zap,
  Share2, Coins, User, Timer,
  Vote, ArrowLeftRight, RefreshCw, FileText,
  Award, Flame 
} from 'lucide-react';

const ROW_HEIGHT = 85; 
const VISIBLE_ROWS = 12;
const TABS = ['Transactions', 'Transfer', 'CIP-56 Activity', 'Governance', 'Reward', 'PnL'];

/**
 * NEURAL ID TRUNCATION
 */
const truncateId = (id: string, start = 8, end = 6) => {
  if (!id || id === 'Unknown' || id.includes('Isolated')) {
    return <span className="text-cyan-900/40 italic font-black uppercase tracking-widest">Encrypted_Artifact</span>;
  }
  const prefix = id.includes('-') ? id.split('-')[0] + '-' : '';
  const body = id.includes('-') ? id.split('-')[1] : id;
  return (
    <span className="group-hover:text-cyan-400 transition-colors">
      <span className="text-cyan-600 font-black">{prefix}</span>
      {body.substring(0, start)}...{body.substring(body.length - end)}
    </span>
  );
};

/**
 * TEMPORAL FORMATTER
 */
const formatNeuralDate = (epoch: number) => {
  if (!epoch || epoch <= 0) return { date: '---', time: 'CHRONOS_OFFLINE', ms: '000' };
  const d = new Date(epoch);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ms: d.getMilliseconds().toString().padStart(3, '0') 
  };
};

const getSourceIcon = (action: string) => {
  switch (action) {
    case 'TRF': return <ArrowLeftRight size={12} className="text-blue-400" />;
    case 'VOT': return <Vote size={12} className="text-purple-400" />;
    case 'UPD': return <RefreshCw size={12} className="text-cyan-400" />;
    case 'CTR': return <FileText size={12} className="text-green-400" />;
    case 'EVT': return <Zap size={12} className="text-yellow-400" />;
    case 'RWD': return <Award size={12} className="text-amber-500" />;
    case 'TKN': return <Coins size={12} className="text-pink-500" />;
    default: return <Binary size={12} className="text-cyan-900" />;
  }
};

/**
 * CONTRACT ROW: OMNI-DATA TRANSPARENCY UI (ANALYST GRADE)
 */
const ContractRow = memo(({ 
  tx, isSelected, onSelect, onCopy, copiedField, top, centralNodeId 
}: { 
  tx: Transaction, isSelected: boolean, onSelect: (tx: Transaction) => void, 
  onCopy: (text: string) => void, copiedField: string | null, top: number, centralNodeId: string | null
}) => {
  const recordTime = formatNeuralDate(tx.timestamp);
  const effectiveAt = formatNeuralDate(tx.effectiveAt);

  const isIncoming = tx.toId === centralNodeId;
  const isOutgoing = tx.fromId === centralNodeId;
  const isSelf = isIncoming && isOutgoing;

  const {
    relationshipKind, confidenceLabel, relationDirection, riskFlags,
    relationshipScore, entityClass, timelineBucket, semanticTags
  } = tx;

  let amountColor = 'text-white/20';
  let amountPrefix = '';
  
  if (isSelf) {
    amountColor = 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]';
    amountPrefix = '⟳ ';
  } else if (isIncoming) {
    amountColor = 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]';
    amountPrefix = '+ ';
  } else if (isOutgoing) {
    amountColor = 'text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]';
    amountPrefix = '- ';
  }

  const hasAmount = tx.amount !== undefined && Number(tx.amount) > 0;
  const amountDisplay = hasAmount 
    ? `${amountPrefix}${Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })}` 
    : '---';

  const isHotActivity = timelineBucket === 'HOT_24H' || (relationshipScore && relationshipScore >= 80);
  const rowBackground = isSelected 
    ? 'bg-cyan-500/[0.1] border-l-2 border-l-cyan-400 shadow-[inset_10px_0_30px_rgba(6,182,212,0.05)]' 
    : isHotActivity 
      ? 'bg-pink-500/[0.02] border-l-2 border-l-pink-500/40 hover:bg-white/[0.02]' 
      : 'hover:bg-white/[0.01] border-l-2 border-l-transparent';

  return (
    <div 
      className={`absolute left-0 right-0 flex items-center group transition-all duration-200 cursor-crosshair border-b border-white/[0.02] will-change-transform ${rowBackground}`}
      style={{ height: ROW_HEIGHT, transform: `translateY(${top}px)` }}
      onClick={() => onSelect(tx)} // ID yerine TX objesini iletiyoruz
    >
      <div className="px-6 w-44 shrink-0 font-mono text-[10px] text-white/40 flex items-center gap-3 relative overflow-hidden">
        {getSourceIcon(tx.action)}
        <div className="flex-1 flex items-center gap-2">
          {truncateId(tx.id, 6, 4)}
          {riskFlags && riskFlags.length > 0 && (
            <span title={riskFlags.join(', ')} className="shrink-0">
              <ShieldAlert size={12} className="text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
            </span>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onCopy(tx.id); }}
            className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 transition-all p-1"
          >
            {copiedField === tx.id ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
          </button>
        </div>
      </div>

      <div className="px-6 w-80 shrink-0 flex items-center gap-2">
        <div className={`flex items-center gap-2 bg-white/[0.02] border rounded px-2 py-1.5 transition-colors group-hover:border-pink-500/20 max-w-[130px] ${isOutgoing ? 'border-pink-500/40 bg-pink-500/5' : 'border-white/5'}`}>
          <User size={10} className={isOutgoing ? 'text-pink-400' : 'text-pink-500/50'} />
          <span className={`text-[10px] font-black truncate uppercase tracking-tighter ${isOutgoing ? 'text-pink-100' : 'text-white/80'}`}>
            {tx.fromId?.split('::')[0]}
          </span>
        </div>
        
        <div className="flex flex-col items-center justify-center min-w-[36px]">
           <span className="text-[6px] text-cyan-500/50 uppercase tracking-widest mb-0.5">{relationDirection || '---'}</span>
           <ArrowRight size={10} className={`${isIncoming ? 'text-green-500' : isOutgoing ? 'text-pink-500' : 'text-white/10'} shrink-0`} />
           {entityClass && entityClass !== 'UNKNOWN' && (
             <span className="text-[5px] text-blue-400/80 uppercase mt-0.5 max-w-[36px] truncate" title={entityClass}>
               {entityClass.replace('_', ' ')}
             </span>
           )}
        </div>

        <div className={`flex items-center gap-2 bg-white/[0.02] border rounded px-2 py-1.5 transition-colors group-hover:border-green-500/20 max-w-[130px] ${isIncoming ? 'border-green-500/40 bg-green-500/5' : 'border-white/5'}`}>
          <Share2 size={10} className={isIncoming ? 'text-green-400' : 'text-blue-500/50'} />
          <span className={`text-[10px] font-bold truncate uppercase tracking-tighter ${isIncoming ? 'text-green-100' : 'text-white/50'}`}>
            {tx.toId?.split('::')[0] || 'LEDGER_HUB'}
          </span>
        </div>
      </div>

      <div className="px-6 w-32 shrink-0 flex flex-col gap-1.5 justify-center">
        <div className={`inline-flex items-center justify-center gap-2 px-3 py-1 border rounded-sm transition-all duration-500 ${
          isSelected ? 'bg-cyan-400 text-black border-cyan-400' : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-100'
        }`}>
          <Zap size={10} className={isSelected ? 'text-black' : 'text-yellow-500 animate-pulse'} />
          <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
            {tx.action === 'UPD' ? 'UPDATE' : tx.action === 'TRF' ? 'TRANSFER' : tx.action === 'VOT' ? 'VOTE' : tx.action === 'RWD' ? 'REWARD' : 'SIGNAL'}
          </span>
        </div>
        {relationshipScore !== undefined && (
          <div className="flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-widest w-full">
            <span className={`w-1.5 h-1.5 rounded-full ${confidenceLabel === 'high' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : confidenceLabel === 'low' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-white/40">SCR:</span>
            <span className={`font-black ${relationshipScore >= 80 ? 'text-green-400' : relationshipScore <= 30 ? 'text-red-400' : 'text-yellow-400'}`}>
              {relationshipScore.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      <div className="px-6 flex-1 min-w-[150px] flex flex-col justify-center gap-1.5 overflow-hidden">
        <div className="font-mono text-[9px] text-white/30 italic tracking-tighter truncate group-hover:text-cyan-200 transition-colors">
          {tx.templateId || 'SYSTEM_CORE_LOGIC'}
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {timelineBucket === 'HOT_24H' && (
            <span className="flex items-center gap-0.5 text-[7px] font-black text-pink-400 bg-pink-500/10 px-1 py-0.5 rounded-sm border border-pink-500/20 shrink-0">
              <Flame size={8} /> HOT
            </span>
          )}
          {relationshipKind && relationshipKind !== 'EVENT' && (
            <span className="text-[7px] font-black text-purple-400 bg-purple-500/10 px-1 py-0.5 border border-purple-500/20 rounded-sm uppercase tracking-widest shrink-0">
              [{relationshipKind}]
            </span>
          )}
          {semanticTags?.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-[7px] text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded-sm border border-blue-500/20 uppercase tracking-widest truncate">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 w-40 shrink-0 text-right">
        <span className={`text-[11px] font-mono font-black tabular-nums transition-colors ${amountColor}`}>
          {amountDisplay}
        </span>
      </div>

      <div className="px-6 w-48 shrink-0 flex flex-col items-end">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-white/80 font-black tabular-nums">{recordTime.time}</span>
          <span className="text-[8px] text-pink-500/50 font-mono font-bold">.{recordTime.ms}</span>
        </div>
        <span className="text-[7px] text-white/10 uppercase tracking-[0.2em] font-black">{recordTime.date}</span>
      </div>

      <div className="px-6 w-48 shrink-0 flex flex-col items-end border-l border-white/5 bg-white/[0.01]">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-cyan-400 font-black tabular-nums">{effectiveAt.time}</span>
          <span className="text-[8px] text-cyan-600 font-mono font-bold">.{effectiveAt.ms}</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer size={8} className="text-cyan-900" />
          <span className="text-[7px] text-cyan-900 uppercase font-black tracking-tighter">Verified</span>
        </div>
      </div>
    </div>
  );
});

ContractRow.displayName = 'ContractRow';

const ContractTable = () => {
  // --- KRİTİK CERRAHİ: SHALLOW SELECTOR ---
  const { 
    transactions, centralNodeId, isScanning, selectedTransactionId, 
    clusterHints, setSelectedTransaction, setHighlightedParties, setFocusedParty, setHighlightedCluster 
  } = useCityStore(
    useShallow((state) => ({
      transactions: state.transactions,
      centralNodeId: state.centralNodeId,
      isScanning: state.isScanning,
      selectedTransactionId: state.selectedTransactionId,
      clusterHints: state.clusterHints,
      setSelectedTransaction: state.setSelectedTransaction,
      setHighlightedParties: state.setHighlightedParties,
      setFocusedParty: state.setFocusedParty,
      setHighlightedCluster: state.setHighlightedCluster
    }))
  );

  const [activeTab, setActiveTab] = useState('Transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filteredTransactions = useMemo(() => {
    const raw = Array.isArray(transactions) ? transactions : [];
    return raw.filter(tx => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        tx.id.toLowerCase().includes(s) || 
        tx.templateId.toLowerCase().includes(s) ||
        tx.fromId?.toLowerCase().includes(s) ||
        tx.toId?.toLowerCase().includes(s) ||
        tx.relationshipKind?.toLowerCase().includes(s);

      const matchesTab = 
        activeTab === 'Transactions' || 
        (activeTab === 'Transfer' && tx.action === 'TRF') ||
        (activeTab === 'Governance' && tx.action === 'VOT') ||
        (activeTab === 'Reward' && tx.action === 'RWD') ||
        (activeTab === 'CIP-56 Activity' && tx.action === 'EVT') ||
        (activeTab === 'PnL' && (tx.action === 'TKN' || tx.action === 'APP'));

      return matchesSearch && matchesTab;
    });
  }, [transactions, searchTerm, activeTab]);

  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const endIndex = Math.min(filteredTransactions.length - 1, startIndex + VISIBLE_ROWS + 5);
  const visibleData = filteredTransactions.slice(startIndex, endIndex + 1);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleCopy = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  // --- YENİ ETKİLEŞİM YÖNETİCİSİ ---
  const handleRowSelect = useCallback((tx: Transaction) => {
    startTransition(() => {
      // 1. Orijinal davranış: Inspector'ı aç
      setSelectedTransaction(tx.id);

      // 2. İlgili partileri vurgula
      const partiesToHighlight = new Set<string>();
      if (tx.fromId) partiesToHighlight.add(tx.fromId);
      if (tx.toId) partiesToHighlight.add(tx.toId);
      if (tx.counterpartyIds) {
        tx.counterpartyIds.forEach(id => partiesToHighlight.add(id));
      }
      setHighlightedParties(Array.from(partiesToHighlight));

      // 3. Karşı tarafı (Central Node olmayan) focus yap
      let focusId = null;
      if (tx.fromId !== centralNodeId) focusId = tx.fromId;
      else if (tx.toId !== centralNodeId) focusId = tx.toId;
      setFocusedParty(focusId);

      // 4. Mümkünse gerçek cluster id tespit et ve bağla
      let clusterId = null;
      const relatedPartyIds = Array.from(partiesToHighlight);
      const matchedCluster = clusterHints.find(cluster =>
        cluster.memberPartyIds.some(id => relatedPartyIds.includes(id))
      );

      if (matchedCluster) {
        clusterId = matchedCluster.id;
      } else if (tx.entityClass === 'VALIDATOR' || tx.entityClass === 'SUPER_VALIDATOR') {
        clusterId = clusterHints.find(cluster => cluster.type === 'VALIDATOR')?.id || null;
      } else if (tx.entityClass === 'APP' || tx.entityClass === 'CONTRACT') {
        clusterId = clusterHints.find(cluster => cluster.type === 'APP')?.id || null;
      } else if (tx.entityClass === 'GOVERNANCE') {
        clusterId = clusterHints.find(cluster => cluster.type === 'GOVERNANCE')?.id || null;
      }
      setHighlightedCluster(clusterId);
    });
  }, [centralNodeId, clusterHints, setSelectedTransaction, setHighlightedParties, setFocusedParty, setHighlightedCluster]);

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col font-mono selection:bg-cyan-500/30 overflow-hidden border-t border-cyan-500/10">
      
      <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-md z-30">
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-full border border-white/5 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.15)] scale-105' : 'text-white/20 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-6 shrink-0 ml-4">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              type="text" 
              placeholder="FILTER_OMNI_STREAM..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/[0.02] border border-white/5 rounded-full pl-10 pr-6 py-2 text-[10px] w-64 outline-none focus:border-cyan-500/30 transition-all text-cyan-100 placeholder:text-white/5"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4">
        <div className="flex items-center text-white/10 text-[9px] font-black uppercase tracking-[0.4em] py-5 px-6 border-b border-white/5 bg-black/20 sticky top-0 z-40">
          <div className="w-44 px-2 flex items-center gap-2"><Binary size={10} /> Artifact_ID</div>
          <div className="w-80 px-2 flex items-center gap-2"><User size={10} /> Entity_Parties</div>
          <div className="w-32 px-2 flex items-center gap-2"><Zap size={10} /> Action_Intel</div>
          <div className="flex-1 px-2 flex items-center gap-2"><Database size={10} /> Logic_Semantics</div>
          <div className="w-40 px-2 text-right flex items-center justify-end gap-2"><Coins size={10} /> Value_Stream</div>
          <div className="w-48 px-2 text-right flex items-center justify-end gap-2"><Clock size={10} /> Sync_Time</div>
          <div className="w-48 px-2 text-right flex items-center justify-end gap-2 text-cyan-500/40"><Activity size={10} /> Effective</div>
        </div>

        <div 
          onScroll={onScroll}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-cyan-900/40 relative z-20"
        >
          {filteredTransactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
              <ShieldAlert size={48} className="animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">No_Neural_Artifacts_Found</p>
            </div>
          ) : (
            <div style={{ height: filteredTransactions.length * ROW_HEIGHT, position: 'relative' }}>
              {visibleData.map((tx, index) => (
                <ContractRow 
                  key={tx.id}
                  tx={tx}
                  top={(startIndex + index) * ROW_HEIGHT}
                  isSelected={selectedTransactionId === tx.id}
                  onSelect={handleRowSelect} // YENİ: Etkileşim yöneticisi bağlandı
                  onCopy={handleCopy}
                  copiedField={copiedField}
                  centralNodeId={centralNodeId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="h-10 border-t border-white/5 px-8 flex items-center justify-between text-[9px] text-white/10 font-bold uppercase tracking-widest bg-black/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500/50'}`} />
            <span className={isScanning ? 'text-yellow-500/50' : 'text-green-500/30'}>
              {isScanning ? 'OMNI_SYNC_ACTIVE' : 'TERMINAL_STABLE'}
            </span>
          </div>
          <div className="w-[1px] h-3 bg-white/5" />
          <span className="text-white/5 italic">Streams: {filteredTransactions.length} Artifacts Indexted</span>
        </div>
        <div className="flex items-center gap-4 opacity-20">
           <Activity size={12} />
           <span>Neural_Temporal_Stream_v5.1</span>
        </div>
      </footer>
    </div>
  );
};

export default memo(ContractTable);
