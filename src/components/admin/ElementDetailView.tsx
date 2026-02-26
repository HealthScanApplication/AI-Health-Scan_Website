import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Eye, Shield, Zap, FlaskConical, Pill, Apple, AlertTriangle,
  TrendingDown, TrendingUp, Minus, Baby, Heart, Moon, Droplets,
  ChevronDown, ChevronRight, BookOpen, ExternalLink, Beaker,
} from 'lucide-react';
import { type AdminRecord } from '../../utils/adminHelpers';
import { DRVWidget } from './DRVWidget';
import { TopFoodSources } from './TopFoodSources';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DRVColumnData {
  male?: {
    deficiency?: { threshold: number; unit?: string; symptoms?: string[] };
    optimal?: { minimum: number; recommended: number; maximum: number; unit?: string; benefits?: string[] };
    excess?: { daily_limit: number; acute_limit?: number; unit?: string; symptoms?: string[] };
  };
  female?: {
    deficiency?: { threshold: number; unit?: string; symptoms?: string[] };
    optimal?: { minimum: number; recommended: number; maximum: number; unit?: string; benefits?: string[] };
    excess?: { daily_limit: number; acute_limit?: number; unit?: string; symptoms?: string[] };
  };
}

interface FemaleConditionData {
  deficiency?: { threshold: number; unit?: string; symptoms?: string[] };
  optimal?: { minimum: number; recommended: number; maximum: number; unit?: string; benefits?: string[] };
  excess?: { daily_limit: number; unit?: string; symptoms?: string[] };
  trimester_specific?: Record<string, any>;
  heavy_flow_adjustment?: Record<string, any>;
  note?: string;
}

interface Props {
  record: AdminRecord;
  accessToken?: string;
}

/* ------------------------------------------------------------------ */
/*  DRV age columns definition                                         */
/* ------------------------------------------------------------------ */

const DRV_AGE_COLUMNS = [
  { key: 'drv_infants_0_6m', label: 'Infants 0–6m', icon: Baby },
  { key: 'drv_infants_7_12m', label: 'Infants 7–12m', icon: Baby },
  { key: 'drv_children_1_3y', label: 'Children 1–3y', icon: Baby },
  { key: 'drv_children_4_8y', label: 'Children 4–8y', icon: Baby },
  { key: 'drv_children_9_13y', label: 'Children 9–13y', icon: Baby },
  { key: 'drv_teens_14_18y', label: 'Teens 14–18y', icon: Zap },
  { key: 'drv_adults_19_30y', label: 'Adults 19–30y', icon: Shield },
  { key: 'drv_adults_31_50y', label: 'Adults 31–50y', icon: Shield },
  { key: 'drv_adults_51_70y', label: 'Adults 51–70y', icon: Shield },
  { key: 'drv_seniors_71y_plus', label: 'Seniors 71+y', icon: Heart },
];

const FEMALE_CONDITION_COLUMNS = [
  { key: 'drv_pregnancy', label: 'Pregnancy', icon: Baby, color: 'pink' },
  { key: 'drv_breastfeeding', label: 'Breastfeeding', icon: Heart, color: 'purple' },
  { key: 'drv_menopause', label: 'Menopause', icon: Moon, color: 'amber' },
  { key: 'drv_menstruation', label: 'Menstruation', icon: Droplets, color: 'red' },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ElementDetailView({ record, accessToken }: Props) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    summary: true,
    drv: true,
    food: true,
    functions: false,
    deficiency: false,
    interactions: false,
    references: false,
  });

  const toggle = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const r = record;

  // Check which DRV columns have data
  const drvAgeData = DRV_AGE_COLUMNS.filter((col) => {
    const d = r[col.key];
    return d && typeof d === 'object' && Object.keys(d).length > 0;
  });

  const femaleConditionData = FEMALE_CONDITION_COLUMNS.filter((col) => {
    const d = r[col.key];
    return d && typeof d === 'object' && Object.keys(d).length > 0;
  });

  const hasDRV = drvAgeData.length > 0;
  const hasFemaleConditions = femaleConditionData.length > 0;

  return (
    <div className="space-y-4">
      {/* ── IDENTITY CARD ────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Health Role + Type Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {r.health_role && (
            <Badge className={`text-xs ${
              r.health_role === 'beneficial' ? 'bg-green-100 text-green-800' :
              r.health_role === 'hazardous' ? 'bg-red-100 text-red-800' :
              r.health_role === 'both' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {r.health_role}
            </Badge>
          )}
          {r.type_label && (
            <Badge className="text-xs bg-indigo-100 text-indigo-800">{r.type_label}</Badge>
          )}
          {r.subcategory && (
            <Badge variant="outline" className="text-xs">{r.subcategory}</Badge>
          )}
          {r.essential_90 && (
            <Badge className="text-xs bg-yellow-100 text-yellow-800">Essential 90</Badge>
          )}
          {r.nutrient_category && (
            <Badge variant="outline" className="text-xs">{r.nutrient_category}</Badge>
          )}
        </div>

        {/* Other Names */}
        {r.name_other && (
          <div className="text-xs text-gray-500">
            Also known as: <span className="font-medium text-gray-700">{r.name_other}</span>
          </div>
        )}
      </div>

      {/* ── CHEMISTRY ────────────────────────────────────────── */}
      {(r.chemical_symbol || r.molecular_formula || r.cas_number) && (
        <div className="grid grid-cols-3 gap-2">
          {r.chemical_symbol && (
            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
              <Beaker className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <div className="text-base font-bold text-slate-800">{r.chemical_symbol}</div>
              <div className="text-[10px] text-slate-500">Symbol</div>
            </div>
          )}
          {r.molecular_formula && (
            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
              <FlaskConical className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <div className="text-base font-bold text-slate-800">{r.molecular_formula}</div>
              <div className="text-[10px] text-slate-500">Formula</div>
            </div>
          )}
          {r.cas_number && (
            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
              <BookOpen className="w-4 h-4 text-slate-500 mx-auto mb-1" />
              <div className="text-sm font-bold text-slate-800">{r.cas_number}</div>
              <div className="text-[10px] text-slate-500">CAS #</div>
            </div>
          )}
        </div>
      )}

      {/* ── SUMMARY ──────────────────────────────────────────── */}
      {(r.description_simple || r.description || r.description_technical) && (
        <SectionHeader title="Summary" icon={BookOpen} expanded={expandedSections.summary} onToggle={() => toggle('summary')}>
          {r.description_simple && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="text-[10px] font-semibold text-blue-500 uppercase mb-1">User-Facing</div>
              <div className="text-sm text-gray-700 leading-relaxed">{r.description_simple}</div>
            </div>
          )}
          {r.description && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Short Description</div>
              <div className="text-sm text-gray-700 leading-relaxed">{r.description}</div>
            </div>
          )}
          {r.description_technical && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-[10px] font-semibold text-purple-500 uppercase mb-1">Technical</div>
              <div className="text-sm text-gray-700 leading-relaxed">{r.description_technical}</div>
            </div>
          )}
        </SectionHeader>
      )}

      {/* ── DAILY RECOMMENDED ────────────────────────────────── */}
      {r.daily_recommended_adult && typeof r.daily_recommended_adult === 'object' && (
        <div className="grid grid-cols-2 gap-2">
          {r.daily_recommended_adult.male && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
              <div className="text-xs font-semibold text-blue-600 mb-1">♂ Male Adult</div>
              <div className="text-2xl font-bold text-blue-800">
                {r.daily_recommended_adult.male.value}
                <span className="text-sm font-medium ml-1 opacity-70">{r.daily_recommended_adult.male.unit}</span>
              </div>
              <div className="text-[10px] text-blue-500">daily recommended</div>
            </div>
          )}
          {r.daily_recommended_adult.female && (
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-200 text-center">
              <div className="text-xs font-semibold text-pink-600 mb-1">♀ Female Adult</div>
              <div className="text-2xl font-bold text-pink-800">
                {r.daily_recommended_adult.female.value}
                <span className="text-sm font-medium ml-1 opacity-70">{r.daily_recommended_adult.female.unit}</span>
              </div>
              <div className="text-[10px] text-pink-500">daily recommended</div>
            </div>
          )}
        </div>
      )}

      {/* ── DRV BY AGE TABLE ─────────────────────────────────── */}
      {hasDRV && (
        <SectionHeader title="DRV by Age & Gender" icon={TrendingUp} expanded={expandedSections.drv} onToggle={() => toggle('drv')}>
          {/* Gender Toggle */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setSelectedGender('male')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedGender === 'male'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ♂ Male
            </button>
            <button
              onClick={() => setSelectedGender('female')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedGender === 'female'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ♀ Female
            </button>
          </div>

          {/* DRV Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Age Group</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-red-600">
                    <div className="flex flex-col items-center">
                      <TrendingDown className="w-3 h-3 mb-0.5" />
                      Deficiency
                    </div>
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-green-600">
                    <div className="flex flex-col items-center">
                      <Minus className="w-3 h-3 mb-0.5" />
                      Min
                    </div>
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-green-700 bg-green-50">
                    <div className="flex flex-col items-center">
                      <Shield className="w-3 h-3 mb-0.5" />
                      RDA
                    </div>
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-green-600">
                    <div className="flex flex-col items-center">
                      <Minus className="w-3 h-3 mb-0.5" />
                      Max
                    </div>
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold text-orange-600">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="w-3 h-3 mb-0.5" />
                      UL
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {drvAgeData.map((col) => {
                  const data = r[col.key] as DRVColumnData;
                  const gd = data?.[selectedGender];
                  if (!gd) return null;
                  const Icon = col.icon;
                  const unit = gd.optimal?.unit || gd.deficiency?.unit || '';

                  return (
                    <React.Fragment key={col.key}>
                      <tr className="border-t border-gray-100 hover:bg-gray-50/50">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-gray-800">{col.label}</span>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          {gd.deficiency?.threshold ? (
                            <span className="text-red-700 font-semibold bg-red-50 rounded px-1.5 py-0.5">
                              &lt;{gd.deficiency.threshold}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-2">
                          {gd.optimal?.minimum ? (
                            <span className="font-medium text-gray-700">{gd.optimal.minimum}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-2 bg-green-50/50">
                          {gd.optimal?.recommended ? (
                            <span className="font-bold text-green-700 bg-green-100 rounded px-1.5 py-0.5">
                              {gd.optimal.recommended}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-2">
                          {gd.optimal?.maximum ? (
                            <span className="font-medium text-gray-700">{gd.optimal.maximum}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="text-center py-2.5 px-2">
                          {gd.excess?.daily_limit ? (
                            <span className="text-orange-700 font-semibold bg-orange-50 rounded px-1.5 py-0.5">
                              {gd.excess.daily_limit}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                      {/* Expandable symptoms/benefits row */}
                      {(gd.optimal?.benefits || gd.deficiency?.symptoms || gd.excess?.symptoms) && (
                        <tr className="border-0">
                          <td colSpan={6} className="px-3 pb-2">
                            <div className="flex flex-wrap gap-1">
                              {gd.optimal?.benefits?.map((b: string, i: number) => (
                                <Badge key={`b-${i}`} className="text-[9px] py-0 bg-green-50 text-green-700 border-green-200" variant="outline">
                                  {b}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Unit indicator */}
          {drvAgeData.length > 0 && (() => {
            const firstData = r[drvAgeData[0].key] as DRVColumnData;
            const unit = firstData?.male?.optimal?.unit || firstData?.female?.optimal?.unit || '';
            return unit ? (
              <div className="text-[10px] text-gray-400 text-right mt-1">All values in {unit}/day</div>
            ) : null;
          })()}
        </SectionHeader>
      )}

      {/* ── FEMALE-SPECIFIC CONDITIONS ───────────────────────── */}
      {hasFemaleConditions && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Female-Specific DRV</div>
          {femaleConditionData.map((col) => {
            const data = r[col.key] as FemaleConditionData;
            if (!data) return null;
            const Icon = col.icon;
            const colorMap: Record<string, string> = {
              pink: 'bg-pink-50 border-pink-200',
              purple: 'bg-purple-50 border-purple-200',
              amber: 'bg-amber-50 border-amber-200',
              red: 'bg-red-50 border-red-200',
            };
            const textColorMap: Record<string, string> = {
              pink: 'text-pink-700',
              purple: 'text-purple-700',
              amber: 'text-amber-700',
              red: 'text-red-700',
            };

            return (
              <div key={col.key} className={`rounded-xl border p-4 ${colorMap[col.color]}`}>
                <div className={`flex items-center gap-2 mb-3 ${textColorMap[col.color]}`}>
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{col.label}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  {data.deficiency && (
                    <div className="bg-white/80 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-red-500 font-semibold mb-0.5">Deficiency</div>
                      <div className="text-sm font-bold text-red-700">&lt;{data.deficiency.threshold}</div>
                      <div className="text-[9px] text-gray-500">{data.deficiency.unit || ''}/day</div>
                    </div>
                  )}
                  {data.optimal && (
                    <div className="bg-white/80 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-green-500 font-semibold mb-0.5">Recommended</div>
                      <div className="text-sm font-bold text-green-700">{data.optimal.recommended}</div>
                      <div className="text-[9px] text-gray-500">{data.optimal.minimum}–{data.optimal.maximum} {data.optimal.unit || ''}/day</div>
                    </div>
                  )}
                  {data.excess && (
                    <div className="bg-white/80 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-orange-500 font-semibold mb-0.5">Upper Limit</div>
                      <div className="text-sm font-bold text-orange-700">{data.excess.daily_limit}</div>
                      <div className="text-[9px] text-gray-500">{data.excess.unit || ''}/day</div>
                    </div>
                  )}
                </div>

                {/* Symptoms */}
                {data.deficiency?.symptoms && data.deficiency.symptoms.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] text-red-500 font-medium mb-0.5">Deficiency Symptoms</div>
                    <div className="flex flex-wrap gap-1">
                      {data.deficiency.symptoms.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px] py-0 border-red-200 text-red-600">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {data.optimal?.benefits && data.optimal.benefits.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] text-green-500 font-medium mb-0.5">Benefits</div>
                    <div className="flex flex-wrap gap-1">
                      {data.optimal.benefits.map((b: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px] py-0 border-green-200 text-green-600">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Excess Symptoms */}
                {data.excess?.symptoms && data.excess.symptoms.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] text-orange-500 font-medium mb-0.5">Excess Symptoms</div>
                    <div className="flex flex-wrap gap-1">
                      {data.excess.symptoms.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[9px] py-0 border-orange-200 text-orange-600">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trimester info */}
                {data.trimester_specific && (
                  <div className="mt-2 pt-2 border-t border-pink-200/50">
                    <div className="text-[10px] text-pink-500 font-medium mb-1">By Trimester</div>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(data.trimester_specific).map(([tri, val]: [string, any]) => (
                        <div key={tri} className="bg-white/60 rounded p-1.5 text-center">
                          <div className="text-[9px] text-gray-500 capitalize">{tri}</div>
                          <div className="text-xs font-bold text-pink-700">{val.recommended}</div>
                          {val.note && <div className="text-[8px] text-gray-400">{val.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Heavy flow adjustment */}
                {data.heavy_flow_adjustment && (
                  <div className="mt-2 pt-2 border-t border-red-200/50">
                    <div className="text-[10px] text-red-500 font-medium">Heavy Flow: {data.heavy_flow_adjustment.recommended} {data.optimal?.unit || ''}/day</div>
                    {data.heavy_flow_adjustment.note && (
                      <div className="text-[9px] text-gray-500 mt-0.5">{data.heavy_flow_adjustment.note}</div>
                    )}
                  </div>
                )}

                {/* Note */}
                {data.note && (
                  <div className="mt-2 text-[10px] text-gray-500 italic">{data.note}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FOOD STRATEGY ────────────────────────────────────── */}
      {r.food_strategy && typeof r.food_strategy === 'object' && Object.keys(r.food_strategy).length > 0 && (
        <SectionHeader title="Food Strategy" icon={Apple} expanded={expandedSections.food} onToggle={() => toggle('food')}>
          <div className="space-y-2">
            {r.food_strategy.animal && (
              <div className="flex gap-3 bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="text-2xl">🥩</div>
                <div>
                  <div className="text-xs font-semibold text-red-700">Animal Sources</div>
                  <div className="text-xs text-gray-700 mt-0.5">{r.food_strategy.animal}</div>
                </div>
              </div>
            )}
            {r.food_strategy.plant && (
              <div className="flex gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="text-2xl">🌱</div>
                <div>
                  <div className="text-xs font-semibold text-green-700">Plant Sources</div>
                  <div className="text-xs text-gray-700 mt-0.5">{r.food_strategy.plant}</div>
                </div>
              </div>
            )}
            {r.food_strategy.fortified && (
              <div className="flex gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-2xl">🥛</div>
                <div>
                  <div className="text-xs font-semibold text-blue-700">Fortified Foods</div>
                  <div className="text-xs text-gray-700 mt-0.5">{r.food_strategy.fortified}</div>
                </div>
              </div>
            )}
            {r.food_strategy.fermented && (
              <div className="flex gap-3 bg-purple-50 rounded-xl p-3 border border-purple-100">
                <div className="text-2xl">🧀</div>
                <div>
                  <div className="text-xs font-semibold text-purple-700">Fermented</div>
                  <div className="text-xs text-gray-700 mt-0.5">{r.food_strategy.fermented}</div>
                </div>
              </div>
            )}
            {r.food_strategy.other && (
              <div className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="text-2xl">💊</div>
                <div>
                  <div className="text-xs font-semibold text-gray-700">Other</div>
                  <div className="text-xs text-gray-700 mt-0.5">{r.food_strategy.other}</div>
                </div>
              </div>
            )}
          </div>
        </SectionHeader>
      )}

      {/* ── TOP FOOD SOURCES ─────────────────────────────────── */}
      {r.id && (
        <TopFoodSources
          elementId={r.id}
          elementName={r.name_common || r.name || 'this element'}
          accessToken={accessToken}
        />
      )}

      {/* ── FUNCTIONS & BENEFITS ─────────────────────────────── */}
      {(r.functions || r.health_benefits || r.risk_tags) && (
        <SectionHeader title="Functions & Benefits" icon={Zap} expanded={expandedSections.functions} onToggle={() => toggle('functions')}>
          {r.functions && Array.isArray(r.functions) && r.functions.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Functions</div>
              <div className="flex flex-wrap gap-1">
                {r.functions.map((f: string, i: number) => (
                  <Badge key={i} className="text-xs bg-blue-50 text-blue-700 border-blue-200" variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
          )}
          {r.health_benefits && typeof r.health_benefits === 'object' && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Health Benefits</div>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(r.health_benefits) ? r.health_benefits : Object.keys(r.health_benefits)).map((b: string, i: number) => (
                  <Badge key={i} className="text-xs bg-green-50 text-green-700 border-green-200" variant="outline">{b}</Badge>
                ))}
              </div>
            </div>
          )}
          {r.risk_tags && Array.isArray(r.risk_tags) && r.risk_tags.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Risk Tags</div>
              <div className="flex flex-wrap gap-1">
                {r.risk_tags.map((t: string, i: number) => (
                  <Badge key={i} className="text-xs bg-red-50 text-red-700 border-red-200" variant="outline">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </SectionHeader>
      )}

      {/* ── DEFICIENCY & EXCESS ──────────────────────────────── */}
      {(r.thresholds || r.deficiency_ranges || r.excess_ranges || r.deficiency) && (
        <SectionHeader title="Deficiency & Excess" icon={AlertTriangle} expanded={expandedSections.deficiency} onToggle={() => toggle('deficiency')}>
          {/* Thresholds */}
          {r.thresholds && typeof r.thresholds === 'object' && Object.keys(r.thresholds).length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Thresholds</div>
              <JsonDisplay data={r.thresholds} />
            </div>
          )}
          {/* Deficiency */}
          {r.deficiency && typeof r.deficiency === 'object' && Object.keys(r.deficiency).length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Deficiency Details</div>
              <JsonDisplay data={r.deficiency} />
            </div>
          )}
          {/* Deficiency Ranges */}
          {r.deficiency_ranges && typeof r.deficiency_ranges === 'object' && Object.keys(r.deficiency_ranges).length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Deficiency Ranges</div>
              <JsonDisplay data={r.deficiency_ranges} />
            </div>
          )}
          {/* Excess Ranges */}
          {r.excess_ranges && typeof r.excess_ranges === 'object' && Object.keys(r.excess_ranges).length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Excess / Toxicity Ranges</div>
              <JsonDisplay data={r.excess_ranges} />
            </div>
          )}
        </SectionHeader>
      )}

      {/* ── INTERACTIONS ─────────────────────────────────────── */}
      {r.interactions && typeof r.interactions === 'object' && Object.keys(r.interactions).length > 0 && (
        <SectionHeader title="Interactions" icon={Pill} expanded={expandedSections.interactions} onToggle={() => toggle('interactions')}>
          <JsonDisplay data={r.interactions} />
        </SectionHeader>
      )}

      {/* ── DETOX STRATEGY ───────────────────────────────────── */}
      {r.detox_strategy && (
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <div className="text-xs font-semibold text-orange-700">How to Reduce Exposure</div>
          </div>
          <div className="text-sm text-gray-700">{r.detox_strategy}</div>
        </div>
      )}

      {/* ── REFERENCES & META ────────────────────────────────── */}
      {(r.scientific_references || r.info_sections || r.scientific_papers || r.social_content) && (
        <SectionHeader title="References & Content" icon={ExternalLink} expanded={expandedSections.references} onToggle={() => toggle('references')}>
          {r.scientific_references && typeof r.scientific_references === 'object' && Object.keys(r.scientific_references).length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Scientific References</div>
              <JsonDisplay data={r.scientific_references} />
            </div>
          )}
          {r.scientific_papers && Array.isArray(r.scientific_papers) && r.scientific_papers.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Papers</div>
              <div className="space-y-1">
                {r.scientific_papers.map((p: any, i: number) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-3 h-3" />
                    {p.title || p.url}
                  </a>
                ))}
              </div>
            </div>
          )}
          {r.social_content && Array.isArray(r.social_content) && r.social_content.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Social Content</div>
              <div className="space-y-1">
                {r.social_content.map((c: any, i: number) => (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-3 h-3" />
                    {c.title || c.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </SectionHeader>
      )}

      {/* ── META INFO ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
        {r.health_score != null && (
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="font-medium">Health Score:</span> <span className="text-gray-700 font-bold">{r.health_score}/100</span>
          </div>
        )}
        {r.source && (
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="font-medium">Source:</span> {r.source}
          </div>
        )}
        {r.ai_enriched_at && (
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="font-medium">AI Enriched:</span> {new Date(r.ai_enriched_at).toLocaleDateString()}
          </div>
        )}
        {r.created_at && (
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="font-medium">Created:</span> {new Date(r.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ComponentType<any>;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Icon className="w-4 h-4 text-gray-500" />
          {title}
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="p-4 space-y-3">{children}</div>
      )}
    </div>
  );
}

function JsonDisplay({ data }: { data: any }) {
  if (data == null) return <span className="text-gray-300 text-xs">—</span>;

  if (typeof data === 'string') return <span className="text-sm text-gray-700">{data}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-300 text-xs">Empty</span>;
    return (
      <div className="space-y-1">
        {data.map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-700">
            {typeof item === 'object' ? (
              <div className="space-y-0.5">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium text-gray-500 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                    <span>{Array.isArray(v) ? (v as any[]).join(', ') : String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              String(item)
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) return <span className="text-gray-300 text-xs">Empty</span>;
    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="text-[10px] font-medium text-gray-500 uppercase mb-0.5 capitalize">{key.replace(/_/g, ' ')}</div>
            <div className="text-xs text-gray-700">
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1">
                  {(value as any[]).map((v, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] py-0">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Badge>
                  ))}
                </div>
              ) : typeof value === 'object' && value !== null ? (
                <JsonDisplay data={value} />
              ) : (
                String(value)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm text-gray-700">{String(data)}</span>;
}
