import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Eye, 
  Edit, 
  Download, 
  Upload, 
  RefreshCw,
  ExternalLink,
  Calendar,
  Database,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { SimpleRecordImage } from "./SimpleRecordImage";
import { EnhancedUniversalDataEditor } from "./EnhancedUniversalDataEditor";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Record {
  id: string;
  name: string;
  description?: string;
  category?: string;
  source?: string;
  imported_at?: string;
  image_url?: string;
  [key: string]: any;
}

interface StandardDataViewProps {
  dataType: string;
  onEdit?: (id: string) => void;
  onRefresh?: () => void;
}

export function StandardDataView({ dataType, onEdit, onRefresh }: StandardDataViewProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Get all unique categories from records
  const categories = React.useMemo(() => {
    const cats = new Set(records.map(record => record.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [records]);

  // Filter records based on search and category
  const filteredRecords = React.useMemo(() => {
    return records.filter(record => {
      const matchesSearch = !searchTerm || 
        record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [records, searchTerm, selectedCategory]);

  // Load records from the server
  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Loading ${dataType} records...`);
      
      // Add null check for dataType before using slice
      const singularDataType = dataType && typeof dataType === 'string' ? dataType.slice(0, -1) : 'record';
      
      // Try the admin get-records endpoint first with corrected URL
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/get-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          dataType: singularDataType,
          limit: 100,
          includeImages: true 
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecords(data.records || []);
          console.log(`✅ Loaded ${data.records?.length || 0} ${dataType} records`);
        } else {
          throw new Error(data.error || 'Failed to load records');
        }
      } else {
        // Fallback to KV records endpoint
        console.log(`🔄 Trying fallback KV endpoint for ${dataType}...`);
        const fallbackResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/kv-records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prefix: `${singularDataType}_` })
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success) {
            setRecords(fallbackData.records || []);
            console.log(`✅ Loaded ${fallbackData.records?.length || 0} ${dataType} records via fallback`);
          } else {
            throw new Error(fallbackData.error || 'Failed to load records via fallback');
          }
        } else {
          throw new Error(`HTTP ${response.status}: Failed to load ${dataType} records`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${dataType}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle record selection for editing
  const handleRecordSelect = (record: Record) => {
    setSelectedRecord(record);
    setIsEditorOpen(true);
  };

  // Handle editor save
  const handleEditorSave = async () => {
    setIsEditorOpen(false);
    setSelectedRecord(null);
    await loadRecords(); // Refresh the data
    if (onRefresh) onRefresh();
  };

  // Handle editor cancel
  const handleEditorCancel = () => {
    setIsEditorOpen(false);
    setSelectedRecord(null);
  };

  // Export records to CSV
  const handleExport = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/export-datatype`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dataType })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `healthscan_${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  useEffect(() => {
    if (dataType) {
      loadRecords();
    }
  }, [dataType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading {dataType || 'records'}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Error loading {dataType || 'records'}:</strong> {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRecords}
            className="ml-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={`Search ${dataType || 'records'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={loadRecords}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredRecords.length} of {records.length} {dataType || 'records'}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
        
        {records.length > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Database className="w-3 h-3 mr-1" />
            {records.length} Total Records
          </Badge>
        )}
      </div>

      {/* Records Display */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {dataType || 'records'} found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `No ${dataType || 'records'} match your search criteria.`
              : `No ${dataType || 'records'} records are available yet.`
            }
          </p>
          {!searchTerm && (
            <Button onClick={loadRecords}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredRecords.map((record) => (
            <Card 
              key={record.id} 
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}
              onClick={() => handleRecordSelect(record)}
            >
              {viewMode === 'grid' ? (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base truncate">{record.name}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecordSelect(record);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    {record.category && (
                      <Badge variant="outline" className="w-fit text-xs">
                        {record.category}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {record.image_url && (
                      <SimpleRecordImage 
                        imageUrl={record.image_url}
                        altText={record.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                    
                    {record.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {record.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {record.imported_at 
                          ? new Date(record.imported_at).toLocaleDateString()
                          : 'Unknown'
                        }
                      </div>
                      
                      {record.source && (
                        <div className="flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-20">
                            {record.source.replace('HealthScan ', '')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center space-x-4 p-4 w-full">
                  {record.image_url && (
                    <SimpleRecordImage 
                      imageUrl={record.image_url}
                      altText={record.name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{record.name}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecordSelect(record);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {record.category && (
                      <Badge variant="outline" className="text-xs mb-1">
                        {record.category}
                      </Badge>
                    )}
                    
                    {record.description && (
                      <p className="text-sm text-gray-600 truncate">
                        {record.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>
                        {record.imported_at 
                          ? new Date(record.imported_at).toLocaleDateString()
                          : 'Unknown date'
                        }
                      </span>
                      {record.source && (
                        <span className="truncate max-w-32">
                          {record.source.replace('HealthScan ', '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced Universal Data Editor Side Panel */}
      <EnhancedUniversalDataEditor
        isOpen={isEditorOpen}
        record={selectedRecord}
        dataType={dataType}
        allRecords={records}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
        onRecordChange={setSelectedRecord}
      />
    </div>
  );
}