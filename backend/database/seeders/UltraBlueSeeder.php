<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UltraBlueSeeder extends Seeder
{
    public function run(): void
    {
        // 1. DEPOTS
        $locBhadrakId = (string) Str::uuid();
        $locKolkataId = (string) Str::uuid();
        $locBhubaneswarId = (string) Str::uuid();

        DB::table('inventory_locations')->insert([
            [
                'id' => $locBhadrakId,
                'code' => 'BHD-01',
                'name' => 'Bhadrak Plant & Mother Depot',
                'location_type' => 'mother_plant',
                'address' => 'Plot No. 42, Industrial Growth Centre, Bhadrak',
                'city' => 'Bhadrak',
                'state' => 'Odisha',
                'pincode' => '756100',
                'manager_name' => 'Mr. Anil Kumar Nayak',
                'contact_phone' => '+91 9853675971',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $locKolkataId,
                'code' => 'CCU-02',
                'name' => 'Kolkata Central Logistics Hub',
                'location_type' => 'regional_hub',
                'address' => 'Transport Depot Road, Taratala, Kolkata',
                'city' => 'Kolkata',
                'state' => 'West Bengal',
                'pincode' => '700088',
                'manager_name' => 'Subhashis Bose',
                'contact_phone' => '+91 98300 44119',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $locBhubaneswarId,
                'code' => 'BBI-03',
                'name' => 'Bhubaneswar Express Terminal',
                'location_type' => 'depot',
                'address' => 'NH-16 Highway Hub, Rasulgarh, Bhubaneswar',
                'city' => 'Bhubaneswar',
                'state' => 'Odisha',
                'pincode' => '751010',
                'manager_name' => 'Bikram Mohanty',
                'contact_phone' => '+91 98610 55421',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // 2. CATEGORIES
        $catDefId = (string) Str::uuid();
        $catHydId = (string) Str::uuid();
        $catEngId = (string) Str::uuid();
        $catGearId = (string) Str::uuid();
        $catCoolId = (string) Str::uuid();

        DB::table('product_categories')->insert([
            ['id' => $catDefId, 'name' => 'Diesel Exhaust Fluid', 'slug' => 'diesel-exhaust-fluid', 'description' => 'ISO 22241-1 Aqueous Urea Solution 32.5%', 'created_at' => now()],
            ['id' => $catHydId, 'name' => 'Hydraulic Oils', 'slug' => 'hydraulic-oils', 'description' => 'Anti-wear heavy industrial fluids DIN 51524', 'created_at' => now()],
            ['id' => $catEngId, 'name' => 'Engine Lubricants', 'slug' => 'engine-lubricants', 'description' => 'Heavy fleet diesel engine oils API CI-4+/CK-4', 'created_at' => now()],
            ['id' => $catGearId, 'name' => 'Gear & Transmission', 'slug' => 'gear-transmission', 'description' => 'Extreme pressure differential & gearbox lubricants', 'created_at' => now()],
            ['id' => $catCoolId, 'name' => 'Coolants & Greases', 'slug' => 'coolants-greases', 'description' => 'OAT long-life radiator coolants and lithium greases', 'created_at' => now()]
        ]);

        // 3. PRODUCTS & VARIANTS
        $prodDefId = (string) Str::uuid();
        $prodHyd68Id = (string) Str::uuid();
        $prodHyd46Id = (string) Str::uuid();
        $prodEng15w40Id = (string) Str::uuid();
        $prodGearId = (string) Str::uuid();
        $prodCoolId = (string) Str::uuid();
        $prodGreaseId = (string) Str::uuid();

        DB::table('products')->insert([
            [
                'id' => $prodDefId,
                'category_id' => $catDefId,
                'name' => 'UltraBlue+ High-Purity Diesel Exhaust Fluid (DEF / AUS 32)',
                'slug' => 'ultrablue-def-aus32',
                'description' => '32.5% technically pure aqueous urea solution engineered for BS-VI and Euro-VI SCR systems. Ultra-low metal content (<0.2 ppm) prevents injector clogging and catalyst poisoning.',
                'image_url' => 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
                'badge' => 'Core Product • ISO 22241',
                'offer_tag' => '🔥 Factory Direct: Free Spout with 20L',
                'offer_discount' => '12% OFF',
                'hsn_code' => '31021000',
                'gst_rate' => 18.00,
                'iso_standard' => 'ISO 22241-1 / IS 17042:2018',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 17042:2018 (CM/L-84001923)',
                'bis_licence' => 'CM/L-84001923',
                'urea_content' => '32.5% ± 0.7%',
                'density' => '1.087 - 1.093 g/cm³',
                'metals' => '< 0.05 ppm',
                'insolubles' => '≤ 5 mg/kg',
                'viscosity_grade' => 'AUS 32 / Aqueous Solution',
                'flash_point' => 'Non-Flammable',
                'oem_approvals' => 'Tata Motors, Ashok Leyland, BharatBenz, Volvo Commercial, Eicher, Mahindra Truck & Bus',
                'features_json' => json_encode([
                    'Protects SCR catalyst from premature deactivation and crystallization',
                    'Reduces harmful NOx emissions by up to 90%',
                    'Closed-loop automated blending with de-ionised EDI water base (<0.08 µS/cm)',
                    'Every batch traceable with verifiable Digital Certificate of Analysis (COA)'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $prodHyd68Id,
                'category_id' => $catHydId,
                'name' => 'UltraBlue+ HydroMax H-68 Anti-Wear Hydraulic Oil',
                'slug' => 'ultrablue-hydromax-h68',
                'description' => 'Premium high-viscosity-index hydraulic fluid designed with thermal oxidation stability and anti-wear zinc additives for heavy excavators, mining dumpers, and hydraulic presses.',
                'image_url' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
                'badge' => 'Heavy Duty • DIN 51524 Part 2',
                'offer_tag' => '★ Buy 5 Barrels Get 10% Extra Margin',
                'offer_discount' => '10% OFF',
                'hsn_code' => '27101980',
                'gst_rate' => 18.00,
                'iso_standard' => 'DIN 51524 Part 2 (HLP) / IS 10522',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 10522:1983 (CM/L-7128490)',
                'bis_licence' => 'CM/L-7128490',
                'urea_content' => 'N/A (Hydrocarbon Base)',
                'density' => '0.875 g/cm³ @ 29.5°C',
                'metals' => 'Zn Anti-Wear Additized (380 ppm)',
                'insolubles' => '< 10 mg/kg',
                'viscosity_grade' => 'ISO VG 68 (cSt @ 40°C: 68.2)',
                'flash_point' => '228°C (COC)',
                'oem_approvals' => 'JCB India, Caterpillar, Komatsu, Tata Hitachi, Sany, L&T Construction Equipment',
                'features_json' => json_encode([
                    'Superior thermal and oxidation stability prevents sludge at 85°C+ continuous load',
                    'Rapid air release and advanced anti-foam properties prevent pump cavitation',
                    'Protects multi-metal pump components (copper, bronze, steel) from corrosion',
                    'Extended drain interval up to 3,500 operating hours'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $prodHyd46Id,
                'category_id' => $catHydId,
                'name' => 'UltraBlue+ HydroMax H-46 High-Pressure Hydraulic Fluid',
                'slug' => 'ultrablue-hydromax-h46',
                'description' => 'Engineered for high-pressure precision hydraulic systems, CNC machines, mobile cranes, and tipping cylinders requiring low ambient temperature fluidity.',
                'image_url' => 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
                'badge' => 'High Viscosity Index • ISO VG 46',
                'offer_tag' => '⚡ Fleet Special: Monsoon Refill Rate',
                'offer_discount' => '8% OFF',
                'hsn_code' => '27101980',
                'gst_rate' => 18.00,
                'iso_standard' => 'DIN 51524 Part 2 / ISO 11158 HM',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 10522:1983',
                'bis_licence' => 'CM/L-7128490',
                'urea_content' => 'N/A',
                'density' => '0.868 g/cm³',
                'metals' => 'Anti-Wear Zn Additized',
                'insolubles' => '< 8 mg/kg',
                'viscosity_grade' => 'ISO VG 46 (cSt @ 40°C: 46.5)',
                'flash_point' => '220°C',
                'oem_approvals' => 'Parker Hannifin, Eaton Vickers, Bosch Rexroth, Hyva Tipper Hydraulics',
                'features_json' => json_encode([
                    'Fast response time in electro-hydraulic servo valves',
                    'Outstanding demulsibility separating water ingress within minutes',
                    'Compatible with standard NBR and Viton hydraulic seals'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $prodEng15w40Id,
                'category_id' => $catEngId,
                'name' => 'UltraBlue+ TurboGuard 15W-40 CI-4+ Heavy Diesel Engine Oil',
                'slug' => 'ultrablue-turboguard-15w40',
                'description' => 'Advanced heavy-duty multigrade diesel engine lubricant providing high soot dispersion and shear stability for turbocharged interstate commercial transport trucks.',
                'image_url' => 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
                'badge' => 'API CI-4+ / SL • Long Drain',
                'offer_tag' => '🚚 Fleet Saver: Flat ₹3,900 on 20L Bucket',
                'offer_discount' => '15% OFF',
                'hsn_code' => '27101980',
                'gst_rate' => 18.00,
                'iso_standard' => 'API CI-4+ / IS 13656:2019 Type EDL-5',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 13656:2019 (CM/L-9201482)',
                'bis_licence' => 'CM/L-9201482',
                'urea_content' => 'N/A',
                'density' => '0.880 g/cm³',
                'metals' => 'High TBN Detergent Pack (TBN 11.2)',
                'insolubles' => 'N/A',
                'viscosity_grade' => 'SAE 15W-40 (cSt @ 100°C: 14.8)',
                'flash_point' => '232°C',
                'oem_approvals' => 'Cummins CES 20078, Volvo VDS-3, MB 228.3, MAN M 3275, Mack EO-N',
                'features_json' => json_encode([
                    'Extended drain interval up to 45,000 km under highway haulage',
                    'High TBN neutralizes acidic combustion by-products from high-sulfur diesel',
                    'Guards turbocharger bearings against extreme thermal stress and carbon deposits'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $prodGearId,
                'category_id' => $catGearId,
                'name' => 'UltraBlue+ GearShield 80W-90 Extreme Pressure Heavy Gear Oil',
                'slug' => 'ultrablue-gearshield-80w90',
                'description' => 'Extreme Pressure (EP) sulfur-phosphorus heavy commercial differential and manual gearbox lubricant designed to withstand severe shock loads and high hypoid gear torque.',
                'image_url' => 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
                'badge' => 'API GL-5 • Hypoid Heavy Duty',
                'offer_tag' => '🛡️ Heavy Fleet Protection Combo',
                'offer_discount' => '10% OFF',
                'hsn_code' => '27101980',
                'gst_rate' => 18.00,
                'iso_standard' => 'API GL-5 / IS 1118:1992',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 1118:1992 (CM/L-6381904)',
                'bis_licence' => 'CM/L-6381904',
                'urea_content' => 'N/A',
                'density' => '0.892 g/cm³',
                'metals' => 'Sulfur-Phosphorus EP Additives',
                'insolubles' => 'N/A',
                'viscosity_grade' => 'SAE 80W-90 (cSt @ 100°C: 15.2)',
                'flash_point' => '218°C',
                'oem_approvals' => 'ZF TE-ML 05A/07A/12E, Eaton Axles, Meritor Heavy Axles, BharatBenz',
                'features_json' => json_encode([
                    'Extreme Pressure (EP) additives prevent gear tooth scuffing under severe uphill torque',
                    'Protects bronze synchronizer rings from chemical corrosion',
                    'Prevents oil seal leaks and maintains high film strength under 110°C gear sump temps'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $prodCoolId,
                'category_id' => $catCoolId,
                'name' => 'UltraBlue+ FrostGuard OAT Long-Life Fleet Coolant (1:3 Concentrate)',
                'slug' => 'ultrablue-frostguard-coolant',
                'description' => 'Organic Acid Technology (OAT) heavy fleet radiator coolant concentrate. Nitrite, amine, phosphate and silicate-free (NAPS-free) formula preventing cylinder liner cavitation.',
                'image_url' => 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
                'badge' => 'OAT Long Life • 5,00,000 KM',
                'offer_tag' => '❄️ Radiator Protection Guarantee',
                'offer_discount' => '12% OFF',
                'hsn_code' => '38200000',
                'gst_rate' => 18.00,
                'iso_standard' => 'JIS K 2234 / ASTM D6210 / IS 5759',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 5759:2006 (CM/L-4491028)',
                'bis_licence' => 'CM/L-4491028',
                'urea_content' => 'Ethylene Glycol 92% Base',
                'density' => '1.115 g/cm³',
                'metals' => 'Zero Heavy Metals',
                'insolubles' => '< 5 mg/kg',
                'viscosity_grade' => 'Coolant Concentrate (Green / Pink)',
                'flash_point' => '118°C',
                'oem_approvals' => 'Tata Motors, Ashok Leyland, BharatBenz, Cummins 90T8-4, Detroit Diesel',
                'features_json' => json_encode([
                    'Protects aluminum cylinder heads and copper radiator cores from electrolytic corrosion',
                    'Extended service life up to 5,00,000 km or 5 years without additive replenishment',
                    'High boiling point protection up to 128°C under 15 psi radiator cap pressure'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => $prodGreaseId,
                'category_id' => $catCoolId,
                'name' => 'UltraBlue+ DuraGrease MP-3 Premium Lithium Complex High-Temp EP Grease',
                'slug' => 'ultrablue-duragrease-mp3',
                'description' => 'Multi-purpose lithium complex extreme pressure grease with high drop point (>260°C) engineered for heavy truck wheel bearings, chassis shackles, and universal joints.',
                'image_url' => 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
                'badge' => 'NLGI 3 • Drop Point 260°C+',
                'offer_tag' => '★ Buy 20kg Pail & Get Free Grease Gun Kit',
                'offer_discount' => '10% OFF',
                'hsn_code' => '27101980',
                'gst_rate' => 18.00,
                'iso_standard' => 'IS 7623:1993 / DIN 51825 KP3N-30',
                'is_isi_marked' => true,
                'is_bis_compliant' => true,
                'isi_number' => 'IS 7623:1993 (CM/L-8172930)',
                'bis_licence' => 'CM/L-8172930',
                'urea_content' => 'Lithium 12-Hydroxystearate',
                'density' => '0.910 g/cm³',
                'metals' => 'EP Additized',
                'insolubles' => 'N/A',
                'viscosity_grade' => 'NLGI Grade 3 (Base Oil 220 cSt @ 40°C)',
                'flash_point' => '> 240°C',
                'oem_approvals' => 'SKF Bearing Recommended, Timken Wheel Bearing Approved, Tata Motors, Ashok Leyland',
                'features_json' => json_encode([
                    'Extraordinary water washout resistance (<2.5%) during rainy season transit',
                    'Drop point above 260°C prevents grease bleeding in heavy brake drum heat',
                    'Excellent mechanical stability under severe road vibration and heavy axle loads'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        $var20LId = (string) Str::uuid();
        $var210LId = (string) Str::uuid();
        $var1000LId = (string) Str::uuid();

        DB::table('product_pack_variants')->insert([
            // DEF Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodDefId, 'sku' => 'UB-DEF-5L', 'pack_size' => '5L Can', 'volume_in_litres' => 5.00, 'standard_mrp' => 340.00, 'distributor_base_price' => 260.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => $var20LId, 'product_id' => $prodDefId, 'sku' => 'UB-DEF-20L', 'pack_size' => '20L Bucket', 'volume_in_litres' => 20.00, 'standard_mrp' => 1150.00, 'distributor_base_price' => 880.00, 'is_popular' => true, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodDefId, 'sku' => 'UB-DEF-26L', 'pack_size' => '26L Fleet Pack', 'volume_in_litres' => 26.00, 'standard_mrp' => 1480.00, 'distributor_base_price' => 1140.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => $var210LId, 'product_id' => $prodDefId, 'sku' => 'UB-DEF-210L', 'pack_size' => '210L Drum', 'volume_in_litres' => 210.00, 'standard_mrp' => 10500.00, 'distributor_base_price' => 8200.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => $var1000LId, 'product_id' => $prodDefId, 'sku' => 'UB-DEF-1000L', 'pack_size' => '1000L IBC Tote', 'volume_in_litres' => 1000.00, 'standard_mrp' => 42000.00, 'distributor_base_price' => 33500.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodDefId, 'sku' => 'UB-DEF-BULK', 'pack_size' => 'Bulk Tanker (KL)', 'volume_in_litres' => 10000.00, 'standard_mrp' => 380000.00, 'distributor_base_price' => 295000.00, 'is_popular' => false, 'created_at' => now()],

            // Hydraulic H-68 Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodHyd68Id, 'sku' => 'UB-HYD-68-20L', 'pack_size' => '20L Bucket', 'volume_in_litres' => 20.00, 'standard_mrp' => 3400.00, 'distributor_base_price' => 2720.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodHyd68Id, 'sku' => 'UB-HYD-68-210L', 'pack_size' => '210L Drum', 'volume_in_litres' => 210.00, 'standard_mrp' => 32500.00, 'distributor_base_price' => 26000.00, 'is_popular' => true, 'created_at' => now()],

            // Hydraulic H-46 Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodHyd46Id, 'sku' => 'UB-HYD-46-20L', 'pack_size' => '20L Bucket', 'volume_in_litres' => 20.00, 'standard_mrp' => 3350.00, 'distributor_base_price' => 2680.00, 'is_popular' => true, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodHyd46Id, 'sku' => 'UB-HYD-46-210L', 'pack_size' => '210L Drum', 'volume_in_litres' => 210.00, 'standard_mrp' => 31900.00, 'distributor_base_price' => 25500.00, 'is_popular' => false, 'created_at' => now()],

            // Engine Oil 15W-40 Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodEng15w40Id, 'sku' => 'UB-ENG-15W40-5L', 'pack_size' => '5L Can', 'volume_in_litres' => 5.00, 'standard_mrp' => 1450.00, 'distributor_base_price' => 1150.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodEng15w40Id, 'sku' => 'UB-ENG-15W40-20L', 'pack_size' => '20L Bucket', 'volume_in_litres' => 20.00, 'standard_mrp' => 4950.00, 'distributor_base_price' => 3900.00, 'is_popular' => true, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodEng15w40Id, 'sku' => 'UB-ENG-15W40-210L', 'pack_size' => '210L Drum', 'volume_in_litres' => 210.00, 'standard_mrp' => 46000.00, 'distributor_base_price' => 36800.00, 'is_popular' => false, 'created_at' => now()],

            // Gear Oil 80W-90 Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodGearId, 'sku' => 'UB-GEAR-80W90-5L', 'pack_size' => '5L Can', 'volume_in_litres' => 5.00, 'standard_mrp' => 1550.00, 'distributor_base_price' => 1220.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodGearId, 'sku' => 'UB-GEAR-80W90-20L', 'pack_size' => '20L Bucket', 'volume_in_litres' => 20.00, 'standard_mrp' => 5200.00, 'distributor_base_price' => 4150.00, 'is_popular' => true, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodGearId, 'sku' => 'UB-GEAR-80W90-210L', 'pack_size' => '210L Drum', 'volume_in_litres' => 210.00, 'standard_mrp' => 48500.00, 'distributor_base_price' => 38800.00, 'is_popular' => false, 'created_at' => now()],

            // Coolant Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodCoolId, 'sku' => 'UB-COOL-OAT-5L', 'pack_size' => '5L Can', 'volume_in_litres' => 5.00, 'standard_mrp' => 1100.00, 'distributor_base_price' => 850.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodCoolId, 'sku' => 'UB-COOL-OAT-20L', 'pack_size' => '20L Bucket', 'volume_in_litres' => 20.00, 'standard_mrp' => 3800.00, 'distributor_base_price' => 2950.00, 'is_popular' => true, 'created_at' => now()],

            // Grease Pack Variants
            ['id' => (string) Str::uuid(), 'product_id' => $prodGreaseId, 'sku' => 'UB-GREASE-MP3-5KG', 'pack_size' => '5kg Tub', 'volume_in_litres' => 5.00, 'standard_mrp' => 1650.00, 'distributor_base_price' => 1280.00, 'is_popular' => false, 'created_at' => now()],
            ['id' => (string) Str::uuid(), 'product_id' => $prodGreaseId, 'sku' => 'UB-GREASE-MP3-18KG', 'pack_size' => '18kg Pail', 'volume_in_litres' => 18.00, 'standard_mrp' => 5400.00, 'distributor_base_price' => 4200.00, 'is_popular' => true, 'created_at' => now()]
        ]);

        // 3.1 SEED DYNAMIC PROMOTIONS & PUSH OFFERS
        DB::table('promotions')->insert([
            [
                'id' => (string) Str::uuid(),
                'title' => '⚡ Monsoon Fleet Special: Flat 12% Off on DEF 20L',
                'description' => 'Direct factory pricing on minimum 20 buckets orders. Free spill-proof flexible dispensing spout included with every bucket.',
                'badge' => 'Limited Fleet Deal',
                'promo_code' => 'MONSOON12',
                'discount_percent' => '12%',
                'target_product' => 'UltraBlue+ DEF (20L Bucket)',
                'is_active' => true,
                'created_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'title' => '🛢️ Hydraulic Oil Bulk Drum Combo: Free 18kg MP-3 Grease Pail',
                'description' => 'Order 2x 210L HydroMax H-68 or H-46 drums and receive 1x UltraBlue+ DuraGrease MP-3 18kg heavy chassis grease pail complimentary.',
                'badge' => 'Industrial Combo',
                'promo_code' => 'HYDCOMBO',
                'discount_percent' => 'Free Grease Pail',
                'target_product' => 'HydroMax H-68 Hydraulic Oil (210L Drum)',
                'is_active' => true,
                'created_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'title' => '🚚 Express 24-Hour Tanker Dispatch Live',
                'description' => 'Dedicated SS-316 insulated road tankers now operating daily across Odisha, West Bengal, and Jharkhand mining hubs.',
                'badge' => 'Logistics Update',
                'promo_code' => 'TANKER24',
                'discount_percent' => 'Factory Rate',
                'target_product' => 'Bulk DEF SS-316 Tanker',
                'is_active' => true,
                'created_at' => now()
            ]
        ]);

        // 4. INVENTORY BATCHES
        DB::table('inventory_batches')->insert([
            [
                'id' => (string) Str::uuid(),
                'location_id' => $locBhadrakId,
                'variant_id' => $var20LId,
                'batch_number' => 'UB-26H-882',
                'mfg_date' => '2026-07-15',
                'expiry_date' => '2027-07-15',
                'available_stock' => 480,
                'reserved_stock' => 40,
                'min_threshold' => 100,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'location_id' => $locKolkataId,
                'variant_id' => $var20LId,
                'batch_number' => 'UB-26G-412',
                'mfg_date' => '2026-06-10',
                'expiry_date' => '2027-06-10',
                'available_stock' => 18,
                'reserved_stock' => 10,
                'min_threshold' => 50,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // 5. DISTRIBUTOR PROFILES
        DB::table('distributor_profiles')->insert([
            [
                'id' => (string) Str::uuid(),
                'company_name' => 'Nayak Fleet Spares & Logistics',
                'contact_person' => 'Santosh Nayak',
                'phone' => '+91 94371 88290',
                'email' => 'nayak.spares@gmail.com',
                'gstin' => '21AABCN1234F1Z8',
                'territory_city' => 'Bhadrak',
                'territory_state' => 'Odisha',
                'discount_tier' => 'Authorized Partner',
                'credit_limit' => 500000.00,
                'account_status' => 'APPROVED',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'company_name' => 'Utkal Freightways & Mining Depot',
                'contact_person' => 'Ranjan Pattnaik',
                'phone' => '+91 99370 12894',
                'email' => 'utkal.freight@gmail.com',
                'gstin' => '21AADCU9012K1Z9',
                'territory_city' => 'Jajpur Road',
                'territory_state' => 'Odisha',
                'discount_tier' => 'Pending Verification',
                'credit_limit' => 0.00,
                'account_status' => 'PENDING_REVIEW',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }
}
