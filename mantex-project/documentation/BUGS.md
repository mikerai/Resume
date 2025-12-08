# Mantex Mobile App - Known Bugs & Issues

## CRITICAL BUGS

### 1. Session Persistence
**Priority:** CRITICAL  
**Status:** Not Fixed  
**Description:** Users (suppliers and clients) are logged out when navigating between pages  
**Impact:** Breaks user experience, forces re-login constantly  
**Location:** Auth session handling across app  
**Fix Required:** Review Supabase auth session handling and token refresh logic

### 2. No Navigation System
**Priority:** CRITICAL  
**Status:** Not Fixed  
**Description:** Mobile app has no tab navigation or bottom navigation bar  
**Impact:** Users cannot navigate between main sections easily  
**Location:** App-wide navigation structure  
**Fix Required:** Implement Ionic tabs with bottom navigation for:
- Dashboard
- Tickets/Jobs
- Calendar
- Chat
- Profile/Account

### 3. Missing Tab Architecture
**Priority:** CRITICAL  
**Status:** Not Fixed  
**Description:** App lacks proper tab-based navigation architecture  
**Impact:** Poor UX, no clear information architecture  
**Location:** Root app structure  
**Fix Required:** Redesign app with proper tab navigation following Ionic best practices

## HIGH PRIORITY BUGS

### 4. Ticket Status Translation
**Priority:** HIGH  
**Status:** Not Fixed  
**Description:** Status `ready_for_payment` not translated to "Listo para Pago"  
**Impact:** Confusing for Spanish-speaking users  
**Location:** `TicketDetail.vue`, ticket list views  
**Fix Required:** Add translation and display in blue ion-chip

### 5. Google Calendar Origin Not Authorized
**Priority:** HIGH  
**Status:** Not Fixed  
**Description:** `http://localhost:5173` not in authorized origins for OAuth  
**Impact:** Calendar integration fails in development  
**Location:** Google Cloud Console configuration  
**Fix Required:** Add localhost origins to Google OAuth client

### 6. Firebase Management API 403
**Priority:** HIGH  
**Status:** Not Fixed  
**Description:** Firebase Management API disabled for project  
**Impact:** Analytics and some Firebase features don't work  
**Location:** Firebase project configuration  
**Fix Required:** Enable Firebase Management API in Google Cloud Console

## MEDIUM PRIORITY BUGS

### 7. Client Desktop Has Dummy Data
**Priority:** MEDIUM  
**Status:** Not Fixed  
**Description:** Client desktop views still show hardcoded/dummy data  
**Impact:** Misleading information, not production-ready  
**Location:** Client dashboard, tickets, assets views  
**Fix Required:** Connect all views to real Supabase data

### 8. Admin Views Have Dummy Data
**Priority:** MEDIUM  
**Status:** Not Fixed  
**Description:** Admin views show hardcoded/dummy data  
**Impact:** Cannot manage real data  
**Location:** Admin dashboard, user management, analytics  
**Fix Required:** Connect all views to real Supabase data

### 9. RLS Policies Not Verified
**Priority:** MEDIUM  
**Status:** Not Fixed  
**Description:** Row Level Security policies not verified after migrations  
**Impact:** Potential security issues, data leaks  
**Location:** Supabase database  
**Fix Required:** Audit all RLS policies, test with different roles

### 10. Supplier Mobile UI Inconsistent
**Priority:** MEDIUM  
**Status:** Not Fixed  
**Description:** Supplier mobile views lack consistent design  
**Impact:** Poor UX, unprofessional appearance  
**Location:** All supplier mobile views  
**Fix Required:** Apply consistent design system, modern UI components

## LOW PRIORITY BUGS

### 11. Push Notifications Not Tested
**Priority:** LOW  
**Status:** Not Fixed  
**Description:** Push notifications not tested on iOS  
**Impact:** Unknown if notifications work  
**Location:** iOS app  
**Fix Required:** Test notification registration and delivery

### 12. Calendar Event Updates Not Implemented
**Priority:** LOW  
**Status:** Not Fixed  
**Description:** Calendar events not updated when ticket status changes  
**Impact:** Calendar out of sync with ticket status  
**Location:** Ticket status update handlers  
**Fix Required:** Add calendar event update on status change

### 13. Calendar Event Deletion Not Implemented
**Priority:** LOW  
**Status:** Not Fixed  
**Description:** Calendar events not deleted when ticket is cancelled  
**Impact:** Orphaned calendar events  
**Location:** Ticket cancellation handler  
**Fix Required:** Add calendar event deletion on ticket cancel

## RESOLVED BUGS

### [FIXED] Database: Cannot Drop Deprecated Tables
**Priority:** HIGH
**Status:** RESOLVED (Dec 7, 2025)
**Description:** `clients` and `suppliers` tables couldn't be dropped due to lingering Foreign Key and RLS Policy dependencies.
**Fix:** Created and executed `clean_and_fix_dependencies.sql` to drop old policies and constraints before removing tables.

### [FIXED] Missing Geo Fields in Client Profiles
**Priority:** MEDIUM
**Status:** RESOLVED (Dec 7, 2025)
**Description:** `client_profiles` table lacked `latitude` and `longitude`, breaking the Admin Dashboard map.
**Fix:** Added columns via migration script.

## UI/UX ISSUES (Not Bugs, But Need Fixing)

### 14. Client Desktop Needs Redesign
**Priority:** HIGH  
**Status:** Not Started  
**Affected Views:** Dashboard, Tickets, Ticket Detail, Assets, Approvals, Account, Calendar  
**Fix Required:** Modern redesign with consistent design system

### 15. Supplier Mobile Needs Redesign
**Priority:** HIGH  
**Status:** Not Started  
**Affected Views:** Dashboard, Jobs, Job Detail, Evidence Upload, Calendar, Account  
**Fix Required:** Modern redesign with Ionic components

### 16. Admin Desktop/Mobile Needs Redesign
**Priority:** HIGH  
**Status:** Not Started  
**Affected Views:** Dashboard, Users, Supplier Approval, Tickets, Evidence, Payments, Analytics  
**Fix Required:** Modern redesign with admin-focused UI

## FEATURE GAPS (Missing Functionality)

### 17. No Proof of Address in Onboarding
**Priority:** HIGH  
**Status:** Not Implemented  
**Description:** Nubarium proof of address validation not in supplier onboarding  
**Location:** `OnboardingSupplier.vue`  
**Fix Required:** Add proof upload step with CFE validation

### 18. No Proof Review in Admin Dashboard
**Priority:** HIGH  
**Status:** Not Implemented  
**Description:** Admin cannot review proof of address validation  
**Location:** `SuppliersApproval.vue`  
**Fix Required:** Add proof validation display and manual approval

### 19. Permissions Matrix Not Documented
**Priority:** MEDIUM  
**Status:** Not Implemented  
**Description:** No documentation of what each sub_role can do  
**Impact:** Unclear permissions, potential security issues  
**Fix Required:** Document and test all role permissions

### 20. Google Maps Not Integrated
**Priority:** LOW  
**Status:** Not Implemented  
**Description:** Maps not embedded in ticket detail for location  
**Location:** Ticket detail views  
**Fix Required:** Add embedded map with location pin

---

**Total Bugs:** 20  
**Critical:** 3  
**High:** 6  
**Medium:** 4  
**Low:** 3  
**Fixed:** 2
**UI/UX Issues:** 3  
**Feature Gaps:** 4
