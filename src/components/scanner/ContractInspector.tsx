'use client';

import React, { useEffect, useMemo, useRef, memo, useState, useCallback } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow'; // Re-render koruma kalkanı
import { 
  X, Shield, Users, Clock, 
  Zap, Fingerprint, Code,
  Copy, Check, Share2, ArrowRight, Activity, Database,
  AlertTriangle, Tag, BarChart2, Target, Network
} from 'lucide-react';

/**
 * CONTRACT INSPECTOR: NEURAL DATA ANALYZER (v6.1 - ANALYST GRADE)
 * Atomic Selectors: useShallow ile sadece ilgili state değişimleri izlenir.
 * Arkham Integration: Relationship Intelligence, Risk Flags ve Aggregate Summary eklendi.
 * Cyberpunk UI: Orijinal neon parlamalar, glitch efektleri ve terminal stili korundu.
 */
const ContractInspector = () => {
  // --- KRİTİK CERRAHİ: SHALLOW ATOMİK SELECTORLAR ---
  const { isInspectorOpen, closeInspector, centralNodeId, selectedTransactionId, transactions } = useCityStore(
    useShallow((state) => ({
      isInspectorOpen: state.isInspectorOpen,
      closeInspector: state.closeInspector,
      centralNodeId: state.centralNodeId,
      selectedTransactionId: state.selectedTransactionId,
      transactions: state.transactions
    }))
  );

  // Seçili kontratı verimli bir şekilde izole ediyoruz.
  const selectedContract = useMemo(() => 
    transactions.find(t => t.id === selectedTransactionId),
    [transactions, selectedTransactionId]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Arkham Intelligence Tarzı Görünüm Geçişi
  const [viewMode, setViewMode] = useState<'decoded' | 'raw'>('decoded');

  // Arkham Style: JSON'u tablo verisine dönüştürme (Decoded View)
  const decodedPayload = useMemo(() => {
    if (!selectedContract?.payload) return [];
    // İç sistem değişkenlerini (_ ile başlayanlar) gizleyerek temiz veri sunuyoruz.
    return Object.entries(selectedContract.payload).filter(([key]) => !key.startsWith('_'));
  }, [selectedContract]);

  // JSON DEŞİFRE MOTORU: Ağır veri yüklerini UI thread'ini dondurmadan işler.
  const rawPayloadString = useMemo(() => {
    if (!selectedContract?.payload || Object.keys(selectedContract.payload).length === 0) {
      return '// NO_ARGUMENTS_DETECTED_IN_ARTIFACT';
    }
    try {
      return JSON.stringify(selectedContract.payload, null, 2);
    } catch {
      return '// ERROR_DECRYPTING_DATA_PAYLOAD';
    }
  }, [selectedContract]);

  // Kopyalama Mekanizması
  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInspectorOpen) closeInspector();
    };
    
    if (isInspectorOpen) {
      window.addEventListener('keydown', handleKeyDown);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen, closeInspector]);

  if (!isInspectorOpen || !selectedContract) return null;

  // --- ANALYST GRADE FIELD EXTRACTION ---
  const relKind = selectedContract.relationshipKind || 'UNKNOWN';
  const confLabel = selectedContract.confidenceLabel || 'N/A';
  const relScore = selectedContract.relationshipScore || 0;
  const relDir = selectedContract.relationDirection || '---';
  
  const entityClass = selectedContract.entityClass;
  const timelineBucket = selectedContract.timelineBucket;
  const riskFlags = selectedContract.riskFlags || [];
  const semanticTags = selectedContract.semanticTags || [];
  const agg = selectedContract.aggregate;

  /**
   * IDENTITY RENDERING: Siber kimlikleri mühürler ve görselleştirir.
   */
  const renderIdentityBadge = (id: string, label: string) => {
    const isIsolated = !id || id === 'Unknown' || id.includes('Isolated') || id.includes('REDACTED');
    const isOwner = id === centralNodeId;
    const isSystem = id === 'LEDGER_DOMAIN' || id === 'NETWORK_UPLINK';
    
    return (
      <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-right duration-500 will-change-transform">
        <div className="flex justify-between items-center px-1">
          <p className={`text-[9px] uppercase font-black tracking-[0.3em] ${label === 'Source_Node' ? 'text-pink-500/80' : 'text-blue-500/80'}`}>
            {label}
          </p>
          <button 
            onClick={() => handleCopy(id, label)}
            className="opacity-20 hover:opacity-100 transition-opacity"
          >
            {copiedField === label ? <Check size={10} className="text-green-500" /> : <Copy size={10} className="text-white" />}
          </button>
        </div>
        <div className={`p-4 rounded-sm border transition-all duration-500 relative group overflow-hidden ${
          isOwner 
            ? 'bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
            : isSystem 
              ? 'bg-white/[0.01] border-white/5' 
              : 'bg-white/[0.02] border-white/10 hover:border-cyan-500/30'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="flex items-center gap-3 relative z-10">
            {isOwner ? <Shield size={14} className="text-cyan-400 shrink-0" /> : <Users size={14} className="text-white/40 shrink-0" />}
            <p className={`text-[10px] font-mono break-all font-bold leading-relaxed ${
              isIsolated ? 'text-cyan-900 italic animate-pulse' : (isOwner ? 'text-cyan-300' : 'text-white/70')
            }`}>
              {isIsolated ? 'ENCRYPTED_BY_PRIVACY_ISOLATION_PROTOCOL' : id}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-[420px] bg-[#050505]/95 border-l border-cyan-500/30 backdrop-blur-xl z-[100] flex flex-col shadow-[-40px_0_120px_rgba(0,0,0,0.95)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform pointer-events-auto will-change-transform ${
        isInspectorOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* SEKTÖR 1: HEADER */}
      <div className="p-7 border-b border-cyan-500/20 bg-cyan-500/[0.03] relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-cyan-400 font-black tracking-[0.4em] uppercase flex items-center gap-3 text-xs">
              <Activity size={16} className="text-pink-500 animate-pulse" /> 
              Neural_Artifact_Intel
            </h2>
            <div className="flex items-center gap-3 mt-4 group cursor-pointer" onClick={() => handleCopy(selectedContract.id, 'UID')}>
              <Fingerprint size={14} className={copiedField === 'UID' ? 'text-green-500' : 'text-cyan-800'} />
              <p className="text-[10px] text-cyan-700 font-mono break-all leading-tight tracking-tighter">
                UID: <span className="text-cyan-300 font-bold group-hover:text-white transition-colors">{selectedContract.id}</span>
              </p>
            </div>
          </div>
          <button onClick={closeInspector} className="p-2 hover:bg-red-500/20 hover:text-red-500 text-white/10 transition-all rounded-sm border border-white/5 hover:border-red-500/40 group">
            <X size={22} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* SEKTÖR 2: CORE ANALYSIS & DECODED DATA */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-7 space-y-8 scrollbar-thin scrollbar-thumb-cyan-950 scrollbar-track-transparent will-change-scroll"
      >
        
        {/* NEW: RELATIONSHIP INTELLIGENCE SUMMARY */}
        <section className="grid grid-cols-4 gap-2">
          <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-sm flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-[7px] text-cyan-500/50 uppercase tracking-widest font-black">Kind</span>
            <span className="text-[9px] text-cyan-300 font-bold uppercase truncate w-full">{relKind}</span>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-sm flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-[7px] text-cyan-500/50 uppercase tracking-widest font-black">Confidence</span>
            <span className={`text-[9px] font-bold uppercase truncate w-full ${confLabel === 'high' ? 'text-green-400' : confLabel === 'low' ? 'text-red-400' : 'text-yellow-400'}`}>
              {confLabel}
            </span>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-sm flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-[7px] text-cyan-500/50 uppercase tracking-widest font-black">Score</span>
            <span className="text-[11px] text-white font-black tabular-nums">{relScore.toFixed(0)}</span>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-sm flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-[7px] text-cyan-500/50 uppercase tracking-widest font-black">Direction</span>
            <span className="text-[9px] text-pink-400 font-bold uppercase truncate w-full">{relDir}</span>
          </div>
        </section>

        {/* NEW: ANALYSIS BADGES (Tags, Risks, Class, Timeline) */}
        <section className="space-y-3">
          <h3 className="text-[9px] text-white/30 font-black uppercase tracking-[0.4em] flex items-center gap-2">
            <Target size={12} className="text-cyan-600" /> Intelligence_Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {entityClass && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/40 rounded-sm">
                <Shield size={10} className="text-blue-400" />
                <span className="text-[8px] text-blue-300 font-black uppercase tracking-widest">{entityClass}</span>
              </div>
            )}
            {timelineBucket && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/40 rounded-sm">
                <Clock size={10} className="text-purple-400" />
                <span className="text-[8px] text-purple-300 font-black uppercase tracking-widest">{timelineBucket}</span>
              </div>
            )}
            {semanticTags.map((tag, idx) => (
              <div key={`tag-${idx}`} className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/40 rounded-sm">
                <Tag size={10} className="text-green-400" />
                <span className="text-[8px] text-green-300 font-black uppercase tracking-widest">{tag}</span>
              </div>
            ))}
            {riskFlags.map((flag, idx) => (
              <div key={`risk-${idx}`} className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/40 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <AlertTriangle size={10} className="text-red-400 animate-pulse" />
                <span className="text-[8px] text-red-300 font-black uppercase tracking-widest">{flag}</span>
              </div>
            ))}
            {!entityClass && !timelineBucket && semanticTags.length === 0 && riskFlags.length === 0 && (
              <span className="text-[9px] text-white/20 italic uppercase tracking-widest">No_Tags_Detected</span>
            )}
          </div>
        </section>

        {/* VALUE FLOW: Arkham Tarzı Akış Şeması */}
        <section className="space-y-4 bg-black/40 p-5 rounded-sm border border-white/5 shadow-inner">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] text-cyan-500/40 font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <Share2 size={14} className="text-cyan-400" /> Value_Vector_Flow
            </h3>
            {Number(selectedContract.amount) > 0 && (
              <span className="text-[11px] font-mono font-black text-green-400 bg-green-500/10 px-3 py-1 rounded-sm border border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                {Number(selectedContract.amount).toLocaleString()} {selectedContract.payload?.tokenSymbol || 'AMT'}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-4 relative">
            {renderIdentityBadge(selectedContract.fromId, 'Source_Node')}
            
            <div className="flex justify-center -my-3 relative z-10">
              <div className="bg-[#050505] p-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <ArrowRight size={14} className="text-cyan-400" />
              </div>
            </div>
            
            {renderIdentityBadge(selectedContract.toId, 'Destination_Node')}
          </div>
        </section>

        {/* NEW: AGGREGATE SUMMARY (If exists) */}
        {agg && (
          <section className="space-y-4">
            <h3 className="text-[9px] text-white/30 font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <BarChart2 size={12} className="text-yellow-500" /> Counterparty_Aggregate
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-1">
                <span className="text-[7px] text-white/40 uppercase tracking-widest">Transfer_Count</span>
                <span className="text-[11px] text-white font-mono font-bold">{agg.transferCount}</span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-1">
                <span className="text-[7px] text-white/40 uppercase tracking-widest">Total_Volume</span>
                <span className="text-[11px] text-green-400 font-mono font-bold">
                  {agg.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} CC
                </span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-1">
                <span className="text-[7px] text-white/40 uppercase tracking-widest">In / Out Flow</span>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                  <span className="text-green-400">+{agg.incomingAmount.toLocaleString()}</span>
                  <span className="text-white/20">/</span>
                  <span className="text-pink-400">-{agg.outgoingAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-1">
                <span className="text-[7px] text-white/40 uppercase tracking-widest">Avg_Amount</span>
                <span className="text-[11px] text-white font-mono font-bold">
                  {agg.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} CC
                </span>
              </div>
              <div className="col-span-2 p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[7px] text-white/40 uppercase tracking-widest">Observation_Window</span>
                  <span className="text-[8px] text-cyan-500 font-mono">
                    {agg.firstSeen > 0 ? new Date(agg.firstSeen).toLocaleDateString() : '---'} <span className="text-white/30">TO</span> {agg.lastSeen > 0 ? new Date(agg.lastSeen).toLocaleDateString() : '---'}
                  </span>
                </div>
                {agg.interactionKinds && agg.interactionKinds.length > 0 && (
                  <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                    <span className="text-[7px] text-white/40 uppercase tracking-widest">Interaction_Kinds</span>
                    <span className="text-[8px] text-white/70 uppercase font-black">{agg.interactionKinds.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* NEURAL LOGIC TEMPLATE */}
        <section className="space-y-4 border-t border-white/5 pt-6 mt-2">
          <h3 className="text-[10px] text-cyan-500/40 font-black uppercase tracking-[0.4em] flex items-center gap-2">
            <Network size={14} className="text-pink-500" /> Neural_Logic_Template
          </h3>
          <div className="p-4 bg-white/[0.01] border border-pink-500/20 rounded-sm shadow-[inset_0_0_20px_rgba(236,72,153,0.02)]">
            <p className="text-pink-100/80 text-[10px] font-mono font-bold break-all tracking-tight italic">
              {selectedContract.templateId}
            </p>
          </div>
        </section>

        {/* PAYLOAD DECODER (Arkham Intelligence Style Toggle - Pushed to Secondary) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-cyan-500/40 font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <Code size={14} className="text-cyan-400" /> Payload_Data_Matrix
            </h3>
            
            <div className="flex bg-cyan-950/30 rounded-sm p-0.5 border border-cyan-500/20">
              <button 
                onClick={() => setViewMode('decoded')} 
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${viewMode === 'decoded' ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-white/20 hover:text-white/50'}`}
              >
                Decoded
              </button>
              <button 
                onClick={() => setViewMode('raw')} 
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${viewMode === 'raw' ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-white/20 hover:text-white/50'}`}
              >
                Raw_JSON
              </button>
            </div>
          </div>

          <div className="bg-black/60 border border-cyan-500/20 rounded-sm relative group overflow-hidden min-h-[150px] shadow-inner">
            {viewMode === 'decoded' ? (
              <div className="flex flex-col divide-y divide-white/5">
                {decodedPayload.map(([key, value], idx) => (
                  <div key={idx} className="flex justify-between items-start p-4 hover:bg-cyan-500/5 transition-colors">
                    <span className="text-[10px] text-cyan-600 font-black uppercase tracking-widest w-1/3 break-words">
                      {key}
                    </span>
                    <span className="text-[10px] text-cyan-100/80 font-mono font-bold w-2/3 text-right break-words">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
                {decodedPayload.length === 0 && (
                  <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-cyan-900/50">
                    No_Decodable_Parameters_Found
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 relative">
                <button 
                  onClick={() => handleCopy(rawPayloadString, 'payload')}
                  className="absolute top-4 right-4 text-white/10 hover:text-cyan-400 transition-colors z-10"
                >
                  {copiedField === 'payload' ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <pre className="text-[10px] font-mono text-cyan-200/60 whitespace-pre-wrap break-all leading-relaxed">
                  {rawPayloadString}
                </pre>
              </div>
            )}
          </div>
        </section>

        {/* TEMPORAL STAMPS */}
        <section className="space-y-4">
          <h3 className="text-[10px] text-cyan-500/40 font-black uppercase tracking-[0.4em] flex items-center gap-2">
            <Clock size={14} className="text-cyan-400" /> Ledger_Chronology
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:border-cyan-500/30 transition-colors">
              <p className="text-[8px] text-white/20 uppercase font-black mb-1 tracking-widest">Sync_Time</p>
              <p className="text-[10px] text-white/80 font-mono font-black tabular-nums">
                {new Date(selectedContract.timestamp).toLocaleTimeString([], { hour12: false })}
                <span className="text-cyan-500/50 text-[8px] ml-1">.{new Date(selectedContract.timestamp).getMilliseconds().toString().padStart(3, '0')}</span>
              </p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:border-cyan-500/30 transition-colors">
              <p className="text-[8px] text-white/20 uppercase font-black mb-1 tracking-widest">Global_Date</p>
              <p className="text-[10px] text-white/80 font-mono font-black tabular-nums">
                {new Date(selectedContract.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* SEKTÖR 3: FOOTER */}
      <div className="p-7 border-t border-cyan-500/20 bg-black/95 relative shrink-0">
        <div className="absolute inset-0 bg-cyan-500/[0.01] pointer-events-none" />
        <div className="flex items-center justify-center gap-4 py-4 border border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <Zap size={16} className="text-cyan-400 animate-pulse" />
          <span className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.4em]">Artifact_Deconstructed</span>
        </div>
      </div>
    </div>
  );
};

export default memo(ContractInspector);
