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
    'in_progress': 'En Progreso',
    'completed': 'Completado',
    'under_review': 'En Revisión',
    'approved': 'Aprobado',
    'ready_for_payment': 'Listo para Pago',
    'payment_pending': 'Pago Pendiente',
    'paid': 'Pagado',
    'closed': 'Cerrado',
    'cancelled': 'Cancelado',
    'revision_requested': 'Cambios Solicitados'
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
 * Ionic color mapping for status badges/chips
 * Following Ionic color system: primary, secondary, tertiary, success, warning, danger, light, medium, dark
 */
export const STATUS_COLORS = {
    'pending': 'warning',           // Yellow/Orange
    'opened': 'secondary',          // Blue-gray
    'in_progress': 'primary',       // Blue
    'completed': 'success',         // Green
    'under_review': 'tertiary',     // Purple
    'approved': 'success',          // Green
    'ready_for_payment': 'primary', // Blue (as requested)
    'payment_pending': 'warning',   // Yellow
    'paid': 'success',              // Green
    'closed': 'medium',             // Gray
    'cancelled': 'danger',          // Red
    'revision_requested': 'warning' // Orange
};

/**
 * PrimeVue severity mapping for desktop (Tag component)
 * Options: success, info, warning, danger, secondary, contrast
 */
export const STATUS_SEVERITY = {
    'pending': 'warning',
    'opened': 'info',
    'in_progress': 'info',
    'completed': 'success',
    'under_review': 'info',
    'approved': 'success',
    'ready_for_payment': 'info',
    'payment_pending': 'warning',
    'paid': 'success',
    'closed': 'secondary',
    'cancelled': 'danger',
    'revision_requested': 'warning'
};

/**
 * Priority color mapping for Ionic
 */
export const PRIORITY_COLORS = {
    'low': 'success',
    'medium': 'warning',
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
