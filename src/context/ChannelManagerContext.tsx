/**
 * Channel Manager Context
 * Manages OTA connections, room mappings, rate syncs, restrictions, and sync logs
 * Now integrates with backend API for real room/rate data
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { sampleOTAs, otaStatusConfig } from '../data/channel-manager/sampleOTAs';
import { sampleRoomMappings } from '../data/channel-manager/sampleRoomMappings';
import { sampleRateOverrides, generateRateCalendar, baseRates } from '../data/channel-manager/sampleRateOverrides';
import { sampleRestrictions } from '../data/channel-manager/sampleRestrictions';
import { sampleSyncLogs } from '../data/channel-manager/sampleSyncLogs';
import { apiClient } from '../api/client';

const ChannelManagerContext = createContext(null);

const STORAGE_KEY = 'channel_manager_data';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load Channel Manager data:', e);
  }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save Channel Manager data:', e);
  }
}

export function ChannelManagerProvider({ children }) {
  const stored = loadFromStorage();

  const [otas, setOTAs] = useState(stored?.otas || sampleOTAs);
  const [roomMappings, setRoomMappings] = useState(stored?.roomMappings || sampleRoomMappings);
  const [rateOverrides, setRateOverrides] = useState(stored?.rateOverrides || sampleRateOverrides);
  const [restrictions, setRestrictions] = useState(stored?.restrictions || sampleRestrictions);
  const [syncLogs, setSyncLogs] = useState(stored?.syncLogs || sampleSyncLogs);
  const [rateCalendar, setRateCalendar] = useState(() => generateRateCalendar(baseRates, stored?.rateOverrides || sampleRateOverrides));
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingOTAs, setSyncingOTAs] = useState([]);
  const [lastGlobalSync, setLastGlobalSync] = useState(new Date().toISOString());

  const syncIntervalRef = useRef(null);

  // Persist to localStorage
  useEffect(() => {
    saveToStorage({ otas, roomMappings, rateOverrides, restrictions, syncLogs });
  }, [otas, roomMappings, rateOverrides, restrictions, syncLogs]);

  // Regenerate rate calendar when overrides change
  useEffect(() => {
    setRateCalendar(generateRateCalendar(baseRates, rateOverrides));
  }, [rateOverrides]);

  // Auto-sync scheduler
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      autoSyncScheduler();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Fetch real data from API to enhance room mappings and rates
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Fetch room types from API
        const roomTypesResponse = await apiClient.get('/api/v1/room-types', { params: { pageSize: 100 } });
        const roomTypes = roomTypesResponse.data?.items || [];

        if (roomTypes.length > 0) {
          // Build room mappings from actual room types
          const realRoomMappings = roomTypes.map((rt: any) => ({
            pmsRoomType: rt.name || rt.slug || 'Unknown',
            pmsRoomTypeId: rt.id?.toString() || rt.slug,
            baseRate: rt.price || 200,
            totalInventory: rt.availableRoomCount || 10,
            otaMappings: [
              { otaCode: 'BOOKING', otaRoomType: `${rt.name} - Best Rate`, otaRoomId: `BK-${rt.slug}`, status: 'active', lastSync: new Date().toISOString() },
              { otaCode: 'EXPEDIA', otaRoomType: `${rt.name} Room`, otaRoomId: `EX-${rt.slug}`, status: 'active', lastSync: new Date().toISOString() },
              { otaCode: 'AGODA', otaRoomType: rt.name, otaRoomId: `AG-${rt.slug}`, status: 'active', lastSync: new Date().toISOString() },
            ]
          }));

          setRoomMappings(prev => {
            // Merge with existing or use new data
            if (prev.length === 0 || prev === sampleRoomMappings) {
              return realRoomMappings;
            }
            return prev;
          });

          // Generate rate calendar from real room types
          const realBaseRates: Record<string, number> = {};
          roomTypes.forEach((rt: any) => {
            realBaseRates[rt.name || rt.slug || 'Unknown'] = rt.price || 200;
          });

          // Only update if we have real data
          if (Object.keys(realBaseRates).length > 0) {
            setRateCalendar(generateRateCalendar(realBaseRates, rateOverrides));
          }
        }

        // Fetch bookings to calculate OTA stats
        const bookingsResponse = await apiClient.get('/api/v1/bookings', { params: { pageSize: 1000 } });
        const bookings = bookingsResponse.data?.items || bookingsResponse.data?.data?.items || [];

        if (bookings.length > 0) {
          // Calculate revenue and booking counts per OTA
          const otaStats: Record<string, { bookings: number; revenue: number }> = {
            BOOKING: { bookings: 0, revenue: 0 },
            EXPEDIA: { bookings: 0, revenue: 0 },
            AGODA: { bookings: 0, revenue: 0 },
            DIRECT: { bookings: 0, revenue: 0 },
          };

          bookings.forEach((booking: any) => {
            const source = (booking.source || booking.channel || 'DIRECT').toUpperCase();
            const amount = booking.totalPrice || booking.amount || booking.total || 0;

            // Map booking sources to OTA codes
            let otaCode = 'DIRECT';
            if (source.includes('BOOKING')) otaCode = 'BOOKING';
            else if (source.includes('EXPEDIA')) otaCode = 'EXPEDIA';
            else if (source.includes('AGODA')) otaCode = 'AGODA';

            if (otaStats[otaCode]) {
              otaStats[otaCode].bookings++;
              otaStats[otaCode].revenue += amount;
            }
          });

          // Update OTA stats with real data
          setOTAs(prev => prev.map(ota => {
            const stats = otaStats[ota.code] || { bookings: 0, revenue: 0 };
            return {
              ...ota,
              stats: {
                ...ota.stats,
                totalBookings: stats.bookings || ota.stats?.totalBookings || 0,
                revenue: stats.revenue || ota.stats?.revenue || 0,
              }
            };
          }));
        }

      } catch (err) {
        console.error('Error fetching real data for Channel Manager:', err);
        // Keep sample data as fallback
      }
    };

    fetchRealData();
  }, [rateOverrides]);

  // ============ OTA FUNCTIONS ============

  const connectOTA = useCallback((otaData) => {
    const newOTA = {
      id: `ota-${String(Date.now()).slice(-6)}`,
      ...otaData,
      status: 'connected',
      lastSync: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      syncSettings: {
        autoSync: true,
        syncInterval: 5,
        syncRates: true,
        syncAvailability: true,
        syncRestrictions: true
      },
      stats: {
        totalBookings: 0,
        revenue: 0,
        avgRating: 0,
        commission: otaData.commission || 15
      }
    };

    setOTAs(prev => [...prev, newOTA]);

    addSyncLog(newOTA.code, newOTA.name, 'connection', 'success', `Connected to ${newOTA.name} successfully`);

    return newOTA;
  }, []);

  const disconnectOTA = useCallback((otaId) => {
    setOTAs(prev => prev.map(ota => {
      if (ota.id === otaId) {
        addSyncLog(ota.code, ota.name, 'connection', 'success', `Disconnected from ${ota.name}`);
        return {
          ...ota,
          status: 'disconnected',
          lastSync: new Date().toISOString(),
          nextSync: null
        };
      }
      return ota;
    }));
  }, []);

  const reconnectOTA = useCallback((otaId) => {
    setOTAs(prev => prev.map(ota => {
      if (ota.id === otaId) {
        addSyncLog(ota.code, ota.name, 'connection', 'success', `Reconnected to ${ota.name}`);
        return {
          ...ota,
          status: 'connected',
          lastSync: new Date().toISOString(),
          nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          errorMessage: undefined
        };
      }
      return ota;
    }));
  }, []);

  const updateOTACredentials = useCallback((otaId, credentials) => {
    setOTAs(prev => prev.map(ota => {
      if (ota.id === otaId) {
        return {
          ...ota,
          credentials: { ...ota.credentials, ...credentials }
        };
      }
      return ota;
    }));
  }, []);

  const updateOTASyncSettings = useCallback((otaId, settings) => {
    setOTAs(prev => prev.map(ota => {
      if (ota.id === otaId) {
        return {
          ...ota,
          syncSettings: { ...ota.syncSettings, ...settings }
        };
      }
      return ota;
    }));
  }, []);

  const testOTAConnection = useCallback(async (credentials) => {
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    const success = Math.random() > 0.2; // 80% success rate
    return {
      success,
      message: success ? 'Connection successful' : 'Authentication failed - check credentials'
    };
  }, []);

  // ============ ROOM MAPPING FUNCTIONS ============

  const mapRoom = useCallback((pmsRoomType, otaCode, otaMappingData) => {
    setRoomMappings(prev => {
      const existingIndex = prev.findIndex(m => m.pmsRoomType === pmsRoomType);

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existingMapping = updated[existingIndex];
        const otaIndex = existingMapping.otaMappings.findIndex(m => m.otaCode === otaCode);

        if (otaIndex >= 0) {
          existingMapping.otaMappings[otaIndex] = {
            ...existingMapping.otaMappings[otaIndex],
            ...otaMappingData,
            lastSync: new Date().toISOString()
          };
        } else {
          existingMapping.otaMappings.push({
            otaCode,
            ...otaMappingData,
            status: 'active',
            lastSync: new Date().toISOString()
          });
        }

        return updated;
      }

      return prev;
    });

    const ota = otas.find(o => o.code === otaCode);
    addSyncLog(otaCode, ota?.name || otaCode, 'availability_update', 'success', `Room mapping created: ${pmsRoomType} -> ${otaMappingData.otaRoomType}`);
  }, [otas]);

  const unmapRoom = useCallback((pmsRoomType, otaCode) => {
    setRoomMappings(prev => prev.map(mapping => {
      if (mapping.pmsRoomType === pmsRoomType) {
        return {
          ...mapping,
          otaMappings: mapping.otaMappings.filter(m => m.otaCode !== otaCode)
        };
      }
      return mapping;
    }));

    const ota = otas.find(o => o.code === otaCode);
    addSyncLog(otaCode, ota?.name || otaCode, 'availability_update', 'success', `Room mapping removed for ${pmsRoomType}`);
  }, [otas]);

  const validateMapping = useCallback((pmsRoomType, otaCode) => {
    const mapping = roomMappings.find(m => m.pmsRoomType === pmsRoomType);
    if (!mapping) return { valid: false, error: 'PMS room type not found' };

    const otaMapping = mapping.otaMappings.find(m => m.otaCode === otaCode);
    if (!otaMapping) return { valid: false, error: 'OTA mapping not found' };

    const ota = otas.find(o => o.code === otaCode);
    if (!ota || ota.status !== 'connected') {
      return { valid: false, error: 'OTA not connected' };
    }

    return { valid: true, mapping: otaMapping };
  }, [roomMappings, otas]);

  const autoSuggestMapping = useCallback((pmsRoomType, otaCode) => {
    const suggestions = {
      'Minimalist Studio': { BOOKING: 'Minimalist Studio Room', EXPEDIA: 'Studio Room', AGODA: 'Minimalist Studio' },
      'Coastal Retreat': { BOOKING: 'Coastal Retreat Room', EXPEDIA: 'Coastal Room', AGODA: 'Coastal Retreat' },
      'Urban Oasis': { BOOKING: 'Urban Oasis Room', EXPEDIA: 'Urban Room', AGODA: 'Urban Oasis' },
      'Sunset Vista': { BOOKING: 'Sunset Vista Room', EXPEDIA: 'Vista Room', AGODA: 'Sunset Vista' },
      'Pacific Suite': { BOOKING: 'Pacific Suite', EXPEDIA: 'Pacific Suite', AGODA: 'Pacific Suite' },
      'Wellness Suite': { BOOKING: 'Wellness Suite', EXPEDIA: 'Spa Suite', AGODA: 'Wellness Suite' },
      'Family Sanctuary': { BOOKING: 'Family Room', EXPEDIA: 'Family Suite', AGODA: 'Family Sanctuary' },
      'Oceanfront Penthouse': { BOOKING: 'Oceanfront Penthouse', EXPEDIA: 'Penthouse Suite', AGODA: 'Oceanfront Penthouse' }
    };

    return suggestions[pmsRoomType]?.[otaCode] || `${pmsRoomType} Room`;
  }, []);

  // ============ RATE FUNCTIONS ============

  const updateRateForOTA = useCallback((date, roomType, otaCode, newRate) => {
    setRateCalendar(prev => {
      if (!prev[date] || !prev[date][roomType]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [roomType]: {
            ...prev[date][roomType],
            otaRates: {
              ...prev[date][roomType].otaRates,
              [otaCode]: newRate
            }
          }
        }
      };
    });

    const ota = otas.find(o => o.code === otaCode);
    addSyncLog(otaCode, ota?.name || otaCode, 'rate_update', 'success', `Rate updated for ${roomType}: $${newRate}`);
  }, [otas]);

  const updateAvailabilityForOTA = useCallback((date, roomType, availability) => {
    setRateCalendar(prev => {
      if (!prev[date] || !prev[date][roomType]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [roomType]: {
            ...prev[date][roomType],
            availability
          }
        }
      };
    });
  }, []);

  const toggleStopSell = useCallback((date, roomType, stopSell) => {
    setRateCalendar(prev => {
      if (!prev[date] || !prev[date][roomType]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [roomType]: {
            ...prev[date][roomType],
            stopSell
          }
        }
      };
    });

    addSyncLog('ALL', 'All OTAs', 'restriction_update', 'success', `Stop sell ${stopSell ? 'activated' : 'deactivated'} for ${roomType} on ${date}`);
  }, []);

  const toggleCTA = useCallback((date, roomType, cta) => {
    setRateCalendar(prev => {
      if (!prev[date] || !prev[date][roomType]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [roomType]: {
            ...prev[date][roomType],
            cta
          }
        }
      };
    });
  }, []);

  const toggleCTD = useCallback((date, roomType, ctd) => {
    setRateCalendar(prev => {
      if (!prev[date] || !prev[date][roomType]) return prev;

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [roomType]: {
            ...prev[date][roomType],
            ctd
          }
        }
      };
    });
  }, []);

  const pushRatesToOTAs = useCallback(async (selectedOTAs, dateRange) => {
    setIsSyncing(true);

    for (const otaCode of selectedOTAs) {
      const ota = otas.find(o => o.code === otaCode);
      if (!ota || ota.status !== 'connected') continue;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        addSyncLog(otaCode, ota.name, 'rate_update', 'success', `Rates synced successfully for ${dateRange || '30 days'}`);

        setOTAs(prev => prev.map(o => {
          if (o.code === otaCode) {
            return {
              ...o,
              lastSync: new Date().toISOString(),
              nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            };
          }
          return o;
        }));
      } else {
        addSyncLog(otaCode, ota.name, 'rate_update', 'error', 'Rate sync failed - API timeout');
      }
    }

    setIsSyncing(false);
    setLastGlobalSync(new Date().toISOString());
  }, [otas]);

  const syncRatesToAllOTAs = useCallback(async () => {
    const connectedOTAs = otas.filter(o => o.status === 'connected').map(o => o.code);
    await pushRatesToOTAs(connectedOTAs);
  }, [otas, pushRatesToOTAs]);

  // ============ RESTRICTION FUNCTIONS ============

  const setRestriction = useCallback((restrictionData) => {
    const newRestriction = {
      id: `rest-${String(Date.now()).slice(-6)}`,
      ...restrictionData,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Channel Manager'
    };

    setRestrictions(prev => [...prev, newRestriction]);

    addSyncLog(
      restrictionData.otaCode,
      restrictionData.otaCode === 'ALL' ? 'All OTAs' : otas.find(o => o.code === restrictionData.otaCode)?.name || restrictionData.otaCode,
      'restriction_update',
      'success',
      `Restriction set for ${restrictionData.roomType}: ${Object.entries(restrictionData.restriction).filter(([_, v]) => v).map(([k]) => k).join(', ')}`
    );

    return newRestriction;
  }, [otas]);

  const removeRestriction = useCallback((restrictionId) => {
    const restriction = restrictions.find(r => r.id === restrictionId);
    setRestrictions(prev => prev.filter(r => r.id !== restrictionId));

    if (restriction) {
      addSyncLog(
        restriction.otaCode,
        restriction.otaCode === 'ALL' ? 'All OTAs' : otas.find(o => o.code === restriction.otaCode)?.name || restriction.otaCode,
        'restriction_update',
        'success',
        `Restriction removed for ${restriction.roomType}`
      );
    }
  }, [restrictions, otas]);

  const toggleRestrictionStatus = useCallback((restrictionId) => {
    setRestrictions(prev => prev.map(r => {
      if (r.id === restrictionId) {
        return { ...r, isActive: !r.isActive };
      }
      return r;
    }));
  }, []);

  // ============ PROMOTION FUNCTIONS ============

  const createChannelPromotion = useCallback((promotionData) => {
    // This would integrate with CBS promotions
    addSyncLog(
      promotionData.otaCode || 'ALL',
      promotionData.otaCode === 'ALL' ? 'All OTAs' : otas.find(o => o.code === promotionData.otaCode)?.name || 'All OTAs',
      'promotion_sync',
      'success',
      `Promotion "${promotionData.title}" synced successfully`
    );
  }, [otas]);

  const applyPromotionToOTA = useCallback(async (promotionId, otaCodes) => {
    for (const otaCode of otaCodes) {
      const ota = otas.find(o => o.code === otaCode);
      if (!ota || ota.status !== 'connected') continue;

      await new Promise(resolve => setTimeout(resolve, 300));

      addSyncLog(otaCode, ota.name, 'promotion_sync', 'success', `Promotion applied to ${ota.name}`);
    }
  }, [otas]);

  // ============ SYNC LOG FUNCTIONS ============

  const addSyncLog = useCallback((otaCode, otaName, action, status, message, details = {}) => {
    const now = Date.now();
    const dedupeWindow = 5000; // 5 seconds deduplication window

    setSyncLogs(prev => {
      // Check for duplicate within the deduplication window
      const isDuplicate = prev.some(log => {
        const logTime = new Date(log.timestamp).getTime();
        return (
          log.otaCode === otaCode &&
          log.action === action &&
          log.message === message &&
          now - logTime < dedupeWindow
        );
      });

      if (isDuplicate) {
        return prev; // Skip duplicate log
      }

      const newLog = {
        id: `log-${now}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date(now).toISOString(),
        otaCode,
        otaName,
        action,
        status,
        message,
        details
      };

      return [newLog, ...prev].slice(0, 100); // Keep last 100 logs
    });
  }, []);

  const filterLogs = useCallback((filters) => {
    let filtered = [...syncLogs];

    if (filters.otaCode && filters.otaCode !== 'ALL') {
      filtered = filtered.filter(log => log.otaCode === filters.otaCode);
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => log.timestamp >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => log.timestamp <= filters.dateTo);
    }

    return filtered;
  }, [syncLogs]);

  const clearLogs = useCallback(() => {
    setSyncLogs([]);
  }, []);

  // ============ AUTO-SYNC SCHEDULER ============

  const autoSyncScheduler = useCallback(() => {
    const connectedOTAs = otas.filter(o => o.status === 'connected' && o.syncSettings.autoSync);

    connectedOTAs.forEach(ota => {
      // Random actions for simulation
      const actions = ['rate_update', 'availability_update'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      // 85% success, 10% warning, 5% error
      const rand = Math.random();
      let status = 'success';
      let message = '';

      if (rand > 0.95) {
        status = 'error';
        message = `${ota.name} API timeout - retrying...`;
      } else if (rand > 0.85) {
        status = 'warning';
        message = `Partial sync completed for ${ota.name}`;
      } else {
        if (action === 'rate_update') {
          message = `Rates synced successfully to ${ota.name}`;
        } else {
          message = `Inventory updated for ${ota.name}`;
        }
      }

      addSyncLog(ota.code, ota.name, action, status, message);

      // Update OTA last sync time
      setOTAs(prev => prev.map(o => {
        if (o.id === ota.id) {
          return {
            ...o,
            lastSync: new Date().toISOString(),
            nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            status: status === 'error' ? 'error' : 'connected',
            errorMessage: status === 'error' ? message : undefined
          };
        }
        return o;
      }));
    });

    setLastGlobalSync(new Date().toISOString());
  }, [otas]);

  const simulateOTASync = useCallback(async (otaCode) => {
    const ota = otas.find(o => o.code === otaCode);
    if (!ota) return { success: false, error: 'OTA not found' };

    setOTAs(prev => prev.map(o => {
      if (o.code === otaCode) {
        return { ...o, status: 'syncing' };
      }
      return o;
    }));

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const success = Math.random() > 0.15; // 85% success rate

    setOTAs(prev => prev.map(o => {
      if (o.code === otaCode) {
        return {
          ...o,
          status: success ? 'connected' : 'error',
          lastSync: new Date().toISOString(),
          nextSync: success ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
          errorMessage: success ? undefined : 'Sync failed - please try again'
        };
      }
      return o;
    }));

    addSyncLog(
      otaCode,
      ota.name,
      'bulk_sync',
      success ? 'success' : 'error',
      success ? `Manual sync completed for ${ota.name}` : `Sync failed for ${ota.name}`
    );

    return { success };
  }, [otas]);

  const triggerManualSync = useCallback(async (otaCode = 'ALL') => {
    setIsSyncing(true);

    if (otaCode === 'ALL') {
      const connectedOTAs = otas.filter(o => o.status === 'connected');
      setSyncingOTAs(connectedOTAs.map(o => o.code));
      await syncRatesToAllOTAs();
      setSyncingOTAs([]);
    } else {
      setSyncingOTAs([otaCode]);
      await simulateOTASync(otaCode);
      setSyncingOTAs([]);
    }

    setIsSyncing(false);
  }, [otas, syncRatesToAllOTAs, simulateOTASync]);

  // ============ ANALYTICS ============

  const getChannelStats = useCallback(() => {
    const connectedCount = otas.filter(o => o.status === 'connected').length;
    const errorCount = otas.filter(o => o.status === 'error').length;
    const totalBookings = otas.reduce((sum, o) => sum + (o.stats?.totalBookings || 0), 0);
    const totalRevenue = otas.reduce((sum, o) => sum + (o.stats?.revenue || 0), 0);
    const mappedRoomTypes = roomMappings.filter(m => m.otaMappings.length > 0).length;
    const activeRestrictions = restrictions.filter(r => r.isActive).length;

    // Rate parity check
    const rateParityIssues = [];
    const today = new Date().toISOString().split('T')[0];
    if (rateCalendar[today]) {
      Object.entries(rateCalendar[today]).forEach(([roomType, data]) => {
        const rates = Object.values(data.otaRates || {});
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        if (maxRate - minRate > minRate * 0.1) { // More than 10% difference
          rateParityIssues.push({
            roomType,
            minRate,
            maxRate,
            difference: Math.round((maxRate - minRate) / minRate * 100)
          });
        }
      });
    }

    // Generate trend data based on OTA stats (last 7 data points)
    const generateTrendData = (baseValue, variance = 0.15) => {
      const trend = [];
      for (let i = 6; i >= 0; i--) {
        const randomFactor = 1 + (Math.random() - 0.5) * variance;
        const growthFactor = 1 + (6 - i) * 0.02; // Slight upward trend
        trend.push(Math.round(baseValue * randomFactor * growthFactor / 7));
      }
      return trend;
    };

    // Calculate per-OTA metrics for channel comparison
    const channelPerformance = otas
      .filter(o => o.status === 'connected')
      .map(ota => ({
        name: ota.name,
        code: ota.code,
        color: ota.color,
        bookings: ota.stats?.totalBookings || 0,
        revenue: ota.stats?.revenue || 0,
        rating: ota.stats?.avgRating || 0,
        commission: ota.stats?.commission || 15,
        conversionRate: Math.round(Math.random() * 20 + 10) / 10, // Simulated 1.0-3.0%
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate totals with fallbacks for demo data
    const displayRevenue = totalRevenue > 0 ? totalRevenue : 45230;
    const displayBookings = totalBookings > 0 ? totalBookings : 156;

    return {
      connectedOTAs: connectedCount,
      disconnectedOTAs: otas.length - connectedCount,
      errorOTAs: errorCount,
      totalBookings: displayBookings,
      totalRevenue: displayRevenue,
      mappedRoomTypes,
      totalRoomTypes: roomMappings.length,
      activeRestrictions,
      rateParityIssues,
      lastSync: lastGlobalSync,
      // Trend data for sparklines
      revenueTrend: generateTrendData(displayRevenue, 0.2),
      bookingsTrend: generateTrendData(displayBookings, 0.25),
      // Channel performance data
      channelPerformance,
      // Calculated metrics
      avgCommission: channelPerformance.length > 0
        ? Math.round(channelPerformance.reduce((sum, c) => sum + c.commission, 0) / channelPerformance.length * 10) / 10
        : 15,
      avgConversionRate: channelPerformance.length > 0
        ? Math.round(channelPerformance.reduce((sum, c) => sum + c.conversionRate, 0) / channelPerformance.length * 10) / 10
        : 2.1,
      revenueGrowth: '+12%',
      bookingsGrowth: '+8%',
    };
  }, [otas, roomMappings, restrictions, rateCalendar, lastGlobalSync]);

  const getAIInsights = useCallback(() => {
    const insights = [];
    const stats = getChannelStats();

    // Rate parity issues
    if (stats.rateParityIssues.length > 0) {
      stats.rateParityIssues.forEach(issue => {
        insights.push({
          type: 'warning',
          title: 'Rate Parity Alert',
          message: `${issue.roomType}: ${issue.difference}% rate difference across channels`,
          action: 'Review rates'
        });
      });
    }

    // Connection issues
    if (stats.errorOTAs > 0) {
      insights.push({
        type: 'error',
        title: 'Connection Issue',
        message: `${stats.errorOTAs} OTA connection(s) need attention`,
        action: 'Check connections'
      });
    }

    // Unmapped rooms
    if (stats.mappedRoomTypes < stats.totalRoomTypes) {
      insights.push({
        type: 'info',
        title: 'Unmapped Rooms',
        message: `${stats.totalRoomTypes - stats.mappedRoomTypes} room type(s) not fully mapped to all OTAs`,
        action: 'Complete mapping'
      });
    }

    // High demand suggestion
    const today = new Date().toISOString().split('T')[0];
    if (rateCalendar[today]) {
      const avgAvailability = Object.values(rateCalendar[today]).reduce((sum, d) => sum + d.availability, 0) / 4;
      if (avgAvailability < 3) {
        insights.push({
          type: 'success',
          title: 'High Demand',
          message: 'Low availability detected - consider increasing OTA rates by 10-15%',
          action: 'Adjust rates'
        });
      }
    }

    return insights;
  }, [getChannelStats, rateCalendar]);

  // ============ RESET ============

  const resetToSampleData = useCallback(() => {
    setOTAs(sampleOTAs);
    setRoomMappings(sampleRoomMappings);
    setRateOverrides(sampleRateOverrides);
    setRestrictions(sampleRestrictions);
    setSyncLogs(sampleSyncLogs);
    setRateCalendar(generateRateCalendar(baseRates, sampleRateOverrides));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    // State
    otas,
    roomMappings,
    rateOverrides,
    restrictions,
    syncLogs,
    rateCalendar,
    isSyncing,
    syncingOTAs,
    lastGlobalSync,

    // OTA functions
    connectOTA,
    disconnectOTA,
    reconnectOTA,
    updateOTACredentials,
    updateOTASyncSettings,
    testOTAConnection,

    // Room mapping functions
    mapRoom,
    unmapRoom,
    validateMapping,
    autoSuggestMapping,

    // Rate functions
    updateRateForOTA,
    updateAvailabilityForOTA,
    toggleStopSell,
    toggleCTA,
    toggleCTD,
    pushRatesToOTAs,
    syncRatesToAllOTAs,

    // Restriction functions
    setRestriction,
    removeRestriction,
    toggleRestrictionStatus,

    // Promotion functions
    createChannelPromotion,
    applyPromotionToOTA,

    // Sync log functions
    addSyncLog,
    filterLogs,
    clearLogs,

    // Sync functions
    autoSyncScheduler,
    simulateOTASync,
    triggerManualSync,

    // Analytics
    getChannelStats,
    getAIInsights,

    // Reset
    resetToSampleData
  };

  return (
    <ChannelManagerContext.Provider value={value}>
      {children}
    </ChannelManagerContext.Provider>
  );
}

export function useChannelManager() {
  const context = useContext(ChannelManagerContext);
  if (!context) {
    throw new Error('useChannelManager must be used within a ChannelManagerProvider');
  }
  return context;
}

export default ChannelManagerContext;
