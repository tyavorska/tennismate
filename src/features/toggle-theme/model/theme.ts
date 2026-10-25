export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

export function readTheme(): Theme {
  return isTheme(document.documentElement.dataset.theme)
    ? document.documentElement.dataset.theme
    : 'light';
}

export function resolveInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Fall through to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this visit.
  }
}

// Runs before first paint so the page never flashes the wrong theme.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;
