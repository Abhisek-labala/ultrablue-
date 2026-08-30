<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = DB::table('promotions')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $promotions]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'badge' => 'nullable|string',
            'promo_code' => 'nullable|string',
            'discount_percent' => 'nullable|string',
            'target_product' => 'nullable|string'
        ]);

        $id = (string) Str::uuid();
        DB::table('promotions')->insert([
            'id' => $id,
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'badge' => $request->input('badge', 'Live Offer'),
            'promo_code' => $request->input('promo_code'),
            'discount_percent' => $request->input('discount_percent'),
            'target_product' => $request->input('target_product'),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Promotion offer created & broadcasted successfully!',
            'data' => ['id' => $id]
        ], 201);
    }

    public function destroy($id)
    {
        DB::table('promotions')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Promotion removed.']);
    }
}
