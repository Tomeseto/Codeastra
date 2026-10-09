import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Search, AlertTriangle } from 'lucide-react';
import type { WardExposureScore, RiskTier } from '../types';

interface WardListTableProps {
  exposureScores: Record<string, WardExposureScore>;
  wardsProperties: Record<string, any>;
  selectedWardId: string | null;
  onSelectWard: (wardId: string) => void;
  onClose: () => void;
}

type SortField = 'exposure_score' | 'rainfall_mm' | 'ward_id' | 'vulnerability_norm' | 'locality';
type SortOrder = 'asc' | 'desc';

export const WardListTable: React.FC<WardListTableProps> = ({
  exposureScores,
  wardsProperties,
  selectedWardId,
  onSelectWard,
  onClose
}) => {
  const [sortField, setSortField] = useState<SortField>('exposure_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedWards = useMemo(() => {
    const list = Object.keys(exposureScores).map((wid) => {
      const score = exposureScores[wid];
      const props = wardsProperties[wid] || {};
      return {
        ward_id: wid,
        ward_name: score.ward_name,
        locality: score.locality,
        zone: score.zone,
        exposure_score: score.exposure_score,
        risk_tier: score.risk_tier,
        rainfall_mm: score.hazard.rainfall_mm,
        hazard_H: score.hazard.hazard_score_H,
        multiplier_M: score.susceptibility.multiplier_M,
        vulnerability_norm: score.susceptibility.demographic_vulnerability_V_norm,
        is_partial: score.susceptibility.status === 'PROVISIONAL_PARTIAL',
        total_pop: props.total_population || 0,
        slum_ratio: props.slum_ratio || 0,
        hotspot_count: props.verified_flood_hotspot_count || 0
      };
    });

    return list
      .filter((w) => {
        const matchesSearch =
          w.ward_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.zone.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'ALL' || w.risk_tier === tierFilter;
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [exposureScores, wardsProperties, sortField, sortOrder, searchQuery, tierFilter]);

  const getTierClass = (tier: RiskTier) => {
    switch (tier) {
      case 'NORMAL': return 'badge-normal';
      case 'WATCH': return 'badge-watch';
      case 'WARNING': return 'badge-warning';
      case 'EMERGENCY': return 'badge-emergency';
      default: return 'badge-normal';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '70px',
        left: '20px',
        right: '460px',
        bottom: '100px',
        zIndex: 550,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden'
      }}
    >
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            24-Ward Exposure Ranking & Demographics
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>({sortedWards.length} Wards)</span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Search ward or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px 6px 30px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          {/* Tier Filter Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'EMERGENCY', 'WARNING', 'WATCH', 'NORMAL'].map((t) => (
              <button
                key={t}
                className="btn-secondary"
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderColor: tierFilter === t ? '#38bdf8' : 'var(--border-subtle)',
                  color: tierFilter === t ? '#ffffff' : 'var(--text-muted)'
                }}
                onClick={() => setTierFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '11px', padding: '6px 12px' }}>
            Back to Map
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
              <th style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => handleSort('ward_id')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Ward <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => handleSort('locality')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Locality & Zone <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => handleSort('rainfall_mm')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  24h Rain <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => handleSort('exposure_score')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Exposure E(w, d) <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '8px 10px' }}>Risk Tier</th>
              <th style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => handleSort('vulnerability_norm')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Vulnerability <ArrowUpDown size={11} />
                </div>
              </th>
              <th style={{ padding: '8px 10px' }}>Slum %</th>
              <th style={{ padding: '8px 10px' }}>Hotspots</th>
              <th style={{ padding: '8px 10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedWards.map((w) => {
              const isSelected = selectedWardId === w.ward_id;
              return (
                <tr
                  key={w.ward_id}
                  onClick={() => onSelectWard(w.ward_id)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    transition: 'background-color 150ms'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '10px', fontWeight: 700, color: '#38bdf8' }}>
                    {w.ward_id}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ color: '#ffffff', fontWeight: 500 }}>{w.locality}</div>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>{w.zone}</div>
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {w.rainfall_mm.toFixed(1)} mm
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: w.exposure_score >= 75 ? '#ef4444' : (w.exposure_score >= 55 ? '#f97316' : '#ffffff') }}>
                      {w.exposure_score.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}> / 100</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge-tier ${getTierClass(w.risk_tier)}`}>
                      {w.risk_tier}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {(w.vulnerability_norm * 100).toFixed(0)}%
                  </td>
                  <td style={{ padding: '10px', color: '#f97316' }}>
                    {(w.slum_ratio * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {w.hotspot_count} spots
                  </td>
                  <td style={{ padding: '10px' }}>
                    {w.is_partial ? (
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600 }}>
                        <AlertTriangle size={12} /> Partial
                      </span>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '10px', fontWeight: 600 }}>
                        Verified
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
