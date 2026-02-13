#!/bin/bash
# Run this in your project root to create .env.local
# Replace the placeholder values with your real credentials

cat > .env.local << 'EOF'
# ──────────────────────────────────────────────
# Shopify Storefront (public, read-only)
# ──────────────────────────────────────────────
SHOPIFY_STORE_DOMAIN=crazygels.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=crazygels.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token_here

# ──────────────────────────────────────────────
# Shopify Admin API (private, write access)
# ──────────────────────────────────────────────
SHOPIFY_ADMIN_TOKEN=your_private_access_token_here

# ──────────────────────────────────────────────
# Database (Neon / Postgres)
# ──────────────────────────────────────────────
DATABASE_URL=your_neon_database_url_here

# ──────────────────────────────────────────────
# Admin Dashboard Auth
# ──────────────────────────────────────────────
ADMIN_TOKEN=your_admin_token_here

# ──────────────────────────────────────────────
# Klaviyo
# ──────────────────────────────────────────────
NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY=your_klaviyo_public_key_here
KLAVIYO_PRIVATE_API_KEY=your_klaviyo_private_key_here
EOF

echo "✅ .env.local created! Fill in your real values."
