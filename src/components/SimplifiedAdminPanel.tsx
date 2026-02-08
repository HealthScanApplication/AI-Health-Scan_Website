import React, { useState, useEffect } from 'react';
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
  Plus,
  Image as ImageIcon,
  Mail,
  Calendar,
  User,
  Users,
  Leaf,
  UtensilsCrossed,
  CheckSquare,
  MoreHorizontal,
  X,
  Eye,
  RefreshCw,
  ChevronDown,
  FlaskConical,
  Package,
  Clock,
  ScanLine,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Share2,
  Zap,
  Target
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { FloatingDebugMenu } from './FloatingDebugMenu';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { adminFieldConfig, getFieldsForView, badgeColorMap, type FieldConfig } from '../config/adminFieldConfig';
import { WaitlistFunnelDashboard } from './admin/WaitlistFunnelDashboard';
import { CatalogMetricCards } from './admin/CatalogMetricCards';
import { ScanFunnelDashboard } from './admin/ScanFunnelDashboard';
import { AdminModal } from './ui/AdminModal';

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
  const [savingRecord, setSavingRecord] = useState(false);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ipGeoData, setIpGeoData] = useState<Record<string, { city?: string; country?: string; countryCode?: string; flag?: string }>>({});

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

  const tabs = [
    { id: 'waitlist', label: 'Waitlist', icon: <Clock className="w-4 h-4" />, table: 'waitlist' },
    { id: 'elements', label: 'Elements', icon: <FlaskConical className="w-4 h-4" />, table: 'catalog_elements' },
    { id: 'ingredients', label: 'Ingredients', icon: <Leaf className="w-4 h-4" />, table: 'catalog_ingredients' },
    { id: 'recipes', label: 'Recipes', icon: <UtensilsCrossed className="w-4 h-4" />, table: 'catalog_recipes' },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, table: 'catalog_products' },
    { id: 'scans', label: 'Scans', icon: <ScanLine className="w-4 h-4" />, table: 'scans' }
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

  // Category options for edit modal dropdowns
  const categoryOptions: Record<string, string[]> = {
    elements: ['beneficial', 'hazardous'],
    ingredients: ['vegetable', 'fruit', 'grain', 'protein', 'dairy', 'oil', 'spice', 'herb', 'sweetener', 'additive'],
    recipes: ['meal', 'beverage', 'condiment'],
    products: ['meal', 'snack', 'beverage', 'condiment', 'supplement'],
  };

  const typeOptions: Record<string, string[]> = {
    elements: ['vitamin', 'mineral', 'amino acid', 'fatty acid', 'antioxidant', 'heavy metal', 'pesticide', 'preservative', 'endocrine disruptor'],
    ingredients: ['raw', 'processed'],
    recipes: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side dish'],
    products: ['organic', 'conventional', 'fortified', 'dietary'],
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

  // Fetch records for current tab
  const fetchRecords = async () => {
    if (!currentTab) return;
    
    try {
      setLoading(true);
      console.log(`[Admin] Fetching ${currentTab.label} from ${currentTab.table}...`);
      
      // Build query with proper filters
      let url: string;
      
      // Use custom endpoint for KV-stored data (waitlist, products)
      if (activeTab === 'waitlist' || activeTab === 'products') {
        const kvEndpoint = activeTab === 'waitlist' ? 'admin/waitlist' : 'admin/products';
        url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/${kvEndpoint}`;
        console.log(`[Admin] Fetching ${currentTab.label} from KV store: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[Admin] Loaded ${data?.length || 0} ${currentTab.label} from KV store`);
          setRecords(Array.isArray(data) ? data : []);
        } else {
          const errorText = await response.text();
          console.warn(`[Admin] Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
          console.warn(`[Admin] Error response:`, errorText);
          setRecords([]);
        }
        setLoading(false);
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
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      console.log(`[Admin] Response: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[Admin] Loaded ${data?.length || 0} ${currentTab.label}`);
        setRecords(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.warn(`[Admin] Failed to fetch ${currentTab.label}:`, response.status, response.statusText);
        console.warn(`[Admin] Error:`, errorText);
        setRecords([]);
      }
    } catch (error) {
      console.error(`[Admin] Error fetching ${currentTab.label}:`, error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab, accessToken]);

  const handleEdit = (record: AdminRecord) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const handleViewDetail = (record: AdminRecord) => {
    setDetailRecord(record);
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    if (!editingRecord || !currentTab) return;
    setSavingRecord(true);

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
        const body = {
          table: currentTab.table,
          id: editingRecord.id,
          updates: editingRecord
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
        // Ingredients: raw = no processing, processed = any processing method present
        if (filterVal === 'processed') {
          if (type === 'raw' || type === '' || !type) return false;
        } else if (filterVal === 'raw') {
          if (type && type !== 'raw' && type !== 'vegetable' && type !== 'fruit' && type !== 'fish' && type !== 'whole grain') return false;
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
    
    // Filter by category if categoryFilter is set
    if (categoryFilter !== 'all' && record.category !== categoryFilter) return false;
    
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

  const renderTableHeader = () => {
    // No header needed for card-based layout
    return null;
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
              onClick={() => handleViewDetail(record)}
            />
          </div>
        ) : (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={displayName}
              className="w-16 h-16 rounded-lg object-cover hover:shadow-lg cursor-pointer transition-shadow"
              onClick={() => handleViewDetail(record)}
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
                onClick={() => handleViewDetail(record)}
              >
                {isWaitlist ? (
                  <span>
                    {record.email || 'No email'}
                    {record.name && record.name !== record.email?.split('@')[0] && (
                      <span className="text-xs font-normal text-gray-500 ml-1.5">({record.name})</span>
                    )}
                  </span>
                ) : displayName}
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
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{record.description}</p>
              )}
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
            <TabsList className="grid w-full grid-cols-6">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className={`gap-2 ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-md font-semibold border border-blue-200' : ''}`}>
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
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

                {/* Sub-category Filter Tabs */}
                {subFilters[tab.id] && (
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg justify-center">
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
                          onClick={() => { setSubFilter(sf.value); setCurrentPage(1); }}
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
                )}

                {/* Toolbar */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder={`Search ${tab.label.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
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

                {/* Pagination */}
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

      {/* Detail Modal (Read) — All tabs use AdminModal */}
      {detailRecord && activeTab === 'waitlist' ? (
        <AdminModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={detailRecord.email || 'User'}
          subtitle={detailRecord.name || undefined}
          size="lg"
          footer={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResendEmail(detailRecord.id, detailRecord.email || '')}
                  disabled={resendingEmail === detailRecord.id}
                  className={`gap-1.5 text-xs ${!detailRecord.confirmed ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                  variant={detailRecord.confirmed ? 'outline' : 'default'}
                >
                  <Mail className="w-3.5 h-3.5" />
                  {resendingEmail === detailRecord.id ? 'Sending...' : (detailRecord.confirmed ? 'Resend Email' : 'Send Confirmation')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(detailRecord)} className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
              <Button size="sm" onClick={() => { handleEdit(detailRecord); setShowDetailModal(false); }} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>
          }
        >
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${detailRecord.confirmed ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${detailRecord.confirmed ? 'bg-green-500' : 'bg-amber-500'}`} />
              {detailRecord.confirmed ? 'Confirmed' : 'Unconfirmed'}
            </span>
            {detailRecord.position && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">
                #{detailRecord.position} in queue
              </span>
            )}
            {(detailRecord.referrals || 0) > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10">
                {detailRecord.referrals} referral{detailRecord.referrals !== 1 ? 's' : ''}
              </span>
            )}
            {detailRecord.referredBy && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                Referred
              </span>
            )}
          </div>

          {/* Details — description list style (Tailwind best practice) */}
          <dl className="divide-y divide-gray-100">
            <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 break-all">{detailRecord.email}</dd>
            </div>
            <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{detailRecord.name || '—'}</dd>
            </div>
            <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-gray-500">Signed Up</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {detailRecord.signupDate ? new Date(detailRecord.signupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </dd>
            </div>
            <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-gray-500">Referral Code</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-mono">{detailRecord.referralCode || '—'}</dd>
            </div>
            {detailRecord.referredBy && (
              <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-medium text-gray-500">Referred By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-mono">{detailRecord.referredBy}</dd>
              </div>
            )}
            {detailRecord.ipAddress && (
              <div className="px-0 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-xs font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {(() => {
                    const ip = String(detailRecord.ipAddress).split(',')[0].trim();
                    const geo = ipGeoData[ip];
                    return geo ? `${geo.flag} ${geo.city}, ${geo.country}` : ip;
                  })()}
                </dd>
              </div>
            )}
          </dl>

          {/* Activity Timeline */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</h3>
            <div className="space-y-0 border-l-2 border-gray-200 ml-2">
                {/* Signup event */}
                {detailRecord.signupDate && (
                  <div className="relative pl-5 pb-3">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs font-medium text-gray-900">Joined waitlist</p>
                    <p className="text-[10px] text-gray-400">{new Date(detailRecord.signupDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )}
                {/* Confirmation email sent */}
                {(detailRecord.emailsSent || detailRecord.email_sent) && (
                  <div className="relative pl-5 pb-3">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-orange-400" />
                    <p className="text-xs font-medium text-gray-900">Confirmation email sent</p>
                    <p className="text-[10px] text-gray-400">
                      {typeof detailRecord.emailsSent === 'number' && detailRecord.emailsSent > 1
                        ? `Sent ${detailRecord.emailsSent} times`
                        : 'Sent 1 time'}
                      {detailRecord.lastEmailSent && ` — last ${new Date(detailRecord.lastEmailSent).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                )}
                {/* Email confirmed */}
                {detailRecord.confirmed && (
                  <div className="relative pl-5 pb-3">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-xs font-medium text-gray-900">Email confirmed</p>
                    <p className="text-[10px] text-gray-400">
                      {detailRecord.emailConfirmedAt
                        ? new Date(detailRecord.emailConfirmedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Confirmed'}
                    </p>
                  </div>
                )}
                {/* Referral activity */}
                {(detailRecord.referrals || 0) > 0 && (
                  <div className="relative pl-5 pb-3">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-500" />
                    <p className="text-xs font-medium text-gray-900">Referred {detailRecord.referrals} user{detailRecord.referrals !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-gray-400">
                      {detailRecord.lastReferralDate
                        ? `Last referral ${new Date(detailRecord.lastReferralDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : 'Via referral link'}
                    </p>
                  </div>
                )}
                {/* Not confirmed yet prompt */}
                {!detailRecord.confirmed && (
                  <div className="relative pl-5 pb-1">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300 ring-2 ring-gray-100" />
                    <p className="text-xs text-gray-400 italic">Awaiting email confirmation...</p>
                  </div>
                )}
              </div>
            </div>
        </AdminModal>
      ) : detailRecord ? (
        <AdminModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={getDisplayName(detailRecord)}
          subtitle={adminFieldConfig[activeTab]?.label || 'Record'}
          size="xl"
          noPadding
          footer={
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => handleDelete(detailRecord)} className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
              <Button size="sm" onClick={() => { handleEdit(detailRecord); setShowDetailModal(false); }} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
            </div>
          }
        >
          {(() => {
            const detailFields = getFieldsForView(activeTab, 'detail');

            const renderFieldValue = (field: FieldConfig, val: any) => {
              if (field.type === 'boolean') return <Badge className={val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{val ? 'Yes' : 'No'}</Badge>;
              if (field.type === 'date') {
                const d = new Date(val);
                return <span>{d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} <span className="text-gray-400">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></span>;
              }
              if (field.key === 'ipAddress' && val) {
                const ip = String(val).split(',')[0].trim();
                const geo = ipGeoData[ip];
                return geo ? <span>{geo.flag} {geo.city}, {geo.country} <span className="text-gray-400 text-xs">({ip})</span></span> : <span>{ip}</span>;
              }
              if ((field.key === 'signupDate' || field.key === 'created_at' || field.key === 'lastActiveDate' || field.key === 'lastReferralDate') && val) {
                const d = new Date(val);
                return <span>{d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} <span className="text-gray-400">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span></span>;
              }
              if (field.type === 'badge') return <Badge className={`text-xs ${badgeColorMap[String(val).toLowerCase()] || 'bg-blue-100 text-blue-800'}`}>{String(val)}</Badge>;
              if (field.type === 'json' && typeof val === 'object' && val !== null) {
                if (Array.isArray(val)) {
                  return <div className="space-y-1.5">{val.map((item: any, i: number) => <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"><span className="text-sm">{typeof item === 'object' ? (item.name || item.label || JSON.stringify(item)) : String(item)}</span></div>)}</div>;
                }
                const entries = Object.entries(val);
                if (entries.length === 0) return <span className="text-gray-400 text-xs">Empty</span>;
                return <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{entries.slice(0, 9).map(([k, v]) => <div key={k} className="bg-white rounded-lg p-2.5 border border-gray-100 text-center"><div className="text-sm font-semibold text-gray-900">{typeof v === 'number' ? v : String(v)}</div><div className="text-[10px] text-gray-500 mt-0.5 capitalize">{k.replace(/_/g, ' ')}</div></div>)}</div>;
              }
              if (field.type === 'array') return Array.isArray(val) ? <div className="space-y-1">{val.map((item: any, i: number) => <div key={i} className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-sm">{String(item)}</div>)}</div> : <span>{String(val)}</span>;
              return <span>{String(val)}</span>;
            };

            const headerFields = ['category', 'type', 'brand', 'scan_type', 'status'];
            const descField = detailFields.find(f => f.key === 'description');
            const sectionedFields = detailFields.filter(f => f.section);
            const sections = [...new Set(sectionedFields.map(f => f.section!))];
            const unsectionedFields = detailFields
              .filter(f => f.type !== 'image' && !headerFields.includes(f.key) && f.key !== 'description' && !f.section)
              .filter(f => { const v = detailRecord[f.key]; return v != null && v !== '' && v !== 'null'; });

            return (
              <>
                {/* Hero image / placeholder */}
                <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                  {getImageUrl(detailRecord) && getImageUrl(detailRecord) !== PLACEHOLDER_IMAGE ? (
                    <img
                      src={getImageUrl(detailRecord)}
                      alt={getDisplayName(detailRecord)}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon className="w-12 h-12" />
                      <span className="text-xs mt-1.5 text-gray-400">No image</span>
                    </div>
                  )}
                  {detailRecord.overall_score != null && (
                    <div className="absolute top-3 left-3 bg-black/60 text-white rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1"><span className="text-yellow-400">&#9733;</span> {detailRecord.overall_score}</div>
                  )}
                </div>

                {/* Content with padding */}
                <div className="px-6 py-5 space-y-4">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {detailRecord.category && <Badge className={`text-xs ${badgeColorMap[detailRecord.category.toLowerCase()] || 'bg-blue-100 text-blue-800'}`}>{detailRecord.category}</Badge>}
                    {detailRecord.type && <Badge className={`text-xs ${badgeColorMap[detailRecord.type.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>{detailRecord.type}</Badge>}
                    {detailRecord.status && <Badge className={`text-xs ${detailRecord.status === 'completed' ? 'bg-green-100 text-green-800' : detailRecord.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{detailRecord.status}</Badge>}
                  </div>

                  {/* Description */}
                  {descField && detailRecord.description && (
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">{detailRecord.description}</div>
                  )}

                  {/* Sectioned fields */}
                  {sections.map(section => {
                    const sFields = sectionedFields.filter(f => f.section === section);
                    const hasData = sFields.some(f => { const v = detailRecord[f.key]; return v != null && v !== '' && v !== 'null' && !(typeof v === 'object' && Object.keys(v).length === 0); });
                    if (!hasData) return null;
                    const totalItems = sFields.reduce((t, f) => { const v = detailRecord[f.key]; if (v == null) return t; if (Array.isArray(v)) return t + v.length; if (typeof v === 'object') return t + Object.keys(v).length; return t + 1; }, 0);
                    return (
                      <CollapsibleSection key={section} title={section} itemCount={totalItems} previewCount={4} totalItems={totalItems}>
                        {(expanded: boolean) => { let idx = 0; return sFields.map(f => { const v = detailRecord[f.key]; if (v == null || v === '') return null; if (Array.isArray(v)) { const si = idx; idx += v.length; const sl = expanded ? v : v.slice(0, Math.max(0, 4 - si)); if (!sl.length) return null; return <div key={f.key}>{sFields.length > 1 && <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">{f.label}</div>}{renderFieldValue(f, expanded ? v : sl)}</div>; } if (typeof v === 'object' && v !== null) { const entries = Object.entries(v); const si = idx; idx += entries.length; const sl = expanded ? entries : entries.slice(0, Math.max(0, 4 - si)); if (!sl.length) return null; return <div key={f.key}>{sFields.length > 1 && <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">{f.label}</div>}{renderFieldValue(f, expanded ? v : Object.fromEntries(sl))}</div>; } const mi = idx; idx += 1; if (!expanded && mi >= 4) return null; return <div key={f.key}>{sFields.length > 1 && <div className="text-[10px] text-gray-400 font-medium uppercase mb-1">{f.label}</div>}{renderFieldValue(f, v)}</div>; }); }}
                      </CollapsibleSection>
                    );
                  })}

                  {/* Unsectioned detail fields */}
                  {unsectionedFields.length > 0 && (
                    <CollapsibleSection title="Details" itemCount={unsectionedFields.length} previewCount={6} totalItems={unsectionedFields.length}>
                      {(expanded: boolean) => <div className="grid grid-cols-2 gap-2">{(expanded ? unsectionedFields : unsectionedFields.slice(0, 6)).map(field => { const val = detailRecord[field.key]; const span = field.colSpan === 2 || field.type === 'textarea' || field.type === 'json' || field.type === 'array' ? 'col-span-2' : ''; return <div key={field.key} className={`bg-gray-50 rounded-lg p-3 ${span}`}><div className="text-[10px] text-gray-400 font-medium uppercase">{field.label}</div><div className="text-sm text-gray-900 mt-0.5 break-all">{renderFieldValue(field, val)}</div></div>; })}</div>}
                    </CollapsibleSection>
                  )}
                </div>
              </>
            );
          })()}
        </AdminModal>
      ) : null}

      {/* Edit Modal - Config Driven (uses AdminModal) */}
      <AdminModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${adminFieldConfig[activeTab]?.label || 'Record'}`}
        subtitle="Update the details below and save"
        size="xl"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={savingRecord} className="bg-blue-600 hover:bg-blue-700">
              {savingRecord ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        {editingRecord && (() => {
          const editFields = getFieldsForView(activeTab, 'edit');

          const renderEditField = (field: FieldConfig) => {
            const val = editingRecord[field.key];
            const updateField = (newVal: any) => setEditingRecord({ ...editingRecord, [field.key]: newVal });

            if (field.type === 'image') {
              return (
                <div key={field.key} className="space-y-2 col-span-2">
                  <Label>{field.label}</Label>
                  <div className="flex gap-4 items-start">
                    <img src={getImageUrl(editingRecord)} alt={getDisplayName(editingRecord)} className="w-20 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Input value={val || ''} onChange={(e) => updateField(e.target.value)} placeholder="Image URL" className="text-xs" />
                      <Input
                        type="file" accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingImage(true);
                            try {
                              const reader = new FileReader();
                              reader.onload = (ev) => updateField(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            } catch { toast.error('Failed to read image'); }
                            finally { setUploadingImage(false); }
                          }
                        }}
                        disabled={uploadingImage} className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (field.type === 'readonly') {
              return (
                <div key={field.key} className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : ''}`}>
                  <Label>{field.label}</Label>
                  <Input value={val || ''} disabled className="bg-gray-50 text-sm" />
                  {field.key === 'email' && <p className="text-xs text-gray-400">Email cannot be changed</p>}
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.key} className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : ''}`}>
                  <Label>{field.label}</Label>
                  <select
                    title={field.label}
                    value={val || ''}
                    onChange={(e) => updateField(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {(field.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === 'boolean') {
              return (
                <div key={field.key} className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : ''}`}>
                  <Label>{field.label}</Label>
                  <select
                    title={field.label}
                    value={val ? 'true' : 'false'}
                    onChange={(e) => updateField(e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              );
            }

            if (field.type === 'number') {
              return (
                <div key={field.key} className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : ''}`}>
                  <Label>{field.label}</Label>
                  <Input type="number" value={val ?? 0} onChange={(e) => updateField(parseInt(e.target.value) || 0)} placeholder={field.placeholder} className="text-sm" />
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.key} className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : ''}`}>
                  <div className="flex items-center justify-between">
                    <Label>{field.label}</Label>
                    {field.aiSuggest && (
                      <button
                        type="button"
                        onClick={() => {
                          const prompt = field.aiPrompt || `Suggest content for the "${field.label}" field of this ${adminFieldConfig[activeTab]?.label || 'item'}: ${getDisplayName(editingRecord)}`;
                          toast.info(`AI Prompt: ${prompt}`, { duration: 5000 });
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                        title="Get AI suggestion for this field"
                      >
                        ✨ AI Suggest
                      </button>
                    )}
                  </div>
                  <Textarea value={typeof val === 'string' ? val : ''} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} className="min-h-20 text-sm" />
                </div>
              );
            }

            // Default: text input
            return (
              <div key={field.key} className={`space-y-2 ${field.colSpan === 2 ? 'col-span-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <Label>{field.label}</Label>
                  {field.aiSuggest && (
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = field.aiPrompt || `Suggest content for the "${field.label}" field.`;
                        toast.info(`AI Prompt: ${prompt}`, { duration: 5000 });
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                      title="Get AI suggestion for this field"
                    >
                      ✨ AI Suggest
                    </button>
                  )}
                </div>
                <Input value={typeof val === 'string' || typeof val === 'number' ? String(val) : val || ''} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} className="text-sm" />
              </div>
            );
          };

          return (
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {editFields.map(renderEditField)}
            </div>
          );
        })()}
      </AdminModal>
      <FloatingDebugMenu accessToken={accessToken} />
    </div>
  );
}
