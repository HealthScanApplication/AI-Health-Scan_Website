import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { projectId } from '../../utils/supabase/info';
import { PLACEHOLDER_IMAGE } from '../../utils/adminHelpers';

interface JunctionConfig {
  label: string;
  junctionTable: string;
  targetTable: string;
  junctionKey: string; // FK in junction pointing to this record
  targetKey: string; // FK in junction pointing to target
  reverseDirection?: boolean; // if true, search by targetKey = this record
}

interface JunctionRecordsPanelProps {
  record: Record<string, any>;
  activeTab: string;
  accessToken?: string;
  onEditRecord?: (record: Record<string, any>, tab: string) => void;
}

// Map table names to their admin tab IDs
const TABLE_TO_TAB: Record<string, string> = {
  catalog_elements: 'elements',
  catalog_ingredients: 'ingredients',
  catalog_recipes: 'recipes',
  catalog_products: 'products',
  catalog_cooking_methods: 'cooking_methods',
  catalog_equipment: 'equipment',
  catalog_activities: 'activities',
  catalog_symptoms: 'symptoms',
  hs_supplements: 'hs_supplements',
  hs_tests: 'hs_tests',
  hs_products: 'hs_products',
  hs_services: 'hs_services',
};

// Junction configuration for each tab
const JUNCTION_CONFIG: Record<string, JunctionConfig[]> = {
  ingredients: [
    {
      label: 'Elements',
      junctionTable: 'catalog_ingredient_elements',
      targetTable: 'catalog_elements',
      junctionKey: 'ingredient_id',
      targetKey: 'element_id',
    },
    {
      label: 'Used in Recipes',
      junctionTable: 'catalog_recipe_ingredients',
      targetTable: 'catalog_recipes',
      junctionKey: 'ingredient_id',
      targetKey: 'recipe_id',
    },
  ],
  recipes: [
    {
      label: 'Ingredients',
      junctionTable: 'catalog_recipe_ingredients',
      targetTable: 'catalog_ingredients',
      junctionKey: 'recipe_id',
      targetKey: 'ingredient_id',
    },
    {
      label: 'Cooking Methods',
      junctionTable: 'recipe_cooking_methods',
      targetTable: 'catalog_cooking_methods',
      junctionKey: 'recipe_id',
      targetKey: 'cooking_method_id',
    },
    {
      label: 'Equipment',
      junctionTable: 'recipe_equipment',
      targetTable: 'catalog_equipment',
      junctionKey: 'recipe_id',
      targetKey: 'equipment_id',
    },
    {
      label: 'Elements',
      junctionTable: 'recipe_elements',
      targetTable: 'catalog_elements',
      junctionKey: 'recipe_id',
      targetKey: 'element_id',
    },
  ],
  elements: [
    {
      label: 'Found in Ingredients',
      junctionTable: 'catalog_ingredient_elements',
      targetTable: 'catalog_ingredients',
      junctionKey: 'element_id',
      targetKey: 'ingredient_id',
    },
    {
      label: 'Found in Recipes',
      junctionTable: 'recipe_elements',
      targetTable: 'catalog_recipes',
      junctionKey: 'element_id',
      targetKey: 'recipe_id',
    },
    {
      label: 'HS Supplements',
      junctionTable: 'element_supplements',
      targetTable: 'hs_supplements',
      junctionKey: 'element_id',
      targetKey: 'supplement_id',
    },
    {
      label: 'HS Tests',
      junctionTable: 'element_tests',
      targetTable: 'hs_tests',
      junctionKey: 'element_id',
      targetKey: 'test_id',
    },
    {
      label: 'HS Products',
      junctionTable: 'element_products',
      targetTable: 'hs_products',
      junctionKey: 'element_id',
      targetKey: 'product_id',
    },
    {
      label: 'Related Cooking Methods',
      junctionTable: 'cooking_method_elements',
      targetTable: 'catalog_cooking_methods',
      junctionKey: 'element_id',
      targetKey: 'cooking_method_id',
    },
  ],
  cooking_methods: [
    {
      label: 'Used in Recipes',
      junctionTable: 'recipe_cooking_methods',
      targetTable: 'catalog_recipes',
      junctionKey: 'cooking_method_id',
      targetKey: 'recipe_id',
    },
    {
      label: 'Related Elements',
      junctionTable: 'cooking_method_elements',
      targetTable: 'catalog_elements',
      junctionKey: 'cooking_method_id',
      targetKey: 'element_id',
    },
  ],
  equipment: [
    {
      label: 'Used in Recipes',
      junctionTable: 'recipe_equipment',
      targetTable: 'catalog_recipes',
      junctionKey: 'equipment_id',
      targetKey: 'recipe_id',
    },
  ],
  activities: [
    {
      label: 'Related Elements',
      junctionTable: 'activity_elements',
      targetTable: 'catalog_elements',
      junctionKey: 'activity_id',
      targetKey: 'element_id',
    },
  ],
  symptoms: [
    {
      label: 'Related Elements',
      junctionTable: 'symptom_elements',
      targetTable: 'catalog_elements',
      junctionKey: 'symptom_id',
      targetKey: 'element_id',
    },
  ],
};

export function JunctionRecordsPanel({ record, activeTab, accessToken, onEditRecord }: JunctionRecordsPanelProps) {
  const configs = JUNCTION_CONFIG[activeTab] || [];
  if (configs.length === 0) return null;

  return (
    <div className="space-y-3">
      {configs.map((config) => (
        <JunctionSection
          key={config.junctionTable + config.targetTable}
          config={config}
          recordId={record.id}
          accessToken={accessToken}
          onEditRecord={onEditRecord}
        />
      ))}
    </div>
  );
}

interface JunctionSectionProps {
  config: JunctionConfig;
  recordId: string;
  accessToken?: string;
  onEditRecord?: (record: Record<string, any>, tab: string) => void;
}

function JunctionSection({ config, recordId, accessToken, onEditRecord }: JunctionSectionProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJunctionRecords();
  }, [recordId, config.junctionTable]);

  const fetchJunctionRecords = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch junction records
      const junctionUrl = `https://${projectId}.supabase.co/rest/v1/${config.junctionTable}?${config.junctionKey}=eq.${recordId}&select=${config.targetKey}`;
      const junctionRes = await fetch(junctionUrl, {
        headers: {
          apikey: accessToken,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!junctionRes.ok) throw new Error(`Failed to fetch ${config.junctionTable}`);
      const junctionData = await junctionRes.json();
      
      if (junctionData.length === 0) {
        setRecords([]);
        setLoading(false);
        return;
      }

      // Extract target IDs
      const targetIds = junctionData.map((j: any) => j[config.targetKey]).filter(Boolean);
      if (targetIds.length === 0) {
        setRecords([]);
        setLoading(false);
        return;
      }

      // Fetch target records
      const targetUrl = `https://${projectId}.supabase.co/rest/v1/${config.targetTable}?id=in.(${targetIds.join(',')})&select=id,name,name_common,brand,category,type_label,health_role,image_url,avatar_url,icon_url,element_key`;
      const targetRes = await fetch(targetUrl, {
        headers: {
          apikey: accessToken,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!targetRes.ok) throw new Error(`Failed to fetch ${config.targetTable}`);
      const targetData = await targetRes.json();
      setRecords(targetData || []);
    } catch (err: any) {
      console.error('JunctionSection fetch error:', err);
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (rec: Record<string, any>) => {
    return rec.image_url || rec.avatar_url || rec.icon_url || PLACEHOLDER_IMAGE;
  };

  const getDisplayName = (rec: Record<string, any>) => {
    return rec.name_common || rec.name || 'Unnamed';
  };

  const getSecondaryInfo = (rec: Record<string, any>) => {
    const parts: string[] = [];
    if (rec.brand) parts.push(rec.brand);
    if (rec.category) parts.push(rec.category);
    if (rec.type_label) parts.push(rec.type_label);
    if (rec.health_role) parts.push(rec.health_role);
    if (rec.element_key) parts.push(rec.element_key);
    return parts.join(' • ');
  };

  const handleCardClick = (rec: Record<string, any>) => {
    const tab = TABLE_TO_TAB[config.targetTable];
    if (tab && onEditRecord) {
      onEditRecord(rec, tab);
    }
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading {config.label}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 rounded-xl p-4 bg-red-50">
        <div className="text-xs text-red-600">Error loading {config.label}: {error}</div>
      </div>
    );
  }

  if (records.length === 0) return null;

  const displayedRecords = expanded ? records : records.slice(0, 6);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{config.label}</span>
          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">
            {records.length}
          </Badge>
        </div>
        {records.length > 6 && (
          expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )
        )}
      </button>

      {/* Records grid */}
      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {displayedRecords.map((rec) => (
          <button
            key={rec.id}
            type="button"
            onClick={() => handleCardClick(rec)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white group"
          >
            <img
              src={getImageUrl(rec)}
              alt={getDisplayName(rec)}
              className="w-12 h-12 rounded-lg object-cover group-hover:shadow-md transition-shadow"
            />
            <div className="text-center w-full">
              <div className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                {getDisplayName(rec)}
              </div>
              {getSecondaryInfo(rec) && (
                <div className="text-[9px] text-gray-400 truncate mt-0.5">
                  {getSecondaryInfo(rec)}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Show more/less */}
      {records.length > 6 && (
        <div className="px-4 pb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs"
          >
            {expanded ? 'Show Less' : `Show All ${records.length}`}
          </Button>
        </div>
      )}
    </div>
  );
}
