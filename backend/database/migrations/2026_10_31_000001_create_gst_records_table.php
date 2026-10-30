<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('gst_records')) {
            Schema::create('gst_records', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('gstin', 20)->unique()->index();
                $table->string('legal_name', 255)->nullable();
                $table->string('trade_name', 255)->nullable();
                $table->string('status', 50)->nullable()->default('Active');
                $table->string('taxpayer_type', 100)->nullable();
                $table->string('state', 100)->nullable();
                $table->string('state_code', 10)->nullable();
                $table->string('district', 150)->nullable();
                $table->text('address')->nullable();
                $table->string('pincode', 20)->nullable();
                $table->string('pan', 20)->nullable();
                $table->string('registration_date', 50)->nullable();
                $table->json('nature_of_business')->nullable();
                $table->string('source', 50)->default('API');
                $table->json('raw_data')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gst_records');
    }
};

