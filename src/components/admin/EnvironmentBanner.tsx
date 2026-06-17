/**
 * Environment Banner
 * Persistent warning shown whenever the admin is connected to PRODUCTION,
 * so it's always obvious you're editing live data.
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  getCurrentEnvironment,
  setCurrentEnvironment,
  type Environment,
} from '../../utils/supabase/environments';

export function EnvironmentBanner() {
  const [env, setEnv] = useState<Environment>('staging');

  useEffect(() => {
    setEnv(getCurrentEnvironment());
  }, []);

  if (env !== 'production') return null;

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-xs sm:text-sm font-semibold"
      style={{ backgroundColor: '#fef3c7', color: '#78350f', borderBottom: '1px solid #f59e0b' }}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        🚀 Connected to <strong>PRODUCTION</strong> — changes affect live data and real users.
      </span>
      <button
        type="button"
        onClick={() => setCurrentEnvironment('staging')}
        className="ml-2 px-2.5 py-1 rounded-md font-semibold transition-colors"
        style={{ backgroundColor: '#0284c7', color: 'white' }}
      >
        Switch to Staging
      </button>
    </div>
  );
}
