<template>
    <div class="flex flex-col gap-2" :class="containerClass">
        <!-- Label -->
        <label
            v-if="label"
            :for="inputId"
            class="font-medium text-surface-900 dark:text-surface-0"
            :class="{ 'text-red-500': hasError }"
        >
            {{ label }}
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- Input Container with animated focus -->
        <div class="relative transition-all duration-300" :class="{ 'transform scale-[1.02]': focused }">
            <!-- Text Input -->
            <InputText
                v-if="type === 'text' || type === 'email' || type === 'password'"
                :id="inputId"
                :type="type"
                :placeholder="placeholder"
                :disabled="disabled"
                :invalid="hasError"
                :model-value="modelValue"
                @update:model-value="updateValue"
                @focus="onFocus"
                @blur="onBlur"
                :class="inputClasses"
                v-bind="$attrs"
            />

            <!-- Textarea -->
            <Textarea
                v-else-if="type === 'textarea'"
                :id="inputId"
                :placeholder="placeholder"
                :disabled="disabled"
                :invalid="hasError"
                :model-value="modelValue"
                @update:model-value="updateValue"
                @focus="onFocus"
                @blur="onBlur"
                :rows="rows"
                :class="inputClasses"
                v-bind="$attrs"
            />

            <!-- Number Input -->
            <InputNumber
                v-else-if="type === 'number'"
                :id="inputId"
                :placeholder="placeholder"
                :disabled="disabled"
                :invalid="hasError"
                :model-value="modelValue"
                @update:model-value="updateValue"
                @focus="onFocus"
                @blur="onBlur"
                :min="min"
                :max="max"
                :step="step"
                :class="inputClasses"
                v-bind="$attrs"
            />

            <!-- Dropdown -->
            <Dropdown
                v-else-if="type === 'select'"
                :id="inputId"
                :placeholder="placeholder"
                :disabled="disabled"
                :invalid="hasError"
                :model-value="modelValue"
                @update:model-value="updateValue"
                @focus="onFocus"
                @blur="onBlur"
                :options="options"
                :option-label="optionLabel"
                :option-value="optionValue"
                :class="inputClasses"
                v-bind="$attrs"
            />

            <!-- Calendar/Date -->
            <DatePicker
                v-else-if="type === 'date'"
                :id="inputId"
                :placeholder="placeholder"
                :disabled="disabled"
                :invalid="hasError"
                :model-value="modelValue"
                @update:model-value="updateValue"
                @focus="onFocus"
                @blur="onBlur"
                :class="inputClasses"
                v-bind="$attrs"
            />

            <!-- File Upload -->
            <FileUpload
                v-else-if="type === 'file'"
                :id="inputId"
                :disabled="disabled"
                :invalid="hasError"
                @select="onFileSelect"
                :class="inputClasses"
                v-bind="$attrs"
            />

            <!-- Icon (if provided) -->
            <div
                v-if="icon"
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
                <i :class="[icon, 'text-surface-400']"></i>
            </div>

            <!-- Loading state -->
            <div
                v-if="loading"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
                <i class="pi pi-spin pi-spinner text-surface-400"></i>
            </div>

            <!-- Clear button -->
            <Button
                v-if="clearable && modelValue && !disabled && !loading"
                icon="pi pi-times"
                severity="secondary"
                text
                rounded
                size="small"
                class="absolute inset-y-0 right-0 pr-1 flex items-center"
                @click="clearValue"
            />
        </div>

        <!-- Help Text -->
        <small
            v-if="helpText && !hasError"
            class="text-surface-500 dark:text-surface-400 transition-opacity duration-300"
            :class="{ 'opacity-100': focused, 'opacity-70': !focused }"
        >
            {{ helpText }}
        </small>

        <!-- Error Message -->
        <small
            v-if="hasError"
            class="text-red-500 animate-shake"
        >
            {{ errorMessage }}
        </small>

        <!-- Character Count (for textarea) -->
        <div
            v-if="type === 'textarea' && maxLength"
            class="flex justify-end"
        >
            <small class="text-surface-400">
                {{ (modelValue || '').length }}/{{ maxLength }}
            </small>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import DatePicker from 'primevue/datepicker'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'

const props = defineProps({
    // Basic props
    modelValue: { type: [String, Number, Date, Object], default: null },
    type: {
        type: String,
        default: 'text',
        validator: (value) => ['text', 'email', 'password', 'textarea', 'number', 'select', 'date', 'file'].includes(value)
    },
    label: { type: String, default: null },
    placeholder: { type: String, default: null },
    helpText: { type: String, default: null },

    // Validation
    required: { type: Boolean, default: false },
    error: { type: String, default: null },
    rules: { type: Array, default: () => [] },

    // States
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },

    // Styling
    size: {
        type: String,
        default: 'normal',
        validator: (value) => ['small', 'normal', 'large'].includes(value)
    },
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'filled', 'outlined'].includes(value)
    },

    // Type-specific props
    icon: { type: String, default: null },
    rows: { type: Number, default: 3 },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    step: { type: Number, default: null },
    maxLength: { type: Number, default: null },

    // Select options
    options: { type: Array, default: () => [] },
    optionLabel: { type: String, default: 'label' },
    optionValue: { type: String, default: 'value' },

    // Container
    containerClass: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'file-select', 'clear'])

const focused = ref(false)
const inputId = `input-${Math.random().toString(36).substr(2, 9)}`

// Computed properties
const hasError = computed(() => {
    return !!(props.error || internalError.value)
})

const errorMessage = computed(() => {
    return props.error || internalError.value
})

const inputClasses = computed(() => {
    const classes = ['w-full transition-all duration-300']

    // Size classes
    if (props.size === 'small') classes.push('p-inputtext-sm')
    if (props.size === 'large') classes.push('p-inputtext-lg')

    // Icon padding
    if (props.icon) classes.push('pl-10')

    // Animation effects
    classes.push('hover:border-primary-400 focus:shadow-lg focus:border-primary-500')

    return classes
})

// Internal validation
const internalError = ref(null)

const validateInput = (value) => {
    internalError.value = null

    if (props.required && (!value || (typeof value === 'string' && !value.trim()))) {
        internalError.value = `${props.label || 'Este campo'} es requerido`
        return false
    }

    for (const rule of props.rules) {
        const result = rule(value)
        if (result !== true) {
            internalError.value = result
            return false
        }
    }

    return true
}

// Event handlers
const updateValue = (value) => {
    emit('update:modelValue', value)
    validateInput(value)
}

const onFocus = (event) => {
    focused.value = true
    emit('focus', event)
}

const onBlur = (event) => {
    focused.value = false
    validateInput(props.modelValue)
    emit('blur', event)
}

const onFileSelect = (event) => {
    emit('file-select', event)
}

const clearValue = () => {
    emit('update:modelValue', null)
    emit('clear')
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
    if (!focused.value) {
        validateInput(newValue)
    }
})
</script>

<style scoped>
/* Custom animations */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
}

.animate-shake {
    animation: shake 0.5s ease-in-out;
}

/* Focus effects */
:deep(.p-inputtext:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.2);
}

:deep(.p-dropdown:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.2);
}

/* Custom styling */
:deep(.p-inputtext) {
    font-family: 'Urbanist', sans-serif;
    border-radius: var(--content-border-radius);
}

:deep(.p-dropdown) {
    font-family: 'Urbanist', sans-serif;
    border-radius: var(--content-border-radius);
}

/* Size variants */
:deep(.p-inputtext-sm) {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
}

:deep(.p-inputtext-lg) {
    padding: 0.75rem 1rem;
    font-size: 1.125rem;
}

/* Hover effects */
:deep(.p-inputtext:hover:not(:disabled)) {
    border-color: var(--primary-400);
}

:deep(.p-dropdown:hover:not(:disabled)) {
    border-color: var(--primary-400);
}
</style>