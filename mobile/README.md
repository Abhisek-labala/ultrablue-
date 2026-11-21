# UltraBlue+ Mobile Application (Expo Go)

Cross-platform mobile application built with **React Native** and **Expo Go** for **Distributors** and **Sales Operators**, integrated directly with the UltraBlue+ Laravel 12 backend.

---

## 🚀 Quick Start with Expo Go

### 1. Ensure Backend is Running and Accessible
Make sure your Laravel backend is bound to all network interfaces (`0.0.0.0`) so mobile devices on the same Wi-Fi network can connect:

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Start the Expo Dev Server
```bash
cd mobile
npm start
```

### 3. Open on your Phone
1. Download and install **Expo Go** from Google Play Store or Apple App Store.
2. Scan the terminal QR code:
   * **Android**: Open the Expo Go app and tap **"Scan QR code"**.
   * **iOS**: Open the native **Camera** app and tap the Expo notification.

---

## ⚙️ Connecting Phone to Local Backend (Wi-Fi)

On physical mobile devices, `localhost` points to the phone itself.
* Tap the **Server Pill** (`API: http://...`) at the bottom of the Login Screen.
* Enter your computer's local Wi-Fi IPv4 address (e.g. `http://192.168.1.15:8000/api`).
* Tap **Save & Reconnect**. The setting is securely saved on the device.

---

## 👥 Supported Roles & Features

### 1. Sales Operator (`operator@ultrablue.in`)
* **Forecourt POS Billing**: Fast billing by customer phone and vehicle registration plate (with Indian plate validation).
* **Anti-Overbill Protection**: Validates available litres and packed inventory at the operator's assigned depot.
* **Instant Thermal Slip & PDF Sharing**: Uses `expo-print` and `expo-sharing` to generate 58mm/80mm receipts and share directly over WhatsApp.
* **Depot Stock Inspector**: Real-time tank volume and packed inventory monitoring.
* **Shift Reconciliation**: Instant summary of total litres sold, cash collected, and digital/UPI payments.

### 2. Wholesale Distributor (`distributor@ultrablue.in`)
* **Wholesale B2B Catalog**: Browse DEF (20L, 210L Drum, 1000L IBC), coolants, and lubricants with wholesale tiered pricing and GST calculation.
* **Order Requisitions**: Submit bulk orders directly to the plant dispatch team (`POST /api/distributor-orders`).
* **Order Tracking**: Real-time lifecycle tracking (`PENDING` -> `ADMIN_APPROVED` -> `COMPLETED`).
* **Credit Facility & Ledger**: Real-time gauge for total credit limit, utilized balance, and available headroom.
* **Verified Profile**: GSTIN status and plant depot mapping.

---

## 📁 Architecture

```
mobile/
├── App.tsx                     # App entry point (Navigation & Auth Providers)
├── app.json                    # Expo configuration
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance with JWT auto-injection
│   │   └── index.ts            # Auth, Distributor & Operator API calls
│   ├── context/
│   │   └── AuthContext.tsx     # Role-based auth state & secure token storage
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Role switch router
│   │   ├── DistributorNav.tsx  # Distributor bottom tabs
│   │   └── OperatorNav.tsx     # Operator bottom tabs
│   ├── screens/
│   │   ├── auth/LoginScreen.tsx
│   │   ├── distributor/        # Dashboard, Catalog, Orders, Ledger, Profile
│   │   └── operator/           # POS, Stock Check, History, Shift Close, Profile
│   ├── theme/colors.ts         # UltraBlue+ Navy & Electric Blue theme
│   └── utils/receiptGenerator.ts # HTML slip generation & sharing
```
