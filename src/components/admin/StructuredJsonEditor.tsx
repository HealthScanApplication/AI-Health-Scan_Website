import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Generic structured editor for JSON data.
 * Renders objects as key-value forms, arrays as editable lists,
 * and nested structures as collapsible sections.
 * Replaces raw JSON textareas for non-developer users.
 */

interface StructuredJsonEditorProps {
  value: any;
  onChange: (val: any) => void;
  label?: string;
  placeholder?: string;
  fieldType?: string;
}

// Render a single value editor based on type
function ValueEditor({ value, onChange, placeholder }: { value: any; onChange: (v: any) => void; placeholder?: string }) {
  if (typeof value === 'boolean') {
    return (
      <button type="button" onClick={() => onChange(!value)}
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {value ? 'Yes' : 'No'}
      </button>
    );
  }
  if (typeof value === 'number') {
    return (
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-24 text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-right" />
    );
  }
  if (typeof value === 'string') {
    if (value.length > 80) {
      return (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white min-h-[48px] resize-y" />
      );
    }
    return (
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 bg-white" />
    );
  }
  return null;
}

// Render an array of strings as editable chips/list
function StringArrayEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            <input value={item} onChange={(e) => { const u = [...items]; u[idx] = e.target.value; onChange(u); }}
              className="bg-transparent border-0 text-xs p-0 w-auto min-w-[40px] focus:ring-0 text-gray-700" style={{ width: `${Math.max(item.length * 7, 40)}px` }} />
            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="text-gray-400 hover:text-red-500 text-sm leading-none" title="Remove">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { e.preventDefault(); onChange([...items, newItem.trim()]); setNewItem(''); } }}
          placeholder={placeholder || 'Add item...'}
          className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 bg-white" />
        <button type="button" onClick={() => { if (newItem.trim()) { onChange([...items, newItem.trim()]); setNewItem(''); } }}
          disabled={!newItem.trim()} className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-30 px-1">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Render an array of objects as a mini table
function ObjectArrayEditor({ items, onChange }: { items: any[]; onChange: (v: any[]) => void }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-2">
        <button type="button" onClick={() => onChange([{}])}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          <Plus className="w-3 h-3 inline mr-1" />Add Entry
        </button>
      </div>
    );
  }

  const allKeys = Array.from(new Set(items.flatMap(item => Object.keys(item))));

  return (
    <div className="space-y-1">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              {allKeys.map(k => (
                <th key={k} className="text-left px-2 py-1 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                  {k.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30">
                {allKeys.map(k => (
                  <td key={k} className="px-2 py-1">
                    {typeof item[k] === 'boolean' ? (
                      <button type="button" onClick={() => { const u = [...items]; u[idx] = { ...u[idx], [k]: !item[k] }; onChange(u); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${item[k] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item[k] ? 'Yes' : 'No'}
                      </button>
                    ) : typeof item[k] === 'number' ? (
                      <input type="number" value={item[k]} onChange={(e) => { const u = [...items]; u[idx] = { ...u[idx], [k]: parseFloat(e.target.value) || 0 }; onChange(u); }}
                        className="w-16 text-xs border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 bg-transparent px-0 py-0.5 text-right" />
                    ) : Array.isArray(item[k]) ? (
                      <span className="text-[10px] text-gray-400">[{item[k].length}]</span>
                    ) : typeof item[k] === 'object' && item[k] !== null ? (
                      <span className="text-[10px] text-gray-400">{'{...}'}</span>
                    ) : (
                      <input value={item[k] ?? ''} onChange={(e) => { const u = [...items]; u[idx] = { ...u[idx], [k]: e.target.value }; onChange(u); }}
                        className="w-full text-xs border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 bg-transparent px-0 py-0.5" />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} title="Remove row"
                    className="text-gray-300 hover:text-red-500 p-0.5 rounded hover:bg-red-50">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => {
        const template: Record<string, any> = {};
        allKeys.forEach(k => { template[k] = typeof items[0]?.[k] === 'number' ? 0 : ''; });
        onChange([...items, template]);
      }} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2">
        <Plus className="w-3 h-3" /> Add Row
      </button>
    </div>
  );
}

// Recursive section renderer for nested objects
function ObjectEditor({ data, onChange, depth = 0 }: { data: Record<string, any>; onChange: (v: any) => void; depth?: number }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const keys = Object.keys(data);

  const updateKey = (key: string, val: any) => {
    onChange({ ...data, [key]: val });
  };

  const removeKey = (key: string) => {
    const next = { ...data };
    delete next[key];
    onChange(next);
  };

  const addKey = () => {
    const newKey = `new_field_${keys.length + 1}`;
    onChange({ ...data, [newKey]: '' });
  };

  return (
    <div className={`space-y-1 ${depth > 0 ? 'pl-3 border-l-2 border-gray-100' : ''}`}>
      {keys.map(key => {
        const val = data[key];
        const isComplex = typeof val === 'object' && val !== null;
        const isArray = Array.isArray(val);
        const isStringArray = isArray && val.every((v: any) => typeof v === 'string');
        const isObjArray = isArray && val.length > 0 && typeof val[0] === 'object';
        const isObj = isComplex && !isArray;
        const isCollapsed = collapsed[key];

        // Collapsible section for complex values
        if (isObj || (isArray && !isStringArray)) {
          return (
            <div key={key} className="rounded-lg border border-gray-150 overflow-hidden">
              <button type="button" onClick={() => setCollapsed({ ...collapsed, [key]: !isCollapsed })}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-xs font-semibold text-gray-600">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {isArray && <span className="ml-1 font-normal text-gray-400">({val.length})</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeKey(key); }} title="Remove field"
                    className="text-gray-300 hover:text-red-500 p-0.5 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {isCollapsed ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronUp className="w-3 h-3 text-gray-400" />}
                </div>
              </button>
              {!isCollapsed && (
                <div className="px-2.5 py-2 bg-white">
                  {isObjArray ? (
                    <ObjectArrayEditor items={val} onChange={(v) => updateKey(key, v)} />
                  ) : isArray ? (
                    <StringArrayEditor items={val.map(String)} onChange={(v) => updateKey(key, v)} />
                  ) : (
                    <ObjectEditor data={val} onChange={(v) => updateKey(key, v)} depth={depth + 1} />
                  )}
                </div>
              )}
            </div>
          );
        }

        // Simple key-value row
        return (
          <div key={key} className="flex items-center gap-2 px-1">
            <label className="text-xs text-gray-500 font-medium min-w-[100px] truncate" title={key}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </label>
            <div className="flex-1">
              {isStringArray ? (
                <StringArrayEditor items={val} onChange={(v) => updateKey(key, v)} />
              ) : (
                <ValueEditor value={val} onChange={(v) => updateKey(key, v)} />
              )}
            </div>
            <button type="button" onClick={() => removeKey(key)} title="Remove field"
              className="text-gray-200 hover:text-red-500 p-0.5 rounded hover:bg-red-50 flex-shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={addKey}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-1 mt-1">
        <Plus className="w-3 h-3" /> Add Field
      </button>
    </div>
  );
}

export default function StructuredJsonEditor({ value, onChange, label, placeholder, fieldType }: StructuredJsonEditorProps) {
  const [showRaw, setShowRaw] = useState(false);

  // Parse value into a usable format
  const parsed = (() => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return null; }
    }
    if (typeof value === 'object') return value;
    return null;
  })();

  const isArray = Array.isArray(parsed);
  const isStringArray = isArray && parsed.every((v: any) => typeof v === 'string');
  const isObjArray = isArray && parsed.length > 0 && typeof parsed[0] === 'object';
  const isObj = parsed !== null && typeof parsed === 'object' && !isArray;
  const isEmpty = parsed === null || (isObj && Object.keys(parsed).length === 0) || (isArray && parsed.length === 0);

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
          <button type="button" onClick={() => setShowRaw(!showRaw)}
            className="text-[9px] text-gray-400 hover:text-gray-600 font-medium px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100">
            {showRaw ? 'Visual' : 'Raw'}
          </button>
        </div>
      )}

      {showRaw ? (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { onChange(e.target.value); } }}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 font-mono bg-gray-50 min-h-[120px] resize-y"
          placeholder={placeholder}
        />
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {isEmpty ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-gray-400 mb-2">{placeholder || 'No data yet'}</p>
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => onChange({})}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium">
                  Add Object
                </button>
                <button type="button" onClick={() => onChange([])}
                  className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 font-medium">
                  Add List
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5">
              {isStringArray && (
                <StringArrayEditor items={parsed} onChange={onChange} placeholder={placeholder} />
              )}
              {isObjArray && (
                <ObjectArrayEditor items={parsed} onChange={onChange} />
              )}
              {isObj && (
                <ObjectEditor data={parsed} onChange={onChange} />
              )}
              {isArray && !isStringArray && !isObjArray && parsed.length > 0 && (
                <StringArrayEditor items={parsed.map(String)} onChange={onChange} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
