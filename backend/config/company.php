<?php

return [
    'name' => env('COMPANY_NAME', 'AYUSH GREEN ENERGY'),
    'brand' => env('COMPANY_BRAND_NAME', 'UltraBlue+ Diesel Exhaust Fluid (DEF)'),
    'tagline' => env('COMPANY_TAGLINE', 'High-Purity Genuine DEF & Industrial Lubricants for Fleets'),
    'plant_address' => env('COMPANY_PLANT_ADDRESS', 'At- Charampa, Dist- Bhadrak, Odisha, Pin- 756101, India'),
    'gstin' => env('COMPANY_GSTIN', '21AABCU9603R1ZM'),
    'cin' => env('COMPANY_CIN', 'U23209OR2026PTC048912'),
    'phone' => env('COMPANY_PHONE', '+91 9853675971'),
    'email' => env('COMPANY_EMAIL', 'ayush.greenenergy1@gmail.com'),
    'state' => env('COMPANY_STATE', 'Odisha'),
    'state_code' => env('COMPANY_STATE_CODE', '21'),
    'default_hsn' => env('DEFAULT_HSN_CODE', '31021000'),
    'default_gst_rate' => env('DEFAULT_GST_RATE', 18.00),
    'invoice_prefix' => env('INVOICE_PREFIX', 'INVOICE-'),
    'terms' => [
        'Manufactured strictly adhering to ISO 22241-1 & BIS specifications.',
        'Keep sealed and store between -11°C and 30°C away from direct sunlight.',
        'Electronic GST invoice generated under Section 31 of CGST Act.'
    ]
];
