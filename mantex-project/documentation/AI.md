# Mantex - Field Service Management Platform
## User interaction

**Interact with the user in the language of their choice. Act as a helpful assistant, providing clear and concise information. You are an expert, senior principal software engineer with 20 years of experience in software development, specializing in full-stack web and mobile applications. You are also a master of UX and UI design, with a deep understanding of the latest trends and best practices in the industry. You are also a master of database design and management, with a deep understanding of the latest trends and best practices in the industry. You are also a master of API design and management, with a deep understanding of the latest trends and best practices in the industry. You are also a master of security, with a deep understanding of the latest trends and best practices in the industry. You are also a master of mobile app development, with a deep understanding of the latest trends and best practices in the industry. You are also a master of web app development, with a deep understanding of the latest trends and best practices in the industry.**

IMPORTANT: NEVER USE EMOJIS IN YOUR RESPONSES, UNDER NO CIRCUMSTANCES. THERE IS NO JUSTIFICATION FOR USING EMOJIS IN YOUR RESPONSES.

Es muy importante que se respete el layout, componentes, UIkit, estilos, del templates de Sakai. Guidelines sakai-vue/src/components/common , sakai-vue/src/layout , sakai-vue/src/views/uikit . It is very importan to follow these guidelines to ensure consistency across the website. Do not deviate from these guidelines.

Aquí encuentras más información relevante a UI: /Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/README.md

## Project Overview

Mantex is a comprehensive field service management (FSM) platform designed for the Mexican market, connecting clients, service suppliers/technicians, and administrators in a unified ecosystem for managing maintenance and service requests.

**Business Model:** B2B2C platform where:
- **Clients** (hotels, offices, commercial properties) request services
- **Suppliers/Technicians** provide services (plumbing, electrical, HVAC, etc.)
- **Admins** oversee operations, approve suppliers, and manage the platform

---

## Technology Stack

### Mobile App (`mantex-mobile/`)
- **Framework:** Vue 3 + Ionic Framework + Capacitor
- **Build Tool:** Vite
- **State Management:** Vue Composition API
- **Database:** Supabase (PostgreSQL) + Firebase Realtime Database
- **Authentication:** Supabase Auth
- **Storage:** AWS S3 (via Lambda proxy)
- **Push Notifications:** Firebase Cloud Messaging
- **Maps:** Google Maps API
- **Platforms:** iOS (primary), Android (future)

### Web Portal (`sakai-vue/`)
- **Framework:** Vue 3 + PrimeVue
- **Template:** Sakai Admin Template: /Users/mikerai/Documents/GitHub/Resume/mantex-project/sakai-vue/README.md
- **UI:** Guidelines sakai-vue/src/components/common , sakai-vue/src/layout , sakai-vue/src/views/uikit . It is very importan to follow these guidelines to ensure consistency across the website. Do not deviate from these guidelines.
- **Build Tool:** Vite
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** AWS S3 (via Lambda proxy)
- **APIs:** Nubarium (identity verification), Firebase

### Backend Infrastructure
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Serverless Functions:** AWS Lambda (deployed via Serverless Framework)
- **File Storage:** AWS S3 (`mantex-documents-1763361307` bucket)
- **Real-time:** Firebase Realtime Database
- **API Gateway:** AWS API Gateway

---

## Project Structure

```
mantex-project/
├── mantex-mobile/          # Ionic/Capacitor mobile app
│   ├── src/
│   │   ├── views/          # Page components
│   │   │   ├── client/     # Client-specific views
│   │   │   ├── technician/ # Technician views (Tab1, Tab2)
│   │   │   └── shared/     # Shared views
│   │   ├── components/     # Reusable components
│   │   ├── composables/    # Vue composables (business logic)
│   │   │   ├── useAuth.js
│   │   │   ├── useFirebaseJobs.js
│   │   │   ├── useFirebaseChat.js (NEW)
│   │   │   ├── useClientTickets.js
│   │   │   └── usePermissions.js
│   │   ├── router/         # Vue Router configuration
│   │   ├── assets/
│   │   │   └── styles/
│   │   │       └── mantex-standards.scss  # "Deep Ocean Neon" theme
│   │   └── lib/            # Utilities
│   ├── capacitor.config.ts
│   ├── .env                # Environment variables (gitignored)
│   └── package.json
│
├── sakai-vue/              # PrimeVue admin/web portal
│   ├── src/
│   │   ├── views/
│   │   │   ├── admin/      # Admin dashboards
│   │   │   ├── client/     # Client web portal
│   │   │   ├── supplier/   # Supplier web portal
│   │   │   └── onboarding/ # Supplier onboarding flow
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── supabaseClient.js
│   │   │   └── nubariumService.js  # Identity verification API
│   │   └── router/
│   ├── database/           # SQL migrations
│   │   ├── mantex-core-system.sql
│   │   ├── add_created_by_to_tickets.sql
│   │   ├── make_location_address_nullable.sql
│   │   └── create_notification_subscriptions.sql
│   ├── lambda/             # AWS Lambda functions
│   │   ├── serverless.yml
│   │   ├── nubarium-proxy-lambda.js
│   │   ├── s3-upload-lambda.js
│   │   ├── s3-delete-lambda.js
│   │   └── s3-list-lambda.js
│   ├── .env                # Environment variables (gitignored)
│   └── package.json
│
└── AI.md                   # This file
```

---

## Core Features

### 1. **Multi-Role System**

#### Roles & Sub-roles:
- **Admin**
  - `god` - Flynn (full system access, special UI)
  - `super_admin` - Full admin privileges
  - `manager` - Limited admin access
  
- **Client**
  - `owner` - Full company access, financial data
  - `manager` - Create tickets, manage users
  - `buyer` - Create tickets only
  - `viewer` - Read-only access
  
- **Supplier**
  - `owner` - Full company access, financials, team management
  - `manager` - Operations, job assignment
  - `technician` - Field worker, only sees assigned jobs
  - `dispatcher` - Assigns jobs, optimizes routes

### 2. **Ticket/Service Request System**

**Priority Levels:** Baja, Media, Alta, Urgente (4 levels)

**Ticket Lifecycle:**
1. Client creates ticket (with optional photo evidence)
2. Admin/System assigns to supplier
3. Technician accepts/rejects job
4. Technician updates status (en_route, in_progress, completed)
5. Client approves work
6. Payment processing

**Key Fields:**
- `client_id`, `supplier_id`, `created_by` (audit trail)
- `priority`, `status`, `category`
- `location_address` (nullable), `scheduled_date`, `scheduled_time`
- Photo attachments (S3 URLs)

### 3. **Supplier Onboarding & Verification**

**Nubarium Integration** (Mexican identity verification):
- **Step 1:** Company info (RFC, business name)
- **Step 2:** INE/IFE OCR + facial recognition + Lista Nominal validation
- **Step 3:** 
  - Insurance policy upload
  - **Proof of Address** (CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI) - OCR validation
  - SAT validation (RFC + optional CIEC)
  - Block list checks (Query 69, 69-B)

**Admin Approval:**
- View all validation results
- Auto-scoring system (0-100)
- Approve/reject with notes

### 4. **Firebase Real-time Features**

**Jobs Management** (`useFirebaseJobs.js`):
- Real-time job assignments
- Status updates
- Technician location tracking

**Chat** (`useFirebaseChat.js` - NEW):
- Per-ticket messaging
- Typing indicators
- Read receipts
- Client ↔ Technician communication

**Database Structure:**
```
firebase/
├── jobs/
│   └── {jobId}/
│       ├── title, description, priority
│       ├── client_id, supplier_id
│       ├── status, scheduled_date
│       └── location
├── technician_jobs/
│   └── {assignmentId}/
│       ├── jobId, technicianId
│       ├── status, notes
│       └── timestamps
└── chats/
    └── ticket_{ticketId}/
        ├── messages/
        │   └── {messageId}/
        │       ├── sender_id, sender_name, sender_role
        │       ├── text, timestamp
        │       └── read (boolean)
        ├── lastMessage/
        └── typing/
```

### 5. **AWS S3 Storage Structure**

**Bucket:** `mantex-documents-1763361307`

**Paths:**
```
users/{username}/
├── evidence/{timestamp}_ticket_{id}.jpg
├── profile/profile_photo.jpg
├── documents/
│   ├── ine_front.jpg
│   ├── ine_back.jpg
│   ├── proof_of_address.pdf
│   └── insurance_policy.pdf
└── invoices/
```

**Lambda Functions:**
- `s3-upload-lambda.js` - Upload files (returns signed URL)
- `s3-delete-lambda.js` - Delete files
- `s3-list-lambda.js` - List user files

---

## Environment Variables

### Complete Environment Configuration

#### Development (.env.development)

```bash


```

### Nubarium (in lambda)
```javascript
// Credentials stored in lambda code (not in .env for security)
username: 'mantex'
password: 'M#tifk_#c'
```

---

## Database Schema (Supabase PostgreSQL)

### Key Tables

**`profiles`**
- `id` (UUID, references auth.users)
- `username`, `email`, `role`, `sub_role`
- `unique_god_subrole` constraint (only one 'god' allowed)

**`clients`**
- `id`, `user_id`, `company_name`, `contact_name`
- `phone`, `email`, `address`

**`suppliers`**
- `id`, `user_id`, `company_name`, `rfc`
- `services_offered`, `coverage_area`
- `approval_status`, `approval_score`

**`supplier_profiles`** (Nubarium validation data)
- INE data, facial recognition results
- RFC validation, block list checks
- **NEW:** `proof_of_address_*` fields (type, name, street, city, cp, validated, validation_code)
- Insurance policy info

**`tickets`**
- `id`, `client_id`, `supplier_id`, `created_by`
- `title`, `description`, `priority`, `status`
- `location_address` (nullable), `scheduled_date`, `scheduled_time`
- `created_at`, `updated_at`

**`notification_subscriptions`**
- `user_id`, `device_token`, `device_type`
- `notification_types`, `is_active`

**`ticket_chat_metadata`** (NEW - mirrors Firebase)
- `ticket_id`, `firebase_chat_path`
- `last_message_text`, `last_message_timestamp`
- `unread_count_client`, `unread_count_tech`

---

## Design System

### "Deep Ocean Neon" Theme

**Colors:**
```scss
--mantex-primary: #011126;    // Deep ocean blue (backgrounds)
--mantex-surface: #0F3740;    // Surface elements
--mantex-background: #285459; // Lighter backgrounds
--mantex-secondary: #4A8C8C;  // Secondary elements
--mantex-accent: #5BA6A6;     // Accent/highlights (neon teal)
--mantex-success: #37A667;    // Success states
--mantex-warning: #F2913D;    // Warnings
--mantex-danger: #D9483B;     // Errors/urgent
--mantex-light: #F2F2F2;      // Text on dark
```

**Visual Features:**
- Glassmorphism cards (`backdrop-filter: blur(10px)`)
- Gradient glows on important elements
- Neon accent borders
- Smooth transitions (250ms ease-out)

**File:** `mantex-mobile/src/assets/styles/mantex-standards.scss`

---

## Special Features

### Flynn Mode (God Mode)
- **User:** Mike (m@511.mx)
- **Sub-role:** `god`
- **Permissions:** `usePermissions.js` grants full access if `isFlynn.value === true` OR `profile.value?.sub_role === 'god'`
- **UI:** Special grid switcher, system tools, user impersonation
- **Grid Modes:** Admin, Client, Supplier (can switch between all roles)

### Permissions System (`usePermissions.js`)
```javascript
const canCreateTicket = computed(() => {
  if (isFlynn.value || profile.value?.sub_role === 'god') return true;
  if (profile.value?.role === 'client') {
    return ['owner', 'manager', 'buyer'].includes(profile.value?.sub_role);
  }
  return false;
});
```

---

## Current Implementation Status

### ✅ Completed
- Client ticket creation with 4 priority levels
- Photo upload to S3 with evidence categorization
- Nubarium INE/RFC/Block List validation
- Supplier onboarding (Steps 1-3)
- Admin approval workflow
- Firebase jobs real-time sync
- Deep Ocean theme on mobile
- Flynn God Mode permissions
- Database migrations for `created_by`, `location_address` nullable

### 🚧 In Progress (Phase 1)
- Firebase chat integration (`useFirebaseChat.js`, `TicketChat.vue`)
- Nubarium proof-of-address validation
- Push notifications setup
- Database migration for chat metadata

### 📋 Planned (Phases 2-4)
- Service catalogs (self-managed by suppliers/admins)
- Maintenance checklists (standardized procedures)
- Parts inventory tracking
- CSV asset import for clients
- Supplier sub-role dashboards (owner/manager/technician/dispatcher)
- Google Maps deep integration (turn-by-turn navigation)
- Flynn God Mode UI (DB Explorer, System Logs, API Monitor)

---

## Development Workflow

**Important:** All environments (localhost, dev.mantex.mx, mantex.mx) use the **same environment variables and endpoints**.

### Mobile App
```bash
cd mantex-mobile
npm install
npm run dev              # Web preview (localhost)
npm run build            # Production build for iOS/Android
npx cap sync ios         # Sync to iOS
npx cap open ios         # Open Xcode
```

### Web Portal

#### Localhost (Development)
```bash
cd sakai-vue
npm install
npm run dev              # Development server at localhost:5173
```

#### Staging (dev.mantex.mx)
```bash
cd sakai-vue
npm run build:dev        # Build for staging
# OR
npm run build            # Also works for staging

# Deploy to S3 (NO --delete flag)
aws s3 sync dist/ s3://dev.mantex.mx

# Cache invalidation handled manually by admin
```

#### Production (mantex.mx)
```bash
cd sakai-vue
npm run build:prod       # Build for production (not fully configured yet)

# Deploy to S3 (NO --delete flag)
aws s3 sync dist/ s3://mantex.mx

# Cache invalidation handled manually by admin
```

### Lambda Deployment
```bash
cd sakai-vue/lambda
npm install
serverless deploy        # Deploy all functions
serverless deploy function -f nubariumProxy  # Deploy single function
```

### Database Migrations
```sql
-- Run in Supabase SQL Editor
-- Files in sakai-vue/database/
```

---

## API Integrations

### Nubarium (Identity Verification)
**Proxy:** `nubarium-proxy-lambda.js` forwards to Nubarium APIs

**Services:**
- OCR: `/nubarium/ocr/v1/obtener_datos_id` (INE extraction)
- SAT: `/nubarium/sat/valida_rfc` (RFC validation)
- INE: `/nubarium/ine/v2/valida_ine` (Lista Nominal)
- Biometrics: `/nubarium/biometrics/antifraude/reconocimiento_facial`
- **NEW:** `/nubarium/ocr/v2/comprobante_domicilio` (Proof of address)
- **NEW:** `/nubarium/mex/documents/validate-cfe` (CFE validation)

**Service File:** `sakai-vue/src/lib/nubariumService.js`

### Google Maps
- Geocoding
- Directions API
- Places API
- **Future:** Real-time technician tracking

---

## Testing Accounts

### Flynn (God Mode)
- Email: `m@511.mx`
- Role: `admin`
- Sub-role: `god`

### Test Supplier
- Create via onboarding flow
- Use test INE images from Nubarium docs

### Test Client
- Create via admin panel or signup

---

## Common Issues & Solutions

### 1. Firebase Not Initialized
**Error:** "Firebase not initialized"
**Solution:** Ensure `useFirebaseJobs.js` is imported before `useFirebaseChat.js`

### 2. Supabase RLS Blocking Queries
**Error:** "new row violates row-level security policy"
**Solution:** Check RLS policies in Supabase dashboard, ensure user has correct role

### 3. S3 Upload Fails
**Error:** "S3 upload failed"
**Solution:** Check Lambda logs in AWS CloudWatch, verify bucket permissions

### 4. Nubarium 400 Bad Request
**Error:** "Bad Request" on Nubarium calls
**Solution:** Check proxy lambda logs, verify base64 encoding of images

### 5. Mobile Build Fails
**Error:** Capacitor sync errors
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
npx cap sync ios
```

---

## Deployment Scripts

### AWS Setup Script (`sakai-vue/aws-setup.sh`)

Automated AWS infrastructure setup script that:
- Creates S3 bucket for documents with unique timestamp
- Creates IAM role for Lambda execution with proper policies
- Deploys Nubarium webhook Lambda function
- Creates API Gateway REST API with `/webhook/sat` endpoint
- Configures Lambda permissions for API Gateway invocation
- Outputs all configuration values for `.env` files

**Usage:**
```bash
cd sakai-vue
chmod +x aws-setup.sh
./aws-setup.sh
```

**What it creates:**
- S3 Bucket: `mantex-documents-{timestamp}`
- IAM Role: `mantex-lambda-execution-role`
- Lambda Function: `nubarium-webhook`
- API Gateway: `nubarium-webhook-api`
- Endpoint: `https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/webhook/sat`

### Deploy Script (`sakai-vue/deploy.js`)

Automated deployment to S3 + CloudFront for web portal:

**Features:**
- Builds production bundle (or skips if using `deploy:quick`)
- Uploads all files to S3 bucket (`dev.mantex.mx`)
- Sets proper MIME types for all file extensions
- Configures smart cache headers based on file type
- Invalidates CloudFront cache for instant updates
- Configures S3 bucket as static website with SPA routing

**Cache Strategy:**
- **Assets with hash** (JS/CSS in `/assets/`): `max-age=31536000, immutable` (1 year)
- **Images and fonts**: `max-age=86400` (1 day)
- **HTML files**: `no-cache, no-store, must-revalidate` (instant updates)
- **Other files**: `max-age=3600` (1 hour)

**Usage:**
```bash
cd sakai-vue
npm run deploy          # Build + Deploy
npm run deploy:quick    # Deploy only (no build)
```

**CloudFront Configuration:**
- Distribution ID: `E2H5V2Y0GG33IR`
- Domain: `dniy7v7iu5bo4.cloudfront.net`
- Origin: `dev.mantex.mx` S3 bucket
- SSL: Automatic via AWS Certificate Manager
- Error Document: `index.html` (for SPA routing)

**Deployment URLs:**
- S3 Website: `https://dev.mantex.mx`
- CloudFront: `https://dniy7v7iu5bo4.cloudfront.net`

---

## Composables Inventory

### Web Portal (`sakai-vue/src/composables/`)

| Composable | Lines | Purpose |
|------------|-------|---------|
| `useAnalytics.js` | 2,141 | Google Analytics 4 tracking and event logging |
| `useAuth.js` | 13,745 | Supabase authentication, user management, session handling |
| `useFirebase.js` | 16,979 | Firebase initialization, real-time database utilities |
| `useGeolocation.js` | 12,201 | Browser Geolocation API wrapper with error handling |
| `useGoogleCalendar.js` | 18,670 | **Google Calendar integration via GAPI** (OAuth, CRUD events, availability) |
| `useGoogleIntegration.js` | 20,349 | Unified Google services (Maps + Calendar + OAuth) |
| `useGoogleMaps.js` | 19,385 | Google Maps API (geocoding, directions, places autocomplete) |
| `useImageCompression.js` | 7,850 | Client-side image compression before upload |
| `useLocationTracking.js` | 15,032 | Real-time location tracking for technicians |
| `usePaymentNotifications.js` | 8,925 | Payment status change notifications |
| `useS3Upload.js` | 13,929 | AWS S3 file upload via Lambda proxy |
| `useSupabaseClient.js` | 110 | Supabase client initialization |
| `useVerifications.js` | 12,033 | Nubarium verification workflows (INE, RFC, etc.) |

**Total:** 13 composables, ~160,000 lines of business logic

### Mobile App (`mantex-mobile/src/composables/`)

| Composable | Lines | Purpose |
|------------|-------|---------|
| `useAWS.js` | 7,736 | AWS SDK utilities for direct S3 access |
| `useAnalytics.js` | 2,141 | Google Analytics 4 tracking (same as web) |
| `useAuth.js` | 16,054 | **Authentication with Flynn Mode** (grid switching, god role) |
| `useCamera.js` | 10,336 | Capacitor Camera plugin wrapper (photo/video capture) |
| `useClientTickets.js` | 4,630 | Client ticket CRUD operations via Supabase |
| `useFirebase.js` | 16,979 | Firebase initialization (same as web) |
| `useFirebaseChat.js` | 6,269 | **Real-time chat for tickets** (NEW - typing, read receipts) |
| `useFirebaseJobs.js` | 10,777 | **Real-time job management** (assignments, status updates) |
| `useGeolocation.js` | 7,765 | Capacitor Geolocation plugin wrapper |
| `useGoogleCalendar.js` | 16,302 | **Google Calendar via Capacitor plugin** (native OAuth, job sync) |
| `useGoogleIntegration.js` | 20,349 | Unified Google services (same as web) |
| `useGoogleMaps.js` | 2,161 | Google Maps integration for mobile |
| `useIOSNotifications.js` | 6,491 | iOS-specific push notification handling |
| `useLocationTracking.js` | 15,032 | Background location tracking (same as web) |
| `useNotificationTester.js` | 8,647 | Push notification testing utilities |
| `useNotifications.js` | 11,500 | Unified notification system (FCM + APNs) |
| `usePaymentNotifications.js` | 8,925 | Payment notifications (same as web) |
| `usePermissions.js` | 3,006 | **Role-based permissions** (Flynn mode, sub-roles) |
| `useS3Upload.js` | 13,314 | S3 file upload via Lambda (similar to web) |
| `useSupabaseAPI.js` | 8,065 | Supabase API helpers and utilities |
| `useSupabaseClient.js` | 110 | Supabase client initialization (same as web) |
| `useTechnicianTickets.js` | 5,292 | Technician-specific ticket operations |
| `useVerifications.js` | 11,939 | Nubarium verification workflows (similar to web) |

**Total:** 23 composables, ~193,000 lines of business logic

### Google Calendar Integration Details

#### Desktop (`sakai-vue/src/composables/useGoogleCalendar.js`)

**Technology:** Google API Client Library (GAPI)  
**Authentication:** OAuth 2.0 with popup flow  
**Scopes:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

**Key Features:**
- Automatic GAPI script loading
- OAuth 2.0 sign-in/sign-out
- List user calendars
- Get events by date range
- Create/update/delete events
- Check availability (free/busy query)
- Find available time slots for scheduling
- Automatic initialization on component mount

**Usage Example:**
```javascript
import { useGoogleCalendar } from '@/composables/useGoogleCalendar';

const {
  isAuthorized,
  calendars,
  events,
  authorizeUser,
  createEvent,
  getAvailableSlots
} = useGoogleCalendar();

// Authorize user
await authorizeUser();

// Create event
await createEvent({
  title: 'Service Call - Plumbing',
  description: 'Fix leaking pipe',
  location: 'Calle Ejemplo 123, CDMX',
  startDateTime: '2024-01-15T10:00:00',
  endDateTime: '2024-01-15T12:00:00',
  attendees: [{ email: 'client@example.com' }]
});

// Find available slots
const slots = await getAvailableSlots(
  new Date('2024-01-15'),
  60, // duration in minutes
  { start: 9, end: 17 } // working hours
);
```

#### Mobile (`mantex-mobile/src/composables/useGoogleCalendar.js`)

**Technology:** Capacitor Google Auth Plugin (`@codetrix-studio/capacitor-google-auth`)  
**Authentication:** Native OAuth flow (iOS/Android)  
**API Calls:** Direct REST API calls to Google Calendar API v3

**Key Features:**
- Native OAuth flow for mobile platforms
- Direct REST API calls (no GAPI dependency)
- List user calendars
- Get events by date range
- Create/update/delete events
- **Job-to-calendar synchronization helper** (unique to mobile)
- Offline-capable with proper error handling

**Usage Example:**
```javascript
import { useGoogleCalendar } from '@/composables/useGoogleCalendar';

const {
  isAuthorized,
  hasCredentials,
  syncJobsToCalendar
} = useGoogleCalendar();

// Authorize user (native flow)
await authorizeUser();

// Sync jobs to calendar
const results = await syncJobsToCalendar(jobs);
console.log(`${results.filter(r => r.success).length}/${jobs.length} jobs synced`);
```

**Differences from Desktop:**
- Uses Capacitor plugin instead of GAPI
- Native OAuth flow (better UX on mobile)
- Includes `syncJobsToCalendar()` helper for bulk job sync
- No availability checking (simpler mobile use case)

---

## Key Files to Know

### Mobile
- `src/composables/useAuth.js` - Authentication, Flynn mode
- `src/composables/usePermissions.js` - Role-based permissions
- `src/composables/useClientTickets.js` - Ticket CRUD
- `src/composables/useFirebaseJobs.js` - Real-time jobs
- `src/router/index.js` - Routing (flattened client routes)
- `src/assets/styles/mantex-standards.scss` - Design system

### Web
- `src/lib/supabaseClient.js` - Supabase initialization
- `src/lib/nubariumService.js` - Nubarium API wrapper
- `src/views/onboarding/supplier/Step3.vue` - Supplier verification
- `src/views/admin/SuppliersApproval.vue` - Admin approval UI
- `lambda/serverless.yml` - Lambda deployment config

### Database
- `database/mantex-core-system.sql` - Core schema
- `database/add_created_by_to_tickets.sql` - Audit trail
- `database/make_location_address_nullable.sql` - Schema fix

---

## Next Steps for AI Continuation

1. **Complete Phase 1:**
   - Finish Nubarium proof-of-address integration
   - Add methods to `nubariumService.js` (lines 862+)
   - Update `Step3.vue` with proof upload UI
   - Create database migration `add_proof_of_address_to_suppliers.sql`
   - Test end-to-end supplier onboarding

2. **Push Notifications:**
   - Create `usePushNotifications.js`
   - Configure APNs certificates (Apple Developer Portal)
   - Test on physical iOS device

3. **Phase 2 (Service Catalogs):**
   - Create database schema for catalogs
   - Build supplier UI for managing services
   - Integrate with ticket creation

4. **Refer to:**
   - `implementation_plan.md` for detailed code examples
   - `ux_architecture_analysis.md` for UX best practices
   - `task.md` for current task checklist

---

## Contact & Resources

- **Project Owner:** Mike (m@511.mx)
- **Firebase Console:** https://console.firebase.google.com/project/mantex-production-1cd9d
- **Supabase Dashboard:** [Your Supabase URL]
- **AWS Console:** Lambda functions in us-east-1
- **Nubarium Docs:** [Internal documentation]

---

**Last Updated:** November 23, 2025  
**Version:** 1.0  
**Status:** Active Development - Phase 1
