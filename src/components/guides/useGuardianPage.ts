import { useCallback, useEffect, useState, type SetStateAction } from 'react';

/** Keep Guardian tool/setup clicks, reload, and browser history on the same page. */
export function useGuardianPage<T extends string | number>(key: 'tab' | 'step', allowed: readonly T[], fallback: T) {
  const read = useCallback(() => {
    const value = new URLSearchParams(window.location.search).get(key);
    return allowed.find(item => String(item) === value) ?? fallback;
  }, [key, allowed, fallback]);
  const [page, setPage] = useState(read);
  useEffect(() => {
    const restore = () => setPage(read());
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [read]);
  const navigate = useCallback((next: SetStateAction<T>) => {
    const value = typeof next === 'function' ? next(read()) : next;
    const url = new URL(window.location.href);
    url.searchParams.delete(key === 'tab' ? 'step' : 'tab');
    url.searchParams.set(key, String(value));
    url.hash = '';
    if (url.href !== window.location.href) window.history.pushState({}, '', url);
    setPage(value);
  }, [key, read]);
  return [page, navigate] as const;
}
