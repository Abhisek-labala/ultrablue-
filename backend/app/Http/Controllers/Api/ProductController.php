<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        $products = DB::table('products')
            ->join('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->select('products.*', 'product_categories.name as category_name')
            ->orderBy('products.created_at', 'desc')
            ->get();

        foreach ($products as $prod) {
            $prod->pack_variants = DB::table('product_pack_variants')
                ->where('product_id', $prod->id)
                ->get();
            if (!empty($prod->features_json)) {
                $prod->features = json_decode($prod->features_json, true) ?: [];
            } else {
                $prod->features = [];
            }
        }

        return response()->json(['success' => true, 'data' => $products]);
    }

    public function show($id)
    {
        $product = DB::table('products')
            ->join('product_categories', 'products.category_id', '=', 'product_categories.id')
            ->select('products.*', 'product_categories.name as category_name')
            ->where('products.id', $id)
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $product->pack_variants = DB::table('product_pack_variants')->where('product_id', $id)->get();
        $product->features = !empty($product->features_json) ? (json_decode($product->features_json, true) ?: []) : [];
        return response()->json(['success' => true, 'data' => $product]);
    }

    public function categories()
    {
        $categories = DB::table('product_categories')->orderBy('name', 'asc')->get();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $id = (string) Str::uuid();
        $slug = Str::slug($validated['name']);
        
        // Ensure unique slug
        $existing = DB::table('product_categories')->where('slug', $slug)->first();
        if ($existing) {
            $slug = $slug . '-' . substr(Str::uuid(), 0, 4);
        }

        $record = [
            'id' => $id,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? '',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('product_categories')->insert($record);

        return response()->json(['success' => true, 'message' => 'Product category created successfully.', 'data' => $record], 201);
    }

    public function deleteCategory($id)
    {
        // Check if any products exist under this category
        $count = DB::table('products')->where('category_id', $id)->count();
        if ($count > 0) {
            return response()->json(['success' => false, 'message' => "Cannot delete category with $count assigned products."], 422);
        }

        DB::table('product_categories')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted successfully.']);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'category_id' => 'nullable|string',
            'category_name' => 'nullable|string',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'badge' => 'nullable|string',
            'offer_tag' => 'nullable|string',
            'offer_discount' => 'nullable|string',
            'hsn_code' => 'nullable|string',
            'gst_rate' => 'nullable|numeric',
            'is_gst_inclusive' => 'nullable|boolean',
            'iso_standard' => 'nullable|string',
            'is_isi_marked' => 'nullable|boolean',
            'is_bis_compliant' => 'nullable|boolean',
            'isi_number' => 'nullable|string',
            'bis_licence' => 'nullable|string',
            'urea_content' => 'nullable|string',
            'density' => 'nullable|string',
            'metals' => 'nullable|string',
            'viscosity_grade' => 'nullable|string',
            'flash_point' => 'nullable|string',
            'oem_approvals' => 'nullable|string',
            'features' => 'nullable|array',
            'pack_variants' => 'nullable|array'
        ]);

        return DB::transaction(function () use ($request, $validated) {
            // Find or create category
            $categoryId = $request->input('category_id');
            if (!$categoryId && $request->input('category_name')) {
                $catName = $request->input('category_name');
                $catSlug = Str::slug($catName);
                $existingCat = DB::table('product_categories')
                    ->where('name', $catName)
                    ->orWhere('slug', $catSlug)
                    ->first();
                if ($existingCat) {
                    $categoryId = $existingCat->id;
                } else {
                    $categoryId = (string) Str::uuid();
                    DB::table('product_categories')->insert([
                        'id' => $categoryId,
                        'name' => $catName,
                        'slug' => $catSlug,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            if (!$categoryId) {
                $firstCat = DB::table('product_categories')->first();
                $categoryId = $firstCat ? $firstCat->id : (string) Str::uuid();
            }

            $productId = (string) Str::uuid();
            $slug = Str::slug($request->input('name')) . '-' . substr($productId, 0, 8);

            DB::table('products')->insert([
                'id' => $productId,
                'category_id' => $categoryId,
                'name' => $request->input('name'),
                'slug' => $slug,
                'description' => $request->input('description'),
                'image_url' => $request->input('image_url') ?: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
                'badge' => $request->input('badge') ?: 'New Product',
                'offer_tag' => $request->input('offer_tag'),
                'offer_discount' => $request->input('offer_discount'),
                'hsn_code' => $request->input('hsn_code', '31021000'),
                'gst_rate' => $request->input('gst_rate', 18.00),
                'is_gst_inclusive' => $request->has('is_gst_inclusive') ? $request->boolean('is_gst_inclusive') : true,
                'iso_standard' => $request->input('iso_standard', 'ISO 22241-1 / IS 17042'),
                'is_isi_marked' => $request->boolean('is_isi_marked', true),
                'is_bis_compliant' => $request->boolean('is_bis_compliant', true),
                'isi_number' => $request->input('isi_number', 'IS 17042:2018'),
                'bis_licence' => $request->input('bis_licence', 'CM/L-84001923'),
                'urea_content' => $request->input('urea_content', '32.5% ± 0.7%'),
                'density' => $request->input('density', '1.090 g/cm³'),
                'metals' => $request->input('metals', '< 0.05 ppm'),
                'viscosity_grade' => $request->input('viscosity_grade'),
                'flash_point' => $request->input('flash_point'),
                'oem_approvals' => $request->input('oem_approvals', 'Tata Motors, Ashok Leyland, BharatBenz, JCB, Cummins'),
                'features_json' => json_encode($request->input('features', ['Tested in certified laboratory', 'Factory direct pricing', 'ISO / BIS compliant'])),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Add pack variants
            $variants = $request->input('pack_variants', []);
            if (empty($variants)) {
                $variants = [
                    [
                        'sku' => 'UB-' . strtoupper(Str::random(4)) . '-20L',
                        'pack_size' => '20L Bucket',
                        'volume_in_litres' => 20,
                        'standard_mrp' => 1250,
                        'distributor_base_price' => 950,
                        'is_popular' => true
                    ]
                ];
            }

            foreach ($variants as $v) {
                $sku = !empty($v['sku']) ? trim($v['sku']) : ('UB-' . strtoupper(Str::random(6)));
                $existing = DB::table('product_pack_variants')->where('sku', $sku)->first();
                if ($existing) {
                    $sku = $sku . '-' . strtoupper(Str::random(4));
                }

                DB::table('product_pack_variants')->insert([
                    'id' => (string) Str::uuid(),
                    'product_id' => $productId,
                    'sku' => $sku,
                    'pack_size' => $v['pack_size'] ?? '20L Bucket',
                    'volume_in_litres' => $v['volume_in_litres'] ?? 20.0,
                    'standard_mrp' => $v['standard_mrp'] ?? 1250.0,
                    'distributor_base_price' => $v['distributor_base_price'] ?? 950.0,
                    'is_popular' => !empty($v['is_popular']),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product successfully added to database!',
                'product_id' => $productId
            ], 201);
        });
    }

    public function update(Request $request, $id)
    {
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        // Handle category update if provided
        $categoryId = $request->input('category_id');
        if (!$categoryId && $request->input('category_name')) {
            $catName = $request->input('category_name');
            $catSlug = Str::slug($catName);
            $existingCat = DB::table('product_categories')
                ->where('name', $catName)
                ->orWhere('slug', $catSlug)
                ->first();
            if ($existingCat) {
                $categoryId = $existingCat->id;
            } else {
                $categoryId = (string) Str::uuid();
                DB::table('product_categories')->insert([
                    'id' => $categoryId,
                    'name' => $catName,
                    'slug' => $catSlug,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        if ($categoryId) {
            $updateData['category_id'] = $categoryId;
        }

        $fields = [
            'name', 'description', 'image_url', 'badge', 'offer_tag', 'offer_discount',
            'hsn_code', 'gst_rate', 'is_gst_inclusive', 'iso_standard', 'is_isi_marked', 'is_bis_compliant',
            'isi_number', 'bis_licence', 'urea_content', 'density', 'metals',
            'viscosity_grade', 'flash_point', 'oem_approvals'
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $request->input($field);
            }
        }

        if ($request->has('features')) {
            $updateData['features_json'] = json_encode($request->input('features'));
        }

        $updateData['updated_at'] = now();

        DB::table('products')->where('id', $id)->update($updateData);

        // Update pack variants if provided
        if ($request->has('pack_variants') && is_array($request->input('pack_variants'))) {
            DB::table('product_pack_variants')->where('product_id', $id)->delete();
            foreach ($request->input('pack_variants') as $v) {
                $sku = !empty($v['sku']) ? trim($v['sku']) : ('UB-' . strtoupper(Str::random(6)));
                $existing = DB::table('product_pack_variants')->where('sku', $sku)->first();
                if ($existing) {
                    $sku = $sku . '-' . strtoupper(Str::random(4));
                }

                DB::table('product_pack_variants')->insert([
                    'id' => (string) Str::uuid(),
                    'product_id' => $id,
                    'sku' => $sku,
                    'pack_size' => $v['pack_size'] ?? '20L Bucket',
                    'volume_in_litres' => $v['volume_in_litres'] ?? 20.0,
                    'standard_mrp' => $v['standard_mrp'] ?? 1250.0,
                    'distributor_base_price' => $v['distributor_base_price'] ?? 950.0,
                    'is_popular' => !empty($v['is_popular']),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully!'
        ]);
    }

    public function destroy($id)
    {
        $deleted = DB::table('products')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Product deleted from database.']);
    }
}
