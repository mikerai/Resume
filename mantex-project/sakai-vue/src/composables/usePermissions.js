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

        // Basic mappings
        if (resourcePerm === 'all') return true;

        // Granular mappings
        if (resourcePerm === 'manage') return ['create', 'read', 'update', 'delete'].includes(action);
        if (resourcePerm === 'read_write') return ['create', 'read', 'update'].includes(action);
        if (resourcePerm === 'read') return action === 'read';

        // Specific specialized permissions
        if (resourcePerm === 'manage_assigned') return ['read', 'update', 'check_in'].includes(action); // For technicians
        if (resourcePerm === 'assigned_only') return ['read', 'update', 'check_in'].includes(action); // Legacy technician

        // Exact match (e.g. "create")
        return resourcePerm === action;
    };

    // ----------------------------------------------------------------
    // Pre-computed permissions for specific Views / Components
    // ----------------------------------------------------------------

    // ----- CLIENT PERMISSIONS -----
    const canCreateTicketClient = computed(() => {
        // Only Client Owner, Manager, and Buyer can create tickets.
        if (profile.value?.role !== 'client') return false;
        return hasAnySubRole(['owner', 'manager', 'buyer']);
    });

    const canManageClientUsers = computed(() => {
        if (profile.value?.role !== 'client') return false;
        return hasAnySubRole(['owner', 'manager']);
    });

    // ----- SUPPLIER PERMISSIONS -----

    // Who can see "My Jobs"
    const canViewTickets = computed(() => {
        if (isFlynn.value) return true;
        if (profile.value?.role !== 'supplier') return false;
        return can('read', 'tickets');
    });

    // Who can edit company info
    const canManageCompany = computed(() => {
        if (isFlynn.value) return true;
        if (profile.value?.role !== 'supplier') return false;
        return can('manage', 'organization') || hasSubRole('owner');
    });

    // Who can verify technicians or manage team
    const canManageTeam = computed(() => {
        if (isFlynn.value) return true;
        if (profile.value?.role !== 'supplier') return false;
        return can('manage', 'users') || hasAnySubRole(['owner', 'manager']);
    });

    // ----- ADMIN PERMISSIONS -----
    const isSuperAdmin = computed(() => {
        return isFlynn.value || (profile.value?.role === 'admin' && profile.value?.sub_role === 'god');
    });

    return {
        hasSubRole,
        hasAnySubRole,
        can,
        // Computed Helpers
        canCreateTicketClient,
        canManageClientUsers,
        canViewTickets,
        canManageCompany,
        canManageTeam,
        isSuperAdmin
    };
}
