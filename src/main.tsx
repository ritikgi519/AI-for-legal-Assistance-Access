// Ensure window.fetch is safely assignable in iframe/preview environments
if (typeof window !== 'undefined') {
  try {
    const nativeFetch = window.fetch;
    let activeFetch = nativeFetch ? (...args: any[]) => (nativeFetch as any).apply(window, args) : null;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || desc.configurable) {
      Object.defineProperty(window, 'fetch', {
        get: () => activeFetch,
        set: (fn) => {
          activeFetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch (_e) {
    // Ignore if environment forbids redefinition
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
