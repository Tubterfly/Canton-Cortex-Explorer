'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow';
import { 
  Activity, Shield, Cpu, Globe, Zap, Coins,
  Users, TrendingUp, TrendingDown, Clock, AlertTriangle, ShieldCheck, Box
} from 'lucide-react';

/**
 * GLOBAL STATS: NETWORK INTELLIGENCE MONITOR (v5.1 - ANALYST HYBRID)
 * Performance: useShallow ile store değişimleri sadece ilgili hücreleri tetikler.
 * Data: Store'daki marketMetrics canlı olarak bağlıyken, walletSummary, relationshipSummary, 
 *       temporalSummary ve noiseSuppression zenginleştirilmiş istihbarat olarak eklendi.
 * Rendering: GPU katman izolasyonu (will-change) ile FPS darboğazı engellendi.
 */
const GlobalStats = () => {
  // --- KRİTİK CERRAHİ: ATOMİK SHALLOW SELECTOR ---
  const { 
    buildings, 
    transactions, 
    isScanning, 
    marketMetrics,
    walletSummary,
    relationshipSummary,
    temporalSummary,
    noiseSuppression
  } = useCityStore(
    useShallow((state) => ({
      buildings: state.buildings,
      transactions: state.transactions,
      isScanning: state.isScanning,
      marketMetrics: state.marketMetrics,
      walletSummary: state.walletSummary,
      relationshipSummary: state.relationshipSummary,
      temporalSummary: state.temporalSummary,
      noiseSuppression: state.noiseSuppression
    }))
  );
  
  const [latency, setLatency] = useState(24);
  const [jitter, setJitter] = useState([4, 12, 8, 14, 6, 10]);

  /**
   * NEURAL SYNC SIMULATOR: Ağ gecikmesini milisaniyelik hassasiyetle simüle eder.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const drift = Math.random() > 0.5 ? 1 : -1;
        return Math.max(22, Math.min(26, prev + drift));
      });
      setJitter(Array.from({ length: 6 }, () => Math.floor(Math.random() * 12) + 4));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- MARKET METRICS ---
  const metrics = useMemo(() => {
    const nodes = buildings?.length || 0;
    const txCount = transactions?.length || 0;
    const validators = buildings?.filter(b => b.type === 'VALIDATOR' || b.type === 'SUPER_VALIDATOR').length || 0;
    return { 
      nodes, 
      txCount, 
      validators,
      tps: marketMetrics?.tps || 0,
      price: marketMetrics?.amuletPrice || 0
    };
  }, [buildings, transactions, marketMetrics]);

  return (
    <div className="w-full bg-[#030303]/95 backdrop-blur-md border-b border-cyan-500/20 py-3 px-8 flex items-center overflow-x-auto gap-8 no-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-30 pointer-events-auto will-change-transform">
      
      {/* 1. NETWORK IDENTITY: CANTON MAINNET SCOPE */}
      <div className="flex items-center gap-8 shrink-0">
        <div className="flex flex-col group cursor-help transition-all duration-300">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-cyan-400 group-hover:rotate-180 transition-transform duration-1000 ease-in-out" />
            <span className="text-[10px] text-cyan-500/40 uppercase tracking-[0.4em] font-black">Core_Uplink</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white font-mono font-black tracking-widest uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
              Canton.Mainnet.v1
            </span>
            <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/40 rounded-sm shadow-[0_0_10px_rgba(34,197,94,0.1)]">
               <span className="text-[9px] text-green-500 font-black animate-pulse tracking-widest uppercase italic">Secure</span>
            </div>
          </div>
        </div>

        {/* 2. NEURAL TRAFFIC & TPS */}
        <div className="flex flex-col border-l border-white/5 pl-8 relative">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-pink-500 animate-pulse" />
            <span className="text-[10px] text-pink-500/40 uppercase tracking-[0.4em] font-black">TPS_Density</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg text-white font-mono font-black leading-none tracking-tighter drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              {isScanning ? '---' : metrics.tps.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 3. PERFORMANCE: LATENCY & JITTER */}
        <div className="flex flex-col border-l border-white/5 pl-8">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="text-blue-500" />
            <span className="text-[10px] text-blue-500/40 uppercase tracking-[0.4em] font-black">Latency</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-baseline gap-1">
                <span className="text-sm text-white font-mono font-black transition-all duration-700">
                  {isScanning ? '--' : latency}
                </span>
                <span className="text-[8px] text-blue-400 font-black uppercase">ms</span>
             </div>
             <div className="flex items-end gap-1 h-4 w-12 will-change-transform">
                {jitter.map((h, i) => (
                  <div key={i} className="w-[3px] bg-cyan-500/30 transition-all duration-700 ease-in-out" style={{ height: `${isScanning ? 2 : h}px` }} />
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* --- SEPARATOR --- */}
      <div className="w-[2px] h-8 bg-cyan-900/50 rounded-full shrink-0 mx-2" />

      {/* --- WALLET INTELLIGENCE SUMMARY (NEW) --- */}
      <div className="flex items-center gap-8 shrink-0 flex-1">
        
        {/* WALLET FLOW (Net Flow & Unique Counterparties) */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} className="text-cyan-400" />
            <span className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-black">Peers & Flow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white font-mono font-black">{walletSummary?.uniqueCounterparties || 0}</span>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-1">
              {walletSummary && walletSummary.netFlow > 0 ? (
                <TrendingUp size={12} className="text-green-400" />
              ) : walletSummary && walletSummary.netFlow < 0 ? (
                <TrendingDown size={12} className="text-pink-400" />
              ) : (
                <Activity size={12} className="text-white/20" />
              )}
              <span className={`text-[11px] font-mono font-black tabular-nums ${walletSummary && walletSummary.netFlow > 0 ? 'text-green-400' : walletSummary && walletSummary.netFlow < 0 ? 'text-pink-400' : 'text-white/50'}`}>
                {walletSummary ? (walletSummary.netFlow > 0 ? '+' : '') + walletSummary.netFlow.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---'} CC
              </span>
            </div>
          </div>
        </div>

        {/* RELATIONSHIP STRENGTH (High Conf & Validator & App) */}
        <div className="flex flex-col border-l border-white/5 pl-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={12} className="text-purple-400" />
            <span className="text-[9px] text-purple-400/60 uppercase tracking-[0.3em] font-black">Rel_Strength</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono font-black">
            <div className="flex items-baseline gap-1" title="High Confidence Relationships">
              <span className="text-green-400">{relationshipSummary?.highConfidenceRelationships || 0}</span>
              <span className="text-[8px] text-white/30 uppercase">HC</span>
            </div>
            <div className="flex items-baseline gap-1" title="Validator Interactions">
              <span className="text-yellow-400">{walletSummary?.validatorInteractions || 0}</span>
              <span className="text-[8px] text-white/30 uppercase">VAL</span>
            </div>
            <div className="flex items-baseline gap-1" title="App Interactions">
              <span className="text-blue-400">{walletSummary?.appInteractions || 0}</span>
              <span className="text-[8px] text-white/30 uppercase">APP</span>
            </div>
          </div>
        </div>

        {/* TEMPORAL & NOISE (Score, Peak, Risk, Promoted) */}
        <div className="flex flex-col border-l border-white/5 pl-8">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={12} className="text-amber-500" />
            <span className="text-[9px] text-amber-500/60 uppercase tracking-[0.3em] font-black">Temporal_Signals</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono font-black">
            <div className="flex items-baseline gap-1" title="Recent Activity Score">
              <span className="text-white">{temporalSummary ? temporalSummary.recentActivityScore.toFixed(0) : '0'}</span>
              <span className="text-[8px] text-white/30 uppercase">SCR</span>
            </div>
            <div className="flex items-center gap-1" title="Peak Window">
              {temporalSummary?.peakWindow === 'HOT_24H' && <span className="text-[8px] bg-pink-500/20 text-pink-400 px-1 py-0.5 rounded-sm border border-pink-500/30">HOT</span>}
              {temporalSummary?.peakWindow === 'ACTIVE_7D' && <span className="text-[8px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded-sm border border-green-500/30">7D</span>}
              {temporalSummary?.peakWindow === 'ACTIVE_30D' && <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-1 py-0.5 rounded-sm border border-cyan-500/30">30D</span>}
              {temporalSummary?.peakWindow === 'STALE' && <span className="text-[8px] bg-white/10 text-white/40 px-1 py-0.5 rounded-sm border border-white/10">STL</span>}
              {(!temporalSummary || temporalSummary.peakWindow === 'UNKNOWN') && <span className="text-[8px] text-white/20">---</span>}
            </div>
            {(walletSummary?.riskFlags.length || 0) > 0 && (
              <div className="flex items-baseline gap-0.5 bg-red-500/10 px-1 py-0.5 rounded-sm" title="Risk Flags Count">
                <AlertTriangle size={10} className="text-red-500 animate-pulse" />
                <span className="text-red-400">{walletSummary?.riskFlags.length}</span>
              </div>
            )}
            {(noiseSuppression?.promotedPartyIds.length || 0) > 0 && (
              <div className="flex items-baseline gap-0.5" title="Promoted Nodes">
                <Box size={10} className="text-cyan-500" />
                <span className="text-cyan-400">{noiseSuppression?.promotedPartyIds.length}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. ECONOMIC HUB: AMULET PRICE & ISOLATION (Moved to far right) */}
      <div className="flex items-center gap-6 bg-cyan-500/[0.03] border border-cyan-500/20 px-6 py-2 rounded-sm ml-auto relative group hover:bg-cyan-500/[0.07] transition-all duration-500 overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-[2px] h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4] z-10" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />
        
        <div className="flex items-center gap-3 pr-4 border-r border-white/5">
           <Coins size={16} className="text-amber-500 group-hover:scale-110 transition-transform duration-500" />
           <div className="flex flex-col">
              <span className="text-[8px] text-amber-500/40 uppercase font-black tracking-widest">Amulet</span>
              <span className="text-[10px] text-white font-mono font-black italic">
                ${metrics.price > 0 ? metrics.price.toFixed(4) : '0.000'}
              </span>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <div className="flex flex-col relative z-20">
            <div className="flex items-center gap-1">
              <Zap size={8} className="text-cyan-600 animate-pulse" />
              <span className="text-[8px] text-cyan-400/60 uppercase font-black tracking-[0.3em]">Privacy</span>
            </div>
            <span className="text-[10px] text-white font-black uppercase tracking-[0.15em]">
              Isolated
            </span>
          </div>
        </div>

        <div className="absolute -right-4 top-0 h-full w-8 bg-cyan-500/5 skew-x-[25deg] group-hover:bg-cyan-500/10 transition-all duration-700" />
      </div>

    </div>
  );
};

export default memo(GlobalStats);
