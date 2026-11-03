import { useSyncExternalStore } from 'react';

type Navigation = {
  /** Sets the address the next render sees, such as `/players?offer=1`. */
  setUrl: (url: string) => void;
  current: () => string;
  module: {
    useRouter: () => {
      push: (url: string) => void;
      replace: (url: string) => void;
      refresh: () => void;
    };
    usePathname: () => string;
    useSearchParams: () => URLSearchParams;
  };
};

/**
 * A stand-in for `next/navigation` with an address that changes when code pushes or replaces it.
 * Use it in `vi.mock('next/navigation', ...)` for components that keep state in the URL.
 */
export function createNavigation(initialUrl = '/players'): Navigation {
  let url = initialUrl;
  const listeners = new Set<() => void>();

  function setUrl(next: string): void {
    url = next;
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  const read = (): string => url;
  const pathOf = (value: string): string => value.split('?')[0] ?? '';
  const queryOf = (value: string): string => value.split('?')[1] ?? '';

  return {
    setUrl,
    current: read,
    module: {
      useRouter: () => ({ push: setUrl, replace: setUrl, refresh: () => {} }),
      usePathname: () => pathOf(useSyncExternalStore(subscribe, read, read)),
      useSearchParams: () =>
        new URLSearchParams(queryOf(useSyncExternalStore(subscribe, read, read))),
    },
  };
}
