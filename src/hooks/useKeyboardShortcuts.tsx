import { useEffect } from 'react';
import { toast } from "sonner@2.0.3";
import { PageType } from '../types/app';

interface UseKeyboardShortcutsProps {
  isAdmin: boolean;
  setCurrentPage: (page: PageType) => void;
}

export function useKeyboardShortcuts({ isAdmin, setCurrentPage }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D or Cmd+Shift+D to run diagnostics
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        console.log('🔍 Running diagnostics via keyboard shortcut...');
        window.healthScanDebug.diagnosticSuite()
          .then(results => {
            console.log('🔍 Diagnostic results:', results);
            const passCount = results.filter(r => r.status === 'pass').length;
            const failCount = results.filter(r => r.status === 'fail').length;
            toast.info(`Diagnostics: ${passCount} passed, ${failCount} failed`);
          })
          .catch(error => {
            console.error('🔍 Diagnostic error:', error);
            toast.error('Diagnostics failed to run');
          });
      }
      
      // Ctrl+Shift+A or Cmd+Shift+A to open admin (for admins only)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A' && isAdmin) {
        event.preventDefault();
        console.log('🔧 Opening admin dashboard via keyboard shortcut...');
        setCurrentPage('admin');
        toast.success('🔧 Admin dashboard opened');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, setCurrentPage]);
}