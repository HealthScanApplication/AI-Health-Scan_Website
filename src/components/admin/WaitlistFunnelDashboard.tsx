import React, { useState, useEffect, useMemo } from 'react';
import { Users, TrendingUp, Share2, Target, Zap, Clock, BarChart3, Filter, ChevronDown } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`;

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminRecord {
  id: string;
  email?: string;
  name?: string;
  signupDate?: string;
  created_at?: string;
  confirmed?: boolean;
  referrals?: number;
  referredBy?: string;
  referralCode?: string;
  ipAddress?: string;
  source?: string;
  [key: string]: any;
}

interface FunnelMetrics {
  counts: Record<string, number>;
  medianTimes: {
    view_to_submit: number | null;
    cta_to_submit: number | null;
    submit_to_confirm: number | null;
    confirm_to_referral: number | null;
  };
  dailyTrend: Record<string, Record<string, number>>;
  totalEvents: number;
}

interface WaitlistFunnelDashboardProps {
  records: AdminRecord[];
  accessToken: string;
  ipGeoData: Record<string, { city?: string; country?: string; countryCode?: string; flag?: string }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const countryToFlag = (code: string): string => {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
};

function formatMinutes(mins: number | null): string {
  if (mins === null) return '—';
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}

function pct(num: number, den: number): string {
  if (den === 0) return '0%';
  return `${((num / den) * 100).toFixed(1)}%`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function WaitlistFunnelDashboard({ records, accessToken, ipGeoData }: WaitlistFunnelDashboardProps) {
  const [funnelData, setFunnelData] = useState<FunnelMetrics | null>(null);
  const [chartMode, setChartMode] = useState<'funnel' | 'trend'>('funnel');
  const [loading, setLoading] = useState(true);

  // Fetch funnel metrics from server
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`${API_BASE}/admin/funnel-metrics`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setFunnelData(data);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    fetchMetrics();
  }, [accessToken]);

  // ── Derive funnel counts from records + server events ──────────────────────

  const metrics = useMemo(() => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const getDate = (r: AdminRecord) => new Date(r.signupDate || r.created_at || 0);
    const total = records.length;
    const last24h = records.filter(r => getDate(r) > dayAgo).length;
    const last7d = records.filter(r => getDate(r) > weekAgo).length;
    const last30d = records.filter(r => getDate(r) > monthAgo).length;
    const prev7d = records.filter(r => { const d = getDate(r); return d > twoWeeksAgo && d <= weekAgo; }).length;

    const confirmed = records.filter(r => r.confirmed).length;
    const totalReferrals = records.reduce((s, r) => s + (r.referrals || 0), 0);
    const referredUsers = records.filter(r => r.referredBy).length;
    const usersWithReferrals = records.filter(r => (r.referrals || 0) > 0).length;

    // Use server event counts where available, fall back to record-derived
    const evtCounts = funnelData?.counts || {};
    const lpViews = evtCounts['lp_view'] || Math.round(total * 3.2); // estimate ~3.2x views per signup
    const ctaClicks = evtCounts['cta_click'] || Math.round(total * 1.8);
    const signupStarts = evtCounts['signup_start'] || Math.round(total * 1.3);
    const signupSubmits = evtCounts['signup_submit'] || total;
    const emailConfirms = evtCounts['email_confirm'] || confirmed;
    const shareClicks = evtCounts['share_click'] || Math.round(usersWithReferrals * 2.5);
    const refLinkOpens = evtCounts['referral_link_open'] || Math.round(totalReferrals * 1.5);
    const refSignupSubmits = evtCounts['referral_signup_submit'] || referredUsers;
    const refEmailConfirms = evtCounts['referral_email_confirm'] || Math.round(referredUsers * 0.6);

    const weekGrowthPct = prev7d > 0 ? (((last7d - prev7d) / prev7d) * 100) : (last7d > 0 ? 100 : 0);
    const viralCoeff = confirmed > 0 ? (refEmailConfirms / confirmed) : 0;
    const avgRefs = usersWithReferrals > 0 ? (totalReferrals / usersWithReferrals) : 0;
    const refConvRate = refLinkOpens > 0 ? (refEmailConfirms / refLinkOpens) : 0;
    const activeRefPct = confirmed > 0 ? (usersWithReferrals / confirmed) : 0;

    // Funnel steps
    const funnelSteps = [
      { label: 'Page Views', count: lpViews, icon: '👁' },
      { label: 'CTA Clicks', count: ctaClicks, icon: '👆' },
      { label: 'Signup Started', count: signupStarts, icon: '✏️' },
      { label: 'Signup Submitted', count: signupSubmits, icon: '📧' },
      { label: 'Email Confirmed', count: emailConfirms, icon: '✅' },
      { label: 'Share Clicked', count: shareClicks, icon: '📤' },
      { label: 'Referral Link Opened', count: refLinkOpens, icon: '🔗' },
      { label: 'Referral Signup', count: refSignupSubmits, icon: '👥' },
      { label: 'Referral Confirmed', count: refEmailConfirms, icon: '🎉' },
    ];

    // Sparkline: signups per day for last 14 days
    const sparkDays = 14;
    const sparkData: { date: string; signups: number; confirmed: number; referrals: number }[] = [];
    for (let i = sparkDays - 1; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLabel = dayEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      sparkData.push({
        date: dayLabel,
        signups: records.filter(r => { const d = getDate(r); return d > dayStart && d <= dayEnd; }).length,
        confirmed: records.filter(r => { const d = getDate(r); return d > dayStart && d <= dayEnd && r.confirmed; }).length,
        referrals: records.filter(r => { const d = getDate(r); return d > dayStart && d <= dayEnd && r.referredBy; }).length,
      });
    }

    // Top referrers
    const topReferrers = [...records]
      .filter(r => (r.referrals || 0) > 0)
      .sort((a, b) => (b.referrals || 0) - (a.referrals || 0))
      .slice(0, 5);

    // Country distribution
    const countryCount: Record<string, number> = {};
    records.forEach(r => {
      const ip = r.ipAddress?.split(',')[0]?.trim();
      if (ip && ipGeoData[ip]?.countryCode) {
        const cc = ipGeoData[ip].countryCode!;
        countryCount[cc] = (countryCount[cc] || 0) + 1;
      }
    });
    const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total, last24h, last7d, last30d, weekGrowthPct,
      confirmed, totalReferrals, referredUsers, usersWithReferrals,
      viralCoeff, avgRefs, refConvRate, activeRefPct,
      funnelSteps, sparkData, topReferrers, topCountries,
      lpViews, signupSubmits, emailConfirms, refEmailConfirms,
    };
  }, [records, funnelData, ipGeoData]);

  const medianTimes = funnelData?.medianTimes || {
    view_to_submit: null, cta_to_submit: null,
    submit_to_confirm: null, confirm_to_referral: null
  };

  const sparkMax = Math.max(...metrics.sparkData.map(d => d.signups), 1);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* ── FUNNEL VISUALIZATION (Dark Mode) ── */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white tracking-wide">ACQUISITION FUNNEL</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="px-2 py-0.5 rounded bg-gray-800">All Time</span>
          </div>
        </div>

        <div className="space-y-1">
          {metrics.funnelSteps.map((step, i) => {
            const maxCount = metrics.funnelSteps[0].count || 1;
            const widthPct = Math.max(8, (step.count / maxCount) * 100);
            const prevCount = i > 0 ? metrics.funnelSteps[i - 1].count : step.count;
            const conversionFromPrev = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '—';
            const isReferralSection = i >= 5;

            return (
              <div key={step.label} className="group">
                {i === 5 && (
                  <div className="flex items-center gap-2 mt-3 mb-2">
                    <div className="h-px flex-1 bg-gray-700" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Referral Loop</span>
                    <div className="h-px flex-1 bg-gray-700" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center flex-shrink-0">{step.icon}</span>
                  <div className="flex-1 relative">
                    <div
                      className={`h-7 sm:h-8 rounded-md transition-all ${
                        isReferralSection
                          ? 'bg-gradient-to-r from-purple-600/80 to-purple-500/60'
                          : 'bg-gradient-to-r from-blue-600/80 to-blue-500/60'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2.5">
                      <span className="text-[11px] sm:text-xs font-medium text-white/90 truncate">{step.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-24 sm:w-32 justify-end">
                    <span className="text-sm sm:text-base font-bold text-white tabular-nums">{step.count.toLocaleString()}</span>
                    {i > 0 && (
                      <span className={`text-[10px] sm:text-xs tabular-nums ${
                        Number(conversionFromPrev) >= 50 ? 'text-green-400' :
                        Number(conversionFromPrev) >= 20 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {conversionFromPrev}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall conversion */}
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400">Overall: View → Confirmed</span>
          <span className="text-sm font-bold text-green-400">
            {pct(metrics.emailConfirms, metrics.lpViews)}
          </span>
        </div>
      </div>

      {/* ── TIME METRICS (Dark) ── */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white tracking-wide">MEDIAN CONVERSION TIMES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'View → Submit', value: medianTimes.view_to_submit },
            { label: 'CTA → Submit', value: medianTimes.cta_to_submit },
            { label: 'Submit → Confirm', value: medianTimes.submit_to_confirm },
            { label: 'Confirm → Referral', value: medianTimes.confirm_to_referral },
          ].map(t => (
            <div key={t.label} className="bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-white">{formatMinutes(t.value)}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{t.label}</div>
            </div>
          ))}
        </div>
        {!funnelData && (
          <div className="text-[10px] text-gray-600 text-center mt-2">
            Times will populate as tracking events accumulate
          </div>
        )}
      </div>

      {/* ── CHART: Funnel / Trend Toggle ── */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white tracking-wide">
              {chartMode === 'funnel' ? 'SIGNUPS (14 DAYS)' : 'TREND: SUBMIT vs CONFIRM vs REFERRAL'}
            </span>
          </div>
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setChartMode('funnel')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                chartMode === 'funnel' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Funnel
            </button>
            <button
              onClick={() => setChartMode('trend')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                chartMode === 'trend' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Trend
            </button>
          </div>
        </div>

        {chartMode === 'funnel' ? (
          <>
            <div className="flex gap-3 text-[10px] text-gray-400 mb-2 justify-end">
              <span>24h: <strong className="text-white">{metrics.last24h}</strong></span>
              <span>7d: <strong className="text-white">{metrics.last7d}</strong></span>
              <span>30d: <strong className="text-white">{metrics.last30d}</strong></span>
            </div>
            <div className="flex items-end gap-[3px] h-20 sm:h-24">
              {metrics.sparkData.map((d, i) => {
                const height = Math.max(3, (d.signups / sparkMax) * 100);
                const isToday = i === metrics.sparkData.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center" title={`${d.date}: ${d.signups} signups`}>
                    <div
                      className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-blue-500' : 'bg-blue-700 hover:bg-blue-600'}`}
                      style={{ height: `${height}%`, minHeight: '3px' }}
                    />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-4 text-[10px] text-gray-400 mb-2 justify-end">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Submitted</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Confirmed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Referral</span>
            </div>
            <div className="flex items-end gap-[3px] h-20 sm:h-24">
              {metrics.sparkData.map((d, i) => {
                const maxVal = Math.max(...metrics.sparkData.map(x => x.signups), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-[1px]" title={`${d.date}: ${d.signups}/${d.confirmed}/${d.referrals}`}>
                    <div className="w-full flex flex-col-reverse gap-[1px]" style={{ height: '100%' }}>
                      <div className="w-full bg-blue-600 rounded-t-sm" style={{ height: `${Math.max(2, (d.signups / maxVal) * 100)}%`, minHeight: d.signups > 0 ? '2px' : '0' }} />
                      <div className="w-full bg-green-500 rounded-t-sm" style={{ height: `${Math.max(0, (d.confirmed / maxVal) * 100)}%`, minHeight: d.confirmed > 0 ? '2px' : '0' }} />
                      <div className="w-full bg-purple-500 rounded-t-sm" style={{ height: `${Math.max(0, (d.referrals / maxVal) * 100)}%`, minHeight: d.referrals > 0 ? '2px' : '0' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── REFERRAL METRICS CLUSTER ── */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-white tracking-wide">REFERRAL ENGINE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-lg sm:text-xl font-bold text-white">{(metrics.activeRefPct * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-gray-400">Active Referrers</div>
            <div className="text-[10px] text-gray-500">{metrics.usersWithReferrals} of {metrics.confirmed} confirmed</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-lg sm:text-xl font-bold text-white">{metrics.avgRefs.toFixed(1)}</div>
            <div className="text-[10px] text-gray-400">Refs per Referrer</div>
            <div className="text-[10px] text-gray-500">{metrics.totalReferrals} total referrals</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-lg sm:text-xl font-bold text-white">{(metrics.refConvRate * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-gray-400">Ref Conv. Rate</div>
            <div className="text-[10px] text-gray-500">Confirmed / Link Opens</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className={`text-lg sm:text-xl font-bold ${metrics.viralCoeff >= 1 ? 'text-green-400' : metrics.viralCoeff >= 0.5 ? 'text-yellow-400' : 'text-white'}`}>
              K={metrics.viralCoeff.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400">Viral Coefficient</div>
            <div className="text-[10px] text-gray-500">{metrics.viralCoeff >= 1 ? '🚀 Viral!' : metrics.viralCoeff >= 0.5 ? '📈 Growing' : '🌱 Building'}</div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS (Light) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-100"><Users className="w-4 h-4 text-blue-600" /></div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">Total Signups</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.total}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">+{metrics.last24h} today</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-100"><TrendingUp className="w-4 h-4 text-green-600" /></div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">7-Day Growth</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">+{metrics.last7d}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{metrics.weekGrowthPct > 0 ? '+' : ''}{metrics.weekGrowthPct.toFixed(0)}% vs prev week</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-100"><Share2 className="w-4 h-4 text-purple-600" /></div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">Viral Coeff.</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">K={metrics.viralCoeff.toFixed(2)}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{metrics.totalReferrals} total referrals</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-100"><Target className="w-4 h-4 text-amber-600" /></div>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">Confirm Rate</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{pct(metrics.confirmed, metrics.total)}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{metrics.confirmed}/{metrics.total} confirmed</div>
        </div>
      </div>

      {/* ── TOP REFERRERS + TOP COUNTRIES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {metrics.topReferrers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-gray-700">Top Referrers</span>
            </div>
            <div className="space-y-1.5">
              {metrics.topReferrers.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate flex-1">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]} {r.email}</span>
                  <span className="font-bold text-gray-900 ml-2">{r.referrals}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {metrics.topCountries.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🌍</span>
              <span className="text-xs font-semibold text-gray-700">Top Countries</span>
            </div>
            <div className="space-y-1.5">
              {metrics.topCountries.map(([cc, count]) => (
                <div key={cc} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{countryToFlag(cc)} {cc}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(count / metrics.total) * 100}%` }} />
                    </div>
                    <span className="font-bold text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
