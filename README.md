# Gen Baazar — Complete Agricultural Marketplace 🌾🚜🚛

**Gen Baazar** is a modern, responsive, full-stack agricultural marketplace platform connecting **farmers**, **wholesale buyers/merchants**, **agri-input suppliers**, **machinery rental providers**, **transport operators**, and **administrators**.

Built with **React (Vite + TypeScript)**, **Tailwind CSS**, **Node.js + Express**, and **MongoDB + Mongoose** with an automatic resilient embedded database fallback.

---

## 🌟 Key Features

### 1. Currency Strictly in Indian Rupees (₹ / INR)
- Centralized formatting via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- Integer paise & decimal-safe subtotal calculation avoiding IEEE-754 precision issues.
- Server validates all subtotal and grand totals.

### 2. Separation of Price Units & Quantity Units
Agricultural products are sold in distinct units per category rather than standard kilograms alone:
- **Vegetables & Fruits:** ₹26/kg, ₹48/kg (Available: 450 kg)
- **Grains & Pulses:** ₹2,600/quintal (Available: 40 quintal)
- **Seeds:** ₹190/pack (Available: 250 packs)
- **Fertilizers:** ₹780/bag (Available: 90 bags)
- **Equipment:** ₹2,450/piece

### 3. On-Demand Machinery Rentals
- Fleet listings for tractors (Mahindra), combine harvesters (Kubota), and ploughing implements.
- Flexible rental pricing units: **per hour**, **per day**, **per acre**, **per trip**.
- Booking calendar with server-side collision prevention for conflicting reservation dates.

### 4. Farm-to-Mandi Transport Logistics
- Vehicles: Mini Trucks (Tata Ace), Pickups (Mahindra Bolero), Heavy Goods Lorries (Eicher 9T).
- Transparent pricing models: **per km**, **per trip**, **per tonne**, or **custom quotation**.
- In-transit and delivery progress updates.

### 5. Multi-Language (English & Tamil) + Voice Search
- One-click language switcher (`English` ↔ `தமிழ்`) in the top navigation bar.
- Browser SpeechRecognition API with visual listening animations and graceful typed search fallback.

### 6. Role-Based Dashboards & Workspaces
- **Farmer Dashboard:** Product harvest listings, buyer orders, sales earnings in INR, machinery/transport quick finders.
- **Buyer / Merchant Dashboard:** Order history, fulfillment progress, payment tracking.
- **Supplier Dashboard:** Agricultural inputs (certified seeds, bio-fertilizers, knapsack sprayers), safety & regulatory instructions.
- **Machinery Owner Dashboard:** Fleet capacity, incoming farmer booking requests (accept/reject), rental earnings in INR.
- **Transport Provider Dashboard:** Registered vehicles, dispatch requests, quotation submissions.
- **Administrator Dashboard:** Platform KPIs, user account management (suspend/reactivate), complaint moderation.

### 7. Safe Development Mode Payment Gateway
- Simulates an Indian digital payment session (UPI / NetBanking / RuPay) without deducting real bank accounts.
- Order references and server-side payment verification prevent fabricated frontend success tokens.

---

## 👥 Default Demo Accounts (1-Click Instant Login)

All demo accounts come pre-configured in the system. On the `/login` page, you can click any of the **Quick 1-Click Demo Login** buttons:

| Role | Email | Password | Name / Description |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@genbaazar.com` | `password123` | Murugan Selvam (Coimbatore) |
| **Merchant / Buyer** | `buyer@genbaazar.com` | `password123` | Anand Kumar Traders (Koyambedu Mandi) |
| **Agri Supplier** | `supplier@genbaazar.com` | `password123` | Kaveri Agro Supplies (Erode) |
| **Machinery Owner** | `machinery@genbaazar.com` | `password123` | Karthik Raja (Tiruppur Fleet) |
| **Transport Provider** | `transport@genbaazar.com` | `password123` | Selvi Agri Logistics (Salem Hub) |
| **Administrator** | `admin@genbaazar.com` | `admin123` | Platform Admin Console |

---

## 📂 Project Structure

```
gen-baazar/
├── client/                      # Frontend Application (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/          # Navbar, Footer, VoiceSearch, Cards, Modal, Badge
│   │   ├── context/             # AuthContext, CartContext, LanguageContext
│   │   ├── pages/               # Home, Products, ProductDetail, Machinery, Transport,
│   │   │                        # MarketPrices, Cart, Checkout, Login, Register
│   │   │   └── dashboards/      # Farmer, Buyer, Supplier, Machinery, Transport, Admin
│   │   ├── services/            # Axios API client
│   │   ├── types/               # TypeScript interfaces & domain models
│   │   ├── utils/               # Currency INR formatting & Tamil/English translations
│   │   ├── App.tsx              # Router & Protected routes
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── server/                      # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── config/              # MongoDB connection & hybrid store fallback
│   │   ├── controllers/         # Auth, Products, Machinery, Transport, Orders, Admin
│   │   ├── data/                # In-memory hybrid store & rich seed data
│   │   ├── middleware/          # JWT protect, authorizeRoles, upload, errorHandler
│   │   ├── models/              # Mongoose schemas (User, Product, Order, Machinery, etc.)
│   │   ├── routes/              # Express REST routes
│   │   ├── utils/               # INR currency math & agricultural unit taxonomy
│   │   └── server.js            # Express server entry point
│   ├── tests/                   # Automated backend tests (api.test.js)
│   ├── uploads/                 # Uploaded product and machinery images
│   └── package.json
├── .env.example
├── .gitignore
├── package.json                 # Root launcher scripts
└── README.md
```

---

## 🚀 Installation & Running

### Prerequisites
- **Node.js** (v18 or higher; tested on v24)
- **npm** (v9 or higher)
- **MongoDB** *(Optional)*: If MongoDB is running on `127.0.0.1:27017` or configured via `MONGODB_URI` in `server/.env`, Gen Baazar connects to it via Mongoose. If MongoDB is not running, the application **automatically runs seamlessly in resilient embedded mode** with pre-seeded realistic data.

### 1. Install Dependencies
Dependencies for both client and server can be installed:

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
Create `server/.env` based on `.env.example`:

```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gen_baazar
JWT_SECRET=gen_baazar_super_secure_secret_key_2026
CURRENCY=INR
```

### 3. Run Backend Server
```bash
cd server
npm start
```
*Server boots up on `http://localhost:5000`.*

### 4. Run Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
```
*Vite client launches on `http://localhost:5173`.*

---

## 🧪 Automated Testing

To run the automated backend test suite (testing currency calculations, stock validation, separate units, role permissions, and bookings):

```bash
cd server
npm test
```

Expected output:
```
--- STARTING GEN BAAZAR BACKEND AUTOMATED TESTS ---

[TEST 1] Currency & Monetary Calculations:
✓ formatINR(50) -> ₹50.00
✓ calculateSubtotal(25, 4) -> ₹ 100
✓ calculateSubtotal(150, 2) -> ₹ 300
✓ Machinery Tractor rental (800 * 3) -> ₹ 2400
✓ Floating point subtotal 19.99 * 3 -> ₹ 59.97

[TEST 2] Agricultural Category & Unit Validation:
✓ Category unit taxonomy verified successfully

[TEST 3] Database Store and Initial Records:
✓ Loaded 6 default users with 6 distinct roles
✓ Loaded 7 products
✓ All products adhere to separate priceUnit, quantityUnit, and INR currency

[TEST 4] Machinery Listings & Rental Units:
✓ 3 machinery listings validated with proper rental units (hour, acre, etc.)

[TEST 5] Transport Services & Pricing Models:
✓ 3 transport listings verified with valid pricing models

[TEST 6] Market Prices:
✓ 6 market mandi price points verified with source and timestamps

========================================
ALL BACKEND AUTOMATED TESTS PASSED! (6/6)
========================================
```

---

## 🔒 Security & Data Integrity

- Passwords hashed with `bcryptjs` (salt rounds: 10).
- Stateless JWT tokens stored in localStorage and attached to headers (`Authorization: Bearer <token>`).
- Server-side role protection on every mutation (`authorizeRoles('farmer', 'admin')`, etc.).
- Integer-paise rounded financial calculations to prevent floating point drift.
- Cart and checkout stock re-validation on server.

---

## 📄 License
This project is licensed under the ISC License.

