'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useCityStore } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow';

interface PrivacyDomeProps {
  position: [number, number, number];
  radius: number;
  color: string;
  active: boolean;
}

/**
 * PRIVACY DOME: NEURAL ENCRYPTION SHIELD (v6.0 - ARKHAM INTELLIGENCE ALIGNED)
 * Geliştirme: Ağ trafiğine göre anlık tepki veren rezonans motoru eklendi.
 * Arkham Intel: Net para akışına (Net Flow) ve Risk durumlarına göre kalkanın
 * rengi ve savunma frekansı dinamik olarak değişir (Yeşil: Giriş, Pembe: Çıkış, Kırmızı: Risk).
 * Optimizasyon: useShallow ile gereksiz render'lar engellendi, animasyonlar ref-based kaldı.
 */
export default function PrivacyDome({ position, radius, color, active }: PrivacyDomeProps) {
  const shellRef = useRef<THREE.Mesh>(null!);
  const wireframeRef = useRef<THREE.Mesh>(null!);
  const glowRingRef = useRef<THREE.Mesh>(null!);
  const floorGlowRef = useRef<THREE.Mesh>(null!); // Yeni: Yer yansıması

  // MATERYAL REFERANSLARI
  const shellMatRef = useRef<any>(null!);
  const wireMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const floorMatRef = useRef<THREE.MeshBasicMaterial>(null!);

  // --- KRİTİK VERİ BAĞLANTISI (ARKHAM INTELLIGENCE) ---
  // Merkeze gelen trafiği, hata durumunu ve cüzdanın net para akışını izler.
  const { lastTxTime, hasError, walletSummary } = useCityStore(
    useShallow((state) => ({
      lastTxTime: state.transactions[0]?.timestamp || 0,
      hasError: !!state.error,
      walletSummary: state.walletSummary
    }))
  );

  const domeArgs = useMemo<[number, number, number, number, number, number, number]>(() => [
    radius,       
    40,           
    20,           
    0,            
    Math.PI * 2,  
    0,            
    Math.PI / 2   
  ], [radius]);

  // ANİMASYON VE REZONANS MOTORU
  useFrame((state, delta) => {
    if (!active) return;
    const time = state.clock.getElapsedTime();

    // 1. NEURAL RESONANCE HESABI
    // Son işlemden sonraki 2 saniye boyunca kalkanın "titremesini" sağlar.
    const txDiff = Date.now() - (lastTxTime || 0);
    const baseResonance = Math.max(0, 1 - txDiff / 2000); 

    // Arkham Intel: Parasal hacme göre rezonans şiddetini artır
    const flowIntensity = walletSummary ? Math.min(1, Math.abs(walletSummary.netFlow) / 5000) : 0;
    const resonance = baseResonance + (flowIntensity * 0.5);
    
    // Arkham Intel: Duruma göre kalkan rengi tespiti
    let targetHex = color;
    if (hasError) {
      targetHex = '#ff0000'; // Kritik Hata
    } else if (walletSummary?.riskFlags && walletSummary.riskFlags.length > 0) {
      targetHex = '#ef4444'; // Risk Tespit Edildi (Kırmızı)
    } else if (walletSummary && walletSummary.netFlow > 10) {
      targetHex = '#4ade80'; // Pozitif Akış / Para Girişi (Neon Yeşil)
    } else if (walletSummary && walletSummary.netFlow < -10) {
      targetHex = '#ec4899'; // Negatif Akış / Para Çıkışı (Neon Pembe)
    }
    
    const targetColor = new THREE.Color(targetHex);
    
    // 2. ANA KABUK: Dinamik Distort ve Rezonans
    if (shellRef.current && shellMatRef.current) {
      const pulse = 1 + Math.sin(time * 0.8) * 0.02 + (resonance * 0.05);
      shellRef.current.scale.set(pulse, pulse, pulse);
      shellRef.current.rotation.y += delta * (0.05 + resonance * 0.2);
      
      shellMatRef.current.emissiveIntensity = 2 + Math.sin(time * 1.2) * 1.5 + (resonance * 10);
      shellMatRef.current.distort = 0.4 + (resonance * 0.4);
      shellMatRef.current.color.lerp(targetColor, 0.05);
      shellMatRef.current.emissive.lerp(targetColor, 0.05);
    }

    // 3. TEKNİK GRID: Ters Rotasyon & Glow
    if (wireframeRef.current && wireMatRef.current) {
      wireframeRef.current.rotation.y -= delta * (0.08 + resonance * 0.1);
      const wireScale = 1.01 + Math.sin(time * 1.5) * 0.005 + (resonance * 0.01);
      wireframeRef.current.scale.set(wireScale, wireScale, wireScale);
      
      wireMatRef.current.emissiveIntensity = 1 + Math.sin(time * 2) * 0.5 + (resonance * 5);
      wireMatRef.current.color.lerp(targetColor, 0.05);
      wireMatRef.current.emissive.lerp(targetColor, 0.05);
    }

    // 4. ZEMİN REAKTÖRÜ VE YANSIMA
    if (ringMatRef.current && floorMatRef.current) {
      const ringPulse = 0.2 + Math.sin(time * 3) * 0.15 + (resonance * 0.3);
      ringMatRef.current.opacity = ringPulse;
      floorMatRef.current.opacity = ringPulse * 0.5;
      
      ringMatRef.current.color.lerp(targetColor, 0.05);
      floorMatRef.current.color.lerp(targetColor, 0.05);
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      
      {/* KATMAN 1: PLAZMA KABUK */}
      <Sphere ref={shellRef} args={domeArgs}>
        <MeshDistortMaterial
          ref={shellMatRef}
          color={color}
          speed={2}          
          distort={0.4}     
          radius={1}
          transparent
          opacity={0.15}
          emissive={color}
          emissiveIntensity={3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* KATMAN 2: TEKNİK IZGARA */}
      <Sphere ref={wireframeRef} args={domeArgs}>
        <meshStandardMaterial
          ref={wireMatRef}
          color={color}
          wireframe
          transparent
          opacity={0.08}
          emissive={color}
          emissiveIntensity={1.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* KATMAN 3: ZEMİN SIZINTISI (Reactor Ring) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} ref={glowRingRef}>
        <torusGeometry args={[radius, 0.1, 12, 60]} />
        <meshBasicMaterial 
          ref={ringMatRef}
          color={color} 
          transparent 
          opacity={0.3} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* KATMAN 4: FAKE GLOW (Zemin Aydınlatma İllüzyonu) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} ref={floorGlowRef}>
        <circleGeometry args={[radius * 1.5, 32]} />
        <meshBasicMaterial 
          ref={floorMatRef}
          color={color} 
          transparent 
          opacity={0.1} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

    </group>
  );
}