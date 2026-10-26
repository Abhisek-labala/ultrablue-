<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('products')
            ->select('products.*', DB::raw("products.category as category_name"));

        // If public requested, only show active products
        if ($request->boolean('public_only')) {
            $query->where('products.is_active', true);
        }

        $products = $query->orderBy('products.sort_order', 'asc')
            ->orderBy('products.created_at', 'desc')
            ->get();

        foreach ($products as $prod) {
            $prod->pack_variants = DB::table('product_pack_variants')
                ->where('product_id', $prod->id)
                ->get();

            if (!empty($prod->features_json)) {
                $decoded = json_decode($prod->features_json, true);
                $prod->features = is_array($decoded) ? $decoded : [];
            } else {
                $prod->features = [];
            }
        }

        return response()->json(['success' => true, 'data' => $products]);
    }

    public function show($id)
    {
        $product = DB::table('products')
            ->select('products.*', DB::raw("products.category as category_name"))
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
        $categories = DB::table('products')
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->map(function ($cat) {
                return ['id' => $cat, 'name' => $cat];
            });

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'capacity' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:50',
            'short_name' => 'nullable|string|max:100',
            'badge' => 'nullable|string|max:100',
            'best_for' => 'nullable|string',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'default_qty' => 'nullable|string',
            'mrp' => 'nullable|numeric',
            'distributor_price' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'hsn_code' => 'nullable|string',
            'gst_rate' => 'nullable|numeric',
            'features' => 'nullable',
            'pack_variants' => 'nullable|array'
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $productId = (string) Str::uuid();
            $slug = Str::slug($request->input('name')) . '-' . substr($productId, 0, 6);

            // Clean up features list
            $featuresInput = $request->input('features', []);
            if (is_string($featuresInput)) {
                $featuresArray = array_filter(array_map('trim', explode("\n", $featuresInput)));
            } elseif (is_array($featuresInput)) {
                $featuresArray = array_filter(array_map('trim', $featuresInput));
            } else {
                $featuresArray = [];
            }

            $name = $request->input('name');
            $category = strtoupper(trim($request->input('category', 'DEF')));
            $capacity = $request->input('capacity', '');
            $mrp = (float) $request->input('mrp', 0);
            $distributorPrice = (float) $request->input('distributor_price', 0);

            DB::table('products')->insert([
                'id' => $productId,
                'name' => $name,
                'slug' => $slug,
                'category' => $category,
                'capacity' => $capacity,
                'short_name' => $request->input('short_name', $name),
                'badge' => $request->input('badge', ''),
                'best_for' => $request->input('best_for', ''),
                'description' => $request->input('description', $request->input('best_for', '')),
                'image_url' => $request->input('image_url', ''),
                'default_qty' => $request->input('default_qty', ''),
                'mrp' => $mrp,
                'distributor_price' => $distributorPrice,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
                'sort_order' => (int) $request->input('sort_order', 1),
                'hsn_code' => $request->input('hsn_code', '31021000'),
                'gst_rate' => $request->input('gst_rate', 18.00),
                'is_gst_inclusive' => true,
                'features_json' => json_encode(array_values($featuresArray)),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Create matching pack variant for billing compatibility
            $variants = $request->input('pack_variants', []);
            if (empty($variants)) {
                preg_match('/\d+/', $capacity, $matches);
                $litres = !empty($matches[0]) ? (float) $matches[0] : 20.0;
                $variants = [
                    [
                        'sku' => 'UBP-' . strtoupper($category) . '-' . (int)$litres . 'L-' . strtoupper(Str::random(3)),
                        'pack_size' => $name,
                        'volume_in_litres' => $litres,
                        'standard_mrp' => $mrp,
                        'distributor_base_price' => $distributorPrice,
                        'is_popular' => true
                    ]
                ];
            }

            foreach ($variants as $v) {
                $sku = !empty($v['sku']) ? trim($v['sku']) : ('UB-' . strtoupper(Str::random(6)));
                DB::table('product_pack_variants')->insert([
                    'id' => (string) Str::uuid(),
                    'product_id' => $productId,
                    'sku' => $sku,
                    'pack_size' => $v['pack_size'] ?? $name,
                    'volume_in_litres' => $v['volume_in_litres'] ?? 20.0,
                    'standard_mrp' => $v['standard_mrp'] ?? $mrp,
                    'distributor_base_price' => $v['distributor_base_price'] ?? $distributorPrice,
                    'is_popular' => !empty($v['is_popular']),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product successfully configured and saved!',
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

        $fields = [
            'name', 'capacity', 'category', 'short_name', 'badge', 'best_for',
            'description', 'image_url', 'default_qty', 'mrp', 'distributor_price',
            'is_active', 'sort_order', 'hsn_code', 'gst_rate'
        ];

        $updateData = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $request->input($field);
            }
        }

        if ($request->has('features')) {
            $featuresInput = $request->input('features');
            if (is_string($featuresInput)) {
                $featuresArray = array_filter(array_map('trim', explode("\n", $featuresInput)));
            } elseif (is_array($featuresInput)) {
                $featuresArray = array_filter(array_map('trim', $featuresInput));
            } else {
                $featuresArray = [];
            }
            $updateData['features_json'] = json_encode(array_values($featuresArray));
        }

        $updateData['updated_at'] = now();

        DB::table('products')->where('id', $id)->update($updateData);

        // Keep primary pack variant in sync with price/name
        $mrp = $request->has('mrp') ? (float)$request->input('mrp') : null;
        $distPrice = $request->has('distributor_price') ? (float)$request->input('distributor_price') : null;
        if ($mrp !== null || $distPrice !== null) {
            $varUpdate = ['updated_at' => now()];
            if ($mrp !== null) $varUpdate['standard_mrp'] = $mrp;
            if ($distPrice !== null) $varUpdate['distributor_base_price'] = $distPrice;
            if ($request->has('name')) $varUpdate['pack_size'] = $request->input('name');
            DB::table('product_pack_variants')->where('product_id', $id)->limit(1)->update($varUpdate);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully!'
        ]);
    }

    public function toggleStatus($id)
    {
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $newStatus = !$product->is_active;
        DB::table('products')->where('id', $id)->update([
            'is_active' => $newStatus,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => $newStatus ? 'Product is now live on the website!' : 'Product has been hidden from the website.',
            'is_active' => $newStatus
        ]);
    }

    public function destroy($id)
    {
        DB::table('product_pack_variants')->where('product_id', $id)->delete();
        $deleted = DB::table('products')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Product deleted successfully.']);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,svg|max:10240'
        ]);

        $file = $request->file('image');
        $filename = 'prod_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();

        $destinationPath = public_path('uploads/products');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $file->move($destinationPath, $filename);
        $url = url('uploads/products/' . $filename);

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully!',
            'url' => $url,
            'path' => '/uploads/products/' . $filename
        ]);
    }
}
