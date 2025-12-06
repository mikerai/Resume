<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { useS3Upload } from '@/composables/useS3Upload';
import { supabase } from '@/lib/supabaseClient';
import Steps from 'primevue/steps';
import Card from 'primevue/card';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Image from 'primevue/image';
import Message from 'primevue/message';
import NubariumService from '@/lib/nubariumService';

const router = useRouter();
const toast = useToast();
const { user } = useAuth();
const { uploadFileToS3, isUploading } = useS3Upload();

const activeStep = ref(0);
const loading = ref(false);
const verificationStatus = ref(null);

const steps = [
    { label: 'Identificación (INE)' },
    { label: 'Validación Facial' },
    { label: 'Comprobante de Domicilio' },
    { label: 'Revisión' }
];

const ineFront = ref(null);
const ineBack = ref(null);
const selfie = ref(null);
const proofOfAddress = ref(null);

const ineData = ref(null);
const faceMatchScore = ref(null);
const addressData = ref(null);

const onSelectIneFront = (event) => {
    ineFront.value = event.files[0];
};

const onSelectIneBack = (event) => {
    ineBack.value = event.files[0];
};

const onSelectSelfie = (event) => {
    selfie.value = event.files[0];
};

const onSelectProofAddress = (event) => {
    proofOfAddress.value = event.files[0];
};

const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const validateIne = async () => {
    if (!ineFront.value || !ineBack.value) {
        toast.add({ severity: 'warn', summary: 'Faltan imágenes', detail: 'Por favor suba ambas caras de su INE', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const frontB64 = await convertToBase64(ineFront.value);
        const backB64 = await convertToBase64(ineBack.value);

        const result = await NubariumService.validateINEOCR(frontB64, backB64);
        
        if (result && result.estatus === 'exito') {
            ineData.value = result; // Guardar datos extraídos
            toast.add({ severity: 'success', summary: 'INE Validada', detail: 'Datos extraídos correctamente', life: 3000 });
            activeStep.value = 1;
        } else {
            throw new Error(result?.mensaje || 'Error al validar INE');
        }
    } catch (error) {
        console.error('INE Validation Error:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo validar la INE. Intente con imágenes más claras.', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const validateFace = async () => {
    if (!selfie.value) {
        toast.add({ severity: 'warn', summary: 'Falta selfie', detail: 'Por favor tome una selfie', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const ineB64 = await convertToBase64(ineFront.value); // Usar frente de INE
        const selfieB64 = await convertToBase64(selfie.value);

        const result = await NubariumService.validateFaceComparison(ineB64, selfieB64);

        if (result && result.estatus === 'exito' && result.similitud >= 80) {
            faceMatchScore.value = result.similitud;
            toast.add({ severity: 'success', summary: 'Identidad Verificada', detail: `Similitud: ${result.similitud}%`, life: 3000 });
            activeStep.value = 2;
        } else {
            throw new Error(`Similitud insuficiente: ${result?.similitud || 0}%`);
        }
    } catch (error) {
        console.error('Face Match Error:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No coincide la selfie con la INE.', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const validateaddress = async () => {
    if (!proofOfAddress.value) {
        toast.add({ severity: 'warn', summary: 'Falta documento', detail: 'Suba su comprobante de domicilio', life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const docB64 = await convertToBase64(proofOfAddress.value);
        const result = await NubariumService.validateProofOfAddress(docB64);

        if (result && result.estatus === 'exito') {
            addressData.value = result;
            toast.add({ severity: 'success', summary: 'Comprobante Validado', detail: 'Dirección extraída', life: 3000 });
            activeStep.value = 3;
        } else {
             // A veces Nubarium puede fallar pero queremos permitir subirlo para revisión manual
             console.warn('OCR Address failed, but allowing upload for manual review');
             activeStep.value = 3;
        }
    } catch (error) {
        console.error('Address Error:', error);
        // Permitir avanzar para revisión manual si falla el OCR automático repetidamente?
        // Por ahora estricto, o quizás warning.
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'No se pudieron extraer datos automáticamente, pasará a revisión manual.', life: 4000 });
        activeStep.value = 3;
    } finally {
        loading.value = false;
    }
};

const submitVerification = async () => {
    loading.value = true;
    try {
        const username = user.value.email.split('@')[0];
        
        // 1. Upload files to S3
        const ineFrontRes = await uploadFileToS3(ineFront.value, username, 'verifictions/ine');
        const ineBackRes = await uploadFileToS3(ineBack.value, username, 'verifictions/ine');
        const selfieRes = await uploadFileToS3(selfie.value, username, 'verifictions/selfie');
        const addressRes = await uploadFileToS3(proofOfAddress.value, username, 'verifictions/address');

        // 2. Save to Database
        const verificationData = {
            user_id: user.value.id,
            ine_front_url: ineFrontRes.s3_key,
            ine_back_url: ineBackRes.s3_key,
            selfie_url: selfieRes.s3_key,
            proof_of_address_url: addressRes.s3_key,
            ine_data: ineData.value || {},
            address_data: addressData.value || {},
            face_match_score: faceMatchScore.value,
            identity_validated: faceMatchScore.value >= 80,
            status: 'submitted'
        };

        const { error } = await supabase
            .from('technician_verifications')
            .upsert(verificationData, { onConflict: 'user_id' });

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Enviado', detail: 'Su verificación está en revisión.', life: 3000 });
        // Redirigir o mostrar estado de "En espera"
        verificationStatus.value = 'submitted';
        router.push('/');
    } catch (error) {
        console.error('Submission Error:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar la información.', life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <Card class="w-full max-w-4xl">
            <template #title>
                <div class="text-center mb-4">
                    <h2 class="text-2xl font-bold">Verificación de Técnico</h2>
                    <p class="text-gray-500 font-normal text-base mt-1">Complete los pasos para activar su cuenta</p>
                </div>
            </template>
            <template #content>
                <Steps :model="steps" :readonly="true" v-model:activeStep="activeStep" class="mb-6" />

                <!-- Step 1: INE -->
                <div v-if="activeStep === 0" class="flex flex-col gap-6">
                    <Message severity="info" :closable="false">Asegúrese que las fotos sean claras, sin reflejos y legibles.</Message>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <h4 class="font-medium mb-3">INE Frente</h4>
                            <FileUpload mode="basic" accept="image/*" :maxFileSize="5000000" @select="onSelectIneFront" :auto="true" chooseLabel="Subir Frente" class="mb-2" />
                            <span v-if="ineFront" class="text-green-600 text-sm"><i class="pi pi-check mr-1"></i> Seleccionado</span>
                        </div>
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <h4 class="font-medium mb-3">INE Reverso</h4>
                            <FileUpload mode="basic" accept="image/*" :maxFileSize="5000000" @select="onSelectIneBack" :auto="true" chooseLabel="Subir Reverso" class="mb-2" />
                             <span v-if="ineBack" class="text-green-600 text-sm"><i class="pi pi-check mr-1"></i> Seleccionado</span>
                        </div>
                    </div>
                     <div class="flex justify-end mt-4">
                        <Button label="Validar e Ir al Siguiente" icon="pi pi-arrow-right" iconPos="right" @click="validateIne" :loading="loading" />
                    </div>
                </div>

                <!-- Step 2: Selfie -->
                <div v-if="activeStep === 1" class="flex flex-col gap-6">
                     <Message severity="info" :closable="false">Tome una selfie sosteniendo su INE (opcional) o solo su rostro bien iluminado para comparar con la identificación.</Message>
                    <div class="flex justify-center">
                         <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center w-full max-w-md">
                            <h4 class="font-medium mb-3">Tu Selfie</h4>
                            <FileUpload mode="basic" accept="image/*" :maxFileSize="5000000" @select="onSelectSelfie" :auto="true" chooseLabel="Subir Selfie" class="mb-2" />
                            <span v-if="selfie" class="text-green-600 text-sm"><i class="pi pi-check mr-1"></i> Seleccionado</span>
                        </div>
                    </div>
                    <div class="flex justify-between mt-4">
                        <Button label="Atrás" icon="pi pi-arrow-left" severity="secondary" text @click="activeStep = 0" />
                        <Button label="Validar Biometría" icon="pi pi-arrow-right" iconPos="right" @click="validateFace" :loading="loading" />
                    </div>
                </div>

                <!-- Step 3: Address -->
                <div v-if="activeStep === 2" class="flex flex-col gap-6">
                    <Message severity="info" :closable="false">Suba un comprobante de domicilio reciente (CFE, Agua, Teléfono) no mayor a 3 meses.</Message>
                     <div class="flex justify-center">
                         <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center w-full max-w-md">
                            <h4 class="font-medium mb-3">Comprobante de Domicilio</h4>
                            <FileUpload mode="basic" accept="image/*,application/pdf" :maxFileSize="5000000" @select="onSelectProofAddress" :auto="true" chooseLabel="Subir Documento" class="mb-2" />
                            <span v-if="proofOfAddress" class="text-green-600 text-sm"><i class="pi pi-check mr-1"></i> Seleccionado</span>
                        </div>
                    </div>
                    <div class="flex justify-between mt-4">
                        <Button label="Atrás" icon="pi pi-arrow-left" severity="secondary" text @click="activeStep = 1" />
                        <Button label="Validar Dirección" icon="pi pi-arrow-right" iconPos="right" @click="validateaddress" :loading="loading" />
                    </div>
                </div>

                <!-- Step 4: Final Review -->
                <div v-if="activeStep === 3" class="flex flex-col gap-6">
                     <div class="text-center">
                        <i class="pi pi-check-circle text-green-500 text-6xl mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-800">¡Todo Listo!</h3>
                        <p class="text-gray-600">Hemos validado su identidad preliminarmente. Envíe su solicitud para la aprobación final de un administrador.</p>
                     </div>

                     <div class="bg-gray-100 p-4 rounded-lg text-sm">
                        <ul class="list-none p-0 m-0 space-y-2">
                            <li class="flex items-center"><i class="pi pi-check text-green-500 mr-2"></i> INE Validada (Datos extraídos)</li>
                            <li class="flex items-center"><i class="pi pi-check text-green-500 mr-2"></i> Rostro Verificado ({{ faceMatchScore }}% coincidencia)</li>
                            <li class="flex items-center"><i class="pi pi-check text-green-500 mr-2"></i> Dirección Capturada</li>
                        </ul>
                     </div>

                    <div class="flex justify-between mt-4">
                        <Button label="Atrás" icon="pi pi-arrow-left" severity="secondary" text @click="activeStep = 2" />
                        <Button label="Enviar Solicitud" icon="pi pi-send" severity="success" @click="submitVerification" :loading="loading" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
