import { projectId } from './supabase/info';
import { ENVIRONMENTS } from './supabase/environments';

type PublicStripeEnvironment = {
  VITE_STRIPE_PUBLISHABLE_KEY_STAGING?: string;
  VITE_STRIPE_PUBLISHABLE_KEY_PRODUCTION?: string;
};

/** Select by the same project snapshot used by all Supabase requests, not hostname. */
export function resolveGuardianStripe(project: string, env: PublicStripeEnvironment) {
  const environment = project === ENVIRONMENTS.staging.projectId ? 'staging'
    : project === ENVIRONMENTS.production.projectId ? 'production' : null;
  if (!environment) return { environment, publishableKey: null, enabled: false, error: 'Checkout is unavailable for this database environment.' };
  const key = (environment === 'staging' ? env.VITE_STRIPE_PUBLISHABLE_KEY_STAGING : env.VITE_STRIPE_PUBLISHABLE_KEY_PRODUCTION)?.trim();
  const pattern = environment === 'staging' ? /^pk_test_[A-Za-z0-9]+$/ : /^pk_live_[A-Za-z0-9]+$/;
  if (!key || !pattern.test(key)) return { environment, publishableKey: null, enabled: false, error: `Checkout is not configured with a valid ${environment} publishable key.` };
  // Release hold: only a reviewed follow-up after complete sandbox verification may enable live checkout.
  // No build flag or legacy shared key can override this hold.
  if (environment === 'production') return { environment, publishableKey: key, enabled: false, error: 'Live payments are disabled pending full staging verification.' };
  return { environment, publishableKey: key, enabled: true, error: null };
}

export function getGuardianStripeConfiguration() {
  return resolveGuardianStripe(projectId, import.meta.env);
}
