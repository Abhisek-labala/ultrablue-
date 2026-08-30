// ULTRABLUE+ REAL LARAVEL REST API CLIENT
// Direct HTTP communication with Laravel 12 Backend (http://127.0.0.1:8000/api)

export const API_BASE_URL = 'http://127.0.0.1:8000/api';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// ----------------------------------------------------
// 1. PRODUCTS API (Full Dynamic Database CRUD)
// ----------------------------------------------------
export const ProductAPI = {
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, { headers });
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) return [];
      return json.data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category_name || p.category || 'Diesel Exhaust Fluid',
        subCategory: p.viscosity_grade || p.category_name || 'Industrial Fluid',
        description: p.description || '',
        imageUrl: p.image_url || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
        badge: p.badge || 'ISO 22241 Certified',
        offerTag: p.offer_tag || null,
        offerDiscount: p.offer_discount || null,
        isiMarked: Boolean(p.is_isi_marked),
        bisCompliant: Boolean(p.is_bis_compliant),
        isiNumber: p.isi_number || 'IS 17042:2018',
        bisLicence: p.bis_licence || 'CM/L-84001923',
        isoStandard: p.iso_standard || 'ISO 22241-1',
        ureaContent: p.urea_content || '32.5% ± 0.7%',
        density: p.density || '1.090 g/cm³',
        metals: p.metals || '< 0.05 ppm',
        insolubles: p.insolubles || '≤ 5 mg/kg',
        viscosityGrade: p.viscosity_grade || 'AUS 32',
        flashPoint: p.flash_point || 'N/A',
        oemApprovals: p.oem_approvals || 'Tata Motors, Ashok Leyland, BharatBenz, JCB, Cummins, Volvo',
        hsnCode: p.hsn_code || '31021000',
        gstRate: parseFloat(p.gst_rate) || 18,
        isGstInclusive: p.is_gst_inclusive !== undefined ? Boolean(p.is_gst_inclusive) : true,
        features: Array.isArray(p.features) ? p.features : (p.features_json ? JSON.parse(p.features_json) : []),
        packOptions: (p.pack_variants && p.pack_variants.length > 0) ? p.pack_variants.map(v => ({
          sku: v.sku,
          size: v.pack_size,
          mrp: parseFloat(v.standard_mrp),
          distributorPrice: parseFloat(v.distributor_base_price),
          gstRate: parseFloat(p.gst_rate) || 18,
          isGstInclusive: p.is_gst_inclusive !== undefined ? Boolean(p.is_gst_inclusive) : true,
          isPopular: Boolean(v.is_popular)
        })) : []
      }));
    } catch {
      return [];
    }
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { headers });
    const json = await res.json();
    return json.data;
  },

  getCategories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  createCategory: async (categoryData) => {
    const res = await fetch(`${API_BASE_URL}/products/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(categoryData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error creating category.');
    }
    return json;
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/categories/${id}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error deleting category.');
    }
    return json;
  },

  create: async (productData) => {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error creating product.');
    }
    return json;
  },

  update: async (id, productData) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(productData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error updating product.');
    }
    return json;
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error deleting product.');
    }
    return json;
  }
};

// ----------------------------------------------------
// 1.1 PROMOTIONS & PUSH NOTIFICATIONS API
// ----------------------------------------------------
export const PromotionAPI = {
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/promotions`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  create: async (promoData) => {
    const res = await fetch(`${API_BASE_URL}/promotions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(promoData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error broadcasting promotion.');
    }
    return json;
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
      method: 'DELETE',
      headers
    });
    return await res.json();
  }
};

// ----------------------------------------------------
// 2. INVENTORY & LOCATIONS API
// ----------------------------------------------------
export const InventoryAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/inventory`, { headers });
    const json = await res.json();
    return (json.data || []).map(b => ({
      id: b.id,
      locationId: b.location_id,
      locationName: b.location_name,
      productName: b.product_name,
      sku: b.sku,
      packSize: b.pack_size,
      availableStock: b.available_stock,
      reservedStock: b.reserved_stock,
      minThreshold: b.min_threshold,
      batchNo: b.batch_number,
      mfgDate: b.mfg_date,
      expDate: b.expiry_date,
      status: b.available_stock > b.min_threshold ? 'HEALTHY' : b.available_stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK'
    }));
  },

  getLocations: async () => {
    const res = await fetch(`${API_BASE_URL}/inventory/locations`, { headers });
    const json = await res.json();
    return json.data || [];
  },

  refillStock: async ({ locationId, sku, qty, batchNo }) => {
    const res = await fetch(`${API_BASE_URL}/inventory/refill`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        location_id: locationId,
        sku,
        quantity: parseInt(qty, 10),
        batch_number: batchNo
      })
    });
    return await res.json();
  }
};

// ----------------------------------------------------
// 3. SALES POS INVOICES API (Strict Anti-Overbill)
// ----------------------------------------------------
export const SalesAPI = {
  getAllInvoices: async () => {
    const res = await fetch(`${API_BASE_URL}/invoices`, { headers });
    const json = await res.json();
    return (json.data || []).map(inv => ({
      id: inv.invoice_number || inv.id,
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      vehicleNo: inv.vehicle_number || 'Counter Sale',
      location: inv.location_name || 'Bhadrak Depot',
      operatorName: inv.operator_name,
      date: new Date(inv.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      subtotal: parseFloat(inv.subtotal),
      discount: parseFloat(inv.discount_amount || 0),
      taxable: parseFloat(inv.taxable_amount),
      cgst: parseFloat(inv.cgst_amount),
      sgst: parseFloat(inv.sgst_amount),
      grandTotal: parseFloat(inv.grand_total),
      paymentMethod: inv.payment_method,
      paymentStatus: inv.payment_status,
      smsSent: Boolean(inv.is_sms_sent),
      items: Array.isArray(inv.items) ? inv.items.map(it => ({
        name: `${it.product_name || 'Product'} (${it.pack_size || ''})`,
        sku: it.sku,
        qty: it.quantity,
        unitPrice: parseFloat(it.unit_price),
        amount: parseFloat(it.line_total)
      })) : []
    }));
  },

  createInvoice: async ({
    customerName,
    customerPhone,
    vehicleNo,
    locationId,
    operatorName,
    items,
    paymentMethod = 'UPI'
  }) => {
    const res = await fetch(`${API_BASE_URL}/invoices/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer_name: customerName,
        customer_phone: customerPhone,
        vehicle_number: vehicleNo,
        location_id: locationId,
        operator_name: operatorName,
        items: items.map(i => ({
          sku: i.sku,
          qty: parseInt(i.qty, 10),
          unit_price: parseFloat(i.unitPrice)
        })),
        payment_method: paymentMethod
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Invoice creation failed on backend.');
    }
    return json;
  }
};

// ----------------------------------------------------
// 4. DISTRIBUTORS API
// ----------------------------------------------------
export const DistributorAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/distributors`, { headers });
    const json = await res.json();
    return (json.data || []).map(d => ({
      id: d.id,
      name: d.company_name,
      contactPerson: d.contact_person,
      phone: d.phone,
      email: d.email,
      gstin: d.gstin,
      city: d.territory_city,
      state: d.territory_state,
      tier: d.discount_tier || 'Gold Tier (15% Disc)',
      creditLimit: `₹ ${parseFloat(d.credit_limit || 0).toLocaleString('en-IN')}`,
      rawCreditLimit: parseFloat(d.credit_limit || 0),
      accountStatus: d.account_status,
      totalOrders: 0,
      totalPurchases: '₹ 0',
      joinedDate: new Date(d.created_at).toISOString().split('T')[0]
    }));
  },

  createDirect: async (distData) => {
    const res = await fetch(`${API_BASE_URL}/distributors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        company_name: distData.companyName,
        contact_person: distData.contactPerson,
        phone: distData.phone,
        email: distData.email,
        gstin: distData.gstin,
        territory_city: distData.city,
        territory_state: distData.state || 'Odisha',
        discount_tier: distData.tier || 'Gold Tier (15% Disc)',
        credit_limit: parseFloat(distData.creditLimit || 500000),
        password: distData.password || 'distributor123'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error creating distributor account.');
    }
    return json;
  },

  register: async (distData) => {
    const res = await fetch(`${API_BASE_URL}/distributors/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        company_name: distData.companyName,
        contact_person: distData.contactPerson,
        phone: distData.phone,
        email: distData.email,
        gstin: distData.gstin,
        territory_city: distData.city,
        territory_state: distData.state || 'Odisha'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Registration failed.');
    }
    return json;
  },

  updateStatus: async (id, status, tier = 'Gold Tier (15% Disc)', creditLimit = 500000) => {
    const res = await fetch(`${API_BASE_URL}/distributors/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        account_status: status,
        discount_tier: tier,
        credit_limit: creditLimit
      })
    });
    return await res.json();
  }
};

// ----------------------------------------------------
// 5. SALES OPERATORS API (Create & Manage Operators)
// ----------------------------------------------------
export const OperatorAPI = {
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/operators`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  create: async (opData) => {
    const res = await fetch(`${API_BASE_URL}/operators`, {
      method: 'POST',
      headers,
      body: JSON.stringify(opData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to create operator account.');
    }
    return json;
  },

  updateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/operators/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update operator status.');
    }
    return json;
  },

  updateLocation: async (id, assignedDepot) => {
    const res = await fetch(`${API_BASE_URL}/operators/${id}/location`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ assignedDepot })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update operator location.');
    }
    return json;
  },

  resetPin: async (id, newPin) => {
    const res = await fetch(`${API_BASE_URL}/operators/${id}/reset-pin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ newPin })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to reset operator PIN.');
    }
    return json;
  }
};

// ----------------------------------------------------
// 6. AGGREGATED REPORTS & ANALYTICS API
// ----------------------------------------------------
export const ReportAPI = {
  getSummary: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/summary`, { headers });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }
};

// ----------------------------------------------------
// 7. ENQUIRIES API
// ----------------------------------------------------
export const InquiryAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/enquiries`, { headers });
    const json = await res.json();
    return (json.data || []).map(q => ({
      id: q.inquiry_code || q.id,
      name: q.name,
      company: q.company_name,
      phone: q.phone,
      email: q.email,
      location: q.location,
      packagingNeeded: q.product_requested,
      estimatedQuantity: q.estimated_quantity,
      message: q.message,
      status: q.status,
      date: new Date(q.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    }));
  },

  create: async (inqData) => {
    const res = await fetch(`${API_BASE_URL}/enquiries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: inqData.name,
        company_name: inqData.company,
        phone: inqData.phone,
        email: inqData.email || null,
        location: inqData.location,
        product_requested: inqData.packagingNeeded || inqData.product || 'UltraBlue+ DEF',
        estimated_quantity: inqData.quantity || '500 Litres',
        message: inqData.message || null
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Enquiry submission failed.');
    }
    return json;
  }
};

// ----------------------------------------------------
// 8. CSV EXPORT UTILITY
// ----------------------------------------------------
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ----------------------------------------------------
// 9. JWT AUTHENTICATION API
// ----------------------------------------------------
export const AuthAPI = {
  login: async ({ email, password, role }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, role })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Authentication failed');
    }
    return json;
  },

  register: async (regData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(regData)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Registration failed');
    }
    return json;
  },

  verifyToken: async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          ...headers,
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      return json.status === 'success' ? json.user : null;
    } catch {
      return null;
    }
  }
};

// ----------------------------------------------------
// 10. COMPLIANCE & MASTER REGISTRIES API
// ----------------------------------------------------
export const ComplianceAPI = {
  // Parameters
  getParameters: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/parameters`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  createParameter: async (paramData) => {
    const res = await fetch(`${API_BASE_URL}/compliance/parameters`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paramData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create parameter');
    return json;
  },

  deleteParameter: async (id) => {
    const res = await fetch(`${API_BASE_URL}/compliance/parameters/${id}`, {
      method: 'DELETE',
      headers
    });
    return await res.json();
  },

  // OEM Approvals
  getOemApprovals: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/oem-approvals`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  createOemApproval: async (oemData) => {
    const res = await fetch(`${API_BASE_URL}/compliance/oem-approvals`, {
      method: 'POST',
      headers,
      body: JSON.stringify(oemData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create OEM approval');
    return json;
  },

  deleteOemApproval: async (id) => {
    const res = await fetch(`${API_BASE_URL}/compliance/oem-approvals/${id}`, {
      method: 'DELETE',
      headers
    });
    return await res.json();
  },

  // Master Pack Sizes
  getPackSizes: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/pack-sizes`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  createPackSize: async (packData) => {
    const res = await fetch(`${API_BASE_URL}/compliance/pack-sizes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(packData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create pack configuration');
    return json;
  },

  deletePackSize: async (id) => {
    const res = await fetch(`${API_BASE_URL}/compliance/pack-sizes/${id}`, {
      method: 'DELETE',
      headers
    });
    return await res.json();
  },

  // Batch Certificates
  getBatchCertificates: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/compliance/batch-certificates`, { headers });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  createBatchCertificate: async (certData) => {
    const res = await fetch(`${API_BASE_URL}/compliance/batch-certificates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(certData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to issue batch certificate');
    return json;
  },

  deleteBatchCertificate: async (id) => {
    const res = await fetch(`${API_BASE_URL}/compliance/batch-certificates/${id}`, {
      method: 'DELETE',
      headers
    });
    return await res.json();
  }
};

