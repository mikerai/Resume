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
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import nubariumService from '@/lib/nubariumService.js';
import { useS3Upload } from '@/composables/useS3Upload.js';
import { useGoogleMaps } from '@/composables/useGoogleMaps';

const { user, profile, completeOnboarding, logout } = useAuth();
const { uploadINEFiles, fileToBase64: s3FileToBase64 } = useS3Upload();
const { geocodeAddress } = useGoogleMaps();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const currentStep = ref(0);

// Tipos de activos (temporal - después será catálogo desde admin)
const assetTypes = ref([
    { label: 'Aire Acondicionado', value: 'aire_acondicionado' },
    { label: 'Caldera', value: 'caldera' },
    { label: 'Sistema Eléctrico', value: 'sistema_electrico' },
    { label: 'Plomería', value: 'plomeria' },
    { label: 'Elevador', value: 'elevador' },
    { label: 'Sistema de Seguridad', value: 'sistema_seguridad' },
    { label: 'Equipo de Cómputo', value: 'equipo_computo' },
    { label: 'Mobiliario', value: 'mobiliario' },
    { label: 'Otro', value: 'otro' }
]);

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

    // Step 3: Contact and address data
    phoneNumber: '',
    sameAsINE: null, // null = no seleccionado, true = misma dirección, false = diferente
    address: {
        street: '',
        exteriorNumber: '',
        interiorNumber: '',
        neighborhood: '',
        city: '',
        state: '',
        postalCode: ''
    },
    assets: [
        {
            name: '',
            type: '', // Will be dropdown
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
            description: 'Verificación de RFC'
        },
        {
            label: 'INE + Selfie',
            description: 'Validación de identidad'
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
const activeStepIndex = computed(() => currentStep.value); // Computed para asegurar reactividad

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
    // Validar teléfono
    if (!formData.value.phoneNumber || formData.value.phoneNumber.trim() === '') {
        toast.add({
            severity: 'warn',
            summary: 'Campo Requerido',
            detail: 'El teléfono es obligatorio',
            life: 3000
        });
        return false;
    }

    // Validar que haya seleccionado si es misma dirección o no
    if (formData.value.sameAsINE === null) {
        toast.add({
            severity: 'warn',
            summary: 'Selección Requerida',
            detail: 'Indica si la dirección es la misma que tu INE',
            life: 3000
        });
        return false;
    }

    // Validar campos de dirección si no es la misma del INE
    if (!formData.value.sameAsINE) {
        const requiredAddressFields = ['street', 'exteriorNumber', 'neighborhood', 'city', 'state', 'postalCode'];
        const fieldNames = {
            'street': 'Calle',
            'exteriorNumber': 'Número exterior',
            'neighborhood': 'Colonia',
            'city': 'Ciudad',
            'state': 'Estado',
            'postalCode': 'Código postal'
        };

        for (const field of requiredAddressFields) {
            if (!formData.value.address[field] || formData.value.address[field].trim() === '') {
                toast.add({
                    severity: 'warn',
                    summary: 'Campo Requerido',
                    detail: `${fieldNames[field]} es obligatorio`,
                    life: 3000
                });
                return false;
            }
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

// Función para copiar dirección del INE
const copyAddressFromINE = async () => {
    if (formData.value.sameAsINE === true) {
        try {
            const { supabase } = await import('@/lib/supabaseClient.js');

            // Obtener datos del INE del usuario
            const { data, error } = await supabase
                .from('ine_verifications')
                .select('verification_response')
                .eq('user_id', user.value.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error obteniendo datos del INE:', error);
                return;
            }

            if (data && data.verification_response) {
                const ineData = data.verification_response;
                const ocrData = ineData.ocr_data || ineData.normalized;

                // Copiar dirección del INE al formulario
                if (ocrData) {
                    formData.value.address = {
                        street: ocrData.calle || '',
                        exteriorNumber: '', // No viene del INE
                        interiorNumber: '',
                        neighborhood: ocrData.colonia || '',
                        city: ocrData.ciudad || ocrData.municipio || '',
                        state: ocrData.estado || '',
                        postalCode: '' // No viene del INE
                    };

                    toast.add({
                        severity: 'info',
                        summary: 'Dirección Copiada',
                        detail: 'Verifica y completa los datos faltantes',
                        life: 3000
                    });
                }
            }
        } catch (error) {
            console.error('Error copiando dirección del INE:', error);
        }
    } else if (formData.value.sameAsINE === false) {
        // Limpiar formulario si selecciona "diferente"
        formData.value.address = {
            street: '',
            exteriorNumber: '',
            interiorNumber: '',
            neighborhood: '',
            city: '',
            state: '',
            postalCode: ''
        };
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

// Database persistence functions
const saveSATValidationToDB = async (rfcNameResult, rfcValidation, ciecValidation = null) => {
    try {
        console.log('Guardando validacion SAT en base de datos...');
        const { supabase } = await import('@/lib/supabaseClient.js');

        const satVerificationData = {
            user_id: user.value.id,
            rfc: formData.value.rfc.toUpperCase(),
            ciec: formData.value.ciecPassword || null,
            verification_status: 'completed',
            tax_status: {
                valido: rfcValidation.normalized?.valido || false,
                nombreRazonSocial: rfcNameResult.success ? rfcNameResult.normalized?.nombre : null,
                situacion_fiscal: rfcValidation.normalized
            },
            verification_response: {
                rfc_name: rfcNameResult.success ? rfcNameResult.data : null,
                rfc_validation: rfcValidation.data,
                ciec_validation: ciecValidation?.data || null
            },
            verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('sat_verifications')
            .insert(satVerificationData)
            .select();

        if (error) {
            console.error('Error al guardar validacion SAT:', error);
            throw error;
        }

        console.log('Validacion SAT guardada exitosamente:', data);
        return data[0];
    } catch (error) {
        console.error('Error critico al guardar validacion SAT:', error);
        throw error;
    }
};

const saveINEValidationToDB = async (ineValidation, frontFile, backFile, selfieFile) => {
    try {
        console.log('Guardando validacion INE en base de datos...');
        const { supabase } = await import('@/lib/supabaseClient.js');

        // Extraer CURP y número de INE del resultado de validación
        const curp = ineValidation.normalized?.curp || ineValidation.data?.ocr?.curp || null;
        const ineNumber = ineValidation.normalized?.claveElector || ineValidation.data?.ocr?.claveElector || null;

        // Insertar el registro de verificacion
        const ineVerificationData = {
            user_id: user.value.id,
            curp: curp,
            ine_number: ineNumber,
            verification_status: 'verified',
            verification_response: {
                ocr_data: ineValidation.data?.ocr || null,
                nominal_list: ineValidation.data?.nominalList || null,
                face_comparison: ineValidation.data?.faceComparison || null,
                normalized: ineValidation.normalized,
                lista_nominal_valido: ineValidation.normalized?.listaNominal?.valido || false,
                face_match_score: ineValidation.normalized?.comparacionFacial?.similitud || null
            },
            verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('ine_verifications')
            .insert(ineVerificationData)
            .select();

        if (error) {
            console.error('Error al guardar validacion INE:', error);
            throw error;
        }

        const verificationRecord = data[0];
        console.log('Validacion INE guardada exitosamente:', verificationRecord);

        // Subir imagenes a S3 usando el composable
        try {
            console.log('Subiendo imagenes de INE a S3...');
            const uploadResult = await uploadINEFiles(
                frontFile,
                backFile,
                selfieFile,
                profile.value?.username || user.value.email.split('@')[0],
                verificationRecord.id
            );

            // Guardar las URLs en la tabla documents
            const documentsToInsert = [
                {
                    user_id: user.value.id,
                    document_type: 'ine_front',
                    document_name: uploadResult.front.filename,
                    file_url: uploadResult.front.file_url,
                    s3_key: uploadResult.front.s3_key,
                    file_size: uploadResult.front.file_size,
                    mime_type: uploadResult.front.mime_type,
                    verification_id: verificationRecord.id
                },
                {
                    user_id: user.value.id,
                    document_type: 'ine_back',
                    document_name: uploadResult.back.filename,
                    file_url: uploadResult.back.file_url,
                    s3_key: uploadResult.back.s3_key,
                    file_size: uploadResult.back.file_size,
                    mime_type: uploadResult.back.mime_type,
                    verification_id: verificationRecord.id
                },
                {
                    user_id: user.value.id,
                    document_type: 'selfie',
                    document_name: uploadResult.selfie.filename,
                    file_url: uploadResult.selfie.file_url,
                    s3_key: uploadResult.selfie.s3_key,
                    file_size: uploadResult.selfie.file_size,
                    mime_type: uploadResult.selfie.mime_type,
                    verification_id: verificationRecord.id
                }
            ];

            const { error: docsError } = await supabase
                .from('documents')
                .insert(documentsToInsert);

            if (docsError) {
                console.error('Error al guardar documentos:', docsError);
            } else {
                console.log('Documentos guardados en base de datos');
            }
        } catch (s3Error) {
            console.error('Error al subir imagenes a S3:', s3Error);
            // No lanzar error, las imagenes son secundarias
        }

        return verificationRecord;
    } catch (error) {
        console.error('Error critico al guardar validacion INE:', error);
        throw error;
    }
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
        let ciecValidation = null;
        if (formData.value.ciecPassword && formData.value.ciecPassword.length >= 8) {
            toast.add({
                severity: 'info',
                summary: 'Validando CIEC',
                detail: 'Verificando contraseña CIEC...',
                life: 3000
            });

            ciecValidation = await nubariumService.validateClientCIEC({
                rfc: formData.value.rfc,
                password: formData.value.ciecPassword
            });

            if (ciecValidation && ciecValidation.success) {
                formData.value.satValidationResults.ciec = ciecValidation.normalized;
            }
        }

        // Guardar inmediatamente en base de datos
        await saveSATValidationToDB(rfcNameResult, rfcValidation, ciecValidation);

        toast.add({
            severity: 'success',
            summary: 'SAT Validado',
            detail: 'RFC verificado correctamente y guardado',
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
        // Convert files to base64 without compression
        console.log('[CONVERSION] Convirtiendo imágenes INE a base64...');
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

        // Guardar inmediatamente en base de datos y subir imagenes a S3
        await saveINEValidationToDB(
            ineValidation,
            formData.value.ineFrontFile,
            formData.value.ineBackFile,
            formData.value.selfieFile
        );

        toast.add({
            severity: 'success',
            summary: 'INE Validado',
            detail: 'Identidad verificada exitosamente y guardada',
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
    console.log('Guardando datos del cliente en Supabase...');

    try {
        const { supabase } = await import('@/lib/supabaseClient.js');

        // Obtener IDs de las verificaciones previas
        const { data: ineVerif } = await supabase
            .from('ine_verifications')
            .select('id')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const { data: satVerif } = await supabase
            .from('sat_verifications')
            .select('id')
            .eq('user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Guardar perfil del cliente
        const clientProfileData = {
            user_id: user.value.id,
            phone_number: formData.value.phoneNumber,
            same_as_ine: formData.value.sameAsINE,
            street: formData.value.address.street || null,
            exterior_number: formData.value.address.exteriorNumber || null,
            interior_number: formData.value.address.interiorNumber || null,
            neighborhood: formData.value.address.neighborhood || null,
            city: formData.value.address.city || null,
            state: formData.value.address.state || null,
            postal_code: formData.value.address.postalCode || null,
            ine_verification_id: ineVerif?.id || null,
            sat_verification_id: satVerif?.id || null,
            onboarding_completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: profileData, error: profileError } = await supabase
            .from('client_profiles')
            .upsert(clientProfileData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (profileError) {
            console.error('Error al guardar perfil del cliente:', profileError);
            throw new Error(`Error de base de datos: ${profileError.message}`);
        }

        console.log('Perfil del cliente guardado exitosamente');

        // Obtener datos completos de SAT e INE para tabla clients
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

        const { data: documents } = await supabase
            .from('documents')
            .select('document_type, file_url')
            .eq('user_id', user.value.id)
            .in('document_type', ['ine_front', 'selfie'])
            .order('created_at', { ascending: false });

        // Construir dirección completa
        const fullAddress = [
            formData.value.address.street,
            formData.value.address.exteriorNumber,
            formData.value.address.interiorNumber,
            formData.value.address.neighborhood,
            formData.value.address.city,
            formData.value.address.state,
            formData.value.address.postalCode
        ].filter(Boolean).join(', ');

        // Geocodificar dirección
        let latitude = null;
        let longitude = null;
        try {
            console.log('[GEOCODE] Geocodificando dirección del cliente:', fullAddress);
            const geocodeResult = await geocodeAddress(fullAddress);
            latitude = geocodeResult.lat;
            longitude = geocodeResult.lng;
            console.log('[OK] Dirección geocodificada:', { latitude, longitude });
        } catch (error) {
            console.warn('[WARN] No se pudo geocodificar la dirección:', error.message);
            // No fallar el onboarding si falla geocoding
        }

        // Extraer nombre de contacto del INE
        const ineNormalized = ineData?.verification_response?.normalized || ineData?.verification_response?.ocr_data;
        const contactPerson = ineNormalized ?
            `${ineNormalized.nombre || ''} ${ineNormalized.apellidoPaterno || ''} ${ineNormalized.apellidoMaterno || ''}`.trim()
            : null;

        // Extraer razón social del SAT
        const companyName = satData?.tax_status?.nombreRazonSocial ||
                           satData?.verification_response?.rfc_name?.normalized?.nombre ||
                           `Cliente ${user.value.email}`;

        // Obtener URLs de documentos
        const ineFrontUrl = documents?.find(d => d.document_type === 'ine_front')?.file_url || null;
        const selfieUrl = documents?.find(d => d.document_type === 'selfie')?.file_url || null;

        // Guardar en tabla clients
        const clientData = {
            user_id: user.value.id,
            company_name: companyName,
            contact_person: contactPerson,
            phone: formData.value.phoneNumber,
            email: user.value.email,
            address: fullAddress,
            latitude: latitude,
            longitude: longitude,
            city: formData.value.address.city || null,
            state: formData.value.address.state || null,
            postal_code: formData.value.address.postalCode || null,
            rfc: satData?.rfc || null,
            ciec_validated: satData?.ciec ? true : false,
            ine_front_url: ineFrontUrl,
            selfie_url: selfieUrl,
            status: 'active',
            auto_assign_preventive: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: clientRecord, error: clientError } = await supabase
            .from('clients')
            .upsert(clientData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (clientError) {
            console.error('Error al guardar en tabla clients:', clientError);
            // No lanzar error, la tabla client_profiles ya se guardó
        } else {
            console.log('Cliente guardado en tabla clients exitosamente');
        }

        // Guardar activos si hay alguno
        const validAssets = formData.value.assets.filter(asset => asset.name.trim() !== '');

        if (validAssets.length > 0) {
            const assetsData = validAssets.map(asset => ({
                client_profile_id: profileData.id,
                name: asset.name,
                asset_type: asset.type,
                location: asset.location || null,
                description: asset.description || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error: assetsError } = await supabase
                .from('client_assets')
                .insert(assetsData);

            if (assetsError) {
                console.error('Error al guardar activos:', assetsError);
                // No lanzar error, los activos son opcionales
            } else {
                console.log(`${validAssets.length} activos guardados exitosamente`);
            }
        }

        return profileData;

    } catch (error) {
        console.error('Error critico al guardar datos del cliente:', error);
        throw error;
    }
};

// File upload handlers
const onINEFrontSelect = (event) => {
    formData.value.ineFrontFile = event.files[0];
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
                    <img src="/demo/images/logo.png" alt="Mantex Logo" class="mb-8 w-16 mx-auto"/>
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
                                Validando información...
                            </p>
                        </div>

                        <!-- Step Forms -->
                        <div v-else>
                            <!-- Step 1: SAT (RFC + optional CIEC) -->
                            <div v-if="currentStep === 0" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-600 rounded-md">
                                        <h5 class="font-semibold text-blue-700 dark:text-blue-400 mb-2">Validación datos del SAT</h5>
                                        <p class="text-sm text-blue-600 dark:text-blue-300">
                                            Ingresa tu RFC y opcionalmente tu contraseña CIEC para poder hacer una validación más rápida y precisa.
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
                                        La contraseña CIEC es opcional pero nos permite hacer una validación más rápida y precisa.
                                    </small>
                                </div>

                                <div v-if="formData.satValidationResults" class="col-span-12 mt-4">
                                    <div class="p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">Datos del SAT validados correctamente</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            RFC verificado correctamente: {{ formData.satValidationResults.valido ? 'Activo' : 'Inactivo' }}
                                        </p>
                                        <div v-if="formData.satValidationResults.nombreRazonSocial?.nombre" class="mt-2 text-sm">
                                            <strong>Razón social:</strong> {{ formData.satValidationResults.nombreRazonSocial.nombre }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: INE + Selfie (no blacklist) -->
                            <div v-if="currentStep === 1" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-600 rounded-md">
                                        <h5 class="font-semibold text-green-700 dark:text-green-400 mb-2">Identificación Oficial</h5>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Sube las imágenes de tu INE y tómate una selfie.
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
                                        <h6 class="font-semibold text-green-700 dark:text-green-400 mb-2">Identidad validada exitosamente</h6>
                                        <p class="text-sm text-green-600 dark:text-green-300">
                                            Identidad verificada exitosamente
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 3: Contact and Address Data -->
                            <div v-if="currentStep === 2" class="grid grid-cols-12 gap-4">
                                <div class="col-span-12">
                                    <div class="mb-6 p-4 bg-purple-50 dark:bg-purple-400/10 border border-purple-200 dark:border-purple-600 rounded-md">
                                        <h5 class="font-semibold text-purple-700 dark:text-purple-400 mb-2">Datos de contacto y ubicación</h5>
                                        <p class="text-sm text-purple-600 dark:text-purple-300">
                                            Información de contacto y dirección de tu empresa
                                        </p>
                                    </div>
                                </div>

                                <!-- Phone Number -->
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

                                <!-- Address Same as INE Radio -->
                                <div class="col-span-12">
                                    <label class="block font-semibold mb-3">¿La dirección de tu empresa es la misma que tu INE? *</label>
                                    <div class="flex gap-4">
                                        <div class="flex items-center">
                                            <RadioButton
                                                v-model="formData.sameAsINE"
                                                inputId="sameYes"
                                                :value="true"
                                                @change="copyAddressFromINE"
                                            />
                                            <label for="sameYes" class="ml-2">Sí, es la misma</label>
                                        </div>
                                        <div class="flex items-center">
                                            <RadioButton
                                                v-model="formData.sameAsINE"
                                                inputId="sameNo"
                                                :value="false"
                                                @change="copyAddressFromINE"
                                            />
                                            <label for="sameNo" class="ml-2">No, es diferente</label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Address Form (shown if selection made) -->
                                <template v-if="formData.sameAsINE !== null">
                                    <div class="col-span-12">
                                        <h5 class="font-semibold mb-4">Dirección de la empresa</h5>
                                    </div>

                                    <div class="col-span-12 md:col-span-8">
                                        <label class="block font-medium mb-2">Calle *</label>
                                        <InputText v-model="formData.address.street" class="w-full" placeholder="Nombre de la calle" />
                                    </div>

                                    <div class="col-span-12 md:col-span-2">
                                        <label class="block font-medium mb-2">Núm. Exterior *</label>
                                        <InputText v-model="formData.address.exteriorNumber" class="w-full" placeholder="123" />
                                    </div>

                                    <div class="col-span-12 md:col-span-2">
                                        <label class="block font-medium mb-2">Núm. Interior</label>
                                        <InputText v-model="formData.address.interiorNumber" class="w-full" placeholder="A" />
                                    </div>

                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Colonia *</label>
                                        <InputText v-model="formData.address.neighborhood" class="w-full" placeholder="Colonia" />
                                    </div>

                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Ciudad *</label>
                                        <InputText v-model="formData.address.city" class="w-full" placeholder="Ciudad" />
                                    </div>

                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Estado *</label>
                                        <InputText v-model="formData.address.state" class="w-full" placeholder="Estado" />
                                    </div>

                                    <div class="col-span-12 md:col-span-6">
                                        <label class="block font-medium mb-2">Código Postal *</label>
                                        <InputText v-model="formData.address.postalCode" class="w-full" placeholder="12345" />
                                    </div>
                                </template>

                                <!-- Assets Section -->
                                <div class="col-span-12 mt-4">
                                    <div class="flex justify-between items-center mb-4">
                                        <h5 class="font-semibold">Activos para mantenimiento</h5>
                                        <Button label="Agregar Activo" icon="pi pi-plus" size="small" @click="addAsset" />
                                    </div>
                                    <p class="text-sm text-surface-500 mb-4">
                                        Registra los activos de esta ubicación. Podrás agregar más sucursales y activos desde tu dashboard.
                                    </p>
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
                                                <label class="block font-medium mb-2">Nombre del activo</label>
                                                <InputText
                                                    v-model="asset.name"
                                                    class="w-full"
                                                    placeholder="Ej: Aire Acondicionado Principal"
                                                />
                                            </div>
                                            <div class="col-span-12 md:col-span-6">
                                                <label class="block font-medium mb-2">Tipo</label>
                                                <Select
                                                    v-model="asset.type"
                                                    :options="assetTypes"
                                                    optionLabel="label"
                                                    optionValue="value"
                                                    placeholder="Selecciona el tipo"
                                                    class="w-full"
                                                />
                                            </div>
                                            <div class="col-span-12">
                                                <label class="block font-medium mb-2">Ubicación</label>
                                                <InputText
                                                    v-model="asset.location"
                                                    class="w-full"
                                                    placeholder="Ej: Planta Baja, Oficina Principal"
                                                />
                                                <small class="text-surface-500">Ubicación específica dentro de la dirección registrada</small>
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