import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './config/queryClient';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import App from './App';
import './styles/globals.css';

// Clear React Query cache when page becomes visible (user returns to tab)
// This ensures fresh data after the user has been away
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Invalidate all queries to trigger refetch
    queryClient.invalidateQueries();
  }
});

// Also handle bfcache restoration (back/forward navigation)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    queryClient.invalidateQueries();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
