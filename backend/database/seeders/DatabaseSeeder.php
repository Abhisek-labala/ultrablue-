<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with comprehensive master data.
     */
    public function run(): void
    {
        // 1. Seed Master Users into PostgreSQL `public.users` Table
        User::firstOrCreate(
            ['email' => 'admin@ultrablueplus.com'],
            [
                'name' => 'Dr. Alok Mohapatra',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'phone' => '+91 9853675971',
                'organization' => 'Ayush Green Energy HQ',
                'status' => 'ACTIVE'
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator@ultrablueplus.com'],
            [
                'name' => 'Ramesh Nayak',
                'password' => Hash::make('operator123'),
                'role' => 'operator',
                'phone' => '+91 8328826667',
                'organization' => 'Bhadrak Depot Dispenser #01',
                'status' => 'ACTIVE'
            ]
        );

        User::firstOrCreate(
            ['email' => 'distributor@shreeganesh.com'],
            [
                'name' => 'Subrat Das',
                'password' => Hash::make('distributor123'),
                'role' => 'distributor',
                'phone' => '+91 9853675971',
                'organization' => 'Shree Ganesh Fleet Logistics',
                'status' => 'ACTIVE'
            ]
        );

        // 2. Seed Multi-Hub Inventory Locations
        $locBhadrakId = (string) Str::uuid();
        DB::table('inventory_locations')->insertOrIgnore([
            'id' => $locBhadrakId,
            'code' => 'LOC-BHK-01',
            'name' => 'Bhadrak Central Depot & Factory Plant',
            'location_type' => 'plant',
            'address' => 'Plot 42, Bhadrak Industrial Estate',
            'city' => 'Bhadrak',
            'state' => 'Odisha',
            'pincode' => '756100',
            'manager_name' => 'Rajesh Kumar Sahoo',
            'contact_phone' => '+91 9853675971',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $locCuttackId = (string) Str::uuid();
        DB::table('inventory_locations')->insertOrIgnore([
            'id' => $locCuttackId,
            'code' => 'LOC-CTC-02',
            'name' => 'Cuttack National Highway Hub (NH-16)',
            'location_type' => 'depot',
            'address' => 'OId Jagatpur Industrial Corridor',
            'city' => 'Cuttack',
            'state' => 'Odisha',
            'pincode' => '754021',
            'manager_name' => 'Prakash Jena',
            'contact_phone' => '+91 8328826667',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $locRourkelaId = (string) Str::uuid();
        DB::table('inventory_locations')->insertOrIgnore([
            'id' => $locRourkelaId,
            'code' => 'LOC-RKL-03',
            'name' => 'Rourkela Mining & Heavy Fleet Depot',
            'location_type' => 'depot',
            'address' => 'Kalunga Industrial Area, Rourkela',
            'city' => 'Rourkela',
            'state' => 'Odisha',
            'pincode' => '769004',
            'manager_name' => 'Manoj Pradhan',
            'contact_phone' => '+91 9437123456',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 3. Seed Product Categories & Pack Variants
        $catDefId = (string) Str::uuid();
        DB::table('product_categories')->insertOrIgnore([
            'id' => $catDefId,
            'name' => 'Diesel Exhaust Fluid (DEF)',
            'slug' => 'diesel-exhaust-fluid',
            'description' => 'ISO 22241-1 certified high purity AUS 32 aqueous urea solution for BS-VI vehicles.',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $catLubId = (string) Str::uuid();
        DB::table('product_categories')->insertOrIgnore([
            'id' => $catLubId,
            'name' => 'Heavy Fleet Lubricants & Engine Oils',
            'slug' => 'heavy-fleet-lubricants',
            'description' => 'High performance API CK-4 / CI-4 commercial diesel engine oils.',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $prodDefId = (string) Str::uuid();
        DB::table('products')->insertOrIgnore([
            'id' => $prodDefId,
            'category_id' => $catDefId,
            'name' => 'UltraBlue+ Pure AUS 32 Fleet Grade DEF',
            'slug' => 'ultrablue-aus-32-def',
            'description' => 'ISO 22241-1 & BIS certified DEF with <0.2 ppm trace metals.',
            'hsn_code' => '31021000',
            'gst_rate' => 18.00,
            'iso_standard' => 'ISO 22241-1 / BIS Certified',
            'is_isi_marked' => true,
            'is_bis_compliant' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $prodLubId = (string) Str::uuid();
        DB::table('products')->insertOrIgnore([
            'id' => $prodLubId,
            'category_id' => $catLubId,
            'name' => 'UltraBlue+ UltraFleet HD 15W-40 CI-4 Engine Oil',
            'slug' => 'ultrablue-ultrafleet-15w40',
            'description' => 'Heavy-duty long drain commercial fleet engine lubricant.',
            'hsn_code' => '27101981',
            'gst_rate' => 18.00,
            'iso_standard' => 'API CI-4 / IS 13656',
            'is_isi_marked' => true,
            'is_bis_compliant' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Variants
        $var20LId = (string) Str::uuid();
        DB::table('product_pack_variants')->insertOrIgnore([
            'id' => $var20LId,
            'product_id' => $prodDefId,
            'sku' => 'UB-DEF-20L',
            'pack_size' => '20L Bucket / Canister',
            'volume_in_litres' => 20.00,
            'standard_mrp' => 1250.00,
            'distributor_base_price' => 950.00,
            'is_popular' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $var210LId = (string) Str::uuid();
        DB::table('product_pack_variants')->insertOrIgnore([
            'id' => $var210LId,
            'product_id' => $prodDefId,
            'sku' => 'UB-DEF-210L',
            'pack_size' => '210L HDPE Barrel Drum',
            'volume_in_litres' => 210.00,
            'standard_mrp' => 11500.00,
            'distributor_base_price' => 8800.00,
            'is_popular' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $var1000LId = (string) Str::uuid();
        DB::table('product_pack_variants')->insertOrIgnore([
            'id' => $var1000LId,
            'product_id' => $prodDefId,
            'sku' => 'UB-DEF-1000L',
            'pack_size' => '1000L Heavy IBC Tote',
            'volume_in_litres' => 1000.00,
            'standard_mrp' => 49500.00,
            'distributor_base_price' => 38000.00,
            'is_popular' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $varLub20LId = (string) Str::uuid();
        DB::table('product_pack_variants')->insertOrIgnore([
            'id' => $varLub20LId,
            'product_id' => $prodLubId,
            'sku' => 'UB-LUB-15W40-20L',
            'pack_size' => '20L Pail (15W-40)',
            'volume_in_litres' => 20.00,
            'standard_mrp' => 6400.00,
            'distributor_base_price' => 4900.00,
            'is_popular' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 4. Seed Live Inventory Batches
        DB::table('inventory_batches')->insertOrIgnore([
            [
                'id' => (string) Str::uuid(),
                'location_id' => $locBhadrakId,
                'variant_id' => $var20LId,
                'batch_number' => 'UB-2026-08-B1',
                'mfg_date' => now()->subDays(5)->toDateString(),
                'expiry_date' => now()->addMonths(12)->toDateString(),
                'available_stock' => 1250,
                'reserved_stock' => 80,
                'min_threshold' => 100,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'location_id' => $locBhadrakId,
                'variant_id' => $var1000LId,
                'batch_number' => 'UB-2026-08-IBC4',
                'mfg_date' => now()->subDays(3)->toDateString(),
                'expiry_date' => now()->addMonths(12)->toDateString(),
                'available_stock' => 28,
                'reserved_stock' => 4,
                'min_threshold' => 10,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'location_id' => $locCuttackId,
                'variant_id' => $var20LId,
                'batch_number' => 'UB-2026-08-C2',
                'mfg_date' => now()->subDays(7)->toDateString(),
                'expiry_date' => now()->addMonths(12)->toDateString(),
                'available_stock' => 450,
                'reserved_stock' => 30,
                'min_threshold' => 80,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'location_id' => $locRourkelaId,
                'variant_id' => $var210LId,
                'batch_number' => 'UB-2026-07-R1',
                'mfg_date' => now()->subDays(15)->toDateString(),
                'expiry_date' => now()->addMonths(11)->toDateString(),
                'available_stock' => 14,
                'reserved_stock' => 8,
                'min_threshold' => 20, // Low stock trigger
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // 5. Seed Distributor Profiles
        DB::table('distributor_profiles')->insertOrIgnore([
            [
                'id' => (string) Str::uuid(),
                'company_name' => 'Shree Ganesh Fleet Logistics',
                'contact_person' => 'Subrat Das',
                'phone' => '+91 9853675971',
                'email' => 'distributor@shreeganesh.com',
                'gstin' => '21AABCU9603R1ZM',
                'territory_city' => 'Bhadrak',
                'territory_state' => 'Odisha',
                'discount_tier' => 'Gold Tier (15% Disc)',
                'credit_limit' => 500000.00,
                'account_status' => 'APPROVED',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'company_name' => 'Maa Tarini Transport Corporation',
                'contact_person' => 'Bikash Mohanty',
                'phone' => '+91 9437890123',
                'email' => 'bikash@maatarinitransport.com',
                'gstin' => '21AABMT8874P1Z2',
                'territory_city' => 'Keonjhar',
                'territory_state' => 'Odisha',
                'discount_tier' => 'Silver Tier (10% Disc)',
                'credit_limit' => 300000.00,
                'account_status' => 'PENDING_REVIEW',
                'created_at' => now()->subHours(4),
                'updated_at' => now()->subHours(4)
            ],
            [
                'id' => (string) Str::uuid(),
                'company_name' => 'Kalinga Express Heavy Haulers',
                'contact_person' => 'Debasis Patnaik',
                'phone' => '+91 9937112233',
                'email' => 'dispatch@kalingaexpress.in',
                'gstin' => '21AAACK9901M1ZQ',
                'territory_city' => 'Jharsuguda',
                'territory_state' => 'Odisha',
                'discount_tier' => 'Platinum Tier (20% Disc)',
                'credit_limit' => 1000000.00,
                'account_status' => 'APPROVED',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ]
        ]);

        // 6. Seed Sample POS / Sales Invoices
        $inv1Id = (string) Str::uuid();
        DB::table('invoices')->insertOrIgnore([
            [
                'id' => $inv1Id,
                'invoice_number' => 'INV-UB-2026-0042',
                'location_id' => $locBhadrakId,
                'operator_name' => 'Ramesh Nayak',
                'customer_name' => 'Shree Jagannath Bulk Roadlines',
                'customer_phone' => '+91 9861001122',
                'vehicle_number' => 'OD-01-AX-9942',
                'subtotal' => 24000.00,
                'discount_amount' => 1200.00,
                'taxable_amount' => 22800.00,
                'cgst_amount' => 2052.00,
                'sgst_amount' => 2052.00,
                'grand_total' => 26904.00,
                'payment_method' => 'UPI / QR',
                'payment_status' => 'PAID',
                'is_sms_sent' => true,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2)
            ],
            [
                'id' => (string) Str::uuid(),
                'invoice_number' => 'INV-UB-2026-0041',
                'location_id' => $locCuttackId,
                'operator_name' => 'Prakash Jena',
                'customer_name' => 'National Highway Logistics Ltd',
                'customer_phone' => '+91 9437223344',
                'vehicle_number' => 'NL-01-K-8721',
                'subtotal' => 49500.00,
                'discount_amount' => 2500.00,
                'taxable_amount' => 47000.00,
                'cgst_amount' => 4230.00,
                'sgst_amount' => 4230.00,
                'grand_total' => 55460.00,
                'payment_method' => 'Bank Transfer (NEFT)',
                'payment_status' => 'PAID',
                'is_sms_sent' => true,
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(6)
            ],
            [
                'id' => (string) Str::uuid(),
                'invoice_number' => 'INV-UB-2026-0040',
                'location_id' => $locBhadrakId,
                'operator_name' => 'Ramesh Nayak',
                'customer_name' => 'Bhadrak Express Logistics',
                'customer_phone' => '+91 9853009988',
                'vehicle_number' => 'OD-22-B-1204',
                'subtotal' => 12500.00,
                'discount_amount' => 500.00,
                'taxable_amount' => 12000.00,
                'cgst_amount' => 1080.00,
                'sgst_amount' => 1080.00,
                'grand_total' => 14160.00,
                'payment_method' => 'Cash',
                'payment_status' => 'PAID',
                'is_sms_sent' => true,
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay()
            ]
        ]);

        // 7. Seed Customer Wholesale Enquiries
        DB::table('enquiries')->insertOrIgnore([
            [
                'id' => (string) Str::uuid(),
                'inquiry_code' => 'UB-ENQ-2026-0012',
                'name' => 'Pradeep Mohapatra',
                'company_name' => 'Utkal Freight Transport Co.',
                'phone' => '+91 9861556677',
                'email' => 'procurement@utkalfreight.com',
                'location' => 'Paradeep Port, Odisha',
                'product_requested' => 'UltraBlue+ Pure AUS 32 Fleet Grade DEF',
                'estimated_quantity' => '15,000 Litres (Tanker)',
                'status' => 'NEW_INQUIRY',
                'message' => 'Need direct tanker dispatch quotation for 50 BharatBenz BS-VI tipper trucks operating at Paradeep Port.',
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3)
            ],
            [
                'id' => (string) Str::uuid(),
                'inquiry_code' => 'UB-ENQ-2026-0011',
                'name' => 'Sanjay Tripathy',
                'company_name' => 'Mahanadi Mining Logistics',
                'phone' => '+91 9437119900',
                'email' => 'sanjay@mahanadimining.in',
                'location' => 'Talcher Coalfields, Odisha',
                'product_requested' => '1000L Heavy IBC Tote (DEF)',
                'estimated_quantity' => '8,000 Litres (IBC Totes)',
                'status' => 'QUOTE_DISPATCHED',
                'message' => 'Requesting supply agreement for 1000L IBC Totes with electric dispensing nozzle kit.',
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1)
            ]
        ]);

        // 8. Seed Live Factory Promotions & Broadcast Offers
        DB::table('promotions')->insertOrIgnore([
            [
                'id' => (string) Str::uuid(),
                'title' => 'Monsoon Fleet Special: Flat 12% Off on DEF 20L Buckets!',
                'description' => 'Save on every 20L bucket with direct factory dispatch across Odisha and Eastern Highway corridors.',
                'badge' => 'Live Factory Offer',
                'promo_code' => 'MONSOON12',
                'discount_percent' => '12% OFF',
                'target_product' => 'UltraBlue+ Pure AUS 32 Fleet Grade DEF',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'title' => 'Direct Tanker Refill: Extra ₹2.50/L Bulk Discount',
                'description' => 'For mining fleet operators and logistics hubs ordering 10,000L+ tanker loads.',
                'badge' => 'Bulk Tanker Deal',
                'promo_code' => 'BULK250',
                'discount_percent' => '₹2.50/L OFF',
                'target_product' => 'Bulk Tanker Dispatch',
                'is_active' => true,
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay()
            ],
            [
                'id' => (string) Str::uuid(),
                'title' => 'New Distributor Welcome Credit: Up to ₹10 Lakhs',
                'description' => 'Fast-track onboarding and 30-day revolving credit line for authorized district stockists.',
                'badge' => 'Distributor Perk',
                'promo_code' => 'DISTRIB2026',
                'discount_percent' => 'Credit Support',
                'target_product' => 'All UltraBlue+ Products',
                'is_active' => true,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ]
        ]);
    }
}
