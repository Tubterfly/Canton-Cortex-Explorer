'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Html } from '@react-three/drei';
import { useCityStore, type Building as BuildingNode, type ClusterHint, type Transaction } from '@/store/useCityStore';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow'; // Performans kalkanı
import Building from './Building';
import NeonPath from './NeonPath';
import PrivacyDome from './PrivacyDome';

type DistrictType = ClusterHint['type'];
type DistrictGroupKey = DistrictType | 'GENERAL';

type LayoutBuilding = BuildingNode & {
  position: [number, number, number];
};

/**
 * CITY COMPONENT: NEURAL TOPOLOGY SIMULATOR (v6.1 - DISTRICT CLUSTERING)
 * Optimizasyon: useShallow ile alakasız store değişimlerinin şehri sarsması %100 engellendi.
 * Intel: Cluster (Bölge) mantığı eklendi. Binalar ilişki gücüne ve bastırma (suppression) 
 * durumlarına göre ilgili mahallelerine (Districts) organik olarak dizilir.
 */
export default function City() {
  
  // --- KRİTİK SEÇİCİ ---
  // Store'dan sadece gerekli dizileri çekiyoruz. 
  // Cluster bölgelemesi ve görünürlük hiyerarşisi için yeni alanlar eklendi.
  const { buildings, transactions, counterpartyRanking, clusterHints, noiseSuppression } = useCityStore(
    useShallow((state) => ({
      buildings: state.buildings,
      transactions: state.transactions,
      counterpartyRanking: state.counterpartyRanking,
      clusterHints: state.clusterHints,
      noiseSuppression: state.noiseSuppression
    }))
  );

  // --- NEURAL LAYOUT ENGINE (ARKHAM DISTRICT STYLE) ---
  // Matematiksel dizilim, Cluster (Küme) tespiti yapılarak bölgelere ayrıldı.
  const layoutMap = useMemo(() => {
    const map = new Map<string, LayoutBuilding>();
    const GRID_SIZE = 350; // District'lerin sığması için ızgara genişletildi
    const MAX_RADIUS = (GRID_SIZE / 2) - 10; 

    const centerNode = buildings.find(b => b.type === 'CENTER');
    const superValidators = buildings.filter(b => b.type === 'SUPER_VALIDATOR');
    const validators = buildings.filter(b => b.type === 'VALIDATOR');
    
    // --- İSTİHBARAT HARİTALAMA ---
    const clusterMap = new Map<string, DistrictType>();
    clusterHints?.forEach(cluster => {
      cluster.memberPartyIds?.forEach(id => {
        clusterMap.set(id, cluster.type);
      });
    });

    const promotedSet = new Set(noiseSuppression?.promotedPartyIds || []);
    const suppressedSet = new Set(noiseSuppression?.suppressedPartyIds || []);
    const scoreMap = new Map(counterpartyRanking?.map(r => [r.partyId, r.score]) || []);

    // Hiyerarşik Sıralama: Promoted (Önde) -> Score (Yüksekten düşüğe) -> Suppressed (Arkada)
    const sortNodes = (a: BuildingNode, b: BuildingNode) => {
      const aProm = promotedSet.has(a.id);
      const bProm = promotedSet.has(b.id);
      if (aProm && !bProm) return -1;
      if (!aProm && bProm) return 1;

      const aSupp = suppressedSet.has(a.id);
      const bSupp = suppressedSet.has(b.id);
      if (aSupp && !bSupp) return 1;
      if (!aSupp && bSupp) return -1;

      return (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0);
    };

    const participants = buildings.filter(b => b.type === 'PARTICIPANT');
    
    // Katılımcıları kendi mahallelerine (Districts) ayırıyoruz
    const groups: Record<DistrictGroupKey, BuildingNode[]> = {
      APP: [], GOVERNANCE: [], OPERATIONS: [], VALIDATOR: [], GENERAL: []
    };

    participants.forEach(p => {
      const cType: DistrictGroupKey = clusterMap.get(p.id) || 'GENERAL';
      if (groups[cType]) groups[cType].push(p);
      else groups.GENERAL.push(p);
    });

    // Her mahalleyi kendi içinde önem sırasına diziyoruz
    Object.values(groups).forEach(g => g.sort(sortNodes));

    const getNormalizedHeight = (rawHeight: number, type: string) => {
      if (type === 'CENTER') return 35; 
      if (type === 'SUPER_VALIDATOR') return 28;
      const logHeight = Math.log10(rawHeight + 1) * 8; 
      return Math.min(Math.max(4, logHeight), 25); 
    };

    // 1. CENTER YERLEŞİMİ
    if (centerNode) {
      map.set(centerNode.id, {
        ...centerNode,
        height: getNormalizedHeight(centerNode.height, 'CENTER'),
        position: [0, 0, 0] 
      });
    }

    // 2. SUPER VALIDATOR YERLEŞİMİ (Orta Yörünge)
    const svRadius = 18;
    superValidators.forEach((sv, i) => {
      const angle = (i / superValidators.length) * Math.PI * 2;
      map.set(sv.id, {
        ...sv,
        height: getNormalizedHeight(sv.height, 'SUPER_VALIDATOR'),
        position: [Math.cos(angle) * svRadius, 0, Math.sin(angle) * svRadius]
      });
    });

    // 3. VALIDATOR YERLEŞİMİ (İç Yörünge - 12 birim)
    const validatorRadius = 12;
    validators.forEach((v, i) => {
      const angle = (i / validators.length) * Math.PI * 2;
      map.set(v.id, { 
        ...v, 
        height: getNormalizedHeight(v.height, 'VALIDATOR'),
        position: [
          Math.cos(angle) * validatorRadius, 
          0, 
          Math.sin(angle) * validatorRadius
        ] 
      });
    });

    // 4. DISTRICT (MAHALLE) BAZLI YERLEŞİM
    const layoutGroup = (groupArr: BuildingNode[], centerX: number, centerZ: number, baseRadius: number, ringSpacing: number) => {
      let currentRing = 1;
      let itemsInCurrentRing = 6;
      let indexInRing = 0;

      groupArr.forEach((p) => {
        if (indexInRing >= itemsInCurrentRing) {
          currentRing++;
          itemsInCurrentRing = Math.floor(currentRing * 6);
          indexInRing = 0;
        }
        
        const isSuppressed = suppressedSet.has(p.id);
        const isPromoted = promotedSet.has(p.id);
        
        // Zirve İstihbarat: Promoted daha merkeze, Suppressed mahallenin en dışına itilir
        const effectiveRing = isSuppressed ? currentRing + 3 : isPromoted ? Math.max(1, currentRing - 1) : currentRing;
        
        const radius = Math.min(baseRadius + (effectiveRing - 1) * ringSpacing, MAX_RADIUS);
        const angle = (indexInRing / itemsInCurrentRing) * Math.PI * 2;
        
        // Deterministik Noise Hesabı (Organik dağılım için)
        const seed = p.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const noiseX = ((seed % 15) / 10 - 0.75) * 1.5; 
        const noiseZ = (((seed * 11) % 15) / 10 - 0.75) * 1.5;

        map.set(p.id, { 
          ...p, 
          height: getNormalizedHeight(p.height, 'PARTICIPANT'),
          position: [
            centerX + Math.cos(angle) * radius + noiseX, 
            0, 
            centerZ + Math.sin(angle) * radius + noiseZ
          ] 
        });
        indexInRing++;
      });
    };

    // Mahalle Merkezleri Koordinatları ve Çizimi
    layoutGroup(groups.GENERAL, 0, 0, 32, 12); // Merkez etrafında, validatorleri saran ana ağ
    layoutGroup(groups.APP, 65, 45, 10, 8); // Uygulama Bölgesi (Kuzeydoğu)
    layoutGroup(groups.GOVERNANCE, -65, 45, 10, 8); // Yönetişim Bölgesi (Kuzeybatı)
    layoutGroup(groups.OPERATIONS, -55, -55, 10, 8); // Operasyon Bölgesi (Güneybatı)
    layoutGroup(groups.VALIDATOR, 55, -55, 10, 8); // Alt-Validator Kümesi (Güneydoğu)

    return map;
  }, [buildings, counterpartyRanking, clusterHints, noiseSuppression]);

  // Sahnede aşırı karmaşayı önlemek için en güncel işlemleri (maks 40) çizeriz.
  const visibleTransactions = useMemo(() => {
    return transactions.slice(0, 40); 
  }, [transactions]);

  const layoutArray = Array.from(layoutMap.values());
  const centerNodeData = buildings.find(b => b.type === 'CENTER');

  // Hangi mahallelerin aktif olduğunu buluyoruz ki zemin etiketlerini dinamik çizelim
  const activeDistricts = useMemo(
    () => new Set<DistrictType>(clusterHints?.map(c => c.type) || []),
    [clusterHints]
  );

  // Mahalle Zemin Göstergeleri (Performans dostu şeffaf halkalar)
  const districts: Array<{ id: DistrictType; center: [number, number, number]; color: string; label: string }> = [
    { id: 'APP', center: [65, 0, 45], color: '#10b981', label: 'APP_DISTRICT' },
    { id: 'GOVERNANCE', center: [-65, 0, 45], color: '#8b5cf6', label: 'GOV_DISTRICT' },
    { id: 'OPERATIONS', center: [-55, 0, -55], color: '#3b82f6', label: 'OPS_DISTRICT' },
    { id: 'VALIDATOR', center: [55, 0, -55], color: '#fbbf24', label: 'VAL_DISTRICT' },
  ];

  return (
    <div 
      className="w-full h-full bg-[#020202] relative outline-none"
      style={{ contain: 'layout paint size' }} 
    >
      <Canvas 
        shadows={false} 
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          alpha: false
        }}
        dpr={[1, 1.5]} 
        raycaster={{
          far: 200, 
          near: 0.1,
          params: {
            Mesh: {},
            Line: { threshold: 0.05 },
            LOD: {},
            Points: { threshold: 0.05 },
            Sprite: {}
          }
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
        }}
      >
        <color attach="background" args={['#010101']} />
        <fog attach="fog" args={['#010101', 30, 180]} />
        
        <PerspectiveCamera makeDefault position={[90, 70, 90]} fov={42} />
        
        <ambientLight intensity={0.5} />
        <Stars radius={150} depth={40} count={3000} factor={3} saturation={0.5} fade speed={0.5} />
        
        <OrbitControls 
          makeDefault 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={20} 
          maxDistance={180}
          target={[0, 2, 0]}
          enableDamping
          dampingFactor={0.2} 
        />

        <gridHelper 
          args={[300, 30, '#06b6d4', '#050505']} 
          position={[0, -0.05, 0]} 
          material-transparent={true} 
          material-opacity={0.08} 
        />

        {/* DISTRICT INDICATORS (MAHALLE ZEMİNLERİ) */}
        {districts.map(d => activeDistricts.has(d.id) && (
          <group key={d.id} position={[d.center[0], 0.02, d.center[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8, 35, 64]} />
              <meshBasicMaterial color={d.color} transparent opacity={0.03} side={THREE.DoubleSide} />
            </mesh>
            <Html position={[0, 0, 0]} center distanceFactor={25} zIndexRange={[0, 0]}>
              <div className="text-[8px] font-mono font-black tracking-[0.4em] uppercase text-white/20 select-none pointer-events-none drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                {d.label}
              </div>
            </Html>
          </group>
        ))}

        {layoutArray.map((b) => (
          <Building 
            key={b.id} 
            id={b.id}
            position={b.position} 
            color={b.color} 
            height={b.height} 
            label={b.id} 
            type={b.type}
            coinHoldings={b.coinHoldings}
            isVerified={b.isVerified}
          />
        ))}

        {visibleTransactions.map((tx: Transaction) => {
           const from = layoutMap.get(tx.fromId);
           const to = layoutMap.get(tx.toId);
           if (!from || !to) return null;
           
           return (
             <NeonPath 
               key={tx.id} 
               start={[from.position[0], from.height, from.position[2]]} 
               end={[to.position[0], to.height, to.position[2]]} 
               color={from.color} 
               label={tx.templateId}
               payload={tx.payload} 
             />
           );
        })}

        {centerNodeData && (
          <PrivacyDome 
            position={[0, 0, 0]} 
            radius={18} 
            color="#06b6d4" 
            active={true} 
          />
        )}
      </Canvas>
    </div>
  );
}
