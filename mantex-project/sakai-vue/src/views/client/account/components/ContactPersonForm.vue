<script setup>
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            first_name: '',
            last_name_paternal: '',
            last_name_maternal: '',
            phone: '',
            email: '',
            is_primary: false
        })
    }
});

const emit = defineEmits(['update:modelValue']);

const formData = ref({ ...props.modelValue });

watch(() => props.modelValue, (newVal) => {
    formData.value = { ...newVal };
}, { deep: true });

watch(formData, (newVal) => {
    emit('update:modelValue', newVal);
}, { deep: true });

const emailValid = ref(true);
const phoneValid = ref(true);

const validateEmail = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailValid.value = !formData.value.email || emailPattern.test(formData.value.email);
};

const validatePhone = () => {
    const phonePattern = /^\d{10}$/;
    phoneValid.value = !formData.value.phone || phonePattern.test(formData.value.phone.replace(/[\s-]/g, ''));
};
</script>

<template>
    <div class="grid-cols-10 gap-2">
        <div class="col-10 md:col-6">
            <div class="field">
                <label for="first_name" class="font-medium">Nombre *</label>
                <InputText id="first_name" v-model="formData.first_name" class="w-full" required />
            </div>
        </div>
        <div class="col-10 md:col-6">
            <div class="field">
                <label for="last_name_paternal" class="font-medium">Apellido Paterno *</label>
                <InputText id="last_name_paternal" v-model="formData.last_name_paternal" class="w-full" required />
            </div>
        </div>
        <div class="col-10 md:col-6">
            <div class="field">
                <label for="last_name_maternal" class="font-medium">Apellido Materno</label>
                <InputText id="last_name_maternal" v-model="formData.last_name_maternal" class="w-full" />
            </div>
        </div>
        <div class="col-10 md:col-6">
            <div class="field">
                <label for="phone" class="font-medium">Teléfono *</label>
                <InputText
                    id="phone"
                    v-model="formData.phone"
                    class="w-full"
                    :class="{ 'p-invalid': !phoneValid }"
                    placeholder="5512345678"
                    @blur="validatePhone"
                    required
                />
                <small v-if="!phoneValid" class="p-error">Debe ser un teléfono de 10 dígitos</small>
            </div>
        </div>
        <div class="grid-cols-10 gap-2">
            <div class="col-10">
                <div class="field">
                <label for="email" class="font-medium">Correo Electrónico *</label>
                <InputText
                    id="email"
                        v-model="formData.email"
                        type="email"
                        class="w-full"
                        :class="{ 'p-invalid': !emailValid }"
                        @blur="validateEmail"
                        required
                    />
                    <small v-if="!emailValid" class="p-error">Debe ser un correo electrónico válido</small>
                </div>
            </div>
            <div class="col-10">
                <div class="field-checkbox">
                    <Checkbox id="is_primary" v-model="formData.is_primary" :binary="true" />
                    <label for="is_primary" class="ml-2">Contacto Principal</label>
                </div>
            </div>
        </div>
    </div>
</template>
