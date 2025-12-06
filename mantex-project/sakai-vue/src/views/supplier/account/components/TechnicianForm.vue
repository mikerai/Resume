<script setup>
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            first_name: '',
            last_name: '',
            email: ''
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

const validateEmail = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailValid.value = !formData.value.email || emailPattern.test(formData.value.email);
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-6">
            <div class="field">
                <label for="first_name" class="font-medium">Nombre *</label>
                <InputText id="first_name" v-model="formData.first_name" class="w-full" required />
            </div>
        </div>
        <div class="col-span-12 md:col-span-6">
            <div class="field">
                <label for="last_name" class="font-medium">Apellidos *</label>
                <InputText id="last_name" v-model="formData.last_name" class="w-full" required />
            </div>
        </div>
        <div class="col-span-12">
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
                <small class="block mt-1 text-muted-color">Se enviará una invitación a este correo para que el técnico complete su registro.</small>
            </div>
        </div>
    </div>
</template>
