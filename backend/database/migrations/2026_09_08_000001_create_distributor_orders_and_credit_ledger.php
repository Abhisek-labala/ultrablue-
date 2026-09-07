<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Distributor Orders Table
        if (!Schema::hasTable('distributor_orders')) {
            Schema::create('distributor_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('order_number', 60)->unique();
                $table->uuid('distributor_id')->nullable();
                $table->string('distributor_name', 150);
                $table->string('distributor_company', 200);
                $table->string('distributor_phone', 20);
                $table->string('distributor_email', 150)->nullable();
                $table->string('distributor_gstin', 25)->nullable();
                $table->string('delivery_city', 100)->nullable();
                $table->string('delivery_state', 100)->nullable();
                $table->decimal('total_estimated_value', 14, 2)->default(0.00);
                $table->string('status', 50)->default('PENDING_ADMIN_APPROVAL'); // PENDING_ADMIN_APPROVAL, APPROVED, REJECTED, CONVERTED_TO_INVOICE, CANCELLED
                $table->text('order_notes')->nullable();
                $table->text('admin_notes')->nullable();
                $table->string('approved_by', 100)->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->uuid('invoice_id')->nullable();
                $table->string('invoice_number', 60)->nullable();
                $table->timestamps();

                $table->foreign('distributor_id')->references('id')->on('distributor_profiles')->onDelete('set null');
            });
        }

        // 2. Distributor Order Items Table
        if (!Schema::hasTable('distributor_order_items')) {
            Schema::create('distributor_order_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('order_id');
                $table->uuid('variant_id')->nullable();
                $table->string('sku', 60);
                $table->string('product_name', 150);
                $table->string('pack_size', 100)->nullable();
                $table->integer('quantity');
                $table->decimal('unit_price', 12, 2)->default(0.00);
                $table->decimal('line_total', 14, 2)->default(0.00);
                $table->timestamps();

                $table->foreign('order_id')->references('id')->on('distributor_orders')->onDelete('cascade');
                $table->foreign('variant_id')->references('id')->on('product_pack_variants')->onDelete('set null');
            });
        }

        // 3. Add outstanding_credit to distributor_profiles if not exists
        if (Schema::hasTable('distributor_profiles')) {
            Schema::table('distributor_profiles', function (Blueprint $table) {
                if (!Schema::hasColumn('distributor_profiles', 'outstanding_credit')) {
                    $table->decimal('outstanding_credit', 14, 2)->default(0.00)->after('credit_limit');
                }
            });
        }

        // 4. Add columns to invoices for distributor credit tracking
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('invoices', 'distributor_id')) {
                    $table->uuid('distributor_id')->nullable()->after('customer_phone');
                    $table->foreign('distributor_id')->references('id')->on('distributor_profiles')->onDelete('set null');
                }
                if (!Schema::hasColumn('invoices', 'distributor_order_id')) {
                    $table->uuid('distributor_order_id')->nullable()->after('distributor_id');
                }
                if (!Schema::hasColumn('invoices', 'paid_amount')) {
                    $table->decimal('paid_amount', 14, 2)->default(0.00)->after('grand_total');
                }
                if (!Schema::hasColumn('invoices', 'credit_amount')) {
                    $table->decimal('credit_amount', 14, 2)->default(0.00)->after('paid_amount');
                }
            });
        }

        // 5. Distributor Credit Transactions (Ledger & Settlements)
        if (!Schema::hasTable('distributor_credit_transactions')) {
            Schema::create('distributor_credit_transactions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('distributor_id');
                $table->uuid('invoice_id')->nullable();
                $table->string('type', 30); // 'DEBIT_INVOICE', 'CREDIT_SETTLEMENT'
                $table->decimal('amount', 14, 2);
                $table->decimal('balance_after', 14, 2)->default(0.00);
                $table->string('payment_method', 50)->default('CREDIT'); // UPI, NEFT, RTGS, CHEQUE, CASH, CREDIT
                $table->string('reference_no', 100)->nullable(); // UTR / Cheque / Invoice number
                $table->text('notes')->nullable();
                $table->string('recorded_by', 100)->nullable();
                $table->timestamps();

                $table->foreign('distributor_id')->references('id')->on('distributor_profiles')->onDelete('cascade');
                $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('distributor_credit_transactions');
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (Schema::hasColumn('invoices', 'distributor_id')) {
                    $table->dropForeign(['distributor_id']);
                    $table->dropColumn(['distributor_id', 'distributor_order_id', 'paid_amount', 'credit_amount']);
                }
            });
        }
        if (Schema::hasTable('distributor_profiles')) {
            Schema::table('distributor_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('distributor_profiles', 'outstanding_credit')) {
                    $table->dropColumn('outstanding_credit');
                }
            });
        }
        Schema::dropIfExists('distributor_order_items');
        Schema::dropIfExists('distributor_orders');
    }
};
