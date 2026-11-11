<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            if (!Schema::hasColumn('enquiries', 'quoted_price')) {
                $table->decimal('quoted_price', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'quoted_product')) {
                $table->string('quoted_product', 150)->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'valid_until')) {
                $table->date('valid_until')->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'quote_channels')) {
                $table->string('quote_channels', 100)->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'quote_recipient')) {
                $table->string('quote_recipient', 255)->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'reviewed_by')) {
                $table->string('reviewed_by', 150)->nullable();
            }
            if (!Schema::hasColumn('enquiries', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $cols = [
                'quoted_price',
                'quoted_product',
                'valid_until',
                'quote_channels',
                'quote_recipient',
                'rejection_reason',
                'reviewed_by',
                'reviewed_at',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('enquiries', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

