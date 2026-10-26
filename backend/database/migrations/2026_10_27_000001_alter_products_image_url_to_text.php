<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE products ALTER COLUMN image_url TYPE text');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE products ALTER COLUMN image_url TYPE varchar(500)');
    }
};
