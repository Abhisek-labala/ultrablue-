-- ============================================================================
-- ULTRABLUE+ ENTERPRISE PLATFORM — POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Client: Ayush Green Energy (Bhadrak, Odisha)
-- Service Provider: N&L Tech Solutions (Agreement Ref: NLT-QT-2026-0031)
-- Stack: Laravel REST API + PostgreSQL 16 + React.js + React Native
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & ROLES
CREATE TYPE user_role_enum AS ENUM ('admin', 'sales_operator', 'distributor', 'customer');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'customer',
    assigned_location_id UUID NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);

-- 2. INVENTORY DEPOTS & LOCATIONS
CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL, -- e.g. BHD-01, CCU-02, BBI-03
    name VARCHAR(150) NOT NULL,
    location_type VARCHAR(50) NOT NULL DEFAULT 'depot', -- 'mother_plant', 'regional_hub', 'outlet'
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    manager_name VARCHAR(100),
    contact_phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS & PACKAGING CONFIGURATIONS
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- 'Diesel Exhaust Fluid', 'Hydraulic Oils', 'Engine Lubricants'
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    hsn_code VARCHAR(20) NOT NULL DEFAULT '31021000',
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    iso_standard VARCHAR(100) DEFAULT 'ISO 22241-1',
    is_isi_marked BOOLEAN DEFAULT true,
    is_bis_compliant BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_pack_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(60) UNIQUE NOT NULL, -- e.g. UB-DEF-20L, UB-DEF-210L
    pack_size VARCHAR(60) NOT NULL, -- e.g. '20L Bucket', '210L Drum', '1000L IBC'
    volume_in_litres NUMERIC(10,2) NOT NULL,
    standard_mrp NUMERIC(12,2) NOT NULL,
    distributor_base_price NUMERIC(12,2) NOT NULL,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pack_variants_sku ON product_pack_variants(sku);

-- 4. BATCHES & LOCATION-WISE STOCK (STRICT STOCK INTEGRITY)
CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    variant_id UUID NOT NULL REFERENCES product_pack_variants(id) ON DELETE RESTRICT,
    batch_number VARCHAR(60) NOT NULL,
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    available_stock INTEGER NOT NULL CHECK (available_stock >= 0),
    reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    min_threshold INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_location_variant_batch UNIQUE (location_id, variant_id, batch_number)
);

CREATE INDEX idx_batches_stock ON inventory_batches(location_id, variant_id, available_stock);

-- 5. DISTRIBUTOR PROFILES & KYC APPROVAL WORKFLOW
CREATE TYPE distributor_status_enum AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

CREATE TABLE distributor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    trade_license_no VARCHAR(100),
    gstin VARCHAR(20) UNIQUE NOT NULL,
    territory_city VARCHAR(100) NOT NULL,
    territory_state VARCHAR(100) NOT NULL,
    discount_tier VARCHAR(50) DEFAULT 'Gold Tier (15% Disc)',
    credit_limit NUMERIC(14,2) DEFAULT 500000.00,
    account_status distributor_status_enum DEFAULT 'PENDING_REVIEW',
    kyc_document_path VARCHAR(255),
    approved_by UUID NULL REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_distributors_status ON distributor_profiles(account_status);

-- 6. POS SALES INVOICES & ATOMIC LINE ITEMS
CREATE TYPE payment_status_enum AS ENUM ('PAID', 'PENDING', 'CANCELLED', 'REFUNDED');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(60) UNIQUE NOT NULL, -- e.g. INV-2026-0891
    location_id UUID NOT NULL REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    vehicle_number VARCHAR(40),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(14,2) DEFAULT 0.00,
    taxable_amount NUMERIC(14,2) NOT NULL CHECK (taxable_amount >= 0),
    cgst_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14,2) NOT NULL CHECK (grand_total >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI',
    payment_status payment_status_enum DEFAULT 'PAID',
    is_sms_sent BOOLEAN DEFAULT true,
    pdf_file_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_location ON invoices(location_id, created_at);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE RESTRICT,
    variant_id UUID NOT NULL REFERENCES product_pack_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CUSTOMER BULK ENQUIRIES
CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    location VARCHAR(150) NOT NULL,
    product_requested VARCHAR(150) NOT NULL,
    estimated_quantity VARCHAR(100) NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW_INQUIRY',
    handled_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enquiries_status ON enquiries(status);

-- 8. AUDIT LOGS & NOTIFICATIONS
CREATE TABLE system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_role user_role_enum NULL,
    is_read BOOLEAN DEFAULT false,
    action_route VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
