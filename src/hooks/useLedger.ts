'use client';

import { useState, useCallback, useRef } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { getHybridContractHistory, fetchNetworkParties } from '@/services/cantonApi';

export function useLedger() {
  const {
    isScanning,
    startScan,
    finishScan,
    setError,
    error,
    resetScanner
  } = useCityStore();

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [scanFinished, setScanFinished] = useState(false);
  const [authDebug, setAuthDebug] = useState<{
    myParty: string | null;
    isAuthorized: boolean;
  }>({ myParty: null, isAuthorized: false });
  const dashboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSessionRef = useRef(0);

  const addLog = useCallback((msg: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
    const prefix = type === 'error' ? 'X' : type === 'success' ? 'OK' : type === 'warn' ? 'WARN' : 'INFO';
    setTerminalLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${prefix} ${msg}`, ...prev].slice(0, 50));
  }, []);

  const resetUplinkSession = useCallback(() => {
    activeSessionRef.current += 1;
    if (dashboardTimerRef.current) {
      clearTimeout(dashboardTimerRef.current);
      dashboardTimerRef.current = null;
    }
    resetScanner();
    setTerminalLogs([]);
    setScanFinished(false);
    setAuthDebug({ myParty: null, isAuthorized: false });
  }, [resetScanner]);

  const initiateUplink = useCallback(async (partyId: string) => {
    if (!partyId.trim() || isScanning) return;

    const sessionId = activeSessionRef.current + 1;
    activeSessionRef.current = sessionId;

    if (dashboardTimerRef.current) {
      clearTimeout(dashboardTimerRef.current);
      dashboardTimerRef.current = null;
    }

    setError('');
    setScanFinished(false);
    startScan(partyId);

    addLog(`INITIATING UPLINK FOR IDENTITY: ${partyId.slice(0, 20)}...`);

    try {
      addLog('UPLINK: DIRECT LEDGER EXPLORATION MODE ACTIVE...');
      if (activeSessionRef.current !== sessionId) return;

      setAuthDebug({ myParty: partyId, isAuthorized: true });
      addLog(`UPLINK: TARGET IDENTITY LOCKED. UID: ${partyId.slice(0, 15)}...`, 'success');

      addLog(`NETWORK: SCANNING INTERACTIONS FOR TARGET: ${partyId.slice(0, 10)}...`);
      const participants = await fetchNetworkParties();
      if (activeSessionRef.current !== sessionId) return;

      addLog('LEDGER: DECRYPTING TRANSACTIONAL ARTIFACTS...');
      const contracts = await getHybridContractHistory('', partyId);
      if (activeSessionRef.current !== sessionId) return;

      if (contracts && contracts.length > 0) {
        addLog(`LEDGER: ${contracts.length} NEURAL ARTIFACTS CAPTURED.`, 'success');
        addLog('CITY: RECONSTRUCTING NEURAL TOPOLOGY BASED ON INTERACTIONS...', 'info');
        await finishScan(participants, contracts);
      } else {
        addLog('LEDGER: NO DIRECT INTERACTIONS FOUND. ISOLATING CENTER NODE.', 'warn');
        await finishScan(participants, []);
      }
      if (activeSessionRef.current !== sessionId) return;

      addLog('UPLINK_ESTABLISHED: STREAMING DATA TO CORTEX DASHBOARD.');

      dashboardTimerRef.current = setTimeout(() => {
        if (activeSessionRef.current !== sessionId) return;
        dashboardTimerRef.current = null;
        setScanFinished(true);
        addLog('SYSTEM_OPERATIONAL: DASHBOARD_READY.', 'success');
      }, 1800);
    } catch (err: unknown) {
      if (activeSessionRef.current !== sessionId) return;
      const errMsg = err instanceof Error ? err.message : 'NEURAL_LINK_CRITICAL_FAILURE';
      setError(errMsg);
      addLog(`FATAL_ERROR: ${errMsg}`, 'error');
      addLog('EMERGENCY: SYSTEM REBOOT REQUIRED.');

      dashboardTimerRef.current = setTimeout(() => {
        if (activeSessionRef.current !== sessionId) return;
        dashboardTimerRef.current = null;
        setScanFinished(true);
      }, 3000);
    }
  }, [isScanning, startScan, finishScan, setError, addLog]);

  return {
    isScanning,
    error,
    terminalLogs,
    scanFinished,
    authDebug,
    initiateUplink,
    resetUplinkSession,
    addLog
  };
}
