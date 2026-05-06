'use client';

import React, { useMemo, memo, useState, useEffect } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow'; 
import MetricsCard from './MetricsCard';
import ContractInspector from '../scanner/ContractInspector';
import { 
  ShieldCheck, 
  Activity, 
  LayoutGrid, 
  Terminal, 
  Globe,
  Radio,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Waves,
  Scan,
  AlertCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Focus,
  Network 
} from 'lucide-react';

/**
 * HUD: THE NEURAL COMMAND INTERFACE (v6.3 - ACCESSIBILITY & OVERFLOW FIX)
 * Optimizasyon: useShallow ile atomik state takibi ve GPU katman izolasyonu.
 * Geliştirme: Clipping (buton gizlenmesi) ve Vertical Overflow (dikey taşma) sorunları çözüldü.
 */
const HUD = () => {
  const { 
    centralNodeId, 
    transactions, 
    isInspectorOpen, 
    isScanning,
    buildings,
    isLeftPanelCollapsed, 
    toggleLeftPanel,
    marketMetrics,
    apiHealth,
    walletSummary,
    temporalSummary,
    clusterHints,
    focusedPartyId,
    highlightedPartyIds,
    highlightedClusterId
  } = useCityStore(
    useShallow((state) => ({
      centralNodeId: state.centralNodeId,
      transactions: state.transactions,
      isInspectorOpen: state.isInspectorOpen,
      isScanning: state.isScanning,
      buildings: state.buildings,
      isLeftPanelCollapsed: state.isLeftPanelCollapsed,
      toggleLeftPanel: state.toggleLeftPanel,
      marketMetrics: state.marketMetrics,
      apiHealth: state.apiHealth,
      walletSummary: state.walletSummary,
      temporalSummary: state.temporalSummary,
      clusterHints: state.clusterHints,
      focusedPartyId: state.focusedPartyId,
      highlightedPartyIds: state.highlightedPartyIds || [],
      highlightedClusterId: state.highlightedClusterId
    }))
  );

  const [syncProgress, setSyncProgress] = useState(0);
  const [latency, setLatency] = useState('24');
  
  useEffect(() => {
    if (!isScanning) return;

    let currentProgress = 0;
    const tick = () => {
      currentProgress = Math.min(100, currentProgress + Math.random() * 15);
      setSyncProgress(currentProgress);
      setLatency((Math.random() * 20 + 240).toFixed(0));
    };

    const initialReset = window.setTimeout(() => setSyncProgress(0), 0);
    const initialTick = window.setTimeout(tick, 16);
    const interval = window.setInterval(tick, 400);

    return () => {
      window.clearTimeout(initialReset);
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, [isScanning]);

  const metrics = useMemo(() => {
    const vCount = buildings?.filter(b => b.type === 'VALIDATOR' || b.type === 'SUPER_VALIDATOR').length || 0;
    const activeTx = transactions?.length || 0;
    const networkLoad = Math.min(((buildings?.length || 0) / 150) * 100, 100).toFixed(1);
    
    return {
      validatorCount: vCount,
      activeContracts: activeTx,
      throughput: marketMetrics?.tps?.toFixed(1) || (activeTx * 0.8).toFixed(1),
      load: networkLoad,
      latency: isScanning ? latency : '24',
      health: apiHealth?.warnings?.length === 0 ? 'Optimal' : 'Interference'
    };
  }, [buildings, transactions, isScanning, marketMetrics, apiHealth, latency]);

  const interactionContext = useMemo(() => {
    const isInteracting = !!focusedPartyId || highlightedPartyIds.length > 0;
    const activeCluster = highlightedClusterId 
      ? clusterHints?.find(c => c.id === highlightedClusterId) 
      : null;
    return { isInteracting, activeCluster };
  }, [focusedPartyId, highlightedPartyIds, highlightedClusterId, clusterHints]);

  const displayedSyncProgress = isScanning ? syncProgress : 0;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col p-8 overflow-visible select-none">
      
      <div className="flex-1 relative">
        
        {/* --- LEFT HUD SECTOR: IDENTITY & VITALS --- */}
        <div 
          className={`absolute top-0 left-0 w-85 flex flex-col gap-6 transition-all duration-1000 cubic-bezier(0.19, 1, 0.22, 1) will-change-transform max-h-[calc(100vh-220px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-cyan-950/50 pointer-events-auto ${
            isLeftPanelCollapsed ? '-translate-x-[calc(100%-40px)] opacity-40' : 'translate-x-0 opacity-100'
          }`}
        >
          {/* 1. IDENTITY MODULE & NEURAL RADAR */}
          <section className="relative p-6 bg-black/95 border-l-4 border-cyan-500 backdrop-blur-3xl shadow-[20px_20px_60px_rgba(0,0,0,0.9)] group overflow-visible shrink-0">
            
            {/* COLLAPSE TRIGGER */}
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLeftPanel(); }}
              className="absolute -right-10 top-0 bottom-0 w-10 bg-cyan-950/80 border-y border-r border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all group/btn shadow-2xl z-20"
            >
              {isLeftPanelCollapsed ? <ChevronRight size={18} className="animate-pulse" /> : <ChevronLeft size={18} />}
            </button>

            {/* NEURAL RADAR (Visible when collapsed) */}
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-500 pointer-events-none ${isLeftPanelCollapsed ? 'opacity-100' : 'opacity-0'}`}>
               <div className="w-12 h-12 border-2 border-cyan-500/20 rounded-full flex items-center justify-center relative">
                  <Scan size={20} className="text-cyan-500 animate-pulse" />
                  <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin duration-[3s]" />
               </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] text-cyan-500/60 uppercase font-black tracking-[0.4em] flex items-center gap-3">
                <Globe size={14} className="text-cyan-400 animate-[spin_10s_linear_infinite]" /> Identity_Link_Scope
              </h3>
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-yellow-500 animate-ping' : 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'}`} />
            </div>

            {/* TARGET ID BLOCK */}
            <div className={`bg-cyan-950/30 p-4 border border-cyan-500/10 rounded-sm relative transition-all duration-700 ${isLeftPanelCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
              <p className="text-[11px] text-cyan-100 break-all font-mono font-bold tracking-tight leading-relaxed drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                {centralNodeId || 'AWAITING_NEURAL_HANDSHAKE...'}
              </p>
              
              {/* NEURAL SYNC PROGRESS BAR (Scanning mode) */}
              {isScanning && (
                <div className="mt-4 h-1 w-full bg-white/5 overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308] transition-all duration-500" 
                    style={{ width: `${displayedSyncProgress}%` }} 
                  />
                </div>
              )}
            </div>

            <div className={`mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 transition-opacity duration-700 ${isLeftPanelCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Neural_Status</span>
                <span className={`text-[10px] font-black uppercase italic tracking-wider ${isScanning ? 'text-yellow-500 animate-pulse' : 'text-cyan-400'}`}>
                  {isScanning ? 'Decrypting_Sync...' : 'Isolated_Uplink'}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Active_Nodes</span>
                <span className="text-[10px] text-white font-black tabular-nums tracking-widest">
                  {buildings?.length.toString().padStart(3, '0') || '000'}
                </span>
              </div>
            </div>

            {/* --- COMPACT TARGET INTELLIGENCE / INTERACTION OVERLAY --- */}
            {!isScanning && walletSummary && (
              <div className={`mt-5 pt-5 border-t border-cyan-900/50 transition-opacity duration-700 ${isLeftPanelCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                {interactionContext.isInteracting ? (
                  // --- INTERACTION MODE ---
                  <>
                    <h4 className="text-[9px] text-cyan-300 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                      <Focus size={12} className="animate-pulse" /> Interaction_Context
                    </h4>
                    <div className="flex flex-col gap-2">
                      {/* Focused Node */}
                      {focusedPartyId && (
                        <div className="flex justify-between items-center bg-cyan-400/10 px-3 py-2 rounded-sm border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                          <span className="text-[8px] text-cyan-100/80 uppercase tracking-widest">Focused_Node</span>
                          <span className="text-[9px] text-cyan-300 font-bold tracking-widest uppercase truncate max-w-[110px]">
                            {focusedPartyId.split('::')[0]}
                          </span>
                        </div>
                      )}
                      
                      {/* Highlighted Links */}
                      {highlightedPartyIds.length > 0 && (
                        <div className="flex justify-between items-center bg-cyan-950/30 px-3 py-2 rounded-sm border border-cyan-500/20">
                          <span className="text-[8px] text-cyan-100/60 uppercase tracking-widest flex items-center gap-1">
                            <Network size={8} /> Active_Links
                          </span>
                          <span className="text-[9px] text-yellow-400 font-bold tracking-widest uppercase">
                            {highlightedPartyIds.length} Nodes
                          </span>
                        </div>
                      )}

                      {/* Cluster Context */}
                      {(interactionContext.activeCluster || highlightedClusterId) && (
                        <div className="flex justify-between items-center bg-purple-900/10 px-3 py-2 rounded-sm border border-purple-500/20">
                          <span className="text-[8px] text-purple-300/60 uppercase tracking-widest">District</span>
                          <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase truncate max-w-[100px]">
                            {interactionContext.activeCluster ? interactionContext.activeCluster.label : highlightedClusterId}
                          </span>
                        </div>
                      )}

                      {/* Strongest Signal / Confidence Context */}
                      {walletSummary.strongestCounterparty && (
                        <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 rounded-sm border border-cyan-500/10 mt-1">
                          <span className="text-[8px] text-cyan-100/60 uppercase tracking-widest">Top_Signal</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase ${walletSummary.strongestCounterparty.confidenceLabel === 'high' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {walletSummary.strongestCounterparty.confidenceLabel}
                            </span>
                            <span className="text-white/20">/</span>
                            <span className="text-[9px] font-mono text-cyan-300">
                              {walletSummary.strongestCounterparty.score.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // --- DEFAULT TARGET INTEL BRIEF ---
                  <>
                    <h4 className="text-[9px] text-cyan-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                      <Target size={12} /> Target_Intel_Brief
                    </h4>
                    <div className="flex flex-col gap-2">
                      {/* Net Flow Vector */}
                      <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 rounded-sm border border-cyan-500/10">
                        <span className="text-[8px] text-cyan-100/60 uppercase tracking-widest">Net_Flow_Vector</span>
                        <div className="flex items-center gap-1.5">
                          {walletSummary.netFlow > 0 ? <TrendingUp size={10} className="text-green-400" /> : <TrendingDown size={10} className="text-pink-400" />}
                          <span className={`text-[11px] font-mono font-black ${walletSummary.netFlow > 0 ? 'text-green-400' : 'text-pink-400'}`}>
                            {walletSummary.netFlow > 0 ? '+' : ''}{walletSummary.netFlow.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Peak Activity Window */}
                      {temporalSummary && (
                        <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 rounded-sm border border-cyan-500/10">
                          <span className="text-[8px] text-cyan-100/60 uppercase tracking-widest">Activity_Peak</span>
                          <span className="text-[9px] text-amber-400 font-bold tracking-widest uppercase">{temporalSummary.peakWindow.replace('_', ' ')}</span>
                        </div>
                      )}

                      {/* Dominant Cluster */}
                      {clusterHints && clusterHints.length > 0 && (
                        <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 rounded-sm border border-cyan-500/10">
                          <span className="text-[8px] text-cyan-100/60 uppercase tracking-widest">Dominant_Cluster</span>
                          <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase truncate max-w-[120px]">{clusterHints[0].label}</span>
                        </div>
                      )}
                      
                      {/* Strongest Link */}
                      {walletSummary.strongestCounterparty && (
                        <div className="flex justify-between items-center bg-cyan-950/20 px-3 py-2 rounded-sm border border-cyan-500/10 mt-1">
                          <span className="text-[8px] text-cyan-100/60 uppercase tracking-widest">Primary_Link</span>
                          <span className="text-[9px] text-cyan-300 font-bold tracking-widest uppercase truncate max-w-[110px]">{walletSummary.strongestCounterparty.partyId.split('::')[0]}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* 2. METRICS GRID: ANALYTICS */}
          <div className={`grid grid-cols-1 gap-4 transition-all duration-1000 delay-100 shrink-0 ${isLeftPanelCollapsed ? 'opacity-0 -translate-x-10' : 'opacity-100 translate-x-0'}`}>
            <MetricsCard 
              label="Neural_Throughput" 
              value={isScanning ? '--' : metrics.throughput} 
              unit="TPS" 
              icon={Activity} 
              trend={Number(metrics.throughput) > 0 ? 'up' : 'neutral'}
              status={isScanning ? 'warning' : 'stable'}
              description="Real-time transaction processing speed across neural paths."
            />
            <div className="grid grid-cols-2 gap-4">
              <MetricsCard 
                label="Validators" 
                value={metrics.validatorCount} 
                icon={ShieldCheck} 
                status={metrics.validatorCount > 0 ? 'stable' : 'warning'}
                description="Verified network authority nodes in current scope."
              />
              <MetricsCard 
                label="Latency" 
                value={metrics.latency} 
                unit="MS"
                icon={Radio} 
                status={isScanning ? 'warning' : 'stable'}
                trend={isScanning ? 'up' : 'neutral'}
                description="Data propagation delay between Cortex nodes."
              />
            </div>
            <MetricsCard 
              label="Global_Network_Load" 
              value={metrics.load} 
              unit="%" 
              icon={BarChart3} 
              status={Number(metrics.load) > 85 ? 'critical' : (Number(metrics.load) > 60 ? 'warning' : 'stable')}
              description="Aggregate computational pressure on the Canton protocol."
            />
          </div>

          {/* 3. PRIVACY STATUS BANNER */}
          <section className={`p-5 bg-cyan-500/5 border-l-4 border-cyan-500/40 backdrop-blur-md transition-all duration-700 delay-200 shrink-0 ${isLeftPanelCollapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={14} className="text-cyan-400" />
              <h3 className="text-[9px] text-cyan-400 font-black uppercase tracking-widest">Sub-Transaction_Enforcement</h3>
            </div>
            <p className="text-[9px] text-white/40 leading-relaxed font-bold italic tracking-tighter">
              * Canton Privacy Protocol v6.0 mühürleme aktif. Tüm veri akışları izoledir.
            </p>
          </section>
        </div>

        {/* --- RIGHT HUD SECTOR: UTILITIES --- */}
        <div className="absolute top-0 right-0 flex flex-col gap-6 items-end animate-in slide-in-from-right duration-1000 ease-out pointer-events-none">
          <div className="flex flex-col gap-3 pointer-events-auto">
            <button className="p-4 bg-black/95 border border-white/10 text-white/20 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all backdrop-blur-3xl group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <LayoutGrid size={22} className="group-hover:rotate-90 transition-transform duration-700" />
            </button>
            <button className="p-4 bg-black/95 border border-white/10 text-white/20 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all backdrop-blur-3xl group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <Terminal size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* CONTRACT INSPECTOR PORTAL */}
          {isInspectorOpen && (
            <div className="pointer-events-auto z-[60] shadow-[-30px_30px_100px_rgba(0,0,0,0.98)] border-l border-white/5 animate-in slide-in-from-right duration-700 cubic-bezier(0.23, 1, 0.32, 1)">
              <ContractInspector />
            </div>
          )}
        </div>

      </div>

      {/* --- BOTTOM SYSTEM OVERLAY: NEWS TICKER & LOGS --- */}
      <div className="mt-auto flex items-end justify-between relative z-[60] pointer-events-none">
         <div className="flex flex-col gap-2">
            <div className="w-64 h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent opacity-30" />
            <div className="flex items-center gap-4 overflow-hidden w-[500px]">
               <div className="flex items-center gap-2 shrink-0 bg-cyan-500/10 px-2 py-0.5 rounded-sm">
                  <Terminal size={10} className="text-cyan-400" />
                  <span className="text-[8px] font-black uppercase text-cyan-400 tracking-widest">Live_Ticker</span>
               </div>
               <div className="whitespace-nowrap animate-[scroll_20s_linear_infinite] text-[9px] text-white/20 font-mono tracking-widest uppercase italic">
                  Neural handshake stable ... Topology reconstruction at 98% ... {buildings?.length} nodes mapped ... {transactions?.length} artifacts captured ... Grid sector 7 normalized ...
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-8 text-[9px] font-black italic tracking-widest text-cyan-950 uppercase opacity-60">
            <span className="flex items-center gap-2"><Waves size={10} /> Frequency_Stable</span>
            <span className="flex items-center gap-2"><AlertCircle size={10} /> Interference_0.02%</span>
         </div>
      </div>

      {/* DEKORATİF HUD ELEMANLARI */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-10 pointer-events-none">
        <div className="w-12 h-[1px] bg-white" />
        <Cpu size={14} className="text-white" />
        <div className="w-12 h-[1px] bg-white" />
      </div>
    </div>
  );
};

export default memo(HUD);