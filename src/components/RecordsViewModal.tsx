import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Eye, 
  Download, 
  Filter, 
  ArrowLeft, 
  ArrowRight, 
  Calendar,
  Tag,
  Link2,
  Image as ImageIcon,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  Check,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Record {
  id: string;
  name: string;
  [key: string]: any;
}

interface RecordsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: string;
  dataTypeLabel: string;
  totalCount: number;
}

export function RecordsViewModal({ 
  isOpen, 
  onClose, 
  dataType, 
  dataTypeLabel, 
  totalCount 
}: RecordsViewModalProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);
  const [showDetailView, setShowDetailView] = useState(false);
  
  // CRUD state
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editedRecord, setEditedRecord] = useState<Record | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch records when modal opens
  useEffect(() => {
    if (isOpen && dataType) {
      fetchRecords();
    }
  }, [isOpen, dataType]);

  // Filter records based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record => 
        record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, records]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      console.log(`📖 Fetching ${dataType} records...`);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/get-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: dataType.slice(0, -1), // Remove 's' from plural form
          limit: 1000, // Get more records for better search/filter experience
          includeImages: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch records: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setRecords(result.records || []);
        console.log(`✅ Loaded ${result.records?.length || 0} ${dataType} records`);
      } else {
        throw new Error(result.error || 'Failed to fetch records');
      }
    } catch (error: any) {
      console.error(`❌ Error fetching ${dataType} records:`, error);
      toast.error(`Failed to load ${dataType} records: ${error.message}`);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const handleViewRecord = (record: Record) => {
    setSelectedRecord(record);
    setEditedRecord({ ...record });
    setIsEditing(false);
    setIsCreating(false);
    setShowDetailView(true);
  };

  const handleCreateNew = () => {
    const newRecord: Record = {
      id: `${dataType.slice(0, -1)}_${Date.now()}_new`,
      name: '',
      description: '',
      category: '',
      imported_at: new Date().toISOString(),
      source: 'Manual Entry',
      api_source: 'User Created'
    };
    
    setSelectedRecord(newRecord);
    setEditedRecord({ ...newRecord });
    setIsCreating(true);
    setIsEditing(true);
    setShowDetailView(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedRecord({ ...selectedRecord! });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditedRecord(selectedRecord ? { ...selectedRecord } : null);
  };

  const handleSave = async () => {
    if (!editedRecord || !editedRecord.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      console.log(`💾 Saving ${isCreating ? 'new' : 'edited'} record...`);

      const endpoint = isCreating ? 'create-record' : 'update-record';
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: dataType.slice(0, -1),
          record: editedRecord
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save record: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        if (isCreating) {
          setRecords(prev => [result.record, ...prev]);
          toast.success(`✅ Created new ${dataType.slice(0, -1)} record`);
        } else {
          setRecords(prev => prev.map(r => r.id === editedRecord.id ? result.record : r));
          toast.success(`✅ Updated ${dataType.slice(0, -1)} record`);
        }
        
        setSelectedRecord(result.record);
        setIsEditing(false);
        setIsCreating(false);
      } else {
        throw new Error(result.error || 'Failed to save record');
      }
    } catch (error: any) {
      console.error(`❌ Save error:`, error);
      toast.error(`❌ Failed to save record: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || isCreating) return;

    if (!confirm(`Are you sure you want to delete "${selectedRecord.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      console.log(`🗑️ Deleting record: ${selectedRecord.id}`);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/delete-record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataType: dataType.slice(0, -1),
          recordId: selectedRecord.id
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete record: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
        toast.success(`✅ Deleted ${dataType.slice(0, -1)} record`);
        
        // Close detail view
        setShowDetailView(false);
        setSelectedRecord(null);
        setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to delete record');
      }
    } catch (error: any) {
      console.error(`❌ Delete error:`, error);
      toast.error(`❌ Failed to delete record: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDetailView = () => {
    if (isEditing && !isCreating) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        setShowDetailView(false);
        setSelectedRecord(null);
        setIsEditing(false);
        setIsCreating(false);
      }
    } else if (isCreating) {
      if (confirm('You are creating a new record. Are you sure you want to cancel?')) {
        setShowDetailView(false);
        setSelectedRecord(null);
        setIsEditing(false);
        setIsCreating(false);
      }
    } else {
      setShowDetailView(false);
      setSelectedRecord(null);
      setIsEditing(false);
      setIsCreating(false);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    if (!editedRecord) return;
    
    setEditedRecord(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  const handleExportVisible = () => {
    try {
      // Create CSV content from current filtered records
      if (filteredRecords.length === 0) {
        toast.error('No records to export');
        return;
      }

      const headers = Object.keys(filteredRecords[0]).filter(key => 
        typeof filteredRecords[0][key] !== 'object' || filteredRecords[0][key] === null
      );
      
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => 
          headers.map(header => {
            const value = record[header] || '';
            // Escape commas and quotes
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        )
      ].join('\n');

      // Download the CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `healthscan_${dataType}_filtered_${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`✅ Exported ${filteredRecords.length} records to ${filename}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (key.includes('date') || key.includes('_at')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getFieldIcon = (key: string) => {
    if (key.includes('image') || key.includes('url')) return <ImageIcon className="h-4 w-4" />;
    if (key.includes('date') || key.includes('_at')) return <Calendar className="h-4 w-4" />;
    if (key.includes('category') || key.includes('type')) return <Tag className="h-4 w-4" />;
    if (key.includes('source') || key.includes('api')) return <Link2 className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const isSystemField = (key: string) => {
    return ['id', 'imported_at', 'source', 'api_source', 'created_at', 'updated_at'].includes(key);
  };

  const renderFieldInput = (key: string, value: any) => {
    if (isSystemField(key)) {
      return (
        <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded">
          {formatFieldValue(key, value)} <span className="text-xs">(System field)</span>
        </div>
      );
    }

    if (key === 'description') {
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={`Enter ${key.replace(/_/g, ' ')}`}
          className="text-xs sm:text-sm"
          rows={3}
        />
      );
    }

    if (typeof value === 'boolean' || key.toLowerCase().includes('active') || key.toLowerCase().includes('enabled')) {
      return (
        <select
          value={value ? 'true' : 'false'}
          onChange={(e) => handleFieldChange(key, e.target.value === 'true')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    if (typeof value === 'number' || key.toLowerCase().includes('amount') || key.toLowerCase().includes('count') || key.toLowerCase().includes('limit')) {
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleFieldChange(key, Number(e.target.value) || 0)}
          placeholder={`Enter ${key.replace(/_/g, ' ')}`}
          className="text-xs sm:text-sm"
        />
      );
    }

    if (key.includes('url') || key.includes('link')) {
      return (
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={`Enter ${key.replace(/_/g, ' ')}`}
          className="text-xs sm:text-sm"
        />
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleFieldChange(key, parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          placeholder={`Enter JSON for ${key.replace(/_/g, ' ')}`}
          className="text-xs sm:text-sm font-mono"
          rows={4}
        />
      );
    }

    return (
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => handleFieldChange(key, e.target.value)}
        placeholder={`Enter ${key.replace(/_/g, ' ')}`}
        className="text-xs sm:text-sm"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[95vh] p-0 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl truncate">
                <Eye className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{dataTypeLabel} Records</span>
                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                  {totalCount.toLocaleString()}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm sm:text-base">
                View, search, and manage {dataTypeLabel.toLowerCase()} records from your database
              </DialogDescription>
            </div>
            <Button 
              onClick={onClose} 
              size="sm" 
              variant="ghost" 
              className="ml-4 flex-shrink-0 sm:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!showDetailView ? (
          <>
            {/* Search and Filter Controls - Fixed */}
            <div className="flex-shrink-0 p-4 border-b bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      placeholder={`Search ${dataTypeLabel.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                    />
                  </div>
                  <Badge variant="outline" className="flex items-center space-x-1 flex-shrink-0">
                    <Filter className="h-3 w-3" />
                    <span className="text-xs sm:text-sm">{filteredRecords.length}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 justify-end">
                  <Button
                    onClick={handleCreateNew}
                    size="sm"
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create New</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                  <Button
                    onClick={handleExportVisible}
                    disabled={filteredRecords.length === 0}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-2 text-xs sm:text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <Button onClick={onClose} size="sm" variant="ghost" className="hidden sm:flex">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Records Content - Scrollable */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3 h-full overflow-y-auto">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <Skeleton className="h-4 w-full max-w-48" />
                        <Skeleton className="h-3 w-full max-w-64" />
                      </div>
                      <Skeleton className="h-8 w-16 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center space-y-3 max-w-md">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {searchTerm ? 'No matching records found' : 'No records available'}
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base">
                      {searchTerm 
                        ? `Try adjusting your search terms or create new ${dataTypeLabel.toLowerCase()} data.`
                        : `Create some ${dataTypeLabel.toLowerCase()} data to get started.`
                      }
                    </p>
                    <Button
                      onClick={handleCreateNew}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Record
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="p-4 space-y-3">
                    {currentRecords.map((record) => (
                      <Card key={record.id} className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                              {record.image_url && (
                                <img
                                  src={record.image_url}
                                  alt={record.name}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                  {record.name || record.id}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {record.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {record.category}
                                    </Badge>
                                  )}
                                  {record.imported_at && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(record.imported_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  {record.source && (
                                    <span className="text-xs text-blue-600 truncate max-w-32">
                                      {record.source}
                                    </span>
                                  )}
                                </div>
                                {record.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                                    {record.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleViewRecord(record)}
                              size="sm"
                              variant="outline"
                              className="flex items-center space-x-1 flex-shrink-0 text-xs sm:text-sm"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination - Fixed */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t bg-gray-50/50">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs sm:text-sm font-medium px-2">
                      {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Detail View with CRUD */
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Detail Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCloseDetailView}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to List</span>
                </Button>
                {isCreating && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Creating New
                  </Badge>
                )}
                {isEditing && !isCreating && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Editing
                  </Badge>
                )}
              </div>
              
              <h3 className="text-base sm:text-lg font-medium truncate mx-4 flex-1 text-center">
                {isCreating ? `New ${dataTypeLabel.slice(0, -1)}` : (selectedRecord?.name || 'Record Details')}
              </h3>
              
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    {!isCreating && (
                      <Button
                        onClick={handleDelete}
                        disabled={deleting}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving || !editedRecord?.name?.trim()}
                      size="sm"
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Save</span>
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Detail Content - Scrollable */}
            {selectedRecord && editedRecord && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Validation Alert */}
                  {isEditing && !editedRecord.name?.trim() && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Name is required to save this record.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Header with image */}
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    {(selectedRecord.image_url || isEditing) && (
                      <div className="flex-shrink-0">
                        {selectedRecord.image_url && (
                          <img
                            src={selectedRecord.image_url}
                            alt={selectedRecord.name}
                            className="w-full sm:w-32 h-48 sm:h-32 rounded-lg object-cover bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {isEditing && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Image URL
                            </label>
                            <Input
                              type="url"
                              value={editedRecord.image_url || ''}
                              onChange={(e) => handleFieldChange('image_url', e.target.value)}
                              placeholder="Enter image URL"
                              className="text-xs sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name *
                            </label>
                            <Input
                              type="text"
                              value={editedRecord.name || ''}
                              onChange={(e) => handleFieldChange('name', e.target.value)}
                              placeholder="Enter name"
                              className="text-lg font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <Textarea
                              value={editedRecord.description || ''}
                              onChange={(e) => handleFieldChange('description', e.target.value)}
                              placeholder="Enter description"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <Input
                              type="text"
                              value={editedRecord.category || ''}
                              onChange={(e) => handleFieldChange('category', e.target.value)}
                              placeholder="Enter category"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 break-words">
                            {selectedRecord.name}
                          </h2>
                          {selectedRecord.description && (
                            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                              {selectedRecord.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            {selectedRecord.category && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
                                {selectedRecord.category}
                              </Badge>
                            )}
                            {selectedRecord.source && (
                              <Badge variant="outline" className="text-xs sm:text-sm">
                                Source: {selectedRecord.source}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* All Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(isEditing ? editedRecord : selectedRecord)
                      .filter(([key]) => !['name', 'description', 'category', 'image_url'].includes(key))
                      .map(([key, value]) => (
                        <Card key={key} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center space-x-2">
                              {getFieldIcon(key)}
                              <span className="capitalize text-xs sm:text-sm">
                                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              {isSystemField(key) && (
                                <Badge variant="outline" className="text-xs">System</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {isEditing ? (
                              renderFieldInput(key, value)
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-900 break-words">
                                {key.includes('url') && value ? (
                                  <a 
                                    href={value} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {value}
                                  </a>
                                ) : (
                                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                                    {formatFieldValue(key, value)}
                                  </pre>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}