<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const toast = useToast();
const confirm = useConfirm();
const verifications = ref([]);
const loading = ref(true);
const selectedVerification = ref(null);
const detailDialogVisible = ref(false);
const processing = ref(false);
const rejectReason = ref('');
const rejectDialogVisible = ref(false);

// Match SuppliersApproval filters
const filters = ref({
    global: { value: null }
});

const statuses = {
    pending: { label: 'Pendiente', severity: 'warning' },
    submitted: { label: 'Enviado', severity: 'info' },
    approved: { label: 'Aprobado', severity: 'success' },
    rejected: { label: 'Rechazado', severity: 'danger' },
    correction_needed: { label: 'Corrección', severity: 'warning' }
};

onMounted(() => {
    fetchVerifications();
});

const fetchVerifications = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('admin_technician_verifications_view')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        verifications.value = data;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las verificaciones', life: 3000 });
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const openDetail = (verification) => {
    selectedVerification.value = verification;
    detailDialogVisible.value = true;
};

const approve = async () => {
    if (!selectedVerification.value) return;

    // Confirm dialog inside modal logic not strictly needed if we have direct buttons but good for safety
    // User asked for "Action button > Disparar Modal", modal has Approve/Reject.

    processing.value = true;
    try {
        const { data, error } = await supabase.rpc('admin_approve_technician_verification', {
            p_verification_id: selectedVerification.value.id,
            p_status: 'approved'
        });

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Aprobado', detail: 'Técnico verificado correctamente', life: 3000 });
        detailDialogVisible.value = false;
        fetchVerifications();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al aprobar', life: 3000 });
        console.error(e);
    } finally {
        processing.value = false;
    }
};

const openRejectDialog = () => {
    rejectReason.value = '';
    rejectDialogVisible.value = true;
};

const reject = async () => {
    if (!selectedVerification.value || !rejectReason.value) return;

    processing.value = true;
    try {
        const { data, error } = await supabase.rpc('admin_approve_technician_verification', {
            p_verification_id: selectedVerification.value.id,
            p_status: 'rejected',
            p_notes: rejectReason.value
        });

        if (error) throw error;

        toast.add({ severity: 'warn', summary: 'Rechazado', detail: 'Verificación rechazada', life: 3000 });
        rejectDialogVisible.value = false;
        detailDialogVisible.value = false;
        fetchVerifications();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al rechazar', life: 3000 });
        console.error(e);
    } finally {
        processing.value = false;
    }
};

const formatDate = (dateHash) => {
    if (!dateHash) return '-';
    return new Date(dateHash).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Técnicos Pendientes de Verificación</h1>

        <DataTable :value="verifications" :loading="loading" stripe paginator :rows="10" :filters="filters">
            <template #header>
                <div class="flex justify-content-end">
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>

            <Column field="first_name" header="Nombre" sortable>
                <template #body="{ data }">
                    <div class="flex flex-col">
                        <span class="font-bold">{{ data.first_name }} {{ data.last_name }}</span>
                        <span class="text-sm text-gray-500">{{ data.technician_email }}</span>
                    </div>
                </template>
            </Column>

            <Column field="supplier_company" header="Proveedor" sortable>
                <template #body="{ data }">
                    <div class="flex flex-col">
                        <span class="font-bold">{{ data.supplier_company || 'Sin Empresa' }}</span>
                        <span class="text-sm text-gray-500">{{ data.supplier_contact }}</span>
                    </div>
                </template>
            </Column>

            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <Tag :value="statuses[data.status]?.label" :severity="statuses[data.status]?.severity" />
                </template>
            </Column>

            <Column field="created_at" header="Fecha Alta" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                </template>
            </Column>

            <Column header="Acciones">
                <template #body="{ data }">
                    <Button icon="pi pi-eye" class="p-button-text" @click="openDetail(data)"
                        v-tooltip="'Ver Detalles'" />
                </template>
            </Column>

            <template #empty>No hay técnicos pendientes de verificación.</template>
        </DataTable>

        <!-- Detail Dialog -->
        <Dialog v-model:visible="detailDialogVisible" modal header="Detalles del Técnico" :style="{ width: '80vw' }">
            <div v-if="selectedVerification" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left: Photos -->
                <div class="space-y-4">
                    <h3 class="text-lg font-bold">Documentos</h3>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="border p-3 rounded">
                            <p class="text-sm font-semibold mb-2">INE Frontal</p>
                            <Image :src="selectedVerification.ine_front_url" alt="INE Front" preview width="100%"
                                class="shadow-sm rounded" />
                        </div>

                        <div class="border p-3 rounded">
                            <p class="text-sm font-semibold mb-2">INE Trasera</p>
                            <Image :src="selectedVerification.ine_back_url" alt="INE Back" preview width="100%"
                                class="shadow-sm rounded" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="border p-3 rounded bg-blue-50">
                            <p class="text-sm font-semibold mb-2">Selfie en Vivo</p>
                            <Image :src="selectedVerification.selfie_url" alt="Selfie" preview width="100%"
                                class="shadow-sm rounded" />
                        </div>

                        <div class="border p-3 rounded">
                            <p class="text-sm font-semibold mb-2">Comprobante Domicilio</p>
                            <Image :src="selectedVerification.proof_of_address_url" alt="Proof" preview width="100%"
                                class="shadow-sm rounded" />
                        </div>
                    </div>
                </div>

                <!-- Right: Data -->
                <div class="space-y-4">
                    <h3 class="text-lg font-bold">Datos Extraídos (OCR)</h3>

                    <div class="p-4 bg-gray-50 rounded" v-if="selectedVerification.ine_data">
                        <div class="field" v-for="(val, key) in selectedVerification.ine_data" :key="key">
                            <span class="font-bold capitalize">{{ key.replace('_', ' ') }}:</span> {{ val }}
                        </div>
                    </div>
                    <div v-else class="p-4 bg-yellow-50 text-yellow-700 rounded">
                        Sin datos OCR disponibles.
                    </div>

                    <div class="mt-6 p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between"
                        v-if="selectedVerification.face_match_score">
                        <div>
                            <span class="font-bold text-lg block">Coincidencia Biométrica</span>
                            <small class="text-gray-500">Mínimo recomendado: 80%</small>
                        </div>
                        <span class="text-3xl font-black"
                            :class="selectedVerification.face_match_score > 80 ? 'text-green-600' : 'text-red-500'">
                            {{ selectedVerification.face_match_score }}%
                        </span>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-between w-full">
                    <Button label="Cerrar" icon="pi pi-times" class="p-button-text"
                        @click="detailDialogVisible = false" />
                    <div class="space-x-2">
                        <Button label="Rechazar" icon="pi pi-times-circle" severity="danger" @click="openRejectDialog"
                            :disabled="processing" />
                        <Button label="Aprobar" icon="pi pi-check-circle" severity="success" @click="approve"
                            :loading="processing" />
                    </div>
                </div>
            </template>
        </Dialog>

        <!-- Reject Reason Dialog -->
        <Dialog v-model:visible="rejectDialogVisible" modal header="Rechazar Verificación" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <p>Por favor indica el motivo del rechazo. Esto será visible para el técnico.</p>
                <Textarea v-model="rejectReason" rows="5" placeholder="Ej. La foto del INE está borrosa..." />
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text"
                    @click="rejectDialogVisible = false" />
                <Button label="Confirmar Rechazo" icon="pi pi-check" severity="danger" @click="reject"
                    :loading="processing" />
            </template>
        </Dialog>
    </div>
</template>
