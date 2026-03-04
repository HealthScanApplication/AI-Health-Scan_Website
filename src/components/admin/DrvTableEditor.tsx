import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface DrvGroup {
  group: string;
  age_range: string;
  gender: string;
  rda: number | null;
  ul: number | null;
  ai?: number | null;
  ear?: number | null;
  pregnant?: boolean;
  lactating?: boolean;
}

interface DrvData {
  unit: string;
  groups: DrvGroup[];
}

const DEFAULT_GROUPS: DrvGroup[] = [
  // Infants & Children (both genders)
  { group: 'Infants 0–6 months', age_range: '0–6m', gender: 'all', rda: null, ul: null },
  { group: 'Infants 7–12 months', age_range: '7–12m', gender: 'all', rda: null, ul: null },
  { group: 'Children 1–3 years', age_range: '1–3y', gender: 'all', rda: null, ul: null },
  { group: 'Children 4–8 years', age_range: '4–8y', gender: 'all', rda: null, ul: null },
  // Male × 5 age ranges
  { group: 'Male 9–13 years', age_range: '9–13y', gender: 'male', rda: null, ul: null },
  { group: 'Male 14–18 years', age_range: '14–18y', gender: 'male', rda: null, ul: null },
  { group: 'Male 19–50 years', age_range: '19–50y', gender: 'male', rda: null, ul: null },
  { group: 'Male 51–70 years', age_range: '51–70y', gender: 'male', rda: null, ul: null },
  { group: 'Male 70+ years', age_range: '70+y', gender: 'male', rda: null, ul: null },
  // Female × 5 age ranges
  { group: 'Female 9–13 years', age_range: '9–13y', gender: 'female', rda: null, ul: null },
  { group: 'Female 14–18 years', age_range: '14–18y', gender: 'female', rda: null, ul: null },
  { group: 'Female 19–50 years', age_range: '19–50y', gender: 'female', rda: null, ul: null },
  { group: 'Female 51–70 years', age_range: '51–70y', gender: 'female', rda: null, ul: null },
  { group: 'Female 70+ years', age_range: '70+y', gender: 'female', rda: null, ul: null },
  // Special
  { group: 'Pregnant', age_range: 'any', gender: 'female', rda: null, ul: null, pregnant: true },
  { group: 'Lactating', age_range: 'any', gender: 'female', rda: null, ul: null, lactating: true },
];

const UNIT_OPTIONS = ['mg/day', 'mcg/day', 'g/day', 'IU/day', 'mg', 'mcg', 'g', 'IU'];

interface DrvTableEditorProps {
  value: any;
  onChange: (val: DrvData) => void;
  label?: string;
}

export default function DrvTableEditor({ value, onChange, label }: DrvTableEditorProps) {
  const [expanded, setExpanded] = useState(true);

  const parseDrv = useCallback((): DrvData => {
    if (!value) return { unit: 'mg/day', groups: [] };
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return { unit: 'mg/day', groups: [] }; }
    }
    if (typeof value === 'object' && value.unit) return value as DrvData;
    return { unit: 'mg/day', groups: [] };
  }, [value]);

  const drv = parseDrv();

  const updateUnit = (unit: string) => onChange({ ...drv, unit });

  const updateGroup = (idx: number, field: keyof DrvGroup, val: any) => {
    const groups = [...drv.groups];
    groups[idx] = { ...groups[idx], [field]: val };
    onChange({ ...drv, groups });
  };

  const removeGroup = (idx: number) => {
    const groups = drv.groups.filter((_, i) => i !== idx);
    onChange({ ...drv, groups });
  };

  const addGroup = () => {
    onChange({ ...drv, groups: [...drv.groups, { group: '', age_range: '', gender: 'all', rda: null, ul: null }] });
  };

  const loadDefaults = () => {
    onChange({ unit: drv.unit || 'mg/day', groups: DEFAULT_GROUPS });
  };

  const parseNum = (v: string): number | null => {
    if (v === '' || v === '-') return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const genderIcon = (g: string) => {
    if (g === 'male') return '♂';
    if (g === 'female') return '♀';
    return '⚥';
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <button type="button" onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            DRV Table ({drv.groups.length} groups)
          </button>
          <div className="flex items-center gap-2">
            <select
              title="DRV Unit"
              value={drv.unit}
              onChange={(e) => updateUnit(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
            >
              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {drv.groups.length === 0 && (
              <button type="button" onClick={loadDefaults}
                className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium">
                Load Defaults
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="overflow-x-auto">
            {drv.groups.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-400 mb-2">No population groups defined yet</p>
                <button type="button" onClick={loadDefaults}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">
                  Load Standard Groups
                </button>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-3 py-2 font-semibold">Group</th>
                    <th className="text-left px-2 py-2 font-semibold w-20">Age</th>
                    <th className="text-center px-2 py-2 font-semibold w-14">Gender</th>
                    <th className="text-right px-2 py-2 font-semibold w-20">RDA</th>
                    <th className="text-right px-2 py-2 font-semibold w-20">UL</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {drv.groups.map((g, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-3 py-1.5">
                        <input
                          value={g.group}
                          onChange={(e) => updateGroup(idx, 'group', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 text-xs px-0 py-0.5 text-gray-800"
                          placeholder="Group name"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={g.age_range}
                          onChange={(e) => updateGroup(idx, 'age_range', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 text-xs px-0 py-0.5 text-gray-600"
                          placeholder="e.g. 19-50y"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <select
                          title="Gender"
                          value={g.gender}
                          onChange={(e) => updateGroup(idx, 'gender', e.target.value)}
                          className="bg-transparent border-0 text-xs text-center cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
                        >
                          <option value="all">⚥ All</option>
                          <option value="male">♂ Male</option>
                          <option value="female">♀ Female</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={g.rda === null ? '' : g.rda}
                          onChange={(e) => updateGroup(idx, 'rda', parseNum(e.target.value))}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 text-xs px-0 py-0.5 text-right text-green-700 font-medium"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={g.ul === null ? '' : g.ul}
                          onChange={(e) => updateGroup(idx, 'ul', parseNum(e.target.value))}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 text-xs px-0 py-0.5 text-right text-red-600 font-medium"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button type="button" onClick={() => removeGroup(idx)} title="Remove group"
                          className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {drv.groups.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                <button type="button" onClick={addGroup}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <Plus className="w-3 h-3" /> Add Group
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
