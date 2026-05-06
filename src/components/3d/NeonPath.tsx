'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useCityStore, type Transaction } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow';
import { ShieldCheck, Activity, Zap, Cpu, AlertTriangle, Database } from 'lucide-react';

type NeonPathPayload = Partial<Transaction> & {
  _uniqueKey?: string;
  updateId?: string;
  eventId?: string;
  contractId?: string;
  _fromId?: string;
  synchronizerId?: string;
  _toId?: string;
  _amount?: number;
  _timelineBucket?: string;
  _riskFlags?: string[];
  _relationshipScore?: number;
  _aggregate?: {
    totalAmount?: number;
  };
};

type DashedLineLike = THREE.Object3D & {
  dashOffset?: number;
};

const stableValueFromText = (value: string, modulo: number, offset = 0): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) % 2147483647;
  }
  return (hash % modulo) + offset;
};

interface NeonPathProps {
  start: [number, number, number]; 
  end: [number, number, number];   
  color: string;
  label: string;
  payload?: NeonPathPayload; // Gerçek veri entegrasyonu (Amount, Risk, Timeline)
}

/**
 * NEURAL PATH: DATA FLOW VISUALIZER (v6.2 - INTERACTIVE ANALYST EDITION)
 * Jitter-Fix: Aynı noktalar arası hatların üst üste binmesi deterministik sapma ile fixlendi.
 * Intel: Tablo seçimleri (selectedTransaction, highlightedParties) ile sahnede anlık
 *        odaklanma (Focus & Highlight) ve arka planı sönükleştirme (Backgrounding) eklendi.
 */
export default function NeonPath({ start, end, color, label, payload }: NeonPathProps) {
  const lightRef = useRef<THREE.Group>(null!);
  const dashedLineRef = useRef<DashedLineLike | null>(null);
  
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  
  const deterministicSeed = useMemo(() => `${label}-${start.join(',')}-${end.join(',')}`, [label, start, end]);
  const progressRef = useRef(stableValueFromText(deterministicSeed, 1000) / 1000);
  const [isNear, setIsNear] = useState(false);
  const distanceCheckCounter = useRef(stableValueFromText(deterministicSeed, 30));

  // --- OMNI-STATE BAĞLANTISI (AŞAMA 4) ---
  // Store'dan tablo etkileşimlerini çekiyoruz.
  const { selectedTransactionId, highlightedPartyIds } = useCityStore(
    useShallow((state) => ({
      selectedTransactionId: state.selectedTransactionId,
      highlightedPartyIds: state.highlightedPartyIds || [],
    }))
  );

  // Payload içinden kimlik çıkarımı (City.tsx'i bozmamak için payload içinden tespit edilir)
  const txId = payload?._uniqueKey || payload?.updateId || payload?.eventId || payload?.contractId || payload?.id;
  const fromId = payload?._fromId || payload?.fromId || payload?.synchronizerId;
  const toId = payload?._toId || payload?.toId;

  // --- ETKİLEŞİM DURUMLARI (INTERACTION STATES) ---
  const isSelected = !!selectedTransactionId && txId === selectedTransactionId;
  const isHighlighted = highlightedPartyIds.length > 0 && (
    (!!fromId && highlightedPartyIds.includes(fromId)) ||
    (!!toId && highlightedPartyIds.includes(toId))
  );
  const isBackgrounded = (!!selectedTransactionId || highlightedPartyIds.length > 0) && !isSelected && !isHighlighted;

  // --- ARKHAM INTELLIGENCE: VERİ BAĞLANTILARI ---
  const amount = Number(payload?.amount || payload?._amount || payload?._aggregate?.totalAmount || 0);
  const isWhale = amount >= 1000;
  const timelineBucket = payload?._timelineBucket || 'UNKNOWN';
  const hasRisk = payload?._riskFlags && payload._riskFlags.length > 0;
  
  // Yüksek güven ve skorlu ilişkiler biraz daha kalın ve parlak olur
  const isHighConfidence = (payload?._relationshipScore || 0) >= 80 || payload?.confidenceLabel === 'high';

  // Parasal hacme göre veri paketinin (plazma topu) logaritmik büyümesi
  const packetScale = useMemo(() => {
    return Math.min(3.5, 1 + Math.log10(amount + 1) * 0.25);
  }, [amount]);

  // Baz Genişlik ve Opaklık Hesaplaması (Zaman Dilimine Göre)
  const { baseWidth, baseOpacity, baseSpeed } = useMemo(() => {
    switch (timelineBucket) {
      case 'HOT_24H': return { baseWidth: 3.5, baseOpacity: 0.4, baseSpeed: 1.8 };
      case 'ACTIVE_7D': return { baseWidth: 2.2, baseOpacity: 0.25, baseSpeed: 1.0 };
      case 'STALE': return { baseWidth: 1.0, baseOpacity: 0.1, baseSpeed: 0.5 };
      default: return { baseWidth: 1.8, baseOpacity: 0.2, baseSpeed: 0.8 };
    }
  }, [timelineBucket]);

  // Nihai Çizgi Özellikleri (Etkileşim + Güven Çarpanları Eklenmiş)
  const { lineWidth, lineOpacity, speedMult } = useMemo(() => {
    let w = baseWidth * (isHighConfidence ? 1.2 : 1.0);
    let o = baseOpacity * (isHighConfidence ? 1.2 : 1.0);
    let s = baseSpeed;

    if (isSelected) {
      w *= 2.5; // Seçili hat çok daha kalın
      o = Math.min(1.0, o * 2.5); // Parlaklık artar
      s *= 1.5; // Veri akışı hızlanır
    } else if (isHighlighted) {
      w *= 1.3; // Highlighted node'lara giden hatlar hafif kalın
      o = Math.min(1.0, o * 1.5);
      s *= 1.2;
    } else if (isBackgrounded) {
      w *= 0.4; // Odak dışı hatlar incelir
      o *= 0.15; // Odak dışı hatlar sönükleşir
      s *= 0.3; // Odak dışı hatlar yavaşlar
    }

    return { lineWidth: w, lineOpacity: o, speedMult: s };
  }, [baseWidth, baseOpacity, baseSpeed, isHighConfidence, isSelected, isHighlighted, isBackgrounded]);

  // Seçili işlemleri sahnede hemen fark ettirecek özel renk ezmesi (override)
  const activeColor = hasRisk ? '#ef4444' : isSelected ? '#67e8f9' : color;

  // --- KRİTİK CERRAHİ: DETERMINISTIC FIBER JITTER ---
  const curve = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const distance = vStart.distanceTo(vEnd);
    const midPoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);

    const seed = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetSide = (seed % 2 === 0 ? 1 : -1) * (seed % 5);
    
    midPoint.y += Math.max(distance * 0.4, 15) + (seed % 10);
    midPoint.x += offsetSide; 
    
    return new THREE.QuadraticBezierCurve3(vStart, midPoint, vEnd);
  }, [start, end, label]);

  const points = useMemo(() => curve.getPoints(50), [curve]);

  useFrame((_state, delta) => {
    const time = _state.clock.elapsedTime;
    
    progressRef.current = (progressRef.current + delta * 0.4 * speedMult) % 1;
    const currentProgress = progressRef.current;

    distanceCheckCounter.current++;
    if (distanceCheckCounter.current >= 30) {
      distanceCheckCounter.current = 0;
      const checkPoint = curve.getPointAt(0.5);
      const distSq = _state.camera.position.distanceToSquared(checkPoint);
      const near = distSq < 70000; 
      if (near !== isNear) setIsNear(near);
    }

    if (lightRef.current) {
      const position = curve.getPointAt(currentProgress);
      lightRef.current.position.copy(position);

      const basePulse = Math.sin(currentProgress * Math.PI) * 1.6 + 0.4;
      // Paket boyutunu etkileşimle büyütme
      const focusScaleMult = isSelected ? 1.5 : isBackgrounded ? 0.5 : 1.0;
      const finalScale = basePulse * packetScale * focusScaleMult; 
      lightRef.current.scale.set(finalScale, finalScale, finalScale);
      
      if (coreMatRef.current) {
        let intensity = 25 + Math.sin(time * 10 * speedMult) * 10 + Math.sin(currentProgress * 25) * 15;
        // Plazma çekirdeği etkileşim şiddeti
        if (isSelected) intensity *= 3.0;
        else if (isHighlighted) intensity *= 1.5;
        else if (isBackgrounded) intensity *= 0.1;
        
        coreMatRef.current.emissiveIntensity = intensity;
      }
      
      if (glowMatRef.current) {
        let gOp = (isWhale ? 0.15 : 0.08) + Math.sin(time * 5) * 0.04;
        // Plazma halesi etkileşim şiddeti
        if (isSelected) gOp *= 3.0;
        else if (isHighlighted) gOp *= 1.5;
        else if (isBackgrounded) gOp = 0.01;
        
        glowMatRef.current.opacity = gOp;
      }
    }

    if (dashedLineRef.current) {
      dashedLineRef.current.dashOffset = -time * 2.5 * speedMult;
    }
  });

  const displayLabel = useMemo(() => {
    if (payload?.action) return payload.action;
    return label.split('@')[0].replace('Unknown_', '').slice(0, 16);
  }, [label, payload]);

  // Etiket Görünürlüğü: Eğer hat seçiliyse mesafeden bağımsız her zaman gösterilir. Eğer arka plandaysa tamamen gizlenir.
  const showLabel = isSelected || (isNear && !isBackgrounded);

  return (
    <group>
      {/* 1. STATİK TAŞIYICI HAT (FIBER CORE) */}
      <Line points={points} color={activeColor} lineWidth={0.8} transparent opacity={isBackgrounded ? 0.02 : 0.08} />

      {/* 2. DİNAMİK NEURAL STREAM */}
      <Line
        ref={(instance) => {
          dashedLineRef.current = instance as DashedLineLike | null;
        }}
        points={points}
        color={activeColor} 
        lineWidth={lineWidth} 
        dashed
        dashSize={1.2}
        gapSize={2.8}
        transparent
        opacity={lineOpacity}
      />

      {/* 3. HAREKETLİ VERİ PAKETİ */}
      <group ref={lightRef}>
        <mesh>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial 
            ref={coreMatRef}
            color="#ffffff" 
            emissive={activeColor} 
            emissiveIntensity={40} 
            toneMapped={false}
          />
        </mesh>
        
        <mesh scale={2.8}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial 
            ref={glowMatRef}
            color={activeColor} 
            transparent 
            opacity={0.12} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 4. NEURAL HUD LABEL */}
      {showLabel && (
        <Float speed={3} rotationIntensity={0.05} floatIntensity={0.4}>
          <Html position={curve.getPointAt(0.5)} center distanceFactor={22} zIndexRange={isSelected ? [100, 0] : [50, 0]}>
            <div className="flex flex-col items-center pointer-events-none select-none">
              <div className="w-[1px] h-10 bg-gradient-to-t from-white/20 to-transparent" />
              <div className={`bg-[#050505]/95 border-l-2 ${hasRisk ? 'border-red-500/80' : isSelected ? 'border-cyan-300' : 'border-white/10'} backdrop-blur-3xl p-3 shadow-2xl min-w-[160px] relative overflow-hidden transition-all duration-500 ${isSelected ? 'scale-110 shadow-[0_0_40px_rgba(103,232,249,0.2)]' : 'scale-100'}`}>
                {/* Glow Overlay */}
                <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-20`} style={{ backgroundColor: activeColor }} />
                
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="flex items-center gap-1.5">
                    <Cpu size={10} className={hasRisk ? 'text-red-400' : isSelected ? 'text-cyan-300' : 'text-white/40'} />
                    <span className={`text-[10px] font-black tracking-widest uppercase truncate max-w-[100px] ${hasRisk ? 'text-red-400' : isSelected ? 'text-cyan-300' : 'text-white/90'}`}>
                      {displayLabel}
                    </span>
                  </div>
                  {isWhale ? <Database size={10} className="text-cyan-400 animate-pulse" /> : <Zap size={10} className="text-yellow-500/80 animate-pulse" />}
                </div>
                
                <div className="space-y-1.5">
                  {amount > 0 && (
                    <div className="flex justify-between items-center bg-white/5 px-1.5 py-0.5 rounded-sm mb-1">
                      <span className="text-[7px] font-mono text-white/40 uppercase italic">Value</span>
                      <span className={`text-[8px] font-mono font-black uppercase ${isWhale ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'text-white/80'}`}>
                        {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center bg-white/5 px-1.5 py-0.5 rounded-sm">
                    <span className="text-[7px] font-mono text-white/30 uppercase italic">Packet</span>
                    <span className="text-[7px] font-mono text-white/70 font-bold uppercase">
                      {payload?.round ? `Rnd_${payload.round}` : (timelineBucket.replace('_', ' '))}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center px-1.5 mt-1 pt-1 border-t border-white/5">
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">Status</span>
                    {hasRisk ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={9} className="text-red-500/80 animate-pulse" />
                        <span className="text-[7px] font-mono text-red-500/90 font-black">RISK DETECTED</span>
                      </div>
                    ) : isSelected ? (
                       <div className="flex items-center gap-1">
                        <Activity size={9} className="text-cyan-300 animate-pulse" />
                        <span className="text-[7px] font-mono text-cyan-300 font-black">TARGET LOCKED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={9} className="text-green-500/60" />
                        <span className="text-[7px] font-mono text-green-500/80 font-black">SECURED</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Html>
        </Float>
      )}
    </group>
  );
}

