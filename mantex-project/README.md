# Mantex - Field Service Management Platform

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Database Schema](#database-schema)
- [API Integrations](#api-integrations)
- [Storage Structure](#storage-structure)
- [Design System](#design-system)
- [User Roles & Permissions](#user-roles--permissions)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

Mantex is a comprehensive field service management (FSM) platform designed for the Mexican market. The platform connects three key stakeholders:

- **Clients**: Hotels, offices, and commercial properties requesting maintenance services
- **Suppliers/Technicians**: Service providers offering specialized maintenance (plumbing, electrical, HVAC, etc.)
- **Administrators**: Platform operators managing approvals, operations, and system oversight

### Key Features

- Multi-role authentication and authorization system
- Real-time job assignment and tracking via Firebase
- Supplier identity verification via Nubarium API
- Document management with AWS S3
- Mobile-first technician interface (iOS/Android)
- Web-based admin and client portals
- Real-time chat for ticket communication
- Push notifications (APNs/FCM)
- Google Maps integration for routing

---

## Architecture

### System Components

```
┌─────────────────┐         ┌──────────────────┐
│  Mobile App     │◄────────┤  Firebase RTDB   │
│  (Ionic/Vue)    │         │  (Jobs, Chat)    │
└────────┬────────┘         └──────────────────┘
         │
         │ REST API
         ▼
┌─────────────────┐         ┌──────────────────┐
│  Web Portal     │◄────────┤  Supabase        │
│  (Vue/PrimeVue) │         │  (PostgreSQL)    │
└────────┬────────┘         └──────────────────┘
         │
         │ Lambda Proxy
         ▼
┌─────────────────┐         ┌──────────────────┐
│  AWS Lambda     │◄────────┤  AWS S3          │
│  (Serverless)   │         │  (Documents)     │
└────────┬────────┘         └──────────────────┘
         │
         │ HTTP
         ▼
┌─────────────────┐
│  Nubarium API   │
│  (Verification) │
└─────────────────┘
```

### Data Flow

1. **Authentication**: Supabase Auth (JWT tokens)
2. **Real-time Updates**: Firebase Realtime Database
3. **Persistent Data**: Supabase PostgreSQL with Row Level Security (RLS)
4. **File Storage**: AWS S3 via Lambda proxy
5. **Identity Verification**: Nubarium API via Lambda proxy

---

## Technology Stack

### Mobile Application (`mantex-mobile/`)

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 + Ionic 7 + Capacitor 5 |
| Build Tool | Vite 4 |
| State Management | Vue Composition API |
| Database | Supabase (PostgreSQL) + Firebase Realtime Database |
| Authentication | Supabase Auth |
| Storage | AWS S3 (via Lambda) |
| Push Notifications | Firebase Cloud Messaging |
| Maps | Google Maps API |
| Platforms | iOS (primary), Android (future) |

### Web Portal (`sakai-vue/`)

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 + PrimeVue 3 |
| Template | Sakai Admin Template |
| Build Tool | Vite 4 |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| UI Components | PrimeVue, PrimeIcons |
| Charts | Chart.js |

### Backend Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| Database | Supabase (PostgreSQL) | Primary data store with RLS |
| Real-time | Firebase Realtime Database | Jobs, chat, live updates |
| Serverless | AWS Lambda | API proxies, file operations |
| Storage | AWS S3 | Document and image storage |
| API Gateway | AWS API Gateway | Lambda endpoints |
| Identity Verification | Nubarium | Mexican ID/RFC validation |

---

## Project Structure

```
mantex-project/
├── mantex-mobile/              # Ionic/Capacitor mobile app
│   ├── src/
│   │   ├── views/              # Page components
│   │   │   ├── client/         # Client-specific views
│   │   │   ├── technician/     # Technician views (Tab1, Tab2)
│   │   │   └── shared/         # Shared views
│   │   ├── components/         # Reusable UI components
│   │   ├── composables/        # Business logic composables
│   │   │   ├── useAuth.js
│   │   │   ├── useFirebaseJobs.js
│   │   │   ├── useFirebaseChat.js
│   │   │   ├── useClientTickets.js
│   │   │   └── usePermissions.js
│   │   ├── router/             # Vue Router configuration
│   │   ├── assets/
│   │   │   └── styles/
│   │   │       └── mantex-standards.scss  # Design system
│   │   └── lib/                # Utilities
│   ├── ios/                    # iOS native project
│   ├── android/                # Android native project
│   ├── capacitor.config.ts     # Capacitor configuration
│   ├── .env                    # Environment variables (gitignored)
│   └── package.json
│
├── sakai-vue/                  # PrimeVue admin/web portal
│   ├── src/
│   │   ├── views/
│   │   │   ├── admin/          # Admin dashboards
│   │   │   ├── client/         # Client web portal
│   │   │   ├── supplier/       # Supplier web portal
│   │   │   └── onboarding/     # Supplier onboarding flow
│   │   ├── components/         # Reusable components
│   │   ├── lib/
│   │   │   ├── supabaseClient.js
│   │   │   └── nubariumService.js
│   │   └── router/
│   ├── database/               # SQL migrations
│   │   ├── mantex-core-system.sql
│   │   ├── add_created_by_to_tickets.sql
│   │   ├── make_location_address_nullable.sql
│   │   └── create_notification_subscriptions.sql
│   ├── lambda/                 # AWS Lambda functions
│   │   ├── serverless.yml      # Serverless Framework config
│   │   ├── nubarium-proxy-lambda.js
│   │   ├── s3-upload-lambda.js
│   │   ├── s3-delete-lambda.js
│   │   └── s3-list-lambda.js
│   ├── .env                    # Environment variables (gitignored)
│   └── package.json
│
├── AI.md                       # AI context documentation
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Xcode 14+ (for iOS development)
- Android Studio (for Android development)
- AWS CLI (for Lambda deployment)
- Serverless Framework CLI

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/mikerai/Resume.git
cd Resume/mantex-project
cd mantex-project
```

#### 2. Install Mobile App Dependencies

```bash
cd mantex-mobile
npm install
```

#### 3. Install Web Portal Dependencies

```bash
cd ../sakai-vue
npm install
```

#### 4. Configure Environment Variables

Create `.env` files in both `mantex-mobile/` and `sakai-vue/` directories (see [Environment Variables](#environment-variables) section).

#### 5. Run Database Migrations

Execute SQL files in `sakai-vue/database/` in the Supabase SQL Editor in this order:

1. `mantex-core-system.sql`
2. `add_created_by_to_tickets.sql`
3. `make_location_address_nullable.sql`
4. `create_notification_subscriptions.sql`

---

## Environment Variables

### Mobile App (`.env` in `mantex-mobile/`)

```bash
# Supabase
VITE_SUPABASE_URL=https://kdohbawwpcjyiyjgjzow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkb2hiYXd3cGNqeWl5amdqem93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTk2NDcsImV4cCI6MjA3ODg3NTY0N30.HlYZXCqYcUCa5Qiuwp3YqqIboUks11ljMdNQ-HWVabg
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkb2hiYXd3cGNqeWl5amdqem93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTk2NDcsImV4cCI6MjA3ODg3NTY0N30.HlYZXCqYcUCa5Qiuwp3YqqIboUks11ljMdNQ-HWVabg

# Firebase (Already Configured)
VITE_FIREBASE_API_KEY=AIzaSyBGz387mS954FeNqQWiK3eCWJgatm1W0-0
VITE_FIREBASE_AUTH_DOMAIN=mantex-production-1cd9d.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://mantex-production-1cd9d-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=mantex-production-1cd9d
VITE_FIREBASE_STORAGE_BUCKET=mantex-production-1cd9d.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=296798262114
VITE_FIREBASE_APP_ID=1:296798262114:web:abcdefghijklmnop
VITE_FIREBASE_VAPID_KEY=BMiffToTzycBHCUjBn27VlyV7ZFBfc68gvv30BkgofmIKjoxtTFwpDnuqdS_1HVVdelfd24sy2YOWfjaJ2IF8O0

# AWS Lambda Endpoints
VITE_LAMBDA_S3_UPLOAD_URL=https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/upload
VITE_LAMBDA_S3_DELETE_URL=https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/delete
VITE_LAMBDA_S3_LIST_URL=https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/list

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Web Portal (`.env` in `sakai-vue/`)

```bash
# Supabase
VITE_SUPABASE_URL=https://kdohbawwpcjyiyjgjzow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkb2hiYXd3cGNqeWl5amdqem93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTk2NDcsImV4cCI6MjA3ODg3NTY0N30.HlYZXCqYcUCa5Qiuwp3YqqIboUks11ljMdNQ-HWVabg
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkb2hiYXd3cGNqeWl5amdqem93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTk2NDcsImV4cCI6MjA3ODg3NTY0N30.HlYZXCqYcUCa5Qiuwp3YqqIboUks11ljMdNQ-HWVabg

# Firebase (Same as mobile)
VITE_FIREBASE_API_KEY=AIzaSyBGz387mS954FeNqQWiK3eCWJgatm1W0-0
VITE_FIREBASE_AUTH_DOMAIN=mantex-production-1cd9d.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://mantex-production-1cd9d-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=mantex-production-1cd9d
VITE_FIREBASE_STORAGE_BUCKET=mantex-production-1cd9d.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=296798262114
VITE_FIREBASE_APP_ID=1:296798262114:web:abcdefghijklmnop

# Nubarium Proxy
VITE_NUBARIUM_PROXY_URL=https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Lambda Environment (in `serverless.yml`)

```yaml
environment:
  AWS_S3_BUCKET: mantex-documents-1763361307
  NUBARIUM_USERNAME: mantex
  NUBARIUM_PASSWORD: M#tifk_#c
```

---

## Development

### Mobile App

#### Run in Browser (Development)

```bash
cd mantex-mobile
npm run dev
```

Access at `http://localhost:5173`

#### Run on iOS Simulator

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Then run from Xcode (Cmd+R)

#### Run on Android Emulator

```bash
npm run build
npx cap sync android
npx cap open android
```

Then run from Android Studio

### Web Portal

```bash
cd sakai-vue
npm run dev
```

Access at `http://localhost:5173`

### Lambda Functions

#### Deploy All Functions

```bash
cd sakai-vue/lambda
npm install
serverless deploy
```

#### Deploy Single Function

```bash
serverless deploy function -f nubariumProxy
serverless deploy function -f s3Upload
```

#### View Logs

```bash
serverless logs -f nubariumProxy -t
```

---

## Deployment

### Environments

| Environment | Domain | Purpose |
|-------------|--------|---------|
| Development | localhost:5173 | Local development |
| Staging | dev.mantex.mx | Testing and QA |
| Production | mantex.mx | Live production |

### Mobile App Deployment

#### iOS (App Store)

1. **Prepare Build**
   ```bash
   cd mantex-mobile
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **Configure Xcode**
   - Select Team and Signing Certificate
   - Set Bundle Identifier: `com.mantex.mobile`
   - Increment Version and Build Number

3. **Archive and Upload**
   - Product > Archive
   - Window > Organizer > Upload to App Store

4. **App Store Connect**
   - Create new version
   - Add screenshots and metadata
   - Submit for review

#### Android (Play Store)

1. **Prepare Build**
   ```bash
   cd mantex-mobile
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **Generate Signed APK/AAB**
   - Build > Generate Signed Bundle/APK
   - Select release variant
   - Sign with keystore

3. **Upload to Play Console**
   - Create release in Play Console
   - Upload AAB file
   - Submit for review

### Web Portal Deployment

**Important Notes:**
- All environments (localhost, dev.mantex.mx, mantex.mx) use the **same environment variables and endpoints**
- S3 deployments **do NOT use `--delete` flag**
- CloudFront cache invalidation is handled manually (not automated)

#### Localhost (Development)

```bash
cd sakai-vue
npm run dev
```

Access at `http://localhost:5173`

#### Staging (dev.mantex.mx)

```bash
cd sakai-vue

# Build for development/staging
npm run build:dev
# OR
npm run build

# Deploy to S3 bucket (NO --delete flag)
aws s3 sync dist/ s3://dev.mantex.mx

# Cache invalidation handled manually by admin
```

Access at `https://dev.mantex.mx` or `https://dniy7v7iu5bo4.cloudfront.net`

#### Production (mantex.mx)

**Note:** Production deployment not fully configured yet.

```bash
cd sakai-vue

# Build for production
npm run build:prod

# Deploy to S3 bucket (NO --delete flag)
aws s3 sync dist/ s3://mantex.mx

# Cache invalidation handled manually by admin
```

### Lambda Deployment

#### Deploy to AWS

```bash
cd sakai-vue/lambda

# Deploy all functions
serverless deploy --stage prod

# Deploy specific function
serverless deploy function -f nubariumProxy --stage prod
```

#### Endpoints

After deployment, Serverless Framework will output:

```
endpoints:
  POST - https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/upload
  POST - https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/delete
  GET - https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/list
  ANY - https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/nubarium/{proxy+}
```

---

## Database Schema

### Core Tables

#### `profiles`
User profile information linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'supplier', 'admin')),
  sub_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sub-roles:**
- Admin: `god`, `super_admin`, `manager`
- Client: `owner`, `manager`, `buyer`, `viewer`
- Supplier: `owner`, `manager`, `technician`, `dispatcher`

#### `clients`
Client company information.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `suppliers`
Supplier company information.

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  rfc TEXT UNIQUE,
  services_offered TEXT[],
  coverage_area TEXT[],
  approval_status TEXT DEFAULT 'pending',
  approval_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tickets`
Service requests from clients.

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  supplier_id UUID REFERENCES suppliers(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Baja', 'Media', 'Alta', 'Urgente')),
  status TEXT DEFAULT 'pending',
  location_address TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `supplier_profiles`
Extended supplier verification data from Nubarium.

```sql
CREATE TABLE supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  
  -- INE Validation
  ine_front_url TEXT,
  ine_back_url TEXT,
  ine_validated BOOLEAN DEFAULT false,
  ine_data JSONB,
  
  -- Facial Recognition
  selfie_url TEXT,
  facial_match_score DECIMAL(5,2),
  facial_validated BOOLEAN DEFAULT false,
  
  -- RFC Validation
  rfc_validated BOOLEAN DEFAULT false,
  rfc_validation_data JSONB,
  
  -- Block Lists
  block_list_checked BOOLEAN DEFAULT false,
  block_list_results JSONB,
  
  -- Proof of Address (NEW)
  proof_of_address_type TEXT,
  proof_of_address_name TEXT,
  proof_of_address_street TEXT,
  proof_of_address_colonia TEXT,
  proof_of_address_city TEXT,
  proof_of_address_cp TEXT,
  proof_of_address_validated BOOLEAN DEFAULT false,
  proof_of_address_validation_code TEXT,
  proof_of_address_validated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS enabled. Example policy:

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Clients can view their own tickets
CREATE POLICY "Clients can view own tickets"
ON tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = tickets.client_id
    AND clients.user_id = auth.uid()
  )
);
```

---

## API Integrations

### Nubarium Identity Verification

Nubarium provides Mexican identity verification services. All requests go through the Lambda proxy.

**Base URL:** `https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/nubarium`

**Authentication:** Basic Auth (handled by proxy)
- Username: `mantex`
- Password: `M#tifk_#c`

#### Available Services

##### 1. INE/IFE OCR (ID Card Extraction)

```javascript
// Endpoint
POST /nubarium/ocr/v1/obtener_datos_id

// Request
{
  "imagen_frontal": "base64_string",
  "imagen_trasera": "base64_string"
}

// Response
{
  "status": "OK",
  "nombre": "JUAN PEREZ LOPEZ",
  "curp": "PELJ850101HDFRXN01",
  "fecha_nacimiento": "01/01/1985",
  "domicilio": "CALLE EJEMPLO 123",
  "vigencia": "2025"
}
```

##### 2. Lista Nominal Validation

```javascript
// Endpoint
POST /nubarium/ine/v2/valida_ine

// Request
{
  "cic": "123456789012345678",
  "ocr": "1234567890123"
}

// Response
{
  "status": "OK",
  "vigente": true,
  "mensaje": "INE vigente y válida"
}
```

##### 3. Facial Recognition

```javascript
// Endpoint
POST /nubarium/biometrics/antifraude/reconocimiento_facial

// Request
{
  "imagen_selfie": "base64_string",
  "imagen_identificacion": "base64_string"
}

// Response
{
  "status": "OK",
  "match": true,
  "score": 95.5,
  "mensaje": "Rostros coinciden"
}
```

##### 4. RFC Validation

```javascript
// Endpoint
POST /nubarium/sat/valida_rfc

// Request
{
  "rfc": "PELJ850101ABC"
}

// Response
{
  "status": "OK",
  "valido": true,
  "razon_social": "JUAN PEREZ LOPEZ",
  "regimen_fiscal": "Persona Física"
}
```

##### 5. Proof of Address (NEW)

```javascript
// Endpoint
POST /nubarium/ocr/v2/comprobante_domicilio

// Request
{
  "comprobante": "base64_string"  // JPG, PNG, or PDF
}

// Response
{
  "status": "OK",
  "tipo": "CFE",  // CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI
  "nombre": "JUAN PEREZ LOPEZ",
  "calle": "CALLE EJEMPLO 123",
  "colonia": "CENTRO",
  "ciudad": "CIUDAD DE MEXICO",
  "cp": "06000",
  "fecha": "2024-01-15",
  "cuenta": "1234567890",
  "codigoValidacion": "ABC123"
}
```

##### 6. CFE Validation (NEW)

```javascript
// Endpoint
POST /nubarium/mex/documents/validate-cfe

// Request
{
  "name": "JUAN PEREZ LOPEZ",
  "serviceNumber": "1234567890"
}

// Response
{
  "status": "OK",
  "data": {
    "datos": {
      "rpu": "1234567890",
      "cliente": {
        "nombre": "JUAN PEREZ LOPEZ",
        "calle": "CALLE EJEMPLO 123",
        "colonia": "CENTRO",
        "codigoPostal": "06000",
        "ciudad": "CIUDAD DE MEXICO",
        "estado": "CDMX"
      }
    }
  }
}
```

#### Service Implementation

Located in `sakai-vue/src/lib/nubariumService.js`:

```javascript
import { nubariumService } from '@/lib/nubariumService';

// INE OCR
const ineResult = await nubariumService.extractINEData(ineFrontBase64, ineBackBase64);

// Facial recognition
const faceResult = await nubariumService.compareFaces(selfieBase64, inePhotoBase64);

// RFC validation
const rfcResult = await nubariumService.validateRFC('PELJ850101ABC');

// Proof of address
const proofResult = await nubariumService.validateProofOfAddress(documentBase64);

// CFE validation
const cfeResult = await nubariumService.validateCFE('JUAN PEREZ', '1234567890');
```

### Google Maps API

**API Key:** Configured in `.env` as `VITE_GOOGLE_MAPS_API_KEY`

**Services Used:**
- Geocoding API (address to coordinates)
- Directions API (routing)
- Places API (autocomplete)
- Maps JavaScript API (map display)

### Firebase Realtime Database

**Database URL:** `https://mantex-production-1cd9d-default-rtdb.firebaseio.com/`

**Structure:**

```
firebase/
├── jobs/
│   └── {jobId}/
│       ├── title, description, priority
│       ├── client_id, supplier_id
│       ├── status, scheduled_date
│       └── location
│
├── technician_jobs/
│   └── {assignmentId}/
│       ├── jobId, technicianId
│       ├── status, notes
│       └── timestamps
│
└── chats/
    └── ticket_{ticketId}/
        ├── messages/
        │   └── {messageId}/
        │       ├── sender_id, sender_name
        │       ├── text, timestamp
        │       └── read (boolean)
        ├── lastMessage/
        └── typing/
```

**Usage:**

```javascript
import { useFirebaseJobs } from '@/composables/useFirebaseJobs';
import { useFirebaseChat } from '@/composables/useFirebaseChat';

// Jobs
const { jobs, listenToTechnicianJobs, updateJobStatus } = useFirebaseJobs();
listenToTechnicianJobs(technicianId);

// Chat
const { messages, sendMessage, markAsRead } = useFirebaseChat(ticketId);
await sendMessage('Hello!');
```

---

## Storage Structure

### AWS S3 Bucket: `mantex-documents-1763361307`

#### Directory Structure

```
mantex-documents-1763361307/
└── users/
    └── {username}/
        ├── IDENTIFICACIÓN/
        │   └── ine/
        │       ├── {timestamp}_ine_front.jpg
        │       ├── {timestamp}_ine_back.jpg
        │       └── {timestamp}_selfie.jpg
        │
        ├── DOCUMENTOS EMPRESARIALES/
        │   ├── insurance/
        │   │   ├── {timestamp}_poliza_responsabilidad.pdf
        │   │   └── {timestamp}_seguro_daños.pdf
        │   ├── legal/
        │   │   ├── {timestamp}_acta_constitutiva.pdf
        │   │   ├── {timestamp}_rfc_empresa.pdf
        │   │   └── {timestamp}_poder_notarial.pdf
        │   └── certification/
        │       ├── {timestamp}_titulo_profesional.pdf
        │       └── {timestamp}_certificacion_iso.pdf
        │
        ├── EVIDENCIAS DE TRABAJO/
        │   ├── evidence/
        │   │   ├── {timestamp}_antes_trabajo.jpg
        │   │   ├── {timestamp}_durante_proceso.jpg
        │   │   └── {timestamp}_despues_completado.jpg
        │   ├── receipts/
        │   │   └── {timestamp}_comprobante_materiales.pdf
        │   └── contracts/
        │       └── {timestamp}_contrato_firmado.pdf
        │
        ├── REPORTES Y CONTROL/
        │   ├── reports/
        │   │   └── {timestamp}_reporte_avance.pdf
        │   ├── checklists/
        │   │   └── {timestamp}_checklist_seguridad.pdf
        │   └── inspections/
        │       └── {timestamp}_inspeccion_inicial.pdf
        │
        └── DOCUMENTOS FINANCIEROS/
            ├── invoices/
            │   └── {timestamp}_factura_001.pdf
            ├── payments/
            │   └── {timestamp}_comprobante_pago.pdf
            └── budgets/
                └── {timestamp}_presupuesto_inicial.xlsx
```

#### Upload via Lambda

```javascript
// Upload file
const response = await fetch(VITE_LAMBDA_S3_UPLOAD_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'ine_front.jpg',
    fileContent: base64String,
    contentType: 'image/jpeg',
    folder: 'users/juan_perez/IDENTIFICACIÓN/ine'
  })
});

const { url } = await response.json();
// url: https://mantex-documents-1763361307.s3.amazonaws.com/users/juan_perez/...
```

#### Security

- **User Isolation:** Each user has their own folder
- **Encryption:** AES-256 encryption at rest
- **Access Control:** Pre-signed URLs with expiration
- **Audit Trail:** All uploads logged in database

---

## Design System

### "Deep Ocean Neon" Theme

The Mantex mobile app uses a custom design system inspired by deep ocean aesthetics with neon accents.

**File:** `mantex-mobile/src/assets/styles/mantex-standards.scss`

#### Color Palette

```scss
// Primary Colors
--mantex-primary: #011126;        // Deep ocean blue (backgrounds)
--mantex-surface: #0F3740;        // Surface elements
--mantex-background: #285459;     // Lighter backgrounds
--mantex-secondary: #4A8C8C;      // Secondary elements
--mantex-accent: #5BA6A6;         // Accent/highlights (neon teal)

// Semantic Colors
--mantex-success: #37A667;        // Success states
--mantex-warning: #F2913D;        // Warnings
--mantex-danger: #D9483B;         // Errors/urgent

// Text Colors
--mantex-light: #F2F2F2;          // Primary text on dark
--mantex-text-secondary: rgba(242, 242, 242, 0.6);  // Secondary text
```

#### Typography

```scss
// Font Family
--mantex-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

// Font Sizes
--mantex-text-xs: 12px;
--mantex-text-sm: 14px;
--mantex-text-base: 16px;
--mantex-text-lg: 18px;
--mantex-text-xl: 20px;
--mantex-text-2xl: 24px;
--mantex-text-3xl: 30px;
```

#### Visual Effects

**Glassmorphism:**
```scss
.glass-card {
  background: rgba(15, 55, 64, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(91, 166, 166, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Neon Glow:**
```scss
.neon-accent {
  box-shadow: 0 0 10px rgba(91, 166, 166, 0.5),
              0 0 20px rgba(91, 166, 166, 0.3);
}
```

**Smooth Transitions:**
```scss
.smooth-transition {
  transition: all 250ms ease-out;
}
```

#### Component Classes

```scss
// Buttons
.btn-primary {
  background: var(--mantex-accent);
  color: var(--mantex-primary);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
}

// Cards
.card-mantex {
  background: var(--mantex-surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

// Status Badges
.badge-urgente { background: var(--mantex-danger); }
.badge-alta { background: var(--mantex-warning); }
.badge-media { background: var(--mantex-accent); }
.badge-baja { background: var(--mantex-success); }
```

---

## User Roles & Permissions

### Role Hierarchy

```
Admin
├── god (Flynn - full system access)
├── super_admin (full admin privileges)
└── manager (limited admin access)

Client
├── owner (full company access, financial data)
├── manager (create tickets, manage users)
├── buyer (create tickets only)
└── viewer (read-only access)

Supplier
├── owner (full company access, financials, team)
├── manager (operations, job assignment)
├── technician (field worker, assigned jobs only)
└── dispatcher (assigns jobs, optimizes routes)
```

### Permission Matrix

| Action | Client Owner | Client Manager | Client Buyer | Supplier Owner | Technician | Admin | Flynn |
|--------|--------------|----------------|--------------|----------------|------------|-------|-------|
| Create Ticket | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| View All Tickets | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Assign Technician | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Update Job Status | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approve Supplier | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| View Financials | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Manage Users | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| System Settings | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

### Flynn Mode (God Role)

**Special User:** Mike (m@511.mx)
- **Role:** `admin`
- **Sub-role:** `god`
- **Unique Constraint:** Only one `god` sub-role allowed in the system

**Capabilities:**
- Full access to all features regardless of current grid mode
- Grid switcher to impersonate any role (Admin/Client/Supplier)
- System monitoring tools
- Database explorer
- User impersonation
- API monitoring

**Implementation:**

```javascript
// usePermissions.js
const canCreateTicket = computed(() => {
  if (isFlynn.value || profile.value?.sub_role === 'god') return true;
  // ... other role checks
});
```

### Testing Accounts

| Role | Email | Password | Sub-role |
|------|-------|----------|----------|
| Flynn (God) | m@511.mx | [Contact Admin] | god |
| Admin | admin@mantex.mx | [Contact Admin] | super_admin |
| Client Owner | client@example.com | [Contact Admin] | owner |
| Supplier Owner | supplier@example.com | [Contact Admin] | owner |
| Technician | tech@example.com | [Contact Admin] | technician |

---

## Testing

### Unit Tests

```bash
# Mobile
cd mantex-mobile
npm run test:unit

# Web
cd sakai-vue
npm run test:unit
```

### E2E Tests

```bash
# Mobile
cd mantex-mobile
npm run test:e2e

# Web
cd sakai-vue
npm run test:e2e
```

### Manual Testing Checklist

#### Supplier Onboarding
- [ ] Upload INE front and back
- [ ] Take selfie for facial recognition
- [ ] Upload insurance policy
- [ ] Upload proof of address (CFE/TELMEX/etc.)
- [ ] Verify all validations pass
- [ ] Check admin approval view

#### Ticket Creation
- [ ] Create ticket as client
- [ ] Upload photo evidence
- [ ] Select priority (Baja/Media/Alta/Urgente)
- [ ] Verify ticket appears in dashboard
- [ ] Check Firebase sync

#### Real-time Chat
- [ ] Open ticket chat as client
- [ ] Send message
- [ ] Switch to technician view (Flynn mode)
- [ ] Verify message appears in real-time
- [ ] Test typing indicator
- [ ] Test read receipts

#### Push Notifications
- [ ] Install on physical device
- [ ] Grant notification permissions
- [ ] Create ticket
- [ ] Verify push received
- [ ] Tap notification, verify navigation

---

## Troubleshooting

### Common Issues

#### 1. Firebase Not Initialized

**Error:** "Firebase not initialized"

**Solution:**
```javascript
// Ensure useFirebaseJobs is imported before useFirebaseChat
import { useFirebaseJobs } from '@/composables/useFirebaseJobs';
import { useFirebaseChat } from '@/composables/useFirebaseChat';
```

#### 2. Supabase RLS Blocking Queries

**Error:** "new row violates row-level security policy"

**Solution:**
- Check RLS policies in Supabase dashboard
- Verify user has correct role in `profiles` table
- Ensure `auth.uid()` matches user's ID

#### 3. S3 Upload Fails

**Error:** "S3 upload failed"

**Solution:**
- Check Lambda logs in AWS CloudWatch
- Verify bucket permissions in IAM
- Ensure base64 encoding is correct
- Check CORS configuration on S3 bucket

#### 4. Nubarium 400 Bad Request

**Error:** "Bad Request" on Nubarium calls

**Solution:**
- Check proxy lambda logs
- Verify base64 encoding of images (no data URI prefix)
- Ensure credentials are correct in lambda
- Check Nubarium API documentation for payload format

#### 5. Mobile Build Fails

**Error:** Capacitor sync errors

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Sync platforms
npx cap sync ios
npx cap sync android

# If iOS build fails
cd ios/App
pod install
cd ../..
```

#### 6. Permission Denied for Flynn

**Error:** Flynn mode not granting permissions

**Solution:**
```sql
-- Verify god sub-role in database
SELECT id, email, role, sub_role FROM profiles WHERE email = 'm@511.mx';

-- Should return: role='admin', sub_role='god'
-- If not, update:
UPDATE profiles SET sub_role = 'god' WHERE email = 'm@511.mx';
```

### Debug Mode

Enable debug logging:

```javascript
// In main.js or App.vue
if (import.meta.env.DEV) {
  window.DEBUG = true;
}

// In composables
if (window.DEBUG) {
  console.log('[DEBUG]', data);
}
```

### Support Contacts

- **Technical Lead:** Mike (m@511.mx)
- **Firebase Console:** https://console.firebase.google.com/project/mantex-production-1cd9d
- **Supabase Dashboard:** [Your Supabase Project URL]
- **AWS Console:** https://console.aws.amazon.com (us-east-1)

---

## License

Proprietary - Mantex Platform

---

**Last Updated:** November 23, 2025  
**Version:** 1.0.0  
**Status:** Active Development
