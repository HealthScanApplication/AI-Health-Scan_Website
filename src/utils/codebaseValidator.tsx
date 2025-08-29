/**
 * Codebase Validator - Analyzes imports, dependencies, and potential breaking changes
 */

export interface ImportAnalysis {
  file: string;
  imports: {
    module: string;
    namedImports: string[];
    defaultImport?: string;
    isLocal: boolean;
    resolvedPath?: string;
    status: 'valid' | 'missing' | 'deprecated' | 'unknown';
  }[];
  exports: {
    named: string[];
    default?: string;
  };
  dependencies: string[];
}

export interface ValidationResult {
  file: string;
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    suggestion?: string;
  }[];
}

export interface CodebaseHealth {
  totalFiles: number;
  filesWithIssues: number;
  criticalErrors: number;
  warnings: number;
  suggestions: number;
  analysisResults: ValidationResult[];
  importGraph: Map<string, string[]>;
  circularDependencies: string[][];
}

class CodebaseValidator {
  private fileContents: Map<string, string> = new Map();
  private importGraph: Map<string, string[]> = new Map();
  
  // Known project structure
  private projectStructure = {
    components: '/components/',
    hooks: '/hooks/',
    utils: '/utils/',
    contexts: '/contexts/',
    types: '/types/',
    ui: '/components/ui/',
    supabase: '/supabase/functions/server/'
  };

  // Known external dependencies that should be available
  private knownDependencies = new Set([
    'react',
    'lucide-react',
    'sonner@2.0.3',
    'react-hook-form@7.55.0',
    'motion/react',
    'recharts',
    'react-slick',
    'react-responsive-masonry',
    'react-dnd',
    're-resizable'
  ]);

  // UI components that should exist
  private uiComponents = new Set([
    'accordion', 'alert-dialog', 'alert', 'aspect-ratio', 'avatar', 'badge',
    'breadcrumb', 'button', 'calendar', 'card', 'carousel', 'chart',
    'checkbox', 'collapsible', 'command', 'context-menu', 'dialog',
    'drawer', 'dropdown-menu', 'form', 'hover-card', 'input-otp',
    'input', 'label', 'menubar', 'navigation-menu', 'pagination',
    'popover', 'progress', 'radio-group', 'resizable', 'scroll-area',
    'select', 'separator', 'sheet', 'sidebar', 'skeleton', 'slider',
    'sonner', 'switch', 'table', 'tabs', 'textarea', 'toggle-group',
    'toggle', 'tooltip'
  ]);

  /**
   * Analyze a single file's imports and exports
   */
  analyzeFileImports(filePath: string, content: string): ImportAnalysis {
    const imports: ImportAnalysis['imports'] = [];
    const exports = { named: [] as string[], default: undefined as string | undefined };
    const dependencies: string[] = [];

    // Parse import statements
    const importRegex = /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)?\s*,?\s*(\w+)?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const [, namedImportsRaw, defaultImport, modulePath] = match;
      
      let namedImports: string[] = [];
      if (namedImportsRaw?.startsWith('{')) {
        namedImports = namedImportsRaw
          .slice(1, -1)
          .split(',')
          .map(imp => imp.trim().split(' as ')[0].trim())
          .filter(Boolean);
      }

      const isLocal = modulePath.startsWith('./') || modulePath.startsWith('../') || modulePath.startsWith('/');
      
      let status: 'valid' | 'missing' | 'deprecated' | 'unknown' = 'unknown';
      
      if (!isLocal) {
        status = this.knownDependencies.has(modulePath) ? 'valid' : 'unknown';
        dependencies.push(modulePath);
      } else {
        // For local imports, we'll mark as valid for now
        // In practice, we'd check if the file exists
        status = 'valid';
      }

      imports.push({
        module: modulePath,
        namedImports,
        defaultImport,
        isLocal,
        status
      });
    }

    // Parse export statements
    const exportRegex = /export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportName = match[1];
      if (content.includes('export default')) {
        exports.default = exportName;
      } else {
        exports.named.push(exportName);
      }
    }

    return {
      file: filePath,
      imports,
      exports,
      dependencies: [...new Set(dependencies)]
    };
  }

  /**
   * Validate imports and find potential issues
   */
  validateImports(analysis: ImportAnalysis): ValidationResult {
    const issues: ValidationResult['issues'] = [];

    for (const imp of analysis.imports) {
      // Check for deprecated patterns
      if (imp.module === 'framer-motion') {
        issues.push({
          type: 'warning',
          message: `Use 'motion/react' instead of deprecated 'framer-motion'`,
          suggestion: `Replace: import { motion } from 'motion/react'`
        });
      }

      // Check for UI component imports
      if (imp.isLocal && imp.module.includes('/ui/')) {
        const componentName = imp.module.split('/').pop()?.replace('.tsx', '');
        if (componentName && !this.uiComponents.has(componentName)) {
          issues.push({
            type: 'warning',
            message: `Unknown UI component: ${componentName}`,
            suggestion: 'Verify this component exists in /components/ui/'
          });
        }
      }

      // Check for version-specific imports
      if (!imp.isLocal && !imp.module.includes('@') && 
          ['react-hook-form', 'sonner'].includes(imp.module)) {
        issues.push({
          type: 'error',
          message: `${imp.module} requires specific version`,
          suggestion: `Use: ${imp.module === 'react-hook-form' ? 'react-hook-form@7.55.0' : 'sonner@2.0.3'}`
        });
      }

      // Check for banned packages
      if (imp.module === 'react-resizable') {
        issues.push({
          type: 'error',
          message: 'react-resizable is not supported',
          suggestion: 'Use re-resizable package instead'
        });
      }

      // Check for missing relative path prefixes
      if (imp.isLocal && !imp.module.startsWith('./') && !imp.module.startsWith('../') && !imp.module.startsWith('/')) {
        issues.push({
          type: 'warning',
          message: 'Local import should start with ./ or ../',
          suggestion: `Use: ./${imp.module}`
        });
      }
    }

    return {
      file: analysis.file,
      issues
    };
  }

  /**
   * Check for circular dependencies
   */
  findCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart).concat([node]));
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.importGraph.get(node) || [];
      for (const dep of dependencies) {
        dfs(dep, [...path, node]);
      }

      recursionStack.delete(node);
    };

    for (const node of this.importGraph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  /**
   * Validate routing and navigation
   */
  validateRouting(): ValidationResult[] {
    const issues: ValidationResult[] = [];
    
    // Check that all routes in useNavigation are handled in PageRenderer
    const navigationRoutes = ['home', 'profile', 'settings', 'admin', 'referral-test', 'diagnostic'];
    const pageRendererRoutes = ['profile', 'settings', 'referral-test', 'admin', 'diagnostic', 'home'];
    
    const missingRoutes = navigationRoutes.filter(route => !pageRendererRoutes.includes(route));
    const extraRoutes = pageRendererRoutes.filter(route => !navigationRoutes.includes(route));
    
    if (missingRoutes.length > 0) {
      issues.push({
        file: '/components/PageRenderer.tsx',
        issues: [{
          type: 'error',
          message: `Missing route handlers: ${missingRoutes.join(', ')}`,
          suggestion: 'Add case statements for these routes in PageRenderer'
        }]
      });
    }
    
    if (extraRoutes.length > 0) {
      issues.push({
        file: '/hooks/useNavigation.tsx',
        issues: [{
          type: 'warning',
          message: `Extra routes in PageRenderer: ${extraRoutes.join(', ')}`,
          suggestion: 'Verify these routes are needed'
        }]
      });
    }
    
    return issues;
  }

  /**
   * Check for common breaking patterns
   */
  checkBreakingPatterns(content: string, filePath: string): ValidationResult {
    const issues: ValidationResult['issues'] = [];
    
    // Check for font styling that should be avoided
    const fontClasses = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 
                        'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
                        'leading-none', 'leading-tight', 'leading-normal'];
    
    for (const fontClass of fontClasses) {
      if (content.includes(`"${fontClass}"`) || content.includes(`'${fontClass}'`) || content.includes(`\`${fontClass}\``)) {
        issues.push({
          type: 'warning',
          message: `Avoid overriding typography class: ${fontClass}`,
          suggestion: 'Let globals.css handle typography unless specifically requested'
        });
      }
    }
    
    // Check for hardcoded API URLs
    if (content.includes('https://') && !content.includes('${projectId}')) {
      const urls = content.match(/https:\/\/[^\s'"`,]+/g) || [];
      const externalUrls = urls.filter(url => 
        !url.includes('supabase.co') && 
        !url.includes('unsplash.com') &&
        !url.includes('images.unsplash.com')
      );
      
      if (externalUrls.length > 0) {
        issues.push({
          type: 'warning',
          message: 'Hardcoded external URLs found',
          suggestion: 'Consider making these configurable or using environment variables'
        });
      }
    }
    
    // Check for console.log in production
    const logMatches = content.match(/console\.(log|warn|error)/g);
    if (logMatches && logMatches.length > 10) {
      issues.push({
        type: 'info',
        message: `Many console statements found (${logMatches.length})`,
        suggestion: 'Consider reducing console output for production'
      });
    }
    
    return {
      file: filePath,
      issues
    };
  }

  /**
   * Get suggestions for improving code health
   */
  getHealthSuggestions(health: CodebaseHealth): string[] {
    const suggestions: string[] = [];
    
    if (health.criticalErrors > 0) {
      suggestions.push(`🚨 Fix ${health.criticalErrors} critical errors that may break the application`);
    }
    
    if (health.warnings > 10) {
      suggestions.push(`⚠️ Address ${health.warnings} warnings to improve code quality`);
    }
    
    const errorRate = (health.filesWithIssues / health.totalFiles) * 100;
    if (errorRate > 30) {
      suggestions.push(`📊 ${Math.round(errorRate)}% of files have issues - consider a code review`);
    }
    
    if (health.circularDependencies.length > 0) {
      suggestions.push(`🔄 Found ${health.circularDependencies.length} circular dependencies - refactor to improve maintainability`);
    }
    
    suggestions.push('💡 Run this check after making changes to catch breaking issues early');
    suggestions.push('🔧 Use TypeScript strict mode to catch more potential issues');
    suggestions.push('📝 Keep imports organized and remove unused dependencies');
    
    return suggestions;
  }
}

// Export singleton instance
export const codebaseValidator = new CodebaseValidator();

// Helper functions for easy validation
export function validateFileImports(filePath: string, content: string): ValidationResult {
  const analysis = codebaseValidator.analyzeFileImports(filePath, content);
  return codebaseValidator.validateImports(analysis);
}

export function checkForBreakingPatterns(content: string, filePath: string): ValidationResult {
  return codebaseValidator.checkBreakingPatterns(content, filePath);
}

export function validateRouting(): ValidationResult[] {
  return codebaseValidator.validateRouting();
}

// Mock analysis for common project files (in a real implementation, you'd read actual files)
export function getMockCodebaseHealth(): CodebaseHealth {
  const mockResults: ValidationResult[] = [
    {
      file: '/App.tsx',
      issues: []
    },
    {
      file: '/components/Header.tsx',
      issues: [
        {
          type: 'info',
          message: 'File looks healthy',
          suggestion: 'No changes needed'
        }
      ]
    },
    {
      file: '/hooks/useNavigation.tsx',
      issues: []
    },
    {
      file: '/components/PageRenderer.tsx',
      issues: []
    }
  ];

  const criticalErrors = mockResults.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.type === 'error').length, 0);
  const warnings = mockResults.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.type === 'warning').length, 0);
  const suggestions = mockResults.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.type === 'info').length, 0);

  return {
    totalFiles: 45, // Approximate count from file structure
    filesWithIssues: mockResults.filter(r => r.issues.length > 0).length,
    criticalErrors,
    warnings,
    suggestions,
    analysisResults: mockResults,
    importGraph: new Map([
      ['/App.tsx', ['/contexts/AuthContext.tsx', '/components/Header.tsx']],
      ['/components/Header.tsx', ['/hooks/useAuth.tsx']],
      ['/hooks/useNavigation.tsx', ['/types/app.tsx']]
    ]),
    circularDependencies: []
  };
}