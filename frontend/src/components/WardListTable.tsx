import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { ExposureGauge } from './ExposureGauge';
import type { WardExposureScore } from '../types';

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

  const TIERS: Array<{ label: string; value: string; tierClass: string }> = [
    { label: 'All (24)', value: 'ALL', tierClass: '' },
    { label: 'Emergency', value: 'EMERGENCY', tierClass: 'badge-emergency' },
    { label: 'Warning', value: 'WARNING', tierClass: 'badge-warning' },
    { label: 'Watch', value: 'WATCH', tierClass: 'badge-watch' },
    { label: 'Normal', value: 'NORMAL', tierClass: 'badge-normal' }
  ];

  return (
    <div className="ward-table-container">
      {/* Table Header Filter Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrapper">
            <Search size={14} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search ward code or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-search-input"
            />
          </div>

          {/* Tier Filter Buttons */}
          <div className="tier-filter-group">
            {TIERS.map((t) => (
              <button
                key={t.value}
                className={`btn-tier-filter ${tierFilter === t.value ? 'active' : ''} ${t.tierClass}`}
                onClick={() => setTierFilter(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-secondary" onClick={onClose} title="Close Table and Return to Map">
          <X size={14} />
          <span>Close Matrix</span>
        </button>
      </div>

      {/* High-Density Data Table */}
      <div className="table-scroll-wrapper">
        <table className="ward-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('ward_id')} className="sortable-th">
                <div className="th-content">
                  <span>Ward ID</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => handleSort('locality')} className="sortable-th">
                <div className="th-content">
                  <span>Locality / Zone</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => handleSort('exposure_score')} className="sortable-th">
                <div className="th-content">
                  <span>Exposure Score E(w,d)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th>Tier</th>
              <th onClick={() => handleSort('rainfall_mm')} className="sortable-th">
                <div className="th-content">
                  <span>24h Rain (mm)</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th onClick={() => handleSort('vulnerability_norm')} className="sortable-th">
                <div className="th-content">
                  <span>Census Slum Vulnerability</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th>Hotspots</th>
            </tr>
          </thead>
          <tbody>
            {sortedWards.map((w) => {
              const isSelected = selectedWardId === w.ward_id;
              const rainPct = Math.min(100, (w.rainfall_mm / 200) * 100);
              const vulnPct = Math.min(100, w.vulnerability_norm * 100);

              return (
                <tr
                  key={w.ward_id}
                  className={`ward-table-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectWard(w.ward_id)}
                >
                  <td className="font-mono font-bold" style={{ color: 'var(--text-main)' }}>
                    Ward {w.ward_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{w.locality}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{w.zone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ExposureGauge score={w.exposure_score} tier={w.risk_tier} size={30} strokeWidth={4} showValue={false} />
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {w.exposure_score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-tier badge-${w.risk_tier.toLowerCase()}`}>
                      {w.risk_tier}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ minWidth: '48px', color: 'var(--accent-live)' }}>
                        {w.rainfall_mm.toFixed(1)} mm
                      </span>
                      <div className="mini-bar-track">
                        <div
                          className="mini-bar-fill"
                          style={{
                            width: `${rainPct}%`,
                            background:
                              w.rainfall_mm >= 115.6
                                ? 'var(--threat-emergency)'
                                : w.rainfall_mm >= 64.5
                                ? 'var(--threat-warning)'
                                : 'var(--threat-normal)'
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ minWidth: '40px', color: 'var(--text-muted)' }}>
                        {(w.vulnerability_norm * 100).toFixed(0)}%
                      </span>
                      <div className="mini-bar-track">
                        <div
                          className="mini-bar-fill"
                          style={{
                            width: `${vulnPct}%`,
                            background: 'var(--threat-warning)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        ({(w.slum_ratio * 100).toFixed(0)}% Slum)
                      </span>
                    </div>
                  </td>
                  <td className="font-mono" style={{ color: w.hotspot_count > 0 ? 'var(--threat-warning)' : 'var(--text-dim)' }}>
                    {w.hotspot_count} spots
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
