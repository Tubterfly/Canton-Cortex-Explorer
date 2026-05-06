'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Edges, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Zap, ShieldCheck, Activity, Radio, Award, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

// Tip tanımlamaları ve Store bağlantısı
import { useCityStore, type CityState } from '@/store/useCityStore';

interface BuildingProps {
  id: string; 
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  type: 'PARTICIPANT' | 'VALIDATOR' | 'SUPER_VALIDATOR' | 'CENTER'; 
  coinHoldings?: number; 
  isVerified?: boolean;
}

// --- KRİTİK CERRAHİ: IMMUTABLE REFERENCE ---
// Sonsuz döngüyü (Infinite Loop) ve getSnapshot hatasını engelleyen sabit referans.
const EMPTY_FLAGS: string[] = [];

/**
 * ADVANCED BUILDING ARCHITECT (v22.0 - INTERACTIVE INTELLIGENCE NODE)
 * Optimizasyon: O(1) Shallow selector ile ilişkisel skorlar, noise suppression ve etkileşim durumları dahil edildi.
 * Intel: Bina artık sadece pasif bir mesh değil; tablodan seçilen işlemin taraflarına (highlight/focus) 
 * anında görsel tepki veren, mevcut istihbarat mantığını bozmadan çalışan bir reaktör.
 */
export default function Building({ id, position, height, color, label, type, coinHoldings, isVerified }: BuildingProps) {
  
  // --- KRİTİK CERRAHİ: O(1) SHALLOW SELECTOR ---
  // Sadece kendi kimliğimize ait zenginleştirilmiş istihbarat ve etkileşim verilerini çekiyoruz.
  const nodeData = useCityStore(
    useShallow((state: CityState) => {
      const isFocused = state.focusedPartyId === id;
      const isHighlighted = state.highlightedPartyIds ? state.highlightedPartyIds.includes(id) : false;

      // Merkez (Owner) her zaman en yüksek öneme sahiptir
      if (type === 'CENTER') {
        return {
          lastSeen: state.transactions?.[0]?.timestamp,
          riskFlags: EMPTY_FLAGS,
          isPromoted: true,
          isSuppressed: false,
          confidenceLabel: 'high',
          relationshipScore: 100,
          isFocused,
          isHighlighted
        };
      }
      
      const rank = state.counterpartyRanking?.find(r => r.partyId === id);
      const isPromoted = state.noiseSuppression?.promotedPartyIds?.includes(id) || false;
      const isSuppressed = state.noiseSuppression?.suppressedPartyIds?.includes(id) || false;
      
      return {
        lastSeen: rank?.lastSeen,
        riskFlags: rank?.riskFlags && rank.riskFlags.length > 0 ? rank.riskFlags : EMPTY_FLAGS,
        isPromoted,
        isSuppressed,
        confidenceLabel: rank?.confidenceLabel || 'medium',
        relationshipScore: rank?.score || 0,
        isFocused,
        isHighlighted
      };
    })
  );
  
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const superRingRef = useRef<THREE.Mesh>(null); 
  
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const centerCrystalMatRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const buildProgressRef = useRef(0.01);
  const hoverLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = useMemo(() => {
    const cleanName = label.split('::')[0];
    return cleanName.length > 20 ? `${cleanName.substring(0, 18)}...` : cleanName;
  }, [label]);

  const floorCount = useMemo(() => Math.max(Math.floor(height / 4), 1), [height]);

  const hasRisk = nodeData.riskFlags.length > 0;

  const handlePointerEnter = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (hoverLeaveTimeoutRef.current) {
      clearTimeout(hoverLeaveTimeoutRef.current);
      hoverLeaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handlePointerLeave = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (hoverLeaveTimeoutRef.current) clearTimeout(hoverLeaveTimeoutRef.current);
    hoverLeaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      hoverLeaveTimeoutRef.current = null;
    }, 90);
  };

  // --- R3F USEFRAME ENGINE (GPU-SIDED MATERIAL MUTATIONS) ---
  useFrame((_state, delta) => {
    // İnşa animasyonu
    if (buildProgressRef.current < 1) {
      buildProgressRef.current = Math.min(buildProgressRef.current + delta * 1.5, 1);
    }
    if (groupRef.current) groupRef.current.scale.y = buildProgressRef.current;

    // Emissive Pulsing (Nabız Efekti) & Cyber-Glitch
    const now = Date.now();
    const txTime = nodeData.lastSeen || 0;
    const diffMinutes = (now - txTime) / (1000 * 60);
    const freshnessFactor = Math.max(0, 1 - diffMinutes / 5); 

    const time = _state.clock.getElapsedTime();

    // --- ANALYST INTELLIGENCE & INTERACTION MODIFIERS ---
    const interactionMult = nodeData.isFocused ? 2.5 : nodeData.isHighlighted ? 1.5 : 1.0;
    const confMult = nodeData.confidenceLabel === 'high' ? 1.3 : nodeData.confidenceLabel === 'low' ? 0.4 : 1.0;
    const scoreInfluence = (nodeData.relationshipScore / 100) * 1.5; 
    
    // Zirve İstihbarat: Bastırılmış bir düğüm (suppressed) seçilirse/vurgulanırsa tamamen kaybolmaz, kontrollü belirginleşir.
    const suppressionMult = nodeData.isSuppressed 
      ? (nodeData.isFocused || nodeData.isHighlighted ? 0.6 : 0.15) 
      : nodeData.isPromoted ? 1.8 : 1.0;

    const basePulse = type === 'CENTER' 
      ? 1.5 + Math.sin(time * 3) * 0.5 
      : (0.3 + Math.sin(time * (2 + scoreInfluence)) * 0.1) * confMult * suppressionMult * interactionMult;

    // ARKHAM GLITCH: Eğer cüzdan riskliyse düzensiz voltaj titremesi yapar
    const riskJitter = hasRisk ? (Math.random() > 0.85 ? Math.random() * 3 : 0) : 0;

    const activeIntensity = (isHovered || freshnessFactor > 0 || nodeData.isFocused) 
      ? basePulse * (2 + freshnessFactor * 3) + riskJitter
      : (nodeData.lastSeen ? basePulse * 1.5 : basePulse) + riskJitter;

    // GPU-Zayıf Materyal Güncellemeleri
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = activeIntensity;
      
      // Dinamik Doku: Etkileşim ve İstihbarat durumuna göre pürüzlülük (roughness) ve şeffaflık
      if (nodeData.isFocused) {
         coreMatRef.current.opacity = 1.0;
         coreMatRef.current.roughness = 0.0; // Tamamen camsı ve net
         coreMatRef.current.metalness = 1.0;
      } else if (nodeData.isHighlighted) {
         coreMatRef.current.opacity = 0.98;
         coreMatRef.current.roughness = 0.05;
         coreMatRef.current.metalness = 0.95;
      } else if (nodeData.isSuppressed || nodeData.confidenceLabel === 'low') {
        coreMatRef.current.opacity = Math.max(0.2, 0.6 * suppressionMult);
        coreMatRef.current.roughness = 0.8; 
        coreMatRef.current.metalness = 0.2;
      } else {
        coreMatRef.current.opacity = nodeData.isPromoted ? 1.0 : 0.95;
        coreMatRef.current.roughness = nodeData.confidenceLabel === 'high' ? 0.05 : 0.1;
        coreMatRef.current.metalness = nodeData.confidenceLabel === 'high' ? 1.0 : 0.9;
      }
    }
    
    if (ringRef.current && ringMatRef.current) {
      ringRef.current.rotation.y += delta * (1.5 + scoreInfluence); // Skor yüksekse ring hızlı döner
      ringMatRef.current.emissiveIntensity = activeIntensity * 1.5;
    }
    if (superRingRef.current && ringMatRef.current) {
      superRingRef.current.rotation.x -= delta * 1.2;
      superRingRef.current.rotation.z += delta * 0.8;
    }
    if (centerCrystalMatRef.current && (type === 'CENTER' || type === 'SUPER_VALIDATOR')) {
      centerCrystalMatRef.current.emissiveIntensity = activeIntensity * 2;
    }
  });

  // DOM Culling Optimizasyonu: Sadece Merkez, SV'ler, Hover olanlar ve Vurgulananlar HTML renderlar.
  const showHtml = isHovered || nodeData.isFocused || nodeData.isHighlighted;

  return (
    <group 
      position={position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[type === 'CENTER' ? 10 : 6, 0.2, type === 'CENTER' ? 10 : 6]} />
        <meshStandardMaterial color="#050505" metalness={1} roughness={0.5} />
      </mesh>

      <group ref={groupRef}>
        <mesh position={[0, height / 2, 0]} castShadow>
          {type === 'PARTICIPANT' ? (
            <boxGeometry args={[4, height, 4]} />
          ) : (
            <cylinderGeometry args={[type === 'CENTER' ? 5 : (type === 'SUPER_VALIDATOR' ? 4.5 : 3), type === 'CENTER' ? 6 : 4, height, type === 'CENTER' ? 6 : (type === 'SUPER_VALIDATOR' ? 8 : 4)]} />
          )}
          <meshStandardMaterial 
            ref={coreMatRef}
            color="#010101" 
            emissive={hasRisk && isHovered ? '#ef4444' : color} // Riskliyse hoverda kırmızı parlar
            transparent 
            opacity={0.95} 
            roughness={0.1}
            metalness={0.9}
          />
          {/* AŞAMA 5: Edges (Çizgiler) Etkileşime Göre Reaksiyon Verir */}
          <Edges 
            scale={1} 
            threshold={20} 
            color={
              nodeData.isFocused ? '#ffffff' :
              hasRisk && isHovered ? '#ef4444' : 
              nodeData.isHighlighted ? '#a5f3fc' : // Vurgulu için parlak cyan
              (nodeData.isSuppressed ? '#333333' : (isHovered ? "#ffffff" : color))
            } 
          />
          
          {Array.from({ length: floorCount }).map((_, i) => (
            <group key={i} position={[0, (i * 4) - (height / 2) + 2, 0]}>
              <mesh>
                <boxGeometry args={[type === 'CENTER' ? 5.2 : (type === 'SUPER_VALIDATOR' ? 4.7 : 4.2), 0.05, type === 'CENTER' ? 5.2 : (type === 'SUPER_VALIDATOR' ? 4.7 : 4.2)]} />
                <meshBasicMaterial color={hasRisk && isHovered ? '#ef4444' : color} transparent opacity={0.15} />
              </mesh>
              {(isHovered || nodeData.lastSeen || nodeData.isFocused) && (
                <mesh position={[type === 'CENTER' ? 2.6 : (type === 'SUPER_VALIDATOR' ? 2.3 : 2.1), 0, 0]}>
                  <boxGeometry args={[0.1, 0.5, 0.5]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={(nodeData.lastSeen || nodeData.isFocused) ? 0.8 : 0.4} />
                </mesh>
              )}
            </group>
          ))}
        </mesh>

        <group position={[0, height, 0]}>
          {type === 'CENTER' || type === 'SUPER_VALIDATOR' ? (
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
              <mesh rotation={[0, Math.PI / 4, 0]} position={[0, type === 'SUPER_VALIDATOR' ? 2 : 0, 0]}>
                <octahedronGeometry args={[type === 'SUPER_VALIDATOR' ? 4 : 3, 0]} />
                <meshStandardMaterial 
                  ref={centerCrystalMatRef}
                  color={hasRisk ? '#ef4444' : color} 
                  emissive={hasRisk ? '#ef4444' : color} 
                  wireframe 
                />
              </mesh>
            </Float>
          ) : (
            <group>
              <mesh position={[1, 2, 1]}>
                <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
                <meshBasicMaterial color={hasRisk && isHovered ? '#ef4444' : color} />
              </mesh>
              <mesh position={[-1, 1.5, -1]}>
                <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          )}
        </group>

        {(type === 'VALIDATOR' || type === 'SUPER_VALIDATOR') && (
          <group position={[0, height + 1, 0]}>
            <mesh ref={ringRef}>
              <torusGeometry args={[type === 'SUPER_VALIDATOR' ? 6 : 4.5, 0.1, 16, 100]} />
              <meshStandardMaterial 
                ref={ringMatRef}
                color={hasRisk ? '#ef4444' : color} 
                emissive={hasRisk ? '#ef4444' : color} 
              />
            </mesh>
            {type === 'SUPER_VALIDATOR' && (
              <mesh ref={superRingRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[7, 0.05, 16, 100]} />
                <meshStandardMaterial 
                  color="#ffffff" 
                  emissive="#ffffff"
                  emissiveIntensity={0.5}
                />
              </mesh>
            )}
          </group>
        )}
      </group>

      {showHtml && (
        <Html 
          position={[0, height + (type === 'CENTER' ? 10 : (type === 'SUPER_VALIDATOR' ? 12 : 6)), 0]} 
          center 
          zIndexRange={nodeData.isFocused ? [150, 0] : [100, 0]}
        >
          <div className={`w-[220px] px-5 py-3 font-mono text-[10px] border-l-4 shadow-2xl backdrop-blur-2xl pointer-events-none select-none ${
              nodeData.isFocused ? 'opacity-100 scale-110' : 'opacity-100 scale-100'
            } ${
              nodeData.isFocused 
                ? 'bg-cyan-900/80 border-cyan-300 text-cyan-100 shadow-[0_0_35px_rgba(6,182,212,0.6)]' 
                : nodeData.isHighlighted
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : hasRisk
                    ? 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                    : nodeData.isSuppressed 
                      ? 'bg-black/60 border-white/10 text-white/40' 
                      : type === 'CENTER' 
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                        : type === 'SUPER_VALIDATOR'
                          ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
                          : type === 'VALIDATOR' 
                            ? 'bg-pink-500/15 border-pink-500 text-pink-400' 
                            : 'bg-black/90 border-cyan-500/40 text-cyan-400'
            }`}>
            <div className="flex items-center gap-3">
              {hasRisk ? <AlertTriangle size={14} className="animate-pulse text-red-500" /> : 
               nodeData.isFocused ? <Zap size={14} className="animate-pulse text-cyan-300" /> :
               type === 'CENTER' ? <Zap size={14} className="animate-pulse" /> : 
               type === 'SUPER_VALIDATOR' ? <Award size={14} className="animate-pulse" /> :
               type === 'VALIDATOR' ? <ShieldCheck size={14} /> : 
               <Radio size={14} className={nodeData.isSuppressed ? 'opacity-50' : 'animate-pulse'} />}
              <span className="tracking-[0.3em] font-black uppercase italic">{displayName}</span>
              {isVerified && <ShieldCheck size={12} className="text-blue-400 ml-1" />}
            </div>
            
            {(isHovered || type === 'CENTER' || type === 'SUPER_VALIDATOR' || nodeData.lastSeen || nodeData.isFocused) && (
              <div className="mt-2 text-[8px] text-white/30 border-t border-white/10 pt-2 flex flex-col gap-1">
                {nodeData.isFocused && (
                  <div className="flex justify-between gap-4 mb-1">
                    <span className="uppercase font-black tracking-tighter text-cyan-300">TARGET_LOCKED</span>
                    <Activity size={10} className="text-cyan-400 animate-pulse" />
                  </div>
                )}
                
                <div className="flex justify-between gap-4">
                  <span className="uppercase font-bold tracking-tighter">DATA_NODE_SECURED</span>
                  <span className="font-mono tabular-nums text-white/50">{height.toFixed(0)} FL</span>
                </div>
                {(coinHoldings !== undefined && coinHoldings > 0) && (
                  <div className="flex justify-between gap-4">
                     <span className="uppercase font-bold tracking-tighter text-amber-500/60">HOLDINGS</span>
                     <span className="font-mono tabular-nums text-amber-500/80">{coinHoldings.toFixed(2)}</span>
                  </div>
                )}
                
                {/* --- ANALYST INTELLIGENCE UI INJECTIONS --- */}
                {nodeData.isPromoted && (
                  <div className="flex justify-between gap-4 mt-1 border-t border-cyan-500/30 pt-1">
                     <span className="uppercase font-bold tracking-tighter text-cyan-400">SIGNAL</span>
                     <span className="font-mono text-cyan-300">PROMOTED</span>
                  </div>
                )}
                {nodeData.isSuppressed && (
                  <div className="flex justify-between gap-4 mt-1 border-t border-white/10 pt-1">
                     <span className="uppercase font-bold tracking-tighter text-white/30">SIGNAL</span>
                     <span className="font-mono text-white/20">SUPPRESSED</span>
                  </div>
                )}
                {nodeData.relationshipScore > 0 && type !== 'CENTER' && (
                  <div className="flex justify-between gap-4 mt-1">
                     <span className="uppercase font-bold tracking-tighter text-blue-400/80">REL_SCORE</span>
                     <span className="font-mono text-blue-300">{nodeData.relationshipScore.toFixed(0)}</span>
                  </div>
                )}
                {type !== 'CENTER' && (
                  <div className="flex justify-between gap-4 mt-1">
                     <span className="uppercase font-bold tracking-tighter text-purple-400/80">CONFIDENCE</span>
                     <span className={`font-mono ${nodeData.confidenceLabel === 'high' ? 'text-green-400' : nodeData.confidenceLabel === 'low' ? 'text-red-400' : 'text-yellow-400'}`}>
                       {nodeData.confidenceLabel.toUpperCase()}
                     </span>
                  </div>
                )}

                {/* Arkham Intelligence Risk Bayrakları */}
                {hasRisk && (
                  <div className="flex flex-col gap-1 mt-1 border-t border-red-500/20 pt-1">
                    {nodeData.riskFlags.map((flag, idx) => (
                      <div key={idx} className="flex items-center justify-between text-red-400/80 uppercase font-black text-[6px] tracking-widest">
                        <span>{flag.replace(/_/g, ' ')}</span>
                        <AlertTriangle size={8} />
                      </div>
                    ))}
                  </div>
                )}
                {nodeData.lastSeen && (
                  <div className="flex items-center gap-2 text-green-500/60 font-black tracking-widest text-[7px] uppercase mt-1">
                    <Activity size={8} className="animate-pulse" />
                    Last_Uplink: {new Date(nodeData.lastSeen).toLocaleTimeString([], { hour12: false })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
