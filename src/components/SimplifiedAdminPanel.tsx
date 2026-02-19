import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
// Dialog imports removed — all modals now use AdminModal for consistency
import { toast } from 'sonner';
import { 
  Search, 
  Edit, 
  Trash2, 
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Leaf,
  UtensilsCrossed,
  CheckSquare,
  Eye,
  RefreshCw,
  FlaskConical,
  Package,
  Clock,
  ScanLine,
  Wand2,
  Loader2,
  Sparkles,
  ImageIcon,
  Film,
  Plus,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { FloatingDebugMenu } from './FloatingDebugMenu';
import { adminFieldConfig, getFieldsForView, type FieldConfig } from '../config/adminFieldConfig';
import { RISK_CATEGORIES, HAZARD_LEVELS, HAZARD_LEVEL_COLORS, CATEGORY_HEADER_COLORS } from '../config/riskCategories';
import { NUTRIENT_CATEGORIES, SERVING_PRESETS } from '../config/nutrientCategories';
import { WaitlistFunnelDashboard } from './admin/WaitlistFunnelDashboard';
import { CatalogMetricCards } from './admin/CatalogMetricCards';
import { ScanFunnelDashboard } from './admin/ScanFunnelDashboard';
import { WaitlistDetailTray } from './admin/WaitlistDetailTray';
import { CatalogDetailTray } from './admin/CatalogDetailTray';
import { AdminModal } from './ui/AdminModal';
import { AdminDebugPanel } from './admin/AdminDebugPanel';

interface AdminRecord {
  id: string;
  name?: string;
  name_common?: string;
  email?: string;
  title?: string;
  category?: string;
  description?: string;
  image_url?: string;
  avatar_url?: string;
  created_at?: string;
  emailsSent?: number;
  email_sent?: boolean;
  referrals?: number;
  referralCode?: string;
  position?: number;
  confirmed?: boolean;
  lastEmailSent?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  referredBy?: string;
  [key: string]: any;
}

interface SimplifiedAdminPanelProps {
  accessToken: string;
  user: any;
}

// Country code to flag emoji
const countryToFlag = (code: string): string => {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
};

// IP geolocation cache (persists across re-renders)
const ipGeoCache: Record<string, { city?: string; country?: string; countryCode?: string; flag?: string }> = {};

// Upload a file via edge function (uses service role — bypasses RLS)
async function uploadFileToStorage(
  file: File,
  bucket: string,
  accessToken: string
): Promise<string> {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/storage/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  console.log(`[Admin] Uploading ${file.name} (${(file.size / 1024).toFixed(0)}KB) to ${bucket}...`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  console.log(`[Admin] Upload success: ${data.publicUrl}`);
  return data.publicUrl;
}

type ContentLink = {
  id: string; url: string; title: string; description: string;
  image: string; siteName: string; isPdf: boolean; votes: number; addedAt: string;
  contentType?: 'paper' | 'book' | 'social' | 'article';
  abstract?: string;
  aiSummary?: string;
};

const CONTENT_TYPE_ICONS: Record<string, string> = { paper: '🔬', book: '📚', social: '💬', article: '📰' };
const CONTENT_TYPE_LABELS: Record<string, string> = { paper: 'Paper', book: 'Book', social: 'Social', article: 'Article' };

function screenshotUrl(url: string) {
  return `https://image.thum.io/get/width/600/crop/400/${url}`;
}

function ContentLinksField({ fieldKey, val, updateField, accessToken, projectId, recordContext }: {
  fieldKey: string;
  val: any;
  updateField: (v: any) => void;
  accessToken: string;
  projectId: string;
  recordContext?: Record<string, any>;
}) {
  const isPapers = fieldKey === 'scientific_papers';
  const isBooks = fieldKey === 'books';
  const links: ContentLink[] = Array.isArray(val) ? val : [];

  const [clUrl, setClUrl] = useState('');
  const [clLoading, setClLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkContext, setBulkContext] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [screenshottingId, setScreenshottingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageEditId, setImageEditId] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<ContentLink | null>(null);
  const [summarising, setSummarising] = useState(false);

  const defaultType: ContentLink['contentType'] = isPapers ? 'paper' : isBooks ? 'book' : 'social';

  const autoContext = React.useMemo(() => {
    if (!recordContext) return '';
    const parts: string[] = [];
    const name = recordContext.name || recordContext.name_common;
    if (name) parts.push(`Record: ${name}`);
    if (recordContext.category) parts.push(`Category: ${recordContext.category}`);
    if (recordContext.description) parts.push(`Description: ${String(recordContext.description).slice(0, 300)}`);
    if (recordContext.health_role) parts.push(`Health role: ${recordContext.health_role}`);
    if (recordContext.health_benefits) {
      const hb = Array.isArray(recordContext.health_benefits) ? recordContext.health_benefits.join(', ') : String(recordContext.health_benefits).slice(0, 200);
      parts.push(`Health benefits: ${hb}`);
    }
    if (recordContext.functions) {
      const fn = Array.isArray(recordContext.functions) ? recordContext.functions.join(', ') : String(recordContext.functions).slice(0, 200);
      parts.push(`Functions: ${fn}`);
    }
    return parts.join('\n');
  }, [recordContext]);

  const fetchMeta = async () => {
    const target = clUrl.trim();
    if (!target) return;
    setClLoading(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/url-metadata`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: target }) }
      );
      const data = await res.json();
      const image = data.image || screenshotUrl(target);
      const newLink: ContentLink = {
        id: crypto.randomUUID(),
        url: target,
        title: data.title || target,
        description: data.description || '',
        image,
        siteName: data.siteName || '',
        isPdf: data.isPdf || target.toLowerCase().endsWith('.pdf'),
        contentType: defaultType,
        votes: 0,
        addedAt: new Date().toISOString(),
      };
      updateField([...links, newLink]);
      setClUrl('');
    } catch {
      toast.error('Failed to fetch URL metadata');
    } finally {
      setClLoading(false);
    }
  };

  const fetchScreenshot = (id: string, url: string) => {
    setScreenshottingId(id);
    const img = screenshotUrl(url);
    updateImage(id, img);
    setTimeout(() => setScreenshottingId(null), 1500);
  };

  const handleBulkParse = async () => {
    if (!bulkText.trim()) return;
    setBulkLoading(true);
    try {
      const combinedContext = [autoContext, bulkContext.trim()].filter(Boolean).join('\n');
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/parse-content-links`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: bulkText.trim(), context: combinedContext }) }
      );
      const data = await res.json();
      if (data.success && data.links?.length) {
        const enriched = data.links.map((l: ContentLink) => ({ ...l, image: l.image || screenshotUrl(l.url) }));
        updateField([...links, ...enriched]);
        toast.success(`Added ${enriched.length} items`);
        setBulkText(''); setBulkContext(''); setShowBulkModal(false);
      } else {
        toast.error(data.error || 'No items found in text');
      }
    } catch {
      toast.error('Failed to parse content');
    } finally {
      setBulkLoading(false);
    }
  };

  const vote = (id: string, delta: number) => {
    updateField(links.map((l: ContentLink) => l.id === id ? { ...l, votes: (l.votes || 0) + delta } : l));
  };
  const remove = (id: string) => updateField(links.filter((l: ContentLink) => l.id !== id));
  const updateImage = (id: string, image: string) => {
    updateField(links.map((l: ContentLink) => l.id === id ? { ...l, image } : l));
  };
  const updateLinkField = (id: string, patch: Partial<ContentLink>) => {
    updateField(links.map((l: ContentLink) => l.id === id ? { ...l, ...patch } : l));
    setSelectedLink(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  const handleAiSummarise = async () => {
    if (!selectedLink) return;
    setSummarising(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/summarise-content-link`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedLink.title,
            description: selectedLink.description,
            abstract: selectedLink.abstract || '',
            url: selectedLink.url,
            recordContext: autoContext,
          }) }
      );
      const data = await res.json();
      if (data.success && data.summary) {
        updateLinkField(selectedLink.id, { aiSummary: data.summary });
        toast.success('Summary generated');
      } else {
        toast.error(data.error || 'Failed to summarise');
      }
    } catch {
      toast.error('Failed to summarise');
    } finally {
      setSummarising(false);
    }
  };

  const updateType = (id: string, contentType: ContentLink['contentType']) => {
    updateField(links.map((l: ContentLink) => l.id === id ? { ...l, contentType } : l));
  };

  const handleImageDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (url?.startsWith('http')) { updateImage(id, url); return; }
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => updateImage(id, ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageFileInput = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = ev => updateImage(id, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sorted = [...links].sort((a: ContentLink, b: ContentLink) => (b.votes || 0) - (a.votes || 0));
  const label = isPapers ? '📄 Scientific Papers' : isBooks ? '📚 Books' : '💬 Social Content';
  const placeholder = isPapers ? 'Paste paper URL, DOI, PubMed link...' : isBooks ? 'Paste book URL, ISBN link...' : 'Paste Reddit, Twitter, article URL...';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</Label>
        <button type="button" onClick={() => { setBulkContext(''); setShowBulkModal(true); }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Wand2 className="w-3 h-3" /> AI Add from text
        </button>
      </div>

      {/* Content Link Detail MODAL */}
      {selectedLink && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CONTENT_TYPE_ICONS[selectedLink.contentType || 'paper']}</span>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{CONTENT_TYPE_LABELS[selectedLink.contentType || 'paper']}</p>
                  {selectedLink.siteName && <p className="text-[9px] text-gray-300">{selectedLink.siteName}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedLink(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Image */}
              {selectedLink.image && (
                <div className="w-full rounded-xl overflow-hidden border border-gray-100 bg-gray-50" style={{maxHeight: '220px'}}>
                  <img src={selectedLink.image} alt="" className="w-full h-full object-cover" style={{maxHeight: '220px'}}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Title</label>
                <input
                  value={selectedLink.title || ''}
                  onChange={e => updateLinkField(selectedLink.id, { title: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              {/* URL */}
              <div className="flex items-center gap-2">
                <a href={selectedLink.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:text-blue-700 truncate flex-1 underline underline-offset-2">
                  {selectedLink.url}
                </a>
                {selectedLink.isPdf && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-50 text-red-500 border border-red-100">PDF</span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description / Metadata</label>
                <textarea
                  value={selectedLink.description || ''}
                  onChange={e => updateLinkField(selectedLink.id, { description: e.target.value })}
                  placeholder="Short description from the page metadata..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-200 outline-none resize-none h-16"
                />
              </div>

              {/* Abstract */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Abstract / Full Text</label>
                <textarea
                  value={selectedLink.abstract || ''}
                  onChange={e => updateLinkField(selectedLink.id, { abstract: e.target.value })}
                  placeholder="Paste the abstract or key excerpts from the paper/book here — the AI will use this to generate a better summary..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-200 outline-none resize-none h-32"
                />
              </div>

              {/* AI Summary section */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">🧠 Plain Language Summary</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">AI explains what this paper/book means in everyday language</p>
                  </div>
                  <button type="button" onClick={handleAiSummarise} disabled={summarising}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0">
                    {summarising ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    {summarising ? 'Summarising...' : 'AI Summarise'}
                  </button>
                </div>
                {selectedLink.aiSummary ? (
                  <div className="space-y-1">
                    <textarea
                      value={selectedLink.aiSummary}
                      onChange={e => updateLinkField(selectedLink.id, { aiSummary: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-200 outline-none resize-none h-24 text-gray-700 leading-relaxed"
                    />
                    <p className="text-[9px] text-emerald-400">You can edit this summary before saving</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-400 italic">Click "AI Summarise" to generate a plain-language explanation of this content</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-gray-100 shrink-0">
              <button type="button" onClick={() => setSelectedLink(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk AI parse MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">🪄 AI Add from Text</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Paste any list of papers, books, or URLs — AI extracts and adds them all with screenshots</p>
              </div>
              <button type="button" onClick={() => setShowBulkModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {autoContext && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <p className="text-[10px] font-semibold text-blue-600 mb-1">📋 Record context (auto-included)</p>
                  <pre className="text-[10px] text-blue-700 whitespace-pre-wrap font-mono leading-relaxed">{autoContext}</pre>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Extra context (optional)</label>
                <textarea
                  value={bulkContext}
                  onChange={e => setBulkContext(e.target.value)}
                  placeholder="e.g. 'These are papers about hydrogen peroxide and immune function in the context of this element'"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-300 outline-none resize-none h-14"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">References / URLs to parse</label>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder="Paste your list of references, numbered citations, URLs, or any mix here..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-300 outline-none resize-none h-52"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
              <button type="button" onClick={handleBulkParse} disabled={bulkLoading || !bulkText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {bulkLoading ? 'Parsing & adding...' : 'Parse & Add All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single URL input */}
      <div className="flex gap-2">
        <input
          value={clUrl}
          onChange={e => setClUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); fetchMeta(); } }}
          placeholder={placeholder}
          className="flex-1 h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-300 focus:border-blue-300 outline-none"
        />
        <button type="button" onClick={fetchMeta} disabled={clLoading || !clUrl.trim()}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0">
          {clLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          {clLoading ? 'Fetching...' : 'Add'}
        </button>
      </div>

      {/* Hidden file input for image replace */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (imageEditId && e.target.files?.[0]) { handleImageFileInput(imageEditId, e.target.files[0]); setImageEditId(null); e.target.value = ''; } }} />

      {/* Link cards */}
      {sorted.length === 0 ? (
        <p className="text-xs text-gray-300 italic">No {isPapers ? 'papers' : isBooks ? 'books' : 'content'} added yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((link: ContentLink) => {
            const typeIcon = CONTENT_TYPE_ICONS[link.contentType || defaultType] || '🔗';
            const isDragOver = dragOverId === link.id;
            const isScreenshotting = screenshottingId === link.id;
            return (
              <div key={link.id} className="flex gap-2 p-2.5 border border-gray-100 rounded-xl bg-white hover:border-gray-200 transition-colors group">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                  <button type="button" onClick={() => vote(link.id, 1)}
                    className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors text-xs">▲</button>
                  <span className={`text-[11px] font-bold tabular-nums ${(link.votes || 0) > 0 ? 'text-orange-500' : (link.votes || 0) < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                    {link.votes || 0}
                  </span>
                  <button type="button" onClick={() => vote(link.id, -1)}
                    className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-xs">▼</button>
                </div>

                {/* Thumbnail col: image + screenshot button */}
                <div className="flex flex-col gap-1 shrink-0">
                  <div
                    className={`relative w-16 h-14 rounded-lg overflow-hidden border cursor-pointer transition-all ${isDragOver ? 'border-blue-400 ring-2 ring-blue-300 scale-105' : 'border-gray-100 hover:border-blue-300'}`}
                    onDragOver={e => { e.preventDefault(); setDragOverId(link.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={e => handleImageDrop(link.id, e)}
                    onClick={() => { setImageEditId(link.id); imageInputRef.current?.click(); }}
                    title="Click or drag image to replace"
                  >
                    {link.image ? (
                      <img src={link.image} alt="" className="w-full h-full object-cover bg-gray-100"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                        <span className="text-xl">{link.isPdf ? '📄' : typeIcon}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-[9px] font-semibold bg-black/50 px-1 py-0.5 rounded">Replace</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => fetchScreenshot(link.id, link.url)} disabled={isScreenshotting}
                    title="Fetch screenshot of this URL"
                    className="flex items-center justify-center gap-0.5 w-16 h-5 rounded text-[9px] font-medium bg-gray-50 border border-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 disabled:opacity-50 transition-colors">
                    {isScreenshotting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : '📸'}
                    {isScreenshotting ? '' : 'Screenshot'}
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1 cursor-pointer" onClick={() => setSelectedLink(link)} title="Click to view details & AI summary">
                  <div className="flex items-start gap-1.5">
                    <span className="text-xs font-semibold text-gray-800 hover:text-blue-600 leading-snug line-clamp-2 flex-1">
                      {link.title || link.url}
                    </span>
                    {link.isPdf && (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" download
                        className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors">
                        ⬇ PDF
                      </a>
                    )}
                  </div>
                  {link.description && (
                    <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{link.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      title="Content type"
                      value={link.contentType || defaultType}
                      onChange={e => updateType(link.id, e.target.value as ContentLink['contentType'])}
                      className="text-[9px] border border-gray-100 rounded px-1 py-0.5 bg-gray-50 text-gray-500 cursor-pointer"
                    >
                      {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{CONTENT_TYPE_ICONS[k]} {v}</option>
                      ))}
                    </select>
                    {link.siteName && <span className="text-[9px] text-gray-300 font-medium uppercase tracking-wide">{link.siteName}</span>}
                    <span className="text-[9px] text-gray-300">{new Date(link.addedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Remove */}
                <button type="button" onClick={() => remove(link.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all text-xs mt-0.5">
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SimplifiedAdminPanel({ accessToken, user }: SimplifiedAdminPanelProps) {
  const [activeTab, setActiveTab] = useState('waitlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subFilter, setSubFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<AdminRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<'update' | 'delete' | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null);

  // Sync state
  const [syncDiff, setSyncDiff] = useState<Record<string, any> | null>(null);
  const [syncDiffLoading, setSyncDiffLoading] = useState(false);
  const [syncPushing, setSyncPushing] = useState(false);
  const [syncPulling, setSyncPulling] = useState(false);
  const [syncResults, setSyncResults] = useState<Record<string, any> | null>(null);
  const [syncSelectedTables, setSyncSelectedTables] = useState<string[]>(['catalog_elements', 'catalog_ingredients', 'catalog_recipes']);
  const [syncConfirm, setSyncConfirm] = useState<'push' | 'pull' | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ipGeoData, setIpGeoData] = useState<Record<string, { city?: string; country?: string; countryCode?: string; flag?: string }>>({});
  const [showSearch, setShowSearch] = useState(false);
  const recordsCache = useRef<Record<string, AdminRecord[]>>({});
  const [crossTabResults, setCrossTabResults] = useState<{ tabId: string; tabLabel: string; record: AdminRecord }[]>([]);
  const [elementsCache, setElementsCache] = useState<AdminRecord[]>([]);
  const [elementSearchQuery, setElementSearchQuery] = useState('');
  const [ingredientsCache, setIngredientsCache] = useState<AdminRecord[]>([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [aiFillingFields, setAiFillingFields] = useState(false);
  const [aiFillingSection, setAiFillingSection] = useState<string | null>(null);
  const [aiCreating, setAiCreating] = useState(false);
  const [showAiCreatePrompt, setShowAiCreatePrompt] = useState(false);
  const [aiCreatePrompt, setAiCreatePrompt] = useState('');
  const [hazardSearch, setHazardSearch] = useState('');
  const [nutrientSearch, setNutrientSearch] = useState('');
  const [editModalTab, setEditModalTab] = useState<'culinary' | 'health' | 'content'>('culinary');
  const [aiContext, setAiContext] = useState('');

  // Reset modal tab when switching catalog types — elements has no Culinary tab
  useEffect(() => {
    if (activeTab === 'elements' && editModalTab === 'culinary') {
      setEditModalTab('health');
    }
  }, [activeTab, editModalTab]);

  // localStorage-backed collapse state for ALL sections/categories
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('admin_collapsed_sections') || '{}'); } catch { return {}; }
  });
  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('admin_collapsed_sections', JSON.stringify(next));
      return next;
    });
  };
  const isSectionOpen = (key: string) => !collapsedSections[key];

  // Batch IP geolocation lookup
  useEffect(() => {
    if (activeTab !== 'waitlist') return;
    const ips = records
      .map(r => r.ipAddress?.split(',')[0]?.trim())
      .filter((ip): ip is string => !!ip && !ipGeoCache[ip]);
    const uniqueIps = [...new Set(ips)].slice(0, 50); // ip-api batch limit
    if (uniqueIps.length === 0) {
      // Still sync cache to state
      const cached: Record<string, any> = {};
      records.forEach(r => {
        const ip = r.ipAddress?.split(',')[0]?.trim();
        if (ip && ipGeoCache[ip]) cached[ip] = ipGeoCache[ip];
      });
      if (Object.keys(cached).length > 0) setIpGeoData(prev => ({ ...prev, ...cached }));
      return;
    }
    fetch('http://ip-api.com/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uniqueIps.map(ip => ({ query: ip, fields: 'query,city,country,countryCode,status' })))
    })
      .then(res => res.json())
      .then((results: any[]) => {
        const newGeo: Record<string, any> = {};
        results.forEach((r: any) => {
          if (r.status === 'success') {
            const geo = { city: r.city, country: r.country, countryCode: r.countryCode, flag: countryToFlag(r.countryCode) };
            ipGeoCache[r.query] = geo;
            newGeo[r.query] = geo;
          }
        });
        setIpGeoData(prev => ({ ...prev, ...newGeo }));
      })
      .catch(() => {});
  }, [records, activeTab]);

  // Fetch elements for linked_elements picker when editing ingredients
  useEffect(() => {
    if (!showEditModal || activeTab !== 'ingredients' || elementsCache.length > 0) return;
    const fetchElements = async () => {
      try {
        const url = `https://${projectId}.supabase.co/rest/v1/catalog_elements?select=id,name_common,category,type_label,health_role&limit=500`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': publicAnonKey },
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`[Admin] Loaded ${data.length} elements for linking`);
          setElementsCache(data);
        }
      } catch (err) {
        console.error('[Admin] Failed to fetch elements for linking:', err);
      }
    };
    fetchElements();
  }, [showEditModal, activeTab, accessToken, elementsCache.length]);

  // Fetch ingredients for linked_ingredients picker when editing recipes, ingredients, or products
  useEffect(() => {
    if (!showEditModal || !accessToken || typeof accessToken !== 'string' || accessToken.length < 10 || ingredientsCache.length > 0) return;
    if (activeTab !== 'recipes' && activeTab !== 'ingredients' && activeTab !== 'products') return;
    const fetchIngredients = async () => {
      try {
        const url = `https://${projectId}.supabase.co/rest/v1/catalog_ingredients?select=id,name_common,category,processing_type,image_url&limit=1000`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': publicAnonKey },
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`[Admin] Loaded ${data.length} ingredients for linking`);
          setIngredientsCache(data);
        } else {
          console.error('[Admin] Failed to fetch ingredients:', res.status, res.statusText);
        }
      } catch (err) {
        console.error('[Admin] Failed to fetch ingredients for linking:', err);
      }
    };
    fetchIngredients();
  }, [showEditModal, activeTab, accessToken, ingredientsCache.length]);

  const tabs = [
    { id: 'waitlist', label: 'Waitlist', icon: <Clock className="w-4 h-4" />, table: 'waitlist' },
    { id: 'elements', label: 'Elements', icon: <FlaskConical className="w-4 h-4" />, table: 'catalog_elements' },
    { id: 'ingredients', label: 'Ingredients', icon: <Leaf className="w-4 h-4" />, table: 'catalog_ingredients' },
    { id: 'recipes', label: 'Recipes', icon: <UtensilsCrossed className="w-4 h-4" />, table: 'catalog_recipes' },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, table: 'catalog_products' },
    { id: 'scans', label: 'Scans', icon: <ScanLine className="w-4 h-4" />, table: 'scans' },
    { id: 'sync', label: 'Sync', icon: <span className="text-xs">⇄</span>, table: '' },
  ];

  const subFilters: Record<string, { label: string; value: string; color: string }[]> = {
    elements: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Beneficial', value: 'beneficial', color: 'green' },
      { label: 'Hazardous', value: 'hazardous', color: 'red' },
      { label: 'Both', value: 'both', color: 'amber' },
    ],
    ingredients: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Raw', value: 'raw', color: 'green' },
      { label: 'Processed', value: 'processed', color: 'orange' },
    ],
    recipes: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Meal', value: 'meal', color: 'green' },
      { label: 'Beverage', value: 'beverage', color: 'cyan' },
      { label: 'Condiment', value: 'condiment', color: 'amber' },
    ],
    products: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Meal', value: 'meal', color: 'green' },
      { label: 'Snack', value: 'snack', color: 'lime' },
      { label: 'Beverage', value: 'beverage', color: 'cyan' },
      { label: 'Condiment', value: 'condiment', color: 'amber' },
      { label: 'Supplement', value: 'supplement', color: 'purple' },
    ],
    scans: [
      { label: 'All', value: 'all', color: 'blue' },
      { label: 'Completed', value: 'completed', color: 'green' },
      { label: 'Processing', value: 'processing', color: 'amber' },
      { label: 'Failed', value: 'failed', color: 'red' },
    ],
  };

  // Color map for category badges
  const categoryColorMap: Record<string, string> = {
    beneficial: 'bg-green-100 text-green-800',
    hazardous: 'bg-red-100 text-red-800',
    meal: 'bg-green-100 text-green-800',
    beverage: 'bg-cyan-100 text-cyan-800',
    condiment: 'bg-amber-100 text-amber-800',
    snack: 'bg-lime-100 text-lime-800',
    supplement: 'bg-purple-100 text-purple-800',
    vegetable: 'bg-green-100 text-green-800',
    fruit: 'bg-orange-100 text-orange-800',
    grain: 'bg-yellow-100 text-yellow-800',
    protein: 'bg-red-100 text-red-800',
    dairy: 'bg-blue-100 text-blue-800',
    raw: 'bg-emerald-100 text-emerald-800',
    processed: 'bg-orange-100 text-orange-800',
  };

  const currentTab = tabs.find(t => t.id === activeTab);

  // Fetch records for current tab (with abort support)
  const fetchRecordsRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!currentTab) return;
    const controller = new AbortController();
    const { signal } = controller;

    const doFetch = async (retry = false) => {
      try {
        setLoading(true);
        console.log(`[Admin] Fetching ${currentTab.label} from ${currentTab.table}...`);

        let url: string;

        // Use custom endpoint for KV-stored data (waitlist, products)
        if (activeTab === 'waitlist' || activeTab === 'products') {
          const kvEndpoint = activeTab === 'waitlist' ? 'admin/waitlist' : 'admin/products';
          url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/${kvEndpoint}`;
          console.log(`[Admin] Fetching ${currentTab.label} from KV store: ${url}`);

          const response = await fetch(url, {
            signal,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (signal.aborted) return;
          if (response.ok) {
            const data = await response.json();
            if (signal.aborted) return;
            console.log(`[Admin] Loaded ${data?.length || 0} ${currentTab.label} from KV store`);
            setRecords(Array.isArray(data) ? data : []);
          } else {
            const errorText = await response.text();
            console.warn(`[Admin] Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
            console.warn(`[Admin] Error response:`, errorText);
            if (!signal.aborted) setRecords([]);
          }
          if (!signal.aborted) setLoading(false);
          return;
        }

        url = `https://${projectId}.supabase.co/rest/v1/${currentTab.table}?limit=1000`;

        // Add ordering
        if (activeTab === 'elements') {
          url += '&order=category.asc,name_common.asc';
        } else {
          url += '&order=created_at.desc';
        }

        console.log(`[Admin] Fetching URL: ${url}`);

        const response = await fetch(url, {
          signal,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': publicAnonKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        if (signal.aborted) return;
        console.log(`[Admin] Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          if (signal.aborted) return;
          console.log(`[Admin] Loaded ${data?.length || 0} ${currentTab.label}`);
          setRecords(Array.isArray(data) ? data : []);
        } else {
          const errorText = await response.text();
          console.warn(`[Admin] Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
          console.warn(`[Admin] Error:`, errorText);
          if (!signal.aborted) setRecords([]);
        }
      } catch (error: any) {
        if (signal.aborted) return;
        // Retry once on network failure (cold-start / transient error)
        if (!retry && error?.name !== 'AbortError') {
          console.warn(`[Admin] Network error fetching ${currentTab.label}, retrying...`, error);
          await new Promise((r) => setTimeout(r, 1500));
          if (!signal.aborted) return doFetch(true);
          return;
        }
        if (error?.name !== 'AbortError') {
          console.error(`[Admin] Error fetching ${currentTab.label}:`, error);
          setRecords([]);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    doFetch();
    fetchRecordsRef.current = () => { doFetch(); };

    return () => { controller.abort(); };
  }, [activeTab, accessToken]);

  const fetchRecords = () => fetchRecordsRef.current();

  // Cache records for cross-tab search whenever they change
  useEffect(() => {
    if (records.length > 0 && activeTab) {
      recordsCache.current[activeTab] = records;
    }
  }, [records, activeTab]);

  // Cross-tab search: search all cached tabs when query changes
  useEffect(() => {
    if (!showSearch || !searchQuery.trim()) {
      setCrossTabResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: { tabId: string; tabLabel: string; record: AdminRecord }[] = [];

    for (const tab of tabs) {
      if (tab.id === activeTab) continue; // skip current tab (already shown in main list)
      const cached = recordsCache.current[tab.id];
      if (!cached) continue;
      for (const record of cached) {
        if (results.length >= 4) break;
        const haystack = [
          record.name, record.name_common, record.email, record.title, record.category,
        ].filter(Boolean).join(' ').toLowerCase();
        if (haystack.includes(q)) {
          results.push({ tabId: tab.id, tabLabel: tab.label, record });
        }
      }
      if (results.length >= 4) break;
    }
    setCrossTabResults(results);
  }, [searchQuery, showSearch, activeTab]);

  const handleEdit = (record: AdminRecord) => {
    setEditingRecord({ ...record });
    setEditModalTab(activeTab === 'elements' ? 'health' : 'culinary');
    setShowEditModal(true);
  };

  const handleAddNew = () => {
    const tabConfig = adminFieldConfig[activeTab];
    if (!tabConfig) return;
    // Build a blank record with empty defaults for all editable fields
    const blank: AdminRecord = {} as AdminRecord;
    tabConfig.fields.filter(f => f.showInEdit).forEach(f => {
      if (f.type === 'boolean') (blank as any)[f.key] = false;
      else if (f.type === 'number') (blank as any)[f.key] = 0;
      else if (f.type === 'array' || f.type === 'multi_tags') (blank as any)[f.key] = [];
      else if (f.type === 'json' || f.type === 'nutrition_editor' || f.type === 'grouped_ingredients') (blank as any)[f.key] = {};
      else if (f.type === 'taste_profile') (blank as any)[f.key] = { taste: { sweet: 0, sour: 0, salty: 0, bitter: 0, umami: 0, spicy: 0 }, texture: { crispy: 0, crunchy: 0, chewy: 0, smooth: 0, creamy: 0, juicy: 0 } };
      else if (f.type === 'content_links') (blank as any)[f.key] = [];
      else (blank as any)[f.key] = '';
    });
    setEditingRecord(blank);
    setEditModalTab(activeTab === 'elements' ? 'health' : 'culinary');
    setShowEditModal(true);
  };

  const handleViewDetail = (record: AdminRecord) => {
    setDetailRecord(record);
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    if (!editingRecord || !currentTab) return;
    setSavingRecord(true);

    // New record (no id) — use insert endpoint
    const isNew = !editingRecord.id;
    if (isNew && activeTab !== 'waitlist') {
      try {
        const tabConfig = adminFieldConfig[activeTab];
        const editableKeys = new Set(
          tabConfig?.fields?.filter((f: any) => f.showInEdit).map((f: any) => f.key) || []
        );
        const cleanRecord: Record<string, any> = {};
        for (const key of editableKeys) {
          let v = (editingRecord as any)[key];
          if (v === '' || v === null || v === undefined) continue;
          if (typeof v === 'string' && v.startsWith('data:') && v.length > 5000) continue;
          // Strip sentinel kingdom value — only a real category should reach the DB
          if (key === 'category' && typeof v === 'string' && v.startsWith('__kingdom__')) continue;
          cleanRecord[key] = v;
        }
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/insert`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: currentTab.table, record: cleanRecord }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          toast.success(`${tabConfig?.label || 'Record'} created successfully`);
          setRecords(prev => [data.record, ...prev]);
          setShowEditModal(false);
        } else {
          toast.error(data.error || `Failed to create (${response.status})`);
        }
      } catch (error) {
        console.error('[Admin INSERT] Error:', error);
        toast.error(`Error creating: ${error}`);
      } finally {
        setSavingRecord(false);
      }
      return;
    }

    try {
      if (activeTab === 'waitlist' && editingRecord.email) {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/update`;
        const body = {
          email: editingRecord.email,
          updates: {
            name: editingRecord.name,
            referrals: editingRecord.referrals,
            position: editingRecord.position,
            confirmed: editingRecord.confirmed
          }
        };
        console.log('[Admin SAVE] Waitlist update:', url, body);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const responseText = await response.text();
        console.log('[Admin SAVE] Response:', response.status, responseText);
        if (response.ok) {
          toast.success('Waitlist user updated');
          setRecords(prev => prev.map(r => r.id === editingRecord.id || r.email === editingRecord.email ? { ...r, ...editingRecord } : r));
          setShowEditModal(false);
          setShowDetailModal(false);
        } else {
          try {
            const err = JSON.parse(responseText);
            toast.error(err.error || `Failed to update (${response.status})`);
          } catch {
            toast.error(`Failed to update: ${response.status} ${responseText.slice(0, 100)}`);
          }
        }
      } else {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`;
        // Only send fields that are configured as editable — sending unknown columns causes DB errors
        const tabConfig = adminFieldConfig[activeTab];
        const editableKeys = new Set(
          tabConfig?.fields?.filter((f: any) => f.showInEdit).map((f: any) => f.key) || []
        );
        const cleanedUpdates: Record<string, any> = {};
        for (const key of editableKeys) {
          if (key in editingRecord) {
            const v = editingRecord[key];
            // Strip base64 data URLs — they're too large for the API
            if (typeof v === 'string' && v.startsWith('data:') && v.length > 5000) {
              console.warn(`[Admin SAVE] Skipping base64 field "${key}" (${(v.length / 1024).toFixed(0)}KB)`);
              continue;
            }
            // Strip sentinel kingdom value — only a real category should reach the DB
            if (key === 'category' && typeof v === 'string' && v.startsWith('__kingdom__')) continue;
            cleanedUpdates[key] = v;
          }
        }
        console.log('[Admin SAVE] Editable fields being sent:', Object.keys(cleanedUpdates));
        const body = {
          table: currentTab.table,
          id: editingRecord.id,
          updates: cleanedUpdates
        };
        console.log('[Admin SAVE] Catalog update:', url, body);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const responseText = await response.text();
        console.log('[Admin SAVE] Response:', response.status, responseText);
        if (response.ok) {
          toast.success('Record updated successfully');
          setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...editingRecord } : r));
          setShowEditModal(false);
        } else {
          try {
            const err = JSON.parse(responseText);
            toast.error(err.error || `Failed to update (${response.status})`);
          } catch {
            toast.error(`Failed to update: ${response.status} ${responseText.slice(0, 100)}`);
          }
        }
      }
    } catch (error) {
      console.error('[Admin SAVE] Error:', error);
      toast.error(`Error saving: ${error}`);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleAiFill = async () => {
    if (!editingRecord || !activeTab || activeTab === 'waitlist') return;
    setAiFillingFields(true);
    try {
      const editFields = getFieldsForView(activeTab, 'edit');
      // Collect up to 2 sample records that have good data for format reference
      const sampleRecords = sortedRecords
        .filter(r => r.id !== editingRecord.id && (r.name || r.name_common))
        .slice(0, 2)
        .map(r => {
          const sample: Record<string, any> = {};
          editFields.forEach(f => { const v = (r as any)[f.key]; if (v !== null && v !== undefined && v !== '') sample[f.key] = v; });
          return sample;
        });

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabType: adminFieldConfig[activeTab]?.label || activeTab,
          recordData: editingRecord,
          fields: editFields.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder, linkedCategory: f.linkedCategory })),
          sampleRecords,
          context: aiContext.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.filledFields) {
        const filledCount = Object.keys(data.filledFields).length;
        if (filledCount === 0) {
          toast.info(data.message || 'All fields already have data');
        } else {
          setEditingRecord({ ...editingRecord, ...data.filledFields });
          toast.success(`AI filled ${filledCount} fields`);
        }
      } else {
        toast.error(data.error || 'AI fill failed');
      }
    } catch (err: any) {
      console.error('[AI Fill] Error:', err);
      toast.error(`AI fill error: ${err?.message || err}`);
    } finally {
      setAiFillingFields(false);
    }
  };

  const handleAiFillSection = async (sectionName: string) => {
    if (!editingRecord || !activeTab || activeTab === 'waitlist') return;
    setAiFillingSection(sectionName);
    try {
      const editFields = getFieldsForView(activeTab, 'edit');
      // Only include fields that belong to this section
      const sectionFields = editFields.filter(f => f.section === sectionName);
      if (sectionFields.length === 0) { toast.info(`No fields in section "${sectionName}"`); return; }

      const sampleRecords = sortedRecords
        .filter(r => r.id !== editingRecord.id && (r.name || r.name_common))
        .slice(0, 2)
        .map(r => {
          const sample: Record<string, any> = {};
          sectionFields.forEach(f => { const v = (r as any)[f.key]; if (v !== null && v !== undefined && v !== '') sample[f.key] = v; });
          return sample;
        });

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabType: adminFieldConfig[activeTab]?.label || activeTab,
          recordData: editingRecord,
          fields: sectionFields.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder, linkedCategory: f.linkedCategory })),
          sampleRecords,
          context: aiContext.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.filledFields) {
        const filledCount = Object.keys(data.filledFields).length;
        if (filledCount === 0) {
          toast.info(data.message || `All ${sectionName} fields already have data`);
        } else {
          setEditingRecord({ ...editingRecord, ...data.filledFields });
          toast.success(`AI filled ${filledCount} ${sectionName} fields`);
        }
      } else {
        toast.error(data.error || `AI fill ${sectionName} failed`);
      }
    } catch (err: any) {
      console.error(`[AI Fill ${sectionName}] Error:`, err);
      toast.error(`AI fill error: ${err?.message || err}`);
    } finally {
      setAiFillingSection(null);
    }
  };

  const handleAiCreate = async (prompt?: string) => {
    if (!currentTab || activeTab === 'waitlist' || activeTab === 'scans') return;
    setAiCreating(true);
    setShowAiCreatePrompt(false);
    try {
      const editFields = getFieldsForView(activeTab, 'edit');
      // Collect up to 2 sample records for format reference
      const sampleRecords = sortedRecords
        .filter(r => r.name || r.name_common)
        .slice(0, 2)
        .map(r => {
          const sample: Record<string, any> = {};
          editFields.forEach(f => { const v = (r as any)[f.key]; if (v !== null && v !== undefined && v !== '') sample[f.key] = v; });
          return sample;
        });

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-create-record`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentTab.table,
          tabType: adminFieldConfig[activeTab]?.label || activeTab,
          fields: editFields.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder })),
          sampleRecords,
          prompt: prompt || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.record) {
        toast.success(`AI created ${adminFieldConfig[activeTab]?.label || 'record'} with ${data.fieldsGenerated} fields`);
        // Add to records list and open for editing
        setRecords(prev => [data.record, ...prev]);
        setEditingRecord({ ...data.record });
        setShowEditModal(true);
      } else {
        toast.error(data.error || 'AI create failed');
      }
    } catch (err: any) {
      console.error('[AI Create] Error:', err);
      toast.error(`AI create error: ${err?.message || err}`);
    } finally {
      setAiCreating(false);
      setAiCreatePrompt('');
    }
  };

  const handleDelete = async (record: AdminRecord) => {
    if (!currentTab || !confirm(`Are you sure you want to delete ${record.email || record.name || record.name_common || 'this record'}?`)) return;

    try {
      setDeletingRecord(record.id);
      if (activeTab === 'waitlist' && record.email) {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/delete`;
        const body = { email: record.email };
        console.log('[Admin DELETE] Waitlist:', url, body);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const responseText = await response.text();
        console.log('[Admin DELETE] Response:', response.status, responseText);
        if (response.ok) {
          toast.success(`Deleted ${record.email}`);
          setRecords(prev => prev.filter(r => r.id !== record.id && r.email !== record.email));
          setShowDetailModal(false);
        } else {
          try {
            const err = JSON.parse(responseText);
            toast.error(err.error || `Delete failed (${response.status})`);
          } catch {
            toast.error(`Delete failed: ${response.status} ${responseText.slice(0, 100)}`);
          }
        }
      } else {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/delete`;
        const body = { table: currentTab.table, id: record.id };
        console.log('[Admin DELETE] Catalog:', url, body);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const responseText = await response.text();
        console.log('[Admin DELETE] Response:', response.status, responseText);
        if (response.ok) {
          toast.success('Record deleted successfully');
          setRecords(prev => prev.filter(r => r.id !== record.id));
          setShowDetailModal(false);
        } else {
          try {
            const err = JSON.parse(responseText);
            toast.error(err.error || `Delete failed (${response.status})`);
          } catch {
            toast.error(`Delete failed: ${response.status} ${responseText.slice(0, 100)}`);
          }
        }
      }
    } catch (error) {
      console.error('[Admin DELETE] Error:', error);
      toast.error(`Error deleting: ${error}`);
    } finally {
      setDeletingRecord(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;
    if (!confirm(`Delete ${selectedRecords.size} selected records? This cannot be undone.`)) return;

    try {
      if (activeTab === 'waitlist') {
        const emails = records.filter(r => selectedRecords.has(r.id)).map(r => r.email).filter(Boolean);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/bulk-delete`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emails })
          }
        );
        if (response.ok) {
          const result = await response.json();
          toast.success(`Deleted ${result.deleted} users`);
        } else {
          toast.error('Bulk delete failed');
        }
      } else if (currentTab) {
        let deleted = 0;
        for (const recordId of selectedRecords) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/delete`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ table: currentTab.table, id: recordId })
            }
          );
          if (response.ok) deleted++;
        }
        toast.success(`Deleted ${deleted} records`);
      }
      setRecords(prev => prev.filter(r => !selectedRecords.has(r.id)));
      setSelectedRecords(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Bulk delete failed');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRecords.size === 0 || !bulkEditField || !bulkEditValue) return;

    try {
      if (activeTab === 'waitlist') {
        const emails = records.filter(r => selectedRecords.has(r.id)).map(r => r.email).filter(Boolean);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist/bulk-update`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emails, updates: { [bulkEditField]: bulkEditValue } })
          }
        );
        if (response.ok) {
          const result = await response.json();
          toast.success(`Updated ${result.updated} users`);
        } else {
          toast.error('Bulk update failed');
        }
      } else if (currentTab) {
        let updated = 0;
        for (const recordId of selectedRecords) {
          const record = records.find(r => r.id === recordId);
          if (!record) continue;
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ table: currentTab.table, id: recordId, updates: { ...record, [bulkEditField]: bulkEditValue } })
            }
          );
          if (response.ok) updated++;
        }
        toast.success(`Updated ${updated} records`);
      }
      setRecords(prev => prev.map(r => selectedRecords.has(r.id) ? { ...r, [bulkEditField]: bulkEditValue } : r));
      setSelectedRecords(new Set());
      setBulkEditField('');
      setBulkEditValue('');
      setBulkMode(false);
      setBulkAction(null);
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Bulk update failed');
    }
  };

  const toggleSelectRecord = (id: string) => {
    setSelectedRecords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleResendEmail = async (recordId: string, email: string) => {
    setResendingEmail(recordId);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/resend-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email, recordId })
      });

      if (response.ok) {
        toast.success('Welcome email resent successfully');
        fetchRecords();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Error resending email');
    } finally {
      setResendingEmail(null);
    }
  };

  // For waitlist: filter out records without email (ghost/invalid entries)
  const validRecords = activeTab === 'waitlist'
    ? records.filter(r => r.email && r.email.trim() !== '')
    : records;

  const filteredRecords = validRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ? true : (
      (record.name?.toLowerCase().includes(searchLower)) ||
      (record.name_common?.toLowerCase().includes(searchLower)) ||
      (record.email?.toLowerCase().includes(searchLower)) ||
      (record.title?.toLowerCase().includes(searchLower)) ||
      (record.category?.toLowerCase().includes(searchLower)) ||
      false
    );
    
    // Filter by sub-category if a sub-filter is active
    if (subFilter !== 'all' && activeTab !== 'waitlist') {
      const category = record.category?.toLowerCase() || '';
      const type = record.type?.toLowerCase() || '';
      const filterVal = subFilter.toLowerCase();
      
      if (activeTab === 'elements') {
        // Elements: filter by category column (beneficial/hazardous/both)
        if (filterVal === 'both') {
          if (category !== 'both') return false;
        } else {
          if (category !== filterVal) return false;
        }
      } else if (activeTab === 'ingredients') {
        // Ingredients: use processing_type — raw/unprocessed = Raw, anything else = Processed
        const proc = (record.processing_type || '').toLowerCase();
        if (filterVal === 'raw') {
          if (proc !== 'raw' && proc !== 'unprocessed' && proc !== '') return false;
        } else if (filterVal === 'processed') {
          if (proc === 'raw' || proc === 'unprocessed' || proc === '') return false;
        }
      } else if (activeTab === 'recipes') {
        // Recipes: filter by category column
        if (category !== filterVal) return false;
      } else if (activeTab === 'products') {
        // Products: filter by category column
        if (category !== filterVal) return false;
      } else if (activeTab === 'scans') {
        // Scans: filter by status
        const status = record.status?.toLowerCase() || '';
        if (status !== filterVal) return false;
      }
    }
    
    // Filter by second-level category/type filter
    if (categoryFilter !== 'all') {
      if (activeTab === 'recipes') {
        // Recipes second-level: filter by type column (breakfast, lunch, etc.)
        const t = (record.type || '').toLowerCase();
        if (t !== categoryFilter.toLowerCase()) return false;
      } else {
        // Ingredients & others: filter by category column
        const cat = (record.category || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }
    }
    
    return matchesSearch;
  }).map((record, index) => ({ ...record, _displayIndex: index }));

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = (a as any)[sortField];
    let bVal = (b as any)[sortField];
    // Handle dates
    if (sortField === 'signupDate' || sortField === 'created_at' || sortField === 'scanned_at') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }
    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    // Handle strings
    const aStr = String(aVal || '').toLowerCase();
    const bStr = String(bVal || '').toLowerCase();
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(records.map(r => r.category).filter(Boolean)));
  
  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  const getDisplayName = (record: AdminRecord) => {
    return record.name_common || record.name || record.email || record.title || 'Unnamed';
  };

  const getImageUrl = (record: AdminRecord) => {
    // Try multiple possible image field names
    let imageUrl = record.image_url || record.avatar_url;
    
    // For recipes, also check for images array or image field
    if (!imageUrl && activeTab === 'recipes') {
      // Check if images is an array and get first image
      if (Array.isArray(record.images) && record.images.length > 0) {
        imageUrl = record.images[0];
      } else if (typeof record.images === 'string') {
        imageUrl = record.images;
      } else if (record.image) {
        imageUrl = record.image;
      }
    }
    
    return imageUrl || PLACEHOLDER_IMAGE;
  };

  // Highlight matching query text in green
  const highlight = (text: string, query: string): React.ReactNode => {
    if (!query.trim() || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-green-100 text-green-800 rounded px-0.5 not-italic font-semibold">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const renderRecordRow = (record: AdminRecord & { _displayIndex?: number }) => {
    const imageUrl = getImageUrl(record);
    const displayName = getDisplayName(record);
    const isSelected = selectedRecords.has(record.id);
    const isWaitlist = activeTab === 'waitlist';

    return (
      <div key={record.id} className={`flex gap-3 p-3 sm:p-4 mb-2 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
        {/* Checkbox for bulk mode */}
        {bulkMode && (
          <div className="flex items-center flex-shrink-0">
            <input
              type="checkbox"
              title="Select record"
              checked={isSelected}
              onChange={() => toggleSelectRecord(record.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}

        {/* Queue number + Avatar */}
        {isWaitlist ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-gray-400 w-6 text-right">#{record.position || '?'}</span>
            <img
              src={`https://www.gravatar.com/avatar/${record.email ? Array.from(record.email.trim().toLowerCase()).reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).replace('-', '') : '0'}?d=identicon&s=40`}
              alt={record.email || ''}
              className="w-9 h-9 rounded-full cursor-pointer border border-gray-200"
              onClick={() => handleEdit(record)}
            />
          </div>
        ) : (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={displayName}
              className="w-16 h-16 rounded-lg object-cover hover:shadow-lg cursor-pointer transition-shadow"
              onClick={() => handleEdit(record)}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-gray-900 text-sm sm:text-base truncate hover:text-blue-600 cursor-pointer transition-colors"
                onClick={() => handleEdit(record)}
              >
                {isWaitlist ? (
                  <span>
                    {highlight(record.email || 'No email', searchQuery)}
                    {record.name && record.name !== record.email?.split('@')[0] && (
                      <span className="text-xs font-normal text-gray-500 ml-1.5">({highlight(record.name, searchQuery)})</span>
                    )}
                  </span>
                ) : highlight(displayName, searchQuery)}
              </div>
              {isWaitlist && (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {(record.signupDate || record.created_at) && (
                    <span className="text-xs text-gray-500">
                      {new Date(record.signupDate || record.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                      <span className="text-gray-400">{new Date(record.signupDate || record.created_at!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    </span>
                  )}
                  {record.ipAddress && (() => {
                    const ip = record.ipAddress!.split(',')[0].trim();
                    const geo = ipGeoData[ip];
                    return geo ? (
                      <span className="text-xs text-gray-500" title={`${geo.city}, ${geo.country} (${ip})`}>
                        {geo.flag} {geo.city}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400" title={ip}>
                        {ip}
                      </span>
                    );
                  })()}
                  {record.source && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500">{record.source}</Badge>
                  )}
                </div>
              )}
              {!isWaitlist && (
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {record.category && (
                    <Badge className={`text-[10px] px-1.5 py-0 ${categoryColorMap[record.category.toLowerCase()] || 'bg-blue-100 text-blue-800'}`}>
                      {record.category}
                    </Badge>
                  )}
                  {record.type && (
                    <Badge className={`text-[10px] px-1.5 py-0 ${categoryColorMap[record.type.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                      {record.type}
                    </Badge>
                  )}
                  {record.brand && (
                    <span className="text-[10px] text-gray-400">{record.brand}</span>
                  )}
                </div>
              )}
              {!isWaitlist && record.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                  {typeof record.description === 'string'
                    ? record.description
                    : ((record.description as any)?.simple || (record.description as any)?.culinary || (record.description as any)?.short || '')}
                </p>
              )}
              {!isWaitlist && (() => {
                const ns = record.nutrition_per_serving || record.nutrition_per_100g || record.nutritional_info || {};
                const cal = Math.round(ns.calories ?? ns.energy_kcal ?? 0);
                const pro = Math.round(ns.protein_g ?? ns.protein ?? 0);
                const carb = Math.round(ns.carbohydrates_g ?? ns.carbs ?? ns.carbohydrates ?? 0);
                const fat = Math.round(ns.fats_g ?? ns.fat_g ?? ns.fat ?? ns.fats ?? 0);
                const hasMacros = cal > 0 || pro > 0 || carb > 0 || fat > 0;

                // Aggregate micros/risks from the record itself AND from all linked ingredients
                const countBen = (b: any): number => Array.isArray(b) ? b.length : (b && typeof b === 'object' ? Object.keys(b).length : 0);
                const countHaz = (h: any): number => Array.isArray(h) ? h.length : (h && typeof h === 'object' ? Object.keys(h).length : 0);
                let microCount = countBen(record.elements_beneficial);
                let riskCount = countHaz(record.elements_hazardous);
                // Also aggregate from linked ingredients array (recipes/products carry ingredient objects)
                const linkedIngredients: any[] = Array.isArray(record.ingredients) ? record.ingredients : [];
                const linkedLinked: any[] = Array.isArray(record.linked_ingredients) ? record.linked_ingredients : [];
                const allLinked = [...linkedIngredients, ...linkedLinked];
                const seenMicro = new Set<string>(Object.keys(typeof record.elements_beneficial === 'object' && record.elements_beneficial ? record.elements_beneficial : {}));
                const seenRisk = new Set<string>(Object.keys(typeof record.elements_hazardous === 'object' && record.elements_hazardous ? record.elements_hazardous : {}));
                allLinked.forEach((ing: any) => {
                  const ib = ing?.elements_beneficial;
                  const ih = ing?.elements_hazardous;
                  if (ib && typeof ib === 'object') {
                    const keys = Array.isArray(ib) ? ib.map((_: any, i: number) => `ib_${i}`) : Object.keys(ib);
                    keys.forEach((k: string) => { if (!seenMicro.has(k)) { seenMicro.add(k); microCount++; } });
                  }
                  if (ih && typeof ih === 'object') {
                    const keys = Array.isArray(ih) ? ih.map((_: any, i: number) => `ih_${i}`) : Object.keys(ih);
                    keys.forEach((k: string) => { if (!seenRisk.has(k)) { seenRisk.add(k); riskCount++; } });
                  }
                });

                if (!hasMacros && microCount === 0 && riskCount === 0) return null;
                return (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {hasMacros && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5">
                        {cal > 0 && <span><span className="font-semibold text-gray-700">{cal}</span> kcal</span>}
                        {cal > 0 && pro > 0 && <span className="text-gray-300">·</span>}
                        {pro > 0 && <span><span className="font-semibold text-gray-700">{pro}g</span> P</span>}
                        {pro > 0 && carb > 0 && <span className="text-gray-300">·</span>}
                        {carb > 0 && <span><span className="font-semibold text-gray-700">{carb}g</span> C</span>}
                        {carb > 0 && fat > 0 && <span className="text-gray-300">·</span>}
                        {fat > 0 && <span><span className="font-semibold text-gray-700">{fat}g</span> F</span>}
                      </div>
                    )}
                    {microCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                        +{microCount} micro{microCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {riskCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                        {riskCount} risk{riskCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Right Column */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isWaitlist && (
                <div className="flex items-center gap-2">
                  {record.emailsSent || record.email_sent ? (
                    <Badge className="bg-green-100 text-green-800 text-xs font-medium">Sent</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs font-medium">Pending</Badge>
                  )}
                  <span className="text-xs text-gray-500">Ref: <span className="font-semibold text-gray-700">{record.referrals || 0}</span></span>
                </div>
              )}
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {isWaitlist && !record.confirmed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResendEmail(record.id, record.email || '')}
                    disabled={resendingEmail === record.id}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600"
                    title="Resend confirmation email"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewDetail(record)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(record)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(record)}
                  disabled={deletingRecord === record.id}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage waitlist, elements, ingredients, recipes, products, and scans</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val: string) => { setActiveTab(val); setSelectedRecords(new Set()); setBulkMode(false); setBulkAction(null); setCurrentPage(1); setSubFilter('all'); setCategoryFilter('all'); }} className="w-full">
            <TabsList className="flex flex-wrap w-full h-auto gap-1 p-1">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md flex-shrink-0 ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-md font-semibold border border-blue-200' : ''} ${tab.id === 'sync' ? 'text-indigo-600' : ''}`}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Sync Tab ── */}
            <TabsContent value="sync" className="space-y-6 pt-2">
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">⇄ Staging → Production Sync</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <span className="font-semibold text-amber-600">Staging</span> (mofhvoudjxinvpplsytd) ↔ <span className="font-semibold text-green-600">Production</span> (ermbkttsyvpenjjxaxcf)
                    </p>
                  </div>
                  <button type="button"
                    onClick={async () => {
                      setSyncDiffLoading(true); setSyncDiff(null); setSyncResults(null);
                      try {
                        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/sync/diff`,
                          { headers: { 'Authorization': `Bearer ${accessToken}` } });
                        const data = await res.json();
                        if (data.success) setSyncDiff(data.diff);
                        else toast.error(data.error || 'Diff failed');
                      } catch { toast.error('Failed to check diff'); }
                      finally { setSyncDiffLoading(false); }
                    }}
                    disabled={syncDiffLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {syncDiffLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🔍</span>}
                    {syncDiffLoading ? 'Checking...' : 'Check Diff'}
                  </button>
                </div>

                {/* Table selector */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tables to sync</p>
                  <div className="flex gap-2 flex-wrap">
                    {['catalog_elements', 'catalog_ingredients', 'catalog_recipes'].map(t => {
                      const selected = syncSelectedTables.includes(t);
                      const label = t.replace('catalog_', '');
                      return (
                        <button key={t} type="button"
                          onClick={() => setSyncSelectedTables(prev => selected ? prev.filter(x => x !== t) : [...prev, t])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Diff results */}
                {syncDiff && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Diff Results</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {Object.entries(syncDiff).map(([table, info]: [string, any]) => (
                        <div key={table} className={`rounded-xl border p-4 space-y-2 ${info.inSync ? 'border-green-100 bg-green-50' : 'border-amber-100 bg-amber-50'}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-700">{table.replace('catalog_', '')}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${info.inSync ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {info.inSync ? '✓ In sync' : '⚠ Out of sync'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <div className="text-gray-500">Staging: <span className="font-bold text-gray-800">{info.staging}</span></div>
                            <div className="text-gray-500">Prod: <span className="font-bold text-gray-800">{info.production}</span></div>
                            {info.onlyInStaging > 0 && <div className="col-span-2 text-amber-700">+{info.onlyInStaging} only in staging</div>}
                            {info.onlyInProd > 0 && <div className="col-span-2 text-blue-700">+{info.onlyInProd} only in prod</div>}
                            {info.newerInStaging > 0 && <div className="col-span-2 text-indigo-700">{info.newerInStaging} updated in staging</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sync results */}
                {syncResults && (
                  <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sync Results</p>
                    {Object.entries(syncResults).map(([table, res]: [string, any]) => (
                      <div key={table} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${res.status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span className="font-semibold">{table.replace('catalog_', '')}</span>
                        <span>{res.status === 'ok' ? `✓ ${res.pushed ?? res.pulled} records synced` : `✗ ${res.error}`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirmation modal */}
                {syncConfirm && (
                  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                      <div className="text-center space-y-2">
                        <div className="text-4xl">{syncConfirm === 'push' ? '🚀' : '⬇️'}</div>
                        <h3 className="text-base font-bold text-gray-800">
                          {syncConfirm === 'push' ? 'Push Staging → Production' : 'Pull Production → Staging'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {syncConfirm === 'push'
                            ? `This will overwrite production records with staging data for: ${syncSelectedTables.map(t => t.replace('catalog_', '')).join(', ')}. This affects live mobile users.`
                            : `This will overwrite staging records with production data for: ${syncSelectedTables.map(t => t.replace('catalog_', '')).join(', ')}.`}
                        </p>
                        <p className="text-[11px] font-semibold text-red-500">This cannot be undone. Are you sure?</p>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setSyncConfirm(null)}
                          className="flex-1 px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button type="button"
                          onClick={async () => {
                            const action = syncConfirm;
                            setSyncConfirm(null);
                            if (action === 'push') {
                              setSyncPushing(true);
                              try {
                                const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/sync/push-to-prod`,
                                  { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ tables: syncSelectedTables }) });
                                const data = await res.json();
                                if (data.success) { setSyncResults(data.results); toast.success('Pushed to production!'); }
                                else toast.error(data.error || 'Push failed');
                              } catch { toast.error('Push failed'); }
                              finally { setSyncPushing(false); }
                            } else {
                              setSyncPulling(true);
                              try {
                                const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/sync/pull-from-prod`,
                                  { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ tables: syncSelectedTables }) });
                                const data = await res.json();
                                if (data.success) { setSyncResults(data.results); toast.success('Pulled from production!'); }
                                else toast.error(data.error || 'Pull failed');
                              } catch { toast.error('Pull failed'); }
                              finally { setSyncPulling(false); }
                            }
                          }}
                          className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${syncConfirm === 'push' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button type="button"
                    onClick={() => setSyncConfirm('pull')}
                    disabled={syncPulling || syncSelectedTables.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    {syncPulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>⬇️</span>}
                    {syncPulling ? 'Pulling...' : 'Pull from Production'}
                  </button>
                  <button type="button"
                    onClick={() => setSyncConfirm('push')}
                    disabled={syncPushing || syncSelectedTables.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {syncPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🚀</span>}
                    {syncPushing ? 'Pushing...' : 'Push to Production'}
                  </button>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-semibold">⚠️ Important</p>
                  <p>• <strong>Push to Production</strong> copies staging catalog data to the live production DB that mobile users read. Only push when data is reviewed and ready.</p>
                  <p>• <strong>Pull from Production</strong> overwrites staging with production data — useful to sync down live data for editing.</p>
                  <p>• <code>PROD_SUPABASE_SERVICE_ROLE_KEY</code> must be set as a Supabase secret for sync to work.</p>
                </div>
              </div>
            </TabsContent>

            {tabs.filter(tab => tab.id !== 'sync').map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                {/* Waitlist Funnel Dashboard */}
                {tab.id === 'waitlist' && validRecords.length > 0 && (
                  <WaitlistFunnelDashboard records={validRecords} accessToken={accessToken} ipGeoData={ipGeoData} />
                )}

                {/* Catalog Metric Cards (elements, ingredients, recipes, products) */}
                {['elements', 'ingredients', 'recipes', 'products'].includes(tab.id) && records.length > 0 && (
                  <CatalogMetricCards records={records} tabId={tab.id} />
                )}

                {/* Scan Funnel Dashboard */}
                {tab.id === 'scans' && records.length > 0 && (
                  <ScanFunnelDashboard records={records} />
                )}

                {/* Sub-category Filter Tabs — centered */}
                {subFilters[tab.id] && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-lg">
                      {subFilters[tab.id].map((sf) => {
                        const isActive = subFilter === sf.value;
                        const colorMap: Record<string, string> = {
                          blue: 'bg-blue-600 text-white shadow-sm',
                          green: 'bg-green-600 text-white shadow-sm',
                          red: 'bg-red-600 text-white shadow-sm',
                          amber: 'bg-amber-600 text-white shadow-sm',
                          orange: 'bg-orange-600 text-white shadow-sm',
                          cyan: 'bg-cyan-600 text-white shadow-sm',
                          purple: 'bg-purple-600 text-white shadow-sm',
                          lime: 'bg-lime-600 text-white shadow-sm',
                        };
                        return (
                          <button
                            key={sf.value}
                            onClick={() => { setSubFilter(sf.value); setCategoryFilter('all'); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              isActive
                                ? colorMap[sf.color] || 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            {sf.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Second-level category filter for Ingredients */}
                    {tab.id === 'ingredients' && subFilter !== 'all' && (() => {
                      const rawCategories = ['vegetable', 'fruit', 'grain', 'legume', 'nut', 'seed', 'herb', 'spice', 'protein'];
                      const processedCategories = ['dairy', 'oil', 'sweetener', 'additive'];
                      const cats = subFilter === 'raw' ? rawCategories : processedCategories;
                      return (
                        <div className="inline-flex flex-wrap gap-1 p-1 bg-gray-50 rounded-lg justify-center">
                          <button
                            onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                              categoryFilter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                            }`}
                          >All</button>
                          {cats.map(cat => (
                            <button
                              key={cat}
                              onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                                categoryFilter === cat ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                              }`}
                            >{cat}</button>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Second-level type filter for Recipes */}
                    {tab.id === 'recipes' && subFilter !== 'all' && (() => {
                      const typeMap: Record<string, string[]> = {
                        meal: ['breakfast', 'lunch', 'dinner', 'appetizer', 'side dish'],
                        beverage: ['hot', 'cold', 'smoothie', 'juice', 'cocktail'],
                        condiment: ['sauce', 'dressing', 'dip', 'spread'],
                      };
                      const types = typeMap[subFilter] || [];
                      if (!types.length) return null;
                      return (
                        <div className="inline-flex flex-wrap gap-1 p-1 bg-gray-50 rounded-lg justify-center">
                          <button
                            onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                              categoryFilter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                            }`}
                          >All</button>
                          {types.map(t => (
                            <button
                              key={t}
                              onClick={() => { setCategoryFilter(t); setCurrentPage(1); }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                                categoryFilter === t ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                              }`}
                            >{t}</button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Toolbar */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    {/* Search toggle button */}
                    <Button
                      variant={showSearch ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setShowSearch(!showSearch);
                        if (showSearch) {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }
                      }}
                      className="gap-1"
                      title={showSearch ? 'Close search' : 'Search'}
                    >
                      {showSearch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>

                    {/* Search input — only visible when toggled */}
                    {showSearch && (
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder={`Search all records...`}
                          value={searchQuery}
                          autoFocus
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                    )}

                    <div className="flex-1" />

                    <Button
                      variant={bulkMode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setBulkMode(!bulkMode);
                        if (bulkMode) {
                          setSelectedRecords(new Set());
                          setBulkAction(null);
                        }
                      }}
                      className="gap-1 whitespace-nowrap"
                    >
                      <CheckSquare className="w-4 h-4" />
                      {bulkMode ? 'Cancel' : 'Select'}
                    </Button>
                    {activeTab !== 'waitlist' && activeTab !== 'scans' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddNew}
                          className="gap-1 whitespace-nowrap text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          title={`Add new ${adminFieldConfig[activeTab]?.label || 'record'}`}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Add</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAiCreatePrompt(true)}
                          disabled={aiCreating}
                          className="gap-1 whitespace-nowrap text-purple-700 border-purple-200 hover:bg-purple-50"
                          title={`AI Create new ${adminFieldConfig[activeTab]?.label || 'record'}`}
                        >
                          {aiCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span className="hidden sm:inline">{aiCreating ? 'Creating...' : 'AI Create'}</span>
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchRecords}
                      disabled={loading}
                      className="gap-1"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-gray-500 mr-1">Sort:</span>
                    {[
                      ...(activeTab === 'waitlist' ? [
                        { field: 'signupDate', label: 'Date' },
                        { field: 'referrals', label: 'Referrals' },
                        { field: 'position', label: 'Rank' },
                        { field: 'email', label: 'Email' },
                      ] : []),
                      ...(activeTab === 'scans' ? [
                        { field: 'scanned_at', label: 'Date' },
                        { field: 'overall_score', label: 'Score' },
                        { field: 'status', label: 'Status' },
                      ] : []),
                      ...(activeTab !== 'waitlist' && activeTab !== 'scans' ? [
                        { field: 'created_at', label: 'Date' },
                        { field: 'name_common', label: 'Name' },
                        { field: 'category', label: 'Category' },
                      ] : []),
                    ].map(opt => (
                      <button
                        key={opt.field}
                        onClick={() => handleSort(opt.field)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          sortField === opt.field
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        {opt.label}
                        {sortField === opt.field && (
                          <span className="ml-0.5">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    ))}
                    {sortField && (
                      <button
                        onClick={() => { setSortField(''); setSortDirection('desc'); }}
                        className="px-1.5 py-1 rounded text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        title="Clear sort"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Bulk Actions Bar */}
                  {bulkMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleSelectAll}
                            className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                          >
                            {selectedRecords.size === filteredRecords.length ? 'Deselect All' : 'Select All'}
                          </button>
                          <span className="text-sm text-blue-800">
                            {selectedRecords.size} of {filteredRecords.length} selected
                          </span>
                        </div>
                        {selectedRecords.size > 0 && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setBulkAction(bulkAction === 'update' ? null : 'update')}
                              className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                              <Edit className="w-3 h-3" />
                              Bulk Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBulkDelete}
                              className="gap-1 text-red-700 border-red-300 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Selected
                            </Button>
                          </div>
                        )}
                      </div>
                      {bulkAction === 'update' && selectedRecords.size > 0 && (
                        <div className="flex gap-2 pt-1">
                          <Input
                            placeholder="Field (e.g., confirmed, name)"
                            value={bulkEditField}
                            onChange={(e) => setBulkEditField(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="New value"
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleBulkUpdate}
                            disabled={!bulkEditField || !bulkEditValue}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cross-tab search results */}
                {showSearch && searchQuery.trim() && crossTabResults.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Results from other tabs
                    </div>
                    <div className="space-y-1.5">
                      {crossTabResults.map((result) => (
                        <button
                          key={`${result.tabId}-${result.record.id}`}
                          type="button"
                          onClick={() => {
                            setActiveTab(result.tabId);
                            setSearchQuery('');
                            setShowSearch(false);
                            setTimeout(() => {
                              setDetailRecord(result.record);
                              setShowDetailModal(true);
                            }, 150);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                        >
                          <Badge className="text-[10px] shrink-0 bg-gray-100 text-gray-600">
                            {result.tabLabel}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {result.record.name_common || result.record.name || result.record.email || result.record.title || 'Unnamed'}
                          </span>
                          {result.record.category && (
                            <span className="text-xs text-gray-400 ml-auto shrink-0">{result.record.category}</span>
                          )}
                          <Eye className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current tab label when searching */}
                {showSearch && searchQuery.trim() && (
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {tab.label} ({filteredRecords.length} result{filteredRecords.length !== 1 ? 's' : ''})
                  </div>
                )}

                {/* Records Container */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map(record => renderRecordRow(record))
                  ) : (
                    <div className="text-center py-12 text-gray-500">No records found</div>
                  )}
                </div>

                {/* Pagination — always shown when multiple pages */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedRecords.length)} of {sortedRecords.length} records
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        ← Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages: (number | '...')[] = [];
                          if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            if (currentPage > 3) pages.push('...');
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                            if (currentPage < totalPages - 2) pages.push('...');
                            pages.push(totalPages);
                          }
                          return pages.map((page, idx) =>
                            page === '...' ? (
                              <span key={`ellipsis-${idx}`} className="px-1.5 text-sm text-gray-400">…</span>
                            ) : (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          );
                        })()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Modal (Read) — Extracted tray components */}
      {detailRecord && activeTab === 'waitlist' ? (
        <WaitlistDetailTray
          record={detailRecord}
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResendEmail={handleResendEmail}
          resendingEmail={resendingEmail}
          ipGeoData={ipGeoData}
        />
      ) : detailRecord ? (
        <CatalogDetailTray
          record={detailRecord}
          activeTab={activeTab}
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          ipGeoData={ipGeoData}
          accessToken={accessToken}
        />
      ) : null}

      {/* Edit Modal - Config Driven (uses AdminModal) */}
      <AdminModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingRecord?.id ? `Edit ${adminFieldConfig[activeTab]?.label || 'Record'} — ${getDisplayName(editingRecord)}` : `New ${adminFieldConfig[activeTab]?.label || 'Record'}`}
        subtitle={editingRecord?.id ? `ID: ${String(editingRecord.id).slice(0, 8)}...` : 'Fill in the details below and save to create'}
        size="xl"
        footer={
          <div className="flex items-center justify-center gap-2 w-full">
            {editingRecord?.id && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sortedRecords.findIndex(r => r.id === editingRecord?.id) <= 0}
                  onClick={() => {
                    const idx = sortedRecords.findIndex(r => r.id === editingRecord?.id);
                    if (idx > 0) { setEditingRecord({ ...sortedRecords[idx - 1] }); setElementSearchQuery(''); setIngredientSearchQuery(''); }
                  }}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs ml-1">Prev</span>
                </Button>
                <span className="text-xs text-gray-400 px-1">
                  {`${sortedRecords.findIndex(r => r.id === editingRecord.id) + 1} / ${sortedRecords.length}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sortedRecords.findIndex(r => r.id === editingRecord?.id) >= sortedRecords.length - 1}
                  onClick={() => {
                    const idx = sortedRecords.findIndex(r => r.id === editingRecord?.id);
                    if (idx < sortedRecords.length - 1) { setEditingRecord({ ...sortedRecords[idx + 1] }); setElementSearchQuery(''); setIngredientSearchQuery(''); }
                  }}
                  className="h-8 px-2"
                >
                  <span className="text-xs mr-1">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
              </>
            )}
            {activeTab !== 'waitlist' && (
              <>
                <input
                  value={aiContext}
                  onChange={e => setAiContext(e.target.value)}
                  placeholder="AI context (optional extra info)..."
                  className="h-8 w-48 px-2.5 text-xs border border-purple-200 rounded-lg bg-purple-50/50 focus:ring-1 focus:ring-purple-300 focus:border-purple-300 outline-none placeholder:text-purple-300"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAiFill}
                  disabled={aiFillingFields || (!editingRecord?.name && !editingRecord?.name_common)}
                  className="h-8 px-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-indigo-100"
                >
                  {aiFillingFields ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                  <span className="text-xs">{aiFillingFields ? 'Filling...' : 'AI Fill'}</span>
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={savingRecord} className="bg-blue-600 hover:bg-blue-700 text-white">
              {savingRecord ? 'Saving...' : editingRecord?.id ? 'Save' : 'Create'}
            </Button>
          </div>
        }
      >
        {editingRecord && (() => {
          const editFields = getFieldsForView(activeTab, 'edit');
          const inputCls = "w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
          const selectCls = "w-full h-10 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none";
          const textareaCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-20 resize-y";

          const renderEditField = (field: FieldConfig) => {
            const val = editingRecord[field.key];
            const updateField = (newVal: any) => setEditingRecord({ ...editingRecord, [field.key]: newVal });

            if (field.showWhen) {
              const rawWatchVal = (editingRecord as any)[field.showWhen.field];
              const watchVal = String(rawWatchVal || '').toLowerCase();
              const isEmpty = !rawWatchVal || watchVal === '';
              if (field.showWhen.is) {
                if (!field.showWhen.is.map(v => v.toLowerCase()).includes(watchVal)) return null;
              }
              if (field.showWhen.not) {
                const notVals = field.showWhen.not.map(v => v.toLowerCase());
                if (isEmpty || notVals.includes(watchVal)) return null;
              }
            }

            if (field.type === 'image') {
              const handleImageDrop = async (e: React.DragEvent) => {
                e.preventDefault(); e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  setUploadingImage(true);
                  try {
                    toast.info('Uploading image...');
                    const publicUrl = await uploadFileToStorage(file, 'catalog-media', accessToken);
                    updateField(publicUrl);
                    toast.success('Image uploaded!');
                  } catch (err: any) { toast.error(`Upload failed: ${(err?.message || '').slice(0, 80)}`); }
                  finally { setUploadingImage(false); }
                }
              };
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'border-blue-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'border-blue-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'border-blue-400'); handleImageDrop(e); }}
                    className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-3 transition-all hover:border-gray-300 cursor-pointer"
                    onClick={() => document.getElementById(`img-upload-${field.key}`)?.click()}
                  >
                    {val ? (
                      <img src={val} alt={getDisplayName(editingRecord)} className="w-full h-24 rounded-lg object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                        <span className="text-[10px] text-center leading-tight">Drop or click</span>
                      </div>
                    )}
                    {uploadingImage && <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>}
                  </div>
                  <input id={`img-upload-${field.key}`} type="file" accept="image/*" title="Upload image" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingImage(true);
                      try { toast.info('Uploading...'); const url = await uploadFileToStorage(file, 'catalog-media', accessToken); updateField(url); toast.success('Image uploaded!'); }
                      catch (err: any) { toast.error(`Upload failed: ${(err?.message || '').slice(0, 80)}`); }
                      finally { setUploadingImage(false); }
                    }
                  }} />
                  <input value={val || ''} onChange={(e) => updateField(e.target.value)} placeholder="Image URL" className={`${inputCls} text-xs`} />
                </div>
              );
            }

            if (field.type === 'video') {
              const handleVideoDrop = async (e: React.DragEvent) => {
                e.preventDefault(); e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('video/')) {
                  setUploadingImage(true);
                  try {
                    toast.info('Uploading video...');
                    const publicUrl = await uploadFileToStorage(file, 'catalog-media', accessToken);
                    updateField(publicUrl);
                    toast.success('Video uploaded!');
                  } catch (err: any) { toast.error(`Upload failed: ${(err?.message || '').slice(0, 80)}`); }
                  finally { setUploadingImage(false); }
                }
              };
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'border-blue-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'border-blue-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'border-blue-400'); handleVideoDrop(e); }}
                    className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-3 transition-all hover:border-gray-300 cursor-pointer"
                    onClick={() => document.getElementById(`vid-upload-${field.key}`)?.click()}
                  >
                    {val ? (
                      <video src={val} controls className="w-full h-24 rounded-lg object-cover bg-black" onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                        <Film className="w-6 h-6 mb-1 opacity-40" />
                        <span className="text-[10px] text-center leading-tight">Drop or click</span>
                      </div>
                    )}
                    {uploadingImage && <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>}
                  </div>
                  <input id={`vid-upload-${field.key}`} type="file" accept="video/*" title="Upload video" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingImage(true);
                      try { toast.info('Uploading...'); const url = await uploadFileToStorage(file, 'catalog-media', accessToken); updateField(url); toast.success('Video uploaded!'); }
                      catch (err: any) { toast.error(`Upload failed: ${(err?.message || '').slice(0, 80)}`); }
                      finally { setUploadingImage(false); }
                    }
                  }} />
                  <input value={val || ''} onChange={(e) => updateField(e.target.value)} placeholder="Video URL" className={`${inputCls} text-xs`} />
                </div>
              );
            }

            if (field.type === 'readonly') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <input value={val || ''} disabled title={field.label} className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                  {field.key === 'email' && <p className="text-[11px] text-gray-400">Email cannot be changed</p>}
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <select title={field.label} value={val || ''} onChange={(e) => updateField(e.target.value)} className={selectCls}>
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {(field.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === 'content_links') {
              return (
                <ContentLinksField
                  key={field.key}
                  fieldKey={field.key}
                  val={val}
                  updateField={updateField}
                  accessToken={accessToken}
                  projectId={projectId}
                  recordContext={editingRecord as Record<string, any>}
                />
              );
            }

            if (field.type === 'category_tree') {
              const tree = field.categoryTree || {};
              const kingdoms = Object.keys(tree);
              // Derive current selections from editingRecord
              const rawCategoryVal = String((editingRecord as any)['category'] || '');
              const isSentinel = rawCategoryVal.startsWith('__kingdom__');
              const currentCategory = isSentinel ? '' : rawCategoryVal;
              const currentSub: string[] = Array.isArray((editingRecord as any)['category_sub'])
                ? (editingRecord as any)['category_sub']
                : [];
              // Find which kingdom contains the current category (or from sentinel)
              const currentKingdom = isSentinel
                ? rawCategoryVal.replace('__kingdom__', '')
                : (kingdoms.find(k => Object.keys(tree[k]).includes(currentCategory)) || '');
              const categoryOptions = currentKingdom ? Object.keys(tree[currentKingdom]) : [];
              const subOptions = currentCategory && currentKingdom ? (tree[currentKingdom][currentCategory] || []) : [];

              const setKingdom = (k: string) => {
                if (k === currentKingdom) return;
                setEditingRecord({ ...editingRecord, category: `__kingdom__${k}`, category_sub: [] } as any);
              };
              const setCategory = (cat: string) => {
                setEditingRecord({ ...editingRecord, category: cat, category_sub: [] } as any);
              };
              const toggleSub = (sub: string) => {
                const next = currentSub.includes(sub) ? currentSub.filter(s => s !== sub) : [...currentSub, sub];
                setEditingRecord({ ...editingRecord, category_sub: next } as any);
              };

              const btnBase = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer';
              const btnActive = 'bg-blue-600 text-white border-blue-600 shadow-sm';
              const btnInactive = 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50';

              return (
                <div key={field.key} className="space-y-2">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Col 1: Kingdom */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Kingdom</p>
                      <div className="flex flex-col gap-1">
                        {kingdoms.map(k => (
                          <button key={k} type="button"
                            onClick={() => setKingdom(k)}
                            className={`${btnBase} text-left ${currentKingdom === k ? btnActive : btnInactive}`}>
                            {k}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Col 2: Category */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Type</p>
                      {currentKingdom ? (
                        <div className="flex flex-col gap-1">
                          {categoryOptions.map(cat => (
                            <button key={cat} type="button"
                              onClick={() => setCategory(cat)}
                              className={`${btnBase} text-left ${currentCategory === cat ? btnActive : btnInactive}`}>
                              {cat}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Select a kingdom first</p>
                      )}
                    </div>
                    {/* Col 3: Subcategory */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Subtype</p>
                      {currentCategory ? (
                        <div className="flex flex-col gap-1">
                          {subOptions.map(sub => (
                            <button key={sub} type="button"
                              onClick={() => toggleSub(sub)}
                              className={`${btnBase} text-left ${currentSub.includes(sub) ? btnActive : btnInactive}`}>
                              {sub}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Select a type first</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (field.type === 'tags') {
              const currentVal = typeof val === 'string' ? val : '';
              const desc = currentVal && field.optionDescriptions?.[currentVal];
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(field.options || []).map(opt => {
                      const isSelected = currentVal.toLowerCase() === opt.toLowerCase();
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateField(isSelected ? '' : opt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                  {desc && (
                    <div className="flex items-start gap-1.5 mt-1 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <span className="text-blue-500 text-xs mt-0.5">ℹ</span>
                      <span className="text-[11px] text-blue-700 leading-relaxed">{desc}</span>
                    </div>
                  )}
                </div>
              );
            }

            if (field.type === 'multi_tags') {
              const selected: string[] = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
              // Support dynamic options based on another field's value
              let tagOptions = field.options || [];
              if (field.dynamicOptionsMap && field.conditionalOn && editingRecord) {
                const parentVal = editingRecord[field.conditionalOn];
                if (parentVal && field.dynamicOptionsMap[parentVal]) {
                  tagOptions = field.dynamicOptionsMap[parentVal];
                } else {
                  tagOptions = [];
                }
              }
              const noParent = field.conditionalOn && editingRecord && !editingRecord[field.conditionalOn];
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label} <span className="text-gray-400 font-normal normal-case">({selected.length} selected)</span></Label>
                  {noParent ? (
                    <p className="text-xs text-gray-400 italic">Select a {field.conditionalOn} first</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tagOptions.map(opt => {
                        const isSelected = selected.some(s => s.toLowerCase() === opt.toLowerCase());
                        return (
                          <button key={opt} type="button"
                            onClick={() => {
                              const next = isSelected ? selected.filter(s => s.toLowerCase() !== opt.toLowerCase()) : [...selected, opt];
                              updateField(next);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (field.type === 'taste_profile') {
              const profile = (typeof val === 'object' && val) ? val : { taste: {}, texture: {} };
              const taste = profile.taste || {};
              const texture = profile.texture || {};
              const tasteKeys = ['sweet', 'sour', 'salty', 'bitter', 'umami', 'spicy'];
              const textureKeys = ['crispy', 'crunchy', 'chewy', 'smooth', 'creamy', 'juicy'];
              const updateProfile = (group: 'taste' | 'texture', key: string, value: number) => {
                updateField({ ...profile, [group]: { ...profile[group], [key]: value } });
              };
              const tasteEmojis: Record<string, string> = { sweet: '🍯', sour: '🍋', salty: '🧂', bitter: '☕', umami: '🍖', spicy: '🌶️' };
              const textureEmojis: Record<string, string> = { crispy: '🥨', crunchy: '🥕', chewy: '🍬', smooth: '🥑', creamy: '🧈', juicy: '🍑' };
              return (
                <div key={field.key} className="space-y-3">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Taste</div>
                      {tasteKeys.map(k => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-sm w-5">{tasteEmojis[k]}</span>
                          <span className="text-xs text-gray-600 w-12 capitalize">{k}</span>
                          <input type="range" min={0} max={10} step={1} value={taste[k] || 0}
                            onChange={(e) => updateProfile('taste', k, parseInt(e.target.value))}
                            title={`${k} level`} className="flex-1 h-1.5 accent-blue-500 cursor-pointer" />
                          <span className="text-xs text-gray-500 w-5 text-right font-mono">{taste[k] || 0}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Texture</div>
                      {textureKeys.map(k => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-sm w-5">{textureEmojis[k]}</span>
                          <span className="text-xs text-gray-600 w-12 capitalize">{k}</span>
                          <input type="range" min={0} max={10} step={1} value={texture[k] || 0}
                            onChange={(e) => updateProfile('texture', k, parseInt(e.target.value))}
                            title={`${k} level`} className="flex-1 h-1.5 accent-emerald-500 cursor-pointer" />
                          <span className="text-xs text-gray-500 w-5 text-right font-mono">{texture[k] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (field.type === 'nutrition_editor' && field.linkedCategory === 'hazardous') {
              // Data: { element_id: { level, per_100g, per_serving, likelihood, reason } }
              const rawData: Record<string, any> = (typeof val === 'object' && val && !Array.isArray(val)) ? val : {};
              const defaultRisk = { level: 'none', per_100g: 0, per_serving: 0, likelihood: 0, reason: '' };
              // Normalize legacy flat strings to objects
              const data: Record<string, typeof defaultRisk> = {};
              Object.entries(rawData).forEach(([k, v]) => {
                if (typeof v === 'string') data[k] = { ...defaultRisk, level: v };
                else if (typeof v === 'object' && v) data[k] = { level: v.level || 'none', per_100g: v.per_100g || 0, per_serving: v.per_serving || 0, likelihood: v.likelihood || 0, reason: v.reason || '' };
              });
              const updateRisk = (elementId: string, patch: Partial<typeof defaultRisk>) => {
                const newData = { ...data };
                const cur = newData[elementId] || { ...defaultRisk };
                const updated = { ...cur, ...patch };
                if (updated.level === 'none' && !updated.per_100g && !updated.per_serving && !updated.likelihood && !updated.reason) { delete newData[elementId]; }
                else { newData[elementId] = updated; }
                updateField(Object.keys(newData).length > 0 ? newData : {});
              };
              const totalFlagged = Object.values(data).filter(v => v.level && v.level !== 'none').length;
              const searchLower = hazardSearch.toLowerCase();

              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                    {totalFlagged > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{totalFlagged} flagged</Badge>}
                  </div>
                  <input value={hazardSearch} onChange={(e) => setHazardSearch(e.target.value)}
                    placeholder="Search risks..." title="Search risks" className="w-full h-7 px-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-orange-400" />

                  {/* Column headers */}
                  <div className="flex items-center gap-1 px-2 text-[8px] text-gray-400 uppercase tracking-wider">
                    <span className="flex-1">Risk Element</span>
                    <span className="w-[72px] text-right">/ 100g</span>
                    <span className="w-[72px] text-right">/ serv</span>
                    <span className="w-12 text-right">% chance</span>
                    <span className="w-[88px] text-center">Level</span>
                  </div>

                  <div className="space-y-1">
                    {RISK_CATEGORIES.map(cat => {
                      const catKey = `risk_${cat.key}`;
                      const isOpen = isSectionOpen(catKey) || !!searchLower;
                      const filteredEls = searchLower
                        ? cat.elements.filter(el => el.name_common.toLowerCase().includes(searchLower) || el.category.toLowerCase().includes(searchLower))
                        : cat.elements;
                      if (searchLower && filteredEls.length === 0) return null;
                      const catFlagged = cat.elements.filter(el => data[el.id]?.level && data[el.id].level !== 'none').length;

                      return (
                        <div key={cat.key} className="border border-gray-100 rounded-lg overflow-hidden">
                          <button type="button" onClick={() => toggleSection(catKey)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-orange-50/50 bg-orange-50">
                            <span className="text-sm">{cat.icon}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider flex-1 text-orange-700">
                              {cat.label}
                            </span>
                            <span className="text-[9px] text-gray-400">{filteredEls.length}</span>
                            {catFlagged > 0 && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-medium">{catFlagged}</span>}
                            {isOpen ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                          </button>
                          {isOpen && (
                            <div className="px-1.5 py-1 space-y-0.5 bg-white">
                              {filteredEls.map(el => {
                                const d = data[el.id] || { ...defaultRisk };
                                const isActive = d.level !== 'none' || d.per_100g > 0 || d.per_serving > 0;
                                return (
                                  <div key={el.id} className={`rounded px-1 ${isActive ? 'bg-orange-50/40' : ''}`}>
                                    <div className="flex items-center gap-1 py-0.5">
                                      <span className="text-[10px] text-gray-600 flex-1 truncate" title={`${el.name_common} (${el.category})`}>
                                        {el.name_common}
                                      </span>
                                      <input type="number" step="any" min={0} value={d.per_100g || ''} placeholder="0"
                                        onChange={(e) => updateRisk(el.id, { per_100g: parseFloat(e.target.value) || 0 })}
                                        title={`${el.name_common} per 100g`}
                                        className={`w-[72px] h-6 px-1.5 text-[10px] border rounded text-right bg-white focus:ring-1 focus:ring-orange-300 ${d.per_100g > 0 ? 'border-orange-300 text-orange-800' : 'border-gray-200 text-gray-400'}`} />
                                      <input type="number" step="any" min={0} value={d.per_serving || ''} placeholder="0"
                                        onChange={(e) => updateRisk(el.id, { per_serving: parseFloat(e.target.value) || 0 })}
                                        title={`${el.name_common} per serving`}
                                        className={`w-[72px] h-6 px-1.5 text-[10px] border rounded text-right bg-gray-50 focus:ring-1 focus:ring-orange-300 ${d.per_serving > 0 ? 'border-orange-300 text-orange-800' : 'border-gray-200 text-gray-400'}`} />
                                      <input type="number" min={0} max={100} value={d.likelihood || ''} placeholder="0"
                                        onChange={(e) => updateRisk(el.id, { likelihood: parseInt(e.target.value) || 0 })}
                                        title={`${el.name_common} likelihood %`}
                                        className={`w-12 h-6 px-1.5 text-[10px] border rounded text-right bg-white focus:ring-1 focus:ring-orange-300 ${d.likelihood > 0 ? 'border-orange-300 text-orange-800' : 'border-gray-200 text-gray-400'}`} />
                                      <div className="flex gap-px">
                                        {HAZARD_LEVELS.map(l => (
                                          <button key={l} type="button" onClick={() => updateRisk(el.id, { level: l })}
                                            className={`px-1 py-px rounded text-[8px] font-medium border transition-all ${d.level === l ? HAZARD_LEVEL_COLORS[l] + ' shadow-sm' : 'bg-white text-gray-300 border-gray-100 hover:border-gray-200'}`}>
                                            {l.charAt(0).toUpperCase()}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {isActive && (
                                      <div className="pb-1">
                                        <input value={d.reason} placeholder="Reason why this risk exists..."
                                          onChange={(e) => updateRisk(el.id, { reason: e.target.value })}
                                          title={`${el.name_common} reason`}
                                          className="w-full h-5 px-1.5 text-[9px] border border-gray-200 rounded bg-white focus:ring-1 focus:ring-orange-300" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (field.type === 'nutrition_editor' && field.linkedCategory !== 'hazardous') {
              const data = (typeof val === 'object' && val) ? val : { serving: { name: '', size_g: 0 }, per_100g: {}, per_serving: {} };
              const servingG = data.serving?.size_g || 0;
              const servingRatio = servingG > 0 ? servingG / 100 : 0;
              const updateNutrition = (path: string[], value: number) => {
                const newData = JSON.parse(JSON.stringify(data));
                let obj = newData;
                for (let i = 0; i < path.length - 1; i++) {
                  if (!obj[path[i]]) obj[path[i]] = {};
                  obj = obj[path[i]];
                }
                obj[path[path.length - 1]] = value;
                // Auto-calculate per_serving when per_100g changes
                if (path[0] === 'per_100g' && servingG > 0) {
                  const servPath = ['per_serving', ...path.slice(1)];
                  let sObj = newData;
                  for (let i = 0; i < servPath.length - 1; i++) {
                    if (!sObj[servPath[i]]) sObj[servPath[i]] = {};
                    sObj = sObj[servPath[i]];
                  }
                  sObj[servPath[servPath.length - 1]] = Math.round(value * servingRatio * 1000) / 1000;
                }
                updateField(newData);
              };
              const updateServingSize = (newSizeG: number) => {
                const newData = JSON.parse(JSON.stringify(data));
                newData.serving = { ...newData.serving, size_g: newSizeG };
                // Recalculate ALL per_serving values from per_100g
                if (newSizeG > 0 && newData.per_100g) {
                  const ratio = newSizeG / 100;
                  if (!newData.per_serving) newData.per_serving = {};
                  const recalc = (src: any, dst: any) => {
                    for (const key of Object.keys(src)) {
                      if (typeof src[key] === 'number') { dst[key] = Math.round(src[key] * ratio * 1000) / 1000; }
                      else if (typeof src[key] === 'object' && src[key]) { if (!dst[key]) dst[key] = {}; recalc(src[key], dst[key]); }
                    }
                  };
                  recalc(newData.per_100g, newData.per_serving);
                }
                updateField(newData);
              };
              const getVal = (path: string[]): number => {
                let v: any = data;
                for (const p of path) v = v?.[p];
                return typeof v === 'number' ? v : 0;
              };
              const elPath = (cat: typeof NUTRIENT_CATEGORIES[0], el: typeof NUTRIENT_CATEGORIES[0]['elements'][0], tab: string) =>
                cat.key === 'macronutrients' && el.id === 'calories' ? [tab, 'calories'] : [tab, cat.storageKey, el.id];
              const totalFilled = NUTRIENT_CATEGORIES.reduce((acc, cat) =>
                acc + cat.elements.filter(el => getVal(elPath(cat, el, 'per_100g')) > 0).length, 0);
              const searchLower = nutrientSearch.toLowerCase();

              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                    {totalFilled > 0 && <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300">{totalFilled} filled</Badge>}
                  </div>

                  {/* Serving info + tag cloud */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input value={data.serving?.name || ''} onChange={(e) => { const d = { ...data, serving: { ...data.serving, name: e.target.value } }; updateField(d); }}
                        placeholder="Serving name" title="Serving name" className="w-full h-7 px-2 text-xs border border-gray-200 rounded-md bg-white" />
                    </div>
                    <div className="w-20">
                      <input type="number" value={data.serving?.size_g || ''} onChange={(e) => updateServingSize(parseFloat(e.target.value) || 0)}
                        placeholder="g" title="Serving size (g)" className="w-full h-7 px-2 text-xs border border-gray-200 rounded-md bg-white text-right" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {SERVING_PRESETS.map(p => {
                      const isActive = data.serving?.name === p.label && data.serving?.size_g === p.size_g;
                      return (
                        <button key={p.label} type="button"
                          onClick={() => { const d = { ...data, serving: { name: p.label, size_g: p.size_g } }; updateField(d); updateServingSize(p.size_g); }}
                          className={`px-1.5 py-0.5 rounded-full text-[9px] border transition-all ${isActive ? 'bg-green-100 text-green-800 border-green-300 font-semibold' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-700'}`}>
                          {p.label} ({p.size_g}g)
                        </button>
                      );
                    })}
                  </div>

                  <input value={nutrientSearch} onChange={(e) => setNutrientSearch(e.target.value)}
                    placeholder="Search nutrients..." title="Search nutrients" className="w-full h-7 px-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-green-400" />

                  {/* Column headers */}
                  <div className="flex items-center gap-1 px-2 text-[8px] text-gray-400 uppercase tracking-wider">
                    <span className="flex-1">Nutrient</span>
                    <span className="w-[72px] text-right">/ 100g</span>
                    <span className="w-[72px] text-right">/ serv</span>
                    <span className="w-12 text-right">% RDI</span>
                    <span className="w-6"></span>
                  </div>

                  <div className="space-y-1">
                    {NUTRIENT_CATEGORIES.map(cat => {
                      const catKey = `nut_${cat.key}`;
                      const isOpen = isSectionOpen(catKey) || !!searchLower;
                      const filteredEls = searchLower
                        ? cat.elements.filter(el => el.name.toLowerCase().includes(searchLower) || el.unit.toLowerCase().includes(searchLower))
                        : cat.elements;
                      if (searchLower && filteredEls.length === 0) return null;
                      const catFilled = cat.elements.filter(el => getVal(elPath(cat, el, 'per_100g')) > 0).length;

                      return (
                        <div key={cat.key} className="border border-gray-100 rounded-lg overflow-hidden">
                          <button type="button" onClick={() => toggleSection(catKey)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-green-50/50 bg-green-50">
                            <span className="text-sm">{cat.icon}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider flex-1 text-green-700">
                              {cat.label}
                            </span>
                            <span className="text-[9px] text-gray-400">{filteredEls.length}</span>
                            {catFilled > 0 && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 rounded-full font-medium">{catFilled}</span>}
                            {isOpen ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                          </button>
                          {isOpen && (
                            <div className="px-1.5 py-1 space-y-0.5 bg-white">
                              {filteredEls.map(el => {
                                const p100 = elPath(cat, el, 'per_100g');
                                const pServ = elPath(cat, el, 'per_serving');
                                const v100 = getVal(p100);
                                const vServ = getVal(pServ);
                                const rdiNum = el.rdi ? parseFloat(el.rdi) : 0;
                                const pctRdi = rdiNum > 0 && v100 > 0 ? Math.round((v100 / rdiNum) * 100) : 0;
                                const hasSomething = v100 > 0 || vServ > 0;
                                return (
                                  <div key={el.id} className={`flex items-center gap-1 py-0.5 rounded px-1 ${hasSomething ? 'bg-green-50/40' : ''}`}>
                                    <span className="text-[10px] text-gray-600 flex-1 truncate" title={el.rdi ? `RDI: ${el.rdi} ${el.unit}` : el.name}>
                                      {el.name}
                                    </span>
                                    <input type="number" step="any" value={v100 || ''} placeholder="0"
                                      onChange={(e) => updateNutrition(p100, parseFloat(e.target.value) || 0)}
                                      title={`${el.name} per 100g`}
                                      className={`w-[72px] h-6 px-1.5 text-[10px] border rounded text-right bg-white focus:ring-1 focus:ring-green-400 ${v100 > 0 ? 'border-green-300 text-green-800' : 'border-gray-200 text-gray-400'}`} />
                                    <input type="number" step="any" value={vServ || ''} placeholder="0"
                                      onChange={(e) => updateNutrition(pServ, parseFloat(e.target.value) || 0)}
                                      title={`${el.name} per serving (auto-calculated from serving size)`}
                                      className={`w-[72px] h-6 px-1.5 text-[10px] border rounded text-right bg-gray-50 focus:ring-1 focus:ring-green-400 ${vServ > 0 ? 'border-green-300 text-green-800' : 'border-gray-200 text-gray-400'}`} />
                                    <span className={`w-12 text-[9px] text-right font-medium ${pctRdi >= 100 ? 'text-green-700' : pctRdi >= 50 ? 'text-green-600' : pctRdi > 0 ? 'text-gray-500' : 'text-gray-300'}`}>
                                      {pctRdi > 0 ? `${pctRdi}%` : '—'}
                                    </span>
                                    <span className="text-[7px] text-gray-300 w-6 truncate">{el.unit}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (field.type === 'boolean') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <select title={field.label} value={val ? 'true' : 'false'} onChange={(e) => updateField(e.target.value === 'true')} className={selectCls}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              );
            }

            if (field.type === 'linked_elements') {
              const linkedIds: string[] = Array.isArray(val) ? val : [];
              const catFilter = field.linkedCategory || 'all';
              const filteredElements = elementsCache.filter((el: AdminRecord) => {
                if (catFilter !== 'all' && el.category !== catFilter) return false;
                if (!elementSearchQuery) return true;
                const q = elementSearchQuery.toLowerCase();
                return (el.name_common || '').toLowerCase().includes(q) || (el.name || '').toLowerCase().includes(q) || (el.type || '').toLowerCase().includes(q);
              });
              const linkedElements = elementsCache.filter((el: AdminRecord) => linkedIds.includes(el.id));
              const availableElements = filteredElements.filter((el: AdminRecord) => !linkedIds.includes(el.id)).slice(0, 8);

              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label} <span className="text-gray-400 font-normal normal-case">({linkedIds.length} linked)</span></Label>
                  {linkedElements.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {linkedElements.map((el: AdminRecord) => (
                        <div key={el.id} className={`relative flex items-center gap-2 p-2 rounded-lg border ${
                          el.category === 'beneficial' ? 'bg-green-50 border-green-200' : el.category === 'hazardous' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          {el.image_url ? (
                            <img src={el.image_url} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              el.category === 'beneficial' ? 'bg-green-200 text-green-700' : el.category === 'hazardous' ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-600'
                            }`}>{(el.name_common || el.name || '?')[0].toUpperCase()}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">{el.name_common || el.name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                el.category === 'beneficial' ? 'bg-green-200 text-green-800' : el.category === 'hazardous' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'
                              }`}>{el.category}</span>
                              {el.type && <span className="text-[9px] text-gray-400">{el.type}</span>}
                              {el.unit && <span className="text-[9px] text-gray-400">({el.unit})</span>}
                            </div>
                          </div>
                          <button type="button" onClick={() => updateField(linkedIds.filter((id: string) => id !== el.id))}
                            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/80 text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs" title="Remove">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    value={elementSearchQuery}
                    onChange={(e) => setElementSearchQuery(e.target.value)}
                    placeholder={`Search ${catFilter === 'beneficial' ? 'nutrients' : catFilter === 'hazardous' ? 'hazards' : 'elements'}...`}
                    className={inputCls}
                  />
                  {(elementSearchQuery || linkedElements.length === 0) && availableElements.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {availableElements.map((el: AdminRecord) => (
                        <button key={el.id} type="button"
                          onClick={() => { updateField([...linkedIds, el.id]); setElementSearchQuery(''); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                        >
                          {el.image_url ? (
                            <img src={el.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              el.category === 'beneficial' ? 'bg-green-100 text-green-700' : el.category === 'hazardous' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>{(el.name_common || el.name || '?')[0].toUpperCase()}</div>
                          )}
                          <span className="font-medium flex-1 truncate">{el.name_common || el.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{el.type} · {el.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {elementsCache.length === 0 && <p className="text-xs text-gray-400 italic">Loading elements...</p>}
                </div>
              );
            }

            if (field.type === 'linked_ingredients') {
              const linkedIds: string[] = Array.isArray(val) ? val : [];
              const filteredIngredients = ingredientsCache.filter((ing: AdminRecord) => {
                if (!ingredientSearchQuery) return true;
                const q = ingredientSearchQuery.toLowerCase();
                return (ing.name_common || ing.name || '').toLowerCase().includes(q) || (ing.category || '').toLowerCase().includes(q);
              });
              const linkedIngredients = ingredientsCache.filter((ing: AdminRecord) => linkedIds.includes(ing.id));
              const availableIngredients = filteredIngredients.filter((ing: AdminRecord) => !linkedIds.includes(ing.id)).slice(0, 8);

              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label} <span className="text-gray-400 font-normal normal-case">({linkedIds.length} linked)</span></Label>
                  {field.placeholder && linkedIds.length === 0 && (
                    <p className="text-[11px] text-gray-400 italic">{field.placeholder}</p>
                  )}
                  {linkedIngredients.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {linkedIngredients.map((ing: AdminRecord) => (
                        <div key={ing.id} className="relative flex items-center gap-2 p-2 rounded-lg border bg-emerald-50 border-emerald-200">
                          {ing.image_url ? (
                            <img src={ing.image_url} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 bg-emerald-200 text-emerald-700">
                              {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">{ing.name_common || ing.name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {ing.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-200 text-emerald-800">{ing.category}</span>}
                              {ing.processing_type && <span className="text-[9px] text-gray-400">{ing.processing_type}</span>}
                            </div>
                          </div>
                          <button type="button" onClick={() => updateField(linkedIds.filter((id: string) => id !== ing.id))}
                            className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/80 text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs" title="Remove">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    value={ingredientSearchQuery}
                    onChange={(e) => setIngredientSearchQuery(e.target.value)}
                    placeholder={field.placeholder || 'Search ingredients to link...'}
                    className={inputCls}
                  />
                  {(ingredientSearchQuery || linkedIngredients.length === 0) && availableIngredients.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {availableIngredients.map((ing: AdminRecord) => (
                        <button key={ing.id} type="button"
                          onClick={() => { updateField([...linkedIds, ing.id]); setIngredientSearchQuery(''); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                        >
                          {ing.image_url ? (
                            <img src={ing.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-emerald-100 text-emerald-700">
                              {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium flex-1 truncate">{ing.name_common || ing.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{ing.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {ingredientsCache.length === 0 && <p className="text-xs text-gray-400 italic">Loading ingredients...</p>}
                </div>
              );
            }

            if (field.type === 'json') {
              const jsonStr = typeof val === 'string' ? val : JSON.stringify(val || {}, null, 2);
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <textarea
                    value={jsonStr}
                    onChange={(e) => { try { updateField(JSON.parse(e.target.value)); } catch { updateField(e.target.value); } }}
                    placeholder='{"key": "value"}'
                    className={`${textareaCls} min-h-24 font-mono text-xs`}
                  />
                </div>
              );
            }

            if (field.type === 'grouped_ingredients') {
              // Data: Array of {name, ingredient_id} | {group, items:[{name, ingredient_id}]}
              const rawItems: any[] = Array.isArray(val) ? val : [];

              const resolveIngredient = (name: string): string | null => {
                if (!name) return null;
                const q = name.toLowerCase();
                const match = ingredientsCache.find((ing: AdminRecord) =>
                  (ing.name_common || '').toLowerCase() === q ||
                  (ing.id || '').toLowerCase() === q.replace(/\s+/g, '_')
                );
                return match?.id || null;
              };

              const updateItems = (newItems: any[]) => updateField(newItems);

              const addItem = () => updateItems([...rawItems, { name: '', ingredient_id: null }]);
              const addGroup = () => updateItems([...rawItems, { group: 'Group Name', items: [{ name: '', ingredient_id: null }] }]);

              const updateEntry = (idx: number, patch: any) => {
                const next = [...rawItems];
                next[idx] = { ...next[idx], ...patch };
                updateItems(next);
              };
              const removeEntry = (idx: number) => updateItems(rawItems.filter((_: any, i: number) => i !== idx));

              const updateChild = (parentIdx: number, childIdx: number, patch: any) => {
                const next = [...rawItems];
                const group = { ...next[parentIdx], items: [...(next[parentIdx].items || [])] };
                group.items[childIdx] = { ...group.items[childIdx], ...patch };
                next[parentIdx] = group;
                updateItems(next);
              };
              const removeChild = (parentIdx: number, childIdx: number) => {
                const next = [...rawItems];
                const group = { ...next[parentIdx], items: (next[parentIdx].items || []).filter((_: any, i: number) => i !== childIdx) };
                next[parentIdx] = group;
                updateItems(next);
              };
              const addChild = (parentIdx: number) => {
                const next = [...rawItems];
                const group = { ...next[parentIdx], items: [...(next[parentIdx].items || []), { name: '', ingredient_id: null }] };
                next[parentIdx] = group;
                updateItems(next);
              };

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={addGroup}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">+ Group</button>
                      <button type="button" onClick={addItem}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">+ Item</button>
                    </div>
                  </div>
                  {rawItems.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No items. Click + Item or + Group to start.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {rawItems.map((entry: any, idx: number) => {
                        if (entry && entry.group !== undefined) {
                          // GROUP entry
                          return (
                            <div key={idx} className="border border-purple-200 rounded-lg overflow-hidden">
                              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-purple-50">
                                <span className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider">Group</span>
                                <input
                                  value={entry.group || ''}
                                  onChange={(e) => updateEntry(idx, { group: e.target.value })}
                                  className="flex-1 h-6 px-2 text-xs font-semibold border border-purple-200 rounded bg-white text-purple-800 focus:ring-1 focus:ring-purple-400"
                                  placeholder="Group name (e.g. Fresh Herbs)"
                                />
                                <button type="button" onClick={() => addChild(idx)}
                                  className="text-[10px] text-purple-600 hover:text-purple-800 px-1.5 py-0.5 rounded bg-white border border-purple-200 hover:bg-purple-50">+ Add</button>
                                <button type="button" onClick={() => removeEntry(idx)}
                                  className="text-red-400 hover:text-red-600 text-sm px-1 rounded hover:bg-red-50" title="Remove group">&times;</button>
                              </div>
                              <div className="px-2 py-1.5 space-y-1 bg-white">
                                {(entry.items || []).map((child: any, cidx: number) => {
                                  const linked = child.ingredient_id
                                    ? ingredientsCache.find((ing: AdminRecord) => ing.id === child.ingredient_id)
                                    : null;
                                  return (
                                    <div key={cidx} className="flex items-center gap-1.5 pl-3">
                                      <span className="text-gray-300 text-xs">└</span>
                                      <input
                                        value={child.name || ''}
                                        onChange={(e) => {
                                          const resolved = resolveIngredient(e.target.value);
                                          updateChild(idx, cidx, { name: e.target.value, ingredient_id: resolved });
                                        }}
                                        className={`flex-1 h-6 px-2 text-xs border rounded bg-white focus:ring-1 focus:ring-purple-300 ${linked ? 'border-green-300 text-green-800' : 'border-gray-200'}`}
                                        placeholder="Ingredient name"
                                      />
                                      {linked ? (
                                        <span className="text-[9px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full truncate max-w-[80px]" title={linked.id}>✓ {linked.name_common}</span>
                                      ) : (
                                        <span className="text-[9px] text-gray-300 w-[80px]">no link</span>
                                      )}
                                      <button type="button" onClick={() => removeChild(idx, cidx)}
                                        className="text-red-400 hover:text-red-600 text-sm px-1 rounded hover:bg-red-50">&times;</button>
                                    </div>
                                  );
                                })}
                                {(entry.items || []).length === 0 && (
                                  <p className="text-[10px] text-gray-400 italic pl-3">No children. Click + Add.</p>
                                )}
                              </div>
                            </div>
                          );
                        }
                        // PLAIN item entry
                        const linked = entry?.ingredient_id
                          ? ingredientsCache.find((ing: AdminRecord) => ing.id === entry.ingredient_id)
                          : null;
                        return (
                          <div key={idx} className="flex items-center gap-1.5">
                            <input
                              value={entry?.name || ''}
                              onChange={(e) => {
                                const resolved = resolveIngredient(e.target.value);
                                updateEntry(idx, { name: e.target.value, ingredient_id: resolved });
                              }}
                              className={`flex-1 h-7 px-2 text-xs border rounded bg-white focus:ring-1 focus:ring-blue-300 ${linked ? 'border-green-300 text-green-800' : 'border-gray-200'}`}
                              placeholder="Ingredient name"
                            />
                            {linked ? (
                              <span className="text-[9px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full truncate max-w-[90px]" title={linked.id}>✓ {linked.name_common}</span>
                            ) : (
                              <span className="text-[9px] text-gray-300 w-[90px]">no link</span>
                            )}
                            <button type="button" onClick={() => removeEntry(idx)}
                              className="text-red-400 hover:text-red-600 px-2 text-sm shrink-0 rounded-lg hover:bg-red-50 transition-colors">&times;</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (field.type === 'array') {
              const items: string[] = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',').map((s: string) => s.trim()) : []);
              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                    <button type="button" onClick={() => updateField([...items, ''])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">+ Add</button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No items. Click + Add to start.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item: string, idx: number) => (
                        <div key={idx} className="flex gap-1.5">
                          <input
                            value={item}
                            onChange={(e) => { const updated = [...items]; updated[idx] = e.target.value; updateField(updated); }}
                            className={`${inputCls} flex-1`}
                            placeholder={`${field.label} item ${idx + 1}`}
                          />
                          <button type="button" onClick={() => updateField(items.filter((_: string, i: number) => i !== idx))}
                            className="text-red-400 hover:text-red-600 px-2 text-sm shrink-0 rounded-lg hover:bg-red-50 transition-colors" title="Remove">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (field.type === 'number') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <input type="number" value={val ?? 0} onChange={(e) => updateField(parseInt(e.target.value) || 0)} placeholder={field.placeholder} className={inputCls} />
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <textarea value={typeof val === 'string' ? val : ''} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} className={textareaCls} />
                </div>
              );
            }

            // Default: text input
            return (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                <input value={typeof val === 'string' || typeof val === 'number' ? String(val) : val || ''} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} className={inputCls} />
              </div>
            );
          };

          // Section definitions — which sections belong to which tab
          const CULINARY_SECTIONS = new Set([
            'Media', 'Basic Info', 'Cooking Details', 'Ingredients',
            'Flavor Profile', 'Descriptions', 'Processing', 'Culinary Origin',
          ]);
          const HEALTH_SECTIONS = new Set([
            'Nutrition Data', 'Hazards & Risks', 'Health & Scoring',
            'Functions & Benefits', 'Thresholds & Range', 'Food Sources',
            'Detailed Sections', 'Deficiency & Excess', 'Interactions',
            'Detox & Exposure', 'References & Meta', 'Summary',
            'Chemistry', 'Identity', 'Scoring',
          ]);
          const CONTENT_SECTIONS = new Set(['Content']);

          // Tabs apply to recipes, ingredients, products, elements
          const useModalTabs = ['recipes', 'ingredients', 'products', 'elements'].includes(activeTab);

          // Group fields by section
          const sections = new Map<string, FieldConfig[]>();
          const unsectioned: FieldConfig[] = [];
          const priorityKeys = ['name', 'name_common', 'email'];
          const priorityFields = editFields.filter(f => priorityKeys.includes(f.key));
          const rest = editFields.filter(f => !priorityKeys.includes(f.key));

          rest.forEach(f => {
            if (f.section) {
              if (!sections.has(f.section)) sections.set(f.section, []);
              sections.get(f.section)!.push(f);
            } else {
              unsectioned.push(f);
            }
          });

          const renderSections = (filterFn?: (sectionName: string) => boolean) =>
            [...sections.entries()]
              .filter(([sectionName]) => !filterFn || filterFn(sectionName))
              .map(([sectionName, fields]) => {
                const isMediaSection = sectionName === 'Media';
                const isBasicInfoSection = sectionName === 'Basic Info';
                const sectionCols = isMediaSection ? 5 : isBasicInfoSection ? 3 : 2;
                const sKey = `sec_${activeTab}_${sectionName}`;
                const secOpen = isSectionOpen(sKey);
                const showAiButton = ['Basic Info', 'Processing', 'Nutrition Data', 'Hazards & Risks', 'Ingredients', 'Descriptions', 'Flavor Profile', 'Cooking Details', 'Identity', 'Summary', 'Culinary Origin', 'Media'].includes(sectionName);
                const isFillingSec = aiFillingSection === sectionName;
                return (
                  <div key={sectionName} className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={() => toggleSection(sKey)}
                        className="flex-1 flex items-center gap-2 group cursor-pointer">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{sectionName}</h4>
                        <div className="flex-1 h-px bg-gray-100" />
                        {secOpen ? <ChevronUp className="w-3 h-3 text-gray-300 group-hover:text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
                      </button>
                      {showAiButton && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleAiFillSection(sectionName); }}
                          disabled={isFillingSec || aiFillingFields}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                          title={`AI Enrich ${sectionName}`}>
                          {isFillingSec ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          {isFillingSec ? 'Filling...' : 'AI Enrich'}
                        </button>
                      )}
                    </div>
                    {secOpen && (
                      <div className={`grid gap-${isMediaSection ? '3' : '4'}`} style={{ gridTemplateColumns: `repeat(${sectionCols}, minmax(0, 1fr))` }}>
                        {fields.map(f => (
                          <div key={f.key} style={f.colSpan === 2 && !isMediaSection ? { gridColumn: `span ${sectionCols} / span ${sectionCols}` } : undefined}>
                            {renderEditField(f)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });

          return (
            <div className="space-y-4">
              {/* Priority fields — always at top */}
              {(priorityFields.length > 0 || unsectioned.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {[...priorityFields, ...unsectioned].map(f => (
                    <div key={f.key} className={f.colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
                      {renderEditField(f)}
                    </div>
                  ))}
                </div>
              )}

              {useModalTabs ? (
                <>
                  {/* Culinary / Health / Content tab switcher */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mt-2">
                    {(['culinary', 'health', 'content'] as const)
                      .filter(t => t !== 'culinary' || ['recipes', 'ingredients', 'products'].includes(activeTab))
                      .map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditModalTab(t)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            editModalTab === t
                              ? t === 'culinary'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : t === 'health'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-indigo-600 text-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {t === 'culinary' ? '🍳 Culinary' : t === 'health' ? '🧬 Health' : '📚 Content'}
                        </button>
                      ))}
                  </div>

                  {/* Culinary tab: flavour, texture, steps, ingredients, descriptions */}
                  {editModalTab === 'culinary' && (
                    <div className="space-y-0">
                      {renderSections(s => CULINARY_SECTIONS.has(s))}
                    </div>
                  )}

                  {/* Health tab: nutrition, micros, risks, scoring, references */}
                  {editModalTab === 'health' && (
                    <div className="space-y-0">
                      {renderSections(s => HEALTH_SECTIONS.has(s) || (!CULINARY_SECTIONS.has(s) && !HEALTH_SECTIONS.has(s) && !CONTENT_SECTIONS.has(s)))}
                    </div>
                  )}

                  {/* Content tab: scientific papers + social content */}
                  {editModalTab === 'content' && (
                    <div className="space-y-0">
                      {renderSections(s => CONTENT_SECTIONS.has(s))}
                    </div>
                  )}
                </>
              ) : (
                /* Non-tabbed tabs (waitlist, elements, scans) — flat layout */
                <div className="space-y-0">
                  {renderSections()}
                </div>
              )}
            </div>
          );
        })()}
      </AdminModal>
      {/* AI Create Prompt Dialog */}
      <AdminModal
        open={showAiCreatePrompt}
        onClose={() => { setShowAiCreatePrompt(false); setAiCreatePrompt(''); }}
        title={`AI Create ${adminFieldConfig[activeTab]?.label || 'Record'}`}
        subtitle="AI will generate a complete record with all fields populated"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowAiCreatePrompt(false); setAiCreatePrompt(''); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleAiCreate(aiCreatePrompt || undefined)}
              disabled={aiCreating}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {aiCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">What should AI create? (optional)</Label>
            <Input
              value={aiCreatePrompt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiCreatePrompt(e.target.value)}
              placeholder={`e.g. "${activeTab === 'elements' ? 'Vitamin D3' : activeTab === 'ingredients' ? 'Organic Quinoa' : activeTab === 'recipes' ? 'Mediterranean Salad' : 'Organic Blueberry Yogurt'}"`}
              className="mt-1.5"
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAiCreate(aiCreatePrompt || undefined); }}
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty for a random AI-generated {adminFieldConfig[activeTab]?.label?.toLowerCase() || 'record'}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <p className="text-xs text-purple-700">
              <strong>How it works:</strong> AI will generate all fields (name, description, nutrition data, categories, etc.) based on real health/nutrition knowledge, then insert the record directly into the database. You can edit it afterwards.
            </p>
          </div>
        </div>
      </AdminModal>

      <FloatingDebugMenu accessToken={accessToken} />
      <AdminDebugPanel />
    </div>
  );
}
