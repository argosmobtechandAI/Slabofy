-- Custom Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('pending', 'active', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_status') THEN
        CREATE TYPE group_status AS ENUM ('active', 'complete', 'expired', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preauth_status') THEN
        CREATE TYPE preauth_status AS ENUM ('authorized', 'captured', 'voided');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE notification_channel AS ENUM ('whatsapp', 'push', 'email');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('sent', 'failed');
    END IF;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL, -- Format: +91XXXXXXXXXX
    password_hash VARCHAR(255),
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    fcm_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    commission_pct DECIMAL(5,2) DEFAULT 5.00, -- Commission percentage deducted from seller
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
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
    status product_status DEFAULT 'pending',
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3a. Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    color VARCHAR(100),
    size VARCHAR(50),
    stock INT NOT NULL DEFAULT 0,
    image_url TEXT,
    UNIQUE(product_id, color, size)
);

-- 4. Product Tiers Table (Engine for pricing discount based on group size: 1, 2, 3, 5, 10)
CREATE TABLE IF NOT EXISTS product_tiers (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    group_size INT NOT NULL, -- 1 (solo), 2, 3, 5, 10
    price DECIMAL(10,2) NOT NULL,
    UNIQUE(product_id, group_size)
);

-- 5. Groups Table
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

-- 6. Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 7. Orders Table
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
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    color VARCHAR(100),
    size VARCHAR(50),
    status order_status DEFAULT 'pending',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    is_cod BOOLEAN DEFAULT false,
    shipping_address TEXT,
    courier_name VARCHAR(255),
    tracking_number VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payment Pre-Authorization Table
CREATE TABLE IF NOT EXISTS payment_preauth (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    status preauth_status DEFAULT 'authorized',
    authorized_at TIMESTAMPTZ DEFAULT NOW(),
    captured_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ
);

-- 9. Seller Profiles Table
CREATE TABLE IF NOT EXISTS seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    business_address TEXT,
    gstin VARCHAR(20),
    pan_number VARCHAR(10),
    aadhar_number VARCHAR(12),
    kyc_document_url VARCHAR(255),
    bank_account VARCHAR(30),
    ifsc VARCHAR(11),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Coupons / Promos Table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(10) NOT NULL, -- 'flat' or 'pct'
    discount_value DECIMAL(10,2) NOT NULL,
    expiry TIMESTAMPTZ NOT NULL,
    max_uses INT DEFAULT 100,
    uses_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notification Log Table
CREATE TABLE IF NOT EXISTS notification_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(100),
    channel notification_channel,
    payload JSONB,
    status notification_status,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Database Records
INSERT INTO categories (name, commission_pct) VALUES
('Electronics', 8.00),
('Apparel & Fashion', 12.00),
('Home & Kitchen', 10.00),
('Groceries', 5.00)
ON CONFLICT DO NOTHING;

-- Seed Default Admin User
-- Password: adminpassword123 (bcrypt hash: $2a$10$zBBjDRWC6O9ydIb1ypAhU.I8GZ1rkodjaVg/NvV7RaRomcmj2lVGW)
INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES
('System Administrator', 'admin@slabofy.com', '+919999999999', '$2a$10$zBBjDRWC6O9ydIb1ypAhU.I8GZ1rkodjaVg/NvV7RaRomcmj2lVGW', 'admin', true)
ON CONFLICT (phone) DO NOTHING;
