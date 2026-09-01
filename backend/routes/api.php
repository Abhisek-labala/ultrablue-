<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\DistributorController;
use App\Http\Controllers\Api\OperatorController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\TerritoryController;

/*
|--------------------------------------------------------------------------
| UltraBlue+ Enterprise REST API Routes
|--------------------------------------------------------------------------
*/

// Authentication & JWT Endpoints
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Public & Product Endpoints
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/categories', [ProductController::class, 'categories']);
Route::post('/products/categories', [ProductController::class, 'storeCategory']);
Route::delete('/products/categories/{id}', [ProductController::class, 'deleteCategory']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);
Route::post('/enquiries', [EnquiryController::class, 'store']);
Route::post('/distributors/register', [DistributorController::class, 'register']);

// ISO 22241 / BIS Compliance & Pack Registry Endpoints
Route::get('/compliance/parameters', [ComplianceController::class, 'getParameters']);
Route::post('/compliance/parameters', [ComplianceController::class, 'storeParameter']);
Route::delete('/compliance/parameters/{id}', [ComplianceController::class, 'deleteParameter']);

Route::get('/compliance/oem-approvals', [ComplianceController::class, 'getOemApprovals']);
Route::post('/compliance/oem-approvals', [ComplianceController::class, 'storeOemApproval']);
Route::delete('/compliance/oem-approvals/{id}', [ComplianceController::class, 'deleteOemApproval']);

Route::get('/compliance/pack-sizes', [ComplianceController::class, 'getPackSizes']);
Route::post('/compliance/pack-sizes', [ComplianceController::class, 'storePackSize']);
Route::delete('/compliance/pack-sizes/{id}', [ComplianceController::class, 'deletePackSize']);

Route::get('/compliance/batch-certificates', [ComplianceController::class, 'getBatchCertificates']);
Route::post('/compliance/batch-certificates', [ComplianceController::class, 'storeBatchCertificate']);
Route::delete('/compliance/batch-certificates/{id}', [ComplianceController::class, 'deleteBatchCertificate']);

// Dynamic Promotions & Push Notifications
Route::get('/promotions', [PromotionController::class, 'index']);
Route::post('/promotions', [PromotionController::class, 'store']);
Route::delete('/promotions/{id}', [PromotionController::class, 'destroy']);

// Inventory & Multi-Depot Endpoints
Route::get('/inventory', [InventoryController::class, 'index']);
Route::get('/inventory/locations', [InventoryController::class, 'locations']);
Route::post('/inventory/locations', [InventoryController::class, 'storeLocation']);
Route::put('/inventory/locations/{id}', [InventoryController::class, 'updateLocation']);
Route::patch('/inventory/locations/{id}/toggle', [InventoryController::class, 'toggleLocationStatus']);
Route::delete('/inventory/locations/{id}', [InventoryController::class, 'deleteLocation']);
Route::post('/inventory/refill', [InventoryController::class, 'refill']);

// Sales POS Billing Endpoints (Strict Anti-Overbill)
Route::get('/invoices', [InvoiceController::class, 'index']);
Route::post('/invoices/create', [InvoiceController::class, 'store']);
Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);

// Distributor Management
Route::get('/distributors', [DistributorController::class, 'index']);
Route::post('/distributors', [DistributorController::class, 'store']);
Route::put('/distributors/{id}', [DistributorController::class, 'update']);
Route::patch('/distributors/{id}/status', [DistributorController::class, 'updateStatus']);
Route::get('/distributors/pricelist', [DistributorController::class, 'downloadPriceList']);

// Territory & Geographic Locations (Stored in Database)
Route::get('/territories', [TerritoryController::class, 'index']);
Route::post('/territories', [TerritoryController::class, 'store']);
Route::put('/territories/{id}', [TerritoryController::class, 'update']);
Route::delete('/territories/{id}', [TerritoryController::class, 'destroy']);

// Operator Management
Route::get('/operators', [OperatorController::class, 'index']);
Route::post('/operators', [OperatorController::class, 'store']);
Route::patch('/operators/{id}/status', [OperatorController::class, 'updateStatus']);
Route::patch('/operators/{id}/location', [OperatorController::class, 'updateLocation']);
Route::post('/operators/{id}/reset-pin', [OperatorController::class, 'resetPin']);

// Enquiries Management
Route::get('/enquiries', [EnquiryController::class, 'index']);
Route::patch('/enquiries/{id}/status', [EnquiryController::class, 'updateStatus']);

// Aggregated Analytics & Reports
Route::get('/reports/summary', [ReportController::class, 'summary']);

