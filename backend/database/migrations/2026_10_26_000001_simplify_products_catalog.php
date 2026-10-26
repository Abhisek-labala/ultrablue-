<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->uuid('category_id')->nullable()->change();
            $table->string('category', 50)->default('DEF')->nullable();
            $table->string('capacity', 100)->nullable();
            $table->string('short_name', 100)->nullable();
            $table->text('best_for')->nullable();
            $table->string('default_qty', 100)->nullable();
            $table->decimal('mrp', 12, 2)->nullable()->default(0);
            $table->decimal('distributor_price', 12, 2)->nullable()->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'capacity',
                'short_name',
                'best_for',
                'default_qty',
                'mrp',
                'distributor_price',
                'is_active',
                'sort_order',
            ]);
        });
    }
};
