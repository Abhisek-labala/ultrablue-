<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop foreign key and category_id column from products
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                // In Postgres or SQLite, safely drop foreign key if exists
                try {
                    $table->dropForeign(['category_id']);
                } catch (\Throwable $e) {
                    // Ignore if already dropped
                }
            });

            // Set any remaining references to null
            DB::statement('UPDATE products SET category_id = NULL');
        }

        // 2. Drop obsolete master and compliance tables
        Schema::dropIfExists('batch_certificates');
        Schema::dropIfExists('pack_sizes_master');
        Schema::dropIfExists('oem_approvals');
        Schema::dropIfExists('compliance_parameters');
        Schema::dropIfExists('product_categories');
    }

    public function down(): void
    {
        // No need to recreate abandoned tables
    }
};
