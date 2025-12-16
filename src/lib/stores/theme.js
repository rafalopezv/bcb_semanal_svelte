import { writable } from 'svelte/store';

// Create a store for theme state and toggle function
export const themeStore = writable({ theme: 'light', toggleTheme: () => {} });
