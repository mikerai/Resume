<template>
    <Button
        :label="label"
        :icon="icon"
        :severity="severity"
        :size="size"
        :text="text"
        :outlined="outlined"
        :rounded="rounded"
        :raised="raised"
        :loading="loading"
        :disabled="disabled"
        :class="buttonClasses"
        @click="handleClick"
        v-bind="$attrs"
    >
        <slot></slot>
    </Button>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
    // Standard PrimeVue props
    label: { type: String, default: null },
    icon: { type: String, default: null },
    severity: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger'].includes(value)
    },
    size: {
        type: String,
        default: null,
        validator: (value) => !value || ['small', 'large'].includes(value)
    },
    text: { type: Boolean, default: false },
    outlined: { type: Boolean, default: false },
    rounded: { type: Boolean, default: false },
    raised: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },

    // Extended props for standardization
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'action', 'create', 'edit', 'delete', 'cancel', 'save', 'submit'].includes(value)
    },
    fullWidth: { type: Boolean, default: false },
    animate: { type: Boolean, default: true },
    confirmAction: { type: Boolean, default: false },
    confirmMessage: { type: String, default: '¿Estás seguro?' }
})

const emit = defineEmits(['click', 'confirm', 'cancel'])

// Computed classes based on variant and props
const buttonClasses = computed(() => {
    const classes = []

    // Full width
    if (props.fullWidth) {
        classes.push('w-full')
    }

    // Animation classes
    if (props.animate) {
        classes.push('transition-all duration-300 hover:scale-105 hover:shadow-lg')
    }

    // Variant-specific styling
    switch (props.variant) {
        case 'action':
            classes.push('font-medium')
            break
        case 'create':
            classes.push('font-semibold shadow-md')
            break
        case 'edit':
            classes.push('font-medium')
            break
        case 'delete':
            classes.push('font-semibold')
            break
        case 'cancel':
            classes.push('font-normal')
            break
        case 'save':
        case 'submit':
            classes.push('font-semibold shadow-md')
            break
    }

    return classes
})

// Computed severity based on variant if not explicitly set
const computedSeverity = computed(() => {
    // If severity is explicitly set, use it
    if (props.severity !== 'primary' || props.variant === 'default') {
        return props.severity
    }

    // Map variants to severities
    const variantSeverityMap = {
        create: 'success',
        edit: 'secondary',
        delete: 'danger',
        cancel: 'secondary',
        save: 'success',
        submit: 'primary',
        action: 'primary'
    }

    return variantSeverityMap[props.variant] || 'primary'
})

// Click handler with confirmation
const handleClick = (event) => {
    if (props.confirmAction) {
        // Show confirmation dialog
        if (confirm(props.confirmMessage)) {
            emit('confirm', event)
            emit('click', event)
        } else {
            emit('cancel', event)
        }
    } else {
        emit('click', event)
    }
}
</script>

<style scoped>
/* Custom button animations and effects */
:deep(.p-button) {
    font-family: 'Urbanist', sans-serif;
    border-radius: var(--content-border-radius);
}

/* Hover effects for different variants */
:deep(.p-button:not(.p-button-text):not(.p-button-outlined):hover) {
    transform: translateY(-1px);
}

/* Focus states */
:deep(.p-button:focus) {
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.3);
}

/* Loading state improvements */
:deep(.p-button.p-button-loading .p-button-icon) {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Size-specific adjustments */
:deep(.p-button.p-button-sm) {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
}

:deep(.p-button.p-button-lg) {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
}

/* Variant-specific styling */
.variant-create:deep(.p-button) {
    background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
}

.variant-delete:deep(.p-button) {
    background: linear-gradient(135deg, var(--red-500), var(--red-600));
}

/* Responsive adjustments */
@media (max-width: 768px) {
    :deep(.p-button) {
        padding: 0.5rem 1rem;
    }

    :deep(.p-button .p-button-label) {
        font-size: 0.9rem;
    }
}
</style>