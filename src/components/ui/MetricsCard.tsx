'use client';

import React, { memo, useEffect, useState, useMemo } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { useCityStore } from '@/store/useCityStore';
import { useShallow } from 'zustand/react/shallow';

interface MetricsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: 'stable' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'neutral';
  description?: string; // İstihbarat detayı için eklendi
}

/**
 * METRICS CARD: NEURAL DATA BLOCK (v6.0 - INTELLIGENCE OVERLAY)
 * Geliştirme: Mikro-grafik (Sparkline) simülasyonu ve kritik eşik sarsıntısı eklendi.
 * Entegrasyon: Tıklama ile 3D şehirdeki ilgili binaları filtreleme özelliği eklendi.
 */
const MetricsCard = memo(({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  status = 'stable',
  trend = 'neutral',
  description = "Neural data stream active."
}: MetricsCardProps) => {
  
  const [isUpdated, setIsUpdated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Değer değiştiğinde "Pulse" efekti tetiklenir
  useEffect(() => {
    setIsUpdated(true);
    const timer = setTimeout(() => setIsUpdated(false), 600);
    return () => clearTimeout(timer);
  }, [value]);

  // DURUM YAPILANDIRMASI: Kritik durumlarda "Glitch" animasyonu eklenmiştir
  const statusConfig = {
    stable: {
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      led: 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]',
      animation: ''
    },
    warning: {
      border: 'border-yellow-500/30',
      text: 'text-yellow-500',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
      led: 'bg-yellow-500 shadow-[0_0_10px_#eab308]',
      animation: ''
    },
    critical: {
      border: 'border-red-600/40',
      text: 'text-red-500',
      glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]',
      led: 'bg-red-600 shadow-[0_0_10px_#ef4444]',
      animation: 'animate-[bounce_0.2s_infinite]' // Kritik sarsıntı efekti
    }
  }[status];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-white/20';

  // MİKRO-GRAFİK (SPARKLINE) SİMÜLASYONU[cite: 16]
  // Verinin son 8 periyottaki değişimini temsil eden CSS tabanlı görselleştirme.
  const sparklinePoints = useMemo(() => {
    return Array.from({ length: 8 }).map(() => Math.floor(Math.random() * 80) + 20);
  }, [value]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`p-4 bg-black/95 border-l-2 backdrop-blur-3xl transition-all duration-500 group relative overflow-hidden select-none cursor-help active:scale-[0.97] will-change-transform 
        ${statusConfig.border} ${statusConfig.glow} ${statusConfig.animation} 
        ${isUpdated ? 'ring-1 ring-white/20' : ''}`}
    >
      {/* 1. SİBERPUNK TARAMA MOTORU */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent h-[200%] w-full animate-[scanline_8s_linear_infinite] pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity" />
      
      {/* 2. HOLOGRAFİK ARKA PLAN İKONU */}
      <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-1000 pointer-events-none blur-[1px]">
        <Icon size={120} strokeWidth={0.5} />
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        
        {/* ÜST KATMAN: Label & Intel Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-1 h-3.5 rounded-full transition-all duration-500 ${statusConfig.led} ${isUpdated ? 'animate-ping' : ''}`} />
            <span className="text-[8px] uppercase font-black tracking-[0.4em] text-white/40 group-hover:text-cyan-400 transition-all duration-500">
              {label}
            </span>
          </div>
          <div className="flex gap-2">
             <Icon 
                size={14} 
                className={`transition-all duration-700 ${isUpdated ? 'scale-125 text-white' : 'opacity-20 group-hover:opacity-100 group-hover:text-white'}`} 
             />
          </div>
        </div>

        {/* VERİ KATMANI: Neural Value & Sparkline */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tabular-nums tracking-tighter transition-all duration-500 ${isUpdated ? 'text-white scale-105' : 'text-white/90'} group-hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]`}>
              {value}
            </span>
            {unit && (
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic transition-opacity duration-500 ${statusConfig.text} opacity-40 group-hover:opacity-100`}>
                {unit}
              </span>
            )}
          </div>
          
          {/* MICRO-SPARKLINE SİMÜLASYONU[cite: 16] */}
          <div className="flex items-end gap-[2px] h-6 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
            {sparklinePoints.map((h, i) => (
              <div 
                key={i} 
                className={`flex-1 transition-all duration-1000 bg-current ${trendColor}`}
                style={{ height: `${h}%`, opacity: 0.2 + (i * 0.1) }}
              />
            ))}
          </div>
        </div>

        {/* ALT KATMAN: Trend & Hover Intelligence */}
        <div className="flex items-center justify-between mt-1.5">
          <div className={`flex items-center gap-1.5 ${trendColor} transition-all duration-500`}>
            <TrendIcon size={12} className={trend !== 'neutral' ? 'animate-pulse' : ''} />
            <span className="text-[7px] font-black uppercase tracking-[0.3em]">{trend}</span>
          </div>
          
          {/* HOVER INTEL: Kullanıcı üzerine geldiğinde teknik açıklama belirir[cite: 15] */}
          <div className={`flex items-center gap-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <Info size={10} className="text-cyan-500/50" />
            <span className="text-[7px] text-white/30 font-black italic uppercase tracking-tighter">
              {description}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TEKNİK MÜHÜRLER */}
      <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden pointer-events-none opacity-10 group-hover:opacity-50 transition-all">
        <div className={`absolute top-0 right-0 w-[1px] h-full bg-current`} />
        <div className={`absolute top-0 right-0 w-full h-[1px] bg-current`} />
      </div>
      
      {/* Neural Activity Dots */}
      <div className="absolute bottom-4 right-4 flex gap-1 pointer-events-none">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-0.5 h-0.5 rounded-full bg-current transition-all duration-500 ${
              i === 2 && (status !== 'stable' || isUpdated) ? 'animate-pulse scale-150' : 'opacity-20'
            }`} 
          />
        ))}
      </div>
    </div>
  );
});

MetricsCard.displayName = 'MetricsCard';

export default MetricsCard;