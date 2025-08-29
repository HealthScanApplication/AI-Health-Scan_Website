/**
 * HealthScan Application Integrity Check Guide
 * 
 * This guide explains how to use the integrity checking tools to prevent and fix
 * broken links and functionality after making changes to the application.
 */

export interface IntegrityCheckGuide {
  whenToUse: string[];
  quickCheckSteps: string[];
  fullCheckSteps: string[];
  commonIssues: {
    issue: string;
    description: string;
    howToFix: string[];
    preventionTips: string[];
  }[];
  bestPractices: string[];
}

export const integrityCheckGuide: IntegrityCheckGuide = {
  whenToUse: [
    "After making changes to navigation or routing logic",
    "After modifying API endpoints or server functionality", 
    "After updating component imports or file structures",
    "After changing authentication or admin access controls",
    "Before deploying to production",
    "When users report broken functionality",
    "After major refactoring or code reorganization"
  ],

  quickCheckSteps: [
    "Open the admin dashboard as an admin user",
    "Look for the 'Quick Integrity Check' component (usually in admin tools)",
    "Click 'Run Check' to test core functionality",
    "Review any failed or warning items",
    "Fix critical issues before continuing development",
    "Re-run the check to verify fixes"
  ],

  fullCheckSteps: [
    "Navigate to Admin Dashboard → Health Dashboard",
    "Click 'Run Full Check' to perform comprehensive analysis",
    "Review the overall health score and individual category scores",
    "Check the 'Link Integrity' tab for broken endpoints and routes",
    "Review 'Code Health' tab for dependency and import issues",
    "Examine 'Security' tab for potential vulnerabilities",
    "Follow the recommendations provided in each section",
    "Re-run after making fixes to confirm improvements"
  ],

  commonIssues: [
    {
      issue: "Broken Server Endpoints",
      description: "API calls failing due to server issues or incorrect URLs",
      howToFix: [
        "Check if the server is running and accessible",
        "Verify endpoint URLs match the server routes",
        "Ensure proper authentication headers are being sent",
        "Check for typos in endpoint paths",
        "Review server logs for error details"
      ],
      preventionTips: [
        "Use constants for API endpoints instead of hardcoding URLs",
        "Test API calls after making server changes",
        "Use TypeScript to catch endpoint typing issues",
        "Implement proper error handling for all API calls"
      ]
    },
    {
      issue: "Navigation Route Errors",
      description: "Users can't navigate to certain pages or get unexpected errors",
      howToFix: [
        "Check that all routes are defined in PageRenderer.tsx",
        "Verify route names match between useNavigation and PageRenderer",
        "Ensure admin routes have proper access control",
        "Test navigation with different user permission levels",
        "Check for case sensitivity in route names"
      ],
      preventionTips: [
        "Use constants for route names",
        "Test navigation after adding new routes",
        "Implement proper error boundaries for page components",
        "Document route access requirements"
      ]
    },
    {
      issue: "Component Import Failures",
      description: "Components not loading due to missing or incorrect imports",
      howToFix: [
        "Check file paths in import statements",
        "Verify component files exist at specified locations",
        "Ensure component names match their exports",
        "Check for circular dependencies between components",
        "Verify case sensitivity in file names"
      ],
      preventionTips: [
        "Use absolute imports where possible",
        "Organize components in logical directory structures",
        "Use TypeScript for better import validation",
        "Regularly run build checks to catch import issues"
      ]
    },
    {
      issue: "Authentication Problems",
      description: "Users can't log in or admin access is broken",
      howToFix: [
        "Check Supabase authentication configuration",
        "Verify API keys are correctly configured",
        "Test login flow with valid credentials",
        "Check admin user detection logic",
        "Verify auth context is properly provided"
      ],
      preventionTips: [
        "Test auth flows after making changes",
        "Use proper environment variable management",
        "Implement comprehensive error handling for auth",
        "Keep auth logic centralized and well-documented"
      ]
    },
    {
      issue: "Database Connection Issues",
      description: "Cannot fetch or save data to the database",
      howToFix: [
        "Check Supabase connection configuration",
        "Verify database credentials and permissions",
        "Test database queries in Supabase dashboard",
        "Check for network connectivity issues",
        "Review server logs for database errors"
      ],
      preventionTips: [
        "Use connection pooling for better reliability",
        "Implement proper error handling for database operations",
        "Test database operations after schema changes",
        "Monitor database performance and connection limits"
      ]
    }
  ],

  bestPractices: [
    "Run quick checks frequently during development",
    "Perform full health checks before major releases",
    "Fix critical issues immediately, warnings can be scheduled",
    "Keep a log of common issues and their solutions",
    "Set up automated checks in your CI/CD pipeline",
    "Test with different user roles and permissions",
    "Verify mobile responsiveness and cross-browser compatibility",
    "Monitor application performance after making changes",
    "Document any breaking changes and migration steps",
    "Use feature flags to safely roll out changes",
    "Keep backups before making major modifications",
    "Test error scenarios and edge cases"
  ]
};

/**
 * Helper function to get issue solutions based on problem type
 */
export function getIssueSolution(issueType: string): string[] {
  const issue = integrityCheckGuide.commonIssues.find(
    item => item.issue.toLowerCase().includes(issueType.toLowerCase())
  );
  
  return issue ? issue.howToFix : [
    "Check application logs for error details",
    "Verify all dependencies are installed and up to date", 
    "Test the functionality manually to reproduce the issue",
    "Review recent changes that might have caused the problem",
    "Check network connectivity and server status"
  ];
}

/**
 * Helper function to get prevention tips for specific issue types
 */
export function getPreventionTips(issueType: string): string[] {
  const issue = integrityCheckGuide.commonIssues.find(
    item => item.issue.toLowerCase().includes(issueType.toLowerCase())
  );
  
  return issue ? issue.preventionTips : [
    "Test thoroughly after making changes",
    "Use TypeScript for better error catching",
    "Implement comprehensive error handling",
    "Document your changes and their impacts",
    "Use version control to track changes"
  ];
}

/**
 * Checklist for manual verification after integrity checks
 */
export const postCheckVerificationList = [
  {
    category: "Navigation",
    checks: [
      "Can navigate to all main pages",
      "Admin navigation works for admin users",
      "Back buttons work correctly",
      "Page transitions are smooth",
      "URLs update correctly during navigation"
    ]
  },
  {
    category: "Authentication", 
    checks: [
      "Login flow works end-to-end",
      "Logout clears user session",
      "Admin detection works correctly",
      "Protected routes block unauthorized access",
      "User state persists across page refreshes"
    ]
  },
  {
    category: "Data Operations",
    checks: [
      "Database queries return expected data",
      "Create, read, update, delete operations work",
      "Data validation prevents invalid entries", 
      "Error messages are user-friendly",
      "Loading states display appropriately"
    ]
  },
  {
    category: "User Interface",
    checks: [
      "All buttons and links are clickable",
      "Forms submit successfully",
      "Images load correctly",
      "Responsive design works on mobile",
      "Accessibility features function properly"
    ]
  }
];

/**
 * Emergency rollback checklist if critical issues are found
 */
export const emergencyRollbackChecklist = [
  "Identify the specific change that caused the issue",
  "Assess the scope of impact (users affected, features broken)",
  "Document the issue and its symptoms",
  "Revert to the last known working version",
  "Test core functionality after rollback",
  "Notify users if necessary about temporary issues",
  "Create a plan to fix the issue properly",
  "Test the fix thoroughly before re-deploying",
  "Update monitoring and alerts to catch similar issues"
];

/**
 * Get a prioritized list of what to check based on the type of change made
 */
export function getChecklistForChangeType(changeType: string): string[] {
  const checklists: Record<string, string[]> = {
    navigation: [
      "Test all navigation paths",
      "Verify admin navigation works",
      "Check route permissions",
      "Test back button functionality",
      "Verify page titles and URLs"
    ],
    api: [
      "Test all API endpoints",
      "Verify authentication works",
      "Check error handling",
      "Test with different user roles",
      "Verify data validation"
    ],
    database: [
      "Test data retrieval",
      "Verify data persistence",
      "Check query performance",
      "Test error scenarios",
      "Verify data integrity"
    ],
    ui: [
      "Test all interactive elements",
      "Verify responsive design",
      "Check image loading",
      "Test form submissions",
      "Verify accessibility"
    ],
    auth: [
      "Test login/logout flow",
      "Verify admin detection",
      "Check protected routes",
      "Test session persistence",
      "Verify user permissions"
    ]
  };

  return checklists[changeType.toLowerCase()] || checklists.ui;
}