# Onboarding Resilience Plan

## Problem Statement
The current onboarding flows for Clients and Suppliers can become **blocked** if the Nubarium API fails to respond or returns an error. Users are left unable to proceed, requiring manual intervention or account recreation.

## Current State Analysis

### OnboardingSupplier.vue (Partially Resilient)
- Uses `processINEValidationAsync()` and `processSATValidationAsync()` to process validations in the background.
- User can continue to the next step while API calls are in progress.
- **Gap**: No retry mechanism if background validation fails. No UI for the user to see or fix.

### OnboardingClient.vue (BLOCKING)
- Uses **synchronous** `processINEValidation()` and `processSATValidation()`.
- If Nubarium API fails, user **cannot advance** to the next step.
- **Critical Gap**: Entire onboarding is blocked.

## Proposed Solution

### Principle: "Never Block the User"
1. **Save First, Validate Later**: Store user-provided data (files, RFC, etc.) immediately.
2. **Background Processing**: Dispatch API calls to Nubarium asynchronously.
3. **Graceful Degradation**: Allow user to complete onboarding with `verification_status = 'pending'`.
4. **Retry Mechanism**: Provide UI in `/account` section to complete/retry failed verifications.

---

## Implementation Plan

### Phase 1: Refactor OnboardingClient.vue

**Goal**: Mirror the async pattern already in `OnboardingSupplier.vue`.

**Changes**:
1. Create `processINEValidationAsync(frontBase64, backBase64, selfieBase64, frontFile, backFile, selfieFile)`:
   - Upload files to S3 immediately.
   - Create `ine_verifications` record with `status = 'processing'`.
   - Dispatch Nubarium API call in background.
   - Update status to `verified` or `failed` based on result.

2. Create `processSATValidationAsync()`:
   - Create `sat_verifications` record with `status = 'processing'`.
   - Dispatch Nubarium API call in background.
   - Update status to `verified` or `failed` based on result.

3. Modify `completeStep()`:
   - On INE/SAT steps, call async function and **immediately advance** to next step.
   - Show toast: "Validacion en progreso, puedes continuar".

**Database Changes** (via migration script):
```sql
ALTER TABLE ine_verifications ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE ine_verifications ADD COLUMN last_attempt_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sat_verifications ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE sat_verifications ADD COLUMN last_attempt_at TIMESTAMP WITH TIME ZONE;
```

---

### Phase 2: Verification Status UI in Account

**Goal**: Let users see and retry failed verifications from their account settings.

**New Component**: `VerificationStatus.vue` (shared between Client and Supplier)

**Location**:
- Client: `/views/client/account/VerificationStatus.vue`
- Supplier: `/views/supplier/account/VerificationStatus.vue`

**Features**:
1. Display cards for each verification type (INE, SAT, Documents).
2. Show status badge: `Verificado`, `Pendiente`, `Fallido`, `Expirado`.
3. "Reintentar" button for failed/expired statuses.
4. "Ver Detalles" to show raw API response (for debugging).

**UI Mockup**:
```
+------------------------------------------+
| Verificacion de Identidad (INE)          |
| Status: [Fallido]                        |
| Ultimo intento: 2025-12-08 10:30         |
| [Subir nuevas imagenes] [Reintentar]     |
+------------------------------------------+
| Verificacion Fiscal (SAT/RFC)            |
| Status: [Verificado]                     |
| RFC: XAXX010101000                       |
+------------------------------------------+
```

---

### Phase 3: Admin Tooling

**Goal**: Allow admins to request re-verification from users.

**Features**:
1. **Admin View**: List users with `verification_status = 'failed'`.
2. **Action Button**: "Solicitar Re-Verificacion" sends email/notification to user.
3. **Status Update**: Mark verification as `requires_resubmission`.

**RPC Function** (Supabase):
```sql
CREATE OR REPLACE FUNCTION request_user_reverification(target_user_id UUID, verification_type TEXT)
RETURNS void AS $$
BEGIN
    IF verification_type = 'ine' THEN
        UPDATE ine_verifications
        SET verification_status = 'requires_resubmission', updated_at = NOW()
        WHERE user_id = target_user_id;
    ELSIF verification_type = 'sat' THEN
        UPDATE sat_verifications
        SET verification_status = 'requires_resubmission', updated_at = NOW()
        WHERE user_id = target_user_id;
    END IF;
    -- TODO: Trigger notification to user
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Phase 4: Automatic Retry Job (Future)

**Goal**: Automatically retry failed verifications without user intervention.

**Implementation**: AWS Lambda scheduled via EventBridge.

**Logic**:
1. Query verifications with `status = 'failed'` AND `retry_count < 3` AND `last_attempt_at < NOW() - INTERVAL '1 hour'`.
2. Re-call Nubarium API with stored data.
3. Update status based on result.
4. Increment `retry_count`.

**Considerations**:
- Rate limiting on Nubarium API.
- Cost implications of repeated calls.
- User notification on final failure.

---

## Verification Status Enum

```typescript
type VerificationStatus = 
  | 'pending'             // Initial state, awaiting processing
  | 'processing'          // API call in progress
  | 'verified'            // Successfully verified
  | 'failed'              // API returned error (can retry)
  | 'rejected'            // Manually rejected by admin (cannot retry)
  | 'expired'             // Verification too old, needs resubmission
  | 'requires_resubmission'; // Admin requested new documents
```

---

## Files to Modify

| File | Change |
|------|--------|
| `OnboardingClient.vue` | Refactor to async pattern |
| `OnboardingSupplier.vue` | Minor cleanup, ensure consistency |
| `useVerifications.js` | Add retry logic helpers |
| `client/account/VerificationStatus.vue` | **NEW** - Status display + retry |
| `supplier/account/VerificationStatus.vue` | **NEW** - Status display + retry |
| `database/add_verification_retry_fields.sql` | **NEW** - DB migration |
| `admin/Verifications.vue` | Add re-verification request button |

---

## Success Criteria

1. **User can complete onboarding** even if Nubarium is down.
2. **User can see verification status** in their account settings.
3. **User can retry failed verifications** without contacting support.
4. **Admin can request re-verification** from the admin panel.
5. **Zero blocking scenarios** during onboarding.

---

## Timeline Estimate

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1 (Async Refactor) | 4-6 hours | P0 - Critical |
| Phase 2 (Account UI) | 3-4 hours | P1 - High |
| Phase 3 (Admin Tooling) | 2-3 hours | P2 - Medium |
| Phase 4 (Auto Retry) | 4-6 hours | P3 - Low |

---

## Appendix: Code Snippets

### Example: Async INE Validation for Client

```javascript
const processINEValidation = async () => {
    loading.value = true;
    
    try {
        // 1. Convert to base64
        const frontBase64 = await fileToBase64(formData.value.ineFrontFile);
        const backBase64 = await fileToBase64(formData.value.ineBackFile);
        const selfieBase64 = await fileToBase64(formData.value.selfieFile);

        // 2. Show progress toast
        toast.add({
            severity: 'info',
            summary: 'Validacion en Progreso',
            detail: 'Procesando INE... Puedes continuar con el siguiente paso',
            life: 5000
        });

        // 3. Fire and forget - async validation
        processINEValidationAsync(
            frontBase64, backBase64, selfieBase64,
            formData.value.ineFrontFile,
            formData.value.ineBackFile,
            formData.value.selfieFile
        );

        // 4. Set temporary state to allow continuation
        formData.value.biometryResults = {
            validacion: 'procesando',
            mensaje: 'Validacion en progreso...'
        };

        return true; // ALWAYS return true to allow continuation

    } catch (error) {
        console.error('Error en validación de INE:', error);
        // Even on error, we return true to not block
        toast.add({
            severity: 'warn',
            summary: 'Validacion Pendiente',
            detail: 'La validacion se completara en segundo plano',
            life: 5000
        });
        return true;
    } finally {
        loading.value = false;
    }
};
```
