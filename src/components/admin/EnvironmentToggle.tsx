/**
 * Environment Toggle Component
 * Allows switching between staging and production Supabase environments
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getCurrentEnvironment, setCurrentEnvironment, ENVIRONMENTS, type Environment } from '../../utils/supabase/environments';

export function EnvironmentToggle() {
  const [currentEnv, setCurrentEnv] = useState<Environment>('staging');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentEnv(getCurrentEnvironment());
  }, []);

  const handleSwitch = (env: Environment) => {
    if (env === currentEnv) return;

    // Guardrail: require explicit confirmation before connecting to Production,
    // since the admin panel can edit live data.
    if (env === 'production') {
      const confirmed = window.confirm(
        '⚠️ Switch to PRODUCTION?\n\n' +
        'You will be editing LIVE production data. Changes here affect real users immediately.\n\n' +
        'Click OK to connect to Production, or Cancel to stay on Staging.'
      );
      if (!confirmed) return;
    }

    setCurrentEnvironment(env);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
        style={{
          backgroundColor: currentEnv === 'staging' ? '#e0f2fe' : '#fef3c7',
          borderColor: currentEnv === 'staging' ? '#0284c7' : '#f59e0b',
          color: currentEnv === 'staging' ? '#0c4a6e' : '#78350f',
        }}
      >
        <span className="text-sm">
          {currentEnv === 'staging' ? '🧪' : '🚀'}
        </span>
        <span>{ENVIRONMENTS[currentEnv].label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
          {Object.entries(ENVIRONMENTS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                handleSwitch(key as Environment);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                currentEnv === key
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{key === 'staging' ? '🧪' : '🚀'}</span>
                <div>
                  <div className="font-semibold">{config.label}</div>
                  <div className="text-[10px] text-gray-500">{config.projectId.slice(0, 8)}...</div>
                </div>
                {currentEnv === key && <span className="ml-auto">✓</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
