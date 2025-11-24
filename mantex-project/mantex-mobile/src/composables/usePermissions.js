import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth.js';

export function usePermissions() {
    const { profile, isFlynn, currentGridMode } = useAuth();

    // Helper to check if user has a specific sub-role
    const hasSubRole = (subRole) => {
        if (isFlynn.value) return true; // Flynn is everything
        return profile.value?.sub_role === subRole;
    };

    // Helper to check if user has ANY of the provided sub-roles
    const hasAnySubRole = (subRolesArray) => {
        if (isFlynn.value) return true;
        return subRolesArray.includes(profile.value?.sub_role);
    };

    // Helper to check specific permission from the JSONB column
    // Usage: can('create', 'tickets') or can('manage', 'users')
    const can = (action, resource) => {
        if (isFlynn.value) return true;

        const permissions = profile.value?.permissions || {};

        // 1. Check for "all" super-permission
        if (permissions.all === true) return true;

        // 2. Check for resource-specific permission
        // Example: permissions: { "tickets": "create", "users": "read" }
        // Or: permissions: { "tickets": "all" }
        const resourcePerm = permissions[resource];

        if (!resourcePerm) return false;

        if (resourcePerm === 'all') return true;
        if (resourcePerm === 'manage') return ['create', 'read', 'update', 'delete'].includes(action);
        if (resourcePerm === 'read_write') return ['create', 'read', 'update'].includes(action);
        if (resourcePerm === 'read') return action === 'read';

        // Exact match (e.g. "create")
        return resourcePerm === action;
    };

    // Pre-computed permissions for common Client actions
    const canCreateTicket = computed(() => {
        const { user } = useAuth();
        console.log('🛡️ Checking canCreateTicket');
        console.log('  Email:', user.value?.email);
        console.log('  Flynn:', isFlynn.value);
        console.log('  Mode:', currentGridMode.value);
        console.log('  SubRole:', profile.value?.sub_role);

        // GOD MODE: Flynn OR sub_role 'god' = UNLIMITED POWER
        if (isFlynn.value || profile.value?.sub_role === 'god') return true;

        // Client Owner, Manager, and Buyer can create tickets. Viewer cannot.
        const result = hasAnySubRole(['owner', 'manager', 'buyer']);
        console.log('  hasAnySubRole result:', result);
        console.log('  Final canCreateTicket:', result);
        return result;
    });

    const canViewBilling = computed(() => {
        if (isFlynn.value && currentGridMode.value === 'client') return true;
        // Only Owner and Manager can view billing/purchases
        return hasAnySubRole(['owner', 'manager']);
    });

    const canManageUsers = computed(() => {
        if (isFlynn.value && currentGridMode.value === 'client') return true;
        // Only Owner and Manager
        return hasAnySubRole(['owner', 'manager']);
    });

    return {
        hasSubRole,
        hasAnySubRole,
        can,
        // Client specific
        canCreateTicket,
        canViewBilling,
        canManageUsers
    };
}
