<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. INVENTORY LOCATIONS
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 30)->unique();
            $table->string('name', 150);
            $table->string('location_type', 50)->default('depot');
            $table->text('address');
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('pincode', 10);
            $table->string('manager_name', 100)->nullable();
            $table->string('contact_phone', 20);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. PRODUCT CATEGORIES & PRODUCTS
        Schema::create('product_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('product_categories')->onDelete('restrict');
            $table->string('name', 200);
            $table->string('slug', 200)->unique();
            $table->text('description')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->string('badge', 100)->nullable();
            $table->string('offer_tag', 150)->nullable();
            $table->string('offer_discount', 50)->nullable();
            $table->string('hsn_code', 20)->default('31021000');
            $table->decimal('gst_rate', 5, 2)->default(18.00);
            $table->string('iso_standard', 100)->default('ISO 22241-1');
            $table->boolean('is_isi_marked')->default(true);
            $table->boolean('is_bis_compliant')->default(true);
            $table->string('isi_number', 100)->nullable();
            $table->string('bis_licence', 100)->nullable();
            $table->string('urea_content', 100)->nullable();
            $table->string('density', 100)->nullable();
            $table->string('metals', 100)->nullable();
            $table->string('insolubles', 100)->nullable();
            $table->string('viscosity_grade', 100)->nullable();
            $table->string('flash_point', 100)->nullable();
            $table->text('oem_approvals')->nullable();
            $table->text('features_json')->nullable();
            $table->timestamps();
        });

        Schema::create('product_pack_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
            $table->string('sku', 60)->unique();
            $table->string('pack_size', 60);
            $table->decimal('volume_in_litres', 10, 2);
            $table->decimal('standard_mrp', 12, 2);
            $table->decimal('distributor_base_price', 12, 2);
            $table->boolean('is_popular')->default(false);
            $table->string('image_url', 500)->nullable();
            $table->timestamps();
        });

        // 2.1 PROMOTIONS & PUSH OFFERS
        Schema::create('promotions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title', 200);
            $table->text('description');
            $table->string('badge', 100)->nullable();
            $table->string('promo_code', 50)->nullable();
            $table->string('discount_percent', 50)->nullable();
            $table->string('target_product', 200)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. BATCHES & INVENTORY
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('location_id')->constrained('inventory_locations')->onDelete('restrict');
            $table->foreignUuid('variant_id')->constrained('product_pack_variants')->onDelete('restrict');
            $table->string('batch_number', 60);
            $table->date('mfg_date');
            $table->date('expiry_date');
            $table->integer('available_stock')->default(0);
            $table->integer('reserved_stock')->default(0);
            $table->integer('min_threshold')->default(20);
            $table->timestamps();

            $table->unique(['location_id', 'variant_id', 'batch_number']);
        });

        // 4. DISTRIBUTOR PROFILES
        Schema::create('distributor_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('company_name', 200);
            $table->string('contact_person', 150);
            $table->string('phone', 20);
            $table->string('email', 150);
            $table->string('gstin', 20)->unique();
            $table->string('territory_city', 100);
            $table->string('territory_state', 100);
            $table->string('discount_tier', 50)->default('Gold Tier (15% Disc)');
            $table->decimal('credit_limit', 14, 2)->default(500000.00);
            $table->string('account_status', 50)->default('PENDING_REVIEW');
            $table->string('kyc_document_path', 255)->nullable();
            $table->timestamps();
        });

        // 5. INVOICES & ITEMS
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number', 60)->unique();
            $table->foreignUuid('location_id')->constrained('inventory_locations')->onDelete('restrict');
            $table->string('operator_name', 100)->default('Rajesh Kumar Sahoo');
            $table->string('customer_name', 150);
            $table->string('customer_phone', 20);
            $table->string('vehicle_number', 40)->nullable();
            $table->decimal('subtotal', 14, 2);
            $table->decimal('discount_amount', 14, 2)->default(0.00);
            $table->decimal('taxable_amount', 14, 2);
            $table->decimal('cgst_amount', 14, 2)->default(0.00);
            $table->decimal('sgst_amount', 14, 2)->default(0.00);
            $table->decimal('grand_total', 14, 2);
            $table->string('payment_method', 50)->default('UPI');
            $table->string('payment_status', 50)->default('PAID');
            $table->boolean('is_sms_sent')->default(true);
            $table->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignUuid('variant_id')->constrained('product_pack_variants')->onDelete('restrict');
            $table->string('batch_number', 60)->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('line_total', 14, 2);
            $table->timestamps();
        });

        // 6. ENQUIRIES & NOTIFICATIONS
        Schema::create('enquiries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('inquiry_code', 50)->unique();
            $table->string('name', 150);
            $table->string('company_name', 200);
            $table->string('phone', 20);
            $table->string('email', 150)->nullable();
            $table->string('location', 150);
            $table->string('product_requested', 150);
            $table->string('estimated_quantity', 100);
            $table->text('message')->nullable();
            $table->string('status', 50)->default('NEW_INQUIRY');
            $table->timestamps();
        });

        Schema::create('system_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 50);
            $table->string('title', 200);
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->string('action_route', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_notifications');
        Schema::dropIfExists('enquiries');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('distributor_profiles');
        Schema::dropIfExists('inventory_batches');
        Schema::dropIfExists('product_pack_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_categories');
        Schema::dropIfExists('inventory_locations');
    }
};
