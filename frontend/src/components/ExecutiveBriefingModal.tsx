import React, { useMemo } from 'react';
import { X, Printer, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';
import type { DailyExposureSummary, WardExposureScore, RiskTier } from '../types';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSummary: DailyExposureSummary | null;
  currentDate: string;
  wardsProperties: Record<string, any>;
}

export const ExecutiveBriefingModal: React.FC<ExecutiveBriefingModalProps> = ({
  isOpen,
  onClose,
  activeSummary,
  currentDate,
  wardsProperties
}) => {
  // Calculate citywide aggregates and ranked wards
  const { topWards, totalDoxycyclinePacks, totalVans, emergencyCount, warningCount } = useMemo(() => {
    if (!activeSummary) {
      return {
        topWards: [],
        totalDoxycyclinePacks: 0,
        totalVans: 0,
        emergencyCount: 0,
        warningCount: 0
      };
    }
    const list: Array<{
      ward_id: string;
      ward_name: string;
      locality: string;
      zone: string;
      exposure_score: number;
      risk_tier: RiskTier;
      rainfall_mm: number;
      slum_pop: number;
      doxycycline_packs: number;
      vans: number;
    }> = [];

    let totalDoxy = 0;
    let totalMobileVans = 0;
    let emCount = 0;
    let warnCount = 0;

    Object.keys(activeSummary.wards).forEach((wid) => {
      const scoreData: WardExposureScore = activeSummary.wards[wid];
      const props = wardsProperties[wid] || {};
      const slumPop = props.slum_population || 0;

      const score = scoreData.exposure_score;
      const isEmergency = score >= 75.0;
      const isWarning = score >= 55.0 && score < 75.0;
      const isWatch = score >= 30.0 && score < 55.0;

      if (isEmergency) emCount++;
      if (isWarning) warnCount++;

      const factor = isEmergency ? 0.35 : isWarning ? 0.15 : isWatch ? 0.05 : 0;
      const vans = isEmergency ? 2 : isWarning ? 1 : 0;
      const packs = Math.round(slumPop * factor);

      totalDoxy += packs;
      totalMobileVans += vans;

      list.push({
        ward_id: wid,
        ward_name: scoreData.ward_name,
        locality: scoreData.locality || props.locality || wid,
        zone: scoreData.zone || props.zone || '',
        exposure_score: score,
        risk_tier: scoreData.risk_tier,
        rainfall_mm: scoreData.hazard.rainfall_mm,
        slum_pop: slumPop,
        doxycycline_packs: packs,
        vans: vans
      });
    });

    list.sort((a, b) => b.exposure_score - a.exposure_score);

    return {
      topWards: list.slice(0, 5),
      totalDoxycyclinePacks: totalDoxy,
      totalVans: totalMobileVans,
      emergencyCount: emCount,
      warningCount: warnCount
    };
  }, [activeSummary, wardsProperties]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = useMemo(() => {
    if (!currentDate) return '05 July 2026';
    const parts = currentDate.split('-');
    if (parts.length !== 3) return currentDate;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${months[mIdx] || 'Jul'} ${parts[0]}`;
  }, [currentDate]);

  if (!isOpen || !activeSummary) return null;

  return (
    <div className="briefing-modal-overlay">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="briefing-modal-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
          <FileText size={18} color="#38bdf8" />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>
            Executive Municipal Briefing · Morning Cabinet Sheet
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-primary" onClick={handlePrint} style={{ padding: '6px 14px', fontSize: '12px' }}>
            <Printer size={14} />
            <span>Print / Save PDF Directive</span>
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '6px 10px' }} title="Close Modal">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Official 1-Page BMC Briefing Sheet Container */}
      <div className="briefing-sheet-paper">
        {/* BMC Official Header Banner */}
        <div className="sheet-header">
          <div className="sheet-emblem-box">
            <div className="sheet-emblem-seal">BMC</div>
            <div>
              <div className="sheet-gov-name">BRIHANMUMBAI MUNICIPAL CORPORATION</div>
              <div className="sheet-dept-name">Public Health Department · Disaster Management Cell</div>
              <div className="sheet-doc-title">MONSOON HEALTH SURVEILLANCE & PROPHYLAXIS DIRECTIVE</div>
            </div>
          </div>

          <div className="sheet-meta-block">
            <div><strong>STATUS:</strong> <span style={{ color: emergencyCount > 0 ? '#b91c1c' : '#047857' }}>{emergencyCount > 0 ? 'CRITICAL DELUGE' : 'STANDARD MONITORING'}</span></div>
            <div><strong>DATE:</strong> {formattedDate} (08:30 IST)</div>
            <div><strong>MODE:</strong> {activeSummary.mode || 'HISTORICAL OBSERVED'}</div>
            <div><strong>SECURITY:</strong> OFFICIAL CIVIC RECORD</div>
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        <div className="sheet-kpi-grid">
          <div className="sheet-kpi-box">
            <div className="kpi-label">City Average Exposure</div>
            <div className="kpi-val" style={{ color: activeSummary.city_average_exposure >= 55 ? '#c2410c' : '#0284c7' }}>
              {activeSummary.city_average_exposure.toFixed(1)} / 100
            </div>
            <div className="kpi-sub">Across 24 Administrative Wards</div>
          </div>

          <div className="sheet-kpi-box">
            <div className="kpi-label">Emergency / Warning Wards</div>
            <div className="kpi-val" style={{ color: emergencyCount > 0 ? '#b91c1c' : '#15803d' }}>
              {emergencyCount} Emergency <span style={{ fontSize: '12px', color: '#475569' }}>/ {warningCount} Warn</span>
            </div>
            <div className="kpi-sub">High-Vulnerability Basins</div>
          </div>

          <div className="sheet-kpi-box">
            <div className="kpi-label">Total Doxycycline 200mg</div>
            <div className="kpi-val" style={{ color: '#0369a1' }}>
              {totalDoxycyclinePacks.toLocaleString()}
            </div>
            <div className="kpi-sub">Blister Packs for Immediate Issue</div>
          </div>

          <div className="sheet-kpi-box">
            <div className="kpi-label">Mobile Fever Outreach Vans</div>
            <div className="kpi-val" style={{ color: totalVans > 0 ? '#b91c1c' : '#475569' }}>
              {totalVans} Mobile Vans
            </div>
            <div className="kpi-sub">Active Door-to-Door Triage</div>
          </div>
        </div>

        {/* Priority Action Matrix Table */}
        <div className="sheet-section">
          <div className="sheet-section-title">
            <ShieldAlert size={14} />
            <span>1. PRIORITY ACTION MATRIX — TOP 5 HIGHEST-RISK WARDS</span>
          </div>

          <table className="sheet-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>Rank</th>
                <th>Ward & Locality</th>
                <th style={{ textAlign: 'center', width: '80px' }}>24h Rain</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Exposure</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Risk Tier</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Slum Pop</th>
                <th style={{ textAlign: 'right', width: '110px' }}>Doxycycline Req</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Mobile Vans</th>
              </tr>
            </thead>
            <tbody>
              {topWards.map((w, idx) => (
                <tr key={w.ward_id}>
                  <td style={{ fontWeight: 700, textAlign: 'center' }}>#{idx + 1}</td>
                  <td>
                    <strong>Ward {w.ward_id}</strong> — {w.locality}
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Zone: {w.zone}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{w.rainfall_mm.toFixed(1)} mm</td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                    {w.exposure_score.toFixed(1)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`sheet-badge ${w.risk_tier === 'EMERGENCY' ? 'sheet-badge-emergency' : 'sheet-badge-warning'}`}>
                      {w.risk_tier}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{w.slum_pop.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>
                    {w.doxycycline_packs.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    {w.vans > 0 ? `${w.vans} Vans` : 'Dispensary'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Operational Municipal Directives */}
        <div className="sheet-section" style={{ marginTop: '14px' }}>
          <div className="sheet-section-title">
            <CheckCircle2 size={14} />
            <span>2. OPERATIONAL DIRECTIVES ISSUED FOR IMMEDIATE EXECUTION</span>
          </div>

          <div className="sheet-directives-list">
            <div className="sheet-directive-item">
              <strong>A. Prophylaxis Distribution Window (24–72 Hours):</strong> All Ward Medical Officers of Health (MOH) in Emergency and Warning wards must verify full stock availability of oral <em>Doxycycline 200 mg</em> and <em>Azithromycin</em> across all local Hinduhridaysamrat Balasaheb Thackeray (HBT) Aapla Dawakhana urban dispensaries by 10:00 IST. Prophylaxis is strictly free of charge.
            </div>
            <div className="sheet-directive-item">
              <strong>B. Slum Cluster Outreach Deployment:</strong> Designated Mobile Fever Vans must be dispatched to high-density waterlogging pockets (e.g. Kranti Nagar, Bail Bazar, Dharavi 90ft Road, Hindmata, Shivaji Nagar) to conduct on-site evaluation for citizens with floodwater exposure.
            </div>
            <div className="sheet-directive-item">
              <strong>C. Tri-Lingual Public Awareness Broadcast:</strong> Standardized public health advisories in <strong>Marathi</strong> (state official), <strong>Hindi</strong>, and <strong>English</strong> are authorized for immediate publication across municipal social channels and SMS cell broadcasts.
            </div>
          </div>
        </div>

        {/* Multi-Lingual Approved Message Box */}
        <div className="sheet-section" style={{ marginTop: '12px' }}>
          <div className="sheet-section-title" style={{ fontSize: '11px' }}>
            <span>3. CERTIFIED PUBLIC ADVISORY TEXT (MARATHI & ENGLISH)</span>
          </div>
          <div className="sheet-advisory-box">
            <div>
              <strong>मराठी (Official):</strong> "सावधान! बृहन्मुंबई महानगरपालिका आरोग्य विभाग: प्रभाग {topWards[0]?.ward_id} ({topWards[0]?.locality}) मध्ये मुसळधार पावसामुळे पाणी साचले आहे. साचलेल्या पाण्यातून चाललेल्या सर्व नागरिकांनी लेप्टोस्पायरोसिसपासून संरक्षणासाठी २४ ते ७२ तासांच्या आत जवळच्या आपला दवाखान्यातून मोफत प्रतिबंधक गोळ्या (डॉक्सीसायक्लिन) घ्याव्यात."
            </div>
            <div style={{ marginTop: '6px' }}>
              <strong>English:</strong> "BMC Public Health Advisory: Ward {topWards[0]?.ward_id} ({topWards[0]?.locality}) has reached CRITICAL flood exposure. Citizens exposed to floodwaters must receive free prophylactic Doxycycline within 24–72 hours at their nearest Aapla Dawakhana dispensary."
            </div>
          </div>
        </div>

        {/* Signatures & Scientific Provenance */}
        <div className="sheet-footer">
          <div className="sheet-provenance">
            <strong>Engine Provenance:</strong> VARSHA Algorithmic Early-Warning Decision Support Engine · MCGM BMC<br/>
            <strong>Data Foundation:</strong> Official Census 2011 Primary Census Abstract + 70 BMC Chronic Flood Hotspots + Open-Meteo ERA5 Reanalysis
          </div>
          <div className="sheet-signature-box">
            <div className="sheet-sig-line">____________________________________</div>
            <div className="sheet-sig-title">Executive Health Officer (EHO) / Municipal Commissioner</div>
            <div className="sheet-sig-dept">Municipal Corporation of Greater Mumbai</div>
          </div>
        </div>
      </div>
    </div>
  );
};
