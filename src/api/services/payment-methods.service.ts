import { apiClient } from '../client';
import { API_ENDPOINTS } from '@/config/constants';
import type { ApiResponse } from '../types/common.types';

export interface PaymentMethod {
  id: number;
  user_id: number;
  card_type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodCreate {
  card_type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name?: string;
  is_default?: boolean;
  card_token?: string;
}

export interface PaymentMethodUpdate {
  is_default?: boolean;
  is_active?: boolean;
  cardholder_name?: string;
}

export const paymentMethodsService = {
  list: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<ApiResponse<PaymentMethod[]>>(
      API_ENDPOINTS.PAYMENT_METHODS.LIST
    );
    return response.data.data || response.data;
  },

  create: async (data: PaymentMethodCreate): Promise<PaymentMethod> => {
    const response = await apiClient.post<ApiResponse<PaymentMethod>>(
      API_ENDPOINTS.PAYMENT_METHODS.CREATE,
      data
    );
    return response.data.data || response.data;
  },

  update: async (id: number, data: PaymentMethodUpdate): Promise<PaymentMethod> => {
    const response = await apiClient.patch<ApiResponse<PaymentMethod>>(
      API_ENDPOINTS.PAYMENT_METHODS.UPDATE(id.toString()),
      data
    );
    return response.data.data || response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PAYMENT_METHODS.DELETE(id.toString()));
  },
};

