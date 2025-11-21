<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Steps from 'primevue/steps';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Password from 'primevue/password';
import FileUpload from 'primevue/fileupload';
import ProgressSpinner from 'primevue/progressspinner';
import nubariumService from '@/lib/nubariumService.js';

const { user, profile, completeOnboarding, logout } = useAuth();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const currentStep = ref(0);

// Form data for each step - CLIENT SPECIFICATION
const formData = ref({
    // Step 1: SAT Data (RFC + optional CIEC)
    rfc: '',
    ciecPassword: '', // Optional for clients
    satValidationResults: null,

    // Step 2: INE + Selfie (no blacklist check for clients)
    ineFrontFile: null,
    ineBackFile: null,
    selfieFile: null,
    ineData: null, // Extracted OCR data from Nubarium
    biometryResults: null, // Face comparison results

    // Step 3: Asset and contact data
    companyName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    businessAddress: '',
    assets: [
        {
            name: '',
            type: '',
            location: '',
            description: ''
        }
    ]
});

// Client onboarding steps - MATCHING USER SPECIFICATION
const onboardingData = {
    title: 'Verificación de Cliente - Mantex',
    steps: [
        {
            label: 'SAT (RFC + CIEC)',
            description: 'Verificación fiscal con RFC y contraseña CIEC (opcional)'
        },
        {
            label: 'INE + Selfie',
            description: 'Validación de identidad sin verificación de blacklist'
        },
        {
            label: 'Datos y Activos',
            description: 'Información de contacto y registro de activos'
        }
    ]
};

// Estado
const userName = computed(() => profile.value?.username || user.value?.email?.split('@')[0] || 'Cliente');
const isCompleted = computed(() => profile.value?.onboarding_complete);

// Validation functions
const validateStep1 = () => {
    if (!formData.value.rfc || formData.value.rfc.trim() === '') {
        toast.add({
            severity: 'warn',
            summary: 'Campo Requerido',
            detail: 'RFC es obligatorio',
            life: 3000
        });
        return false;
    }

    // Validar formato RFC
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(formData.value.rfc.toUpperCase())) {
        toast.add({
            severity: 'warn',
            summary: 'RFC Inválido',
            detail: 'Por favor ingresa un RFC válido (ejemplo: ABC123456789)',
            life: 3000
        });
        return false;
    }

    return true;
};

const validateStep2 = () => {
    if (!formData.value.ineFrontFile) {
        toast.add({
            severity: 'warn',
            summary: 'Archivo Requerido',
            detail: 'Debes subir la imagen frontal del INE',
            life: 3000
        });
        return false;
    }

    if (!formData.value.ineBackFile) {
        toast.add({
            severity: 'warn',
            summary: 'Archivo Requerido',
            detail: 'Debes subir la imagen trasera del INE',
            life: 3000
        });
        return false;
    }

    if (!formData.value.selfieFile) {
        toast.add({
            severity: 'warn',
            summary: 'Archivo Requerido',
            detail: 'Debes tomar una selfie para validación facial',
            life: 3000
        });
        return false;
    }

    return true;
};

const validateStep3 = () => {
    const requiredFields = ['companyName', 'contactPerson', 'phoneNumber'];

    for (const field of requiredFields) {
        if (!formData.value[field] || formData.value[field].trim() === '') {
            const fieldNames = {
                'companyName': 'Nombre de la empresa',
                'contactPerson': 'Persona de contacto',
                'phoneNumber': 'Teléfono'
            };

            toast.add({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: `${fieldNames[field]} es obligatorio`,
                life: 3000
            });
            return false;
        }
    }

    return true;
};

const validateCurrentStep = () => {
    switch (currentStep.value) {
        case 0:
            return validateStep1();
        case 1:
            return validateStep2();
        case 2:
            return validateStep3();
        default:
            return true;
    }
};

// Real Nubarium API integration functions
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

const processSATValidation = async () => {
    loading.value = true;
    toast.add({
        severity: 'info',
        summary: 'Validando SAT',
        detail: 'Verificando RFC...',
        life: 3000
    });

    try {
        // Paso 1: Obtener nombre/razón social del RFC
        const rfcNameResult = await nubariumService.getRFCName(formData.value.rfc);

        if (rfcNameResult.success && rfcNameResult.normalized.tieneNombre) {
            toast.add({
                severity: 'info',
                summary: 'RFC Identificado',
                detail: `Empresa/Persona: ${rfcNameResult.normalized.nombre}`,
                life: 4000
            });
        }

        // Paso 2: For clients, we only validate RFC, CIEC is optional
        const rfcValidation = await nubariumService.validateClientRFC(formData.value.rfc);

        if (!rfcValidation.success) {
            throw new Error(rfcValidation.error || 'Error en validación de RFC');
        }

        // Combinar resultados de nombre y validación RFC
        formData.value.satValidationResults = {
            ...rfcValidation.normalized,
            nombreRazonSocial: rfcNameResult.success ? rfcNameResult.normalized : null
        };

        // Paso 3: Optional CIEC validation
        if (formData.value.ciecPassword && formData.value.ciecPassword.length >= 8) {
            toast.add({
                severity: 'info',
                summary: 'Validando CIEC',
                detail: 'Verificando contraseña CIEC...',
                life: 3000
            });

            const ciecValidation = await nubariumService.validateClientCIEC({
                rfc: formData.value.rfc,
                password: formData.value.ciecPassword
            });

            if (ciecValidation && ciecValidation.success) {
                formData.value.satValidationResults.ciec = ciecValidation.normalized;
            }
        }

        toast.add({
            severity: 'success',
            summary: 'SAT Validado',
            detail: 'RFC verificado correctamente',
            life: 3000
        });

        return true;

    } catch (error) {
        console.error('Error en validación SAT:', error);
        toast.add({
            severity: 'error',
            summary: 'Error de Validación SAT',
            detail: `Error al validar RFC: ${error.message}`,
            life: 5000
        });
        return false;
    } finally {
        loading.value = false;
    }
};

const processINEValidation = async () => {
    loading.value = true;
    toast.add({
        severity: 'info',
        summary: 'Validando INE',
        detail: 'Procesando documentos con Nubarium...',
        life: 3000
    });

    try {
        // Convert files to base64
        const frontBase64 = await fileToBase64(formData.value.ineFrontFile);
        const backBase64 = await fileToBase64(formData.value.ineBackFile);
        const selfieBase64 = await fileToBase64(formData.value.selfieFile);

        // Client INE validation (OCR + Lista Nominal + Face Comparison, NO blacklist check)
        const ineValidation = await nubariumService.validateClientINE(
            frontBase64,
            backBase64,
            selfieBase64,
            80 // 80% similarity threshold
        );

        if (!ineValidation.success) {
            throw new Error(ineValidation.error || 'Error en validación de INE');
        }

        formData.value.ineData = ineValidation.data;
        formData.value.biometryResults = ineValidation.normalized;

        toast.add({
            severity: 'success',
            summary: 'INE Validado',
            detail: 'Identidad verificada exitosamente (sin blacklist)',
            life: 3000
        });

        return true;

    } catch (error) {
        console.error('Error en validación de INE:', error);
        toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: `Error al validar INE: ${error.message}`,
            life: 5000
        });
        return false;
    } finally {
        loading.value = false;
    }
};

const completeStep = async () => {
    if (isCompleted.value) {
        goToDashboard();
        return;
    }

    // Validate current step before proceeding
    if (!validateCurrentStep()) {
        return;
    }

    // Special processing for steps with Nubarium validations
    if (currentStep.value === 0) {
        // Step 1: SAT validation
        const satValid = await processSATValidation();
        if (!satValid) return;
    } else if (currentStep.value === 1) {
        // Step 2: INE + Selfie validation
        const ineValid = await processINEValidation();
        if (!ineValid) return;
    }

    if (currentStep.value < onboardingData.steps.length - 1) {
        currentStep.value++;
        toast.add({
            severity: 'success',
            summary: 'Paso Completado',
            detail: `Paso ${currentStep.value + 1} completado exitosamente`,
            life: 2000
        });
    } else {
        loading.value = true;
        try {
            // Save client data to the database
            await saveClientData();

            // Complete onboarding
            await completeOnboarding(user.value.id);

            toast.add({
                severity: 'success',
                summary: 'Registro Completado',
                detail: 'Tu perfil de cliente ha sido configurado exitosamente',
                life: 3000
            });

            // Redirect to Client Dashboard
            setTimeout(() => goToDashboard(), 1000);

        } catch (error) {
            console.error('Error al finalizar onboarding:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al completar el registro. Inténtelo de nuevo.',
                life: 5000
            });
        } finally {
            loading.value = false;
        }
    }
};

const saveClientData = async () => {
    console.log('🔄 Guardando datos del cliente en Supabase...');

    try {
        // Importar supabase aquí para evitar problemas de dependencias
        const { supabase } = await import('@/lib/supabaseClient.js');

        // Preparar datos para guardar en la tabla client_profiles
        const clientData = {
            user_id: user.value.id,
            username: profile.value?.username || user.value?.email?.split('@')[0],

            // Datos de identificación (extraidos del INE)
            full_name: formData.value.biometryResults?.nombreCompleto || 'Pending Validation',
            curp: formData.value.biometryResults?.curp || null,

            // Datos fiscales y SAT
            rfc: formData.value.rfc.toUpperCase(),

            // Datos de contacto y empresa
            company_name: formData.value.companyName,
            contact_person: formData.value.contactPerson,
            phone_number: formData.value.phoneNumber,
            email: formData.value.email || user.value.email,
            business_address: formData.value.businessAddress,

            // Assets
            assets: formData.value.assets.filter(asset => asset.name.trim() !== ''),

            // Nubarium validation results
            nubarium_validations: {
                ine_validation: formData.value.ineData,
                biometry_results: formData.value.biometryResults,
                sat_validation: formData.value.satValidationResults
            },

            // Metadatos
            submitted_at: new Date().toISOString(),
            status: 'submitted',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // UPSERT en la tabla client_profiles
        const { data, error } = await supabase
            .from('client_profiles')
            .upsert(clientData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Error al guardar datos del cliente:', error);
            throw new Error(`Error de base de datos: ${error.message}`);
        }

        console.log('✅ Datos del cliente guardados exitosamente:', data);

        return data;

    } catch (error) {
        console.error('💥 Error crítico al guardar datos del cliente:', error);
        throw error;
    }
};

// File upload handlers
const onINEFrontSelect = (event) => {
    formData.value.ineFrontFile = event.files[0];
};

const onINEBackSelect = (event) => {
    formData.value.ineBackFile = event.files[0];
};

const onSelfieSelect = (event) => {
    formData.value.selfieFile = event.files[0];
};

const addAsset = () => {
    formData.value.assets.push({
        name: '',
        type: '',
        location: '',
        description: ''
    });
};

const removeAsset = (index) => {
    formData.value.assets.splice(index, 1);
};

const goToDashboard = () => {
    router.replace('/client/dashboard');
};

// Save draft functionality
const saveDraft = async () => {
    try {
        loading.value = true;
        localStorage.setItem('client_onboarding_draft', JSON.stringify({
            formData: formData.value,
            currentStep: currentStep.value,
            savedAt: new Date().toISOString()
        }));

        toast.add({
            severity: 'success',
            summary: 'Borrador Guardado',
            detail: 'Tu progreso ha sido guardado.',
            life: 3000
        });
    } catch (error) {
        console.error('Error guardando borrador:', error);
    } finally {
        loading.value = false;
    }
};

// Load draft on mount
const loadDraft = () => {
    try {
        const draft = localStorage.getItem('client_onboarding_draft');
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            if (parsedDraft.formData && parsedDraft.currentStep !== undefined) {
                formData.value = { ...formData.value, ...parsedDraft.formData };
                currentStep.value = parsedDraft.currentStep;

                toast.add({
                    severity: 'info',
                    summary: 'Borrador Recuperado',
                    detail: 'Se ha restaurado tu progreso anterior',
                    life: 3000
                });
            }
        }
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
};

onMounted(() => {
    loadDraft();
});
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen overflow-hidden">
        <div class="flex flex-col items-center justify-center w-full max-w-6xl mx-auto p-4">

            <!-- Header with Logo and Actions -->
            <div class="w-full flex justify-between items-center mb-8">
                <div class="flex items-center gap-4">
                    <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-12 w-auto">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467Z" fill="var(--primary-color)" />
                    </svg>
                    <div>
                        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ onboardingData.title }}</h1>
                        <p class="text-surface-600 dark:text-surface-200 m-0 mt-2">Hola, {{ userName }}. Completa tu configuración de cliente</p>
                    </div>
                </div>

                <Button
                    label="Cerrar Sesión"
                    icon="pi pi-sign-out"
                    text
                    @click="logout"
                    class="text-surface-500 hover:text-surface-700"
                />
            </div>

            <!-- Main Onboarding Card -->
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)" class="w-full">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-8 px-8" style="border-radius: 53px">

                    <!-- Completion Message -->
                    <Message severity="success" v-if="isCompleted" class="mb-6">
                        ¡Tu cuenta está lista! Redireccionando al panel principal.
                        <Button label="Ir al Dashboard" text @click="goToDashboard" class="ml-2" />
                    </Message>

                    <!-- Progress Steps -->
                    <Steps
                        :model="onboardingData.steps"
                        :readonly="true"
                        :activeIndex="currentStep"
                        class="mb-8"
                    />

                    <!-- Step Content -->
                    <div v-if="!isCompleted" class="card">
                        <div class="text-center mb-6">
                            <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                Paso {{ currentStep + 1 }}: {{ onboardingData.steps[currentStep].label }}
                            </h2>
                            <p class="text-surface-600 dark:text-surface-200">
                                {{ onboardingData.steps[currentStep].description }}
                            </p>
                        </div>

                        <!-- Loading Spinner -->
                        <div v-if="loading" class="text-center py-8">
                            <ProgressSpinner />
                            <p class="mt-4 text-surface-600 dark:text-surface-200">
                                Validando información...
                            </p>
                        </div>

                        <!-- Step Forms -->
                        <div v-else>
                            <!-- Step 1: SAT (RFC + optional CIEC) -->
                            <div v-if="currentStep === 0" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-600 rounded-md">
                                        <h5 class="font-semibold text-blue-700 dark:text-blue-400 mb-2">📊 Validación Fiscal SAT</h5>
                                        <p class="text-sm text-blue-600 dark:text-blue-300">
                                            Ingresa tu RFC y opcionalmente tu contraseña CIEC para validación completa
                                        </p>
                                    </div>
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <label for="rfc" class="block font-semibold mb-2">RFC *</label>
                                    <InputText
                                        id="rfc"
                                        v-model="formData.rfc"
                                        class="w-full"
                                        placeholder="ABC123456789"
                                        @input="formData.rfc = formData.rfc.toUpperCase()"
                                    />
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <label for="ciecPassword" class="block font-semibold mb-2">Contraseña CIEC (Opcional)</label>
                                    <Password
                                        id="ciecPassword"
                                        v-model="formData.ciecPassword"
                                        :feedback="false"
                                        toggleMask
                                        class="w-full"
                                        placeholder="Tu contraseña CIEC (opcional)"
                                    />
                                </div>

                                <div class="col-span-12">
                                    <small class="text-surface-500">
                                        La contraseña CIEC es opcional para clientes pero permite una validación más completa de tu situación fiscal
                                    </small>
                                </div>

                                <div v-if="formData.satValidationResults" class="col-span-12 mt-4">
                                    <div class="p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">✅ SAT Validado</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            RFC verificado correctamente: {{ formData.satValidationResults.valido ? 'Activo' : 'Inactivo' }}
                                        </p>
                                        <div v-if="formData.satValidationResults.nombreRazonSocial?.nombre" class="mt-2 text-sm">
                                            <strong>Razón Social:</strong> {{ formData.satValidationResults.nombreRazonSocial.nombre }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: INE + Selfie (no blacklist) -->
                            <div v-if="currentStep === 1" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h5 class="font-semibold text-green-700 dark:text-green-400 mb-2">🆔 Identificación Oficial (Cliente)</h5>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Sube las imágenes de tu INE y toma una selfie. No se verifican listas de bloqueo para clientes.
                                        </p>
                                    </div>
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <h5 class="font-semibold mb-3">INE Frontal *</h5>
                                    <FileUpload
                                        mode="basic"
                                        accept=".jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onINEFrontSelect"
                                        choose-label="Seleccionar INE Frontal"
                                        class="mb-3"
                                    />
                                    <small v-if="formData.ineFrontFile" class="text-green-600">
                                        ✓ {{ formData.ineFrontFile.name }}
                                    </small>
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <h5 class="font-semibold mb-3">INE Trasera *</h5>
                                    <FileUpload
                                        mode="basic"
                                        accept=".jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onINEBackSelect"
                                        choose-label="Seleccionar INE Trasera"
                                        class="mb-3"
                                    />
                                    <small v-if="formData.ineBackFile" class="text-green-600">
                                        ✓ {{ formData.ineBackFile.name }}
                                    </small>
                                </div>

                                <div class="col-span-12">
                                    <h5 class="font-semibold mb-3">Selfie *</h5>
                                    <FileUpload
                                        mode="basic"
                                        accept=".jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onSelfieSelect"
                                        choose-label="Tomar/Seleccionar Selfie"
                                        class="mb-3"
                                    />
                                    <small v-if="formData.selfieFile" class="text-green-600">
                                        ✓ {{ formData.selfieFile.name }}
                                    </small>
                                </div>

                                <div v-if="formData.biometryResults" class="col-span-12 mt-4">
                                    <div class="p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">✅ Identidad Validada</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Identidad verificada exitosamente sin verificación de blacklist
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 3: Company and Assets Data -->
                            <div v-if="currentStep === 2" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-purple-50 dark:bg-purple-400/10 border border-purple-200 dark:border-purple-600 rounded-md">
                                        <h5 class="font-semibold text-purple-700 dark:text-purple-400 mb-2">🏢 Datos de Contacto y Activos</h5>
                                        <p class="text-sm text-purple-600 dark:text-purple-300">
                                            Información de tu empresa y los activos que requieren mantenimiento
                                        </p>
                                    </div>
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <label for="companyName" class="block font-semibold mb-2">Nombre de la Empresa *</label>
                                    <InputText
                                        id="companyName"
                                        v-model="formData.companyName"
                                        class="w-full"
                                        placeholder="Ej: Mi Empresa S.A. de C.V."
                                    />
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <label for="contactPerson" class="block font-semibold mb-2">Persona de Contacto *</label>
                                    <InputText
                                        id="contactPerson"
                                        v-model="formData.contactPerson"
                                        class="w-full"
                                        placeholder="Nombre del responsable"
                                    />
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <label for="phoneNumber" class="block font-semibold mb-2">Teléfono *</label>
                                    <InputText
                                        id="phoneNumber"
                                        v-model="formData.phoneNumber"
                                        type="tel"
                                        class="w-full"
                                        placeholder="55-1234-5678"
                                    />
                                </div>

                                <div class="col-span-12 md:col-span-6">
                                    <label for="email" class="block font-semibold mb-2">Email de Contacto</label>
                                    <InputText
                                        id="email"
                                        v-model="formData.email"
                                        type="email"
                                        class="w-full"
                                        placeholder="contacto@empresa.com"
                                    />
                                    <small class="text-surface-500">Si es diferente al email de registro</small>
                                </div>

                                <div class="col-span-12">
                                    <label for="businessAddress" class="block font-semibold mb-2">Dirección del Negocio</label>
                                    <Textarea
                                        id="businessAddress"
                                        v-model="formData.businessAddress"
                                        rows="3"
                                        class="w-full"
                                        placeholder="Calle, Número, Colonia, C.P., Ciudad, Estado"
                                    />
                                </div>

                                <!-- Assets Section -->
                                <div class="col-span-12">
                                    <div class="flex justify-between items-center mb-4">
                                        <h5 class="font-semibold">Activos para Mantenimiento</h5>
                                        <Button label="Agregar Activo" icon="pi pi-plus" size="small" @click="addAsset" />
                                    </div>
                                </div>

                                <div v-for="(asset, index) in formData.assets" :key="index" class="col-span-12">
                                    <div class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg mb-4">
                                        <div class="flex justify-between items-center mb-3">
                                            <h6 class="font-semibold">Activo {{ index + 1 }}</h6>
                                            <Button
                                                v-if="formData.assets.length > 1"
                                                icon="pi pi-trash"
                                                size="small"
                                                severity="danger"
                                                text
                                                @click="removeAsset(index)"
                                            />
                                        </div>
                                        <div class="grid grid-cols-12 gap-4">
                                            <div class="col-span-12 md:col-span-6">
                                                <label class="block font-medium mb-2">Nombre del Activo</label>
                                                <InputText
                                                    v-model="asset.name"
                                                    class="w-full"
                                                    placeholder="Ej: Aire Acondicionado Principal"
                                                />
                                            </div>
                                            <div class="col-span-12 md:col-span-6">
                                                <label class="block font-medium mb-2">Tipo</label>
                                                <InputText
                                                    v-model="asset.type"
                                                    class="w-full"
                                                    placeholder="Ej: HVAC, Eléctrico, Plomería"
                                                />
                                            </div>
                                            <div class="col-span-12">
                                                <label class="block font-medium mb-2">Ubicación</label>
                                                <InputText
                                                    v-model="asset.location"
                                                    class="w-full"
                                                    placeholder="Ej: Planta Baja, Oficina Principal"
                                                />
                                            </div>
                                            <div class="col-span-12">
                                                <label class="block font-medium mb-2">Descripción</label>
                                                <Textarea
                                                    v-model="asset.description"
                                                    rows="2"
                                                    class="w-full"
                                                    placeholder="Descripción adicional del activo..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Navigation Buttons -->
                        <div class="flex justify-between items-center mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                            <Button
                                v-if="currentStep > 0"
                                label="Paso Anterior"
                                icon="pi pi-arrow-left"
                                text
                                @click="currentStep--"
                                class="text-surface-600 dark:text-surface-300"
                            />
                            <div v-else></div>

                            <div class="flex gap-3">
                                <Button
                                    label="Guardar Borrador"
                                    icon="pi pi-save"
                                    outlined
                                    @click="saveDraft"
                                    :disabled="loading"
                                />
                                <Button
                                    :label="currentStep < onboardingData.steps.length - 1 ? 'Siguiente Paso' : 'Completar Registro'"
                                    :icon="currentStep < onboardingData.steps.length - 1 ? 'pi pi-arrow-right' : 'pi pi-check'"
                                    :iconPos="currentStep < onboardingData.steps.length - 1 ? 'right' : 'left'"
                                    @click="completeStep"
                                    :loading="loading"
                                    :disabled="isCompleted"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
}

.field label {
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
    color: var(--text-color-secondary);
}
</style>