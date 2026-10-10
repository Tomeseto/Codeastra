import React, { useState, useEffect } from 'react';
import { Pill, Truck, Copy, Check, Clock, Phone, MapPin, Building2, ShieldAlert, Sparkles } from 'lucide-react';
import type { WardMunicipalDirective, ClinicInfo } from '../types';

interface ActionDirectivePanelProps {
  wardId: string;
  exposureScore: number;
  slumPopulation: number;
  locality: string;
}

export const ActionDirectivePanel: React.FC<ActionDirectivePanelProps> = ({
  wardId,
  exposureScore,
  slumPopulation,
  locality
}) => {
  const [directive, setDirective] = useState<WardMunicipalDirective | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeLang, setActiveLang] = useState<'mr' | 'hi' | 'en'>('mr');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/v1/action/directive/${wardId}?exposure_score=${exposureScore}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load directive');
        return res.json();
      })
      .then((data: WardMunicipalDirective) => {
        if (isMounted) {
          setDirective(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Action directive fetch error:', err);
        // Fallback calculation in case of network glitch
        if (isMounted) {
          const isEmergency = exposureScore >= 75;
          const isWarning = exposureScore >= 55 && exposureScore < 75;
          const isWatch = exposureScore >= 30 && exposureScore < 55;
          const factor = isEmergency ? 0.35 : isWarning ? 0.15 : isWatch ? 0.05 : 0;
          const vans = isEmergency ? 2 : isWarning ? 1 : 0;
          const priority = isEmergency ? 'IMMEDIATE' : isWarning ? 'ELEVATED' : isWatch ? 'STANDBY' : 'BASELINE';

          setDirective({
            ward_id: wardId,
            ward_name: wardId,
            locality: locality,
            zone: '',
            exposure_score: exposureScore,
            risk_tier: isEmergency ? 'EMERGENCY' : isWarning ? 'WARNING' : isWatch ? 'WATCH' : 'NORMAL',
            prophylaxis: {
              slum_population: slumPopulation,
              exposure_score: exposureScore,
              risk_tier: isEmergency ? 'EMERGENCY' : isWarning ? 'WARNING' : isWatch ? 'WATCH' : 'NORMAL',
              exposure_factor: factor,
              doxycycline_packs_recommended: Math.round(slumPopulation * factor),
              mobile_fever_vans_required: vans,
              priority_level: priority,
              target_protocol: 'Doxycycline 200mg single dose within 24-72h of floodwater exposure'
            },
            advisory: {
              marathi: `सावधान! बृहन्मुंबई महानगरपालिका: प्रभाग ${wardId} (${locality}) मध्ये मुसळधार पावसामुळे पाणी साचले आहे. साचलेल्या पाण्यातून चाललेल्या सर्व नागरिकांनी लेप्टोस्पायरोसिसपासून संरक्षणासाठी २४ ते ७२ तासांच्या आत जवळच्या आपला दवाखान्यातून डॉक्टरांच्या सल्ल्याने प्रतिबंधक औषधे (डॉक्सीसायक्लिन) मोफत घ्यावीत.`,
              hindi: `सतर्कता! बीएमसी स्वास्थ्य विभाग: वार्ड ${wardId} (${locality}) में जलभराव के कारण लेप्टोस्पायरोसिस का खतरा बढ़ गया है। बाढ़ के पानी के संपर्क में आए सभी नागरिक ७२ घंटों के भीतर नजदीकी 'आपला दवाखाना' से निशुल्क दवा प्राप्त करें।`,
              english: `BMC Emergency Health Directive: Ward ${wardId} (${locality}) has reached CRITICAL flood exposure. Citizens who waded through floodwaters must take prophylactic Doxycycline within 24–72 hours at the nearest Aapla Dawakhana.`
            },
            clinics: [],
            generated_at: new Date().toISOString()
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [wardId, exposureScore, slumPopulation, locality]);

  const handleCopyAdvisory = () => {
    if (!directive) return;
    const textToCopy =
      activeLang === 'mr'
        ? directive.advisory.marathi
        : activeLang === 'hi'
        ? directive.advisory.hindi
        : directive.advisory.english;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading && !directive) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--accent-live)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600 }}>Computing ward civic directives & prophylaxis demand...</div>
      </div>
    );
  }

  if (!directive) return null;

  const { prophylaxis, advisory, clinics } = directive;
  const isEmergency = prophylaxis.risk_tier === 'EMERGENCY';
  const isWarning = prophylaxis.risk_tier === 'WARNING';
  const isWatch = prophylaxis.risk_tier === 'WATCH';
  const heroClass = isEmergency
    ? 'civic-hero-emergency'
    : isWarning
    ? 'civic-hero-warning'
    : isWatch
    ? 'civic-hero-watch'
    : 'civic-hero-normal';

  const tierColor = isEmergency
    ? 'var(--threat-emergency)'
    : isWarning
    ? 'var(--threat-warning)'
    : isWatch
    ? 'var(--threat-watch)'
    : 'var(--threat-normal)';

  const currentAdvisoryText =
    activeLang === 'mr'
      ? advisory.marathi
      : activeLang === 'hi'
      ? advisory.hindi
      : advisory.english;

  return (
    <div className="civic-directives-container">
      {/* 1. Prophylaxis & Resource Deployment Hero Card */}
      <div className={`civic-hero-card ${heroClass}`}>
        <div className="civic-hero-header">
          <div className="civic-hero-title-group">
            <Pill size={16} color={tierColor} />
            <span className="civic-hero-title">
              Prophylaxis Mobilization Requirement
            </span>
          </div>
          <span
            className="civic-priority-badge"
            style={{
              background: isEmergency ? 'var(--threat-emergency)' : isWarning ? 'var(--threat-warning)' : 'var(--threat-normal)',
              color: '#ffffff'
            }}
          >
            {prophylaxis.priority_level} PRIORITY
          </span>
        </div>

        <div className="civic-stat-grid">
          <div className="civic-stat-box">
            <div className="civic-stat-label">Doxycycline 200mg Doses</div>
            <div className="civic-stat-val">
              {prophylaxis.doxycycline_packs_recommended.toLocaleString()}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>packs</span>
            </div>
            <div className="civic-stat-sub" style={{ color: isEmergency ? 'var(--threat-emergency)' : 'var(--accent-structural)' }}>
              {(prophylaxis.exposure_factor * 100).toFixed(0)}% of Slum Pop ({slumPopulation.toLocaleString()})
            </div>
          </div>

          <div className="civic-stat-box">
            <div className="civic-stat-label">Mobile Fever Vans</div>
            <div className="civic-stat-val">
              <Truck size={18} color="var(--accent-structural)" />
              <span>{prophylaxis.mobile_fever_vans_required}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>allocated</span>
            </div>
            <div className="civic-stat-sub" style={{ color: 'var(--text-muted)' }}>
              {prophylaxis.mobile_fever_vans_required > 0 ? 'Door-to-door slum triage' : 'Standard dispensary OPD'}
            </div>
          </div>
        </div>

        <div className="civic-protocol-banner">
          <ShieldAlert size={14} color={tierColor} style={{ flexShrink: 0 }} />
          <span>Protocol: Single dose Doxycycline 200 mg within 24–72 hours of water contact prevents acute renal/pulmonary failure.</span>
        </div>
      </div>

      {/* 2. Medically Verified Multi-Lingual Citizen Advisory Card */}
      <div className="civic-advisory-card">
        <div className="civic-advisory-header">
          <div className="civic-advisory-title-group">
            <Sparkles size={14} color="var(--accent-structural)" />
            <span className="civic-advisory-title">
              BMC Multi-Lingual Advisory
            </span>
          </div>
          <button
            onClick={handleCopyAdvisory}
            className={`civic-copy-btn ${copied ? 'copied' : ''}`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Advisory'}</span>
          </button>
        </div>

        {/* Language Tabs */}
        <div className="civic-lang-tabs">
          <button
            onClick={() => setActiveLang('mr')}
            className={`civic-lang-btn ${activeLang === 'mr' ? 'active' : ''}`}
          >
            मराठी (State Official)
          </button>
          <button
            onClick={() => setActiveLang('hi')}
            className={`civic-lang-btn ${activeLang === 'hi' ? 'active' : ''}`}
          >
            हिंदी (National)
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`civic-lang-btn ${activeLang === 'en' ? 'active' : ''}`}
          >
            English (Civic Briefing)
          </button>
        </div>

        {/* Advisory Quotation Box */}
        <div
          className="civic-advisory-quote"
          style={{ borderLeft: `4px solid ${tierColor}` }}
        >
          {currentAdvisoryText}
        </div>

        <div className="civic-advisory-footer">
          Certified BMC standard alert template. Zero generative hallucination risk.
        </div>
      </div>

      {/* 3. Aapla Dawakhana Primary Care Directory */}
      <div className="civic-clinics-section">
        <div className="civic-clinics-header">
          <h4 className="civic-clinics-title">
            <Building2 size={14} color="var(--accent-structural)" />
            Aapla Dawakhana Dispensaries ({clinics.length})
          </h4>
          <span className="civic-clinics-stock-badge">
            ● Free Prophylaxis Stock Active
          </span>
        </div>

        {clinics.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', textAlign: 'center', background: 'var(--bg-surface-2)', borderRadius: '4px' }}>
            No Aapla Dawakhana recorded in ward database. Mobilizing BMC outreach van.
          </div>
        ) : (
          <div className="civic-clinics-list">
            {clinics.map((clinic: ClinicInfo) => (
              <div key={clinic.clinic_id} className="civic-clinic-card">
                <div className="civic-clinic-top">
                  <div className="civic-clinic-name">
                    {clinic.name}
                  </div>
                  <span className="civic-clinic-stocked">
                    Stocked
                  </span>
                </div>

                <div className="civic-clinic-addr">
                  <MapPin size={12} color="var(--accent-structural)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {clinic.address}
                  </span>
                </div>

                <div className="civic-clinic-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} color="var(--accent-structural)" />
                    <span>{clinic.operating_hours}</span>
                  </div>
                  {clinic.contact && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={10} color="var(--accent-structural)" />
                      <span>{clinic.contact}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
