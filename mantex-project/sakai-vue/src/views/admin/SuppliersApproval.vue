<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button
                        label="Aprobar Seleccionados"
                        icon="pi pi-check"
                        severity="success"
                        class="mr-2"
                        @click="approveSelectedSuppliers"
                        :disabled="!selectedSuppliers || !selectedSuppliers.length"
                    />
                    <Button
                        label="Rechazar Seleccionados"
                        icon="pi pi-times"
                        severity="danger"
                        @click="rejectSelectedSuppliers"
                        :disabled="!selectedSuppliers || !selectedSuppliers.length"
                    />
                </template>
                <template #end>
                    <Button
                        label="Exportar Lista"
                        icon="pi pi-download"
                        severity="secondary"
                        @click="exportSuppliers"
                    />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedSuppliers"
                :value="filteredSuppliers"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} proveedores"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Aprobación de Proveedores</h4>
                        <div class="flex gap-2">
                            <Dropdown
                                v-model="selectedStatus"
                                :options="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Estado"
                                class="w-44"
                            />
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                            </IconField>
                        </div>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                    <Column field="company_name" header="Empresa" sortable>
                        <template #body="slotProps">
                            <div class="flex align-items-center">
                                <div>
                                    <div class="font-medium">{{ slotProps.data.company_name }}</div>
                                    <div class="text-sm text-500">{{ slotProps.data.contact_person }}</div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column field="email" header="Contacto" sortable>
                        <template #body="slotProps">
                            <div>
                                <div>{{ slotProps.data.email }}</div>
                                <div class="text-sm text-500">{{ slotProps.data.phone_number }}</div>
                            </div>
                        </template>
                    </Column>

                    <Column field="legal_address" header="Ubicación" sortable style="min-width: 16rem">
                        <template #body="slotProps">
                            <div class="text-sm">
                                {{ slotProps.data.legal_address || 'Sin dirección' }}
                            </div>
                        </template>
                    </Column>

                    <Column field="specialties" header="Especialidades" style="min-width: 14rem">
                        <template #body="slotProps">
                            <div class="flex flex-wrap gap-1">
                                <template v-if="slotProps.data.specialties && Array.isArray(slotProps.data.specialties)">
                                    <Chip
                                        v-for="specialty in slotProps.data.specialties.slice(0, 2)"
                                        :key="specialty"
                                        :label="specialty"
                                        class="text-xs"
                                    />
                                    <span v-if="slotProps.data.specialties.length > 2" class="text-xs text-muted-color">
                                        +{{ slotProps.data.specialties.length - 2 }}
                                    </span>
                                </template>
                                <span v-else class="text-xs text-muted-color">Sin especialidades</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="getStatusLabel(slotProps.data.status)"
                                :severity="getStatusSeverity(slotProps.data.status)"
                            />
                        </template>
                    </Column>

                    <Column field="created_at" header="Registro" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">
                                {{ formatDate(slotProps.data.created_at) }}
                            </div>
                        </template>
                    </Column>

                    <Column header="Acciones" class="text-center" style="width: 200px">
                        <template #body="slotProps">
                            <div class="flex gap-1 justify-content-center">
                                <Button
                                    icon="pi pi-eye"
                                    severity="info"
                                    text
                                    rounded
                                    @click="viewSupplier(slotProps.data)"
                                    v-tooltip="'Ver detalles'"
                                />
                                <Button
                                    v-if="['submitted', 'under_review'].includes(slotProps.data.status)"
                                    icon="pi pi-check"
                                    severity="success"
                                    text
                                    rounded
                                    @click="approveSupplier(slotProps.data)"
                                    v-tooltip="'Aprobar'"
                                />
                                <Button
                                    v-if="['submitted', 'under_review'].includes(slotProps.data.status)"
                                    icon="pi pi-times"
                                    severity="danger"
                                    text
                                    rounded
                                    @click="rejectSupplier(slotProps.data)"
                                    v-tooltip="'Rechazar'"
                                />
                                <Button
                                    v-if="slotProps.data.status === 'approved'"
                                    icon="pi pi-ban"
                                    severity="warn"
                                    text
                                    rounded
                                    @click="suspendSupplier(slotProps.data)"
                                    v-tooltip="'Suspender'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
        </div>

    <!-- Dialog para ver detalles del proveedor -->
    <Dialog v-model:visible="showSupplierDialog" modal :style="{ width: '80vw' }" header="Detalles del Proveedor">
        <div v-if="selectedSupplier" class="grid">
            <div class="col-12 md:col-6">
                <h6>Información de la Empresa</h6>
                <div class="field">
                    <label>Empresa:</label>
                    <p class="font-medium">{{ selectedSupplier.company_name }}</p>
                </div>
                <div class="field">
                    <label>Persona de Contacto:</label>
                    <p>{{ selectedSupplier.contact_person }}</p>
                </div>
                <div class="field">
                    <label>Email:</label>
                    <p>{{ selectedSupplier.email }}</p>
                </div>
                <div class="field">
                    <label>Teléfono:</label>
                    <p>{{ selectedSupplier.phone_number }}</p>
                </div>
                <div class="field">
                    <label>RFC:</label>
                    <p>{{ selectedSupplier.rfc }}</p>
                </div>
            </div>

            <div class="col-12 md:col-6">
                <h6>Ubicación y Servicios</h6>
                <div class="field">
                    <label>Dirección:</label>
                    <p>{{ selectedSupplier.legal_address || 'Sin dirección' }}</p>
                </div>
                <div class="field">
                    <label>Radio de Servicio:</label>
                    <p>{{ selectedSupplier.service_radius_km }} km</p>
                </div>
                <div class="field">
                    <label>Especialidades:</label>
                    <div class="flex flex-wrap gap-1 mt-1">
                        <Chip
                            v-for="specialty in selectedSupplier.specialties"
                            :key="specialty"
                            :label="specialty"
                        />
                    </div>
                </div>
            </div>

            <div class="col-12" v-if="selectedSupplier.ine_front_url || selectedSupplier.ine_back_url">
                <h6>Documentos</h6>
                <div class="grid">
                    <div class="col-12 md:col-4" v-if="selectedSupplier.ine_front_url">
                        <div class="field">
                            <label>INE Frontal:</label>
                            <Image :src="selectedSupplier.ine_front_url" alt="INE Frontal" width="200" preview />
                        </div>
                    </div>
                    <div class="col-12 md:col-4" v-if="selectedSupplier.ine_back_url">
                        <div class="field">
                            <label>INE Trasera:</label>
                            <Image :src="selectedSupplier.ine_back_url" alt="INE Trasera" width="200" preview />
                        </div>
                    </div>
                    <div class="col-12 md:col-4" v-if="selectedSupplier.selfie_url">
                        <div class="field">
                            <label>Selfie ({{ selectedSupplier.face_similarity_score }}% similitud):</label>
                            <Image :src="selectedSupplier.selfie_url" alt="Selfie" width="200" preview />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-content-between">
                <div>
                    <Button
                        v-if="selectedSupplier?.status === 'pending'"
                        label="Rechazar"
                        icon="pi pi-times"
                        class="p-button-danger"
                        @click="rejectSupplier(selectedSupplier)"
                    />
                </div>
                <div class="flex gap-2">
                    <Button label="Cerrar" icon="pi pi-times" text @click="showSupplierDialog = false" />
                    <Button
                        v-if="['submitted', 'under_review'].includes(selectedSupplier?.status)"
                        label="Aprobar"
                        icon="pi pi-check"
                        severity="success"
                        @click="approveSupplier(selectedSupplier)"
                    />
                    <Button
                        v-if="['submitted', 'under_review'].includes(selectedSupplier?.status)"
                        label="Rechazar"
                        icon="pi pi-times"
                        severity="danger"
                        @click="rejectSupplier(selectedSupplier)"
                    />
                </div>
            </div>
        </template>
    </Dialog>

    <!-- Dialog para rechazar proveedor -->
    <Dialog v-model:visible="showRejectDialog" modal :style="{ width: '450px' }" header="Rechazar Proveedor">
        <div class="field">
            <label for="rejection-reason">Motivo del rechazo:</label>
            <Textarea
                id="rejection-reason"
                v-model="rejectionReason"
                rows="4"
                class="w-full"
                placeholder="Explica el motivo del rechazo..."
            />
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="showRejectDialog = false" />
            <Button label="Confirmar Rechazo" icon="pi pi-check" class="p-button-danger" @click="confirmReject" />
        </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Chip from 'primevue/chip';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const toast = useToast();
const confirm = useConfirm();
const dt = ref();

// Reactive data
const suppliers = ref([]);
const selectedSuppliers = ref([]);
const loading = ref(false);
const searchTerm = ref('');
const selectedStatus = ref('submitted'); // Default to show submitted suppliers that need approval

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const showSupplierDialog = ref(false);
const showRejectDialog = ref(false);
const selectedSupplier = ref(null);
const rejectionReason = ref('');
const supplierToReject = ref(null);

// Options
const statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'Enviados', value: 'submitted' },
    { label: 'En Revisión', value: 'under_review' },
    { label: 'Info Adicional', value: 'additional_info_required' },
    { label: 'Aprobados', value: 'approved' },
    { label: 'Rechazados', value: 'rejected' },
    { label: 'Suspendidos', value: 'suspended' }
];

// Computed
const filteredSuppliers = computed(() => {
    let filtered = suppliers.value;

    // Filter by search term
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        filtered = filtered.filter(supplier =>
            supplier.company_name.toLowerCase().includes(term) ||
            supplier.contact_person?.toLowerCase().includes(term) ||
            supplier.email?.toLowerCase().includes(term) ||
            supplier.phone?.includes(term)
        );
    }

    // Filter by status
    if (selectedStatus.value !== 'all') {
        filtered = filtered.filter(supplier => supplier.status === selectedStatus.value);
    }

    return filtered;
});

// Methods
const loadSuppliers = async () => {
    loading.value = true;
    try {
        console.log('🔍 DEBUGGING: Iniciando carga de supplier profiles...');

        // Primero intentemos una consulta simple para verificar conexión
        const { data: testConnection, error: connectionError } = await supabase
            .from('supplier_profiles')
            .select('count(*)', { count: 'exact' });

        console.log('🔗 Test de conexión a supplier_profiles:', testConnection, connectionError);

        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // También buscar suppliers que solo estén en users pero no tengan perfil aún
        const { data: usersOnlySuppliers, error: usersOnlyError } = await supabase
            .from('users')
            .select('id, email, created_at')
            .eq('role', 'supplier');

        console.log('🔍 Suppliers solo en users (sin perfil):', usersOnlySuppliers);

        console.log('📋 Respuesta completa de Supabase:');
        console.log('- Data:', data);
        console.log('- Error:', error);
        console.log('- Data length:', data?.length || 0);

        if (error) {
            console.error('❌ Error en consulta:', error);
            throw error;
        }

        suppliers.value = data || [];

        console.log(`📊 RESULTADOS DETALLADOS:`);
        console.log(`- Total suppliers cargados: ${suppliers.value.length}`);
        console.log('- Status breakdown:', suppliers.value.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {}));

        // Mostrar cada supplier individualmente
        suppliers.value.forEach((supplier, index) => {
            console.log(`📋 Supplier ${index + 1}:`, {
                id: supplier.id,
                company_name: supplier.company_name,
                status: supplier.status,
                created_at: supplier.created_at,
                user_id: supplier.user_id
            });
        });

        // Combinar datos reales con datos de prueba y agregar validaciones Nubarium
        const allSuppliers = [...(data || [])];

        console.log('📊 Suppliers reales encontrados:', data?.length || 0);
        console.log('📊 Raw data from supplier_profiles:', data);
        console.log('📊 Error from supplier_profiles:', error);

        if (data && data.length > 0) {
            console.log('📋 Suppliers reales:', data.map(s => ({
                id: s.id,
                company_name: s.company_name,
                status: s.status,
                rfc: s.rfc
            })));
        }

        // También verificar en la tabla users
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'supplier');

        console.log('👤 Users with supplier role:', usersData?.length || 0);
        console.log('👤 Supplier users data:', usersData);

        // Agregar suppliers de prueba con validaciones Nubarium completas
        const mockSuppliersWithValidations = [
            {
                id: 'nub-test-1',
                user_id: 'nub-user-1',
                company_name: 'Servicios Integrales del Bajío SA de CV',
                contact_person: 'Juan Carlos Mendoza Herrera',
                email: 'juan.mendoza@sibajio.com.mx',
                phone_number: '477-123-4567',
                rfc: 'SIB8807231G3',
                legal_address: 'Blvd. Adolfo López Mateos 2505, Centro, 37000 León, Gto.',
                status: 'submitted',
                specialties: ['mantenimiento_preventivo', 'instalaciones_electricas', 'climatizacion'],
                service_radius_km: 75,
                created_at: new Date().toISOString(),
                curp: 'MEHJ880723HGTDRN05',
                ine_front_url: '/assets/samples/ine_front_1.jpg',
                ine_back_url: '/assets/samples/ine_back_1.jpg',
                selfie_url: '/assets/samples/selfie_1.jpg',
                face_similarity_score: 94.2,
            },
            {
                id: 'nub-test-2',
                user_id: 'nub-user-2',
                company_name: 'Mantenimiento Profesional del Centro SC',
                contact_person: 'María Guadalupe Rodríguez Vásquez',
                email: 'maria.rodriguez@mpcenter.mx',
                phone_number: '33-1234-5678',
                rfc: 'MPC9012281H4',
                legal_address: 'Av. Américas 1500, Col. Providencia, 44630 Guadalajara, Jal.',
                status: 'submitted',
                specialties: ['limpieza_industrial', 'mantenimiento_edificios', 'jardineria'],
                service_radius_km: 50,
                created_at: new Date(Date.now() - 86400000).toISOString(),
                curp: 'RORV901228MJCDSL07',
                ine_front_url: '/assets/samples/ine_front_2.jpg',
                ine_back_url: '/assets/samples/ine_back_2.jpg',
                selfie_url: '/assets/samples/selfie_2.jpg',
                face_similarity_score: 91.8,
            }
        ];

        allSuppliers.push(...mockSuppliersWithValidations);

        // Los suppliers ya vienen con validaciones Nubarium reales del onboarding
        suppliers.value = allSuppliers.map(supplier => ({
            ...supplier,
            // Use real Nubarium validation data from onboarding, fallback to pending status
            nubarium_validations: supplier.nubarium_validations || {
                overall_assessment: {
                    risk_score: 0,
                    recommendation: 'pending',
                    summary: 'Validaciones pendientes - completar onboarding'
                },
                ine_validation: { status: 'pending' },
                sat_validation: { status: 'pending' },
                facial_biometry: { status: 'pending' },
                pld_blacklist: { status: 'pending' }
            }
        }));

        console.log('📋 Total suppliers con validaciones Nubarium:', suppliers.value.length);

    } catch (error) {
        console.error('❌ Error loading supplier profiles:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los proveedores',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const viewSupplier = (supplier) => {
    selectedSupplier.value = supplier;
    showSupplierDialog.value = true;
};

const approveSupplier = async (supplier) => {
    try {
        console.log('✅ Aprobando supplier:', supplier.company_name);

        const currentUser = (await supabase.auth.getUser()).data.user;

        // Usar la función SQL personalizada para aprobar
        const { data, error } = await supabase.rpc('approve_supplier', {
            supplier_profile_id: supplier.id,
            admin_user_id: currentUser?.id,
            notes: `Aprobado por admin el ${new Date().toLocaleString('es-MX')}`
        });

        if (error) {
            console.error('❌ Error aprobando supplier:', error);
            throw error;
        }

        console.log('✅ Supplier aprobado exitosamente');

        toast.add({
            severity: 'success',
            summary: 'Aprobado',
            detail: `Proveedor ${supplier.company_name} aprobado exitosamente`,
            life: 3000
        });

        await loadSuppliers();
        showSupplierDialog.value = false;
    } catch (error) {
        console.error('Error approving supplier:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al aprobar el proveedor',
            life: 3000
        });
    }
};

const rejectSupplier = (supplier) => {
    supplierToReject.value = supplier;
    rejectionReason.value = '';
    showRejectDialog.value = true;
};

const confirmReject = async () => {
    if (!rejectionReason.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Atención',
            detail: 'Debe proporcionar un motivo de rechazo',
            life: 3000
        });
        return;
    }

    try {
        console.log('❌ Rechazando supplier:', supplierToReject.value.company_name);

        const currentUser = (await supabase.auth.getUser()).data.user;

        // Usar la función SQL personalizada para rechazar
        const { data, error } = await supabase.rpc('reject_supplier', {
            supplier_profile_id: supplierToReject.value.id,
            admin_user_id: currentUser?.id,
            rejection_reason: rejectionReason.value
        });

        if (error) {
            console.error('❌ Error rechazando supplier:', error);
            throw error;
        }

        console.log('✅ Supplier rechazado exitosamente');

        toast.add({
            severity: 'success',
            summary: 'Rechazado',
            detail: `Proveedor ${supplierToReject.value.company_name} rechazado`,
            life: 3000
        });

        await loadSuppliers();
        showRejectDialog.value = false;
        showSupplierDialog.value = false;
    } catch (error) {
        console.error('Error rejecting supplier:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al rechazar el proveedor',
            life: 3000
        });
    }
};

const suspendSupplier = async (supplier) => {
    try {
        const { error } = await supabase
            .from('suppliers')
            .update({ status: 'suspended' })
            .eq('id', supplier.id);

        if (error) throw error;

        toast.add({
            severity: 'success',
            summary: 'Suspendido',
            detail: `Proveedor ${supplier.company_name} suspendido`,
            life: 3000
        });

        await loadSuppliers();
    } catch (error) {
        console.error('Error suspending supplier:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al suspender el proveedor',
            life: 3000
        });
    }
};

const getStatusLabel = (status) => {
    const labels = {
        'draft': 'Borrador',
        'submitted': 'Enviado',
        'under_review': 'En Revisión',
        'additional_info_required': 'Info Adicional Requerida',
        'approved': 'Aprobado',
        'rejected': 'Rechazado',
        'suspended': 'Suspendido',
        'pending': 'Pendiente'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        'draft': 'secondary',
        'submitted': 'info',
        'under_review': 'warn',
        'additional_info_required': 'warn',
        'approved': 'success',
        'rejected': 'danger',
        'suspended': 'secondary',
        'pending': 'warn'
    };
    return severities[status] || 'info';
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Bulk operations
const approveSelectedSuppliers = () => {
    if (!selectedSuppliers.value?.length) return;

    confirm.require({
        message: `¿Aprobar ${selectedSuppliers.value.length} proveedores seleccionados?`,
        header: 'Confirmar Aprobación',
        icon: 'pi pi-question-triangle',
        accept: async () => {
            try {
                for (const supplier of selectedSuppliers.value) {
                    await approveSupplier(supplier, false);
                }

                toast.add({
                    severity: 'success',
                    summary: 'Aprobación Masiva',
                    detail: `Se aprobaron ${selectedSuppliers.value.length} proveedores`,
                    life: 3000
                });

                selectedSuppliers.value = [];
                await loadSuppliers();
            } catch (error) {
                console.error('Error approving suppliers:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al aprobar algunos proveedores',
                    life: 3000
                });
            }
        }
    });
};

const rejectSelectedSuppliers = () => {
    if (!selectedSuppliers.value?.length) return;

    confirm.require({
        message: `¿Rechazar ${selectedSuppliers.value.length} proveedores seleccionados?`,
        header: 'Confirmar Rechazo',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                for (const supplier of selectedSuppliers.value) {
                    await rejectSupplier(supplier, 'Rechazo masivo por administrador');
                }

                toast.add({
                    severity: 'info',
                    summary: 'Rechazo Masivo',
                    detail: `Se rechazaron ${selectedSuppliers.value.length} proveedores`,
                    life: 3000
                });

                selectedSuppliers.value = [];
                await loadSuppliers();
            } catch (error) {
                console.error('Error rejecting suppliers:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al rechazar algunos proveedores',
                    life: 3000
                });
            }
        }
    });
};

const exportSuppliers = () => {
    dt.value.exportCSV();
    toast.add({
        severity: 'info',
        summary: 'Exportando',
        detail: 'Lista de proveedores exportada',
        life: 3000
    });
};

// Helper function to extract validation status from real Nubarium data
const extractValidationSummary = (nubariumValidations) => {
    if (!nubariumValidations || !nubariumValidations.biometry_results) {
        return {
            overall_status: 'pending',
            risk_score: 0,
            recommendation: 'pending',
            summary: 'Validaciones pendientes - completar onboarding'
        };
    }

    const { biometry_results, sat_validation, blacklist_results } = nubariumValidations;

    // Extract validation results
    const ineValid = biometry_results.listaNominal?.valido || false;
    const faceValid = biometry_results.comparacionFacial?.pasaLimite || false;
    const satValid = sat_validation?.rfc?.valido || false;
    const blacklistClean = !blacklist_results?.enAlgunaListaBloqueada || false;

    // Calculate risk score based on real validations
    let riskScore = 0;
    if (ineValid) riskScore += 25;
    if (faceValid) riskScore += 25;
    if (satValid) riskScore += 25;
    if (blacklistClean) riskScore += 25;

    let recommendation = 'reject';
    if (riskScore >= 75) recommendation = 'approve';
    else if (riskScore >= 50) recommendation = 'review';

    const summary = riskScore >= 75
        ? 'BAJO RIESGO: Todas las validaciones exitosas. Recomendado para aprobación.'
        : riskScore >= 50
        ? 'RIESGO MEDIO: Algunas validaciones fallaron. Requiere revisión manual.'
        : 'ALTO RIESGO: Múltiples validaciones fallaron. No recomendado.';

    return {
        overall_status: riskScore >= 75 ? 'valid' : riskScore >= 50 ? 'review' : 'invalid',
        risk_score: riskScore,
        recommendation,
        summary
    };
};

// DEPRECATED: Mock validation generator (replaced with real Nubarium data)
const generateNubariumValidations = (supplier) => {
    console.warn('⚠️ Using deprecated mock validation generator. Real Nubarium data should be used.');
    return generateNubariumValidationsMOCK(supplier);
};

// DEPRECATED: Function for generating mock Nubarium validations
const generateNubariumValidationsMOCK = (supplier) => {
    const riskFactors = [];
    let riskScore = 85;
    let recommendation = 'approve';

    // Simular diferentes escenarios basados en datos del proveedor
    const isHighRisk = supplier.rfc?.includes('SDS') || supplier.email?.includes('dudosos');

    if (isHighRisk) {
        riskScore = 15;
        recommendation = 'reject';
    }

    return {
        ine_validation: {
            status: isHighRisk ? 'suspicious' : 'valid',
            confidence: isHighRisk ? 0.45 : 0.95,
            data_extracted: {
                name: supplier.contact_person?.toUpperCase() || 'NOMBRE EXTRAÍDO',
                curp: supplier.curp || 'CURP123456789',
                birth_date: '1988-07-23',
                address: supplier.legal_address?.toUpperCase() || 'DIRECCIÓN EXTRAÍDA',
                voter_id: '1234567890123',
                expiry_date: '2029-12-31'
            },
            checks: {
                document_authenticity: !isHighRisk,
                data_consistency: !isHighRisk,
                not_expired: true,
                face_match_with_photo: !isHighRisk
            },
            ...(isHighRisk && {
                issues: [
                    'Documento presenta señales de alteración digital',
                    'CURP no coincide con formato estándar',
                    'Dirección no verificable en bases oficiales'
                ]
            })
        },
        sat_validation: {
            status: isHighRisk ? 'inactive' : 'active',
            rfc_status: isHighRisk ? 'no_localizado' : 'activo',
            situation: isHighRisk ? 'No localizado' : 'Activo',
            regime: isHighRisk ? null : 'Régimen General de Ley Personas Morales',
            company_data: isHighRisk ? null : {
                business_name: supplier.company_name?.toUpperCase(),
                commercial_name: supplier.company_name,
                start_date: '2015-03-15',
                last_status_change: '2024-01-01'
            },
            obligations: isHighRisk ? [] : [
                'Impuesto sobre la renta',
                'Impuesto al valor agregado'
            ],
            ...(isHighRisk && {
                issues: [
                    'RFC no encontrado en padrón del SAT',
                    'Posible RFC falso o inválido'
                ]
            })
        },
        blacklist_check: {
            pld_status: isHighRisk ? 'flagged' : 'clean',
            ofac_status: 'clean',
            blocklist_status: isHighRisk ? 'flagged' : 'clean',
            checks_performed: [
                'Lista de Personas Bloqueadas (CNBV)',
                'OFAC Specially Designated Nationals',
                'Lista Negra SAT',
                'Base 69-B',
                'Personas Políticamente Expuestas'
            ],
            ...(isHighRisk && {
                alerts: [
                    'Persona física coincide con lista de defraudadores fiscales',
                    'Empresa reportada en base 69-B del SAT'
                ]
            }),
            last_check: new Date().toISOString()
        },
        curp_validation: {
            status: isHighRisk ? 'invalid' : 'valid',
            exists_in_renapo: !isHighRisk,
            matches_ine_data: !isHighRisk,
            birth_certificate_status: isHighRisk ? 'not_found' : 'registered',
            ...(isHighRisk && {
                issues: ['CURP no existe en bases de RENAPO']
            })
        },
        business_verification: {
            legal_entity_exists: !isHighRisk,
            commercial_registry: {
                status: isHighRisk ? 'not_found' : 'registered',
                ...(isHighRisk ? {
                    issues: ['Empresa no registrada en Registro Público de Comercio']
                } : {
                    folio: 'GT-2015-00123456',
                    registration_date: '2015-03-15'
                })
            },
            tax_compliance: {
                current_status: isHighRisk ? 'non_compliant' : 'compliant',
                last_filing: isHighRisk ? null : '2024-01-31',
                has_debts: isHighRisk,
                ...(isHighRisk && { debt_amount: 285000.50 })
            }
        },
        face_biometry: {
            liveness_check: isHighRisk ? 'failed' : 'passed',
            similarity_score: isHighRisk ? 65.4 : 92.5,
            quality_score: isHighRisk ? 45.8 : 88.2,
            spoofing_detection: isHighRisk ? 'suspicious' : 'genuine',
            ...(isHighRisk && {
                issues: [
                    'Imagen presenta señales de manipulación',
                    'Baja similitud con foto de INE'
                ]
            })
        },
        overall_risk_score: riskScore,
        recommendation: recommendation,
        validation_timestamp: new Date().toISOString(),
        ...(isHighRisk && {
            rejection_reasons: [
                'Documento de identidad inválido o alterado',
                'RFC no válido en sistema SAT',
                'Persona/empresa en listas de bloqueo',
                'CURP inexistente en RENAPO',
                'Empresa no registrada legalmente',
                'Adeudos fiscales significativos',
                'Falla en verificación biométrica'
            ]
        })
    };
};

// Lifecycle
onMounted(() => {
    loadSuppliers();
});
</script>

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