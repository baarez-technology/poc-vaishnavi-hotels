import { apiClient } from '../client';
import type { ApiResponse } from '../types/common.types';

export interface OccupancyReport {
  start_date: string;
  end_date: string;
  total_rooms: number;
  occupied_room_nights: number;
  total_room_nights: number;
  occupancy_rate: number;
}

export interface RevenueReport {
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_charges: number;
  revenue_by_method: Record<string, number>;
  transaction_count: number;
}

export interface ArrivalsDeparturesReport {
  date: string;
  arrivals: Array<{
    confirmation_code: string;
    guest_name: string;
    arrival_date: string;
    room_id?: number;
  }>;
  departures: Array<{
    confirmation_code: string;
    guest_name: string;
    departure_date: string;
    room_id?: number;
  }>;
  arrivals_count: number;
  departures_count: number;
}

export interface GuestLedgerReport {
  folio_number: string;
  reservation_id: number;
  total_charges: number;
  total_payments: number;
  balance: number;
  line_items: Array<{
    date: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export interface DailyFlashReport {
  date: string;
  occupancy_rate: number;
  revenue: number;
  arrivals: number;
  departures: number;
  in_house: number;
  no_shows: number;
  walk_ins: number;
}

export const reportsService = {
  getOccupancyReport: async (
    startDate: string,
    endDate: string,
    exportFormat?: 'csv' | 'json'
  ) => {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (exportFormat) params.export_format = exportFormat;
    
    const response = await apiClient.get<ApiResponse<OccupancyReport>>(
      '/api/v1/reports/occupancy',
      { params, responseType: exportFormat === 'csv' ? 'blob' : 'json' }
    );
    
    if (exportFormat === 'csv') {
      // Handle CSV download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `occupancy_report_${startDate}_${endDate}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      return null;
    }
    
    return response.data.data || response.data;
  },

  getRevenueReport: async (
    startDate: string,
    endDate: string,
    exportFormat?: 'csv' | 'json'
  ) => {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (exportFormat) params.export_format = exportFormat;
    
    const response = await apiClient.get<ApiResponse<RevenueReport>>(
      '/api/v1/reports/revenue',
      { params, responseType: exportFormat === 'csv' ? 'blob' : 'json' }
    );
    
    if (exportFormat === 'csv') {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue_report_${startDate}_${endDate}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      return null;
    }
    
    return response.data.data || response.data;
  },

  getArrivalsDeparturesReport: async (
    targetDate?: string,
    exportFormat?: 'csv' | 'json'
  ) => {
    const params: Record<string, string> = {};
    if (targetDate) params.target_date = targetDate;
    if (exportFormat) params.export_format = exportFormat;
    
    const response = await apiClient.get<ApiResponse<ArrivalsDeparturesReport>>(
      '/api/v1/reports/arrivals-departures',
      { params, responseType: exportFormat === 'csv' ? 'blob' : 'json' }
    );
    
    if (exportFormat === 'csv') {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arrivals_departures_${targetDate || 'today'}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      return null;
    }
    
    return response.data.data || response.data;
  },

  getGuestLedgerReport: async (
    reservationId?: number,
    guestId?: number,
    exportFormat?: 'csv' | 'json'
  ) => {
    const params: Record<string, string> = {};
    if (reservationId) params.reservation_id = String(reservationId);
    if (guestId) params.guest_id = String(guestId);
    if (exportFormat) params.export_format = exportFormat;
    
    const response = await apiClient.get<ApiResponse<GuestLedgerReport>>(
      '/api/v1/reports/guest-ledger',
      { params, responseType: exportFormat === 'csv' ? 'blob' : 'json' }
    );
    
    if (exportFormat === 'csv') {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `guest_ledger_${reservationId || guestId}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      return null;
    }
    
    return response.data.data || response.data;
  },

  getDailyFlashReport: async (targetDate?: string) => {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await apiClient.get<ApiResponse<DailyFlashReport>>(
      '/api/v1/reports/daily-flash',
      { params }
    );
    return response.data.data || response.data;
  },
};

