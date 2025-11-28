/**
 * Ticket Status Translation Utilities
 * Centralized status translations and styling for Mantex platform
 */

/**
 * Status translation map (English -> Spanish)
 */
export const STATUS_TRANSLATIONS = {
    'pending': 'Pendiente',
    'opened': 'Abierto',
    'in_progress': 'En progreso',
    'completed': 'Completado',
    'under_review': 'En revisión',
    'approved': 'Aprobado',
    'ready_for_payment': 'Listo para pago',
    'payment_pending': 'Pago pendiente',
    'paid': 'Pagado',
    'closed': 'Cerrado',
    'cancelled': 'Cancelado',
    'revision_requested': 'Cambios solicitados'
};

/**
 * Priority translation map
 */
export const PRIORITY_TRANSLATIONS = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'urgent': 'Urgente'
};

/**
 * Maintenance Type translation map
 */
export const MAINTENANCE_TYPE_TRANSLATIONS = {
    'preventive': 'Preventivo',
    'corrective': 'Correctivo',
    'installation': 'Instalación'
};

/**
 * Attachment Type translation map
 */
export const ATTACHMENT_TYPE_TRANSLATIONS = {
    'branch': 'Foto de la sucursal',
    'asset': 'Foto del activo',
    'problem': 'Descripción del problema',
    'additional': 'Información adicional',
    'evidence': 'Evidencia del trabajo'
};

/**
 * Ionic color mapping for status badges/chips
 * Following Ionic color system: primary, secondary, tertiary, success, warning, danger, light, medium, dark
 */
export const STATUS_COLORS = {
    'pending': 'warn',           // Yellow/Orange
    'opened': 'secondary',          // Blue-gray
    'in_progress': 'info',       // Blue
    'completed': 'success',         // Green
    'under_review': 'tertiary',     // Purple
    'approved': 'success',          // Green
    'ready_for_payment': 'info', // Blue (as requested)
    'payment_pending': 'warn',   // Yellow
    'paid': 'success',              // Green
    'closed': 'medium',             // Gray
    'cancelled': 'danger',          // Red
    'revision_requested': 'warn' // Orange
};

/**
 * PrimeVue severity mapping for desktop (Tag component)
 * Options: success, info, warning, danger, secondary, contrast
 */
export const STATUS_SEVERITY = {
    'pending': 'warn',
    'opened': 'info',
    'in_progress': 'info',
    'completed': 'success',
    'under_review': 'info',
    'approved': 'success',
    'ready_for_payment': 'info',
    'payment_pending': 'info',
    'paid': 'success',
    'closed': 'secondary',
    'cancelled': 'danger',
    'revision_requested': 'danger'
};

/**
 * Priority color mapping for Ionic
 */
export const PRIORITY_COLORS = {
    'low': 'success',
    'medium': 'warn',
    'high': 'danger',
    'urgent': 'danger'
};

/**
 * Translate ticket status to Spanish
 * @param {string} status - Status in English
 * @returns {string} Translated status
 */
export function translateStatus(status) {
    if (!status) return '';
    const normalized = status.toLowerCase().trim();
    return STATUS_TRANSLATIONS[normalized] || status;
}

/**
 * Translate priority to Spanish
 * @param {string} priority - Priority in English
 * @returns {string} Translated priority
 */
export function translatePriority(priority) {
    if (!priority) return '';
    const normalized = priority.toLowerCase().trim();
    return PRIORITY_TRANSLATIONS[normalized] || priority;
}

/**
 * Translate maintenance type to Spanish
 * @param {string} type - Maintenance type in English
 * @returns {string} Translated maintenance type
 */
export function getMaintenanceTypeLabel(type) {
    if (!type) return '';
    return MAINTENANCE_TYPE_TRANSLATIONS[type] || type;
}

/**
 * Translate attachment type to Spanish
 * @param {string} type - Attachment type in English
 * @returns {string} Translated attachment type
 */
export function getAttachmentTypeLabel(type) {
    if (!type) return 'Imagen adjunta';
    return ATTACHMENT_TYPE_TRANSLATIONS[type] || 'Imagen adjunta';
}

/**
 * Get severity for maintenance type
 * @param {string} type - Maintenance type
 * @returns {string} PrimeVue severity
 */
export function getMaintenanceTypeSeverity(type) {
    return type === 'preventive' ? 'info' : 'warning';
}

/**
 * Get Ionic color for status badge/chip
 * @param {string} status - Ticket status
 * @returns {string} Ionic color name
 */
export function getStatusColor(status) {
    if (!status) return 'medium';
    const normalized = status.toLowerCase().trim();
    return STATUS_COLORS[normalized] || 'medium';
}

/**
 * Get PrimeVue severity for status tag (desktop)
 * @param {string} status - Ticket status
 * @returns {string} PrimeVue severity
 */
export function getStatusSeverity(status) {
    if (!status) return 'secondary';
    const normalized = status.toLowerCase().trim();
    return STATUS_SEVERITY[normalized] || 'secondary';
}

/**
 * Get priority color for Ionic
 * @param {string} priority - Priority level
 * @returns {string} Ionic color name
 */
export function getPriorityColor(priority) {
    if (!priority) return 'medium';
    const normalized = priority.toLowerCase().trim();
    return PRIORITY_COLORS[normalized] || 'medium';
}

/**
 * Get priority severity for PrimeVue Tag
 * @param {string} priority - Priority level
 * @returns {string} PrimeVue severity
 */
export function getPrioritySeverity(priority) {
    if (!priority) return 'info';
    const normalized = priority.toLowerCase().trim();
    const severities = {
        low: 'success',
        medium: 'warn', // PrimeVue uses 'warn' not 'warning'
        high: 'danger',
        urgent: 'danger'
    };
    return severities[normalized] || 'info';
}

/**
 * Format date to Spanish locale
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDate(dateString, options = {}) {
    if (!dateString) return 'Sin fecha';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const defaultOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-MX', { ...defaultOptions, ...options });
}

/**
 * Profile Status translation map
 */
export const PROFILE_STATUS_TRANSLATIONS = {
    'draft': 'Borrador',
    'submitted': 'Enviado',
    'under_review': 'En revisión',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'suspended': 'Suspendido',
    'active': 'Activo',
    'inactive': 'Inactivo'
};

/**
 * Profile Status severity map
 */
export const PROFILE_STATUS_SEVERITY = {
    'draft': 'secondary',
    'submitted': 'info',
    'under_review': 'warn',
    'approved': 'success',
    'active': 'success',
    'rejected': 'danger',
    'suspended': 'danger',
    'inactive': 'secondary'
};

/**
 * Translate profile status to Spanish
 * @param {string} status - Profile status
 * @returns {string} Translated status
 */
export function translateProfileStatus(status) {
    if (!status) return 'Sin estado';
    const normalized = status.toLowerCase().trim();
    return PROFILE_STATUS_TRANSLATIONS[normalized] || status;
}

/**
 * Get severity for profile status
 * @param {string} status - Profile status
 * @returns {string} PrimeVue severity
 */
export function getProfileStatusSeverity(status) {
    if (!status) return 'secondary';
    const normalized = status.toLowerCase().trim();
    return PROFILE_STATUS_SEVERITY[normalized] || 'secondary';
}
