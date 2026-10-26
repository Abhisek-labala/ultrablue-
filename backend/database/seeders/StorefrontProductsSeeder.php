<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StorefrontProductsSeeder extends Seeder
{
    public function run(): void
    {
        // 4 Key Packaging Products that appear on the public website
        $products = [
            [
                'name' => '5L & 10L Emergency Cans',
                'short_name' => '5L / 10L Cans',
                'category' => 'CANS',
                'capacity' => '5 / 10 Litres',
                'badge' => 'LCV & Emergency',
                'image_url' => '/images/def_cans_pack.jpg',
                'best_for' => 'Light Commercial Vehicles (LCVs), SUVs, Roadside Emergency Top-ups',
                'features' => [
                    'Spill-proof flexible pouring nozzle included',
                    'Tamper-evident child-resistant induction cap',
                    'Compact form factor for vehicle cabin / boot storage',
                    'UV-stabilized virgin HDPE polymer'
                ],
                'default_qty' => '10 Cans',
                'mrp' => 500.00,
                'distributor_price' => 375.00,
                'is_active' => true,
                'sort_order' => 1
            ],
            [
                'name' => '20L Smart Bucket',
                'short_name' => '20L Bucket',
                'category' => 'BUCKETS',
                'capacity' => '20 Litres',
                'badge' => 'Most Popular • Fleet Choice',
                'image_url' => '/images/def_bucket_20l.jpg',
                'best_for' => 'Medium & Heavy Commercial Vehicles (M&HCV), Highway Fleets, Retail',
                'features' => [
                    'Airtight tamper-evident induction heat seal',
                    'Integrated flexible retractable pouring spout',
                    'Drop-tested reinforced ergonomic steel & polymer handle',
                    'Full batch QR code for instant lab purity verification'
                ],
                'default_qty' => '25 Buckets',
                'mrp' => 1250.00,
                'distributor_price' => 950.00,
                'is_active' => true,
                'sort_order' => 2
            ],
            [
                'name' => '210L Industrial Barrel / Drum',
                'short_name' => '210L Barrel',
                'category' => 'BARRELS',
                'capacity' => '210 Litres',
                'badge' => 'Depot & Workshop Grade',
                'image_url' => '/images/def_barrel_210l.jpg',
                'best_for' => 'Fleet Workshops, Transport Depots, Service Bays, Garages',
                'features' => [
                    'Standard 2" BSP threaded bungs for manual/pneumatic pumps',
                    'Heavy-duty virgin polymer with high hoop strength',
                    '18-month certified shelf life under depot storage',
                    'Zero crystallization guaranteed with sealed delivery'
                ],
                'default_qty' => '2 Barrels',
                'mrp' => 9500.00,
                'distributor_price' => 7600.00,
                'is_active' => true,
                'sort_order' => 3
            ],
            [
                'name' => '1000L IBC Tank Tote & Dispenser',
                'short_name' => '1000L IBC Tank',
                'category' => 'IBC',
                'capacity' => '1,000 Litres',
                'badge' => 'Lowest Cost per Litre',
                'image_url' => '/images/def_ibc_1000l.jpg',
                'best_for' => 'Large Fleet Terminals, Mining Haulers, Bus Corporation Yards',
                'features' => [
                    'Galvanized tubular steel cage with composite pallet base',
                    '2" bottom camlock discharge valve with dust cap',
                    'Compatible with dedicated digital flow-meter pump kits',
                    'Ayush Green Energy door-to-door swap & refill service'
                ],
                'default_qty' => '1 IBC Tank',
                'mrp' => 38000.00,
                'distributor_price' => 31000.00,
                'is_active' => true,
                'sort_order' => 4
            ]
        ];

        foreach ($products as $item) {
            $slug = Str::slug($item['name']);
            $existing = DB::table('products')->where('slug', $slug)->first();

            $prodId = $existing ? $existing->id : (string) Str::uuid();

            $record = [
                'name' => $item['name'],
                'slug' => $slug,
                'category' => $item['category'],
                'capacity' => $item['capacity'],
                'short_name' => $item['short_name'],
                'badge' => $item['badge'],
                'image_url' => $item['image_url'],
                'best_for' => $item['best_for'],
                'description' => $item['best_for'],
                'features_json' => json_encode($item['features']),
                'default_qty' => $item['default_qty'],
                'mrp' => $item['mrp'],
                'distributor_price' => $item['distributor_price'],
                'is_active' => $item['is_active'],
                'sort_order' => $item['sort_order'],
                'hsn_code' => '31021000',
                'gst_rate' => 18.00,
                'is_gst_inclusive' => true,
                'updated_at' => now(),
            ];

            if ($existing) {
                DB::table('products')->where('id', $prodId)->update($record);
            } else {
                $record['id'] = $prodId;
                $record['created_at'] = now();
                DB::table('products')->insert($record);
            }

            // Ensure a matching pack variant exists for POS / Invoices
            $hasVariant = DB::table('product_pack_variants')->where('product_id', $prodId)->first();
            if (!$hasVariant) {
                // Approximate litres
                preg_match('/\d+/', $item['capacity'], $matches);
                $litres = !empty($matches[0]) ? (float) $matches[0] : 20.0;
                DB::table('product_pack_variants')->insert([
                    'id' => (string) Str::uuid(),
                    'product_id' => $prodId,
                    'sku' => 'UBP-' . strtoupper($item['category']) . '-' . (int)$litres . 'L',
                    'pack_size' => $item['name'],
                    'volume_in_litres' => $litres,
                    'standard_mrp' => $item['mrp'],
                    'distributor_base_price' => $item['distributor_price'],
                    'is_popular' => str_contains($item['badge'], 'Popular'),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
}
