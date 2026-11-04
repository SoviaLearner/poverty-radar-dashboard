import React from 'react';
import { CLUSTER_COLORS, QUADRANT_COLORS } from '../../constants/okabeItoPalette';

interface ClusterBadgeProps {
  clusterId: number;
  clusterName?: string;
  showIcon?: boolean;
}

export const ClusterBadge: React.FC<ClusterBadgeProps> = ({ clusterId, clusterName }) => {
  const color = CLUSTER_COLORS[clusterId] || "#64748B";
  const name = clusterName || `Klaster ${clusterId + 1}`;

  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
};

interface QuadrantBadgeProps {
  quadrantName: string;
}

export const QuadrantBadge: React.FC<QuadrantBadgeProps> = ({ quadrantName }) => {
  const color = QUADRANT_COLORS[quadrantName] || "#64748B";

  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />
      {quadrantName.split(':')[0] || quadrantName}
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
