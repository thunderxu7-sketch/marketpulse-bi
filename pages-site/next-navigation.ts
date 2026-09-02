import { useSyncExternalStore } from 'react';

function pathnameFromHash() {
  const value = window.location.hash.replace(/^#/, '');
  return value.startsWith('/') ? value : '/';
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function usePathname() {
  return useSyncExternalStore(subscribe, pathnameFromHash, () => '/');
}
