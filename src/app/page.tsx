'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLedger } from '@/hooks/useLedger';
import ScannerDashboard from '@/components/scanner/ScannerDashboard'; 
import { motion, AnimatePresence } from 'framer-motion'; // Aşama 2 & 3: Gelişmiş Animasyonlar
import { 
  Terminal as TerminalIcon, 
  Zap, 
  Cpu, 
  Activity, 
  Globe, 
  Radio,
  History,
  Check,
  MousePointer2, // Aşama 3: Etkileşim ikonu
  Keyboard // Aşama 3: Kısayol ikonu
} from 'lucide-react';

/**
 * CANTON CORTEX: NEURAL EXPLORER INTERFACE (v4.3 - STAGE 3 FINAL PEAK)
 * Dashboard entegrasyonu, partikül çıkış animasyonları ve teknik UI detayları eklenmiş sürüm.
 */
export default function Home() {
  const {
    isScanning,
    terminalLogs,
    scanFinished,
    authDebug,
    initiateUplink,
    resetUplinkSession,
    addLog
  } = useLedger();

  const [inputPartyId, setInputPartyId] = useState('9898ffab1f024492990af90481cdd9a0::122087db4d4680420b18d0ccb0e163e8b1a7c340f846214aec8f6b8e97a736f599b9');
  const [systemTime, setSystemTime] = useState('');
  const [recentTargets, setRecentTargets] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = window.localStorage.getItem('CORTEX_RECENT_TARGETS');
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as string[];
    } catch (error) {
      console.error(error);
      return [];
    }
  });
  const [isDashboardDismissed, setIsDashboardDismissed] = useState(false);
  
  // --- AŞAMA 2 & 3: DURUM YÖNETİMİ ---
  const [isInitialBoot, setIsInitialBoot] = useState(true);
  const [copiedLog, setCopiedLog] = useState<string | null>(null);
  
  // Aşama 3: Logdan gelen öncelikli analiz kimliği

  /**
   * SİSTEM SAATİ SİNKRONİZASYONU
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString([], { 
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * INITIAL BOOT & SCANLINE SEQUENCE
   */
  useEffect(() => {
    if (terminalLogs.length === 0) {
      addLog("SYSTEM_READY: CORTEX EXPLORER INTERFACE STABILIZED.");
      addLog("AWAITING_NEURAL_HANDSHAKE...");
    }

    const bootTimer = setTimeout(() => setIsInitialBoot(false), 2500);
    return () => clearTimeout(bootTimer);
  }, [addLog, terminalLogs.length]);

  /**
   * DİNAMİK İLERLEME ANALİZİ
   */
  const scanProgress = useMemo(() => {
    if (!isScanning) {
      return 0;
    }

    const lastLog = terminalLogs[0] || "";
    if (lastLog.includes("ESTABLISHED")) return 100;
    if (lastLog.includes("LEDGER")) return 75;
    if (lastLog.includes("NETWORK")) return 50;
    if (lastLog.includes("AUTH")) return 25;
    return 0;
  }, [terminalLogs, isScanning]);

  /**
   * FORM SUBMISSION HANDLER
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPartyId.trim()) {
      setIsDashboardDismissed(false);
      initiateUplink(inputPartyId); 
      const updated = [inputPartyId, ...recentTargets.filter(id => id !== inputPartyId)].slice(0, 3);
      setRecentTargets(updated);
      localStorage.setItem('CORTEX_RECENT_TARGETS', JSON.stringify(updated));
    }
  };

  /**
   * TERMINATE COMMAND HANDLER
   */
  const handleTerminate = useCallback(() => {
    resetUplinkSession();
    setIsDashboardDismissed(true);
    setInputPartyId('');
    addLog("TERMINAL_UPLINK_ABORTED: SESSION_CLEARED.");
    addLog("AWAITING_NEW_TARGET_ID...");
  }, [resetUplinkSession, addLog]);

  /**
   * KLAVYE KISAYOLLARI
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleTerminate();
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        resetUplinkSession();
        setIsDashboardDismissed(true);
        addLog("NEURAL_LOG_CLEARED: TERMINAL_READY.");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTerminate, resetUplinkSession, addLog]);

  /**
   * AŞAMA 3: ETKİLEŞİMLİ LOG & INSPECTOR ENTEGRASYONU
   */
  const handleLogInteraction = (text: string) => {
    const idMatch = text.match(/[0-9a-f]{10,}/i);
    if (idMatch) {
      const targetId = idMatch[0];
      navigator.clipboard.writeText(targetId);
      setCopiedLog(targetId);
      setTimeout(() => setCopiedLog(null), 2000);
    }
  };

  // DASHBOARD GEÇİŞ KONTROLÜ
  if (scanFinished && !isScanning && !isDashboardDismissed) {
    return (
      <ScannerDashboard 
        onNewScan={(partyId) => {
          setIsDashboardDismissed(false);
          return initiateUplink(partyId);
        }} 
        onTerminate={handleTerminate}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main 
        key="explorer-home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // Aşama 3: "Neural Disintegration" Geçişi (Partikül hissi veren glitch çıkış)
        exit={{ 
          opacity: 0, 
          scale: 1.2, 
          filter: 'blur(30px) brightness(2) contrast(1.5)',
          skewX: 10,
          transition: { duration: 1.2, ease: "anticipate" }
        }} 
        className="h-screen w-full bg-[#020202] flex flex-col font-mono text-cyan-500 p-6 selection:bg-cyan-500 selection:text-black overflow-hidden relative antialiased"
      >
        {/* INTRO SCANLINE EFFECT */}
        {isInitialBoot && (
          <motion.div 
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 2.5, ease: "linear" }}
            className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent z-[100] pointer-events-none shadow-[0_0_50px_rgba(6,182,212,0.5)]"
          />
        )}
        
        {/* BACKGROUND EFFECTS */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(6,182,212,0.03)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        {/* HEADER: STATUS MONITOR */}
        <header className="flex justify-between items-center border-b border-cyan-900/40 pb-6 mb-8 relative z-10 shrink-0">
          <div className="flex items-center gap-6 group">
            <div className="relative shrink-0 flex items-center gap-4">
               <div className="relative">
                  <div className={`w-4 h-4 rounded-full transition-colors duration-1000 ${isScanning ? 'bg-yellow-500 animate-ping' : 'bg-green-500 shadow-[0_0_15px_#22c55e]'}`} />
                  <div className="absolute inset-0 w-4 h-4 rounded-full border border-cyan-500/30 animate-pulse" />
               </div>
               <img src="/brain_centered_480-Photoroom.png" alt="Cortex Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-[0.4em] uppercase italic drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] group-hover:text-white transition-colors duration-500">
                Canton_Cortex_Explorer
              </h1>
              <span className="text-[9px] text-cyan-800 font-bold tracking-[0.6em] mt-1 uppercase">v4.3_Neural_Topology_Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            {/* AŞAMA 3: KLAVYE İPUCU */}
            <div className="hidden xl:flex items-center gap-3 bg-cyan-950/10 px-3 py-1 border border-cyan-500/10 rounded-sm opacity-40 hover:opacity-100 transition-opacity">
              <Keyboard size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">[ESC] TERMINATE_UPLINK</span>
            </div>

            <div className="hidden md:flex flex-col items-end border-r border-cyan-900/30 pr-10">
              <span className="text-[8px] text-cyan-900 font-black tracking-widest mb-1 uppercase">Node_Time</span>
              <span className="text-xs font-bold tabular-nums text-cyan-500/70">{systemTime}</span>
            </div>
            <div className="text-[10px] text-cyan-400 bg-cyan-950/20 px-6 py-2.5 border border-cyan-500/20 rounded-sm font-black uppercase tracking-[0.25em] shadow-inner">
              {authDebug.myParty ? `UPLINK_ID: ${authDebug.myParty.slice(0, 24)}...` : 'AWAITING_UPLINK_TARGET'}
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative z-10">
          
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
            <div className="bg-black/60 border border-cyan-500/20 p-8 rounded-sm relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-2 text-[8px] text-cyan-900 uppercase font-black tracking-widest">Control_Module_01</div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.5em] text-cyan-500/40 font-black flex items-center gap-2">
                    <Globe size={12} className="text-cyan-900" /> Identity_Scope_ID
                  </label>
                  <input 
                    type="text" autoFocus value={inputPartyId}
                    onChange={(e) => setInputPartyId(e.target.value)}
                    className="w-full bg-black/80 border border-cyan-500/30 p-5 text-[11px] outline-none focus:border-cyan-400 focus:bg-cyan-950/10 text-cyan-100 font-bold transition-all shadow-inner placeholder:text-cyan-950"
                    placeholder="Target_Party_ID::Hash..."
                  />

                  {!isInitialBoot && recentTargets.length > 0 && !isScanning && (
                    <div className="pt-2">
                      <label className="text-[8px] uppercase tracking-[0.3em] text-cyan-900 font-bold flex items-center gap-1 mb-2">
                        <History size={10} /> Recent_Neural_Nodes
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {recentTargets.map((id, idx) => (
                          <button key={idx} type="button" onClick={() => setInputPartyId(id)} className="px-2 py-1 bg-cyan-950/20 border border-cyan-900/40 text-[9px] text-cyan-700 hover:text-cyan-400 hover:border-cyan-500 transition-all rounded-sm font-bold truncate max-w-[120px] shadow-inner">
                            {id.slice(0, 12)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  type="submit" disabled={isScanning}
                  className="group w-full bg-cyan-500 text-black py-5 text-xs font-black tracking-[0.8em] hover:bg-white transition-all duration-500 disabled:opacity-20 uppercase shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center justify-center gap-4 active:scale-[0.98]"
                >
                  {isScanning ? <Activity size={16} className="animate-spin" /> : <Zap size={16} className="group-hover:animate-pulse" />}
                  {isScanning ? 'DECRYPTING_NEURAL_DATA...' : 'INITIATE_EXPLORATION'}
                </button>
              </form>
            </div>

            <div className="flex-1 bg-black/90 border border-cyan-900/40 rounded-sm overflow-hidden flex flex-col shadow-2xl pointer-events-auto">
              <div className="bg-cyan-950/30 px-5 py-3 text-[9px] font-black border-b border-cyan-900/50 flex justify-between items-center shrink-0">
                <span className="flex items-center gap-2 tracking-[0.3em] uppercase">
                  <TerminalIcon size={12} className="text-cyan-600" /> Neural_Log_Terminal
                </span>
                <div className="flex items-center gap-3">
                  {/* AŞAMA 3: LOG ETKİLEŞİM İPUCU */}
                  <span className="text-[7px] text-cyan-900 font-black tracking-[0.2em] uppercase hidden sm:inline">Click_to_Inspect</span>
                  <span className="text-cyan-400 animate-pulse tracking-widest text-[8px]">ACTIVE_SYNC</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-[10px] leading-relaxed space-y-4 font-mono scrollbar-thin scrollbar-thumb-cyan-950/50 scrollbar-track-transparent">
                {terminalLogs.length === 0 ? (
                  <div className="opacity-20 italic">Awaiting neural commands...</div>
                ) : (
                  terminalLogs.map((log, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleLogInteraction(log)}
                      className={`border-l-2 pl-4 py-1.5 transition-all duration-500 group/log cursor-pointer relative ${
                        log.includes('FAIL') || log.includes('✖') || log.includes('ABORTED')
                          ? 'border-red-600/50 text-red-400 bg-red-900/5' 
                          : log.includes('✔') || log.includes('SUCCESS')
                          ? 'border-green-600/50 text-green-400 bg-green-900/5'
                          : 'border-cyan-800 text-cyan-500/60'
                      } hover:bg-cyan-500/5 hover:border-cyan-400`}
                    >
                      {log}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/log:opacity-100 transition-opacity flex items-center gap-2">
                         <span className="text-[7px] font-black uppercase tracking-tighter text-cyan-700">Set_Inspector</span>
                         {copiedLog && log.includes(copiedLog) ? <Check size={10} className="text-green-500" /> : <MousePointer2 size={10} className="text-cyan-800" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: VISUAL DECRYPTION HUD */}
          <div className="lg:col-span-8 bg-cyan-950/5 border border-cyan-500/10 rounded-sm overflow-hidden flex flex-col relative group pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-500/20" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-500/20" />

            <div className="flex-1 flex flex-col justify-center items-center relative z-10">
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-64 h-64 border-2 border-dashed border-cyan-500/10 rounded-full ${isScanning ? 'animate-spin' : ''} duration-[20s]`} />
                <div className={`absolute w-80 h-80 border border-dotted border-cyan-500/5 rounded-full ${isScanning ? 'animate-spin' : ''} duration-[35s] reverse`} />
                
                <div className={`relative transition-all duration-1000 ${isScanning ? 'scale-110 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]' : 'opacity-40 grayscale-[0.5]'}`}>
                  <img src="/brain_centered_480-Photoroom.png" alt="Canton Cortex Logo" className={`w-64 h-64 object-contain ${isScanning ? 'animate-pulse' : ''}`} />
                </div>
              </div>
              
              <div className="mt-16 text-center space-y-5 w-full max-w-md px-10">
                <p className="text-[12px] uppercase tracking-[1em] font-black text-cyan-500/80 animate-pulse">
                  {isScanning ? 'MAPPING_NEURAL_TOPOLOGY...' : 'WAITING_FOR_UPLINK_COMMAND'}
                </p>
                
                {/* CYBERPUNK PROGRESS BAR */}
                {isScanning && (
                  <div className="relative h-2 w-full bg-cyan-950/30 border border-cyan-500/20 overflow-hidden rounded-full shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-white shadow-[0_0_20px_#06b6d4]"
                    />
                    <div className="absolute top-0 right-0 h-full w-20 bg-white/10 skew-x-[-25deg] animate-[pulse_1.5s_infinite]" />
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div key={dot} className={`w-1.5 h-1.5 bg-cyan-500/20 rounded-full ${isScanning ? 'animate-bounce' : ''}`} style={{ animationDelay: `${dot * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 flex justify-between items-end border-t border-cyan-500/5 bg-black/20">
               <div className="flex items-center gap-5">
                  <Cpu size={20} className="text-cyan-900" />
                  <div className="flex flex-col">
                     <span className="text-[9px] text-cyan-900 uppercase font-black tracking-widest">Explorer_Core_v4.3</span>
                     <span className="text-[11px] text-cyan-700 font-black uppercase tracking-[0.2em]">Canton.Mainnet_Optimization_Active</span>
                  </div>
               </div>
               <div className="flex items-center gap-4 text-[10px] text-cyan-950 font-black uppercase tracking-widest italic opacity-40">
                  <Radio size={12} /> Privacy_Layer_0 // Verified
               </div>
            </div>
          </div>
        </div>

        <footer className="h-8 flex items-center justify-between px-2 mt-4 relative z-10">
          <p className="text-[8px] text-cyan-900 font-black uppercase tracking-[0.4em]">
            Neural_Layer_Handshake: <span className={authDebug.isAuthorized ? 'text-cyan-600' : 'text-red-900'}>{authDebug.isAuthorized ? 'STABLE' : 'PENDING'}</span>
          </p>
          <div className="flex items-center gap-4 text-[8px] text-cyan-900 font-black uppercase tracking-[0.3em]">
             {/* AŞAMA 3: LOG SIFIRLAMA İPUCU */}
             <span className="opacity-30">[CTRL+L] CLEAR_LOGS</span>
             <span className="italic">&copy; 2026 Canton_Cortex // Neural_Explorer_Isolated</span>
          </div>
        </footer>
      </motion.main>
    </AnimatePresence>
  );
}
