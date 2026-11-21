import { apiClient } from './client';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'admin' | 'distributor' | 'operator';
  phone?: string;
  organization?: string;
  status?: string;
}

export interface ProductVariant {
  sku: string;
  size: string;
  mrp: number;
  distributorPrice: number;
  gstRate: number;
  isGstInclusive: boolean;
}

export interface Product {
  id: string | number;
  name: string;
  category: string;
  capacity?: string;
  mrp: number;
  distributorPrice: number;
  gstRate: number;
  isGstInclusive: boolean;
  packVariants?: ProductVariant[];
  description?: string;
  isActive?: boolean;
}

export interface DistributorOrder {
  id: string | number;
  order_number: string;
  distributor_name: string;
  distributor_company: string;
  distributor_phone: string;
  total_amount: number;
  status: 'PENDING' | 'PLACED' | 'ADMIN_APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  created_at: string;
  items?: Array<{
    product_name: string;
    pack_size: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export interface InvoiceItem {
  sku: string;
  product_name: string;
  qty: number;
  unit_price: number;
  gst_rate: number;
  line_total: number;
}

export interface Invoice {
  id: string | number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  vehicle_number?: string;
  total_amount: number;
  gst_amount: number;
  payment_method: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InventoryItem {
  id: string | number;
  product_id: string | number;
  product_name: string;
  sku: string;
  stock_litres?: number;
  stock_units?: number;
  location_name?: string;
}

// ----------------------------------------------------
// 1. AUTH API
// ----------------------------------------------------
export const AuthAPI = {
  login: async (email: string, password: string, role?: string) => {
    const res = await apiClient.post('/auth/login', { email, password, role });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },
};

// ----------------------------------------------------
// 2. PRODUCTS API
// ----------------------------------------------------
export const ProductAPI = {
  getAll: async (): Promise<Product[]> => {
    const res = await apiClient.get('/products');
    const raw = res.data?.data || res.data || [];
    return raw.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category || p.category_name || 'DEF',
      capacity: p.capacity || '',
      mrp: parseFloat(p.mrp) || 0,
      distributorPrice: parseFloat(p.distributor_price) || 0,
      gstRate: parseFloat(p.gst_rate) || 18,
      isGstInclusive: p.is_gst_inclusive !== undefined ? Boolean(p.is_gst_inclusive) : true,
      description: p.description || p.best_for || '',
      isActive: p.is_active !== undefined ? Boolean(p.is_active) : true,
      packVariants: (p.pack_variants || []).map((v: any) => ({
        sku: v.sku,
        size: v.pack_size || p.capacity || 'Standard',
        mrp: parseFloat(v.standard_mrp) || 0,
        distributorPrice: parseFloat(v.distributor_base_price) || 0,
        gstRate: parseFloat(p.gst_rate) || 18,
        isGstInclusive: p.is_gst_inclusive !== undefined ? Boolean(p.is_gst_inclusive) : true,
      })),
    }));
  },
};

// ----------------------------------------------------
// 3. DISTRIBUTOR API
// ----------------------------------------------------
export const DistributorAPI = {
  getOrders: async () => {
    const res = await apiClient.get('/distributor-orders');
    return res.data?.data || res.data || [];
  },
  createOrder: async (orderData: {
    distributor_id?: string | number;
    distributor_name: string;
    distributor_company: string;
    distributor_phone: string;
    distributor_email?: string;
    distributor_gstin?: string;
    delivery_city?: string;
    delivery_state?: string;
    order_notes?: string;
    items: Array<{
      product_id: string | number;
      sku: string;
      product_name: string;
      pack_size: string;
      quantity: number;
      unit_price: number;
    }>;
  }) => {
    const res = await apiClient.post('/distributor-orders', orderData);
    return res.data;
  },
  getCreditLedger: async (distributorId: string | number) => {
    const res = await apiClient.get(`/distributors/${distributorId}/credit-ledger`);
    return res.data;
  },
  verifyGst: async (gstin: string) => {
    const res = await apiClient.get(`/gst/verify/${gstin}`);
    return res.data;
  },
};

// ----------------------------------------------------
// 4. SALES OPERATOR API
// ----------------------------------------------------
export const OperatorAPI = {
  createInvoice: async (invoiceData: {
    customer_name: string;
    customer_phone: string;
    vehicle_number?: string;
    location_id: string;
    operator_name?: string;
    payment_method?: 'CASH' | 'UPI' | 'CREDIT' | 'CARD';
    items: Array<{
      sku: string;
      product_name?: string;
      qty: number;
      unit_price?: number;
    }>;
  }) => {
    const res = await apiClient.post('/invoices/create', invoiceData);
    return res.data;
  },
  getInvoices: async () => {
    const res = await apiClient.get('/invoices');
    return res.data?.data || res.data || [];
  },
  getLocations: async () => {
    const res = await apiClient.get('/inventory/locations');
    return res.data?.data || res.data || [];
  },
  getInventory: async () => {
    const res = await apiClient.get('/inventory');
    return res.data?.data || res.data || [];
  },
};
