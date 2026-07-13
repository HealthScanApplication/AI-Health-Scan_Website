export async function initializeDiagnostics() {
  try {
    console.log('🔍 ROUTINE³ diagnostics system initialized');
    console.log('🔍 Manual diagnostics available via window.healthScanDebug');
    console.log('🔍 No automatic connectivity checks will be performed during app startup');
    
    // Set up debug information without any network requests
    if (typeof window !== 'undefined') {
      console.log('📋 Available diagnostic commands:');
      console.log('  • window.healthScanDebug.diagnosticSuite() - Full diagnostic suite');
      console.log('  • window.healthScanDebug.testServer() - Server connectivity test');
      console.log('  • window.healthScanDebug.testConnectivity() - Network connectivity test');
      console.log('  • window.healthScanDebug.checkAccount("email") - Account debugging');
      console.log('🎯 All diagnostic functions are available on-demand only');
    }
    
    // No automatic connectivity tests during app initialization
    // This prevents "Failed to fetch" errors during startup
    console.log('✅ Diagnostics initialization completed without network requests');
    
  } catch (error) {
    console.warn('🔧 Diagnostics initialization completed with warnings:', error?.message || 'Unknown error');
  }
}