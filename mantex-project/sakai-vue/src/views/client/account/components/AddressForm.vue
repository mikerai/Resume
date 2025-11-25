<script setup>
import { ref, computed, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            street: '',
            number: '',
            apt: '',
            neighborhood: '',
            municipality_city: '',
            state: '',
            postal_code: '',
            picture: null,
            additional_pictures: [],
            layout: null
        })
    }
});

const emit = defineEmits(['update:modelValue']);

const formData = ref({ ...props.modelValue });

const isUpdatingFromParent = ref(false);

watch(() => props.modelValue, (newVal) => {
    isUpdatingFromParent.value = true;
    formData.value = { ...newVal };
    // Reset flag after DOM update to ensure the watcher for formData doesn't trigger emit
    setTimeout(() => {
        isUpdatingFromParent.value = false;
    }, 0);
}, { deep: true });

watch(formData, (newVal) => {
    if (!isUpdatingFromParent.value) {
        emit('update:modelValue', newVal);
    }
}, { deep: true });

const mexicanStates = [
    { label: 'Aguascalientes', value: 'Aguascalientes' },
    { label: 'Baja California', value: 'Baja California' },
    { label: 'Baja California Sur', value: 'Baja California Sur' },
    { label: 'Campeche', value: 'Campeche' },
    { label: 'Chiapas', value: 'Chiapas' },
    { label: 'Chihuahua', value: 'Chihuahua' },
    { label: 'Ciudad de México', value: 'CDMX' },
    { label: 'Coahuila', value: 'Coahuila' },
    { label: 'Colima', value: 'Colima' },
    { label: 'Durango', value: 'Durango' },
    { label: 'Guanajuato', value: 'Guanajuato' },
    { label: 'Guerrero', value: 'Guerrero' },
    { label: 'Hidalgo', value: 'Hidalgo' },
    { label: 'Jalisco', value: 'Jalisco' },
    { label: 'México', value: 'Estado de México' },
    { label: 'Michoacán', value: 'Michoacán' },
    { label: 'Morelos', value: 'Morelos' },
    { label: 'Nayarit', value: 'Nayarit' },
    { label: 'Nuevo León', value: 'Nuevo León' },
    { label: 'Oaxaca', value: 'Oaxaca' },
    { label: 'Puebla', value: 'Puebla' },
    { label: 'Querétaro', value: 'Querétaro' },
    { label: 'Quintana Roo', value: 'Quintana Roo' },
    { label: 'San Luis Potosí', value: 'San Luis Potosí' },
    { label: 'Sinaloa', value: 'Sinaloa' },
    { label: 'Sonora', value: 'Sonora' },
    { label: 'Tabasco', value: 'Tabasco' },
    { label: 'Tamaulipas', value: 'Tamaulipas' },
    { label: 'Tlaxcala', value: 'Tlaxcala' },
    { label: 'Veracruz', value: 'Veracruz' },
    { label: 'Yucatán', value: 'Yucatán' },
    { label: 'Zacatecas', value: 'Zacatecas' }
];

const postalCodeValid = computed(() => /^\d{5}$/.test(formData.value.postal_code));
</script>

<template>
    <div class="grid-cols-12 gap-2">
        <!-- Row 1: Street and Number -->
        <div class="col-12 md:col-8">
            <div class="field">
                <label for="street" class="font-medium">Calle *</label>
                <InputText id="street" v-model="formData.street" class="w-full" required />
            </div>
        </div>
        <div class="col-12 md:col-4">
            <div class="field">
                <label for="number" class="font-medium">Número Exterior *</label>
                <InputText id="number" v-model="formData.number" class="w-full" required />
            </div>
        </div>

        <!-- Row 2: Apt and Neighborhood -->
        <div class="col-12 md:col-4">
            <div class="field">
                <label for="apt" class="font-medium">Número Interior</label>
                <InputText id="apt" v-model="formData.apt" class="w-full" />
            </div>
        </div>
        <div class="col-12 md:col-8">
            <div class="field">
                <label for="neighborhood" class="font-medium">Colonia *</label>
                <InputText id="neighborhood" v-model="formData.neighborhood" class="w-full" required />
            </div>
        </div>

        <!-- Row 3: Municipality and State -->
        <div class="col-12 md:col-6">
            <div class="field">
                <label for="municipality_city" class="font-medium">Municipio o Alcaldía *</label>
                <InputText id="municipality_city" v-model="formData.municipality_city" class="w-full" required />
            </div>
        </div>
        <div class="col-12 md:col-6">
            <div class="field">
                <label for="state" class="font-medium">Estado *</label>
                <Dropdown
                    id="state"
                    v-model="formData.state"
                    :options="mexicanStates"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccione un estado"
                    class="w-full"
                    filter
                    required
                />
            </div>
        </div>

        <!-- Row 4: Postal Code -->
        <div class="col-12 md:col-4">
            <div class="field">
                <label for="postal_code" class="font-medium">Código Postal *</label>
                <InputText
                    id="postal_code"
                    v-model="formData.postal_code"
                    class="w-full"
                    :class="{ 'p-invalid': formData.postal_code && !postalCodeValid }"
                    placeholder="00000"
                    maxlength="5"
                    required
                />
                <small v-if="formData.postal_code && !postalCodeValid" class="p-error">Debe ser un código postal de 5 dígitos</small>
            </div>
        </div>

        <!-- Row 5: File Uploads (Optional) -->
        <div class="col-12">
            <div class="field">
                <label class="font-medium">Foto de Fachada (opcional)</label>
                <FileUpload
                    mode="basic"
                    accept="image/*"
                    :maxFileSize="5000000"
                    @select="formData.picture = $event.files[0]"
                    chooseLabel="Seleccionar Foto"
                />
            </div>
        </div>

        <div class="col-12">
            <div class="field">
                <label class="font-medium">Fotos Adicionales (opcional)</label>
                <FileUpload
                    mode="basic"
                    accept="image/*"
                    :multiple="true"
                    :maxFileSize="5000000"
                    @select="formData.additional_pictures = $event.files"
                    chooseLabel="Seleccionar Fotos"
                />
            </div>
        </div>

        <div class="col-12">
            <div class="field">
                <label class="font-medium">Layout (PDF o imagen, opcional)</label>
                <FileUpload
                    mode="basic"
                    accept="image/*,application/pdf"
                    :maxFileSize="10000000"
                    @select="formData.layout = $event.files[0]"
                    chooseLabel="Seleccionar Layout"
                />
            </div>
        </div>
    </div>
</template>
