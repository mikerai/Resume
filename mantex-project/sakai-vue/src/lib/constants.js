// ========================================
// MANTEX - CONSTANTS AND STANDARDIZATION
// ========================================

// Standard Icons Mapping (PrimeIcons)
export const ICONS = {
  // Navigation & Actions
  home: 'pi pi-home',
  dashboard: 'pi pi-chart-line',
  menu: 'pi pi-bars',
  back: 'pi pi-arrow-left',
  forward: 'pi pi-arrow-right',
  up: 'pi pi-arrow-up',
  down: 'pi pi-arrow-down',
  close: 'pi pi-times',
  minimize: 'pi pi-minus',
  maximize: 'pi pi-window-maximize',

  // User & Auth
  user: 'pi pi-user',
  users: 'pi pi-users',
  login: 'pi pi-sign-in',
  logout: 'pi pi-sign-out',
  profile: 'pi pi-id-card',
  settings: 'pi pi-cog',

  // Business Objects
  ticket: 'pi pi-ticket',
  tickets: 'pi pi-list',
  client: 'pi pi-building',
  supplier: 'pi pi-briefcase',
  payment: 'pi pi-dollar',
  evidence: 'pi pi-images',
  calendar: 'pi pi-calendar',
  map: 'pi pi-map',

  // Actions
  create: 'pi pi-plus',
  edit: 'pi pi-pencil',
  delete: 'pi pi-trash',
  save: 'pi pi-check',
  cancel: 'pi pi-times',
  submit: 'pi pi-send',
  approve: 'pi pi-check-circle',
  reject: 'pi pi-times-circle',
  review: 'pi pi-eye',
  download: 'pi pi-download',
  upload: 'pi pi-upload',
  refresh: 'pi pi-refresh',
  search: 'pi pi-search',
  filter: 'pi pi-filter',
  sort: 'pi pi-sort',

  // Status & States
  pending: 'pi pi-clock',
  inProgress: 'pi pi-spin pi-cog',
  completed: 'pi pi-check-circle',
  cancelled: 'pi pi-ban',
  error: 'pi pi-exclamation-triangle',
  warning: 'pi pi-exclamation-circle',
  info: 'pi pi-info-circle',
  success: 'pi pi-check-circle',

  // Communication
  notification: 'pi pi-bell',
  message: 'pi pi-envelope',
  chat: 'pi pi-comments',
  phone: 'pi pi-phone',
  mail: 'pi pi-at',

  // File & Media
  file: 'pi pi-file',
  image: 'pi pi-image',
  video: 'pi pi-video',
  document: 'pi pi-file-pdf',

  // Priority Levels
  priority: {
    low: 'pi pi-arrow-down',
    normal: 'pi pi-minus',
    high: 'pi pi-arrow-up',
    urgent: 'pi pi-exclamation-triangle'
  },

  // Maintenance Types
  maintenance: {
    preventive: 'pi pi-calendar-plus',
    corrective: 'pi pi-wrench',
    emergency: 'pi pi-bolt'
  }
}

// Standard Labels (Spanish)
export const LABELS = {
  // General
  general: {
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    error: 'Ha ocurrido un error',
    success: 'Operación exitosa',
    cancel: 'Cancelar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    create: 'Crear',
    update: 'Actualizar',
    submit: 'Enviar',
    back: 'Regresar',
    next: 'Siguiente',
    previous: 'Anterior',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpiar',
    select: 'Seleccionar',
    selectAll: 'Seleccionar todo',
    actions: 'Acciones',
    options: 'Opciones',
    details: 'Detalles',
    view: 'Ver',
    download: 'Descargar',
    upload: 'Subir',
    refresh: 'Actualizar',
    close: 'Cerrar'
  },

  // Navigation
  navigation: {
    home: 'Inicio',
    dashboard: 'Panel de Control',
    tickets: 'Tickets',
    clients: 'Clientes',
    suppliers: 'Proveedores',
    users: 'Usuarios',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión'
  },

  // User Roles
  roles: {
    admin: 'Administrador',
    client: 'Cliente',
    supplier: 'Proveedor'
  },

  // Ticket Status
  ticketStatus: {
    pending: 'Pendiente',
    assigned: 'Asignado',
    in_progress: 'En Progreso',
    review: 'En Revisión',
    completed: 'Completado',
    cancelled: 'Cancelado',
    on_hold: 'En Pausa'
  },

  // Priority Levels
  priority: {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente'
  },

  // Maintenance Types
  maintenanceType: {
    preventive: 'Mantenimiento Preventivo',
    corrective: 'Mantenimiento Correctivo',
    emergency: 'Mantenimiento de Emergencia'
  },

  // Payment Status
  paymentStatus: {
    pending: 'Pendiente',
    scheduled: 'Programado',
    processed: 'Procesado',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado'
  },

  // Evidence Types
  evidenceType: {
    before: 'Evidencia Inicial',
    progress: 'Evidencia de Progreso',
    after: 'Evidencia Final',
    document: 'Documento'
  },

  // Time Periods
  timePeriods: {
    today: 'Hoy',
    yesterday: 'Ayer',
    thisWeek: 'Esta Semana',
    lastWeek: 'Semana Pasada',
    thisMonth: 'Este Mes',
    lastMonth: 'Mes Pasado',
    thisYear: 'Este Año',
    lastYear: 'Año Pasado'
  },

  // Form Fields
  fields: {
    name: 'Nombre',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    address: 'Dirección',
    description: 'Descripción',
    title: 'Título',
    date: 'Fecha',
    time: 'Hora',
    status: 'Estado',
    priority: 'Prioridad',
    type: 'Tipo',
    category: 'Categoría',
    amount: 'Monto',
    notes: 'Notas',
    comments: 'Comentarios'
  },

  // Messages
  messages: {
    confirmDelete: '¿Estás seguro de que deseas eliminar este elemento?',
    confirmCancel: '¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.',
    saveSuccess: 'Los cambios se guardaron exitosamente.',
    deleteSuccess: 'El elemento se eliminó exitosamente.',
    updateSuccess: 'La actualización se completó exitosamente.',
    createSuccess: 'El elemento se creó exitosamente.',
    errorGeneral: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
    errorNetwork: 'Error de conexión. Verifica tu conexión a internet.',
    errorPermission: 'No tienes permisos para realizar esta acción.',
    errorValidation: 'Por favor, corrige los errores en el formulario.',
    noResults: 'No se encontraron resultados.',
    emptyState: 'No hay elementos para mostrar.'
  }
}

// Standard Color Palette (mapped to PrimeVue/Tailwind)
export const COLORS = {
  // Primary Brand Colors
  primary: {
    50: 'var(--p-primary-50)',
    100: 'var(--p-primary-100)',
    200: 'var(--p-primary-200)',
    300: 'var(--p-primary-300)',
    400: 'var(--p-primary-400)',
    500: 'var(--p-primary-500)',
    600: 'var(--p-primary-600)',
    700: 'var(--p-primary-700)',
    800: 'var(--p-primary-800)',
    900: 'var(--p-primary-900)'
  },

  // Status Colors
  status: {
    success: {
      bg: 'bg-green-100 dark:bg-green-400/10',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500',
      border: 'border-green-200 dark:border-green-600'
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-400/10',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-500',
      border: 'border-yellow-200 dark:border-yellow-600'
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-400/10',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500',
      border: 'border-red-200 dark:border-red-600'
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-400/10',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-500',
      border: 'border-blue-200 dark:border-blue-600'
    }
  },

  // Priority Colors
  priority: {
    low: {
      bg: 'bg-green-100 dark:bg-green-400/10',
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    normal: {
      bg: 'bg-blue-100 dark:bg-blue-400/10',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    high: {
      bg: 'bg-orange-100 dark:bg-orange-400/10',
      text: 'text-orange-600',
      icon: 'text-orange-500'
    },
    urgent: {
      bg: 'bg-red-100 dark:bg-red-400/10',
      text: 'text-red-600',
      icon: 'text-red-500'
    }
  },

  // Role Colors
  roles: {
    admin: {
      bg: 'bg-purple-100 dark:bg-purple-400/10',
      text: 'text-purple-600',
      icon: 'text-purple-500'
    },
    client: {
      bg: 'bg-blue-100 dark:bg-blue-400/10',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    supplier: {
      bg: 'bg-orange-100 dark:bg-orange-400/10',
      text: 'text-orange-600',
      icon: 'text-orange-500'
    }
  }
}

// Standard Severities (PrimeVue mapping)
export const SEVERITIES = {
  ticketStatus: {
    pending: 'warn',
    assigned: 'info',
    in_progress: 'info',
    review: 'warn',
    completed: 'success',
    cancelled: 'danger',
    on_hold: 'secondary'
  },

  priority: {
    low: 'success',
    normal: 'info',
    high: 'warn',
    urgent: 'danger'
  },

  paymentStatus: {
    pending: 'warn',
    scheduled: 'info',
    processed: 'info',
    completed: 'success',
    failed: 'danger',
    cancelled: 'secondary'
  }
}

// Utility Functions
export const getIcon = (category, key) => {
  if (category && ICONS[category] && ICONS[category][key]) {
    return ICONS[category][key]
  }
  return ICONS[key] || 'pi pi-question-circle'
}

export const getLabel = (category, key) => {
  if (category && LABELS[category] && LABELS[category][key]) {
    return LABELS[category][key]
  }
  return LABELS.general[key] || key
}

export const getColor = (category, key) => {
  if (category && COLORS[category] && COLORS[category][key]) {
    return COLORS[category][key]
  }
  return COLORS.primary[500]
}

export const getSeverity = (category, key) => {
  if (category && SEVERITIES[category] && SEVERITIES[category][key]) {
    return SEVERITIES[category][key]
  }
  return 'info'
}

// Format helpers
export const formatCurrency = (amount, currency = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  return new Date(date).toLocaleDateString('es-MX', defaultOptions)
}

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatRelativeTime = (date) => {
  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })
  const now = new Date()
  const target = new Date(date)
  const diffInMs = target - now
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffInDays) < 1) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (Math.abs(diffInHours) < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return rtf.format(diffInMinutes, 'minute')
    }
    return rtf.format(diffInHours, 'hour')
  }

  if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day')
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  return rtf.format(diffInWeeks, 'week')
}