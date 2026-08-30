<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. ISO 22241 & BIS Compliance Laboratory Parameters
        Schema::create('compliance_parameters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('prop', 150);
            $table->string('unit', 50)->default('%');
            $table->string('limit', 100);
            $table->string('batch', 100);
            $table->string('method', 150);
            $table->boolean('verified')->default(true);
            $table->timestamps();
        });

        // 2. OEM Manufacturer Approvals
        Schema::create('oem_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('oem', 200);
            $table->string('approval_no', 100);
            $table->string('engine_standard', 150);
            $table->string('valid_date', 50)->default('31-Dec-2027');
            $table->string('status', 50)->default('APPROVED');
            $table->timestamps();
        });

        // 3. Master Packaging Configurations Registry
        Schema::create('pack_sizes_master', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->decimal('volume', 10, 2);
            $table->string('type', 200)->nullable();
            $table->string('handle', 150)->nullable();
            $table->string('tare_weight', 50)->nullable();
            $table->string('nozzle', 150)->nullable();
            $table->string('barcode_prefix', 50)->nullable();
            $table->string('status', 50)->default('ACTIVE');
            $table->timestamps();
        });

        // 4. Batch Quality Certificates
        Schema::create('batch_certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('cert_no', 100);
            $table->string('batch_no', 100);
            $table->string('date', 50);
            $table->string('location', 150);
            $table->string('purity', 100);
            $table->string('density', 100);
            $table->string('chemist', 150);
            $table->string('status', 50)->default('PASSED');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_certificates');
        Schema::dropIfExists('pack_sizes_master');
        Schema::dropIfExists('oem_approvals');
        Schema::dropIfExists('compliance_parameters');
    }
};
