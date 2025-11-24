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
    
    // Proof of Address (NEW)
    proofOfAddressFile: null,
    proofOfAddressData: null,
    proofOfAddressValidated: false,

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
            description: 'Verificación de RFC'
        },
        {
            label: 'Documentos',
            description: 'Pólizas, certificaciones y documentos legales'
        },
        {
            label: 'Especialidades',
            description: 'Servicios y áreas de especialización'
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

// Working hours options
const workingDaysOptions = [
    { label: 'Lunes a Viernes', value: 'weekdays' },
    { label: 'Lunes a Sábado', value: 'weekdays_saturday' },
    { label: 'Todos los días', value: 'everyday' },
    { label: 'Personalizado', value: 'custom' }
];

const workingHoursStartOptions = [
    { label: '06:00', value: '06:00' },
    { label: '07:00', value: '07:00' },
    { label: '08:00', value: '08:00' },
    { label: '09:00', value: '09:00' },
    { label: '10:00', value: '10:00' }
];

const workingHoursEndOptions = [
    { label: '15:00', value: '15:00' },
    { label: '16:00', value: '16:00' },
    { label: '17:00', value: '17:00' },
    { label: '18:00', value: '18:00' },
    { label: '19:00', value: '19:00' },
    { label: '20:00', value: '20:00' },
    { label: '24/7', value: '24/7' }
];

// Form fields for working hours
const workingDays = ref('weekdays');
const workingHoursStart = ref('08:00');
const workingHoursEnd = ref('18:00');

// Estado
const userName = computed(() => profile.value?.username || user.value?.email?.split('@')[0] || 'Proveedor');
const isCompleted = computed(() => profile.value?.onboarding_complete);
const activeStepIndex = computed(() => currentStep.value); // Computed para asegurar reactividad

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

    // CIEC es opcional
    if (formData.value.ciecPassword && formData.value.ciecPassword.length > 0 && formData.value.ciecPassword.length < 8) {
        toast.add({
            severity: 'warn',
            summary: 'Contraseña CIEC Inválida',
            detail: 'La contraseña CIEC debe tener al menos 8 caracteres si la proporcionas',
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
    // Verificar el PickList target (índice 1)
    if (!specialtiesPickList.value[1] || specialtiesPickList.value[1].length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Especialidades Requeridas',
            detail: 'Debe seleccionar al menos una especialidad',
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
        // Convert files to base64 without compression
        console.log('[CONVERSION] Convirtiendo imágenes INE a base64...');
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
        console.log(' Iniciando validación asíncrona de INE...');

        // Step 1: OCR + Lista Nominal + Face Comparison
        const ineValidation = await nubariumService.validateSupplierINE(
            frontBase64,
            backBase64,
            selfieBase64,
            80 // 80% similarity threshold
        );

        //  GUARDAR RESPONSE COMPLETO DE INE - EL ORO DE LA EMPRESA 
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
                        identifier_value: ineValidation.normalized.curp || 'UNKNOWN',
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
                        identifier_value: ineValidation.normalized.curp || 'UNKNOWN',
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
                summary: 'INE Validado',
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
                summary: 'Validación INE Falló',
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
                summary: 'SAT Validado',
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
                summary: 'Validación SAT Falló',
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
                summary: 'Documentos Subidos',
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
        console.log(`✅ Avanzando de paso ${currentStep.value} a paso ${currentStep.value + 1}`);
        currentStep.value++;
        console.log(`📍 CurrentStep ahora es: ${currentStep.value}`);
        toast.add({
            severity: 'success',
            summary: 'Paso Completado',
            detail: `Paso ${currentStep.value + 1} de ${onboardingData.steps.length} completado`,
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

        // PRIMERO obtener las URLs de los documentos antes de guardar
        const { data: documents } = await supabase
            .from('documents')
            .select('document_type, file_url')
            .eq('user_id', user.value.id)
            .in('document_type', ['ine_front', 'ine_back', 'ine_selfie'])
            .order('created_at', { ascending: false });

        // Obtener URLs de documentos
        const ineFrontUrl = documents?.find(d => d.document_type === 'ine_front')?.file_url || null;
        const ineBackUrl = documents?.find(d => d.document_type === 'ine_back')?.file_url || null;
        const selfieUrl = documents?.find(d => d.document_type === 'ine_selfie')?.file_url || null;

        // Extraer dirección del INE validation
        const legalAddress = formData.value.ineData?.normalized?.domicilio ||
                           formData.value.ineData?.ocr_data?.domicilio ||
                           'Pendiente';

        // Extraer score de similitud facial y convertir a número
        let faceSimilarityScore = formData.value.biometryResults?.comparacionFacial?.similitudPorcentaje ||
                                  formData.value.biometryResults?.comparacionFacial?.similitud ||
                                  null;

        // Si viene como string con "%", remover el símbolo y parsear
        if (faceSimilarityScore && typeof faceSimilarityScore === 'string') {
            faceSimilarityScore = parseFloat(faceSimilarityScore.replace('%', ''));
        }

        // Preparar datos para guardar en la tabla supplier_profiles (schema: client-supplier-profiles.sql)
        const supplierData = {
            user_id: user.value.id,
            username: profile.value?.username || user.value?.email?.split('@')[0],

            // Step 1: Datos de la Empresa & SAT
            company_name: formData.value.biometryResults?.nombreCompleto || 'Pending Validation',
            rfc: formData.value.rfc.toUpperCase(),
            sat_password_encrypted: formData.value.ciecPassword ? btoa(formData.value.ciecPassword) : '', // Campo requerido
            legal_address: legalAddress,

            // Step 2: Información de Contacto
            contact_person: formData.value.biometryResults?.nombreCompleto || 'Pending',
            phone_number: user.value.phone || 'Pendiente',
            email: user.value.email,

            // Step 3: Información Operativa
            service_areas: formData.value.serviceAreas || [],
            specialties: specialtiesPickList.value[1].map(s => s.code), // Selected specialties
            years_experience: 1, // Por defecto
            team_size: 1, // Por defecto
            certifications: [],

            // Step 5: Documentación (URLs) - AHORA CON URLS REALES
            ine_front_url: ineFrontUrl,
            ine_back_url: ineBackUrl,
            selfie_url: selfieUrl,

            // Datos de Validación y Status
            face_similarity_score: faceSimilarityScore,
            ciec_validated: formData.value.ciecPassword ? true : false,
            documents_validated: false,
            status: 'submitted', // Cambiar de 'draft' a 'submitted' al completar

            // Datos Calculados/Externos - guardar todos los resultados de Nubarium aquí
            sat_data: {
                ine_validation: formData.value.ineData,
                biometry_results: formData.value.biometryResults,
                blacklist_results: formData.value.blacklistResults,
                sat_validation: formData.value.satValidationResults,
                working_hours: `${workingDays.value} ${workingHoursStart.value}-${workingHoursEnd.value}`,
                service_radius_km: parseInt(formData.value.serviceRadius) || 50
            },

            // Metadatos
            submitted_at: new Date().toISOString()
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

        // Obtener datos completos de SAT e INE para tabla suppliers
        const { data: satData } = await supabase
            .from('sat_verifications')
            .select('rfc, ciec, verification_response, tax_status')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const { data: ineData } = await supabase
            .from('ine_verifications')
            .select('verification_response')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Extraer nombre de contacto del INE
        const ineNormalized = ineData?.verification_response?.normalized || ineData?.verification_response?.ocr_data;
        const contactPerson = ineNormalized ?
            `${ineNormalized.nombre || ''} ${ineNormalized.apellidoPaterno || ''} ${ineNormalized.apellidoMaterno || ''}`.trim()
            : null;

        // Extraer razón social del SAT
        const companyName = satData?.tax_status?.nombreRazonSocial ||
                           satData?.verification_response?.rfc_name_validation?.normalized?.nombre ||
                           satData?.verification_response?.sat_validation?.normalized?.nombre ||
                           `Proveedor ${user.value.email}`;

        // URLs ya extraídas arriba, solo usar las variables existentes
        // faceSimilarityScore también ya está declarado arriba

        // Guardar en tabla suppliers
        const supplierMainData = {
            user_id: user.value.id,
            company_name: companyName,
            contact_person: contactPerson,
            phone: user.value.phone || null,
            email: user.value.email,
            address: null, // Suppliers no proporcionan dirección en onboarding
            city: null,
            state: null,
            postal_code: null,
            rfc: satData?.rfc || null,
            ciec_validated: satData?.ciec ? true : false,
            ine_front_url: ineFrontUrl,
            ine_back_url: ineBackUrl,
            selfie_url: selfieUrl,
            face_similarity_score: faceSimilarityScore,
            status: 'pending', // Suppliers inician como pending, deben ser aprobados
            specialties: JSON.stringify(specialtiesPickList.value[1].map(s => ({ name: s.name, code: s.code }))),
            service_radius_km: parseInt(formData.value.serviceRadius) || 50,
            max_concurrent_jobs: 5,
            rating: 0.00,
            total_jobs: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: supplierRecord, error: supplierError } = await supabase
            .from('suppliers')
            .upsert(supplierMainData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (supplierError) {
            console.error('Error al guardar en tabla suppliers:', supplierError);
            // No lanzar error, la tabla supplier_profiles ya se guardó
        } else {
            console.log('Proveedor guardado en tabla suppliers exitosamente');
        }

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
    const file = event.files[0];
    formData.value.ineFrontFile = file;
    console.log('[DEBUG] INE Front seleccionado:', {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        lastModified: file?.lastModified
    });
};

const onINEBackSelect = (event) => {
    const file = event.files[0];
    formData.value.ineBackFile = file;
    console.log('[DEBUG] INE Back seleccionado:', {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        lastModified: file?.lastModified
    });
};

const onSelfieSelect = (event) => {
    const file = event.files[0];
    formData.value.selfieFile = file;
    console.log('[DEBUG] Selfie seleccionado:', {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        lastModified: file?.lastModified
    });

    // Verificar que no sea el mismo archivo que INE Back
    if (formData.value.ineBackFile && formData.value.selfieFile) {
        const isSameFile =
            formData.value.ineBackFile.name === formData.value.selfieFile.name &&
            formData.value.ineBackFile.size === formData.value.selfieFile.size &&
            formData.value.ineBackFile.lastModified === formData.value.selfieFile.lastModified;

        if (isSameFile) {
            console.error('[ERROR] Selfie es el mismo archivo que INE Back!');
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'La selfie no puede ser la misma foto que el INE trasero. Por favor toma una nueva selfie.',
                life: 5000
            });
            formData.value.selfieFile = null;
        }
    }
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

// Proof of Address handler (NEW)
const onProofOfAddressSelect = async (event) => {
    const file = event.files[0];
    if (!file) return;
    
    formData.value.proofOfAddressFile = file;
    
    // Automatically validate proof of address
    await processProofOfAddressValidation();
};

// Process proof of address validation (NEW)
const processProofOfAddressValidation = async () => {
    if (!formData.value.proofOfAddressFile) return;
    
    loading.value = true;
    toast.add({
        severity: 'info',
        summary: 'Validando Comprobante',
        detail: 'Procesando comprobante de domicilio con OCR...',
        life: 3000
    });
    
    try {
        // Convert file to base64
        const base64 = await fileToBase64(formData.value.proofOfAddressFile);
        
        // Call Nubarium API
        const result = await nubariumService.validateProofOfAddress(base64);
        
        if (result.success) {
            formData.value.proofOfAddressData = result.normalized;
            formData.value.proofOfAddressValidated = true;
            
            toast.add({
                severity: 'success',
                summary: 'Comprobante Validado',
                detail: `${result.normalized.tipo} validado - ${result.normalized.nombre}`,
                life: 5000
            });
        } else {
            formData.value.proofOfAddressValidated = false;
            toast.add({
                severity: 'error',
                summary: 'Validación Falló',
                detail: result.error || 'No se pudo validar el comprobante',
                life: 5000
            });
        }
    } catch (error) {
        console.error('Error validando comprobante:', error);
        formData.value.proofOfAddressValidated = false;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al procesar el comprobante',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
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
    router.replace('/supplier/dashboard');
};

// Load draft on component mount
onMounted(() => {
    loadDraft();
});

/**
 * Simula la acción de ir al dashboard sin completar el flujo (Botón DUMMY)
 */
const goToDashboardDummy = () => {
    router.replace('/supplier/dashboard');
};
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen overflow-hidden">
        <div class="flex flex-col items-center justify-center w-full max-w-6xl mx-auto p-4">

            <!-- Header with Logo and Actions -->
            <div class="w-full flex justify-between items-center mb-8">
                <div class="flex items-center gap-4">
                    <img src="/demo/images/logo.png" alt="Mantex Logo" class="h-12 w-auto" />
                    <div>
                        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ onboardingData.title }}</h1>
                        <p class="text-surface-600 dark:text-surface-200 m-0 mt-2">Hola, {{ userName }}. Completa tu alta como proveedor</p>
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
                        ¡Tu cuenta está lista! Tu solicitud de alta como proveedor está siendo revisada por nuestro equipo.
                    </Message>

                    <!-- Progress Steps -->
                    <Steps
                        :model="onboardingData.steps"
                        :readonly="true"
                        :activeIndex="activeStepIndex"
                        :key="`step-${currentStep}`"
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
                                        <h5 class="font-semibold text-blue-700 dark:text-blue-400 mb-2">Identificación Oficial</h5>
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
                                        <h5 class="font-semibold text-orange-700 dark:text-orange-400 mb-2">Selfie Biométrica</h5>
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
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">Validación Completada</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Identidad verificada exitosamente
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: SAT (RFC + CIEC) -->
                            <div v-if="currentStep === 1" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-600 rounded-md">
                                        <h5 class="font-semibold text-red-700 dark:text-red-400 mb-2">Validación de información del SAT</h5>
                                        <p class="text-sm text-red-600 dark:text-red-300">
                                            Ingresa tu RFC y opcionalmente tu contraseña CIEC para hacer tu validación más rápidamente
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
                                        Esta información solamente la usaremos para validar tu RFC y darte de alta automáticamente en el sistema.
                                    </small>
                                </div>

                                <div v-if="formData.satValidationResults" class="col-span-12 mt-4">
                                    <div class="p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">SAT Validado</h6>
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

                                <!-- Proof of Address (NEW) -->
                                <div class="mt-6 pt-6 border-t border-surface-200">
                                    <h5 class="font-semibold mb-3">Comprobante de Domicilio *</h5>
                                    <p class="text-sm text-color-secondary mb-3">
                                        Sube tu comprobante de domicilio (CFE, TELMEX, TELCEL, MEGACABLE, SKY, IZZI)
                                    </p>
                                    
                                    <FileUpload
                                        mode="basic"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        :maxFileSize="5000000"
                                        @select="onProofOfAddressSelect"
                                        choose-label="Seleccionar Comprobante"
                                        class="mb-3"
                                    />

                                    <!-- Validation Status -->
                                    <div v-if="formData.proofOfAddressFile" class="mt-3">
                                        <Message v-if="formData.proofOfAddressValidated" severity="success" :closable="false">
                                            <div class="flex flex-column gap-2">
                                                <div class="font-semibold">✅ Comprobante Validado</div>
                                                <div class="text-sm">
                                                    <strong>Tipo:</strong> {{ formData.proofOfAddressData?.tipo }}<br>
                                                    <strong>Titular:</strong> {{ formData.proofOfAddressData?.nombre }}<br>
                                                    <strong>Dirección:</strong> {{ formData.proofOfAddressData?.direccion?.calle }}, 
                                                    {{ formData.proofOfAddressData?.direccion?.colonia }}, 
                                                    {{ formData.proofOfAddressData?.direccion?.ciudad }}<br>
                                                    <strong>CP:</strong> {{ formData.proofOfAddressData?.direccion?.cp }}
                                                </div>
                                            </div>
                                        </Message>

                                        <Message v-else-if="!loading" severity="error" :closable="false">
                                            <div class="font-semibold">❌ No se pudo validar el comprobante</div>
                                            <div class="text-sm">Por favor verifica que el documento sea legible y esté en formato correcto</div>
                                        </Message>

                                        <Message v-else severity="info" :closable="false">
                                            <div class="flex align-items-center gap-2">
                                                <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
                                                <span>Validando comprobante de domicilio...</span>
                                            </div>
                                        </Message>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 4: Specialties and Services -->
                            <div v-if="currentStep === 3" class="grid grid-cols-12 gap-6">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-purple-50 dark:bg-purple-400/10 border border-purple-200 dark:border-purple-600 rounded-md">
                                        <h5 class="font-semibold text-purple-700 dark:text-purple-400 mb-2">Especialidades y Servicios</h5>
                                        <p class="text-sm text-purple-600 dark:text-purple-300">
                                            Configura tus especialidades, horarios y área de cobertura
                                        </p>
                                    </div>
                                </div>

                                <!-- Especialidades PickList -->
                                <div class="col-span-12">
                                    <label class="block font-semibold mb-2">Especialidades *</label>
                                    <p class="text-sm text-surface-500 mb-3">Selecciona las especialidades que ofreces</p>
                                    <PickList
                                        v-model="specialtiesPickList"
                                        dataKey="code"
                                        breakpoint="960px"
                                        @move-to-target="onPickListChange"
                                        @move-to-source="onPickListChange"
                                    >
                                        <template #sourceheader>
                                            <span class="font-semibold">Disponibles</span>
                                        </template>
                                        <template #targetheader>
                                            <span class="font-semibold">Mis Especialidades</span>
                                        </template>
                                        <template #item="slotProps">
                                            <div class="p-2">
                                                <span>{{ slotProps.item.name }}</span>
                                            </div>
                                        </template>
                                    </PickList>
                                </div>

                                <!-- Horario de Trabajo -->
                                <div class="col-span-12">
                                    <h6 class="font-semibold mb-4">Horario de Trabajo</h6>
                                </div>

                                <div class="col-span-12 md:col-span-4">
                                    <label class="block font-medium mb-2">Días de operación</label>
                                    <Dropdown
                                        v-model="workingDays"
                                        :options="workingDaysOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Seleccionar días"
                                        class="w-full"
                                    />
                                </div>

                                <div class="col-span-12 md:col-span-4">
                                    <label class="block font-medium mb-2">Hora de inicio</label>
                                    <Dropdown
                                        v-model="workingHoursStart"
                                        :options="workingHoursStartOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Inicio"
                                        class="w-full"
                                    />
                                </div>

                                <div class="col-span-12 md:col-span-4">
                                    <label class="block font-medium mb-2">Hora de cierre</label>
                                    <Dropdown
                                        v-model="workingHoursEnd"
                                        :options="workingHoursEndOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Cierre"
                                        class="w-full"
                                    />
                                </div>

                                <!-- Radio de Servicio -->
                                <div class="col-span-12 md:col-span-6">
                                    <label for="serviceRadius" class="block font-medium mb-2">Radio de servicio (km)</label>
                                    <InputText
                                        id="serviceRadius"
                                        v-model="formData.serviceRadius"
                                        type="number"
                                        class="w-full"
                                        placeholder="50"
                                    />
                                    <small class="text-surface-500">Distancia máxima en kilómetros desde tu ubicación</small>
                                </div>

                                <!-- Descripción del Negocio -->
                                <div class="col-span-12">
                                    <label for="businessDescription" class="block font-medium mb-2">Descripción de tu negocio (opcional)</label>
                                    <Textarea
                                        id="businessDescription"
                                        v-model="formData.businessDescription"
                                        rows="4"
                                        class="w-full"
                                        placeholder="Describe tu empresa, experiencia y servicios..."
                                    />
                                    <small class="text-surface-500">Esta información será visible para clientes potenciales</small>
                                </div>
                            </div>

                            <!-- Step 5: Review -->
                            <div v-if="currentStep === 4" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h5 class="font-semibold text-green-700 dark:text-green-400 mb-2">Revisión Final</h5>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Revisa todos los datos antes de enviar para aprobación
                                        </p>
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

                    <!-- Dashboard Button - Only shown when completed -->
                    <div v-if="isCompleted" class="flex justify-end mt-6">
                        <Button
                            label="Ir al Dashboard"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            @click="goToDashboard"
                            class="px-6 py-3"
                        />
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