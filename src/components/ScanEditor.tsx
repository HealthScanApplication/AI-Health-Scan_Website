import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ArrowLeft, Plus, Edit, Trash2, Search, Scan, Barcode, MapPin, Calendar, User, Star } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface Scan {
  id: string;
  userId: string;
  productId: string | null;
  productName?: string;
  productBrand?: string;
  barcode: string | null;
  scanDate: string;
  location: string;
  deviceInfo: Record<string, any>;
  analysisResults: Record<string, any>;
  userNotes: string;
  healthScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ScanEditorProps {
  onNavigateBack: () => void;
}

export function ScanEditor({ onNavigateBack }: ScanEditorProps) {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingScan, setEditingScan] = useState<Scan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    productId: '',
    barcode: '',
    scanDate: '',
    location: '',
    deviceInfo: '',
    analysisResults: '',
    userNotes: '',
    healthScore: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/scans`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scans: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.scans) {
        setScans(data.scans);
        console.log(`✅ Loaded ${data.scans.length} scans (source: ${data.source})`);
      } else {
        throw new Error(data.error || 'Failed to load scans');
      }
    } catch (err: any) {
      console.error('❌ Error fetching scans:', err);
      setError(err.message);
      toast.error(`Failed to load scans: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleCreateScan = async () => {
    try {
      setSubmitting(true);

      // Parse JSON fields
      let parsedDeviceInfo: Record<string, any> = {};
      let parsedAnalysisResults: Record<string, any> = {};

      try {
        parsedDeviceInfo = formData.deviceInfo ? JSON.parse(formData.deviceInfo) : {};
      } catch {
        parsedDeviceInfo = {};
      }

      try {
        parsedAnalysisResults = formData.analysisResults ? JSON.parse(formData.analysisResults) : {};
      } catch {
        parsedAnalysisResults = {};
      }

      const payload = {
        userId: formData.userId,
        productId: formData.productId || null,
        barcode: formData.barcode || null,
        scanDate: formData.scanDate || new Date().toISOString(),
        location: formData.location,
        deviceInfo: parsedDeviceInfo,
        analysisResults: parsedAnalysisResults,
        userNotes: formData.userNotes,
        healthScore: formData.healthScore ? parseFloat(formData.healthScore) : null
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.scan) {
        toast.success('Scan created successfully!');
        setScans(prev => [result.scan, ...prev]);
        setShowCreateForm(false);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to create scan');
      }
    } catch (err: any) {
      console.error('❌ Error creating scan:', err);
      toast.error(`Failed to create scan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateScan = async () => {
    if (!editingScan) return;

    try {
      setSubmitting(true);

      // Parse JSON fields
      let parsedDeviceInfo: Record<string, any> = {};
      let parsedAnalysisResults: Record<string, any> = {};

      try {
        parsedDeviceInfo = formData.deviceInfo ? JSON.parse(formData.deviceInfo) : {};
      } catch {
        parsedDeviceInfo = {};
      }

      try {
        parsedAnalysisResults = formData.analysisResults ? JSON.parse(formData.analysisResults) : {};
      } catch {
        parsedAnalysisResults = {};
      }

      const payload = {
        userId: formData.userId,
        productId: formData.productId || null,
        barcode: formData.barcode || null,
        scanDate: formData.scanDate,
        location: formData.location,
        deviceInfo: parsedDeviceInfo,
        analysisResults: parsedAnalysisResults,
        userNotes: formData.userNotes,
        healthScore: formData.healthScore ? parseFloat(formData.healthScore) : null
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/scans/${editingScan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.scan) {
        toast.success('Scan updated successfully!');
        setScans(prev => prev.map(s => s.id === editingScan.id ? result.scan : s));
        setEditingScan(null);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to update scan');
      }
    } catch (err: any) {
      console.error('❌ Error updating scan:', err);
      toast.error(`Failed to update scan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScan = async (scan: Scan) => {
    if (!confirm(`Are you sure you want to delete this scan? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/scans/${scan.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Scan deleted successfully!');
        setScans(prev => prev.filter(s => s.id !== scan.id));
      } else {
        throw new Error(result.error || 'Failed to delete scan');
      }
    } catch (err: any) {
      console.error('❌ Error deleting scan:', err);
      toast.error(`Failed to delete scan: ${err.message}`);
    }
  };

  const startEdit = (scan: Scan) => {
    setEditingScan(scan);
    setFormData({
      userId: scan.userId,
      productId: scan.productId || '',
      barcode: scan.barcode || '',
      scanDate: scan.scanDate.split('T')[0], // Format for date input
      location: scan.location,
      deviceInfo: JSON.stringify(scan.deviceInfo, null, 2),
      analysisResults: JSON.stringify(scan.analysisResults, null, 2),
      userNotes: scan.userNotes,
      healthScore: scan.healthScore?.toString() || ''
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      productId: '',
      barcode: '',
      scanDate: '',
      location: '',
      deviceInfo: '',
      analysisResults: '',
      userNotes: '',
      healthScore: ''
    });
  };

  const cancelEdit = () => {
    setEditingScan(null);
    setShowCreateForm(false);
    resetForm();
  };

  const filteredScans = scans.filter(scan =>
    scan.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.productBrand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.barcode?.includes(searchTerm) ||
    scan.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.userNotes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthscan-green"></div>
              <div>Loading scans...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onNavigateBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center space-x-2">
            <Scan className="w-6 h-6 text-healthscan-green" />
            <span>Scan Editor</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage scan records - {scans.length} scans loaded
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search scans by user, product, barcode, location, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-healthscan-green hover:bg-healthscan-light-green"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="w-5 h-5" />
              <span>{editingScan ? 'Edit Scan' : 'Create New Scan'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userId">User ID *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="userId"
                    value={formData.userId}
                    onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="Enter user ID"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="productId">Product ID</Label>
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                  placeholder="Enter product ID (optional)"
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Enter barcode (optional)"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="scanDate">Scan Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="scanDate"
                    type="date"
                    value={formData.scanDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scanDate: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter scan location"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="healthScore">Health Score</Label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="healthScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.healthScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, healthScore: e.target.value }))}
                    placeholder="Enter health score (0-100)"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="userNotes">User Notes</Label>
              <Textarea
                id="userNotes"
                value={formData.userNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, userNotes: e.target.value }))}
                placeholder="Enter user notes"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceInfo">Device Info (JSON)</Label>
                <Textarea
                  id="deviceInfo"
                  value={formData.deviceInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceInfo: e.target.value }))}
                  placeholder='{"device": "iPhone 12", "os": "iOS 15"}'
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="analysisResults">Analysis Results (JSON)</Label>
                <Textarea
                  id="analysisResults"
                  value={formData.analysisResults}
                  onChange={(e) => setFormData(prev => ({ ...prev, analysisResults: e.target.value }))}
                  placeholder='{"confidence": 0.95, "matches": []}'
                  rows={5}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={editingScan ? handleUpdateScan : handleCreateScan}
                disabled={submitting || !formData.userId}
                className="bg-healthscan-green hover:bg-healthscan-light-green"
              >
                {submitting ? 'Saving...' : editingScan ? 'Update Scan' : 'Create Scan'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scans List */}
      <Card>
        <CardHeader>
          <CardTitle>Scans ({filteredScans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredScans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No scans found matching your search.' : 'No scans available.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredScans.map((scan) => (
                <div key={scan.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">Scan {scan.id.substring(0, 8)}...</h3>
                        {scan.healthScore && (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{scan.healthScore}</span>
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span><strong>User ID:</strong> {scan.userId}</span>
                          {scan.barcode && <span><strong>Barcode:</strong> {scan.barcode}</span>}
                          {scan.location && <span><strong>Location:</strong> {scan.location}</span>}
                        </div>
                        {scan.productName && (
                          <div>
                            <strong>Product:</strong> {scan.productName} {scan.productBrand && `(${scan.productBrand})`}
                          </div>
                        )}
                        {scan.userNotes && (
                          <p className="mt-2 text-gray-700">{scan.userNotes}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Scanned: {new Date(scan.scanDate).toLocaleDateString()}</span>
                          <span>Created: {new Date(scan.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(scan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteScan(scan)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}