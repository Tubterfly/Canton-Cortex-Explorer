'use client';

import React, { useState, useEffect, memo } from 'react';
import City from '@/components/3d/City';
import ContractTable from './ContractTable';
import GlobalStats from './GlobalStats';
import HUD from '@/components/ui/HUD';
import ContractInspector from './ContractInspector'; 
import { useCityStore } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow'; 
import { 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2, 
  Radio,
  Power,
  Network,
  X,
  Share2,
  Clock,
  Filter,
  Crosshair,
  Layers
} from 'lucide-react';

type MetricRowProps = {
  label: string;
  value: string | number;
  highlight?: string;
};

const MetricRow = ({ label, value, highlight = 'text-cyan-100' }: MetricRowProps) => (
  <div className="flex justify-between items-center bg-black/40 p-2 rounded-sm border border-cyan-500/10">
    <span className="text-[9px] text-cyan-500/70 tracking-widest uppercase">{label}</span>
    <span className={`text-[10px] font-black tabular-nums ${highlight}`}>{value}</span>
  </div>
);

/**
 * SYSTEM CLOCK (PERFORMANCE FIX)
 */
const SystemClock = memo(() => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:block text-[11px] text-cyan-500 font-black tracking-widest tabular-nums border-x border-cyan-950/50 px-6 py-1">
      {time}
    </div>
  );
});
SystemClock.displayName = 'SystemClock';

/**
 * UPLINK COMMAND (TERMINATE / NEW SCAN)
 * Yenilemesiz ağ değiştirme ve sistemi sonlandırma birleştirildi.
 */
type UplinkCommandProps = {
  onNewScan: (partyId: string) => void | Promise<void>;
  onTerminate: () => void;
};

const UplinkCommand = memo(({ onNewScan, onTerminate }: UplinkCommandProps) => {
  const { isScanning } = useCityStore(
    useShallow((state) => ({
      isScanning: state.isScanning,
    }))
  );
  
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchValue.trim().length > 3) {
        onNewScan(searchValue.trim());
        setIsSearchMode(false);
        setSearchValue('');
      } else if (searchValue.trim().length === 0) {
        // Boşken Enter'a basılırsa orijinal Terminate Uplink (Reset) çalışır
        onTerminate();
        setIsSearchMode(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchMode(false);
      setSearchValue('');
    }
  };

  if (isSearchMode) {
    return (
      <div className="relative flex items-center bg-red-950/30 border border-red-500/60 rounded-sm px-3 focus-within:border-red-400 transition-colors h-[34px] w-[320px] overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
        <Power size={14} className={isScanning ? 'text-yellow-500 animate-spin' : 'text-red-400 animate-pulse'} />
        <input 
          autoFocus
          type="text"
          placeholder="TARGET_ID OR [ENTER] TO ABORT"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if(!searchValue) setIsSearchMode(false);
          }}
          disabled={isScanning}
          className="bg-transparent border-none outline-none text-[10px] text-red-100 font-mono w-full ml-3 placeholder:text-red-500/50 uppercase tracking-widest disabled:opacity-50 relative z-10"
        />
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsSearchMode(true)}
      className="group relative px-6 py-2 border border-red-500/40 text-red-500 text-[10px] font-black transition-all uppercase tracking-[0.3em] overflow-hidden h-[34px] flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
    >
      <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      <span className="relative z-10 group-hover:text-black transition-colors flex items-center gap-2">
        <Power size={12} /> Terminate_Uplink
      </span>
    </button>
  );
});
UplinkCommand.displayName = 'UplinkCommand';

/**
 * RELATIONSHIP INTELLIGENCE SUMMARY PANEL
 * Zustand store içindeki ilişkisel ağ topolojisi ve güven (confidence) skorlarını derler.
 */
const RelationshipIntelSummary = memo(({ onClose }: { onClose: () => void }) => {
  const {
    relationshipSummary,
    temporalSummary,
    clusterHints,
    noiseSuppression,
    counterpartyRanking
  } = useCityStore(useShallow(state => ({
    relationshipSummary: state.relationshipSummary,
    temporalSummary: state.temporalSummary,
    clusterHints: state.clusterHints,
    noiseSuppression: state.noiseSuppression,
    counterpartyRanking: state.counterpartyRanking
  })));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-5xl bg-[#030303] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col font-mono text-cyan-500 relative overflow-hidden">
         {/* Cyber Decor */}
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
         
         {/* Header */}
         <div className="flex justify-between items-center p-6 border-b border-cyan-500/20 bg-cyan-950/20">
           <div className="flex items-center gap-3">
             <Network className="text-cyan-400 animate-pulse" size={18} />
             <h2 className="text-sm font-black tracking-[0.4em] uppercase text-cyan-100">Relationship_Intelligence_Summary</h2>
           </div>
           <button onClick={onClose} className="text-cyan-500 hover:text-red-500 transition-colors p-1">
             <X size={20} />
           </button>
         </div>

         {/* Grid Content */}
         <div className="p-6 grid grid-cols-3 gap-8 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-cyan-900/50">
           
           {/* 1. NETWORK BONDS */}
           <div className="space-y-4">
             <h3 className="text-[10px] text-cyan-600 font-black tracking-widest uppercase border-b border-cyan-900/50 pb-2 flex items-center gap-2">
               <Share2 size={12} /> Network_Bonds
             </h3>
             <div className="space-y-2">
               <MetricRow label="Total_Links" value={relationshipSummary?.totalRelationships || 0} />
               <MetricRow label="High_Confidence" value={relationshipSummary?.highConfidenceRelationships || 0} highlight="text-green-400" />
               <MetricRow label="Validator_Links" value={relationshipSummary?.validatorRelationships || 0} highlight="text-yellow-400" />
               <MetricRow label="Gov_Interactions" value={relationshipSummary?.governanceRelationships || 0} highlight="text-purple-400" />
             </div>
           </div>

           {/* 2. TEMPORAL SIGNATURE */}
           <div className="space-y-4">
             <h3 className="text-[10px] text-cyan-600 font-black tracking-widest uppercase border-b border-cyan-900/50 pb-2 flex items-center gap-2">
               <Clock size={12} /> Temporal_Signature
             </h3>
             <div className="space-y-2">
               <MetricRow label="Activity_Score" value={(temporalSummary?.recentActivityScore || 0).toFixed(1)} />
               <MetricRow label="Peak_Window" value={temporalSummary?.peakWindow || 'UNKNOWN'} highlight="text-pink-400" />
               <MetricRow label="Active_Days" value={temporalSummary?.activeDays || 0} />
             </div>
           </div>

           {/* 3. SIGNAL FILTERS */}
           <div className="space-y-4">
             <h3 className="text-[10px] text-cyan-600 font-black tracking-widest uppercase border-b border-cyan-900/50 pb-2 flex items-center gap-2">
               <Filter size={12} /> Signal_Suppression
             </h3>
             <div className="space-y-2">
               <MetricRow label="Promoted_Nodes" value={noiseSuppression?.promotedPartyIds?.length || 0} highlight="text-green-400" />
               <MetricRow label="Suppressed_Noise" value={noiseSuppression?.suppressedPartyIds?.length || 0} highlight="text-white/40" />
             </div>
           </div>

           {/* 4. TOP COUNTERPARTIES */}
           <div className="col-span-2 space-y-4">
             <h3 className="text-[10px] text-cyan-600 font-black tracking-widest uppercase border-b border-cyan-900/50 pb-2 flex items-center gap-2">
               <Crosshair size={12} /> Top_Entity_Interactions
             </h3>
             <div className="grid grid-cols-1 gap-2">
               {counterpartyRanking?.slice(0, 3).map((cp, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 bg-cyan-950/10 border border-cyan-900/30 rounded-sm">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] text-cyan-100 font-bold truncate max-w-[200px]">{cp.partyId}</span>
                      <span className="text-[8px] text-cyan-600 tracking-widest uppercase">
                        {cp.entityClass}
                        {' | '}
                        {cp.direction}
                      </span>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <span className="text-[10px] font-black text-cyan-300">Score: {cp.score.toFixed(1)}</span>
                     <span className="text-[8px] text-white/40 uppercase tracking-widest">{cp.transferCount} Tx / {cp.confidenceLabel} Conf</span>
                   </div>
                 </div>
               ))}
               {(!counterpartyRanking || counterpartyRanking.length === 0) && (
                 <div className="text-[10px] text-cyan-900 uppercase italic p-4 text-center">No_Entities_Ranked</div>
               )}
             </div>
           </div>

           {/* 5. CLUSTER DISTRICTS */}
           <div className="space-y-4">
             <h3 className="text-[10px] text-cyan-600 font-black tracking-widest uppercase border-b border-cyan-900/50 pb-2 flex items-center gap-2">
               <Layers size={12} /> Cluster_Districts
             </h3>
             <div className="flex flex-col gap-2">
               {clusterHints?.slice(0, 4).map((cluster, idx) => (
                 <div key={idx} className="flex flex-col p-2 bg-cyan-950/10 border border-cyan-900/30 rounded-sm">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-[9px] text-cyan-300 font-bold uppercase truncate max-w-[100px]">{cluster.label}</span>
                     <span className="text-[8px] text-white/50 bg-black/50 px-1 rounded-sm">{cluster.type}</span>
                   </div>
                   <div className="flex justify-between items-center text-[8px] text-cyan-600 tracking-widest uppercase">
                     <span>Str: {(cluster.strength * 100).toFixed(0)}%</span>
                     <span>Mbrs: {cluster.memberPartyIds?.length || 0}</span>
                   </div>
                 </div>
               ))}
               {(!clusterHints || clusterHints.length === 0) && (
                 <div className="text-[10px] text-cyan-900 uppercase italic p-4 text-center">No_Clusters_Detected</div>
               )}
             </div>
           </div>

         </div>
      </div>
    </div>
  );
});
RelationshipIntelSummary.displayName = 'RelationshipIntelSummary';

/**
 * SCANNER DASHBOARD: THE NEURAL COMMAND CENTER (v6.0 - BRANDED MASTER SYNC)
 */
type ScannerDashboardProps = {
  onNewScan: (partyId: string) => void | Promise<void>;
  onTerminate: () => void;
};

const ScannerDashboard = ({ onNewScan, onTerminate }: ScannerDashboardProps) => {
  const { 
    isInspectorOpen, 
    closeInspector, 
    isScanning, 
    isHUDVisible, 
    toggleHUD 
  } = useCityStore(
    useShallow((state) => ({
      isInspectorOpen: state.isInspectorOpen,
      closeInspector: state.closeInspector,
      isScanning: state.isScanning,
      isHUDVisible: state.isHUDVisible,
      toggleHUD: state.toggleHUD,
    }))
  );

  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') toggleHUD();
      if (e.key.toLowerCase() === 'i') setIsIntelOpen(prev => !prev);
      if (e.key === 'Escape') {
        if (isInspectorOpen) closeInspector();
        if (isIntelOpen) setIsIntelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectorOpen, closeInspector, toggleHUD, isIntelOpen]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#020202] flex flex-col overflow-hidden font-mono selection:bg-cyan-500 selection:text-black antialiased">
      
      {/* 1. TOP HEADER: COMMAND BAR */}
      <header className="z-[60] flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.9)] shrink-0 pointer-events-auto will-change-transform">
        <div className="h-14 border-b border-cyan-500/20 bg-black/95 backdrop-blur-md flex items-center justify-between px-8 relative overflow-hidden">
          {/* Scanning Status Bar */}
          <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isScanning ? 'via-yellow-500' : 'via-cyan-400'} to-transparent animate-pulse`} />
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 group cursor-crosshair">
              {/* BRANDED LOGO CONTAINER */}
              <div className="relative shrink-0">
                <div className={`w-8 h-8 relative transition-all duration-700 ${isScanning ? 'drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]' : ''}`}>
                  <img 
                    src="/brain_centered_480-Photoroom.png" 
                    alt="Canton Cortex Logo" 
                    className={`w-full h-full object-contain ${isScanning ? 'animate-pulse' : 'opacity-80 grayscale-[0.3]'}`}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-cyan-400 font-black tracking-[0.3em] text-xs uppercase italic group-hover:text-white transition-all duration-500">
                  Canton_Cortex_Explorer
                </span>
                <span className="text-[8px] text-cyan-800 font-bold tracking-widest mt-0.5 uppercase">Neural_Link_Isolated</span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/5 mx-2" />

            <div className="hidden lg:flex items-center gap-8 text-[10px] text-white/30 uppercase font-black tracking-widest">
              <span className="flex items-center gap-2 group">
                <Radio size={12} className="text-cyan-900 group-hover:text-cyan-500 transition-colors" />
                Network: <span className="text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">Canton.Mainnet</span>
              </span>
              <span className="flex items-center gap-2">
                Status: <span className={isScanning ? 'text-yellow-500 animate-pulse' : 'text-green-500'}>
                  {isScanning ? 'Syncing_Neural_Layers' : 'Neural_Link_Stable'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <SystemClock />
            
            <div className="flex items-center gap-4">
              {/* NEW: Intelligence Overlay Toggle */}
              <button 
                onClick={() => setIsIntelOpen(!isIntelOpen)}
                className={`p-2.5 rounded-sm transition-all duration-500 hover:bg-cyan-500/10 ${isIntelOpen ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] border border-cyan-500/20 bg-cyan-950/30' : 'text-white/10 border border-transparent'}`}
                title="Toggle Relationship Intel (I)"
              >
                <Network size={18} />
              </button>

              <button 
                onClick={toggleHUD}
                className={`p-2.5 rounded-sm transition-all duration-500 hover:bg-cyan-500/10 ${isHUDVisible ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] border border-cyan-500/20' : 'text-white/10 border border-transparent'}`}
                title="Toggle HUD (H)"
              >
                {isHUDVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              
              {/* Etkileşimli Ağ Komuta Modülü */}
              <UplinkCommand onNewScan={onNewScan} onTerminate={onTerminate} />
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className={`transition-all duration-700 ease-in-out origin-top overflow-hidden will-change-[height,opacity] ${isHUDVisible ? 'opacity-100 scale-y-100 h-auto' : 'opacity-0 scale-y-0 h-0'}`}>
          <GlobalStats />
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-hidden flex">
        
        {/* 3D CANVAS LAYER */}
        <div className={`absolute inset-0 z-0 transition-all duration-1000 ease-out will-change-transform ${isHUDVisible ? 'scale-100 opacity-100' : 'scale-110 opacity-90 grayscale-[0.2]'}`}>
          <City />
        </div>

        {/* MODULAR HUD LAYER */}
        <div 
          className={`absolute inset-0 z-50 pointer-events-none transition-all duration-700 will-change-opacity ${
            isHUDVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <HUD />
        </div>

        {/* DATA INSPECTOR PANEL */}
        <ContractInspector />

        {/* BOTTOM TERMINAL LAYER */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-1000 cubic-bezier(0.19, 1, 0.22, 1) will-change-transform ${
            isTableExpanded ? 'h-[75%]' : 'h-80'
          } ${isHUDVisible ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`}
        >
          <div className="h-full relative flex flex-col pointer-events-auto">
            <div className="absolute -top-10 right-10 flex gap-3 z-50">
              <button 
                onClick={() => setIsTableExpanded(!isTableExpanded)}
                className="flex items-center gap-3 px-6 py-2 bg-black/95 border-t border-x border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all rounded-t-sm shadow-[-10px_-10px_40px_rgba(0,0,0,0.8)] font-black text-[11px] uppercase tracking-widest group"
              >
                {isTableExpanded ? (
                  <> <Minimize2 size={16} /> Collapse_Stream </>
                ) : (
                  <> <Maximize2 size={16} /> Expand_Stream </>
                )}
              </button>
            </div>
            <div className="flex-1 shadow-[0_-40px_80px_rgba(0,0,0,0.98)] border-t border-cyan-500/20 bg-black/80 backdrop-blur-md overflow-hidden">
              <ContractTable />
            </div>
          </div>
        </div>

      </main>

      {/* 3. FOOTER */}
      <footer className="h-10 border-t border-white/5 bg-black flex items-center px-8 justify-between z-[60] relative shrink-0">
        <div className="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none" />
        <div className="flex items-center gap-8 relative z-10">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.5em] flex items-center gap-4">
            <span className={`w-2 h-2 rounded-full shadow-[0_0_10px_#22c55e] transition-colors duration-1000 ${isScanning ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
            Cortex_Core: <span className={isScanning ? 'text-yellow-500' : 'text-green-500/80 font-black'}>
              {isScanning ? 'SYNC_IN_PROGRESS' : 'OPERATIONAL'}
            </span>
          </p>
          <div className="w-[1px] h-4 bg-white/10" />
          <p className="text-[9px] text-cyan-900 font-black uppercase tracking-[0.3em]">
            {isScanning ? 'SCANNING_LEDGER_STREAM...' : 'AWAITING_SYNC_EVENTS'}
          </p>
        </div>
        <div className="flex items-center gap-6 text-[10px] text-cyan-900 font-black italic tracking-tighter uppercase relative z-10 opacity-60">
          <span>Neural_Layer_Verified</span>
          <span className="w-1 h-1 bg-cyan-950 rounded-full" />
          <span>Canton_Protocol_v6.0_Stable</span>
        </div>
      </footer>

      {/* OVERLAYS */}
      {isIntelOpen && <RelationshipIntelSummary onClose={() => setIsIntelOpen(false)} />}
    </div>
  );
};

export default memo(ScannerDashboard);
