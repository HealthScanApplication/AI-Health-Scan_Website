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
  Download,
  Wrench,
  Flame,
  CheckCircle,
  AlertCircle,
  X,
  Bell,
  Send,
  Dumbbell,
  HeartPulse,
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
import { CookingToolsField, type EquipmentRecord } from './admin/fields/CookingToolsField';
import { CatalogItemTag } from './admin/shared/CatalogItemTag';
import { IconPickerField, LucideIconPreview } from './admin/IconPickerField';
import { useAdminRecords, type AdminRecord as AdminRecordType } from '../hooks/useAdminRecords';

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

// Minimal MD5 implementation for Gravatar hashing
function md5(str: string): string {
  const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  const add = (x: number, y: number) => (x + y) | 0;
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);
  const T = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0);
  const S = [[7,12,17,22],[5,9,14,20],[4,11,16,23],[6,10,15,21]];
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) { bytes.push((c >> 6) | 192); bytes.push((c & 63) | 128); }
    else { bytes.push((c >> 12) | 224); bytes.push(((c >> 6) & 63) | 128); bytes.push((c & 63) | 128); }
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push(i < 4 ? (bitLen >>> (i * 8)) & 0xff : 0);
  let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let i = 0; i < bytes.length; i += 64) {
    const M = Array.from({ length: 16 }, (_, j) =>
      bytes[i + j*4] | (bytes[i + j*4+1] << 8) | (bytes[i + j*4+2] << 16) | (bytes[i + j*4+3] << 24));
    let [aa, bb, cc, dd] = [a, b, c, d];
    for (let j = 0; j < 64; j++) {
      let fn: number, g: number;
      if (j < 16)      { fn = F(bb, cc, dd); g = j; }
      else if (j < 32) { fn = G(bb, cc, dd); g = (5*j + 1) % 16; }
      else if (j < 48) { fn = H(bb, cc, dd); g = (3*j + 5) % 16; }
      else             { fn = I(bb, cc, dd); g = (7*j) % 16; }
      const temp = dd; dd = cc; cc = bb;
      bb = add(bb, rotl(add(add(aa, fn), add(M[g], T[j])), S[Math.floor(j/16)][j%4]));
      aa = temp;
    }
    a = add(a, aa); b = add(b, bb); c = add(c, cc); d = add(d, dd);
  }
  return [a, b, c, d].map(v =>
    Array.from({ length: 4 }, (_, i) => ((v >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')).join('')
  ).join('');
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

// ── Notification Tester Component ──
function NotificationTester({ accessToken }: { accessToken: string }) {
  const [environment, setEnvironment] = useState<'staging' | 'production'>('staging');
  const [userEmail, setUserEmail] = useState('');
  const [notificationType, setNotificationType] = useState<'push' | 'email' | 'both'>('push');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendNotification = async () => {
    if (!userEmail || !title || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/send-test-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            environment,
            userEmail,
            notificationType,
            title,
            message,
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setResult({ success: true, message: data.message || 'Notification sent successfully!' });
        toast.success('Notification sent!');
        // Clear form
        setUserEmail('');
        setTitle('');
        setMessage('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to send notification' });
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message });
      toast.error('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Test Notifications</h2>
          <p className="text-xs text-gray-500">Send test push notifications or emails to users</p>
        </div>
      </div>

      {/* Environment Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Environment</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEnvironment('staging')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              environment === 'staging'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
            }`}
          >
            🧪 Staging
          </button>
          <button
            type="button"
            onClick={() => setEnvironment('production')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              environment === 'production'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
            }`}
          >
            🚀 Production
          </button>
        </div>
      </div>

      {/* User Email */}
      <div className="space-y-2">
        <Label htmlFor="notif-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          User Email
        </Label>
        <Input
          id="notif-email"
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full"
        />
      </div>

      {/* Notification Type */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notification Type</Label>
        <div className="flex gap-2">
          {(['push', 'email', 'both'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setNotificationType(type)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                notificationType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
              }`}
            >
              {type === 'push' ? '📱 Push' : type === 'email' ? '📧 Email' : '📱📧 Both'}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="notif-title" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Title
        </Label>
        <Input
          id="notif-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          className="w-full"
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="notif-message" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Message
        </Label>
        <Textarea
          id="notif-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Notification message..."
          rows={4}
          className="w-full"
        />
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSendNotification}
        disabled={sending || !userEmail || !title || !message}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </>
        )}
      </Button>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg p-4 ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <p className="text-sm font-semibold">{result.success ? '✓ Success' : '✗ Error'}</p>
          <p className="text-xs mt-1">{result.message}</p>
        </div>
      )}

      {/* Warning */}
      {environment === 'production' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <p className="font-semibold">⚠️ Production Environment</p>
          <p className="mt-1">You are sending to LIVE users. Double-check the email and message before sending.</p>
        </div>
      )}
    </div>
  );
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

// A single cooking step: { text: string, image_url?: string, ingredient_ids?: string[], equipment_ids?: string[] }
type CookingStep = { text: string; image_url?: string; ingredient_ids?: string[]; equipment_ids?: string[] };

// Common cooking tools for suggestions
const COMMON_COOKING_TOOLS: { name: string; category: string }[] = [
  { name: 'Chef\'s knife', category: 'Cutting' },
  { name: 'Cutting board', category: 'Cutting' },
  { name: 'Paring knife', category: 'Cutting' },
  { name: 'Grater / Zester', category: 'Cutting' },
  { name: 'Peeler', category: 'Cutting' },
  { name: 'Large skillet', category: 'Cookware' },
  { name: 'Wok', category: 'Cookware' },
  { name: 'Medium pot', category: 'Cookware' },
  { name: 'Large pot', category: 'Cookware' },
  { name: 'Saucepan', category: 'Cookware' },
  { name: 'Sheet pan', category: 'Baking' },
  { name: 'Baking dish', category: 'Baking' },
  { name: 'Loaf pan', category: 'Baking' },
  { name: 'Parchment paper', category: 'Baking' },
  { name: 'Mixing bowl', category: 'Prep' },
  { name: 'Wooden spoon', category: 'Utensils' },
  { name: 'Spatula', category: 'Utensils' },
  { name: 'Whisk', category: 'Utensils' },
  { name: 'Tongs', category: 'Utensils' },
  { name: 'Ladle', category: 'Utensils' },
  { name: 'Measuring spoons', category: 'Measuring' },
  { name: 'Measuring cups', category: 'Measuring' },
  { name: 'Kitchen scale', category: 'Measuring' },
  { name: 'Blender', category: 'Appliances' },
  { name: 'Immersion blender', category: 'Appliances' },
  { name: 'Food processor', category: 'Appliances' },
  { name: 'Oven', category: 'Appliances' },
  { name: 'Colander / Strainer', category: 'Prep' },
  { name: 'Garlic press', category: 'Prep' },
];

// ─── Shared CatalogItemTag ─────────────────────────────────────────────────
// CatalogItemTag component moved to src/components/admin/shared/CatalogItemTag.tsx

// ─── CookingToolsField ─────────────────────────────────────────────────────
// CookingToolsField component moved to src/components/admin/fields/CookingToolsField.tsx

// ─── RecipeIngredientsToolsField ───────────────────────────────────────────
// 2-column: left = linked ingredients, right = tools
function RecipeIngredientsToolsField({
  linkedIngredientsVal, toolsVal,
  updateLinkedIngredients, updateTools,
  ingredientsCache, ingredientSearchQuery, setIngredientSearchQuery,
  accessToken,
}: {
  linkedIngredientsVal: any;
  toolsVal: any;
  updateLinkedIngredients: (v: any) => void;
  updateTools: (v: any) => void;
  ingredientsCache: any[];
  ingredientSearchQuery: string;
  setIngredientSearchQuery: (v: string) => void;
  accessToken?: string;
}) {
  const linkedIds: string[] = Array.isArray(linkedIngredientsVal) ? linkedIngredientsVal : [];
  const linkedIngredients = ingredientsCache.filter((ing: any) => linkedIds.includes(ing.id));
  const filteredIngredients = ingredientsCache.filter((ing: any) => {
    if (!ingredientSearchQuery) return true;
    const q = ingredientSearchQuery.toLowerCase();
    return (ing.name_common || ing.name || '').toLowerCase().includes(q) || (ing.category || '').toLowerCase().includes(q);
  });
  const availableIngredients = filteredIngredients.filter((ing: any) => !linkedIds.includes(ing.id)).slice(0, 8);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* LEFT: Ingredients */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Ingredients <span className="text-gray-400 font-normal normal-case">({linkedIds.length} linked)</span>
        </Label>
        {linkedIngredients.length > 0 && (
          <div className="space-y-1.5">
            {linkedIngredients.map((ing: any) => (
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
                  {ing.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-200 text-emerald-800">{ing.category}</span>}
                </div>
                <button type="button" onClick={() => updateLinkedIngredients(linkedIds.filter((id: string) => id !== ing.id))}
                  className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white/80 text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs">&times;</button>
              </div>
            ))}
          </div>
        )}
        <input
          value={ingredientSearchQuery}
          onChange={(e) => setIngredientSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          placeholder="Search ingredients to link..."
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {(ingredientSearchQuery || linkedIngredients.length === 0) && availableIngredients.length > 0 && (
          <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {availableIngredients.map((ing: any) => (
              <button key={ing.id} type="button"
                onClick={() => { updateLinkedIngredients([...linkedIds, ing.id]); setIngredientSearchQuery(''); }}
                className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
              >
                {ing.image_url ? (
                  <img src={ing.image_url} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-emerald-100 text-emerald-700">
                    {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="font-medium flex-1 truncate">{ing.name_common || ing.name}</span>
                <span className="text-[9px] text-gray-400 flex-shrink-0">{ing.category}</span>
              </button>
            ))}
          </div>
        )}
        {ingredientsCache.length === 0 && <p className="text-xs text-gray-400 italic">Loading ingredients...</p>}
      </div>

      {/* RIGHT: Tools */}
      <CookingToolsField val={toolsVal} updateField={updateTools} accessToken={accessToken} />
    </div>
  );
}

// All image variants stored on an ingredient record
const INGREDIENT_IMAGE_KEYS: { key: string; label: string }[] = [
  { key: 'image_url', label: 'Main' },
  { key: 'image_url_raw', label: 'Raw / Whole' },
  { key: 'image_url_cut', label: 'Cut / Sliced' },
  { key: 'image_url_cubed', label: 'Cubed / Diced' },
  { key: 'image_url_cooked', label: 'Cooked' },
  { key: 'image_url_powdered', label: 'Powdered' },
];

function CookingStepsField({ val, updateField, accessToken, linkedIngredients, allIngredients, recordData, catalogEquipment, onUpdateRecord }: {
  val: any;
  updateField: (v: any) => void;
  accessToken: string;
  linkedIngredients: any[];
  allIngredients: any[];
  recordData: any;
  catalogEquipment?: EquipmentRecord[];
  onUpdateRecord?: (updates: Record<string, any>) => void;
}) {
  const steps: CookingStep[] = React.useMemo(() => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((s: any) =>
        typeof s === 'string'
          ? { text: s, image_url: '', ingredient_ids: [], equipment_ids: [] }
          : { 
              text: s.text || '', 
              image_url: s.image_url || '', 
              ingredient_ids: Array.isArray(s.ingredient_ids) ? s.ingredient_ids : [],
              equipment_ids: Array.isArray(s.equipment_ids) ? s.equipment_ids : []
            }
      );
    }
    return [];
  }, [val]);

  const baseServings: number = Number(recordData?.servings) || 4;
  const [previewServings, setPreviewServings] = React.useState<number>(baseServings);
  const [uploadingIdx, setUploadingIdx] = React.useState<number | null>(null);
  const [pickerIdx, setPickerIdx] = React.useState<number | null>(null);
  const [generatingSteps, setGeneratingSteps] = React.useState(false);
  const [customImageIdx, setCustomImageIdx] = React.useState<Set<number>>(new Set());
  const [linkIngredientIdx, setLinkIngredientIdx] = React.useState<number | null>(null);
  const [linkEquipmentIdx, setLinkEquipmentIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    setPreviewServings(Number(recordData?.servings) || 4);
  }, [recordData?.servings]);

  // Auto-assign images to steps that have no image when ingredients/equipment become available
  React.useEffect(() => {
    if (!steps.length || (allIngredients.length === 0 && linkedIngredients.length === 0 && (!catalogEquipment || catalogEquipment.length === 0))) return;
    const hasUnimaged = steps.some((s, i) => !s.image_url && !customImageIdx.has(i) && s.text);
    if (!hasUnimaged) return;
    const nx = steps.map((s, i) => {
      if (s.image_url || customImageIdx.has(i) || !s.text) return s;
      const img = getAutoImage(s.text);
      return img ? { ...s, image_url: img } : s;
    });
    const changed = nx.some((s, i) => s.image_url !== steps[i].image_url);
    if (changed) updateField(nx);
  }, [linkedIngredients, allIngredients, catalogEquipment]); // eslint-disable-line react-hooks/exhaustive-deps

  const scaleStepText = React.useCallback((text: string): string => {
    if (!text || previewServings === baseServings) return text;
    const ratio = previewServings / baseServings;
    const uf: Record<string, number> = { '½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875 };
    const fmt = (n: number): string => {
      if (n === Math.round(n)) return String(Math.round(n));
      const fracs: [number, string][] = [[0.5,'½'],[0.25,'¼'],[0.75,'¾'],[1/3,'⅓'],[2/3,'⅔'],[0.125,'⅛']];
      for (const [fv, sym] of fracs) {
        if (Math.abs(n - Math.round(n - fv) - fv) < 0.01) { const w = Math.round(n - fv); return w > 0 ? `${w}${sym}` : sym; }
      }
      return n < 10 ? parseFloat(n.toFixed(2)).toString() : Math.round(n).toString();
    };
    let r = text.replace(new RegExp(Object.keys(uf).join('|'), 'g'), (m) => fmt(uf[m] * ratio));
    r = r.replace(/(\d+(?:\.\d+)?)\s*(ml|g|kg|l|liters?|litres?|cups?|tbsp|tsp|oz|lb|lbs|pieces?|cloves?|stalks?|heads?|medium|large|small|bunch|bunches|cans?|slices?|strips?|halves?|halved|whole|portions?)?/gi,
      (match, num, unit) => { const n = parseFloat(num); if (n > 500) return match; const sc = fmt(n * ratio); return unit ? `${sc} ${unit}` : sc; });
    return r;
  }, [previewServings, baseServings]);

  const getAutoImage = React.useCallback((text: string): string => {
    const lower = (text || '').toLowerCase();
    // ONLY use linkedIngredients (ingredients actually in this recipe)
    const pool = linkedIngredients;
    
    // 1. Try ingredient mentioned by name in the step text
    if (pool.length > 0) {
      const mentioned = pool.filter((ing: any) => { 
        const n = (ing.name_common || ing.name || '').toLowerCase(); 
        return n.length > 2 && lower.includes(n); 
      });
      if (mentioned.length > 0) {
        const f = mentioned[0];
        // Match image variant to cooking action
        if ((lower.includes('cut')||lower.includes('slice')||lower.includes('chop')) && f.image_url_cut) return f.image_url_cut;
        if ((lower.includes('cube')||lower.includes('dice')) && f.image_url_cubed) return f.image_url_cubed;
        if ((lower.includes('cook')||lower.includes('sauté')||lower.includes('fry')||lower.includes('roast')||lower.includes('bake')) && f.image_url_cooked) return f.image_url_cooked;
        if (lower.includes('powder') && f.image_url_powdered) return f.image_url_powdered;
        if (f.image_url) return f.image_url;
      }
    }
    
    // 2. Try equipment from recipe's equipment list (not all catalog)
    const recipeEquipment: string[] = Array.isArray(recordData?.equipment) ? recordData.equipment : [];
    if (catalogEquipment && catalogEquipment.length > 0 && recipeEquipment.length > 0) {
      const eq = catalogEquipment.find(e => 
        e.image_url && 
        recipeEquipment.some(name => name.toLowerCase() === e.name.toLowerCase()) &&
        lower.includes(e.name.toLowerCase())
      );
      if (eq?.image_url) return eq.image_url;
    }
    
    // 3. Fallback: first LINKED ingredient with any image (from this recipe only)
    if (pool.length > 0) {
      const first = pool.find((ing: any) => ing.image_url);
      if (first?.image_url) return first.image_url;
    }
    
    // 4. Fallback: first equipment from THIS recipe with an image
    if (catalogEquipment && catalogEquipment.length > 0 && recipeEquipment.length > 0) {
      const first = catalogEquipment.find(e => 
        e.image_url && recipeEquipment.some(name => name.toLowerCase() === e.name.toLowerCase())
      );
      if (first?.image_url) return first.image_url;
    }
    
    // 5. No fallback - return empty to show placeholder instead of random image
    return '';
  }, [linkedIngredients, catalogEquipment, recordData]);

  const getMentionedIngredients = (text: string) => {
    // Search ALL ingredients (not just linked) so steps always show matching ingredients
    const pool = linkedIngredients.length > 0 ? linkedIngredients : allIngredients;
    if (!text || !pool.length) return [];
    const lower = text.toLowerCase();
    return pool.filter((ing: any) => { const n = (ing.name_common || ing.name || '').toLowerCase(); return n.length > 2 && lower.includes(n); });
  };

  const getMentionedTools = (text: string): string[] => {
    const eq: string[] = Array.isArray(recordData?.equipment) ? recordData.equipment : [];
    if (!text || !eq.length) return [];
    const lower = text.toLowerCase();
    return eq.filter((t: string) => lower.includes(t.toLowerCase()));
  };

  const update = (ns: CookingStep[]) => {
    updateField(ns);
    // Hero image should NEVER be auto-changed - it's set manually by user
    // The reverse could happen: hero image could be copied TO last step if needed
  };
  const addStep = () => update([...steps, { text: '', image_url: '' }]);
  const removeStep = (i: number) => { setCustomImageIdx(prev => { const s = new Set(prev); s.delete(i); return s; }); update(steps.filter((_, idx) => idx !== i)); };
  const moveStep = (i: number, dir: -1 | 1) => { const nx = [...steps]; const j = i + dir; if (j < 0 || j >= nx.length) return; [nx[i], nx[j]] = [nx[j], nx[i]]; update(nx); };
  const updateText = (i: number, text: string) => {
    const nx = [...steps];
    const autoImg = !customImageIdx.has(i) ? getAutoImage(text) : '';
    nx[i] = { ...nx[i], text, image_url: autoImg || nx[i].image_url || '' };
    update(nx);
  };
  const toggleStepIngredient = (stepIdx: number, ingId: string) => {
    const nx = [...steps];
    const cur: string[] = nx[stepIdx].ingredient_ids || [];
    nx[stepIdx] = { ...nx[stepIdx], ingredient_ids: cur.includes(ingId) ? cur.filter(id => id !== ingId) : [...cur, ingId] };
    update(nx);
  };
  const toggleStepEquipment = (stepIdx: number, eqId: string) => {
    const nx = [...steps];
    const cur: string[] = nx[stepIdx].equipment_ids || [];
    nx[stepIdx] = { ...nx[stepIdx], equipment_ids: cur.includes(eqId) ? cur.filter(id => id !== eqId) : [...cur, eqId] };
    update(nx);
  };
  const setStepImage = (i: number, image_url: string, isCustom = true) => {
    const nx = [...steps]; nx[i] = { ...nx[i], image_url }; update(nx);
    if (isCustom) setCustomImageIdx(prev => new Set(prev).add(i));
    setPickerIdx(null);
  };
  const clearCustomImage = (i: number) => {
    setCustomImageIdx(prev => { const s = new Set(prev); s.delete(i); return s; });
    const nx = [...steps]; nx[i] = { ...nx[i], image_url: getAutoImage(nx[i].text) }; update(nx);
  };

  const handleFileUpload = async (i: number, file: File) => {
    setUploadingIdx(i);
    try {
      toast.info('Uploading image...');
      const url = await uploadFileToStorage(file, 'catalog-media', accessToken);
      setStepImage(i, url, true);
      toast.success('Image uploaded!');
    } catch (err: any) { toast.error(`Upload failed: ${(err?.message || '').slice(0, 80)}`); }
    finally { setUploadingIdx(null); }
  };

  const handleDrop = async (i: number, e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await handleFileUpload(i, file);
  };

  const handleAiGenerateSteps = async () => {
    const recipeName = recordData?.name_common || recordData?.name;
    if (!recipeName) { toast.error('Recipe needs a name first'); return; }
    setGeneratingSteps(true);
    try {
      const ingredientList = linkedIngredients.length > 0
        ? linkedIngredients.map((ing: any) => ing.name_common || ing.name).join(', ')
        : (recordData?.ingredients_text || '');
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-generate-steps`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName, servings: recordData?.servings || 4, prepTime: recordData?.prep_time || '', cookTime: recordData?.cook_time || '', difficulty: recordData?.difficulty || '', cuisine: recordData?.cuisine || '', ingredientList }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      const generated: CookingStep[] = (data.steps || []).map((s: any) => {
        const t = typeof s === 'string' ? s : (s.text || s);
        return { text: t, image_url: getAutoImage(t) };
      });
      setCustomImageIdx(new Set());
      update(generated);
      toast.success(`Generated ${generated.length} steps!`);
    } catch (err: any) { toast.error(`AI generate failed: ${(err?.message || '').slice(0, 80)}`); }
    finally { setGeneratingSteps(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">🍳 Cooking Steps</Label>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={handleAiGenerateSteps} disabled={generatingSteps}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 disabled:opacity-50 transition-colors">
            {generatingSteps ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generatingSteps ? '…' : 'AI Enrich'}
          </button>
          <button type="button" onClick={addStep}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
            + Add Step
          </button>
        </div>
      </div>

      {/* Serving scaler */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex-wrap">
        <span className="text-[11px] font-semibold text-amber-700 flex-shrink-0">Preview servings:</span>
        <button type="button" onClick={() => setPreviewServings(s => Math.max(1, s - 1))}
          className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center hover:bg-amber-300 flex-shrink-0">−</button>
        <span className="text-sm font-bold text-amber-800 w-6 text-center">{previewServings}</span>
        <button type="button" onClick={() => setPreviewServings(s => s + 1)}
          className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center hover:bg-amber-300 flex-shrink-0">+</button>
        <span className="text-[10px] text-amber-600 flex-1 min-w-0">
          {previewServings === baseServings ? `Base (${baseServings} srv)` : `×${(previewServings/baseServings).toFixed(2).replace(/\.?0+$/,'')} from ${baseServings}`}
        </span>
        {previewServings !== baseServings && (
          <button type="button" onClick={() => setPreviewServings(baseServings)} className="text-[10px] text-amber-600 hover:text-amber-800 underline flex-shrink-0">Reset</button>
        )}
        {recordData?.prep_time && <span className="text-[10px] text-gray-400 flex-shrink-0">· {recordData.prep_time} prep</span>}
        {recordData?.cook_time && <span className="text-[10px] text-gray-400 flex-shrink-0">· {recordData.cook_time} cook</span>}
      </div>

      {steps.length === 0 && !generatingSteps && (
        <p className="text-xs text-gray-400 italic">No steps yet. Use AI Generate or + Add Step.</p>
      )}
      {generatingSteps && (
        <div className="flex items-center gap-2 py-4 justify-center text-purple-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating professional steps with quantities...
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, i) => {
          const mentionedByText = getMentionedIngredients(step.text);
          const pinnedIds: string[] = step.ingredient_ids || [];
          const pinnedIngs = linkedIngredients.filter((ing: any) => pinnedIds.includes(ing.id) && !mentionedByText.find((m: any) => m.id === ing.id));
          const mentioned = [...mentionedByText, ...pinnedIngs];
          const mentionedTools = getMentionedTools(step.text);
          const pinnedEqIds: string[] = step.equipment_ids || [];
          const pinnedEquipment = catalogEquipment?.filter((eq: EquipmentRecord) => pinnedEqIds.includes(eq.id)) || [];
          const isPickerOpen = pickerIdx === i;
          const isLinkOpen = linkIngredientIdx === i;
          const isEquipLinkOpen = linkEquipmentIdx === i;
          const isCustomImg = customImageIdx.has(i);
          const displayImg = step.image_url || getAutoImage(step.text);

          return (
            <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Step controls bar */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="flex-1" />
                {isCustomImg && (
                  <button type="button" onClick={() => clearCustomImage(i)}
                    className="text-[9px] text-gray-400 hover:text-amber-600 px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-amber-50 transition-colors" title="Reset to auto image">
                    ↺ auto
                  </button>
                )}
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5 rounded" title="Move up">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5 rounded" title="Move down">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setLinkIngredientIdx(isLinkOpen ? null : i)}
                  className={`flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors ${isLinkOpen ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-300'}`}
                  title="Link ingredients to this step">
                  {'🥗'} {pinnedIds.length > 0 ? pinnedIds.length : '+'}
                </button>
                <button type="button" onClick={() => setLinkEquipmentIdx(isEquipLinkOpen ? null : i)}
                  className={`flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors ${isEquipLinkOpen ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white border-gray-200 text-gray-400 hover:text-orange-600 hover:border-orange-300'}`}
                  title="Link equipment to this step">
                  {'🔧'} {pinnedEqIds.length > 0 ? pinnedEqIds.length : '+'}
                </button>
                <button type="button" onClick={() => removeStep(i)}
                  className="text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50 transition-colors text-sm font-bold">&times;</button>
              </div>

              {/* Main body: instruction text LEFT | HERO IMAGE right */}
              <div className="flex gap-0">
                {/* LEFT column: instruction text + tags below */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Instruction textarea + scaled preview */}
                  <div className="flex-1 p-3 space-y-2">
                    <textarea
                      value={step.text}
                      onChange={(e) => updateText(i, e.target.value)}
                      placeholder={`Step ${i + 1}: e.g. "Heat 15 ml olive oil in a large wok over medium-high for 30–60 sec."`}
                      rows={3}
                      className={inputCls}
                    />
                    {previewServings !== baseServings && step.text && (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5">
                        <p className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Preview ({previewServings} srv)</p>
                        <p className="text-xs text-amber-900 leading-relaxed">{scaleStepText(step.text)}</p>
                      </div>
                    )}
                  </div>

                  {/* Ingredient + equipment tags — below the text, inside left column */}
                  <div className="px-3 pb-3 pt-0 flex flex-wrap gap-1.5 border-t border-gray-100">
                    {mentioned.length === 0 && mentionedTools.length === 0 && pinnedEquipment.length === 0 && step.text && (
                      <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">⚠ No ingredients/equipment detected</span>
                    )}
                    {mentioned.map((ing: any) => (
                      <CatalogItemTag
                        key={ing.id}
                        name={ing.name_common || ing.name || ''}
                        imageUrl={ing.image_url}
                        fallbackColor="emerald"
                      />
                    ))}
                    {mentionedTools.map((t: string) => {
                      const eqRecord = catalogEquipment?.find(e => e.name.toLowerCase() === t.toLowerCase());
                      return (
                        <CatalogItemTag
                          key={t}
                          name={t}
                          imageUrl={eqRecord?.image_url}
                          fallbackColor="orange"
                        />
                      );
                    })}
                    {pinnedEquipment.map((eq: EquipmentRecord) => (
                      <CatalogItemTag
                        key={eq.id}
                        name={eq.name}
                        imageUrl={eq.image_url}
                        fallbackColor="orange"
                      />
                    ))}
                  </div>
                </div>

                {/* RIGHT: hero image — full height of card body */}
                <div
                  className={`relative flex-shrink-0 w-32 self-stretch cursor-pointer overflow-hidden ${displayImg ? 'bg-gray-50' : 'bg-gradient-to-b from-blue-50 to-blue-100 border-l-2 border-blue-200'} ${isPickerOpen ? 'ring-2 ring-inset ring-blue-400' : ''}`}
                  style={{ minHeight: '110px' }}
                  onClick={() => setPickerIdx(isPickerOpen ? null : i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(i, e)}
                  title="Click to pick or drag an image"
                >
                  {displayImg ? (
                    <>
                      <img src={displayImg} alt="" className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {isCustomImg && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" title="Custom image" />}
                      <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-white/80 font-medium">change</span>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 gap-1.5">
                      <ImageIcon className="w-7 h-7" />
                      <span className="text-[9px] text-center leading-tight px-1 font-bold">Pick image</span>
                      <span className="text-[7px] text-center text-blue-300">click or drop</span>
                    </div>
                  )}
                  {uploadingIdx === i && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                  <label className="absolute bottom-0 left-0 right-0 h-5 cursor-pointer opacity-0" title="Upload image">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(i, f); }} />
                  </label>
                </div>
              </div>

              {/* Ingredient link panel */}
              {isLinkOpen && (
                <div className="border-t border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Link ingredients to this step</p>
                    <button type="button" onClick={() => setLinkIngredientIdx(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  {linkedIngredients.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No linked ingredients — link ingredients in col 2 first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedIngredients.map((ing: any) => {
                        const isPinned = pinnedIds.includes(ing.id);
                        return (
                          <button key={ing.id} type="button" onClick={() => toggleStepIngredient(i, ing.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${isPinned ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700'}`}>
                            {ing.image_url ? (
                              <img src={ing.image_url} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" />
                            ) : (
                              <span className="w-4 h-4 rounded bg-emerald-200 text-emerald-700 text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                                {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                              </span>
                            )}
                            {ing.name_common || ing.name}
                            {isPinned && <span className="text-emerald-500 font-bold leading-none">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Equipment link panel */}
              {isEquipLinkOpen && (
                <div className="border-t border-orange-100 bg-orange-50/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide">Link equipment to this step</p>
                    <button type="button" onClick={() => setLinkEquipmentIdx(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  {!catalogEquipment || catalogEquipment.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No equipment in catalog — add equipment to catalog_equipment table first.</p>
                  ) : (() => {
                    // Group equipment by category
                    const grouped = catalogEquipment.reduce((acc: Record<string, EquipmentRecord[]>, eq) => {
                      const cat = eq.category || 'Other';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(eq);
                      return acc;
                    }, {});
                    const categories = Object.keys(grouped).sort();
                    
                    return (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {categories.map(category => (
                          <div key={category}>
                            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">{category}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {grouped[category].map((eq: EquipmentRecord) => {
                                const isPinned = pinnedEqIds.includes(eq.id);
                                return (
                                  <button key={eq.id} type="button" onClick={() => toggleStepEquipment(i, eq.id)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${isPinned ? 'bg-orange-100 border-orange-400 text-orange-800' : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-700'}`}>
                                    {eq.image_url ? (
                                      <img src={eq.image_url} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" onError={(e) => {
                                        console.error('[Equipment] Image failed to load:', eq.name, eq.image_url);
                                        e.currentTarget.style.display = 'none';
                                      }} />
                                    ) : (
                                      <span className="w-4 h-4 rounded bg-orange-200 text-orange-700 text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                                        {(eq.name || '?')[0].toUpperCase()}
                                      </span>
                                    )}
                                    {eq.name}
                                    {isPinned && <span className="text-orange-500 font-bold leading-none">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Image picker panel */}
              {isPickerOpen && (
                <div className="border-t border-gray-100 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pick from ingredients & equipment</p>
                    <button type="button" onClick={() => setPickerIdx(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {/* Mentioned ingredients (from step text) */}
                    {(() => {
                      const mentionedInPicker = getMentionedIngredients(step.text);
                      const otherPool = (linkedIngredients.length > 0 ? linkedIngredients : allIngredients).filter((ing: any) => !mentionedInPicker.find((m: any) => m.id === ing.id));
                      return (
                        <>
                          {mentionedInPicker.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-emerald-700 mb-1 uppercase tracking-wide">Detected in step text</p>
                              {mentionedInPicker.map((ing: any) => {
                                const images = INGREDIENT_IMAGE_KEYS.map(k => ({ label: k.label, url: ing[k.key] })).filter(x => x.url);
                                if (!images.length) return null;
                                return (
                                  <div key={ing.id} className="mb-1.5">
                                    <p className="text-[10px] font-medium text-emerald-600 mb-0.5">{ing.name_common || ing.name}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {images.map(({ label, url }) => (
                                        <button key={url} type="button" onClick={() => setStepImage(i, url, true)}
                                          className="relative rounded-md overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all" title={label}>
                                          <img src={url} alt={label} className="w-14 h-12 object-cover" />
                                          <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-black/50 text-white py-0.5 truncate">{label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Other ingredients */}
                          {otherPool.filter((ing: any) => ing.image_url).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Other ingredients</p>
                              <div className="flex flex-wrap gap-1.5">
                                {otherPool.filter((ing: any) => ing.image_url).slice(0, 20).map((ing: any) => (
                                  <button key={ing.id} type="button" onClick={() => setStepImage(i, ing.image_url, true)}
                                    className="relative rounded-md overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all" title={ing.name_common || ing.name}>
                                    <img src={ing.image_url} alt="" className="w-10 h-10 object-cover" />
                                    <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-black/50 text-white py-0.5 truncate">{(ing.name_common || ing.name || '').slice(0, 12)}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {/* Equipment */}
                    {catalogEquipment && catalogEquipment.filter(e => e.image_url).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-orange-500 mb-1 uppercase tracking-wide">Equipment</p>
                        <div className="flex flex-wrap gap-1.5">
                          {catalogEquipment.filter(e => e.image_url).map((eq) => (
                            <button key={eq.id} type="button" onClick={() => setStepImage(i, eq.image_url!, true)}
                              className="relative rounded-md overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all" title={eq.name}>
                              <img src={eq.image_url!} alt={eq.name} className="w-10 h-10 object-cover" />
                              <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-black/50 text-white py-0.5 truncate">{eq.name.slice(0, 12)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
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
                  placeholder="Title"
                  title="Title"
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
                      title="AI Summary"
                      placeholder="AI-generated summary"
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
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" title="Replace image"
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
  
  // Define tabs first (needed for useAdminRecords hook)
  const tabs = [
    { id: 'waitlist', label: 'Waitlist', icon: <Clock className="w-4 h-4" />, table: 'waitlist' },
    { id: 'elements', label: 'Elements', icon: <FlaskConical className="w-4 h-4" />, table: 'catalog_elements' },
    { id: 'ingredients', label: 'Ingredients', icon: <Leaf className="w-4 h-4" />, table: 'catalog_ingredients' },
    { id: 'recipes', label: 'Recipes', icon: <UtensilsCrossed className="w-4 h-4" />, table: 'catalog_recipes' },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, table: 'catalog_products' },
    { id: 'scans', label: 'Scans', icon: <ScanLine className="w-4 h-4" />, table: 'scans' },
    { id: 'equipment', label: 'Equipment', icon: <Wrench className="w-4 h-4" />, table: 'catalog_equipment' },
    { id: 'cooking_methods', label: 'Cooking Methods', icon: <Flame className="w-4 h-4" />, table: 'catalog_cooking_methods' },
    { id: 'activities', label: 'Activities', icon: <Dumbbell className="w-4 h-4" />, table: 'catalog_activities' },
    { id: 'symptoms', label: 'Symptoms', icon: <HeartPulse className="w-4 h-4" />, table: 'catalog_symptoms' },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, table: '' },
    { id: 'sync', label: 'Sync', icon: <span className="text-xs">⇄</span>, table: '' },
  ];
  
  // Use React Query for data fetching (eliminates duplicate requests)
  const currentTab = tabs.find(t => t.id === activeTab);
  const { data: records = [], isLoading: loading, refetch: fetchRecords } = useAdminRecords({
    activeTab,
    table: currentTab?.table || '',
    accessToken,
    enabled: !!currentTab && activeTab !== 'sync',
  });
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
  const [elementSourcesCache, setElementSourcesCache] = useState<{ elementId: string; sources: AdminRecord[] } | null>(null);
  const [elementSourcesLoading, setElementSourcesLoading] = useState(false);
  const [aiLinkingIngredients, setAiLinkingIngredients] = useState(false);
  const [aiLinkResults, setAiLinkResults] = useState<{ linked: { id: string; name: string; per_100g: number; unit: string }[]; errors: string[] } | null>(null);
  const [computingNutrition, setComputingNutrition] = useState(false);
  const [ingredientsCache, setIngredientsCache] = useState<AdminRecord[]>([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [equipmentCache, setEquipmentCache] = useState<EquipmentRecord[]>([]);
  const [autoLinkResults, setAutoLinkResults] = useState<null | Array<{
    name: string;
    match: AdminRecord | null;
    score: number;
    accepted: boolean | null; // null=pending, true=accepted, false=rejected
    creating: boolean;
  }>>(null);
  const [aiIngredientSuggestResults, setAiIngredientSuggestResults] = useState<null | Array<{
    name: string;
    match: AdminRecord | null;
    score: number;
    accepted: boolean | null;
    creating: boolean;
  }>>(null);
  const [aiIngredientSuggesting, setAiIngredientSuggesting] = useState(false);
  const [aiFillingFields, setAiFillingFields] = useState(false);
  const [aiFillingSection, setAiFillingSection] = useState<string | null>(null);
  const [aiCreating, setAiCreating] = useState(false);
  const [batchEnriching, setBatchEnriching] = useState(false);
  const [batchMode, setBatchMode] = useState<'all' | 'sparse' | 'improve'>('all');
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number; total: number; name: string;
    filled: number; skipped: number; errors: number;
    recordResults: Array<{ id: string; name: string; status: 'done' | 'skipped' | 'error'; fieldsAdded: number }>;
  } | null>(null);
  const batchCancelRef = useRef(false);
  const [showAiCreatePrompt, setShowAiCreatePrompt] = useState(false);
  const [aiCreatePrompt, setAiCreatePrompt] = useState('');
  const [hazardSearch, setHazardSearch] = useState('');
  const [nutrientSearch, setNutrientSearch] = useState('');
  const [editModalTab, setEditModalTab] = useState<'culinary' | 'health' | 'content'>('culinary');
  const [aiContext, setAiContext] = useState('');
  const [vecSearchSection, setVecSearchSection] = useState<string | null>(null);
  const [vecSearchQuery, setVecSearchQuery] = useState('');
  const [vecSearchResults, setVecSearchResults] = useState<AdminRecord[]>([]);
  const [generatingMoleculeImage, setGeneratingMoleculeImage] = useState(false);
  const [generatingRecipeEnrich, setGeneratingRecipeEnrich] = useState(false);

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

  // Fetch elements cache for all catalog tabs (used for linking + element preview chips)
  useEffect(() => {
    if (!showEditModal || elementsCache.length > 0) return;
    if (!['ingredients', 'recipes', 'products', 'elements'].includes(activeTab)) return;
    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) return;

    const controller = new AbortController();
    const fetchElements = async () => {
      try {
        const url = `https://${projectId}.supabase.co/rest/v1/catalog_elements?select=id,name_common,category,type_label,health_role,image_url&limit=1000`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': publicAnonKey },
        });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted && Array.isArray(data)) {
            console.log(`[Admin] Loaded ${data.length} elements for linking`);
            setElementsCache(data);
          }
        } else {
          console.error('[Admin] Failed to fetch elements:', res.status, res.statusText);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[Admin] Failed to fetch elements for linking:', err);
        }
      }
    };
    fetchElements();
    return () => controller.abort();
  }, [showEditModal, activeTab, accessToken]);

  // Only reset ingredientsCache when closing modal (not on tab change)
  useEffect(() => {
    if (!showEditModal) {
      setIngredientsCache([]);
    }
  }, [showEditModal]);

  // Fetch ingredients for linked_ingredients picker when editing recipes, ingredients, or products
  useEffect(() => {
    if (!showEditModal || ingredientsCache.length > 0) return;
    if (activeTab !== 'recipes' && activeTab !== 'ingredients' && activeTab !== 'products') return;
    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) return;

    const controller = new AbortController();
    const fetchIngredients = async () => {
      try {
        const url = `https://${projectId}.supabase.co/rest/v1/catalog_ingredients?select=id,name_common,category,processing_type,image_url&limit=1000`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': publicAnonKey },
        });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            console.log(`[Admin] Loaded ${data.length} ingredients for linking`);
            setIngredientsCache(data);
          }
        } else {
          console.error('[Admin] Failed to fetch ingredients:', res.status, res.statusText);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[Admin] Failed to fetch ingredients for linking:', err);
        }
      }
    };
    fetchIngredients();
    return () => controller.abort();
  }, [showEditModal, activeTab, accessToken]);

  // Fetch equipment catalog for recipes tab - uses same publicAnonKey as ingredients
  useEffect(() => {
    if (!showEditModal || equipmentCache.length > 0) return;
    if (activeTab !== 'recipes') return;
    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) return;

    const controller = new AbortController();
    const fetchEquipment = async () => {
      try {
        const url = `https://${projectId}.supabase.co/rest/v1/catalog_equipment?select=id,name,category,image_url&limit=500&order=category,name`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': publicAnonKey },
        });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted && Array.isArray(data)) {
            console.log(`[Admin] Loaded ${data.length} equipment items for catalog`);
            setEquipmentCache(data);
          }
        } else {
          console.error('[Admin] Failed to fetch equipment:', res.status, res.statusText);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[Admin] Failed to fetch equipment catalog:', err);
        }
      }
    };
    fetchEquipment();
    return () => controller.abort();
  }, [showEditModal, activeTab, accessToken]);

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

  // React Query now handles fetching - no manual useEffect needed

  // Cache records for cross-tab search whenever they change
  useEffect(() => {
    if (records.length > 0 && activeTab) {
      recordsCache.current[activeTab] = records;
    }
  }, [records, activeTab]);

  // Cross-tab search: search all cached tabs when query changes (min 3 chars to avoid expensive ops)
  useEffect(() => {
    if (!showSearch || !searchQuery.trim() || searchQuery.trim().length < 3) {
      setCrossTabResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: { tabId: string; tabLabel: string; record: AdminRecord }[] = [];

    outer: for (const tab of tabs) {
      if (tab.id === activeTab) continue; // skip current tab (already shown in main list)
      const cached = recordsCache.current[tab.id];
      if (!cached) continue;
      for (const record of cached) {
        if (results.length >= 4) break outer;
        const haystack = [
          record.name, record.name_common, record.email, record.title, record.category,
        ].filter(Boolean).join(' ').toLowerCase();
        if (haystack.includes(q)) {
          results.push({ tabId: tab.id, tabLabel: tab.label, record });
        }
      }
    }
    setCrossTabResults(results);
  }, [searchQuery, showSearch, activeTab]);

  const handleEdit = (record: AdminRecord) => {
    setEditingRecord({ ...record });
    setEditModalTab(activeTab === 'elements' ? 'health' : 'culinary');
    setAutoLinkResults(null);
    setAiIngredientSuggestResults(null);
    setShowEditModal(true);
  };

  const openElementRecord = (elementId: string) => {
    const el = elementsCache.find(e => e.id === elementId);
    if (!el) return;
    setShowEditModal(false);
    setTimeout(() => {
      setActiveTab('elements');
      setEditingRecord({ ...el });
      setEditModalTab('health');
      setAutoLinkResults(null);
      setAiIngredientSuggestResults(null);
      setShowEditModal(true);
    }, 100);
  };

  const openIngredientRecord = (ingredient: AdminRecord) => {
    setShowEditModal(false);
    setTimeout(() => {
      setActiveTab('ingredients');
      setEditingRecord({ ...ingredient });
      setEditModalTab('culinary');
      setAutoLinkResults(null);
      setAiIngredientSuggestResults(null);
      setShowEditModal(true);
    }, 100);
  };

  const handleAiLinkIngredients = async () => {
    if (!editingRecord || activeTab !== 'elements') return;
    setAiLinkingIngredients(true);
    setAiLinkResults(null);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-link-ingredients`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementId: editingRecord.id,
          elementName: editingRecord.name_common || editingRecord.name,
          elementCategory: editingRecord.category,
          healthRole: editingRecord.health_role,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiLinkResults({ linked: data.linked || [], errors: data.errors || [] });
        if ((data.linked || []).length > 0) {
          toast.success(`AI linked ${data.linked.length} ingredients to this element`);
          // Refresh element sources cache
          setElementSourcesCache(null);
        } else {
          toast.info(data.message || 'No matching ingredients found');
        }
      } else {
        toast.error(data.error || 'AI link failed');
      }
    } catch (err: any) {
      toast.error(`AI link error: ${err?.message || err}`);
    } finally {
      setAiLinkingIngredients(false);
    }
  };

  const handleComputeNutrition = async () => {
    if (!editingRecord || activeTab !== 'recipes') return;
    const ingredients = editingRecord.ingredients;
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      toast.info('Add ingredients with quantities first');
      return;
    }
    // Validate that ingredients have qty_g values
    const hasQuantities = ingredients.some((item: any) => {
      if (item.group !== undefined) {
        return (item.items || []).some((child: any) => child.qty_g != null && child.ingredient_id);
      }
      return item.qty_g != null && item.ingredient_id;
    });
    if (!hasQuantities) {
      toast.info('Add quantities (qty_g) to your ingredients first. Use AI Enrich to auto-fill.');
      return;
    }
    setComputingNutrition(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/compute-recipe-nutrition`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: editingRecord.id,
          ingredients,
          servings: editingRecord.servings || 1,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEditingRecord((prev: any) => ({
          ...prev,
          elements_beneficial: data.elementsBeneficial,
          nutrition_per_100g: data.nutritionPer100g,
          nutrition_per_serving: data.nutritionPerServing,
        }));
        toast.success(`Nutrition computed from ${data.ingredientsUsed} ingredients (${data.totalWeight}g total)`);
      } else {
        toast.error(data.error || 'Compute failed');
      }
    } catch (err: any) {
      toast.error(`Compute error: ${err?.message || err}`);
    } finally {
      setComputingNutrition(false);
    }
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
      else if (f.type === 'json' || f.type === 'nutrition_editor') (blank as any)[f.key] = {};
      else if (f.type === 'grouped_ingredients') (blank as any)[f.key] = [];
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
          fetchRecords(); // Refetch to get updated list
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
          fetchRecords(); // Refetch to get updated list
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
          fetchRecords(); // Refetch to get updated list
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
      const _aiFillAbort1 = new AbortController();
      const _aiFillTimer1 = setTimeout(() => _aiFillAbort1.abort(), 120_000);
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tabType: adminFieldConfig[activeTab]?.label || activeTab,
            recordData: editingRecord,
            fields: editFields.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder, linkedCategory: f.linkedCategory })),
            sampleRecords,
            context: aiContext.trim() || undefined,
          }),
          signal: _aiFillAbort1.signal,
        });
      } catch (fetchErr: any) {
        clearTimeout(_aiFillTimer1);
        const msg = fetchErr?.name === 'AbortError' ? 'AI request timed out (>2 min). Try fewer fields or a simpler record.' : `Network error: ${fetchErr?.message || fetchErr}`;
        toast.error(msg);
        setAiFillingFields(false);
        return;
      } finally { clearTimeout(_aiFillTimer1); }
      const data = await response.json();
      if (data.success && data.filledFields) {
        const filledCount = Object.keys(data.filledFields).length;
        if (filledCount === 0) {
          toast.info(data.message || 'All fields already have data');
        } else {
          setEditingRecord((prev: any) => ({ ...prev, ...data.filledFields }));
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

  const handleGenerateMoleculeImage = async () => {
    if (!editingRecord) return;
    const name = editingRecord.name_common || editingRecord.name || '';
    const formula = editingRecord.molecular_formula || '';
    const symbol = editingRecord.chemical_symbol || '';
    if (!name) { toast.error('Element needs a name first'); return; }
    setGeneratingMoleculeImage(true);
    try {
      const prompt = [
        `Scientific molecular structure illustration of ${name}`,
        formula ? `(${formula})` : '',
        symbol ? `[${symbol}]` : '',
        '— clean white background, hexagonal molecular bond diagram, teal and indigo color palette, minimalist scientific style, high detail',
      ].filter(Boolean).join(' ');
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabType: 'elements',
          recordData: editingRecord,
          fields: [{ key: 'image_url', label: 'Main Image', type: 'image', placeholder: '' }],
          sampleRecords: [],
          context: `Generate a molecule pattern image. Prompt: ${prompt}`,
        }),
        signal: AbortSignal.timeout(90_000),
      });
      const data = await res.json();
      if (data.success && data.filledFields?.image_url) {
        setEditingRecord((prev: any) => ({ ...prev, image_url: data.filledFields.image_url }));
        toast.success('Molecule image generated!');
      } else {
        toast.error(data.error || 'Image generation failed — AI fill returned no image_url');
      }
    } catch (err: any) {
      toast.error(`Image generation error: ${err?.message || err}`);
    } finally {
      setGeneratingMoleculeImage(false);
    }
  };

  const handleAiEnrichRecipe = async () => {
    if (!editingRecord) return;
    const name = editingRecord.name_common || editingRecord.name || '';
    if (!name) { toast.error('Recipe needs a name first'); return; }
    setGeneratingRecipeEnrich(true);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-enrich-recipe`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: editingRecord.id,
          recipeName: name,
          servings: editingRecord.servings || 4,
          portionWeightG: editingRecord.portion_weight_g || null,
          servingSize: editingRecord.serving_size || null,
          prepTime: editingRecord.prep_time || '',
          cookTime: editingRecord.cook_time || '',
          difficulty: editingRecord.difficulty || '',
          cuisine: editingRecord.cuisine || '',
          description: editingRecord.description_simple || editingRecord.description || '',
          existingLinkedIds: editingRecord.linked_ingredients || [],
        }),
        signal: AbortSignal.timeout(120_000),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || 'AI recipe enrichment failed'); return; }

      const updates: Record<string, any> = {};

      // Set linked_ingredients
      if (data.linked_ingredient_ids?.length > 0) {
        updates.linked_ingredients = data.linked_ingredient_ids;
      }
      // Set ingredients (grouped_ingredients structure with qty_g)
      if (data.grouped_ingredients?.length > 0) {
        console.log('[AI Enrich] Received grouped_ingredients:', data.grouped_ingredients);
        updates.ingredients = data.grouped_ingredients;
      }
      // Set equipment as array of names
      if (data.equipment_names?.length > 0) {
        updates.equipment = data.equipment_names;
      }
      // Set cooking steps with auto-assigned images and equipment_ids
      if (data.steps?.length > 0) {
        const linkedIds = updates.linked_ingredients || editingRecord.linked_ingredients || [];
        const linkedIngs = ingredientsCache.filter((ing: any) => linkedIds.includes(ing.id));
        const pool = linkedIngs.length > 0 ? linkedIngs : ingredientsCache;

        const stepsWithImagesAndEquipment = data.steps.map((step: { text: string; image_url: string }, idx: number) => {
          const lower = step.text.toLowerCase();
          
          // Auto-detect equipment_ids from step text
          const detectedEqIds: string[] = equipmentCache
            .filter(e => e.name.length > 2 && lower.includes(e.name.toLowerCase()))
            .map(e => e.id);

          // Auto-assign image if none provided
          let imageUrl = step.image_url || '';
          if (!imageUrl) {
            // 1. Try ingredient mentioned by name
            const mentioned = pool.filter((ing: any) => {
              const n = (ing.name_common || ing.name || '').toLowerCase();
              return n.length > 2 && lower.includes(n);
            });
            if (mentioned.length > 0) {
              const f = mentioned[0];
              if ((lower.includes('cut')||lower.includes('slice')||lower.includes('chop')) && f.image_url_cut) imageUrl = f.image_url_cut;
              else if ((lower.includes('cook')||lower.includes('fry')||lower.includes('roast')||lower.includes('bake')) && f.image_url_cooked) imageUrl = f.image_url_cooked;
              else if (f.image_url) imageUrl = f.image_url;
            }
            // 2. Try equipment image
            if (!imageUrl) {
              const eqMatch = equipmentCache.find(e => e.image_url && e.name.length > 2 && lower.includes(e.name.toLowerCase()));
              if (eqMatch?.image_url) imageUrl = eqMatch.image_url;
            }
            // 3. Fallback: first linked ingredient with image
            if (!imageUrl) {
              const first = pool.find((ing: any) => ing.image_url);
              if (first?.image_url) imageUrl = first.image_url;
            }
          }

          return { text: step.text, image_url: imageUrl, ingredient_ids: [], equipment_ids: detectedEqIds };
        });
        updates.instructions = stepsWithImagesAndEquipment;
      }

      setEditingRecord((prev: any) => ({ ...prev, ...updates }));

      const { counts } = data;
      const parts = [];
      if (counts?.ingredients) parts.push(`${counts.ingredients} ingredients`);
      if (counts?.equipment) parts.push(`${counts.equipment} equipment`);
      if (counts?.steps) parts.push(`${counts.steps} steps`);
      toast.success(`AI enriched: ${parts.join(', ')} — saving…`);

      if (data.unmatched_ingredients?.length > 0) {
        toast.info(`${data.unmatched_ingredients.length} not in catalog: ${data.unmatched_ingredients.map((u: any) => u.name).join(', ')}`);
      }

      // Auto-save enriched data to DB immediately
      if (editingRecord?.id && currentTab) {
        try {
          const tabConfig = adminFieldConfig[activeTab];
          const editableKeys = new Set(
            tabConfig?.fields?.filter((f: any) => f.showInEdit).map((f: any) => f.key) || []
          );
          const enrichedRecord = { ...editingRecord, ...updates };
          const cleanedUpdates: Record<string, any> = {};
          for (const key of editableKeys) {
            if (key in enrichedRecord) {
              const v = enrichedRecord[key];
              if (typeof v === 'string' && v.startsWith('data:') && v.length > 5000) continue;
              cleanedUpdates[key] = v;
            }
          }
          const saveRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: currentTab.table, id: editingRecord.id, updates: cleanedUpdates }),
          });
          if (saveRes.ok) {
            fetchRecords(); // Refetch to get updated list
            toast.success('Saved to database ✓');
          } else {
            toast.error('AI enriched but save failed — click Save to retry');
          }
        } catch {
          toast.error('AI enriched but save failed — click Save to retry');
        }
      }
    } catch (err: any) {
      toast.error(`Recipe enrichment error: ${err?.message || err}`);
    } finally {
      setGeneratingRecipeEnrich(false);
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

      // Build section context — start with any manual context
      let sectionContext = aiContext.trim() || undefined;
      const isFlavorSection = sectionName === 'Flavor Profile';
      const isStepsSection = sectionName === 'Steps' || sectionName === 'Preparation' || sectionName === 'Instructions' || sectionName === 'Cooking';
      const isRecipeTab = (adminFieldConfig[activeTab]?.label || activeTab).toLowerCase().includes('recipe');
      if (isFlavorSection && isRecipeTab) {
        const parts: string[] = [];
        // Cooking steps
        const steps: any[] = Array.isArray(editingRecord.instructions) ? editingRecord.instructions : [];
        if (steps.length > 0) {
          const stepTexts = steps.map((s: any, i: number) => `${i + 1}. ${typeof s === 'string' ? s : (s.text || '')}`).filter(Boolean);
          if (stepTexts.length > 0) parts.push(`Cooking steps:\n${stepTexts.join('\n')}`);
        }
        // Linked ingredient names from cache
        const linkedIds: string[] = Array.isArray(editingRecord.linked_ingredients) ? editingRecord.linked_ingredients : [];
        let ingNames: string[] = [];
        if (linkedIds.length > 0) {
          ingNames = ingredientsCache
            .filter((ing: any) => linkedIds.includes(ing.id))
            .map((ing: any) => ing.name_common || ing.name)
            .filter(Boolean);
        }
        // Fallback: extract names from grouped_ingredients text field
        if (ingNames.length === 0) {
          const textItems: any[] = Array.isArray(editingRecord.ingredients) ? editingRecord.ingredients : [];
          for (const entry of textItems) {
            if (entry?.group !== undefined) {
              for (const child of (entry.items || [])) { if (child.name) ingNames.push(child.name); }
            } else if (entry?.name) {
              ingNames.push(entry.name);
            }
          }
        }
        if (ingNames.length > 0) parts.push(`Ingredients: ${ingNames.join(', ')}`);
        // Equipment/tools (stored on equipment field)
        const equipment: string[] = Array.isArray(editingRecord.equipment) ? editingRecord.equipment : [];
        if (equipment.length > 0) parts.push(`Equipment: ${equipment.join(', ')}`);
        // Cuisine / difficulty
        if (editingRecord.cuisine) parts.push(`Cuisine: ${editingRecord.cuisine}`);
        if (parts.length > 0) {
          const recipeContext = `Analyse the full recipe to determine the overall taste and flavour profile:\n\n${parts.join('\n\n')}`;
          sectionContext = sectionContext ? `${sectionContext}\n\n${recipeContext}` : recipeContext;
        }
      }

      // For Steps/Preparation sections, inject portion-aware context
      if ((isStepsSection || isFlavorSection) && isRecipeTab) {
        const portionParts: string[] = [];
        if (editingRecord.servings) portionParts.push(`Servings: ${editingRecord.servings}`);
        if (editingRecord.serving_size) portionParts.push(`Serving size: ${editingRecord.serving_size}`);
        if (editingRecord.portion_weight_g) portionParts.push(`Portion weight: ${editingRecord.portion_weight_g}g`);
        if (editingRecord.prep_time) portionParts.push(`Prep time: ${editingRecord.prep_time}`);
        if (editingRecord.cook_time) portionParts.push(`Cook time: ${editingRecord.cook_time}`);
        if (editingRecord.difficulty) portionParts.push(`Difficulty: ${editingRecord.difficulty}`);
        if (portionParts.length > 0) {
          const portionContext = `Recipe portion details (use these to calibrate step quantities, timings, and serving instructions):\n${portionParts.join(' | ')}`;
          sectionContext = sectionContext ? `${sectionContext}\n\n${portionContext}` : portionContext;
        }
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
      const _aiFillAbort2 = new AbortController();
      const _aiFillTimer2 = setTimeout(() => _aiFillAbort2.abort(), 120_000);
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tabType: adminFieldConfig[activeTab]?.label || activeTab,
            recordData: editingRecord,
            fields: sectionFields.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder, linkedCategory: f.linkedCategory })),
            sampleRecords,
            context: sectionContext,
          }),
          signal: _aiFillAbort2.signal,
        });
      } catch (fetchErr: any) {
        clearTimeout(_aiFillTimer2);
        const msg = fetchErr?.name === 'AbortError' ? 'AI request timed out (>2 min). Try fewer fields.' : `Network error: ${fetchErr?.message || fetchErr}`;
        toast.error(msg);
        setAiFillingSection(null);
        return;
      } finally { clearTimeout(_aiFillTimer2); }
      if (response.status === 401) {
        toast.error('Session expired — please refresh the page and log in again');
        return;
      }
      const data = await response.json();
      if (data.success && data.filledFields) {
        const filledCount = Object.keys(data.filledFields).length;
        if (filledCount === 0) {
          toast.info(data.message || `All ${sectionName} fields already have data`);
        } else {
          setEditingRecord((prev: any) => ({ ...prev, ...data.filledFields }));
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

  // Count how many editable fields a record has data for (0–100 score)
  const getRecordCompleteness = (record: AdminRecord, editFields: ReturnType<typeof getFieldsForView>): number => {
    const SKIP_TYPES = new Set(['image', 'video', 'element_sources_viewer', 'nutrient_viewer', 'ingredient_viewer']);
    const scoreable = editFields.filter(f => !SKIP_TYPES.has(f.type));
    if (scoreable.length === 0) return 100;
    const filled = scoreable.filter(f => {
      const v = (record as any)[f.key];
      if (v === null || v === undefined || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    }).length;
    return Math.round((filled / scoreable.length) * 100);
  };

  const handleBatchAiEnrich = async (mode: 'all' | 'sparse' | 'improve' = 'all') => {
    if (!currentTab || activeTab === 'waitlist' || activeTab === 'scans') return;
    const editFields = getFieldsForView(activeTab, 'edit');

    // Filter candidates
    let candidates = sortedRecords.filter(r => r.name || r.name_common);
    if (mode === 'sparse') {
      // Only records with < 40% completeness
      candidates = candidates.filter(r => getRecordCompleteness(r, editFields) < 40);
    }
    // 'improve' mode runs on all records but tells AI to overwrite+improve existing data
    if (candidates.length === 0) {
      toast.info(mode === 'sparse' ? 'No sparse records found (all records are ≥40% complete)' : 'No records to enrich');
      return;
    }

    setBatchEnriching(true);
    batchCancelRef.current = false;
    const recordResults: Array<{ id: string; name: string; status: 'done' | 'skipped' | 'error'; fieldsAdded: number }> = [];
    setBatchProgress({ current: 0, total: candidates.length, name: '', filled: 0, skipped: 0, errors: 0, recordResults });
    let filled = 0; let skipped = 0; let errors = 0;

    for (let i = 0; i < candidates.length; i++) {
      if (batchCancelRef.current) break;
      const record = candidates[i];
      const name = record.name_common || record.name || `Record ${i + 1}`;
      setBatchProgress({ current: i + 1, total: candidates.length, name, filled, skipped, errors, recordResults: [...recordResults] });
      try {
        // For recipes: also call ai-enrich-recipe to fill ingredients, equipment, and steps
        if (activeTab === 'recipes') {
          const enrichUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-enrich-recipe`;
          let enrichResponse: Response;
          try {
            enrichResponse = await fetch(enrichUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipeId: record.id,
                recipeName: name,
                servings: (record as any).servings || 4,
                portionWeightG: (record as any).portion_weight_g || null,
                prepTime: (record as any).prep_time || '',
                cookTime: (record as any).cook_time || '',
                difficulty: (record as any).difficulty || '',
                cuisine: (record as any).cuisine || '',
                description: (record as any).description_simple || (record as any).description || '',
              }),
              signal: AbortSignal.timeout(120_000),
            });
          } catch (fetchErr: any) {
            if (fetchErr?.name === 'AbortError') { errors++; recordResults.push({ id: record.id, name, status: 'error', fieldsAdded: 0 }); continue; }
            throw fetchErr;
          }
          if (enrichResponse.status === 401) { setBatchEnriching(false); setBatchProgress(null); toast.error('Session expired'); return; }
          const enrichData = await enrichResponse.json();
          if (enrichData.success) {
            const recipeUpdates: Record<string, any> = {};
            if (enrichData.linked_ingredient_ids?.length > 0) recipeUpdates.linked_ingredients = enrichData.linked_ingredient_ids;
            if (enrichData.grouped_ingredients?.length > 0) recipeUpdates.ingredients = enrichData.grouped_ingredients;
            if (enrichData.equipment_names?.length > 0) recipeUpdates.equipment = enrichData.equipment_names;
            if (enrichData.steps?.length > 0) recipeUpdates.instructions = enrichData.steps;
            if (Object.keys(recipeUpdates).length > 0) {
              const saveUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`;
              await fetch(saveUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ table: currentTab.table, id: record.id, updates: recipeUpdates }) });
              // Note: Records will be refetched after batch completes
              const cnt = enrichData.counts;
              filled += (cnt?.ingredients || 0) + (cnt?.equipment ? 1 : 0) + (cnt?.steps ? 1 : 0);
              recordResults.push({ id: record.id, name, status: 'done', fieldsAdded: Object.keys(recipeUpdates).length });
            } else {
              skipped++;
              recordResults.push({ id: record.id, name, status: 'skipped', fieldsAdded: 0 });
            }
          } else {
            errors++;
            recordResults.push({ id: record.id, name, status: 'error', fieldsAdded: 0 });
          }
          setBatchProgress({ current: i + 1, total: candidates.length, name, filled, skipped, errors, recordResults: [...recordResults] });
          if (i < candidates.length - 1 && !batchCancelRef.current) await new Promise(r => setTimeout(r, 500));
          continue;
        }

        const sampleRecords = candidates
          .filter(r => r.id !== record.id)
          .slice(0, 2)
          .map(r => {
            const sample: Record<string, any> = {};
            editFields.forEach(f => { const v = (r as any)[f.key]; if (v !== null && v !== undefined && v !== '') sample[f.key] = v; });
            return sample;
          });
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
        const _aiFillAbort3 = new AbortController();
        const _aiFillTimer3 = setTimeout(() => _aiFillAbort3.abort(), 120_000);
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tabType: adminFieldConfig[activeTab]?.label || activeTab,
              recordData: record,
              fields: editFields.map(f => ({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder, linkedCategory: f.linkedCategory })),
              sampleRecords,
              mode: mode === 'improve' ? 'improve' : 'fill',
            }),
            signal: _aiFillAbort3.signal,
          });
        } catch (fetchErr: any) {
          clearTimeout(_aiFillTimer3);
          if (fetchErr?.name === 'AbortError') {
            errors++;
            console.warn(`[Batch AI] Record timed out: ${record.name || record.name_common}`);
            continue;
          }
          throw fetchErr;
        } finally { clearTimeout(_aiFillTimer3); }
        if (response.status === 401) {
          setBatchEnriching(false);
          setBatchProgress(null);
          toast.error('Session expired — please refresh the page and log in again to continue batch enrichment');
          return;
        }
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 5000));
          errors++;
          recordResults.push({ id: record.id, name, status: 'error', fieldsAdded: 0 });
          setBatchProgress({ current: i + 1, total: candidates.length, name, filled, skipped, errors, recordResults: [...recordResults] });
          continue;
        }
        const data = await response.json();
        if (data.success && data.filledFields && Object.keys(data.filledFields).length > 0) {
          const filledCount = Object.keys(data.filledFields).length;
          const saveUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/update`;
          const tabConfig = adminFieldConfig[activeTab];
          const editableKeys = new Set(tabConfig?.fields?.filter((f: any) => f.showInEdit).map((f: any) => f.key) || []);
          const cleanUpdates: Record<string, any> = {};
          for (const key of Object.keys(data.filledFields)) {
            if (editableKeys.has(key)) cleanUpdates[key] = data.filledFields[key];
          }
          if (Object.keys(cleanUpdates).length > 0) {
            const saveRes = await fetch(saveUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ table: currentTab.table, id: record.id, updates: cleanUpdates }),
            });
            if (saveRes.status === 401) {
              setBatchEnriching(false);
              setBatchProgress(null);
              toast.error('Session expired — please refresh and log in again');
              return;
            }
            if (saveRes.ok) {
              // Note: Records will be refetched after batch completes
            }
          }
          filled += filledCount;
          recordResults.push({ id: record.id, name, status: 'done', fieldsAdded: filledCount });
        } else {
          skipped++;
          recordResults.push({ id: record.id, name, status: 'skipped', fieldsAdded: 0 });
        }
      } catch {
        errors++;
        recordResults.push({ id: record.id, name, status: 'error', fieldsAdded: 0 });
      }
      setBatchProgress({ current: i + 1, total: candidates.length, name, filled, skipped, errors, recordResults: [...recordResults] });
      if (i < candidates.length - 1 && !batchCancelRef.current) await new Promise(r => setTimeout(r, 300));
    }
    setBatchEnriching(false);
    const wasCancelled = batchCancelRef.current;
    setBatchProgress(null);
    if (wasCancelled) {
      toast.info(`Batch enrichment cancelled — ${filled} fields filled across ${recordResults.length} records`);
    } else {
      toast.success(`Batch ${mode === 'improve' ? 'improvement' : 'enrichment'} complete — ${filled} fields updated, ${skipped} skipped, ${errors} errors`);
    }
  };

  const handleExportCsv = () => {
    if (!sortedRecords.length) { toast.info('No records to export'); return; }
    const editFields = getFieldsForView(activeTab, 'edit');
    const SKIP_TYPES = new Set(['image', 'video', 'element_sources_viewer', 'nutrient_viewer', 'ingredient_viewer']);
    const cols = editFields.filter(f => !SKIP_TYPES.has(f.type));
    const headers = cols.map(f => f.label);
    const rows = sortedRecords.map(record =>
      cols.map(f => {
        const val = (record as any)[f.key];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
          const s = JSON.stringify(val).replace(/"/g, '""');
          return s.match(/^[=+\-@\t]/) ? `'${s}` : s;
        }
        const s = String(val).replace(/"/g, '""');
        return s.match(/^[=+\-@\t]/) ? `'${s}` : s;
      })
    );
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${adminFieldConfig[activeTab]?.label || activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sortedRecords.length} records to CSV`);
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
        // Refetch and open for editing
        fetchRecords();
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
          fetchRecords(); // Refetch to get updated list
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
          fetchRecords(); // Refetch to get updated list
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
      fetchRecords(); // Refetch to get updated list
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
              body: JSON.stringify({ table: currentTab.table, id: recordId, updates: { [bulkEditField]: bulkEditValue } })
            }
          );
          if (response.ok) updated++;
        }
        toast.success(`Updated ${updated} records`);
      }
      fetchRecords(); // Refetch to get updated list
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
    
    // Handle name_other which can be string or array
    const nameOtherMatch = record.name_other 
      ? (Array.isArray(record.name_other) 
          ? record.name_other.some((n: string) => n?.toLowerCase().includes(searchLower))
          : String(record.name_other).toLowerCase().includes(searchLower))
      : false;
    
    const matchesSearch = !searchQuery ? true : (
      (record.name?.toLowerCase().includes(searchLower)) ||
      (record.name_common?.toLowerCase().includes(searchLower)) ||
      nameOtherMatch ||
      (record.name_scientific?.toLowerCase().includes(searchLower)) ||
      (record.email?.toLowerCase().includes(searchLower)) ||
      (record.title?.toLowerCase().includes(searchLower)) ||
      (record.category?.toLowerCase().includes(searchLower)) ||
      (String(record.id || '').toLowerCase().includes(searchLower)) ||
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
              src={`https://www.gravatar.com/avatar/${record.email ? md5(record.email.trim().toLowerCase()) : '0'}?d=identicon&s=40`}
              alt={record.email || ''}
              className="w-9 h-9 rounded-full cursor-pointer border border-gray-200"
              onClick={() => handleEdit(record)}
            />
          </div>
        ) : (
          <div className="flex-shrink-0">
            {record.icon_name && (activeTab === 'activities' || activeTab === 'symptoms') ? (
              <div
                className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-center hover:shadow-lg cursor-pointer transition-all hover:scale-105"
                onClick={() => handleEdit(record)}
              >
                <LucideIconPreview name={record.icon_name} className="w-8 h-8 text-blue-600" />
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={displayName}
                className="w-16 h-16 rounded-lg object-cover hover:shadow-lg cursor-pointer transition-shadow"
                onClick={() => handleEdit(record)}
                loading="lazy"
              />
            )}
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
                  {/* Elements: show health_role • type_label as underline */}
                  {activeTab === 'elements' && (record.health_role || record.type_label) && (
                    <span className="text-[10px] text-gray-500 font-medium">
                      {record.health_role && <span>{record.health_role}</span>}
                      {record.health_role && record.type_label && <span className="mx-1">•</span>}
                      {record.type_label && <span>{record.type_label}</span>}
                    </span>
                  )}
                  {/* Other tabs: show category/type badges */}
                  {activeTab !== 'elements' && (() => {
                    // Parse category if it's a JSON object
                    let categoryValue = record.category;
                    let categoryMain = null;
                    let categorySub = null;
                    
                    if (typeof categoryValue === 'string' && categoryValue.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(categoryValue);
                        categoryMain = parsed.main;
                        categorySub = parsed.sub;
                      } catch (e) {
                        // If parsing fails, use as-is
                      }
                    } else if (typeof categoryValue === 'object' && categoryValue) {
                      categoryMain = (categoryValue as any).main;
                      categorySub = (categoryValue as any).sub;
                    }
                    
                    return (
                      <>
                        {(categoryMain || categoryValue) && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${categoryColorMap[(categoryMain || categoryValue)?.toLowerCase()] || 'bg-blue-100 text-blue-800'}`}>
                            {categoryMain || categoryValue}
                          </Badge>
                        )}
                        {categorySub && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600">
                            {categorySub}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                  {activeTab !== 'elements' && record.type && (
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
                // Single source of truth: server generates nutrition_per_100g with standard field names
                const ns = record.nutrition_per_100g || record.nutrition_per_serving || {};
                const cal = Math.round(ns.calories ?? 0);
                const pro = Math.round(ns.protein_g ?? 0);
                const carb = Math.round(ns.carbohydrates_g ?? 0);
                const fat = Math.round(ns.fats_g ?? 0);
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

            {/* ── Notifications Tab ── */}
            <TabsContent value="notifications" className="space-y-6 pt-2">
              <NotificationTester accessToken={accessToken} />
            </TabsContent>

            {tabs.filter(tab => tab.id !== 'sync' && tab.id !== 'notifications').map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                {/* Waitlist Funnel Dashboard */}
                {tab.id === 'waitlist' && validRecords.length > 0 && !showSearch && (
                  <WaitlistFunnelDashboard records={validRecords} accessToken={accessToken} ipGeoData={ipGeoData} />
                )}

                {/* Catalog Metric Cards (elements, ingredients, recipes, products, equipment) */}
                {['elements', 'ingredients', 'recipes', 'products', 'equipment'].includes(tab.id) && records.length > 0 && (
                  <CatalogMetricCards records={records} tabId={tab.id} />
                )}

                {/* Scan Funnel Dashboard */}
                {tab.id === 'scans' && records.length > 0 && !showSearch && (
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

                {/* Batch Enrich Progress Banner */}
                {batchProgress && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Batch AI Enrichment</span>
                        <span className="text-xs text-amber-600 font-mono">{batchProgress.current} / {batchProgress.total}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-700 font-semibold">+{batchProgress.filled} fields</span>
                        <span className="text-gray-400">{batchProgress.skipped} skipped</span>
                        {batchProgress.errors > 0 && <span className="text-red-600 font-medium">{batchProgress.errors} errors</span>}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-amber-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%` }}
                      />
                    </div>
                    {/* Currently processing */}
                    {batchProgress.name && (
                      <p className="text-xs text-amber-600 truncate">
                        Processing: <span className="font-medium">{batchProgress.name}</span>
                        <span className="ml-2 text-amber-400">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                      </p>
                    )}
                    {/* Per-record results log */}
                    {batchProgress.recordResults.length > 0 && (
                      <div className="max-h-36 overflow-y-auto rounded-lg border border-amber-100 bg-white divide-y divide-gray-50">
                        {[...batchProgress.recordResults].reverse().map((r, idx) => (
                          <div key={`${r.id}-${idx}`} className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                            {r.status === 'done' && <span className="text-green-500 flex-shrink-0">✓</span>}
                            {r.status === 'skipped' && <span className="text-gray-300 flex-shrink-0">–</span>}
                            {r.status === 'error' && <span className="text-red-400 flex-shrink-0">✕</span>}
                            <span className="flex-1 truncate text-gray-700 font-medium">{r.name}</span>
                            {r.status === 'done' && (
                              <span className="flex-shrink-0 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">
                                +{r.fieldsAdded} fields
                              </span>
                            )}
                            {r.status === 'skipped' && (
                              <span className="flex-shrink-0 text-[10px] text-gray-400">complete</span>
                            )}
                            {r.status === 'error' && (
                              <span className="flex-shrink-0 text-[10px] text-red-400">error</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Toolbar */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    {/* Search input — always visible */}
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
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        className="pl-10"
                      />
                    </div>

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
                        {batchEnriching ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { batchCancelRef.current = true; }}
                            className="gap-1 whitespace-nowrap text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Cancel</span>
                          </Button>
                        ) : (
                          <div className="relative flex">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBatchAiEnrich(batchMode)}
                              className="gap-1 whitespace-nowrap text-amber-700 border-amber-200 hover:bg-amber-50 rounded-r-none border-r-0"
                              title={batchMode === 'sparse' ? 'Enrich records with <40% data completeness' : batchMode === 'improve' ? 'Improve all records — rewrites existing data with more scientific & culinary depth' : 'Enrich all records — fills missing fields only'}
                            >
                              <Sparkles className="w-4 h-4" />
                              <span className="hidden sm:inline">{batchMode === 'sparse' ? 'Enrich Sparse' : batchMode === 'improve' ? 'Improve All' : 'Batch Enrich'}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowBatchMenu(v => !v)}
                              className="px-1.5 text-amber-700 border-amber-200 hover:bg-amber-50 rounded-l-none"
                              title="Choose batch mode"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                            {showBatchMenu && (
                              <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
                                onMouseLeave={() => setShowBatchMenu(false)}>
                                <button
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center gap-2 ${batchMode === 'all' ? 'font-semibold text-amber-700' : 'text-gray-700'}`}
                                  onClick={() => { setBatchMode('all'); setShowBatchMenu(false); handleBatchAiEnrich('all'); }}
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  <div>
                                    <div className="font-medium">All Records</div>
                                    <div className="text-[10px] text-gray-400">Fill empty fields in every record</div>
                                  </div>
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center gap-2 ${batchMode === 'sparse' ? 'font-semibold text-amber-700' : 'text-gray-700'}`}
                                  onClick={() => { setBatchMode('sparse'); setShowBatchMenu(false); handleBatchAiEnrich('sparse'); }}
                                >
                                  <span className="text-amber-500 flex-shrink-0 text-sm">⚡</span>
                                  <div>
                                    <div className="font-medium">Sparse Only</div>
                                    <div className="text-[10px] text-gray-400">Only records with &lt;40% data</div>
                                  </div>
                                </button>
                                <button
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center gap-2 ${batchMode === 'improve' ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                                  onClick={() => { setBatchMode('improve'); setShowBatchMenu(false); handleBatchAiEnrich('improve'); }}
                                >
                                  <span className="text-blue-500 flex-shrink-0 text-sm">✦</span>
                                  <div>
                                    <div className="font-medium">Improve All</div>
                                    <div className="text-[10px] text-gray-400">Rewrite existing data — more scientific &amp; culinary depth</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCsv}
                      disabled={!sortedRecords.length}
                      className="gap-1 text-teal-700 border-teal-200 hover:bg-teal-50"
                      title={`Export ${sortedRecords.length} records to CSV`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">CSV</span>
                    </Button>
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
        onClose={() => { setShowEditModal(false); setEditingRecord(null); setAutoLinkResults(null); setAiIngredientSuggestResults(null); }}
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
                    if (idx > 0) { setEditingRecord({ ...sortedRecords[idx - 1] }); setElementSearchQuery(''); setIngredientSearchQuery(''); setAutoLinkResults(null); setAiIngredientSuggestResults(null); }
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
                    if (idx < sortedRecords.length - 1) { setEditingRecord({ ...sortedRecords[idx + 1] }); setElementSearchQuery(''); setIngredientSearchQuery(''); setAutoLinkResults(null); setAiIngredientSuggestResults(null); }
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
                  {aiFillingFields ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  <span className="text-xs">{aiFillingFields ? 'Enriching...' : 'AI Enrich'}</span>
                </Button>
                {activeTab === 'elements' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiLinkIngredients}
                    disabled={aiLinkingIngredients || (!editingRecord?.name && !editingRecord?.name_common)}
                    className="h-8 px-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-teal-100"
                    title="AI scans all ingredients in the DB and links those that contain this element"
                  >
                    {aiLinkingIngredients ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <span className="mr-1 text-sm">🔗</span>}
                    <span className="text-xs">{aiLinkingIngredients ? 'Linking...' : 'AI Link Ingredients'}</span>
                  </Button>
                )}
                {activeTab === 'elements' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateMoleculeImage}
                    disabled={generatingMoleculeImage || (!editingRecord?.name && !editingRecord?.name_common)}
                    className="h-8 px-3 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 text-violet-700 hover:from-violet-100 hover:to-purple-100"
                    title="Generate a molecular pattern image for this element using AI"
                  >
                    {generatingMoleculeImage ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <span className="mr-1 text-sm">⚗️</span>}
                    <span className="text-xs">{generatingMoleculeImage ? 'Generating...' : 'Molecule Image'}</span>
                  </Button>
                )}
                {activeTab === 'recipes' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleComputeNutrition}
                    disabled={computingNutrition}
                    className="h-8 px-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-cyan-100"
                    title="Compute nutrition by summing elements_beneficial × qty_g across all linked ingredients"
                  >
                    {computingNutrition ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <span className="mr-1 text-sm">∑</span>}
                    <span className="text-xs">{computingNutrition ? 'Computing...' : 'Compute Nutrition'}</span>
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => { setShowEditModal(false); setEditingRecord(null); }}>Cancel</Button>
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

            if (field.type === 'icon_picker') {
              return (
                <div key={field.key} className={field.colSpan === 2 ? 'col-span-2' : ''}>
                  <IconPickerField
                    value={val || ''}
                    svgPathValue={editingRecord?.icon_svg_path || ''}
                    onChange={(iconName: string) => updateField(iconName)}
                    onSvgPathChange={(svgPath: string) => setEditingRecord((prev: any) => ({ ...prev, icon_svg_path: svgPath }))}
                    label={field.label}
                  />
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
                    {(field.options || []).map(opt => {
                      const label = opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return <option key={opt} value={opt}>{label}</option>;
                    })}
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
                          {opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
              
              // Special card layout for benefits and risks
              const isBenefits = field.key === 'health_benefits' || field.key === 'functions';
              const isRisks = field.key === 'risk_tags';
              const useCardLayout = isBenefits || isRisks;
              
              return (
                <div key={field.key} className="space-y-2">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label} <span className="text-gray-400 font-normal normal-case">({selected.length} selected)</span></Label>
                  {noParent ? (
                    <p className="text-xs text-gray-400 italic">Select a {field.conditionalOn} first</p>
                  ) : (
                    <>
                      {/* Selected items as stacked cards (for benefits/risks) */}
                      {useCardLayout && selected.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {selected.map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                              isBenefits ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              {isBenefits ? (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                              )}
                              <span className={`text-xs font-medium flex-1 ${
                                isBenefits ? 'text-green-800' : 'text-red-800'
                              }`}>{item}</span>
                              <button type="button"
                                onClick={() => updateField(selected.filter(s => s !== item))}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Remove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Available options as chips */}
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
                                  ? isBenefits
                                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                    : isRisks
                                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                    : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            if (field.type === 'taste_profile') {
              console.log('[taste_profile] raw val:', JSON.stringify(val));
              let profile: any = (typeof val === 'object' && val && !Array.isArray(val)) ? val : { taste: {}, texture: {} };
              // Handle flat legacy format: { sweet: 5, sour: 3, ... } instead of { taste: { sweet: 5 }, texture: { crispy: 2 } }
              if (profile && typeof profile === 'object' && !profile.taste && !profile.texture) {
                const tasteFlat: any = {};
                const textureFlat: any = {};
                const tasteK = ['sweet', 'sour', 'salty', 'bitter', 'umami', 'spicy'];
                const textureK = ['crispy', 'crunchy', 'chewy', 'smooth', 'creamy', 'juicy'];
                for (const k of tasteK) if (typeof profile[k] === 'number') tasteFlat[k] = profile[k];
                for (const k of textureK) if (typeof profile[k] === 'number') textureFlat[k] = profile[k];
                profile = { taste: tasteFlat, texture: textureFlat };
              }
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
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
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
                                const cachedEl = elementsCache.find(e => e.id === el.id);
                                return (
                                  <div key={el.id} className={`rounded px-1 ${isActive ? 'bg-orange-50/40' : ''}`}>
                                    <div className="flex items-center gap-1 py-0.5">
                                      <button type="button" onClick={() => cachedEl && openElementRecord(el.id)}
                                        className={`flex items-center gap-1 flex-1 min-w-0 text-left group ${cachedEl ? 'cursor-pointer' : 'cursor-default'}`}
                                        title={cachedEl ? `Open ${el.name_common} record` : el.name_common}>
                                        {cachedEl?.image_url ? (
                                          <img src={cachedEl.image_url} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0 opacity-80 group-hover:opacity-100" />
                                        ) : (
                                          <span className="w-4 h-4 rounded bg-orange-100 text-orange-600 text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                                            {el.name_common[0].toUpperCase()}
                                          </span>
                                        )}
                                        <span className={`text-[10px] truncate ${cachedEl ? 'text-orange-700 group-hover:text-orange-900 group-hover:underline' : 'text-gray-600'}`}>
                                          {el.name_common}
                                        </span>
                                      </button>
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
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    placeholder="Search nutrients..." title="Search nutrients" className="w-full h-7 px-2 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-green-400" />

                  {/* Column headers - per_serving is single source of truth */}
                  <div className="flex items-center gap-1 px-2 text-[8px] text-gray-400 uppercase tracking-wider">
                    <span className="flex-1">Nutrient</span>
                    <span className="w-[72px] text-right">/ serving</span>
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
                                const cachedEl = elementsCache.find(e => e.id === el.id);
                                return (
                                  <div key={el.id} className={`flex items-center gap-1 py-0.5 rounded px-1 ${hasSomething ? 'bg-green-50/40' : ''}`}>
                                    <button type="button" onClick={() => cachedEl && openElementRecord(el.id)}
                                      className={`flex items-center gap-1 flex-1 min-w-0 text-left group ${cachedEl ? 'cursor-pointer' : 'cursor-default'}`}
                                      title={cachedEl ? `Open ${el.name} record` : (el.rdi ? `RDI: ${el.rdi} ${el.unit}` : el.name)}>
                                      {cachedEl?.image_url ? (
                                        <img src={cachedEl.image_url} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0 opacity-80 group-hover:opacity-100" />
                                      ) : (
                                        <span className="w-4 h-4 rounded bg-green-100 text-green-700 text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                                          {el.name[0].toUpperCase()}
                                        </span>
                                      )}
                                      <span className={`text-[10px] truncate ${cachedEl ? 'text-green-700 group-hover:text-green-900 group-hover:underline' : 'text-gray-600'}`}>
                                        {el.name}
                                      </span>
                                    </button>
                                    <input type="number" step="any" value={vServ || ''} placeholder="0"
                                      onChange={(e) => updateNutrition(pServ, parseFloat(e.target.value) || 0)}
                                      title={`${el.name} per serving`}
                                      className={`w-[72px] h-6 px-1.5 text-[10px] border rounded text-right bg-white focus:ring-1 focus:ring-green-400 ${vServ > 0 ? 'border-green-300 text-green-800' : 'border-gray-200 text-gray-400'}`} />
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
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
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

            if (field.type === 'recipe_ingredients_tools') {
              return (
                <div key={field.key}>
                  <RecipeIngredientsToolsField
                    linkedIngredientsVal={val}
                    toolsVal={editingRecord?.equipment}
                    updateLinkedIngredients={updateField}
                    updateTools={(v) => setEditingRecord((prev: any) => ({ ...prev, equipment: v }))}
                    ingredientsCache={ingredientsCache}
                    ingredientSearchQuery={ingredientSearchQuery}
                    setIngredientSearchQuery={setIngredientSearchQuery}
                    accessToken={accessToken}
                  />
                </div>
              );
            }

            if (field.type === 'cooking_tools') {
              return null; // rendered inside grouped_ingredients 3-col layout
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

              // Fuzzy match helper (shared with grouped_ingredients auto-link)
              const fuzzySuggestScore = (a: string, b: string): number => {
                const an = a.toLowerCase().trim(); const bn = b.toLowerCase().trim();
                if (an === bn) return 1.0;
                if (bn.includes(an) || an.includes(bn)) return 0.85;
                const aW = an.split(/\s+/); const bW = bn.split(/\s+/);
                const shared = aW.filter(w => bW.some(bw => bw.includes(w) || w.includes(bw)));
                if (shared.length > 0) return 0.6 + (shared.length / Math.max(aW.length, bW.length)) * 0.2;
                return 0;
              };
              const findSuggestMatch = (name: string): AdminRecord | null => {
                let best: AdminRecord | null = null; let bestScore = 0;
                for (const ing of ingredientsCache) {
                  const s = fuzzySuggestScore(name, ing.name_common || ing.name || '');
                  if (s > bestScore) { bestScore = s; best = ing; }
                }
                return bestScore >= 0.5 ? best : null;
              };

              const runAiIngredientSuggest = async () => {
                if (aiIngredientSuggesting) return;
                setAiIngredientSuggesting(true);
                setAiIngredientSuggestResults(null);
                try {
                  // Build context from record fields
                  const rec = editingRecord || {};
                  const contextParts: string[] = [];
                  if (rec.description_simple) contextParts.push(`Description: ${rec.description_simple}`);
                  if (rec.description) contextParts.push(`Description: ${rec.description}`);
                  if (rec.description_processing) contextParts.push(`Processing: ${rec.description_processing}`);
                  if (rec.health_benefits) contextParts.push(`Health benefits: ${typeof rec.health_benefits === 'string' ? rec.health_benefits : JSON.stringify(rec.health_benefits)}`);
                  if (rec.cooking_steps && Array.isArray(rec.cooking_steps)) {
                    const stepTexts = rec.cooking_steps.map((s: any) => typeof s === 'string' ? s : s.text).filter(Boolean).slice(0, 5);
                    if (stepTexts.length) contextParts.push(`Cooking steps: ${stepTexts.join(' | ')}`);
                  }
                  const context = contextParts.join('\n');
                  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
                  const abort = new AbortController();
                  const timer = setTimeout(() => abort.abort(), 60_000);
                  let res: Response;
                  try {
                    res = await fetch(url, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        tabType: adminFieldConfig[activeTab]?.label || activeTab,
                        recordData: { ...rec, linked_ingredients: [] }, // clear so AI fills it
                        fields: [{ key: 'linked_ingredients', label: 'Linked Ingredients', type: 'linked_ingredients' }],
                        context,
                      }),
                      signal: abort.signal,
                    });
                  } catch (e: any) {
                    clearTimeout(timer);
                    toast.error(e?.name === 'AbortError' ? 'AI timed out. Try again.' : `Network error: ${e?.message}`);
                    setAiIngredientSuggesting(false);
                    return;
                  } finally { clearTimeout(timer); }
                  const data = await res.json();
                  const raw: any[] = data?.filledFields?.linked_ingredients || [];
                  // raw may be array of strings (names) or UUIDs
                  const names: string[] = raw.map((r: any) => (typeof r === 'string' ? r : r.name || r.name_common || String(r))).filter(Boolean);
                  if (names.length === 0) { toast.info('AI found no ingredients to suggest'); setAiIngredientSuggesting(false); return; }
                  const results = names.map(name => ({ name, match: findSuggestMatch(name), score: 0, accepted: null as boolean | null, creating: false }));
                  setAiIngredientSuggestResults(results);
                } catch (e: any) {
                  toast.error(`AI suggest failed: ${e?.message || e}`);
                } finally {
                  setAiIngredientSuggesting(false);
                }
              };

              const acceptSuggest = (idx: number) => {
                if (!aiIngredientSuggestResults) return;
                const r = aiIngredientSuggestResults[idx];
                if (!r.match) return;
                if (!linkedIds.includes(r.match.id)) updateField([...linkedIds, r.match.id]);
                setAiIngredientSuggestResults(prev => prev ? prev.map((x, i) => i === idx ? { ...x, accepted: true } : x) : prev);
              };
              const rejectSuggest = (idx: number) => setAiIngredientSuggestResults(prev => prev ? prev.map((x, i) => i === idx ? { ...x, accepted: false } : x) : prev);
              const acceptAllSuggests = () => {
                if (!aiIngredientSuggestResults) return;
                const toAdd = aiIngredientSuggestResults.filter(r => r.match && r.accepted === null).map(r => r.match!.id);
                updateField([...new Set([...linkedIds, ...toAdd])]);
                setAiIngredientSuggestResults(prev => prev ? prev.map(r => r.match ? { ...r, accepted: true } : r) : prev);
              };
              const createSuggestSkeleton = async (idx: number) => {
                if (!aiIngredientSuggestResults) return;
                const r = aiIngredientSuggestResults[idx];
                setAiIngredientSuggestResults(prev => prev ? prev.map((x, i) => i === idx ? { ...x, creating: true } : x) : prev);
                try {
                  const skeletonId = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  const res2 = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/create`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'catalog_ingredients', record: { id: skeletonId, name_common: r.name, category: 'unknown' } }),
                  });
                  if (res2.ok) {
                    const newIng: AdminRecord = { id: skeletonId, name_common: r.name, category: 'unknown' };
                    setIngredientsCache(prev => [...prev, newIng]);
                    updateField([...new Set([...linkedIds, skeletonId])]);
                    setAiIngredientSuggestResults(prev => prev ? prev.map((x, i) => i === idx ? { ...x, match: newIng, accepted: true, creating: false } : x) : prev);
                  } else {
                    setAiIngredientSuggestResults(prev => prev ? prev.map((x, i) => i === idx ? { ...x, creating: false } : x) : prev);
                  }
                } catch { setAiIngredientSuggestResults(prev => prev ? prev.map((x, i) => i === idx ? { ...x, creating: false } : x) : prev); }
              };

              const suggestPendingCount = aiIngredientSuggestResults ? aiIngredientSuggestResults.filter(r => r.accepted === null).length : 0;

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label} <span className="text-gray-400 font-normal normal-case">({linkedIds.length} linked)</span></Label>
                    <button type="button" onClick={runAiIngredientSuggest} disabled={aiIngredientSuggesting || ingredientsCache.length === 0}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 disabled:opacity-50 transition-colors">
                      {aiIngredientSuggesting ? <><Loader2 className="w-3 h-3 animate-spin" /> Suggesting…</> : <><Sparkles className="w-3 h-3" /> AI Suggest</>}
                    </button>
                  </div>

                  {/* AI Suggest Results Panel */}
                  {aiIngredientSuggestResults && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/60 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-violet-100 border-b border-violet-200">
                        <span className="text-xs font-semibold text-violet-800">✨ AI Suggested Ingredients — {aiIngredientSuggestResults.length} found</span>
                        <div className="flex gap-1.5">
                          {suggestPendingCount > 0 && (
                            <button type="button" onClick={acceptAllSuggests}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
                              Accept All ({suggestPendingCount})
                            </button>
                          )}
                          <button type="button" onClick={() => setAiIngredientSuggestResults(null)}
                            className="text-[10px] text-violet-600 hover:text-red-600 px-1.5 py-0.5 rounded bg-white border border-violet-200 hover:border-red-200">✕ Close</button>
                        </div>
                      </div>
                      <div className="divide-y divide-violet-100 max-h-72 overflow-y-auto">
                        {aiIngredientSuggestResults.map((result, idx) => (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-2 text-xs ${result.accepted === true ? 'bg-green-50' : result.accepted === false ? 'bg-gray-50 opacity-50' : 'bg-white'}`}>
                            <span className="font-medium text-gray-700 w-36 truncate flex-shrink-0" title={result.name}>{result.name}</span>
                            <span className="text-gray-300 flex-shrink-0">→</span>
                            {result.match ? (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                {result.match.image_url ? (
                                  <img src={result.match.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0 border border-gray-100" />
                                ) : (
                                  <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-emerald-100 text-emerald-700">
                                    {(result.match.name_common || result.match.name || '?')[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-800 truncate">{result.match.name_common || result.match.name}</div>
                                  {result.match.category && <span className="text-[9px] text-gray-400">{result.match.category}</span>}
                                </div>
                              </div>
                            ) : (
                              <span className="flex-1 text-gray-400 italic text-[10px]">No match in catalog</span>
                            )}
                            {result.accepted === true && <span className="text-green-600 font-bold flex-shrink-0">✓ Linked</span>}
                            {result.accepted === false && <span className="text-gray-400 flex-shrink-0">Skipped</span>}
                            {result.accepted === null && (
                              <div className="flex gap-1 flex-shrink-0">
                                {result.match && (
                                  <button type="button" onClick={() => acceptSuggest(idx)}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-600 text-white hover:bg-violet-700">✓ Link</button>
                                )}
                                <button type="button" onClick={() => createSuggestSkeleton(idx)} disabled={result.creating}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">
                                  {result.creating ? '…' : '+ Create'}
                                </button>
                                <button type="button" onClick={() => rejectSuggest(idx)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {field.placeholder && linkedIds.length === 0 && !aiIngredientSuggestResults && (
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
                            <div className="flex items-center gap-1.5">
                              <div className="text-xs font-semibold text-gray-800 truncate flex-1">{ing.name_common || ing.name}</div>
                              {ing.health_score != null && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                  ing.health_score >= 75 ? 'bg-green-100 text-green-700' :
                                  ing.health_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>{ing.health_score}</span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-1 mt-0.5">
                              {ing.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-200 text-emerald-800">{ing.category}</span>}
                              {(() => {
                                const elems: string[] = Array.isArray(ing.elements_beneficial)
                                  ? ing.elements_beneficial.slice(0, 3)
                                  : typeof ing.elements_beneficial === 'string' && ing.elements_beneficial
                                    ? String(ing.elements_beneficial).split(',').map((s: string) => s.trim()).slice(0, 3)
                                    : [];
                                return elems.map((el: string) => (
                                  <span key={el} className="text-[9px] px-1 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">{el}</span>
                                ));
                              })()}
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
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
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

            // ── Element Sources Viewer ────────────────────────────────────────
            if (field.type === 'element_sources_viewer') {
              const elementId = editingRecord?.id as string | undefined;
              const isLoaded = elementSourcesCache?.elementId === elementId;
              const sources = isLoaded ? elementSourcesCache!.sources : [];
              const fetchSources = async () => {
                if (!elementId || elementSourcesLoading) return;
                setElementSourcesLoading(true);
                try {
                  const metaEnv = (import.meta as any).env || {};
                  const url = `${metaEnv.VITE_SUPABASE_URL}/rest/v1/catalog_ingredients?select=id,name_common,image_url,elements_beneficial,elements_hazardous&limit=1000`;
                  const res = await fetch(url, { headers: { 'apikey': metaEnv.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken || metaEnv.VITE_SUPABASE_ANON_KEY}` } });
                  if (res.ok) {
                    const all: any[] = await res.json();
                    const matching = all.filter(ing => {
                      const ben = ing.elements_beneficial;
                      const haz = ing.elements_hazardous;
                      if (ben && typeof ben === 'object') {
                        const keys = Object.keys(ben);
                        if (keys.includes(elementId)) return true;
                        for (const k of keys) {
                          const section = ben[k];
                          if (section && typeof section === 'object' && Object.keys(section).includes(elementId)) return true;
                        }
                      }
                      if (haz && typeof haz === 'object' && Object.keys(haz).includes(elementId)) return true;
                      return false;
                    });
                    setElementSourcesCache({ elementId, sources: matching });
                  }
                } catch (e) { console.error('[Admin] Failed to fetch element sources:', e); }
                finally { setElementSourcesLoading(false); }
              };
              const getQty = (ing: any): string => {
                const ben = ing.elements_beneficial;
                if (ben && typeof ben === 'object') {
                  if (ben[elementId!] !== undefined) {
                    const v = ben[elementId!];
                    if (typeof v === 'object' && v !== null) return v.per_100g != null ? `${v.per_100g}` : '';
                    if (typeof v === 'number') return `${v}`;
                  }
                  for (const k of Object.keys(ben)) {
                    const section = ben[k];
                    if (section && typeof section === 'object' && section[elementId!] !== undefined) {
                      const v = section[elementId!];
                      if (typeof v === 'object' && v !== null) return v.per_100g != null ? `${v.per_100g}` : '';
                      if (typeof v === 'number') return `${v}`;
                    }
                  }
                }
                return '';
              };
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                    <button type="button" onClick={fetchSources} disabled={elementSourcesLoading}
                      className="h-6 px-2 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-medium disabled:opacity-50">
                      {elementSourcesLoading ? 'Loading…' : isLoaded ? `↻ Refresh (${sources.length})` : 'Load Ingredients'}
                    </button>
                  </div>
                  {isLoaded && sources.length === 0 && (
                    <div className="text-center py-4 text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      No ingredients found containing this element
                    </div>
                  )}
                  {isLoaded && sources.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                      {sources.map((ing: any) => {
                        const qty = getQty(ing);
                        const name = ing.name_common || ing.name || ing.id;
                        const initials = name.slice(0, 2).toUpperCase();
                        return (
                          <button key={ing.id} type="button" onClick={() => openIngredientRecord(ing)}
                            className="flex items-center gap-2 p-1.5 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-left transition-all group">
                            {ing.image_url ? (
                              <img src={ing.image_url} alt={name} className="w-8 h-8 rounded-md object-cover flex-shrink-0 border border-gray-100" />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-green-700">{initials}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-medium text-gray-800 truncate group-hover:text-blue-700">{name}</div>
                              {qty && <div className="text-[9px] text-green-700 font-mono">{qty} / 100g</div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
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
              console.log('[Grouped Ingredients Render] rawItems:', rawItems);

              // Fuzzy score: 1.0 = exact, 0.0 = no match
              const fuzzyScore = (a: string, b: string): number => {
                const an = a.toLowerCase().trim();
                const bn = b.toLowerCase().trim();
                if (an === bn) return 1.0;
                if (bn.includes(an) || an.includes(bn)) return 0.85;
                const aWords = an.split(/\s+/);
                const bWords = bn.split(/\s+/);
                const shared = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
                if (shared.length > 0) return 0.6 + (shared.length / Math.max(aWords.length, bWords.length)) * 0.2;
                return 0;
              };

              const findBestMatch = (name: string): { match: AdminRecord | null; score: number } => {
                let best: AdminRecord | null = null;
                let bestScore = 0;
                for (const ing of ingredientsCache) {
                  const s = fuzzyScore(name, ing.name_common || ing.name || '');
                  if (s > bestScore) { bestScore = s; best = ing; }
                }
                return { match: bestScore >= 0.5 ? best : null, score: bestScore };
              };

              const runAutoLink = () => {
                // Collect all flat ingredient names from rawItems
                const names: string[] = [];
                for (const entry of rawItems) {
                  if (entry.group !== undefined) {
                    for (const child of (entry.items || [])) {
                      if (child.name) names.push(child.name);
                    }
                  } else if (entry.name) {
                    names.push(entry.name);
                  }
                }
                const unique = [...new Set(names)];
                const results = unique.map(name => {
                  const { match, score } = findBestMatch(name);
                  const autoAccept = match && score >= 0.85;
                  return { name, match, score, accepted: autoAccept ? true : null as boolean | null, creating: false };
                });
                setAutoLinkResults(results);
                // Auto-link high-confidence matches immediately
                const currentLinked: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                const newIds = results.filter(r => r.accepted === true && r.match).map(r => r.match!.id).filter(id => !currentLinked.includes(id));
                if (newIds.length > 0) {
                  setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: [...currentLinked, ...newIds] }));
                }
              };

              const acceptAutoLink = (idx: number) => {
                if (!autoLinkResults) return;
                const result = autoLinkResults[idx];
                if (!result.match) return;
                // Add to linked_ingredients on editingRecord
                const currentLinked: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                if (!currentLinked.includes(result.match.id)) {
                  setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: [...currentLinked, result.match!.id] }));
                }
                setAutoLinkResults(prev => prev ? prev.map((r, i) => i === idx ? { ...r, accepted: true } : r) : prev);
              };

              const rejectAutoLink = (idx: number) => {
                setAutoLinkResults(prev => prev ? prev.map((r, i) => i === idx ? { ...r, accepted: false } : r) : prev);
              };

              const createSkeleton = async (idx: number) => {
                if (!autoLinkResults) return;
                const result = autoLinkResults[idx];
                setAutoLinkResults(prev => prev ? prev.map((r, i) => i === idx ? { ...r, creating: true } : r) : prev);
                try {
                  const skeletonId = result.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/catalog/create`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table: 'catalog_ingredients', record: { id: skeletonId, name_common: result.name, category: 'unknown' } }),
                  });
                  if (res.ok) {
                    const newIng: AdminRecord = { id: skeletonId, name_common: result.name, category: 'unknown' };
                    setIngredientsCache(prev => [...prev, newIng]);
                    const currentLinked: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                    setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: [...currentLinked, skeletonId] }));
                    setAutoLinkResults(prev => prev ? prev.map((r, i) => i === idx ? { ...r, match: newIng, accepted: true, creating: false } : r) : prev);
                  } else {
                    setAutoLinkResults(prev => prev ? prev.map((r, i) => i === idx ? { ...r, creating: false } : r) : prev);
                  }
                } catch {
                  setAutoLinkResults(prev => prev ? prev.map((r, i) => i === idx ? { ...r, creating: false } : r) : prev);
                }
              };

              const acceptAll = () => {
                if (!autoLinkResults) return;
                const toAdd = autoLinkResults.filter(r => r.match && r.accepted === null).map(r => r.match!.id);
                const currentLinked: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                const merged = [...new Set([...currentLinked, ...toAdd])];
                setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: merged }));
                setAutoLinkResults(prev => prev ? prev.map(r => r.match ? { ...r, accepted: true } : r) : prev);
              };

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

              const addItem = () => updateItems([...rawItems, { name: '', ingredient_id: null, qty_g: null, unit: 'g' }]);
              const addGroup = () => updateItems([...rawItems, { group: 'Group Name', items: [{ name: '', ingredient_id: null, qty_g: null, unit: 'g' }] }]);

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
                const group = { ...next[parentIdx], items: [...(next[parentIdx].items || []), { name: '', ingredient_id: null, qty_g: null, unit: 'g' }] };
                next[parentIdx] = group;
                updateItems(next);
              };

              const pendingCount = autoLinkResults ? autoLinkResults.filter(r => r.accepted === null).length : 0;

              const runAiGroupedSuggest = async () => {
                if (aiIngredientSuggesting) return;
                setAiIngredientSuggesting(true);
                setAutoLinkResults(null);
                try {
                  const rec = editingRecord || {};
                  const contextParts: string[] = [];
                  if (rec.description_simple) contextParts.push(`Description: ${rec.description_simple}`);
                  if (rec.description) contextParts.push(`Description: ${rec.description}`);
                  if (rec.description_processing) contextParts.push(`Processing: ${rec.description_processing}`);
                  if (rec.health_benefits) contextParts.push(`Health benefits: ${typeof rec.health_benefits === 'string' ? rec.health_benefits : JSON.stringify(rec.health_benefits)}`);
                  const context = contextParts.join('\n');
                  const url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`;
                  const abort = new AbortController();
                  const timer = setTimeout(() => abort.abort(), 60_000);
                  let res: Response;
                  try {
                    res = await fetch(url, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        tabType: adminFieldConfig[activeTab]?.label || activeTab,
                        recordData: { ...rec, ingredients: [] },
                        fields: [{ key: 'ingredients', label: 'Ingredients', type: 'grouped_ingredients' }],
                        context,
                      }),
                      signal: abort.signal,
                    });
                  } catch (e: any) {
                    clearTimeout(timer);
                    toast.error(e?.name === 'AbortError' ? 'AI timed out. Try again.' : `Network error: ${e?.message}`);
                    setAiIngredientSuggesting(false);
                    return;
                  } finally { clearTimeout(timer); }
                  const data = await res.json();
                  // AI returns array of {name, ingredient_id} | {group, items:[...]}
                  const suggested: any[] = data?.filledFields?.ingredients || [];
                  if (suggested.length === 0) { toast.info('AI found no ingredients to suggest'); setAiIngredientSuggesting(false); return; }
                  // Merge with existing items (don't overwrite)
                  const existingNames = new Set<string>();
                  for (const e of rawItems) {
                    if (e.group !== undefined) { for (const c of (e.items || [])) if (c.name) existingNames.add(c.name.toLowerCase()); }
                    else if (e.name) existingNames.add(e.name.toLowerCase());
                  }
                  const newItems = suggested.filter((e: any) => {
                    if (e.group !== undefined) return true;
                    return !existingNames.has((e.name || '').toLowerCase());
                  }).map((e: any) => {
                    if (e.group !== undefined) {
                      return { group: e.group, items: (e.items || []).map((c: any) => ({ name: c.name || '', ingredient_id: resolveIngredient(c.name || ''), qty_g: c.qty_g ?? null, unit: c.unit || 'g' })) };
                    }
                    return { name: e.name || '', ingredient_id: resolveIngredient(e.name || ''), qty_g: e.qty_g ?? null, unit: e.unit || 'g' };
                  });
                  const merged = [...rawItems, ...newItems];
                  updateItems(merged);
                  toast.success(`AI added ${newItems.length} ingredient${newItems.length !== 1 ? 's' : ''} — click Auto-Link to match catalog records`);
                  // Auto-trigger Auto-Link on the merged list
                  const allNames: string[] = [];
                  for (const entry of merged) {
                    if (entry.group !== undefined) { for (const child of (entry.items || [])) if (child.name) allNames.push(child.name); }
                    else if (entry.name) allNames.push(entry.name);
                  }
                  const unique = [...new Set(allNames)];
                  const linkResults = unique.map(name => { const { match, score } = findBestMatch(name); const autoAccept = match && score >= 0.85; return { name, match, score, accepted: autoAccept ? true : null as boolean | null, creating: false }; });
                  setAutoLinkResults(linkResults);
                  // Auto-link high-confidence matches immediately
                  const curLinked: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                  const autoIds = linkResults.filter(r => r.accepted === true && r.match).map(r => r.match!.id).filter(id => !curLinked.includes(id));
                  if (autoIds.length > 0) {
                    setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: [...curLinked, ...autoIds] }));
                  }
                } catch (e: any) {
                  toast.error(`AI suggest failed: ${e?.message || e}`);
                } finally {
                  setAiIngredientSuggesting(false);
                }
              };

              return (
                <div key={field.key} className="space-y-3">
                  {/* AI Enrich All banner */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-50 border border-violet-200">
                    <span className="text-xs font-semibold text-violet-700">Ingredients &amp; Steps</span>
                    <button type="button" onClick={handleAiEnrichRecipe} disabled={generatingRecipeEnrich}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-white hover:bg-violet-50 text-violet-700 border border-violet-300 disabled:opacity-50 transition-colors shadow-sm">
                      {generatingRecipeEnrich ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {generatingRecipeEnrich ? 'Enriching & Saving…' : 'AI Enrich All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* COL 1: Equipment */}
                  <div className="space-y-2 md:border-r border-gray-100 md:pr-4">
                    <CookingToolsField
                      val={editingRecord?.equipment}
                      updateField={(v) => setEditingRecord((prev: any) => ({ ...prev, equipment: v }))}
                      accessToken={accessToken}
                      onAiEnrich={handleAiEnrichRecipe}
                      enriching={generatingRecipeEnrich}
                      externalCatalog={equipmentCache}
                    />
                  </div>

                  {/* COL 2: Ingredients — image+text tags + search to link */}
                  <div className="space-y-2 md:border-r border-gray-100 md:pr-4">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      🥗 Ingredients
                      {(() => { const linkedIds: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : []; return linkedIds.length > 0 ? <span className="ml-1 text-[10px] font-light italic text-gray-400 normal-case tracking-normal">{linkedIds.length} linked</span> : null; })()}
                    </Label>
                    <div className="flex gap-1 flex-wrap">
                      <button type="button" onClick={runAiGroupedSuggest} disabled={aiIngredientSuggesting || ingredientsCache.length === 0}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 disabled:opacity-50 transition-colors">
                        {aiIngredientSuggesting ? <><Loader2 className="w-3 h-3 animate-spin" />…</> : <><Sparkles className="w-3 h-3" /> AI Enrich</>}
                      </button>
                      {rawItems.length > 0 && (
                        <button type="button" onClick={runAutoLink}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                          Link
                        </button>
                      )}
                      <button type="button" onClick={addGroup}
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-medium px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">+ Grp</button>
                      <button type="button" onClick={addItem}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">+ Item</button>
                    </div>
                  </div>

                  {/* Linked ingredients with qty per portion + equipment images */}
                  {(() => {
                    const linkedIds: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                    const linkedIngs = ingredientsCache.filter((ing: AdminRecord) => linkedIds.includes(ing.id));
                    const rawItems: any[] = Array.isArray(editingRecord?.ingredients) ? editingRecord.ingredients : [];
                    const getQty = (ingId: string) => {
                      for (const entry of rawItems) {
                        if (entry?.group !== undefined) {
                          for (const child of (entry.items || [])) {
                            if (child.ingredient_id === ingId) return { qty_g: child.qty_g, unit: child.unit };
                          }
                        } else if (entry?.ingredient_id === ingId) {
                          return { qty_g: entry.qty_g, unit: entry.unit };
                        }
                      }
                      return null;
                    };
                    // Get equipment records for selected tools
                    const selectedEquipment: string[] = Array.isArray(editingRecord?.equipment) ? editingRecord.equipment : [];
                    const equipmentRecords = selectedEquipment.map(name => equipmentCache.find(e => e.name === name)).filter(Boolean);
                    
                    if (linkedIngs.length === 0 && equipmentRecords.length === 0) return null;
                    return (
                      <div className="space-y-1 pb-1">
                        {linkedIngs.map((ing: AdminRecord) => {
                          const qty = getQty(ing.id);
                          return (
                            <div key={ing.id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5">
                              {ing.image_url ? (
                                <img src={ing.image_url} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0">
                                  {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                {qty && qty.qty_g != null && (
                                  <span className="text-[10px] font-semibold text-emerald-700 flex-shrink-0">
                                    {qty.qty_g}g
                                  </span>
                                )}
                                {qty && qty.qty_g != null && <span className="text-gray-400 text-[10px]">•</span>}
                                <span className="text-[10px] font-medium text-gray-800 truncate">{ing.name_common || ing.name}</span>
                              </div>
                              <button type="button" onClick={() => {
                                const cur: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                                setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: cur.filter((id: string) => id !== ing.id) }));
                              }} className="text-gray-300 hover:text-red-500 text-sm font-bold leading-none flex-shrink-0">&times;</button>
                            </div>
                          );
                        })}
                        {equipmentRecords.length > 0 && (
                          <>
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pt-1">Equipment</div>
                            {equipmentRecords.map((eq: any) => (
                              <div key={eq.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1.5">
                                {eq.image_url ? (
                                  <img src={eq.image_url} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-7 h-7 rounded-md bg-orange-200 flex items-center justify-center text-[10px] font-bold text-orange-700 flex-shrink-0">
                                    🔧
                                  </div>
                                )}
                                <span className="text-[10px] font-medium text-gray-800 truncate flex-1">{eq.name}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Ingredient search to add */}
                  {(() => {
                    const linkedIds: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                    const available = ingredientsCache.filter((ing: AdminRecord) => !linkedIds.includes(ing.id) && (!ingredientSearchQuery || (ing.name_common || ing.name || '').toLowerCase().includes(ingredientSearchQuery.toLowerCase()))).slice(0, 8);
                    return (
                      <div className="space-y-1">
                        <input
                          value={ingredientSearchQuery}
                          onChange={e => setIngredientSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                          placeholder="Search to link ingredient..."
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        {ingredientSearchQuery && available.length > 0 && (
                          <div className="border border-gray-200 rounded-lg max-h-36 overflow-y-auto bg-white">
                            {available.map((ing: AdminRecord) => (
                              <button key={ing.id} type="button"
                                onClick={() => {
                                  const cur: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                                  if (!cur.includes(ing.id)) setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: [...cur, ing.id] }));
                                  setIngredientSearchQuery('');
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2">
                                {ing.image_url ? (
                                  <img src={ing.image_url} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                                ) : (
                                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                    {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                                  </span>
                                )}
                                <span className="font-medium flex-1 truncate">{ing.name_common || ing.name}</span>
                                <span className="text-[9px] text-gray-400 flex-shrink-0">{ing.category}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Auto-Link Results Panel */}
                  {autoLinkResults && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-emerald-100 border-b border-emerald-200">
                        <span className="text-xs font-semibold text-emerald-800">🔗 Auto-Link — {autoLinkResults.length}</span>
                        <div className="flex gap-1.5">
                          {pendingCount > 0 && (
                            <button type="button" onClick={acceptAll}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                              Accept All ({autoLinkResults.filter(r => r.match && r.accepted === null).length})
                            </button>
                          )}
                          <button type="button" onClick={() => setAutoLinkResults(null)}
                            className="text-[10px] text-emerald-600 hover:text-red-600 px-1.5 py-0.5 rounded bg-white border border-emerald-200 hover:border-red-200">
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-emerald-100 max-h-48 overflow-y-auto">
                        {autoLinkResults.map((result, idx) => (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-2 text-xs ${result.accepted === true ? 'bg-green-50' : result.accepted === false ? 'bg-gray-50 opacity-50' : 'bg-white'}`}>
                            <input
                              value={result.name}
                              onChange={(e) => {
                                const nx = [...autoLinkResults];
                                nx[idx] = { ...nx[idx], name: e.target.value };
                                setAutoLinkResults(nx);
                              }}
                              className="font-medium text-gray-700 w-28 px-1.5 py-0.5 border border-gray-200 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-400 flex-shrink-0"
                              placeholder="Ingredient name"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nx = [...autoLinkResults];
                                const newMatch = findBestMatch(result.name);
                                nx[idx] = { ...nx[idx], match: newMatch.match, score: newMatch.score };
                                setAutoLinkResults(nx);
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold flex-shrink-0"
                              title="Re-match"
                            >
                              ↻
                            </button>
                            <span className="text-gray-300 flex-shrink-0">→</span>
                            {result.match ? (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                {result.match.image_url ? (
                                  <img src={result.match.image_url} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-emerald-200 text-emerald-700 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                    {(result.match.name_common || '?')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="font-semibold text-emerald-800 truncate">{result.match.name_common}</span>
                                <span className="text-[9px] text-gray-400 flex-shrink-0">{Math.round(result.score * 100)}%</span>
                              </div>
                            ) : (
                              <span className="flex-1 text-gray-400 italic text-[10px]">No match</span>
                            )}
                            {result.accepted === true && <span className="text-green-600 font-bold flex-shrink-0">✓</span>}
                            {result.accepted === false && <span className="text-gray-400 flex-shrink-0">–</span>}
                            {result.accepted === null && (
                              <div className="flex gap-1 flex-shrink-0">
                                {result.match && (
                                  <button type="button" onClick={() => acceptAutoLink(idx)}
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">✓</button>
                                )}
                                <button type="button" onClick={() => createSkeleton(idx)} disabled={result.creating}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">
                                  {result.creating ? '…' : '+'}
                                </button>
                                <button type="button" onClick={() => rejectAutoLink(idx)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ingredient qty + group editor — always visible */}
                  <div className="space-y-1.5">
                  {rawItems.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No items yet — click + Item or + Grp above.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {rawItems.map((entry: any, idx: number) => {
                        if (entry && entry.group !== undefined) {
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
                                    <div key={cidx} className="flex items-center gap-1 pl-3">
                                      <span className="text-gray-300 text-xs">└</span>
                                      {linked?.image_url ? (
                                        <img src={linked.image_url} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                                      ) : (
                                        <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-[8px] font-bold text-purple-600 flex-shrink-0">
                                          {(linked?.name_common || child?.name || '?')[0]?.toUpperCase() || '?'}
                                        </div>
                                      )}
                                      <select
                                        value={child.ingredient_id || ''}
                                        onChange={(e) => {
                                          const ing = ingredientsCache.find((i: AdminRecord) => i.id === e.target.value);
                                          updateChild(idx, cidx, { ingredient_id: e.target.value, name: ing ? (ing.name_common || ing.name) : child?.name });
                                        }}
                                        title="Select ingredient"
                                        className={`flex-1 h-6 px-1.5 text-xs border rounded bg-white focus:ring-1 focus:ring-purple-300 ${linked ? 'border-green-300 text-green-800' : 'border-gray-200'}`}
                                      >
                                        <option value="">{child.name || '— select —'}</option>
                                        {ingredientsCache.map((ing: AdminRecord) => (
                                          <option key={ing.id} value={ing.id}>{ing.name_common || ing.name}</option>
                                        ))}
                                      </select>
                                      <input type="number" value={child.qty_g ?? ''} onChange={(e) => updateChild(idx, cidx, { qty_g: e.target.value ? parseFloat(e.target.value) : null })} className="w-14 h-6 px-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-purple-300 text-right" placeholder="qty" min="0" step="any" />
                                      <select value={child.unit || 'g'} onChange={(e) => updateChild(idx, cidx, { unit: e.target.value })} className="h-6 px-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-purple-300" title="Unit">
                                        {['g','ml','kg','L','tsp','tbsp','cup','oz','lb','piece','slice','pinch'].map(u => <option key={u} value={u}>{u}</option>)}
                                      </select>
                                      <button type="button" onClick={() => removeChild(idx, cidx)} className="text-red-400 hover:text-red-600 text-sm px-1 rounded hover:bg-red-50">&times;</button>
                                    </div>
                                  );
                                })}
                                {(entry.items || []).length === 0 && <p className="text-[10px] text-gray-400 italic pl-3">No children. Click + Add.</p>}
                              </div>
                            </div>
                          );
                        }
                        const linked = entry?.ingredient_id ? ingredientsCache.find((ing: AdminRecord) => ing.id === entry.ingredient_id) : null;
                        return (
                          <div key={idx} className="flex items-center gap-1">
                            {linked?.image_url ? (
                              <img src={linked.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-600 flex-shrink-0">
                                {(linked?.name_common || entry?.name || '?')[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <select
                              value={entry?.ingredient_id || ''}
                              onChange={(e) => {
                                const ing = ingredientsCache.find((i: AdminRecord) => i.id === e.target.value);
                                updateEntry(idx, { ingredient_id: e.target.value, name: ing ? (ing.name_common || ing.name) : entry?.name });
                              }}
                              title="Select ingredient"
                              className={`flex-1 h-7 px-1.5 text-xs border rounded bg-white focus:ring-1 focus:ring-blue-300 ${linked ? 'border-green-300 text-green-800' : 'border-gray-200'}`}
                            >
                              <option value="">{entry?.name || '— select ingredient —'}</option>
                              {ingredientsCache.map((ing: AdminRecord) => (
                                <option key={ing.id} value={ing.id}>{ing.name_common || ing.name}</option>
                              ))}
                            </select>
                            <input type="number" value={entry?.qty_g ?? ''} onChange={(e) => updateEntry(idx, { qty_g: e.target.value ? parseFloat(e.target.value) : null })} className="w-14 h-7 px-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-300 text-right" placeholder="qty" min="0" step="any" />
                            <select value={entry?.unit || 'g'} onChange={(e) => updateEntry(idx, { unit: e.target.value })} className="h-7 px-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-300" title="Unit">
                              {['g','ml','kg','L','tsp','tbsp','cup','oz','lb','piece','slice','pinch'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <button type="button" onClick={() => removeEntry(idx)} className="text-red-400 hover:text-red-600 px-1.5 text-sm shrink-0 rounded hover:bg-red-50">&times;</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                  </div>{/* end col 2 */}

                  {/* COL 3: Cooking Steps */}
                  <div className="space-y-2">
                    {(() => {
                      const linkedIds: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                      const linkedIngs = ingredientsCache.filter((ing: AdminRecord) => linkedIds.includes(ing.id));
                      return (
                        <CookingStepsField
                          val={editingRecord?.instructions}
                          updateField={(v) => setEditingRecord((prev: any) => ({ ...prev, instructions: v }))}
                          accessToken={accessToken as string}
                          linkedIngredients={linkedIngs}
                          allIngredients={ingredientsCache}
                          recordData={editingRecord}
                          catalogEquipment={equipmentCache}
                          onUpdateRecord={(updates) => setEditingRecord((prev: any) => ({ ...prev, ...updates }))}
                        />
                      );
                    })()}
                  </div>
                  </div>{/* end grid */}
                </div>
              );
            }

            if (field.type === 'cooking_tools') {
              return null; // rendered inside grouped_ingredients 3-col layout above
            }

            if (field.type === 'cooking_steps') {
              return null; // rendered inside grouped_ingredients 3-col layout above
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

            // Default: text input (or JSON textarea for complex objects)
            if (val !== null && val !== undefined && typeof val === 'object') {
              const jsonStr = JSON.stringify(val, null, 2);
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                  <textarea
                    title={field.label}
                    value={jsonStr}
                    onChange={(e) => { try { updateField(JSON.parse(e.target.value)); } catch { updateField(e.target.value); } }}
                    className={`${textareaCls} min-h-24 font-mono text-xs`}
                  />
                </div>
              );
            }
            return (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</Label>
                <input value={typeof val === 'string' || typeof val === 'number' ? String(val) : ''} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} className={inputCls} />
              </div>
            );
          };

          // Section definitions — which sections belong to which tab
          const CULINARY_SECTIONS = new Set([
            'Media', 'Basic Info', 'Cooking Details', 'Ingredients', 'Ingredients & Steps',
            'Flavor Profile', 'Descriptions', 'Processing', 'Culinary Origin',
          ]);
          const HEALTH_SECTIONS = new Set([
            'Media', 'Nutrition Data', 'Hazards & Risks', 'Health & Scoring',
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

          const SECTION_EMOJI: Record<string, string> = {
            'Media': '🖼️', 'Basic Info': '📋', 'Identity': '🔬', 'Chemistry': '⚗️',
            'Summary': '📝', 'Descriptions': '📄', 'Flavor Profile': '👅',
            'Cooking Details': '🍳', 'Culinary Origin': '🌍', 'Processing': '⚙️',
            'Ingredients': '🥗', 'Ingredients & Steps': '📖',
            'Functions & Benefits': '✅', 'Hazards & Risks': '⚠️',
            'Nutrition Data': '🧪', 'Health & Scoring': '💯', 'Scoring': '📊',
            'Thresholds & Range': '📏', 'DRV by Population': '👥',
            'Food Sources': '🌱', 'Detailed Sections': '📚',
            'Deficiency & Excess': '⚖️', 'Interactions': '🔗',
            'Detox & Exposure': '🛡️', 'References & Meta': '📎', 'Content': '📰',
          };

          const renderSections = (filterFn?: (sectionName: string) => boolean) =>
            [...sections.entries()]
              .filter(([sectionName]) => !filterFn || filterFn(sectionName))
              .map(([sectionName, fields]) => {
                const isMediaSection = sectionName === 'Media';
                const isBasicInfoSection = sectionName === 'Basic Info';
                const isSummarySection = sectionName === 'Summary';
                const sectionCols = isMediaSection ? 5 : (isBasicInfoSection || isSummarySection) ? 3 : 2;
                const sKey = `sec_${activeTab}_${sectionName}`;
                const secOpen = isSectionOpen(sKey);
                const showAiButton = ['Basic Info', 'Processing', 'Nutrition Data', 'Hazards & Risks', 'Ingredients', 'Descriptions', 'Flavor Profile', 'Cooking Details', 'Identity', 'Summary', 'Culinary Origin', 'Media',
                  'Functions & Benefits', 'Thresholds & Range', 'Food Sources', 'Detailed Sections', 'Deficiency & Excess', 'Interactions', 'Detox & Exposure', 'References & Meta', 'Health & Scoring', 'Chemistry', 'Scoring',
                ].includes(sectionName);
                const isFillingSec = aiFillingSection === sectionName;
                const isVecOpen = vecSearchSection === sectionName;

                // Determine which catalog to search and which field to append to
                const vecCatalog: 'ingredients' | 'elements' | 'both' = (() => {
                  if (['Ingredients', 'Food Sources', 'Cooking Details', 'Ingredients & Steps'].includes(sectionName)) return 'ingredients';
                  if (['Functions & Benefits', 'Hazards & Risks', 'Nutrition Data', 'Health & Scoring', 'Scoring'].includes(sectionName)) return 'elements';
                  return 'both';
                })();

                // Fuzzy search over the relevant catalog
                const vecResults: AdminRecord[] = (() => {
                  if (!isVecOpen || !vecSearchQuery.trim()) return [];
                  const q = vecSearchQuery.toLowerCase();
                  const fuzzy = (r: AdminRecord) =>
                    (r.name_common || r.name || '').toLowerCase().includes(q) ||
                    (r.name_other || '').toLowerCase().includes(q) ||
                    (r.category || '').toLowerCase().includes(q);
                  if (vecCatalog === 'ingredients') return ingredientsCache.filter(fuzzy).slice(0, 10);
                  if (vecCatalog === 'elements') return elementsCache.filter(fuzzy).slice(0, 10);
                  // both: interleave results from each catalog, tag with _source
                  const ings = ingredientsCache.filter(fuzzy).slice(0, 5).map(r => ({ ...r, _vecSource: 'ingredient' }));
                  const els = elementsCache.filter(fuzzy).slice(0, 5).map(r => ({ ...r, _vecSource: 'element' }));
                  return [...ings, ...els];
                })();

                // Add a selected item to the right field on editingRecord
                const handleVecSelect = (item: AdminRecord) => {
                  if (!editingRecord) return;
                  const src = (item as any)._vecSource;
                  const isIngredient = vecCatalog === 'ingredients' || src === 'ingredient';
                  const isElement = vecCatalog === 'elements' || src === 'element';
                  if (isIngredient) {
                    const cur: string[] = Array.isArray(editingRecord.linked_ingredients) ? editingRecord.linked_ingredients : [];
                    if (!cur.includes(item.id)) {
                      setEditingRecord((prev: any) => ({ ...prev, linked_ingredients: [...cur, item.id] }));
                    }
                  } else if (isElement) {
                    const isBenSection = ['Functions & Benefits', 'Nutrition Data', 'Health & Scoring', 'Scoring'].includes(sectionName);
                    const fieldKey = isBenSection ? 'elements_beneficial' : 'elements_hazardous';
                    const cur: string[] = Array.isArray(editingRecord[fieldKey]) ? editingRecord[fieldKey] : [];
                    const name = item.name_common || item.name || '';
                    if (!cur.includes(name)) {
                      setEditingRecord((prev: any) => ({ ...prev, [fieldKey]: [...cur, name] }));
                    }
                  }
                  setVecSearchQuery('');
                };

                return (
                  <div key={sectionName} className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={() => toggleSection(sKey)}
                        className="flex-1 flex items-center gap-2 group cursor-pointer">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {SECTION_EMOJI[sectionName] && <span className="mr-1">{SECTION_EMOJI[sectionName]}</span>}
                          {sectionName}
                          <span className="ml-1.5 text-[10px] font-light italic text-gray-300 normal-case tracking-normal">{fields.length}</span>
                        </h4>
                        <div className="flex-1 h-px bg-gray-100" />
                        {secOpen ? <ChevronUp className="w-3 h-3 text-gray-300 group-hover:text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />}
                      </button>
                      {/* Vector search button — shown on all sections */}
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setVecSearchSection(isVecOpen ? null : sectionName); setVecSearchQuery(''); }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                          isVecOpen
                            ? 'bg-teal-100 text-teal-700 border-teal-300'
                            : 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100'
                        }`}
                        title={`Search catalog to add to ${sectionName}`}>
                        <Search className="w-3 h-3" />
                        {isVecOpen ? 'Close' : 'Search'}
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

                    {/* Inline vector search panel */}
                    {isVecOpen && (
                      <div className="mb-3 rounded-xl border border-teal-200 bg-teal-50/60 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-teal-100 border-b border-teal-200">
                          <Search className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <input
                            autoFocus
                            value={vecSearchQuery}
                            onChange={(e) => setVecSearchQuery(e.target.value)}
                            placeholder={
                              vecCatalog === 'ingredients' ? 'Search ingredients to add...' :
                              vecCatalog === 'elements' ? 'Search elements / nutrients to add...' :
                              'Search catalog...'
                            }
                            className="flex-1 text-xs bg-transparent outline-none placeholder-teal-400 text-teal-900"
                          />
                          <span className="text-[9px] text-teal-500 font-medium uppercase tracking-wide">
                            {vecCatalog === 'ingredients' ? 'Ingredients' : vecCatalog === 'elements' ? 'Elements' : 'Ingredients + Elements'}
                          </span>
                        </div>
                        {vecSearchQuery.trim() && (
                          <div className="divide-y divide-teal-100 max-h-48 overflow-y-auto">
                            {vecResults.length === 0 ? (
                              <p className="text-xs text-teal-400 italic px-3 py-2">No matches found</p>
                            ) : vecResults.map((item) => {
                              const alreadyLinked = (() => {
                                if (!editingRecord) return false;
                                const src = (item as any)._vecSource;
                                const checkIng = vecCatalog === 'ingredients' || src === 'ingredient';
                                const checkEl = vecCatalog === 'elements' || src === 'element';
                                if (checkIng) {
                                  const cur: string[] = Array.isArray(editingRecord.linked_ingredients) ? editingRecord.linked_ingredients : [];
                                  return cur.includes(item.id);
                                }
                                if (checkEl) {
                                  const isBenSection = ['Functions & Benefits', 'Nutrition Data', 'Health & Scoring', 'Scoring'].includes(sectionName);
                                  const fieldKey = isBenSection ? 'elements_beneficial' : 'elements_hazardous';
                                  const cur: string[] = Array.isArray(editingRecord[fieldKey]) ? editingRecord[fieldKey] : [];
                                  return cur.includes(item.name_common || item.name || '');
                                }
                                return false;
                              })();
                              return (
                                <button key={item.id} type="button"
                                  onClick={() => handleVecSelect(item)}
                                  disabled={alreadyLinked}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                    alreadyLinked ? 'opacity-40 cursor-not-allowed bg-white' : 'hover:bg-teal-50 bg-white'
                                  }`}>
                                  {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0 border border-gray-100" />
                                  ) : (
                                    <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-teal-100 text-teal-700">
                                      {(item.name_common || item.name || '?')[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-800 truncate">{item.name_common || item.name}</div>
                                    {item.category && <span className="text-[9px] text-gray-400">{item.category}</span>}
                                  </div>
                                  {alreadyLinked
                                    ? <span className="text-[9px] text-teal-500 font-semibold flex-shrink-0">✓ Added</span>
                                    : <span className="text-[9px] text-teal-600 font-semibold flex-shrink-0">+ Add</span>
                                  }
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {!vecSearchQuery.trim() && (
                          <p className="text-[10px] text-teal-400 italic px-3 py-2">
                            Type to search {vecCatalog === 'ingredients' ? `${ingredientsCache.length} ingredients` : vecCatalog === 'elements' ? `${elementsCache.length} elements` : 'catalog'}
                          </p>
                        )}
                      </div>
                    )}

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
                      {/* Linked ingredients + Compute Nutrition at top of health tab */}
                      {activeTab === 'recipes' && (() => {
                        const linkedIds: string[] = Array.isArray(editingRecord?.linked_ingredients) ? editingRecord.linked_ingredients : [];
                        const linkedIngs = ingredientsCache.filter((ing: any) => linkedIds.includes(ing.id));
                        const rawItems: any[] = Array.isArray(editingRecord?.ingredients) ? editingRecord.ingredients : [];
                        const getQty = (ingId: string) => {
                          for (const entry of rawItems) {
                            if (entry?.group !== undefined) {
                              for (const child of (entry.items || [])) {
                                if (child.ingredient_id === ingId) return { qty_g: child.qty_g, unit: child.unit };
                              }
                            } else if (entry?.ingredient_id === ingId) {
                              return { qty_g: entry.qty_g, unit: entry.unit };
                            }
                          }
                          return null;
                        };
                        return (
                          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-emerald-100 border-b border-emerald-200">
                              <span className="text-xs font-semibold text-emerald-800">🥗 Linked Ingredients ({linkedIngs.length})</span>
                              <button type="button" onClick={handleComputeNutrition} disabled={computingNutrition}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-sm">
                                {computingNutrition ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="text-sm">⚡</span>}
                                {computingNutrition ? 'Computing…' : 'Compute Nutrition'}
                              </button>
                            </div>
                            {linkedIngs.length === 0 ? (
                              <p className="text-xs text-gray-400 italic px-3 py-2">No linked ingredients — enrich recipe first.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 p-3">
                                {linkedIngs.map((ing: any) => {
                                  const qty = getQty(ing.id);
                                  return (
                                    <div key={ing.id} className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-lg px-2 py-1.5 shadow-sm">
                                      {ing.image_url ? (
                                        <img src={ing.image_url} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
                                      ) : (
                                        <div className="w-7 h-7 rounded-md bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700 flex-shrink-0">
                                          {(ing.name_common || ing.name || '?')[0].toUpperCase()}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="text-[10px] font-semibold text-gray-800 truncate">{ing.name_common || ing.name}</div>
                                        {qty && <div className="text-[9px] text-emerald-700 font-medium">{qty.qty_g != null ? `${qty.qty_g}${qty.unit || 'g'}` : ''}</div>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
