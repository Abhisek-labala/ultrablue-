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
            'name' => 'required|string|min:2|max:200',
            'capacity' => 'required|string|min:1|max:100',
            'category' => 'required|string|max:50',
            'short_name' => 'nullable|string|max:100',
            'badge' => 'nullable|string|max:100',
            'best_for' => 'nullable|string',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'default_qty' => 'required|string|max:100',
            'mrp' => 'required|numeric|gt:0',
            'distributor_price' => 'required|numeric|gt:0|lte:mrp',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'hsn_code' => 'nullable|string',
            'gst_rate' => 'nullable|numeric',
            'features' => 'nullable',
            'pack_variants' => 'nullable|array'
        ], [
            'name.required' => 'Product name is required.',
            'name.min' => 'Product name must be at least 2 characters.',
            'capacity.required' => 'Packaging capacity is required (e.g. 20 Litres, 210 Litres).',
            'category.required' => 'Please select a packaging category.',
            'default_qty.required' => 'Default quote quantity is required (e.g. 25 Buckets, 1 IBC).',
            'mrp.required' => 'MRP price is required.',
            'mrp.gt' => 'MRP price must be greater than ₹0.',
            'distributor_price.required' => 'B2B wholesale price is required.',
            'distributor_price.gt' => 'B2B wholesale price must be greater than ₹0.',
            'distributor_price.lte' => 'B2B wholesale price cannot be greater than MRP.'
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
        try {
            if (!$request->hasFile('image')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No image file was received by the server. If this file is large, please check PHP upload_max_filesize and post_max_size limits.'
                ], 422);
            }

            $file = $request->file('image');

            if (!$file->isValid()) {
                $uploadErrCode = $file->getError();
                $errMap = [
                    UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize in php.ini.',
                    UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE in form.',
                    UPLOAD_ERR_PARTIAL => 'File was only partially uploaded.',
                    UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary upload directory on server.',
                    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk on server.',
                    UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.'
                ];
                $errMsg = $errMap[$uploadErrCode] ?? 'File upload error code: ' . $uploadErrCode;
                return response()->json([
                    'success' => false,
                    'message' => $errMsg
                ], 422);
            }

            $request->validate([
                'image' => 'required|file|mimes:jpeg,png,jpg,webp,svg,gif,bmp,avif|max:20480'
            ], [
                'image.mimes' => 'The file must be an image of type: PNG, JPG, JPEG, WEBP, SVG, GIF, AVIF.',
                'image.max' => 'The image size cannot exceed 20MB.'
            ]);

            $destinationPath = public_path('uploads/products');
            if (!file_exists($destinationPath)) {
                if (!@mkdir($destinationPath, 0777, true) && !is_dir($destinationPath)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Upload directory could not be created at {$destinationPath}. Please run: chmod -R 777 " . public_path('uploads')
                    ], 500);
                }
            }

            if (!is_writable($destinationPath)) {
                @chmod($destinationPath, 0777);
                if (!is_writable($destinationPath)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Upload directory is not writable. Please run on server: chown -R www-data:www-data " . public_path('uploads') . " && chmod -R 777 " . public_path('uploads')
                    ], 500);
                }
            }

            $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
            $baseName = 'prod_' . time() . '_' . Str::random(8);
            $filename = $baseName . '.' . $extension;

            // Automatically compress & convert images to WebP format if GD library is available
            $shouldConvertToWebP = ($extension !== 'svg') && function_exists('imagewebp') && function_exists('imagecreatefromstring');

            if ($shouldConvertToWebP) {
                try {
                    $rawContents = file_get_contents($file->getRealPath());
                    $imageResource = @imagecreatefromstring($rawContents);

                    if ($imageResource !== false) {
                        imagepalettetotruecolor($imageResource);
                        imagealphablending($imageResource, true);
                        imagesavealpha($imageResource, true);

                        $webpFilename = $baseName . '.webp';
                        $webpFullPath = $destinationPath . DIRECTORY_SEPARATOR . $webpFilename;

                        // Save as compressed WebP with 82% quality
                        $converted = @imagewebp($imageResource, $webpFullPath, 82);
                        @imagedestroy($imageResource);

                        if ($converted && file_exists($webpFullPath)) {
                            $filename = $webpFilename;
                        } else {
                            $file->move($destinationPath, $filename);
                        }
                    } else {
                        $file->move($destinationPath, $filename);
                    }
                } catch (\Throwable $convEx) {
                    $file->move($destinationPath, $filename);
                }
            } else {
                $file->move($destinationPath, $filename);
            }

            // Construct relative path and API URL (routed through /api to avoid SPA HTML fallbacks)
            $relativePath = '/api/products/image/' . $filename;
            $url = url('/api/products/image/' . $filename);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully!',
                'url' => $url,
                'path' => $relativePath
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            $messages = $ve->validator->errors()->all();
            return response()->json([
                'success' => false,
                'message' => implode(' ', $messages),
                'errors' => $ve->validator->errors()
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Upload Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function serveImage($filename)
    {
        $cleanFilename = basename($filename);
        $path = public_path('uploads/products/' . $cleanFilename);

        if (!file_exists($path)) {
            $path = storage_path('app/public/products/' . $cleanFilename);
        }

        if (!file_exists($path)) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        $extension = strtolower(pathinfo($cleanFilename, PATHINFO_EXTENSION));
        $mimeTypes = [
            'webp' => 'image/webp',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml',
            'gif' => 'image/gif'
        ];
        $contentType = $mimeTypes[$extension] ?? (mime_content_type($path) ?: 'image/webp');

        return response()->file($path, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=31536000'
        ]);
    }
}
