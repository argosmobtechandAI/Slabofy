-- ==============================================================================
-- SLABOFY — COMPLETE PRODUCTION DATABASE SCHEMA & MIGRATION SCRIPT
-- Database Engine: PostgreSQL 14+
-- Generated for: Slabofy Marketplace Platform
-- Includes: 12 ENUM Types, 15 Relational Tables, Indexes, Constraints & Seed Data
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUMS (Custom Data Types)
-- ------------------------------------------------------------------------------
DO $$ 
BEGIN
    -- User Roles
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
    END IF;

    -- Product Approval Lifecycle Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('pending', 'active', 'rejected');
    END IF;

    -- Group Buying Deal Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_status') THEN
        CREATE TYPE group_status AS ENUM ('active', 'complete', 'expired', 'cancelled');
    END IF;

    -- Customer Order Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
            'refunded',
            'return_requested'
        );
    END IF;

    -- Return Request Lifecycle Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_status') THEN
        CREATE TYPE return_status AS ENUM (
            'requested',
            'seller_approved',
            'seller_rejected',
            'admin_approved',
            'admin_rejected',
            'pickup_done',
            'refunded',
            'closed'
        );
    END IF;

    -- Return Reasons
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_reason') THEN
        CREATE TYPE return_reason AS ENUM (
            'defective_item',
            'wrong_item_delivered',
            'item_not_as_described',
            'size_fit_issue',
            'changed_mind',
            'damaged_in_transit',
            'missing_parts',
            'other'
        );
    END IF;

    -- Razorpay Escrow Pre-Auth Hold Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preauth_status') THEN
        CREATE TYPE preauth_status AS ENUM ('authorized', 'captured', 'voided');
    END IF;

    -- Multi-Channel Notification Types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('whatsapp', 'push', 'email');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('sent', 'failed');
    END IF;

    -- Shiprocket Courier Shipment Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
        CREATE TYPE shipment_status AS ENUM (
            'pending',
            'created',
            'courier_pending',
            'pickup_scheduled',
            'in_transit',
            'delivered',
            'cancelled',
            'rto'
        );
    END IF;

    -- Merchant Support Ticket Helpdesk
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_category') THEN
        CREATE TYPE ticket_category AS ENUM (
            'payments_payouts',
            'order_issue',
            'product_listing',
            'account_kyc',
            'technical_bug',
            'shiprocket_delivery',
            'other'
        );
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL, -- E.164 standard format (+91XXXXXXXXXX)
    password_hash VARCHAR(255),
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    fcm_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    commission_pct DECIMAL(5,2) DEFAULT 5.00, -- Commission percentage deducted from seller payouts
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ------------------------------------------------------------------------------
-- 4. PRODUCTS TABLE (Includes Admin-Only Delivery Charges)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id INT REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    sku VARCHAR(100) UNIQUE,
    stock INT NOT NULL DEFAULT 0,
    max_group_size INT NOT NULL DEFAULT 10,
    group_window_hours INT NOT NULL DEFAULT 24,
    weight_kg DECIMAL(5,2) DEFAULT 0.50,
    length_cm DECIMAL(6,2) DEFAULT 10.00,
    breadth_cm DECIMAL(6,2) DEFAULT 10.00,
    height_cm DECIMAL(6,2) DEFAULT 5.00,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00, -- Admin controlled delivery charge (Hidden from Seller)
    status product_status DEFAULT 'pending',
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);


-- ------------------------------------------------------------------------------
-- 5. PRODUCT VARIANTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    color VARCHAR(100),
    size VARCHAR(50),
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    UNIQUE(product_id, color, size)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);


-- ------------------------------------------------------------------------------
-- 6. PRODUCT TIERS TABLE (Tiered discounts for group sizes: 1, 2, 3, 5, 10)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_tiers (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    group_size INT NOT NULL, -- 1 (solo), 2, 3, 5, 10
    price DECIMAL(10,2) NOT NULL,
    UNIQUE(product_id, group_size)
);

CREATE INDEX IF NOT EXISTS idx_product_tiers_product ON product_tiers(product_id);


-- ------------------------------------------------------------------------------
-- 7. GROUPS TABLE (Co-Buying Deal Rooms)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    creator_id INT REFERENCES users(id) ON DELETE CASCADE,
    target_size INT NOT NULL, -- 2, 3, 5, 10
    current_size INT DEFAULT 1,
    status group_status DEFAULT 'active',
    timer_end TIMESTAMPTZ NOT NULL,
    extension_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_status_timer ON groups(status, timer_end);
CREATE INDEX IF NOT EXISTS idx_groups_product ON groups(product_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);


-- ------------------------------------------------------------------------------
-- 8. GROUP MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);


-- ------------------------------------------------------------------------------
-- 9. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    buyer_id INT REFERENCES users(id) ON DELETE CASCADE,
    seller_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    commission_pct DECIMAL(5,2) NOT NULL, -- Commission snapshotted at capture
    coupon_code VARCHAR(50),
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    color VARCHAR(100),
    size VARCHAR(50),
    status order_status DEFAULT 'pending',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    is_cod BOOLEAN DEFAULT false,
    shipping_address TEXT,
    delivery_pincode VARCHAR(10),
    courier_name VARCHAR(255),
    tracking_number VARCHAR(255),
    shiprocket_order_id VARCHAR(100),
    shiprocket_shipment_id VARCHAR(100),
    awb_code VARCHAR(100),
    courier_id INT,
    courier_name_sr VARCHAR(255),
    estimated_delivery DATE,
    shipping_charges DECIMAL(8,2) DEFAULT 0.00, -- Delivery fee charged to customer
    shipment_status shipment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_group ON orders(group_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay ON orders(razorpay_order_id);


-- ------------------------------------------------------------------------------
-- 10. PAYMENT PRE-AUTHORIZATION TABLE (Escrow Hold Records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_preauth (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    status preauth_status DEFAULT 'authorized',
    authorized_at TIMESTAMPTZ DEFAULT NOW(),
    captured_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_preauth_order ON payment_preauth(order_id);
CREATE INDEX IF NOT EXISTS idx_preauth_status ON payment_preauth(status);


-- ------------------------------------------------------------------------------
-- 11. SELLER PROFILES TABLE (KYC & Shiprocket Pickup Location)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    business_address TEXT,
    pickup_name VARCHAR(255),
    pickup_phone VARCHAR(20),
    pickup_address TEXT,
    pickup_city VARCHAR(100),
    pickup_state VARCHAR(100),
    pickup_pincode VARCHAR(10),
    pickup_country VARCHAR(50) DEFAULT 'India',
    shiprocket_pickup_id VARCHAR(100),
    gstin VARCHAR(20),
    pan_number VARCHAR(10),
    aadhar_number VARCHAR(12),
    kyc_document_url VARCHAR(255),
    bank_account VARCHAR(30),
    ifsc VARCHAR(11),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_approved ON seller_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user ON seller_profiles(user_id);


-- ------------------------------------------------------------------------------
-- 12. SHIPMENT TRACKING TABLE (Courier Event History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    awb_code VARCHAR(100),
    status VARCHAR(100),
    location VARCHAR(255),
    remark TEXT,
    activity_at TIMESTAMPTZ,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order ON shipment_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_awb ON shipment_tracking(awb_code);


-- ------------------------------------------------------------------------------
-- 13. COUPONS / PROMOS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(10) NOT NULL, -- 'flat' or 'pct'
    discount_value DECIMAL(10,2) NOT NULL,
    expiry TIMESTAMPTZ NOT NULL,
    max_uses INT DEFAULT 100,
    uses INT DEFAULT 0,
    uses_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);


-- ------------------------------------------------------------------------------
-- 14. NOTIFICATION LOG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(100),
    channel notification_channel,
    payload JSONB,
    status notification_status,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification_log(user_id);


-- ------------------------------------------------------------------------------
-- 15. SUPPORT TICKETS TABLE (Merchant Helpdesk)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    seller_id INT REFERENCES users(id) ON DELETE CASCADE,
    category ticket_category NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_seller ON support_tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);


-- ------------------------------------------------------------------------------
-- 16. RETURN REQUESTS TABLE (Returns & 100% Refunds Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_requests (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    buyer_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    seller_id INT REFERENCES users(id) ON DELETE SET NULL,
    status return_status DEFAULT 'requested',
    reason return_reason NOT NULL,
    description TEXT,
    evidence_images JSONB DEFAULT '[]'::jsonb,
    seller_note TEXT,
    admin_note TEXT,
    refund_amount DECIMAL(10,2) NOT NULL,
    razorpay_refund_id VARCHAR(255),
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_buyer ON return_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_seller ON return_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);


-- ------------------------------------------------------------------------------
-- 17. RETROFIT & UPGRADE STATEMENTS FOR EXISTING PARTIAL DATABASES
-- (Guarantees missing columns are added if tables already existed prior to migration)
-- ------------------------------------------------------------------------------
ALTER TABLE seller_profiles
ADD COLUMN IF NOT EXISTS pickup_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pickup_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS pickup_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pickup_pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS pickup_country VARCHAR(50) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS shiprocket_pickup_id VARCHAR(100);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) DEFAULT 0.50,
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(6,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS breadth_cm DECIMAL(6,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(6,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS reject_reason TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS color VARCHAR(100),
ADD COLUMN IF NOT EXISTS size VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS courier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS shiprocket_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS awb_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS courier_id INT,
ADD COLUMN IF NOT EXISTS courier_name_sr VARCHAR(255),
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_charges DECIMAL(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS shipment_status shipment_status DEFAULT 'pending';

ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS uses INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS uses_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


-- ------------------------------------------------------------------------------
-- 18. SEED DATA (Default Categories, Admin Account & Starter Coupons)
-- ------------------------------------------------------------------------------

-- Default Marketplace Categories
INSERT INTO categories (name, commission_pct) VALUES
('Electronics', 8.00),
('Apparel & Fashion', 12.00),
('Home & Kitchen', 10.00),
('Groceries', 5.00),
('Beauty & Personal Care', 10.00),
('Sports & Fitness', 8.00),
('Books & Stationery', 6.00),
('Toys & Games', 9.00)
ON CONFLICT (name) DO NOTHING;

-- Default Platform Administrator
-- Credentials: Phone: +919999999999 | Password: adminpassword123
INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES
('System Administrator', 'admin@slabofy.com', '+919999999999', '$2a$10$zBBjDRWC6O9ydIb1ypAhU.I8GZ1rkodjaVg/NvV7RaRomcmj2lVGW', 'admin', true)
ON CONFLICT (phone) DO NOTHING;

-- Starter Promotional Coupons
INSERT INTO coupons (code, discount_type, discount_value, expiry, max_uses, uses, is_active) VALUES
('WELCOME50', 'flat', 50.00, NOW() + INTERVAL '365 days', 1000, 0, true),
('GROUP10', 'pct', 10.00, NOW() + INTERVAL '365 days', 500, 0, true)
ON CONFLICT (code) DO NOTHING;
