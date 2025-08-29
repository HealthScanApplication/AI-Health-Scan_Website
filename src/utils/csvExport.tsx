import { projectId, publicAnonKey } from './supabase/info';
import { toast } from 'sonner@2.0.3';

// Convert array of objects to CSV string
export const arrayToCSV = (data: any[], filename: string): string => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.map(header => `"${header}"`).join(','),
    // Data rows
    ...data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) {
          return '""';
        }
        // Handle arrays by joining with semicolons
        if (Array.isArray(value)) {
          return `"${value.join('; ')}"`;
        }
        // Handle objects by stringifying
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes in strings
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    throw new Error('File download not supported by this browser');
  }
};

// Enhanced export function with better loading state management
export const exportTableData = async (tableName: string): Promise<void> => {
  let loadingToast: string | number | undefined;
  
  try {
    // Start loading with a unique ID we can dismiss
    loadingToast = toast.loading(`Exporting ${tableName} data...`, {
      description: 'Fetching data from server...'
    });
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/${tableName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${tableName}: ${response.status} ${response.statusText}`);
    }

    // Update loading message
    toast.loading('Processing data...', { 
      id: loadingToast,
      description: 'Converting to CSV format...'
    });

    const data = await response.json();
    
    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    const tableData = data[tableName] || [];
    
    if (tableData.length === 0) {
      // Dismiss loading and show warning
      toast.dismiss(loadingToast);
      toast.warning(`No ${tableName} data to export`, {
        description: 'The table appears to be empty.'
      });
      return;
    }

    // Update loading message
    toast.loading('Generating file...', { 
      id: loadingToast,
      description: `Processing ${tableData.length} records...`
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `healthscan_${tableName}_${timestamp}.csv`;
    
    // Convert to CSV and download
    const csvContent = arrayToCSV(tableData, filename);
    downloadCSV(csvContent, filename);
    
    // Dismiss loading and show success
    toast.dismiss(loadingToast);
    toast.success(`${tableName} exported successfully!`, {
      description: `Downloaded ${filename} with ${tableData.length} records`,
      duration: 5000
    });
    
  } catch (error: any) {
    console.error(`Error exporting ${tableName}:`, error);
    
    // Ensure loading toast is dismissed
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }
    
    toast.error(`Failed to export ${tableName}`, {
      description: error.message,
      duration: 6000
    });
  }
};

// Enhanced export function for specific data types
export const exportDataType = async (dataType: 'meals' | 'products' | 'ingredients' | 'nutrients' | 'pollutants' | 'parasites' | 'scans'): Promise<void> => {
  let loadingToast: string | number | undefined;
  
  try {
    loadingToast = toast.loading(`Preparing ${dataType} export...`, {
      description: 'Connecting to database...'
    });
    
    let data: any[] = [];
    let filename: string;
    let dataSource: string = 'database';
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Handle different data sources
    switch (dataType) {
      case 'meals':
        // Update loading message for meals (KV store)
        toast.loading('Fetching meals from KV store...', { 
          id: loadingToast,
          description: 'Meals are stored in key-value storage...'
        });
        
        const mealsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/meals`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (!mealsResponse.ok) {
          throw new Error(`Failed to fetch meals: ${mealsResponse.status} ${mealsResponse.statusText}`);
        }
        
        const mealsData = await mealsResponse.json();
        data = mealsData.meals || [];
        filename = `healthscan_meals_${timestamp}.csv`;
        dataSource = mealsData.source || 'kv-store';
        break;

      case 'parasites':
        // Update loading message for parasites (memory store)
        toast.loading('Fetching parasites from memory store...', { 
          id: loadingToast,
          description: 'Parasites are stored in memory storage...'
        });
        
        const parasitesResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (!parasitesResponse.ok) {
          throw new Error(`Failed to fetch parasites: ${parasitesResponse.status} ${parasitesResponse.statusText}`);
        }
        
        const parasitesData = await parasitesResponse.json();
        data = parasitesData.parasites || [];
        filename = `healthscan_parasites_${timestamp}.csv`;
        dataSource = parasitesData.source || 'memory-store';
        break;
        
      default:
        // All other data types use Supabase tables
        toast.dismiss(loadingToast);
        await exportTableData(dataType);
        return;
    }
    
    if (data.length === 0) {
      toast.dismiss(loadingToast);
      toast.warning(`No ${dataType} data to export`, {
        description: 'The dataset appears to be empty.'
      });
      return;
    }
    
    // Update loading message for processing
    toast.loading('Converting to CSV...', { 
      id: loadingToast,
      description: `Processing ${data.length} ${dataType} records...`
    });
    
    // Convert to CSV and download
    const csvContent = arrayToCSV(data, filename);
    
    // Update loading message for download
    toast.loading('Downloading file...', { 
      id: loadingToast,
      description: 'Preparing file download...'
    });
    
    downloadCSV(csvContent, filename);
    
    // Dismiss loading and show success with details
    toast.dismiss(loadingToast);
    toast.success(`${dataType} exported successfully!`, {
      description: `Downloaded ${filename} with ${data.length} records from ${dataSource}`,
      duration: 5000
    });
    
  } catch (error: any) {
    console.error(`Error exporting ${dataType}:`, error);
    
    // Ensure loading toast is dismissed
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }
    
    toast.error(`Failed to export ${dataType}`, {
      description: error.message,
      duration: 6000
    });
  }
};

// Enhanced bulk export function
export const exportAllData = async (): Promise<void> => {
  let loadingToast: string | number | undefined;
  
  try {
    loadingToast = toast.loading('Exporting all HealthScan data...', {
      description: 'Starting bulk export process...'
    });
    
    const dataTypes: Array<'meals' | 'products' | 'ingredients' | 'nutrients' | 'pollutants' | 'parasites' | 'scans'> = [
      'meals', 'products', 'ingredients', 'nutrients', 'pollutants', 'parasites', 'scans'
    ];
    
    let completedExports = 0;
    const exportResults: Array<{type: string, success: boolean, records?: number, error?: string}> = [];
    
    // Export each data type sequentially to avoid overwhelming the server
    for (const dataType of dataTypes) {
      try {
        // Update progress
        toast.loading(`Exporting all data... (${completedExports + 1}/${dataTypes.length})`, {
          id: loadingToast,
          description: `Currently exporting: ${dataType}`
        });
        
        // Export individual type (but don't show individual success toasts)
        const originalToast = toast;
        // Temporarily override toast to suppress individual notifications
        (global as any).toast = {
          ...originalToast,
          loading: () => {},
          success: () => {},
          error: () => {},
          warning: () => {},
          dismiss: () => {}
        };
        
        await exportDataType(dataType);
        
        // Restore original toast
        (global as any).toast = originalToast;
        
        exportResults.push({ type: dataType, success: true });
        completedExports++;
        
      } catch (error: any) {
        console.error(`Error exporting ${dataType} in bulk:`, error);
        exportResults.push({ 
          type: dataType, 
          success: false, 
          error: error.message 
        });
        completedExports++;
      }
    }
    
    // Dismiss loading toast
    toast.dismiss(loadingToast);
    
    // Show comprehensive results
    const successCount = exportResults.filter(result => result.success).length;
    const failureCount = exportResults.filter(result => !result.success).length;
    
    if (successCount === dataTypes.length) {
      toast.success('All data exported successfully!', {
        description: `${successCount} CSV files downloaded. Check your Downloads folder.`,
        duration: 6000
      });
    } else if (successCount > 0) {
      toast.warning('Partial export completed', {
        description: `${successCount} files succeeded, ${failureCount} failed. Check console for details.`,
        duration: 7000
      });
      
      // Log detailed results
      console.log('Export Results:', exportResults);
    } else {
      toast.error('Bulk export failed', {
        description: 'All exports failed. Please try individual exports.',
        duration: 7000
      });
    }
    
  } catch (error: any) {
    console.error('Error in bulk export:', error);
    
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }
    
    toast.error('Bulk export failed', {
      description: error.message,
      duration: 6000
    });
  }
};

// Enhanced data summary export
export const exportDataSummary = async (): Promise<void> => {
  let loadingToast: string | number | undefined;
  
  try {
    loadingToast = toast.loading('Generating data summary...', {
      description: 'Fetching statistics from all tables...'
    });
    
    // Fetch admin stats
    const statsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!statsResponse.ok) {
      throw new Error(`Failed to fetch admin stats: ${statsResponse.status} ${statsResponse.statusText}`);
    }
    
    toast.loading('Processing statistics...', {
      id: loadingToast,
      description: 'Analyzing database status and record counts...'
    });
    
    const stats = await statsResponse.json();
    
    // Create comprehensive summary data
    const summaryData = [
      {
        data_type: 'meals',
        total_records: stats.meals || 0,
        source: stats.tableStatus?.meals === 'kv_store' ? 'KV Store' : 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.meals || 'unknown',
        export_ready: stats.meals > 0 ? 'Yes' : 'No'
      },
      {
        data_type: 'products',
        total_records: stats.products || 0,
        source: 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.products || 'unknown',
        export_ready: stats.products > 0 ? 'Yes' : 'No'
      },
      {
        data_type: 'ingredients',
        total_records: stats.ingredients || 0,
        source: 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.ingredients || 'unknown',
        export_ready: stats.ingredients > 0 ? 'Yes' : 'No'
      },
      {
        data_type: 'nutrients',
        total_records: stats.nutrients || 0,
        source: 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.nutrients || 'unknown',
        export_ready: stats.nutrients > 0 ? 'Yes' : 'No'
      },
      {
        data_type: 'pollutants',
        total_records: stats.pollutants || 0,
        source: 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.pollutants || 'unknown',
        export_ready: stats.pollutants > 0 ? 'Yes' : 'No'
      },
      {
        data_type: 'parasites',
        total_records: stats.parasites || 0,
        source: stats.tableStatus?.parasites === 'memory_store' ? 'Memory Store' : 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.parasites || 'unknown',
        export_ready: stats.parasites > 0 ? 'Yes' : 'No'
      },
      {
        data_type: 'scans',
        total_records: stats.scans || 0,
        source: 'Supabase Table',
        last_updated: stats.lastUpdated || new Date().toISOString(),
        status: stats.tableStatus?.scans || 'unknown',
        export_ready: stats.scans > 0 ? 'Yes' : 'No'
      }
    ];
    
    toast.loading('Creating CSV file...', {
      id: loadingToast,
      description: 'Formatting summary data...'
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `healthscan_data_summary_${timestamp}.csv`;
    
    const csvContent = arrayToCSV(summaryData, filename);
    downloadCSV(csvContent, filename);
    
    const totalRecords = summaryData.reduce((sum, item) => sum + item.total_records, 0);
    const exportableCount = summaryData.filter(item => item.export_ready === 'Yes').length;
    
    // Dismiss loading and show detailed success
    toast.dismiss(loadingToast);
    toast.success('Data summary exported successfully!', {
      description: `${filename} contains overview of ${totalRecords} total records across ${summaryData.length} tables (${exportableCount} tables ready for export)`,
      duration: 6000
    });
    
  } catch (error: any) {
    console.error('Error exporting data summary:', error);
    
    if (loadingToast) {
      toast.dismiss(loadingToast);
    }
    
    toast.error('Failed to export data summary', {
      description: error.message,
      duration: 6000
    });
  }
};

// Utility function to validate export before attempting
export const validateExportData = (data: any[], dataType: string): { isValid: boolean, message?: string } => {
  if (!data || !Array.isArray(data)) {
    return { isValid: false, message: `Invalid ${dataType} data format` };
  }
  
  if (data.length === 0) {
    return { isValid: false, message: `No ${dataType} records found to export` };
  }
  
  // Check if data has any meaningful content
  const hasContent = data.some(item => 
    item && typeof item === 'object' && Object.keys(item).length > 0
  );
  
  if (!hasContent) {
    return { isValid: false, message: `${dataType} data appears to be empty or malformed` };
  }
  
  return { isValid: true };
};

// Enhanced error handling wrapper
export const safeExport = async (exportFunction: () => Promise<void>, dataType: string): Promise<void> => {
  try {
    await exportFunction();
  } catch (error: any) {
    console.error(`Safe export error for ${dataType}:`, error);
    
    // Ensure any lingering loading toasts are dismissed
    toast.dismiss();
    
    toast.error(`Export failed: ${dataType}`, {
      description: `${error.message}. Please try again or contact support if the issue persists.`,
      duration: 8000
    });
  }
};