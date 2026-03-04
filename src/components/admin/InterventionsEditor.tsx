import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface InterventionItem {
  name: string;
  type: string;
  description?: string;
}

const TYPE_OPTIONS = [
  'binder', 'chelator', 'anti-parasitic herb', 'probiotic', 'prebiotic',
  'antioxidant', 'supplement', 'dietary change', 'lifestyle', 'medication',
  'detox protocol', 'food', 'herb', 'mineral', 'vitamin', 'enzyme', 'other',
];

interface InterventionsEditorProps {
  value: any;
  onChange: (val: InterventionItem[]) => void;
  label?: string;
  placeholder?: string;
}

export default function InterventionsEditor({ value, onChange, label, placeholder }: InterventionsEditorProps) {
  const [newName, setNewName] = useState('');

  const items: InterventionItem[] = (() => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  })();

  const addItem = () => {
    if (!newName.trim()) return;
    onChange([...items, { name: newName.trim(), type: 'supplement', description: '' }]);
    setNewName('');
  };

  const updateItem = (idx: number, field: keyof InterventionItem, val: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {items.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-gray-400 italic">{placeholder || 'No items yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-blue-50/30 transition-colors group">
                <GripVertical className="w-3 h-3 text-gray-300 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      className="flex-1 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:ring-0 text-xs px-0 py-0.5 font-medium text-gray-800"
                      placeholder="Item name"
                    />
                    <select
                      title="Item type"
                      value={item.type}
                      onChange={(e) => updateItem(idx, 'type', e.target.value)}
                      className="text-[10px] border border-gray-200 rounded-md px-1.5 py-0.5 bg-gray-50 text-gray-600 cursor-pointer"
                    >
                      {TYPE_OPTIONS.map(t => (
                        <option key={t} value={t}>{t.replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={item.description || ''}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-300 focus:ring-0 text-[11px] px-0 py-0.5 text-gray-500"
                    placeholder="Brief description (optional)"
                  />
                </div>
                <button type="button" onClick={() => removeItem(idx)} title="Remove item"
                  className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 mt-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new item */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50/50">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
            className="flex-1 text-xs bg-transparent border-0 outline-none placeholder-gray-400 text-gray-700 px-0"
            placeholder="Add item name..."
          />
          <button type="button" onClick={addItem} disabled={!newName.trim()}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-30 disabled:cursor-not-allowed px-2 py-0.5 rounded-md hover:bg-blue-50">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
