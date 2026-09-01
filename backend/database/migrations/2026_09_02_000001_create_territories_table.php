<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('territories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('state', 100);
            $table->string('city', 100);
            $table->string('region_code', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['state', 'city']);
        });

        // Seed initial database records
        $initialData = [
            'Odisha' => ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Balasore', 'Bhadrak', 'Keonjhar', 'Angul', 'Jharsuguda', 'Jajpur', 'Puri', 'Baripada', 'Paradip', 'Rayagada', 'Dhenkanal', 'Bolangir', 'Bargarh'],
            'West Bengal' => ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol', 'Kharagpur', 'Haldia', 'Bardhaman', 'Malda', 'Hooghly', 'Raniganj'],
            'Jharkhand' => ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Chaibasa', 'Koderma'],
            'Bihar' => ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Begusarai', 'Katihar', 'Chhapra', 'Samastipur'],
            'Chhattisgarh' => ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Raigarh', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur'],
            'Andhra Pradesh' => ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Anantapur', 'Kadapa'],
            'Telangana' => ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar'],
            'Maharashtra' => ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Jalgaon'],
            'Gujarat' => ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Vapi', 'Ankleshwar', 'Morbi', 'Mehsana'],
            'Madhya Pradesh' => ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Singrauli', 'Ratlam'],
            'Uttar Pradesh' => ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Noida', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Meerut'],
            'Delhi NCR' => ['New Delhi', 'North Delhi', 'South Delhi', 'Gurugram', 'Faridabad', 'Noida', 'Greater Noida', 'Ghaziabad'],
            'Tamil Nadu' => ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Hosur', 'Tuticorin'],
            'Karnataka' => ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Davangere'],
            'Rajasthan' => ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar'],
            'Punjab' => ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot'],
            'Haryana' => ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat'],
            'Assam' => ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Bongaigaon'],
            'Uttarakhand' => ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur'],
            'Himachal Pradesh' => ['Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Baddi', 'Kullu'],
            'Goa' => ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
            'Kerala' => ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kollam', 'Thrissur', 'Palakkad', 'Kannur', 'Alappuzha']
        ];

        $records = [];
        $now = now();
        foreach ($initialData as $state => $cities) {
            foreach ($cities as $city) {
                $records[] = [
                    'id' => (string) Str::uuid(),
                    'state' => $state,
                    'city' => $city,
                    'region_code' => strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $state), 0, 3)),
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now
                ];
            }
        }

        DB::table('territories')->insert($records);
    }

    public function down(): void
    {
        Schema::dropIfExists('territories');
    }
};
