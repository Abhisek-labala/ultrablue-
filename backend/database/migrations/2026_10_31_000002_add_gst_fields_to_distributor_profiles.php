<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('distributor_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('distributor_profiles', 'address')) {
                $table->text('address')->nullable();
            }
            if (!Schema::hasColumn('distributor_profiles', 'business_type')) {
                $table->string('business_type', 100)->nullable();
            }
            if (!Schema::hasColumn('distributor_profiles', 'registration_date')) {
                $table->string('registration_date', 50)->nullable();
            }
            if (!Schema::hasColumn('distributor_profiles', 'pan_no')) {
                $table->string('pan_no', 20)->nullable();
            }
            if (!Schema::hasColumn('distributor_profiles', 'pincode')) {
                $table->string('pincode', 20)->nullable();
            }
            if (!Schema::hasColumn('distributor_profiles', 'gst_status')) {
                $table->string('gst_status', 50)->nullable()->default('Active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('distributor_profiles', function (Blueprint $table) {
            $table->dropColumn(['address', 'business_type', 'registration_date', 'pan_no', 'pincode', 'gst_status']);
        });
    }
};

