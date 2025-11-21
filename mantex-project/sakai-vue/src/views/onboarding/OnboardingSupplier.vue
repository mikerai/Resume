<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useVerifications } from '@/composables/useVerifications';
import { useS3Upload } from '@/composables/useS3Upload';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Steps from 'primevue/steps';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Password from 'primevue/password';
import FileUpload from 'primevue/fileupload';
import MultiSelect from 'primevue/multiselect';
import ProgressSpinner from 'primevue/progressspinner';
import PickList from 'primevue/picklist';
import nubariumService from '@/lib/nubariumService.js';

const { user, profile, completeOnboarding, logout } = useAuth();
const {
    saveINEVerification,
    saveSATVerification,
    saveBlocklistVerification,
    saveDocument
} = useVerifications();

const {
    uploadINEFiles,
    uploadMultipleDocuments,
    isUploading
} = useS3Upload();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const currentStep = ref(0);

// Form data for each step - RESTRUCTURED TO MATCH USER SPECIFICATION
const formData = ref({
    // Step 1: INE + Selfie Biometrics
    ineFrontFile: null,
    ineBackFile: null,
    selfieFile: null,
    ineData: null, // Extracted OCR data from Nubarium
    biometryResults: null, // Face comparison results
    blacklistResults: null, // Block list validation results

    // Step 2: SAT Data (ONLY RFC + CIEC)
    rfc: '',
    ciecPassword: '', // CIEC password
    satValidationResults: null,

    // Step 3: Business Documents
    insuranceFiles: [],
    legalDocuments: [],
    certifications: [],

    // Step 4: Service Areas & Specialties (with PickList)
    selectedSpecialties: [],
    serviceAreas: [],
    workingHours: '',
    serviceRadius: '',
    businessDescription: '',

    // Step 5: Review data (computed)
    // All validation results will be shown here
});

// Enhanced onboarding steps - MATCHING USER SPECIFICATION EXACTLY
const onboardingData = {
    title: 'Verificación de Proveedor - Mantex',
    steps: [
        {
            label: 'INE + Selfie',
            description: 'Validación de identidad con INE frontal, trasero y selfie'
        },
        {
            label: 'SAT (RFC + CIEC)',
            description: 'Verificación fiscal con RFC y contraseña CIEC'
        },
        {
            label: 'Documentos',
            description: 'Pólizas, certificaciones y documentos legales'
        },
        {
            label: 'Especialidades',
            description: 'Servicios y áreas de trabajo con PickList'
        },
        {
            label: 'Revisión',
            description: 'Revisión final de todos los datos validados'
        }
    ]
};

// Available specialties for PickList
const availableSpecialties = ref([
    { name: 'HVAC (Climatización)', code: 'hvac' },
    { name: 'Sistemas Eléctricos', code: 'electrical' },
    { name: 'Plomería y Sanitarios', code: 'plumbing' },
    { name: 'Sistemas de Seguridad', code: 'security' },
    { name: 'Limpieza Industrial', code: 'cleaning' },
    { name: 'Carpintería', code: 'carpentry' },
    { name: 'Pintura y Acabados', code: 'painting' },
    { name: 'Jardinería y Landscaping', code: 'landscaping' },
    { name: 'Mantenimiento Preventivo', code: 'preventive' },
    { name: 'Reparaciones Generales', code: 'general_repair' },
    { name: 'Soldadura', code: 'welding' },
    { name: 'Refrigeración', code: 'refrigeration' }
]);

// PickList data: [source, target]
const specialtiesPickList = ref([availableSpecialties.value, []]);

// Options for dropdowns
const serviceAreaOptions = [
    { label: 'HVAC (Climatización)', value: 'hvac' },
    { label: 'Eléctrico', value: 'electrical' },
    { label: 'Plomería', value: 'plumbing' },
    { label: 'Seguridad', value: 'security' },
    { label: 'Limpieza & Mantenimiento', value: 'cleaning' },
    { label: 'Jardinería & Paisajismo', value: 'landscaping' },
    { label: 'Tecnología & IT', value: 'technology' },
    { label: 'Mobiliario & Equipamiento', value: 'furniture' },
    { label: 'Construcción & Obra Civil', value: 'construction' },
    { label: 'Otros', value: 'others' }
];

const specialtyOptions = [
    { label: 'Mantenimiento Preventivo', value: 'preventive' },
    { label: 'Reparaciones de Emergencia', value: 'emergency' },
    { label: 'Instalaciones Nuevas', value: 'installations' },
    { label: 'Inspecciones Técnicas', value: 'inspections' },
    { label: 'Consultoría Especializada', value: 'consulting' },
    { label: 'Capacitación y Entrenamiento', value: 'training' }
];

// Estado
const userName = computed(() => profile.value?.username || user.value?.email?.split('@')[0] || 'Proveedor');
const isCompleted = computed(() => profile.value?.onboarding_complete);

// Validation functions - UPDATED FOR NEW FLOW
const validateStep1 = () => {
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

const validateStep2 = () => {
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

    if (!formData.value.ciecPassword || formData.value.ciecPassword.length < 8) {
        toast.add({
            severity: 'warn',
            summary: 'Contraseña CIEC Requerida',
            detail: 'La contraseña CIEC del SAT es obligatoria y debe tener al menos 8 caracteres',
            life: 3000
        });
        return false;
    }

    return true;
};

const validateStep3 = () => {
    if (formData.value.insuranceFiles.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Documentos Requeridos',
            detail: 'Debe subir al menos la póliza de seguro',
            life: 3000
        });
        return false;
    }
    return true;
};

const validateStep4 = () => {
    if (formData.value.selectedSpecialties.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Especialidades Requeridas',
            detail: 'Debe seleccionar al menos una especialidad usando el PickList',
            life: 3000
        });
        return false;
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
        case 3:
            return validateStep4();
        case 4:
            return true; // Review step, no validation needed
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

        // Mostrar progreso y permitir continuar
        toast.add({
            severity: 'info',
            summary: 'Validación en Progreso',
            detail: 'Procesando INE... Puedes continuar con el siguiente paso',
            life: 5000
        });

        // Validaciones asíncronas en background
        processINEValidationAsync(
            frontBase64,
            backBase64,
            selfieBase64,
            formData.value.ineFrontFile,    // Archivo original para subir a S3
            formData.value.ineBackFile,     // Archivo original para subir a S3
            formData.value.selfieFile       // Archivo original para subir a S3
        );

        // Datos temporales para permitir continuar
        formData.value.biometryResults = {
            validacion: 'procesando',
            mensaje: 'Validación en progreso...'
        };

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

/**
 * Procesar validación de INE de forma asíncrona en background
 */
const processINEValidationAsync = async (frontBase64, backBase64, selfieBase64, frontFile, backFile, selfieFile) => {
    try {
        console.log('🔄 Iniciando validación asíncrona de INE...');

        // Step 1: OCR + Lista Nominal + Face Comparison
        const ineValidation = await nubariumService.validateSupplierINE(
            frontBase64,
            backBase64,
            selfieBase64,
            80 // 80% similarity threshold
        );

        // 💾 GUARDAR RESPONSE COMPLETO DE INE - EL ORO DE LA EMPRESA 💾
        let ineVerificationRecord = null;
        try {
            ineVerificationRecord = await saveINEVerification(user.value.id, {
                curp: ineValidation.normalized?.curp || null,
                ine_number: ineValidation.normalized?.numeroINE || null,
                verification_status: ineValidation.success ? 'verified' : 'rejected',
                verification_response: ineValidation.data, // RESPONSE COMPLETO DE NUBARIUM
                verified_at: new Date().toISOString()
            });
            console.log('💎 Response INE guardado con ID:', ineVerificationRecord?.id);
        } catch (saveError) {
            console.error('❌ Error guardando response INE:', saveError);
        }

        // 📤 SUBIR IMÁGENES INE A S3 Y GUARDAR REFERENCIAS EN BD 📤
        let s3UploadResults = null;
        if (ineVerificationRecord && frontFile && backFile && selfieFile) {
            try {
                console.log('📤 Subiendo imágenes INE a S3...');
                const username = profile.value?.username || user.value.email.split('@')[0];

                s3UploadResults = await uploadINEFiles(
                    frontFile,
                    backFile,
                    selfieFile,
                    username,
                    ineVerificationRecord.id
                );

                // Guardar referencias de documentos en BD
                if (s3UploadResults.success) {
                    const documentPromises = [
                        saveDocument(user.value.id, {
                            document_type: 'ine_front',
                            document_name: frontFile.name,
                            file_url: s3UploadResults.front.file_url,
                            s3_key: s3UploadResults.front.s3_key,
                            file_size: s3UploadResults.front.file_size,
                            mime_type: s3UploadResults.front.mime_type,
                            verification_id: ineVerificationRecord.id
                        }),
                        saveDocument(user.value.id, {
                            document_type: 'ine_back',
                            document_name: backFile.name,
                            file_url: s3UploadResults.back.file_url,
                            s3_key: s3UploadResults.back.s3_key,
                            file_size: s3UploadResults.back.file_size,
                            mime_type: s3UploadResults.back.mime_type,
                            verification_id: ineVerificationRecord.id
                        }),
                        saveDocument(user.value.id, {
                            document_type: 'ine_selfie',
                            document_name: selfieFile.name,
                            file_url: s3UploadResults.selfie.file_url,
                            s3_key: s3UploadResults.selfie.s3_key,
                            file_size: s3UploadResults.selfie.file_size,
                            mime_type: s3UploadResults.selfie.mime_type,
                            verification_id: ineVerificationRecord.id
                        })
                    ];

                    await Promise.all(documentPromises);
                    console.log('💎 Referencias de documentos INE guardadas en BD');
                }

            } catch (uploadError) {
                console.error('❌ Error subiendo imágenes INE a S3:', uploadError);
                // No fallar la validación por errores de S3
            }
        }

        if (ineValidation.success) {
            formData.value.ineData = ineValidation.data;
            formData.value.biometryResults = ineValidation.normalized;

            // Step 2: Blacklist validation
            try {
                const blacklistValidation = await nubariumService.queryAllBlockLists(
                    ineValidation.normalized.curp || 'UNKNOWN'
                );
                formData.value.blacklistResults = blacklistValidation.normalized;

                // 💾 GUARDAR RESPONSE COMPLETO DE BLOCKLIST 💾
                try {
                    await saveBlocklistVerification(user.value.id, {
                        rfc: ineValidation.normalized.curp || 'UNKNOWN',
                        query_type: '69', // Tipo de consulta
                        verification_status: blacklistValidation.success ? 'verified' : 'rejected',
                        is_blocked: blacklistValidation.normalized?.enListaNegra || false,
                        verification_response: blacklistValidation.data, // RESPONSE COMPLETO DE NUBARIUM
                        verified_at: new Date().toISOString()
                    });
                    console.log('💎 Response Blocklist guardado');
                } catch (saveError) {
                    console.error('❌ Error guardando response Blocklist:', saveError);
                }

            } catch (blacklistError) {
                console.warn('Blacklist validation failed:', blacklistError);
                // Guardar error también
                try {
                    await saveBlocklistVerification(user.value.id, {
                        rfc: ineValidation.normalized.curp || 'UNKNOWN',
                        query_type: '69',
                        verification_status: 'error',
                        is_blocked: false,
                        verification_response: { error: blacklistError.message || blacklistError.toString() },
                        verified_at: new Date().toISOString()
                    });
                } catch (saveError) {
                    console.error('❌ Error guardando error de Blocklist:', saveError);
                }
            }

            toast.add({
                severity: 'success',
                summary: '✅ INE Validado',
                detail: 'Identidad verificada exitosamente',
                life: 4000
            });
        } else {
            formData.value.biometryResults = {
                validacion: 'error',
                mensaje: ineValidation.error || 'Error en validación'
            };

            toast.add({
                severity: 'error',
                summary: '❌ Validación INE Falló',
                detail: ineValidation.error || 'Error en la validación',
                life: 6000
            });
        }
    } catch (error) {
        console.error('Error en validación asíncrona de INE:', error);

        // 💾 GUARDAR ERROR TAMBIÉN - IMPORTANTE PARA DEBUGGING 💾
        try {
            await saveINEVerification(user.value.id, {
                curp: null,
                ine_number: null,
                verification_status: 'error',
                verification_response: {
                    error: error.message || error.toString(),
                    timestamp: new Date().toISOString(),
                    step: 'ine_validation_async'
                },
                verified_at: new Date().toISOString()
            });
            console.log('💎 Error INE guardado para debugging');
        } catch (saveError) {
            console.error('❌ Error guardando error INE:', saveError);
        }

        formData.value.biometryResults = {
            validacion: 'error',
            mensaje: 'Error de conexión'
        };

        toast.add({
            severity: 'warn',
            summary: '⚠️ Validación INE Pendiente',
            detail: 'La validación se completará en segundo plano',
            life: 5000
        });
    }
};

const processSATValidation = async () => {
    loading.value = true;

    toast.add({
        severity: 'info',
        summary: 'Validación en Progreso',
        detail: 'Procesando datos fiscales... Puedes continuar',
        life: 5000
    });

    // Validaciones asíncronas en background
    processSATValidationAsync();

    // Datos temporales para permitir continuar
    formData.value.satValidationResults = {
        validacion: 'procesando',
        mensaje: 'Validación fiscal en progreso...'
    };

    loading.value = false;
    return true;
};

/**
 * Procesar validación SAT de forma asíncrona en background
 */
const processSATValidationAsync = async () => {
    try {
        console.log('🔄 Iniciando validación asíncrona SAT...');
        const webhookUrl = import.meta.env.VITE_LAMBDA_WEBHOOK_URL;

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

        // Paso 2: Validación SAT completa
        const satValidation = await nubariumService.validateSupplierSAT(
            formData.value.rfc,
            formData.value.ciecPassword,
            webhookUrl
        );

        // 💾 GUARDAR RESPONSE COMPLETO DE SAT - EL ORO DE LA EMPRESA 💾
        let satVerificationRecord = null;
        try {
            satVerificationRecord = await saveSATVerification(user.value.id, {
                rfc: formData.value.rfc,
                ciec: null, // No guardar la CIEC por seguridad
                verification_status: satValidation.success ? 'verified' : 'rejected',
                tax_status: satValidation.success ? satValidation.normalized : null,
                verification_response: {
                    // Combinar ambos responses: nombre + validación SAT
                    rfc_name_validation: rfcNameResult.data,
                    sat_validation: satValidation.data
                },
                verified_at: new Date().toISOString()
            });
            console.log('💎 Response SAT guardado con ID:', satVerificationRecord?.id);
        } catch (saveError) {
            console.error('❌ Error guardando response SAT:', saveError);
        }

        if (satValidation.success) {
            // Combinar resultados de nombre y validación SAT
            formData.value.satValidationResults = {
                ...satValidation.normalized,
                nombreRazonSocial: rfcNameResult.success ? rfcNameResult.normalized : null
            };

            toast.add({
                severity: 'success',
                summary: '✅ SAT Validado',
                detail: 'Datos fiscales verificados correctamente',
                life: 4000
            });
        } else {
            formData.value.satValidationResults = {
                validacion: 'error',
                mensaje: satValidation.error || 'Error en validación SAT'
            };

            toast.add({
                severity: 'error',
                summary: '❌ Validación SAT Falló',
                detail: satValidation.error || 'Error en la validación',
                life: 6000
            });
        }
    } catch (error) {
        console.error('Error en validación asíncrona SAT:', error);

        // 💾 GUARDAR ERROR TAMBIÉN - IMPORTANTE PARA DEBUGGING 💾
        try {
            await saveSATVerification(user.value.id, {
                rfc: formData.value.rfc,
                ciec: null,
                verification_status: 'error',
                tax_status: null,
                verification_response: {
                    error: error.message || error.toString(),
                    timestamp: new Date().toISOString(),
                    step: 'sat_validation_async'
                },
                verified_at: new Date().toISOString()
            });
            console.log('💎 Error SAT guardado para debugging');
        } catch (saveError) {
            console.error('❌ Error guardando error SAT:', saveError);
        }

        formData.value.satValidationResults = {
            validacion: 'error',
            mensaje: 'Error de conexión'
        };

        toast.add({
            severity: 'warn',
            summary: '⚠️ Validación SAT Pendiente',
            detail: 'La validación se completará en segundo plano',
            life: 5000
        });
    }
};

/**
 * Procesa la subida de documentos (seguros, legales, certificaciones) en el Step 3
 */
const processDocumentUploads = async () => {
    try {
        console.log('📤 Procesando subida de documentos...');
        const username = profile.value?.username || user.value.email.split('@')[0];

        // Arrays para rastrear las subidas
        const allUploads = [];

        // 1. Subir archivos de seguros
        if (formData.value.insuranceFiles.length > 0) {
            console.log(`📋 Subiendo ${formData.value.insuranceFiles.length} archivos de seguros...`);

            toast.add({
                severity: 'info',
                summary: 'Subiendo Documentos',
                detail: `Subiendo ${formData.value.insuranceFiles.length} pólizas de seguro...`,
                life: 3000
            });

            const insuranceUpload = await uploadMultipleDocuments(
                formData.value.insuranceFiles,
                username,
                'insurance'
            );

            if (insuranceUpload.success) {
                // Guardar referencias de seguros en BD
                const insurancePromises = insuranceUpload.uploads.map(upload =>
                    saveDocument(user.value.id, {
                        document_type: 'insurance',
                        document_name: upload.filename,
                        file_url: upload.file_url,
                        s3_key: upload.s3_key,
                        file_size: upload.file_size,
                        mime_type: upload.mime_type,
                        verification_id: null
                    })
                );

                await Promise.all(insurancePromises);
                allUploads.push(...insuranceUpload.uploads);
                console.log('✅ Archivos de seguros subidos y guardados en BD');
            }
        }

        // 2. Subir documentos legales
        if (formData.value.legalDocuments.length > 0) {
            console.log(`📄 Subiendo ${formData.value.legalDocuments.length} documentos legales...`);

            toast.add({
                severity: 'info',
                summary: 'Subiendo Documentos',
                detail: `Subiendo ${formData.value.legalDocuments.length} documentos legales...`,
                life: 3000
            });

            const legalUpload = await uploadMultipleDocuments(
                formData.value.legalDocuments,
                username,
                'legal'
            );

            if (legalUpload.success) {
                // Guardar referencias de documentos legales en BD
                const legalPromises = legalUpload.uploads.map(upload =>
                    saveDocument(user.value.id, {
                        document_type: 'legal',
                        document_name: upload.filename,
                        file_url: upload.file_url,
                        s3_key: upload.s3_key,
                        file_size: upload.file_size,
                        mime_type: upload.mime_type,
                        verification_id: null
                    })
                );

                await Promise.all(legalPromises);
                allUploads.push(...legalUpload.uploads);
                console.log('✅ Documentos legales subidos y guardados en BD');
            }
        }

        // 3. Subir certificaciones
        if (formData.value.certifications.length > 0) {
            console.log(`🏅 Subiendo ${formData.value.certifications.length} certificaciones...`);

            toast.add({
                severity: 'info',
                summary: 'Subiendo Documentos',
                detail: `Subiendo ${formData.value.certifications.length} certificaciones...`,
                life: 3000
            });

            const certificationUpload = await uploadMultipleDocuments(
                formData.value.certifications,
                username,
                'certification'
            );

            if (certificationUpload.success) {
                // Guardar referencias de certificaciones en BD
                const certificationPromises = certificationUpload.uploads.map(upload =>
                    saveDocument(user.value.id, {
                        document_type: 'certification',
                        document_name: upload.filename,
                        file_url: upload.file_url,
                        s3_key: upload.s3_key,
                        file_size: upload.file_size,
                        mime_type: upload.mime_type,
                        verification_id: null
                    })
                );

                await Promise.all(certificationPromises);
                allUploads.push(...certificationUpload.uploads);
                console.log('✅ Certificaciones subidas y guardadas en BD');
            }
        }

        // Notificación de éxito
        if (allUploads.length > 0) {
            toast.add({
                severity: 'success',
                summary: '✅ Documentos Subidos',
                detail: `${allUploads.length} documentos subidos y guardados exitosamente`,
                life: 4000
            });
        } else {
            console.log('ℹ️ No hay documentos para subir en este paso');
        }

    } catch (error) {
        console.error('💥 Error procesando documentos:', error);
        toast.add({
            severity: 'error',
            summary: 'Error Subiendo Documentos',
            detail: 'Error al subir documentos. Puedes continuar y reintentar más tarde.',
            life: 5000
        });
        // No bloquear el avance por errores de documentos
    }
};

/**
 * Avanza al siguiente paso o llama a la API para finalizar el Onboarding.
 */
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
        // Step 1: INE + Selfie validation
        const ineValid = await processINEValidation();
        if (!ineValid) return;
    } else if (currentStep.value === 1) {
        // Step 2: SAT validation
        const satValid = await processSATValidation();
        if (!satValid) return;
    } else if (currentStep.value === 2) {
        // Step 3: Upload documents (insurance, legal docs, certifications)
        await processDocumentUploads();
    }

    if (currentStep.value < onboardingData.steps.length - 1) {
        currentStep.value++;
        toast.add({
            severity: 'success',
            summary: 'Paso Completado',
            detail: `Paso ${currentStep.value} completado exitosamente`,
            life: 2000
        });
    } else {
        loading.value = true;
        try {
            // Save supplier data to the database
            await saveSupplierData();

            // Complete onboarding
            await completeOnboarding(user.value.id);

            toast.add({
                severity: 'success',
                summary: 'Registro Completado',
                detail: 'Tu perfil de proveedor ha sido configurado exitosamente',
                life: 3000
            });

            // Redirect to Supplier Dashboard
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

const saveSupplierData = async () => {
    console.log('🔄 Guardando datos del proveedor en Supabase...');

    try {
        // Importar supabase aquí para evitar problemas de dependencias
        const { supabase } = await import('@/lib/supabaseClient.js');

        // Preparar datos para guardar en la tabla supplier_profiles
        const supplierData = {
            user_id: user.value.id,
            username: profile.value?.username || user.value?.email?.split('@')[0],

            // Datos de identificación (extraidos del INE)
            full_name: formData.value.biometryResults?.nombreCompleto || 'Pending Validation',
            curp: formData.value.biometryResults?.curp || null,

            // Datos fiscales y SAT
            rfc: formData.value.rfc.toUpperCase(),
            ciec_password_encrypted: btoa(formData.value.ciecPassword), // Codificación básica (en producción usar encriptación real)

            // Servicios y especialidades
            service_areas: formData.value.serviceAreas,
            specialties: specialtiesPickList.value[1].map(s => s.code), // Selected specialties
            working_hours: formData.value.workingHours,
            service_radius_km: parseInt(formData.value.serviceRadius) || 50,
            business_description: formData.value.businessDescription,

            // Nubarium validation results
            nubarium_validations: {
                ine_validation: formData.value.ineData,
                biometry_results: formData.value.biometryResults,
                blacklist_results: formData.value.blacklistResults,
                sat_validation: formData.value.satValidationResults
            },

            // Campos adicionales requeridos por el esquema expandido
            business_type: 'sole_proprietorship', // Por defecto
            years_experience: 1, // Por defecto
            team_size: 1, // Por defecto

            // Metadatos
            submitted_at: new Date().toISOString(),
            status: 'submitted', // Cambiar de 'draft' a 'submitted' al completar
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // UPSERT en la tabla supplier_profiles
        const { data, error } = await supabase
            .from('supplier_profiles')
            .upsert(supplierData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('❌ Error al guardar datos del proveedor:', error);
            throw new Error(`Error de base de datos: ${error.message}`);
        }

        console.log('✅ Datos del proveedor guardados exitosamente:', data);

        // TODO: En producción, implementar subida de archivos a Supabase Storage
        if (formData.value.insuranceFiles.length > 0 ||
            formData.value.legalDocuments.length > 0 ||
            formData.value.certifications.length > 0) {

            console.log('📁 Archivos detectados para subir:', {
                insurance: formData.value.insuranceFiles.length,
                legal: formData.value.legalDocuments.length,
                certifications: formData.value.certifications.length
            });

            // Placeholder para subida de archivos
            toast.add({
                severity: 'info',
                summary: 'Archivos Detectados',
                detail: 'Los archivos se procesarán después del registro',
                life: 3000
            });
        }

        return data;

    } catch (error) {
        console.error('💥 Error crítico al guardar datos del proveedor:', error);
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

const onInsuranceFilesSelect = (event) => {
    formData.value.insuranceFiles = Array.from(event.files || []);
};

const onLegalDocumentsSelect = (event) => {
    formData.value.legalDocuments = Array.from(event.files || []);
};

const onCertificationsSelect = (event) => {
    formData.value.certifications = Array.from(event.files || []);
};

// PickList handlers
const onPickListChange = (event) => {
    formData.value.selectedSpecialties = event.target;
};

// Save draft functionality
const saveDraft = async () => {
    try {
        loading.value = true;
        console.log('💾 Guardando borrador...');

        // En una implementación real, aquí guardarías como borrador en localStorage o DB
        localStorage.setItem('supplier_onboarding_draft', JSON.stringify({
            formData: formData.value,
            currentStep: currentStep.value,
            savedAt: new Date().toISOString()
        }));

        toast.add({
            severity: 'success',
            summary: 'Borrador Guardado',
            detail: 'Tu progreso ha sido guardado. Puedes continuar más tarde.',
            life: 3000
        });
    } catch (error) {
        console.error('Error guardando borrador:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el borrador',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Load draft on mount
const loadDraft = () => {
    try {
        const draft = localStorage.getItem('supplier_onboarding_draft');
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

/**
 * Redirecciona al usuario a su dashboard.
 */
const goToDashboard = () => {
    // Limpiar el borrador al completar exitosamente
    localStorage.removeItem('supplier_onboarding_draft');
    router.replace(`/${userRole}/dashboard`);
};

// Load draft on component mount
onMounted(() => {
    loadDraft();
});

/**
 * Simula la acción de ir al dashboard sin completar el flujo (Botón DUMMY)
 */
const goToDashboardDummy = () => {
    router.replace(`/${userRole}/dashboard`);
};
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
                        <p class="text-surface-600 dark:text-surface-200 m-0 mt-2">Hola, {{ userName }}. Completa tu configuración de proveedor</p>
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
                                Guardando información...
                            </p>
                        </div>

                        <!-- Step Forms -->
                        <div v-else>
                            <!-- Step 1: INE + Selfie -->
                            <div v-if="currentStep === 0" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-600 rounded-md">
                                        <h5 class="font-semibold text-blue-700 dark:text-blue-400 mb-2">🆔 Identificación Oficial</h5>
                                        <p class="text-sm text-blue-600 dark:text-blue-300">
                                            Sube las imágenes de tu INE (frontal y trasera) y toma una selfie para validación biométrica
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
                                    <div class="mb-4 p-4 bg-orange-50 dark:bg-orange-400/10 border border-orange-200 dark:border-orange-600 rounded-md">
                                        <h5 class="font-semibold text-orange-700 dark:text-orange-400 mb-2">🤳 Selfie Biométrica</h5>
                                        <p class="text-sm text-orange-600 dark:text-orange-300">
                                            Toma una selfie para comparar con la foto del INE y validar tu identidad
                                        </p>
                                    </div>
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
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">✅ Validación Completada</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Identidad verificada exitosamente con Nubarium
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: SAT (RFC + CIEC) -->
                            <div v-if="currentStep === 1" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-600 rounded-md">
                                        <h5 class="font-semibold text-red-700 dark:text-red-400 mb-2">📊 Validación Fiscal SAT</h5>
                                        <p class="text-sm text-red-600 dark:text-red-300">
                                            Ingresa tu RFC y contraseña CIEC para validar tu situación fiscal
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
                                    <label for="ciecPassword" class="block font-semibold mb-2">Contraseña CIEC *</label>
                                    <Password
                                        id="ciecPassword"
                                        v-model="formData.ciecPassword"
                                        :feedback="false"
                                        toggleMask
                                        class="w-full"
                                        placeholder="Tu contraseña CIEC del SAT"
                                    />
                                </div>

                                <div class="col-span-12">
                                    <small class="text-surface-500">
                                        Esta información se usa para extraer automáticamente las facturas y validar tu situación fiscal con el SAT
                                    </small>
                                </div>

                                <div v-if="formData.satValidationResults" class="col-span-12 mt-4">
                                    <div class="p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">✅ SAT Validado</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Datos fiscales verificados correctamente
                                        </p>
                                        <div v-if="formData.satValidationResults.nombreRazonSocial?.nombre" class="mt-2 text-sm">
                                            <strong>Razón Social:</strong> {{ formData.satValidationResults.nombreRazonSocial.nombre }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 3: Documents -->
                            <div v-if="currentStep === 2">
                                <div class="mb-4">
                                    <h5 class="font-semibold mb-3">Póliza de Seguro *</h5>
                                    <p class="text-sm text-color-secondary mb-3">Sube tu póliza de responsabilidad civil y documentos de seguro</p>
                                    <FileUpload
                                        mode="basic"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onInsuranceFilesSelect"
                                        choose-label="Seleccionar Póliza"
                                        class="mb-3"
                                    />
                                    <small v-if="formData.insuranceFiles.length > 0" class="text-green-600">
                                        {{ formData.insuranceFiles.length }} archivo(s) seleccionado(s)
                                    </small>
                                </div>

                                <div class="mb-4">
                                    <h5 class="font-semibold mb-3">Documentos Legales (Opcional)</h5>
                                    <p class="text-sm text-color-secondary mb-3">Actas constitutivas, registros, etc.</p>
                                    <FileUpload
                                        mode="basic"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onLegalDocumentsSelect"
                                        choose-label="Seleccionar Documentos"
                                        class="mb-3"
                                    />
                                    <small v-if="formData.legalDocuments.length > 0" class="text-green-600">
                                        {{ formData.legalDocuments.length }} archivo(s) seleccionado(s)
                                    </small>
                                </div>

                                <div>
                                    <h5 class="font-semibold mb-3">Certificaciones (Opcional)</h5>
                                    <p class="text-sm text-color-secondary mb-3">Certificaciones profesionales, ISO, etc.</p>
                                    <FileUpload
                                        mode="basic"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onCertificationsSelect"
                                        choose-label="Seleccionar Certificaciones"
                                    />
                                    <small v-if="formData.certifications.length > 0" class="text-green-600">
                                        {{ formData.certifications.length }} archivo(s) seleccionado(s)
                                    </small>
                                </div>
                            </div>

                            <!-- Step 4: Specialties with PickList -->
                            <div v-if="currentStep === 3" class="p-fluid grid formgrid">
                                <div class="col-12">
                                    <div class="mb-6 p-4 bg-purple-50 dark:bg-purple-400/10 border border-purple-200 dark:border-purple-600 rounded-md">
                                        <h5 class="font-semibold text-purple-700 dark:text-purple-400 mb-2">🔧 Especialidades y Servicios</h5>
                                        <p class="text-sm text-purple-600 dark:text-purple-300">
                                            Usa el PickList para seleccionar las especialidades que ofreces
                                        </p>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="mb-4">
                                        <label class="font-semibold mb-3 block">Especialidades *</label>
                                        <p class="text-sm text-color-secondary mb-3">Selecciona las especialidades que ofreces arrastrándolas a la derecha</p>
                                        <PickList
                                            v-model="specialtiesPickList"
                                            dataKey="code"
                                            @move-to-target="onPickListChange"
                                            @move-to-source="onPickListChange"
                                        >
                                            <template #sourceheader>
                                                Especialidades Disponibles
                                            </template>
                                            <template #targetheader>
                                                Mis Especialidades
                                            </template>
                                            <template #item="slotProps">
                                                <div class="flex items-center p-2">
                                                    <span>{{ slotProps.item.name }}</span>
                                                </div>
                                            </template>
                                        </PickList>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="mb-4">
                                        <label class="font-semibold mb-3 block">Áreas de Servicio</label>
                                        <MultiSelect
                                            v-model="formData.serviceAreas"
                                            :options="serviceAreaOptions"
                                            option-label="label"
                                            option-value="value"
                                            placeholder="Seleccionar áreas de servicio"
                                            class="w-full"
                                        />
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <label for="workingHours" class="block font-semibold mb-2">Horario de Trabajo</label>
                                    <InputText
                                        id="workingHours"
                                        v-model="formData.workingHours"
                                        class="w-full"
                                        placeholder="Ej: Lun-Vie 8:00-18:00"
                                    />
                                </div>

                                <div class="col-12 md:col-6">
                                    <label for="serviceRadius" class="block font-semibold mb-2">Radio de Servicio</label>
                                    <InputText
                                        id="serviceRadius"
                                        v-model="formData.serviceRadius"
                                        class="w-full"
                                        placeholder="Ej: 50 km, Ciudad de México, Nacional"
                                    />
                                </div>

                                <div class="col-12">
                                    <label for="businessDescription" class="block font-semibold mb-2">Descripción del Negocio</label>
                                    <Textarea
                                        id="businessDescription"
                                        v-model="formData.businessDescription"
                                        rows="4"
                                        class="w-full"
                                        placeholder="Describe tu empresa, experiencia, valores diferenciadores y cualquier información relevante para tus clientes..."
                                    />
                                    <small class="text-surface-500">Esta información será visible para los clientes potenciales</small>
                                </div>
                            </div>

                            <!-- Step 5: Review -->
                            <div v-if="currentStep === 4" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h5 class="font-semibold text-green-700 dark:text-green-400 mb-2">📝 Revisión Final</h5>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Revisa todos los datos antes de enviar para aprobación
                                        </p>
                                    </div>
                                </div>

                                <!-- INE Validation Results -->
                                <div v-if="formData.biometryResults" class="col-span-12">
                                    <div class="card">
                                        <h6 class="font-semibold mb-3">Validación de Identidad</h6>
                                        <div class="grid grid-cols-12 gap-4 text-sm">
                                            <div class="col-span-6 md:col-span-3">
                                                <strong>Nombre:</strong><br>
                                                {{ formData.biometryResults.nombreCompleto || 'N/A' }}
                                            </div>
                                            <div class="col-span-6 md:col-span-3">
                                                <strong>CURP:</strong><br>
                                                {{ formData.biometryResults.curp || 'N/A' }}
                                            </div>
                                            <div class="col-span-6 md:col-span-3">
                                                <strong>Similitud Facial:</strong><br>
                                                {{ formData.biometryResults.comparacionFacial?.similitudPorcentaje || 'N/A' }}
                                            </div>
                                            <div class="col-span-6 md:col-span-3">
                                                <strong>Lista Nominal:</strong><br>
                                                {{ formData.biometryResults.listaNominal?.valido ? '✅ Válido' : '❌ Inválido' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- SAT Validation Results -->
                                <div v-if="formData.satValidationResults" class="col-span-12">
                                    <div class="card">
                                        <h6 class="font-semibold mb-3">Validación Fiscal</h6>
                                        <div class="grid grid-cols-12 gap-4 text-sm">
                                            <div class="col-span-12 md:col-span-6" v-if="formData.satValidationResults.nombreRazonSocial?.nombre">
                                                <strong>Razón Social:</strong><br>
                                                {{ formData.satValidationResults.nombreRazonSocial.nombre }}
                                            </div>
                                            <div class="col-span-6 md:col-span-3">
                                                <strong>RFC:</strong><br>
                                                {{ formData.satValidationResults.rfc?.rfc || 'N/A' }}
                                            </div>
                                            <div class="col-span-6 md:col-span-3">
                                                <strong>Estado RFC:</strong><br>
                                                {{ formData.satValidationResults.rfc?.valido ? '✅ Activo' : '❌ Inactivo' }}
                                            </div>
                                            <div class="col-span-12 md:col-span-6">
                                                <strong>Validación CIEC:</strong><br>
                                                {{ formData.satValidationResults.ciec ? '✅ Verificada' : 'En proceso...' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Specialties Summary -->
                                <div class="col-span-12">
                                    <div class="card">
                                        <h6 class="font-semibold mb-3">Especialidades Seleccionadas</h6>
                                        <div v-if="specialtiesPickList[1].length > 0" class="flex flex-wrap gap-2">
                                            <span v-for="specialty in specialtiesPickList[1]" :key="specialty.code"
                                                  class="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm">
                                                {{ specialty.name }}
                                            </span>
                                        </div>
                                        <p v-else class="text-surface-500">Ninguna especialidad seleccionada</p>
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

.gradient-border {
    background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%);
    border-radius: 56px;
    padding: 0.3rem;
}
</style>