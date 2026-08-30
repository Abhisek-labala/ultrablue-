# UltraBlue+ Enterprise Platform

**Client:** Ayush Green Energy (Proprietor: Mr. Anil Kumar Nayak, Bhadrak, Odisha)  
**Service Provider:** N&L Tech Solutions (Proprietor: Mr. Abhisek Labala)  
**Contract Reference:** `NLT-QT-2026-0031`

---

## 📁 Clean Decoupled Repository Structure

```
Ultrablueplus/
├── frontend/                     # React 19 + Vite Frontend Application (Port 3000)
│   ├── src/
│   │   ├── components/           # UI Component Library & Layout
│   │   ├── services/api.js       # Real REST API Client
│   │   ├── styles/               # Design Tokens (60/30/10 Ratio)
│   │   └── views/                # 6 Role Portals & Workspaces
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── backend/                      # Laravel 12 REST API Backend (Port 8000)
    ├── app/Http/Controllers/Api/ # REST Controllers (Invoices, Inventory, Distributors, Enquiries)
    ├── config/cors.php           # CORS Configuration for Frontend
    ├── database/
    │   ├── migrations/           # Database Schema Migrations
    │   ├── seeders/              # Ayush Green Energy Initial Dataset
    │   └── schema.sql            # PostgreSQL DDL Reference Schema
    ├── routes/api.php            # 15 Verified REST Endpoints
    └── composer.json
```

---

## 🚀 Running the Project

### 1. Start the Laravel Backend API (Port 8000)
```bash
cd backend
php artisan serve --port=8000
```
* **API Base URL:** `http://127.0.0.1:8000/api/`

### 2. Start the React Frontend Application (Port 3000)
```bash
cd frontend
npm run dev -- --port 3000
```
* **Frontend Web App:** `http://localhost:3000/`
