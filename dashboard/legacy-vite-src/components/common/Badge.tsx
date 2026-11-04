import React from 'react';
import { CLUSTER_COLORS, QUADRANT_COLORS } from '../../constants/okabeItoPalette';

const CLUSTER_SHORT_NAMES = [
  "K1 · Perkotaan",
  "K2 · Penyangga",
  "K3 · Agraris",
  "K4 · 3T Akut"
];

const QUADRANT_SHORT_NAMES: Record<string, string> = {
  "Kuadran I (Prioritas Utama)": "Q1 · Beban Ganda",
  "Kuadran II (Kerentanan Tersembunyi)": "Q2 · Rentan Fisik",
  "Kuadran III (Kantong Kemiskinan Daya Beli)": "Q3 · Daya Beli",
  "Kuadran IV (Wilayah Terbina/Mapan)": "Q4 · Mapan"
};

interface ClusterBadgeProps {
  clusterId: number;
  clusterName?: string;
  showIcon?: boolean;
}

export const ClusterBadge: React.FC<ClusterBadgeProps> = ({ clusterId, clusterName }) => {
  const color = CLUSTER_COLORS[clusterId] || "#64748B";
  const fullName = clusterName || `Klaster ${clusterId + 1}`;
  const shortName = CLUSTER_SHORT_NAMES[clusterId] || `K${clusterId + 1}`;

  return (
    <span 
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color
      }}
      title={fullName}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: color }} />
      <span>{shortName}</span>
    </span>
  );
};

interface QuadrantBadgeProps {
  quadrantName: string;
}

export const QuadrantBadge: React.FC<QuadrantBadgeProps> = ({ quadrantName }) => {
  const color = QUADRANT_COLORS[quadrantName] || "#64748B";
  const shortName = QUADRANT_SHORT_NAMES[quadrantName] || quadrantName.split(' ')[0] || quadrantName;

  return (
    <span 
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color
      }}
      title={quadrantName}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: color }} />
      <span>{shortName}</span>
    </span>
  );
};

export const AnomalyBadge: React.FC<{ isAnomaly: boolean }> = ({ isAnomaly }) => {
  if (!isAnomaly) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
      Anomali 3T / Kota
    </span>
  );
};
