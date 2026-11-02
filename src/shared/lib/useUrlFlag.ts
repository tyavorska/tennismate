'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * A yes/no state kept in the URL as `?name=1`, such as "the offer form is open".
 * Opening adds a history entry, so the back button closes it; closing removes the parameter.
 */
export function useUrlFlag(name: string): readonly [boolean, (isOn: boolean) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOn = searchParams.get(name) === '1';

  function set(next: boolean): void {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(name, '1');
    else params.delete(name);
    const query = params.toString();
    const url = query === '' ? pathname : `${pathname}?${query}`;
    if (next) router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }

  return [isOn, set];
}
