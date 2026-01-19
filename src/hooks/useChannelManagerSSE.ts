/**
 * Channel Manager SSE Hook
 * Provides real-time updates from channel manager webhooks via Server-Side Events
 * Uses Fetch API to support Authorization header (EventSource doesn't support custom headers)
 */

import { useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../api/client';
import { ENV } from '../config/env';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface UseChannelManagerSSEOptions {
  enabled?: boolean;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

/**
 * Hook for managing Channel Manager SSE connection using Fetch API
 * This is required because the backend requires Authorization header,
 * which EventSource doesn't support
 * 
 * @param options - Configuration options for SSE connection
 * @returns Connection status and control functions
 */
export function useChannelManagerSSE(options: UseChannelManagerSSEOptions = {}) {
  const {
    enabled = true,
    onEvent,
    onError,
    onConnect,
    onDisconnect,
    reconnectDelay = 1000,
    maxReconnectDelay = 60000,
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef<number>(reconnectDelay);
  const isConnectingRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);

  const connect = useCallback(async () => {
    if (!enabled || isConnectingRef.current) {
      console.log('[SSE] Connection skipped - enabled:', enabled, 'isConnecting:', isConnectingRef.current);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.warn('[SSE] ❌ No access token available for SSE connection');
      return;
    }

    const url = `${ENV.API_URL}/api/v1/webhooks/channel-manager/sse`;
    console.log('[SSE] 🔌 Attempting to connect to SSE endpoint:');
    console.log('[SSE]   URL:', url);
    console.log('[SSE]   Method: GET');
    console.log('[SSE]   Headers: Authorization: Bearer <token>');
    console.log('[SSE]   Accept: text/event-stream');

    // Clean up previous connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    abortControllerRef.current = new AbortController();
    isConnectingRef.current = true;

    try {
      console.log('[SSE] 📡 Sending fetch request...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortControllerRef.current.signal,
      });

      console.log('[SSE] 📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[SSE] ❌ Authentication failed - 401 Unauthorized');
          isConnectingRef.current = false;
          isConnectedRef.current = false;
          onError?.(new Error('Authentication failed'));
          return;
        }
        console.error('[SSE] ❌ Connection failed:', response.status, response.statusText);
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error('[SSE] ❌ Response body is not readable');
        throw new Error('Response body is not readable');
      }
      readerRef.current = reader;
      const decoder = new TextDecoder();

      console.log('[SSE] ✅ Response body is readable, starting to read stream...');
      let buffer = '';
      reconnectDelayRef.current = reconnectDelay; // Reset delay on successful connection
      isConnectingRef.current = false;
      // Don't set connected yet - wait for "connected" message from server

      while (true) {
        const { done, value } = await readerRef.current.read();

        if (done) {
          console.log('[SSE] 🔌 Connection closed by server (done=true)');
          isConnectedRef.current = false;
          // Reconnect with exponential backoff
          if (enabled) {
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, maxReconnectDelay);
            console.log(`[SSE] 🔄 Will reconnect in ${reconnectDelayRef.current}ms`);
            reconnectTimeoutRef.current = setTimeout(connect, reconnectDelayRef.current);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          // Skip empty lines
          if (!line.trim()) {
            continue;
          }

          // Handle keepalive pings
          if (line.trim() === ': keepalive' || line.startsWith(': keepalive')) {
            console.log('[SSE] 💓 Keepalive ping received');
            continue;
          }

          // Handle data lines
          if (line.startsWith('data: ')) {
            try {
              const rawData = line.slice(6);
              console.log('[SSE] 📨 Raw SSE data line received:', rawData.substring(0, 100) + (rawData.length > 100 ? '...' : ''));
              
              const data: SSEEvent = JSON.parse(rawData);
              console.log('[SSE] 📦 Parsed SSE event:', {
                type: data.type,
                timestamp: data.timestamp,
                dataKeys: Object.keys(data.data || {}),
                fullData: data,
              });

              // Handle initial connection message
              if (data.type === 'connected') {
                console.log('[SSE] ✅✅✅ SSE CONNECTION SUCCESSFULLY ESTABLISHED ✅✅✅');
                console.log('[SSE]   Message:', (data as any).message || 'Connection established');
                console.log('[SSE]   Timestamp:', data.timestamp);
                isConnectedRef.current = true;
                onConnect?.();
                continue;
              }

              // Handle regular events
              console.log('[SSE] 🎯 DISPATCHING EVENT:', data.type);
              console.log('[SSE]   Event data:', JSON.stringify(data.data, null, 2));
              console.log('[SSE]   Event timestamp:', data.timestamp);
              onEvent?.(data);
            } catch (error) {
              console.error('[SSE] ❌ Error parsing SSE data:', error);
              console.error('[SSE]   Problematic line:', line);
              console.error('[SSE]   Line length:', line.length);
            }
          } else {
            // Log other lines for debugging
            console.log('[SSE] 📝 Other SSE line (not data):', line.substring(0, 50));
          }
        }
      }
    } catch (error: any) {
      isConnectingRef.current = false;
      isConnectedRef.current = false;

      if (error.name === 'AbortError') {
        console.log('[SSE] 🛑 Connection aborted (intentional)');
        return;
      }

      console.error('[SSE] ❌ Connection error:', error);
      console.error('[SSE]   Error name:', error.name);
      console.error('[SSE]   Error message:', error.message);
      console.error('[SSE]   Error stack:', error.stack);
      onError?.(error);

      // Reconnect with exponential backoff
      if (enabled) {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, maxReconnectDelay);
        console.log(`[SSE] 🔄 Will attempt reconnection in ${reconnectDelayRef.current}ms`);
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelayRef.current);
      }
    }
  }, [enabled, onEvent, onError, onConnect, reconnectDelay, maxReconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (readerRef.current) {
      readerRef.current.cancel().catch(() => {
        // Ignore cancel errors
      });
      readerRef.current = null;
    }

    isConnectingRef.current = false;
    isConnectedRef.current = false;
    onDisconnect?.();
  }, [onDisconnect]);

  // Setup connection on mount or when enabled changes
  useEffect(() => {
    console.log('[SSE] 🚀 useChannelManagerSSE effect triggered, enabled:', enabled);
    if (enabled) {
      console.log('[SSE] 🔌 Initiating SSE connection...');
      connect();
    } else {
      console.log('[SSE] 🔌 Disabling SSE connection...');
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      console.log('[SSE] 🧹 Cleaning up SSE connection on unmount');
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
  };
}
