import React, { useState, useMemo } from 'react';
import { Copy, Check, Wand2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  getTemplatesForTab,
  generatePrompt,
  type PromptType,
  type PromptTemplate,
} from '../../utils/midjourneyPrompts';

interface MidjourneyPromptGeneratorProps {
  record: Record<string, any>;
  activeTab: string;
}

export function MidjourneyPromptGenerator({ record, activeTab }: MidjourneyPromptGeneratorProps) {
  const templates = useMemo(() => getTemplatesForTab(activeTab), [activeTab]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptType | null>(
    templates.length > 0 ? templates[0].id : null,
  );
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customVisual, setCustomVisual] = useState('');
  const [customColor, setCustomColor] = useState('');

  if (templates.length === 0) return null;

  const result = selectedTemplate
    ? generatePrompt(selectedTemplate, record, activeTab, {
        visualDetails: customVisual || undefined,
        color: customColor || undefined,
      })
    : null;

  const handleCopy = async () => {
    if (!result?.prompt) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result.prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border border-purple-200 rounded-xl bg-gradient-to-br from-purple-50/50 to-indigo-50/50 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">Midjourney Prompt</span>
          <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-purple-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Template selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider">
              Template
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t: PromptTemplate) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    selectedTemplate === t.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                  title={t.description}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional overrides */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400 uppercase">Visual details override</Label>
              <textarea
                value={customVisual}
                onChange={(e) => setCustomVisual(e.target.value)}
                placeholder="Auto-generated from record data..."
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg resize-none h-16 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400 uppercase">Color override</Label>
              <input
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="Auto (e.g. white, golden...)"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Generated prompt */}
          {result && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider">
                  Generated Prompt
                </Label>
                <span className="text-[10px] text-gray-400">{result.prompt.length} chars</span>
              </div>
              <div className="relative">
                <div className="bg-white border border-purple-200 rounded-lg p-3 text-xs text-gray-700 leading-relaxed max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                  {result.prompt}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 gap-1 text-xs ${
                    copied
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Workflow tip */}
          <div className="bg-purple-50 rounded-lg p-2.5 text-[10px] text-purple-600 leading-relaxed">
            <span className="font-semibold">Workflow:</span> Copy prompt → Paste into Midjourney /imagine → Download result → Drag onto list card thumbnail to upload
          </div>
        </div>
      )}
    </div>
  );
}
