import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Search, AlertTriangle,
  Leaf, Brain, Pill, Shield, Zap, FileText, Star, X, Check,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface HerbalIdentity {
  common_name: string;
  latin_name: string;
  herb_id?: string;
  summary: string;
}

interface Mechanism {
  mechanism_type: string;
  biological_system: string;
  description: string;
}

interface SymptomUse {
  symptom_id?: string;
  symptom_name: string;
  effectiveness: 'high' | 'moderate' | 'low';
  evidence_level: 'clinical' | 'observational' | 'traditional';
  onset: 'acute' | 'chronic';
}

interface DosageRange {
  preparation: string;
  min: number | string;
  max: number | string;
  unit: string;
  population_notes: string;
}

interface Risk {
  type: 'side_effect' | 'contraindication' | 'toxicity';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface Interaction {
  interacts_with: string;
  severity: 'mild' | 'moderate' | 'severe';
  mechanism: string;
}

interface Evidence {
  level: string;
  sources: string[];
  reviewer: string;
  last_reviewed: string;
}

interface ScoringHint {
  category: string;
  default_direction: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  conditional_rules: string[];
}

export interface HerbalQualityData {
  herbal_identity: HerbalIdentity;
  mechanisms: Mechanism[];
  symptom_uses: SymptomUse[];
  dosage_ranges: DosageRange[];
  risks: Risk[];
  interactions: Interaction[];
  evidence: Evidence;
  scoring_hint: ScoringHint;
}

interface SymptomRecord {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  body_system?: string;
  severity?: string;
  image_url?: string;
  icon_name?: string;
}

interface HerbalQualityEditorProps {
  value: any;
  onChange: (val: HerbalQualityData) => void;
  symptomsCache: SymptomRecord[];
  onCreateSymptom?: (name: string) => Promise<SymptomRecord | null>;
  ingredientName?: string;
}

// ── Defaults ───────────────────────────────────────────────────

const EMPTY_DATA: HerbalQualityData = {
  herbal_identity: { common_name: '', latin_name: '', summary: '' },
  mechanisms: [],
  symptom_uses: [],
  dosage_ranges: [],
  risks: [],
  interactions: [],
  evidence: { level: '', sources: [], reviewer: '', last_reviewed: '' },
  scoring_hint: { category: 'therapeutic', default_direction: 'positive', magnitude: 5, conditional_rules: [] },
};

const MECHANISM_TYPES = [
  'anti-inflammatory', 'antioxidant', 'antimicrobial', 'adaptogenic', 'analgesic',
  'anxiolytic', 'carminative', 'cholagogue', 'demulcent', 'diuretic',
  'expectorant', 'hepatoprotective', 'immunomodulatory', 'nervine', 'sedative',
  'spasmolytic', 'tonic', 'vasodilator', 'vulnerary', 'other',
];

const BIO_SYSTEMS = [
  'nervous', 'immune', 'digestive', 'cardiovascular', 'respiratory',
  'endocrine', 'musculoskeletal', 'integumentary', 'urinary', 'reproductive',
  'lymphatic', 'hepatic', 'whole body',
];

const PREPARATION_TYPES = [
  'tea / infusion', 'tincture', 'capsule', 'powder', 'essential oil',
  'poultice', 'decoction', 'extract', 'syrup', 'salve / balm', 'fresh', 'dried',
];

const DOSAGE_UNITS = ['mg', 'g', 'ml', 'drops', 'cups', 'tbsp', 'tsp'];

const EVIDENCE_LEVELS = [
  'systematic review', 'RCT', 'cohort study', 'case-control', 'case series',
  'expert opinion', 'traditional use', 'in-vitro only', 'animal study',
];

// ── Badge helpers ──────────────────────────────────────────────

const EFFECTIVENESS_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const EVIDENCE_COLORS: Record<string, string> = {
  clinical: 'bg-blue-100 text-blue-800 border-blue-200',
  observational: 'bg-purple-100 text-purple-800 border-purple-200',
  traditional: 'bg-amber-100 text-amber-800 border-amber-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  moderate: 'bg-orange-50 text-orange-700 border-orange-200',
  severe: 'bg-red-50 text-red-700 border-red-200',
};

const RISK_TYPE_COLORS: Record<string, string> = {
  side_effect: 'bg-yellow-100 text-yellow-800',
  contraindication: 'bg-orange-100 text-orange-800',
  toxicity: 'bg-red-100 text-red-800',
};

// ── Section wrapper ────────────────────────────────────────────

function Section({
  title, icon, count, color, children, defaultOpen = false, badge,
}: {
  title: string; icon: React.ReactNode; count?: number; color: string;
  children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-xl overflow-hidden ${open ? 'border-gray-300' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${color}`}
      >
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-sm font-semibold text-gray-700 flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">{count}</span>
        )}
        {badge}
      </button>
      {open && <div className="px-4 py-4 border-t border-gray-100 bg-white space-y-3">{children}</div>}
    </div>
  );
}

// ── Symptom Search / Autocomplete ──────────────────────────────

function SymptomAutocomplete({
  symptomsCache, selected, onSelect, onCreateSymptom,
}: {
  symptomsCache: SymptomRecord[];
  selected: string[];
  onSelect: (s: SymptomRecord) => void;
  onCreateSymptom?: (name: string) => Promise<SymptomRecord | null>;
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return symptomsCache.filter(s => !selected.includes(s.id)).slice(0, 8);
    const q = query.toLowerCase();
    return symptomsCache
      .filter(s => !selected.includes(s.id) && (
        s.name.toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.body_system || '').toLowerCase().includes(q)
      ))
      .slice(0, 10);
  }, [query, symptomsCache, selected]);

  const exactMatch = symptomsCache.some(s => s.name.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    if (!onCreateSymptom || !query.trim()) return;
    setCreating(true);
    try {
      const newSym = await onCreateSymptom(query.trim());
      if (newSym) {
        onSelect(newSym);
        setQuery('');
        setShowDropdown(false);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 h-10 border border-gray-200 rounded-lg bg-white px-3">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search symptoms..."
          className="flex-1 text-sm border-0 outline-none bg-transparent placeholder-gray-400"
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 && !query.trim() && (
            <div className="px-3 py-2 text-xs text-gray-400 italic">No symptoms loaded yet</div>
          )}
          {filtered.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onSelect(s); setQuery(''); setShowDropdown(false); }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 last:border-b-0 flex items-center gap-2"
            >
              {s.image_url ? (
                <img src={s.image_url} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {s.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{s.name}</div>
                <div className="text-[10px] text-gray-400">{s.body_system} · {s.category}</div>
              </div>
              {s.severity && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${SEVERITY_COLORS[s.severity] || 'bg-gray-100 text-gray-600'}`}>
                  {s.severity}
                </span>
              )}
            </button>
          ))}
          {query.trim() && !exactMatch && onCreateSymptom && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-2 border-t border-blue-100"
            >
              <Plus className="w-3.5 h-3.5" />
              {creating ? 'Creating...' : `Create new symptom "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Symptom Card ───────────────────────────────────────────────

function SymptomCard({
  use, symptom, onUpdate, onRemove,
}: {
  use: SymptomUse;
  symptom?: SymptomRecord;
  onUpdate: (field: keyof SymptomUse, val: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative group border border-gray-200 rounded-xl p-2.5 bg-white hover:border-gray-300 transition-colors">
      <button
        type="button"
        onClick={onRemove}
        title="Remove symptom"
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-gray-100"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        {symptom?.image_url ? (
          <img src={symptom.image_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {use.symptom_name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-800 truncate">{use.symptom_name}</div>
          {symptom && (
            <div className="text-[10px] text-gray-400">{symptom.body_system} · {symptom.category}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <select
          title="Effectiveness"
          value={use.effectiveness}
          onChange={(e) => onUpdate('effectiveness', e.target.value)}
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium cursor-pointer ${EFFECTIVENESS_COLORS[use.effectiveness]}`}
        >
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
        <select
          title="Evidence level"
          value={use.evidence_level}
          onChange={(e) => onUpdate('evidence_level', e.target.value)}
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium cursor-pointer ${EVIDENCE_COLORS[use.evidence_level]}`}
        >
          <option value="clinical">Clinical</option>
          <option value="observational">Observational</option>
          <option value="traditional">Traditional</option>
        </select>
        <select
          title="Onset type"
          value={use.onset}
          onChange={(e) => onUpdate('onset', e.target.value)}
          className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 font-medium cursor-pointer"
        >
          <option value="acute">Acute</option>
          <option value="chronic">Chronic</option>
        </select>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function HerbalQualityEditor({
  value, onChange, symptomsCache, onCreateSymptom, ingredientName,
}: HerbalQualityEditorProps) {

  const data: HerbalQualityData = useMemo(() => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...EMPTY_DATA, ...value };
    }
    if (typeof value === 'string') {
      try { return { ...EMPTY_DATA, ...JSON.parse(value) }; } catch { /* */ }
    }
    return { ...EMPTY_DATA, herbal_identity: { ...EMPTY_DATA.herbal_identity, common_name: ingredientName || '' } };
  }, [value, ingredientName]);

  const update = (path: string, val: any) => {
    const copy = JSON.parse(JSON.stringify(data));
    const parts = path.split('.');
    let obj: any = copy;
    for (let i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] === undefined) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = val;
    onChange(copy);
  };

  const hasDangerousRisks = data.risks.some(r => r.severity === 'severe' || r.type === 'toxicity');

  const inputCls = "w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400";
  const selectCls = "h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";
  const addBtnCls = "flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors w-full justify-center";
  const removeBtnCls = "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all";

  // Score preview
  const scorePreview = useMemo(() => {
    const mag = data.scoring_hint.magnitude || 5;
    const dir = data.scoring_hint.default_direction;
    const effectivenessBonus = data.symptom_uses.reduce((sum, su) => {
      return sum + (su.effectiveness === 'high' ? 8 : su.effectiveness === 'moderate' ? 5 : 2);
    }, 0);
    const riskPenalty = data.risks.reduce((sum, r) => {
      return sum + (r.severity === 'severe' ? 8 : r.severity === 'moderate' ? 4 : 1);
    }, 0);
    const net = dir === 'positive' ? mag + effectivenessBonus - riskPenalty : -(mag + riskPenalty);
    return { effectivenessBonus, riskPenalty, net: Math.round(net), direction: dir };
  }, [data]);

  return (
    <div className="space-y-2">

      {hasDangerousRisks && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-700 font-medium">This ingredient has severe risks or toxicity warnings</span>
        </div>
      )}

      {/* Identity */}
      <Section title="Herbal Identity" icon={<Leaf className="w-3.5 h-3.5 text-green-600" />} color="bg-green-50/50" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Common Name</label>
            <input value={data.herbal_identity.common_name} onChange={(e) => update('herbal_identity.common_name', e.target.value)}
              className={inputCls} placeholder="e.g. Turmeric" />
          </div>
          <div>
            <label className={labelCls}>Latin Name</label>
            <input value={data.herbal_identity.latin_name} onChange={(e) => update('herbal_identity.latin_name', e.target.value)}
              className={inputCls} placeholder="e.g. Curcuma longa" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Medical Summary</label>
          <textarea value={data.herbal_identity.summary} onChange={(e) => update('herbal_identity.summary', e.target.value)}
            rows={3} className={`${inputCls} h-auto min-h-[80px] resize-y`} placeholder="Short pharmacological description..." />
        </div>
      </Section>

      {/* Mechanisms */}
      <Section title="Mechanisms of Action" icon={<Brain className="w-3.5 h-3.5 text-purple-600" />} color="bg-purple-50/50" count={data.mechanisms.length}>
        {data.mechanisms.map((m, idx) => (
          <div key={idx} className="relative group grid grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
            <div>
              <label className={labelCls}>Type</label>
              <select title="Mechanism type" value={m.mechanism_type} onChange={(e) => {
                const arr = [...data.mechanisms]; arr[idx] = { ...arr[idx], mechanism_type: e.target.value }; update('mechanisms', arr);
              }} className={`${selectCls} w-full`}>
                <option value="">Select type...</option>
                {MECHANISM_TYPES.map(t => <option key={t} value={t}>{t.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>System</label>
              <select title="Biological system" value={m.biological_system} onChange={(e) => {
                const arr = [...data.mechanisms]; arr[idx] = { ...arr[idx], biological_system: e.target.value }; update('mechanisms', arr);
              }} className={`${selectCls} w-full`}>
                <option value="">Select system...</option>
                {BIO_SYSTEMS.map(s => <option key={s} value={s}>{s.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <input value={m.description} onChange={(e) => {
                const arr = [...data.mechanisms]; arr[idx] = { ...arr[idx], description: e.target.value }; update('mechanisms', arr);
              }} className={inputCls} placeholder="How this mechanism works..." />
            </div>
            <button type="button" title="Remove" onClick={() => update('mechanisms', data.mechanisms.filter((_, i) => i !== idx))}
              className={removeBtnCls}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => update('mechanisms', [...data.mechanisms, { mechanism_type: '', biological_system: '', description: '' }])}
          className={addBtnCls}>
          <Plus className="w-4 h-4" /> Add Mechanism
        </button>
      </Section>

      {/* Symptom Uses */}
      <Section title="Symptom Uses" icon={<Zap className="w-3.5 h-3.5 text-rose-500" />} color="bg-rose-50/50" count={data.symptom_uses.length}>
        {data.symptom_uses.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {data.symptom_uses.map((su, idx) => {
              const symptom = symptomsCache.find(s => s.id === su.symptom_id || s.name === su.symptom_name);
              return (
                <SymptomCard
                  key={idx}
                  use={su}
                  symptom={symptom}
                  onUpdate={(field, val) => {
                    const arr = [...data.symptom_uses]; arr[idx] = { ...arr[idx], [field]: val }; update('symptom_uses', arr);
                  }}
                  onRemove={() => update('symptom_uses', data.symptom_uses.filter((_, i) => i !== idx))}
                />
              );
            })}
          </div>
        )}
        <SymptomAutocomplete
          symptomsCache={symptomsCache}
          selected={data.symptom_uses.map(su => su.symptom_id || '')}
          onSelect={(s) => update('symptom_uses', [
            ...data.symptom_uses,
            { symptom_id: s.id, symptom_name: s.name, effectiveness: 'moderate', evidence_level: 'traditional', onset: 'chronic' },
          ])}
          onCreateSymptom={onCreateSymptom}
        />
      </Section>

      {/* Dosage Ranges */}
      <Section title="Dosage Ranges" icon={<Pill className="w-3.5 h-3.5 text-blue-600" />} color="bg-blue-50/50" count={data.dosage_ranges.length}>
        {data.dosage_ranges.map((d, idx) => (
          <div key={idx} className="relative group grid grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
            <div className="col-span-2">
              <label className={labelCls}>Preparation</label>
              <select title="Preparation type" value={d.preparation} onChange={(e) => {
                const arr = [...data.dosage_ranges]; arr[idx] = { ...arr[idx], preparation: e.target.value }; update('dosage_ranges', arr);
              }} className={`${selectCls} w-full`}>
                <option value="">Select...</option>
                {PREPARATION_TYPES.map(p => <option key={p} value={p}>{p.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Min</label>
              <input type="number" value={d.min} onChange={(e) => {
                const arr = [...data.dosage_ranges]; arr[idx] = { ...arr[idx], min: e.target.value }; update('dosage_ranges', arr);
              }} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Max</label>
              <input type="number" value={d.max} onChange={(e) => {
                const arr = [...data.dosage_ranges]; arr[idx] = { ...arr[idx], max: e.target.value }; update('dosage_ranges', arr);
              }} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select title="Unit" value={d.unit} onChange={(e) => {
                const arr = [...data.dosage_ranges]; arr[idx] = { ...arr[idx], unit: e.target.value }; update('dosage_ranges', arr);
              }} className={`${selectCls} w-full`}>
                {DOSAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Population Notes</label>
              <input value={d.population_notes} onChange={(e) => {
                const arr = [...data.dosage_ranges]; arr[idx] = { ...arr[idx], population_notes: e.target.value }; update('dosage_ranges', arr);
              }} className={inputCls} placeholder="e.g. Adults only, not during pregnancy" />
            </div>
            <button type="button" title="Remove" onClick={() => update('dosage_ranges', data.dosage_ranges.filter((_, i) => i !== idx))}
              className={removeBtnCls}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => update('dosage_ranges', [...data.dosage_ranges, { preparation: '', min: '', max: '', unit: 'mg', population_notes: '' }])}
          className={addBtnCls}>
          <Plus className="w-4 h-4" /> Add Dosage
        </button>
      </Section>

      {/* Risks */}
      <Section
        title="Risks & Warnings"
        icon={<AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
        color="bg-orange-50/50"
        count={data.risks.length}
        badge={hasDangerousRisks ? (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200">DANGER</span>
        ) : undefined}
      >
        {data.risks.map((r, idx) => (
          <div key={idx} className={`relative group grid grid-cols-3 gap-3 p-3 border rounded-lg ${SEVERITY_COLORS[r.severity]}`}>
            <div>
              <label className={labelCls}>Type</label>
              <select title="Risk type" value={r.type} onChange={(e) => {
                const arr = [...data.risks]; arr[idx] = { ...arr[idx], type: e.target.value as Risk['type'] }; update('risks', arr);
              }} className={`${selectCls} w-full`}>
                <option value="side_effect">Side Effect</option>
                <option value="contraindication">Contraindication</option>
                <option value="toxicity">Toxicity</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Severity</label>
              <select title="Severity" value={r.severity} onChange={(e) => {
                const arr = [...data.risks]; arr[idx] = { ...arr[idx], severity: e.target.value as Risk['severity'] }; update('risks', arr);
              }} className={`${selectCls} w-full`}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Description</label>
              <input value={r.description} onChange={(e) => {
                const arr = [...data.risks]; arr[idx] = { ...arr[idx], description: e.target.value }; update('risks', arr);
              }} className={inputCls} placeholder="Describe the risk..." />
            </div>
            <button type="button" title="Remove" onClick={() => update('risks', data.risks.filter((_, i) => i !== idx))}
              className={removeBtnCls}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => update('risks', [...data.risks, { type: 'side_effect', description: '', severity: 'mild' }])}
          className={addBtnCls}>
          <Plus className="w-4 h-4" /> Add Risk
        </button>
      </Section>

      {/* Interactions */}
      <Section title="Drug / Herb Interactions" icon={<Shield className="w-3.5 h-3.5 text-red-500" />} color="bg-red-50/50" count={data.interactions.length}>
        {data.interactions.map((inter, idx) => (
          <div key={idx} className="relative group grid grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
            <div>
              <label className={labelCls}>Interacts With</label>
              <input value={inter.interacts_with} onChange={(e) => {
                const arr = [...data.interactions]; arr[idx] = { ...arr[idx], interacts_with: e.target.value }; update('interactions', arr);
              }} className={inputCls} placeholder="e.g. Warfarin" />
            </div>
            <div>
              <label className={labelCls}>Severity</label>
              <select title="Severity" value={inter.severity} onChange={(e) => {
                const arr = [...data.interactions]; arr[idx] = { ...arr[idx], severity: e.target.value as Interaction['severity'] }; update('interactions', arr);
              }} className={`${selectCls} w-full`}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Mechanism</label>
              <input value={inter.mechanism} onChange={(e) => {
                const arr = [...data.interactions]; arr[idx] = { ...arr[idx], mechanism: e.target.value }; update('interactions', arr);
              }} className={inputCls} placeholder="How they interact" />
            </div>
            <button type="button" title="Remove" onClick={() => update('interactions', data.interactions.filter((_, i) => i !== idx))}
              className={removeBtnCls}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => update('interactions', [...data.interactions, { interacts_with: '', severity: 'mild', mechanism: '' }])}
          className={addBtnCls}>
          <Plus className="w-4 h-4" /> Add Interaction
        </button>
      </Section>

      {/* Evidence */}
      <Section title="Evidence & Review" icon={<FileText className="w-3.5 h-3.5 text-indigo-500" />} color="bg-indigo-50/50">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Evidence Level</label>
            <select title="Evidence level" value={data.evidence.level} onChange={(e) => update('evidence.level', e.target.value)} className={`${selectCls} w-full`}>
              <option value="">Select...</option>
              {EVIDENCE_LEVELS.map(l => <option key={l} value={l}>{l.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Reviewer</label>
            <input value={data.evidence.reviewer} onChange={(e) => update('evidence.reviewer', e.target.value)}
              className={inputCls} placeholder="Reviewer name" />
          </div>
          <div>
            <label className={labelCls}>Last Reviewed</label>
            <input type="date" title="Last reviewed date" value={data.evidence.last_reviewed} onChange={(e) => update('evidence.last_reviewed', e.target.value)}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Sources ({data.evidence.sources?.length || 0})</label>
            <input
              placeholder="Add source URL and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    update('evidence.sources', [...(data.evidence.sources || []), val]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
              className={inputCls}
            />
          </div>
        </div>
        {data.evidence.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.evidence.sources.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 max-w-[250px] truncate">
                {s}
                <button type="button" title="Remove source" onClick={() => update('evidence.sources', data.evidence.sources.filter((_, j) => j !== i))}
                  className="text-indigo-400 hover:text-red-500 flex-shrink-0"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Scoring */}
      <Section title="Score Preview" icon={<Star className="w-3.5 h-3.5 text-amber-500" />} color="bg-amber-50/50">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className={labelCls}>Category</label>
            <select title="Scoring category" value={data.scoring_hint.category} onChange={(e) => update('scoring_hint.category', e.target.value)}
              className={`${selectCls} w-full`}>
              <option value="therapeutic">Therapeutic</option>
              <option value="adaptogenic">Adaptogenic</option>
              <option value="nutritive">Nutritive</option>
              <option value="toxic">Toxic</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Direction</label>
            <select title="Score direction" value={data.scoring_hint.default_direction}
              onChange={(e) => update('scoring_hint.default_direction', e.target.value)} className={`${selectCls} w-full`}>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Magnitude (1-10)</label>
            <div className="flex items-center gap-2 h-10">
              <input type="range" min={1} max={10} title="Magnitude slider" value={data.scoring_hint.magnitude}
                onChange={(e) => update('scoring_hint.magnitude', parseInt(e.target.value))}
                className="flex-1 h-2 accent-amber-500" />
              <span className="text-sm font-bold text-amber-700 w-6 text-center">{data.scoring_hint.magnitude}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium mb-1">Effectiveness</div>
            <div className="text-lg font-bold text-green-600">+{scorePreview.effectivenessBonus}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium mb-1">Risk Penalty</div>
            <div className="text-lg font-bold text-red-600">-{scorePreview.riskPenalty}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium mb-1">Net Score</div>
            <div className={`text-lg font-bold ${scorePreview.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {scorePreview.net >= 0 ? '+' : ''}{scorePreview.net}
            </div>
          </div>
        </div>
      </Section>

    </div>
  );
}
