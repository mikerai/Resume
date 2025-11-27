<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';

const props = defineProps({
    ticketId: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['quote-updated']);

const { user, profile } = useAuth();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const quote = ref(null);
const items = ref([]);
const supplierId = ref(null);

// Estado del formulario
const notes = ref('');
const validUntil = ref(null);
const showRejectDialog = ref(false);
const rejectionReason = ref('');

// Items por defecto
const defaultItem = {
    description: '',
    quantity: 1,
    unit_price: 0
};

// Computed
const subtotal = computed(() => {
    return items.value.reduce((acc, item) => {
        return acc + (item.quantity * item.unit_price);
    }, 0);
});

const taxAmount = computed(() => {
    return subtotal.value * 0.16; // 16% IVA
});

const totalAmount = computed(() => {
    return subtotal.value + taxAmount.value;
});

const isEditable = computed(() => {
    // Solo supplier puede editar, y solo si es draft o rechazada (para corregir) o nueva
    if (profile.value?.role !== 'supplier') return false;
    return !quote.value || quote.value.status === 'draft' || quote.value.status === 'rejected';
});

const canApprove = computed(() => {
    return profile.value?.role === 'client' && quote.value?.status === 'sent';
});

const statusSeverity = computed(() => {
    if (!quote.value) return 'info';
    switch (quote.value.status) {
        case 'draft': return 'secondary';
        case 'sent': return 'info';
        case 'approved': return 'success';
        case 'rejected': return 'danger';
        case 'cancelled': return 'warn';
        default: return 'info';
    }
});

const statusLabel = computed(() => {
    if (!quote.value) return 'Nueva Cotización';
    switch (quote.value.status) {
        case 'draft': return 'Borrador';
        case 'sent': return 'Enviada';
        case 'approved': return 'Aprobada';
        case 'rejected': return 'Rechazada';
        case 'cancelled': return 'Cancelada';
        default: return quote.value.status;
    }
});

// Lifecycle
onMounted(async () => {
    // Determinar rol y permisos
    if (profile.value?.role === 'supplier') {
        await fetchSupplierId();
    }
    await fetchQuote();
});

// Methods
const fetchSupplierId = async () => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('id')
            .eq('user_id', user.value.id)
            .single();
            
        if (error) throw error;
        supplierId.value = data.id;
    } catch (error) {
        console.error('Error fetching supplier ID:', error);
        // No mostrar error si no es supplier (puede ser admin/client viendo el componente)
    }
};

const fetchQuote = async () => {
    loading.value = true;
    try {
        let query = supabase
            .from('quotes')
            .select('*')
            .eq('ticket_id', props.ticketId);

        // Si es supplier, filtrar por su ID para asegurar que ve SU cotización
        if (supplierId.value) {
            query = query.eq('supplier_id', supplierId.value);
        }

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            quote.value = data;
            notes.value = data.notes;
            validUntil.value = data.valid_until;
            
            // Fetch items
            const { data: quoteItems, error: itemsError } = await supabase
                .from('quote_items')
                .select('*')
                .eq('quote_id', data.id);
                
            if (itemsError) throw itemsError;
            
            items.value = quoteItems.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price)
            }));
        } else {
            // Si no existe y soy supplier, inicializar nueva
            if (profile.value?.role === 'supplier') {
                items.value = [{ ...defaultItem }];
            } else {
                // Si soy cliente/admin y no hay cotización, items vacío
                items.value = [];
            }
        }
    } catch (error) {
        console.error('Error fetching quote:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar la cotización', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const addItem = () => {
    items.value.push({ ...defaultItem });
};

const removeItem = (index) => {
    items.value.splice(index, 1);
};

const validateForm = () => {
    if (items.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debe agregar al menos un ítem', life: 3000 });
        return false;
    }
    
    for (const item of items.value) {
        if (!item.description || item.description.trim() === '') {
            toast.add({ severity: 'warn', summary: 'Validación', detail: 'Todos los ítems deben tener descripción', life: 3000 });
            return false;
        }
        if (item.quantity <= 0) {
            toast.add({ severity: 'warn', summary: 'Validación', detail: 'La cantidad debe ser mayor a 0', life: 3000 });
            return false;
        }
    }
    return true;
};

const saveQuote = async (status = 'draft') => {
    if (!validateForm()) return;
    
    saving.value = true;
    try {
        const quoteData = {
            ticket_id: props.ticketId,
            supplier_id: supplierId.value,
            status: status,
            total_amount: totalAmount.value,
            tax_amount: taxAmount.value,
            notes: notes.value,
            valid_until: validUntil.value
        };

        let savedQuote;

        if (quote.value?.id) {
            // Update
            const { data, error } = await supabase
                .from('quotes')
                .update(quoteData)
                .eq('id', quote.value.id)
                .select()
                .single();
                
            if (error) throw error;
            savedQuote = data;
        } else {
            // Insert
            const { data, error } = await supabase
                .from('quotes')
                .insert(quoteData)
                .select()
                .single();
                
            if (error) throw error;
            savedQuote = data;
        }

        // Save Items (Delete all and re-insert for simplicity, or upsert)
        // Strategy: Delete all existing items for this quote and insert current ones
        // This handles updates, deletions and additions cleanly for this use case
        if (quote.value?.id) {
            const { error: deleteError } = await supabase
                .from('quote_items')
                .delete()
                .eq('quote_id', savedQuote.id);
            if (deleteError) throw deleteError;
        }

        const itemsToInsert = items.value.map(item => ({
            quote_id: savedQuote.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(itemsToInsert);
            
        if (itemsError) throw itemsError;

        // Update local state
        quote.value = savedQuote;
        
        toast.add({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: status === 'sent' ? 'Cotización enviada al cliente' : 'Borrador guardado', 
            life: 3000 
        });
        
        emit('quote-updated', savedQuote);
        
        // Si se envió, recargar para actualizar vista a solo lectura
        if (status === 'sent') {
            await fetchQuote();
        }

    } catch (error) {
        console.error('Error saving quote:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la cotización', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const updateStatus = async (newStatus, reason = null) => {
    saving.value = true;
    try {
        const updateData = { status: newStatus };
        if (reason) updateData.rejection_reason = reason;
        
        const { error } = await supabase
            .from('quotes')
            .update(updateData)
            .eq('id', quote.value.id);
            
        if (error) throw error;
        
        // Update local
        quote.value.status = newStatus;
        if (reason) quote.value.rejection_reason = reason;
        
        toast.add({ severity: 'success', summary: 'Actualizado', detail: `Cotización ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}`, life: 3000 });
        emit('quote-updated', quote.value);
        showRejectDialog.value = false;
    } catch (error) {
        console.error('Error updating status:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const openRejectDialog = () => {
    rejectionReason.value = '';
    showRejectDialog.value = true;
};

const confirmReject = () => {
    if (!rejectionReason.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Requerido', detail: 'Debe ingresar un motivo de rechazo', life: 3000 });
        return;
    }
    updateStatus('rejected', rejectionReason.value);
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
};
</script>

<template>
    <div class="quote-form">
        <div v-if="loading" class="flex justify-center p-4">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>

        <div v-else-if="!quote && profile?.role !== 'supplier'" class="text-center p-4 text-surface-500">
            <i class="pi pi-file-o text-4xl mb-2"></i>
            <p>No hay cotización disponible para este ticket.</p>
        </div>

        <div v-else>
            <!-- Header Status -->
            <div class="flex justify-between items-center mb-4 p-3 bg-surface-50 dark:bg-surface-800 rounded border border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-lg">Estado:</span>
                    <Tag :value="statusLabel" :severity="statusSeverity" class="text-sm px-3 py-1" />
                </div>
                <div class="text-sm text-surface-500" v-if="quote?.updated_at">
                    Última actualización: {{ new Date(quote.updated_at).toLocaleDateString() }}
                </div>
            </div>

            <!-- Read Only View (Sent/Approved/Rejected) -->
            <div v-if="!isEditable" class="mb-4">
                <DataTable :value="items" stripedRows class="p-datatable-sm">
                    <Column field="description" header="Descripción"></Column>
                    <Column field="quantity" header="Cant." class="w-20 text-center"></Column>
                    <Column field="unit_price" header="P. Unitario" class="w-32 text-right">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.unit_price) }}
                        </template>
                    </Column>
                    <Column header="Total" class="w-32 text-right">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.quantity * slotProps.data.unit_price) }}
                        </template>
                    </Column>
                </DataTable>
                
                <div class="flex justify-end mt-4">
                    <div class="w-64 space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{{ formatCurrency(subtotal) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>IVA (16%):</span>
                            <span>{{ formatCurrency(taxAmount) }}</span>
                        </div>
                        <div class="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{{ formatCurrency(totalAmount) }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="quote.notes" class="mt-4 p-3 bg-gray-50 rounded">
                    <span class="font-semibold block mb-1">Notas:</span>
                    <p class="text-sm">{{ quote.notes }}</p>
                </div>

                <div v-if="quote.status === 'rejected'" class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                    <span class="font-semibold block mb-1">Motivo de rechazo:</span>
                    <p class="text-sm">{{ quote.rejection_reason || 'Sin motivo especificado' }}</p>
                </div>
                
                <!-- Botón para re-abrir borrador si fue rechazada (Solo Supplier) -->
                <div v-if="quote.status === 'rejected' && profile?.role === 'supplier'" class="mt-4 flex justify-end">
                    <Button label="Crear Nueva Versión" icon="pi pi-refresh" severity="secondary" @click="saveQuote('draft')" />
                </div>

                <!-- Botones de Aprobación (Solo Client) -->
                <div v-if="canApprove" class="mt-6 flex justify-end gap-3 border-t pt-4">
                    <Button label="Rechazar Cotización" icon="pi pi-times" severity="danger" outlined @click="openRejectDialog" :loading="saving" />
                    <Button label="Aprobar Cotización" icon="pi pi-check" severity="success" @click="updateStatus('approved')" :loading="saving" />
                </div>
            </div>

            <!-- Editable Form (Draft) -->
            <div v-else>
                <DataTable :value="items" editMode="cell" class="p-datatable-sm mb-4">
                    <Column header="#" class="w-12 text-center">
                        <template #body="slotProps">
                            {{ slotProps.index + 1 }}
                        </template>
                    </Column>
                    <Column field="description" header="Descripción">
                        <template #body="slotProps">
                            <InputText v-model="slotProps.data.description" class="w-full p-inputtext-sm" placeholder="Descripción del servicio/producto" />
                        </template>
                    </Column>
                    <Column field="quantity" header="Cant." class="w-24">
                        <template #body="slotProps">
                            <InputNumber v-model="slotProps.data.quantity" class="w-full p-inputtext-sm" :min="0.01" :maxFractionDigits="2" showButtons buttonLayout="horizontal" :step="1" inputClass="w-full text-center" />
                        </template>
                    </Column>
                    <Column field="unit_price" header="P. Unitario" class="w-32">
                        <template #body="slotProps">
                            <InputNumber v-model="slotProps.data.unit_price" mode="currency" currency="MXN" locale="es-MX" class="w-full p-inputtext-sm" :min="0" />
                        </template>
                    </Column>
                    <Column header="Total" class="w-32 text-right">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.quantity * slotProps.data.unit_price) }}
                        </template>
                    </Column>
                    <Column class="w-12 text-center">
                        <template #body="slotProps">
                            <Button icon="pi pi-trash" text severity="danger" @click="removeItem(slotProps.index)" />
                        </template>
                    </Column>
                </DataTable>

                <Button label="Agregar Ítem" icon="pi pi-plus" text size="small" @click="addItem" class="mb-4" />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                    <div>
                        <label class="block font-medium mb-2">Notas / Condiciones</label>
                        <Textarea v-model="notes" rows="4" class="w-full" placeholder="Detalles adicionales, condiciones de pago, tiempo de entrega..." />
                    </div>
                    <div class="flex flex-col items-end">
                        <div class="w-full md:w-64 space-y-2 mb-4">
                            <div class="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>{{ formatCurrency(subtotal) }}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span>IVA (16%):</span>
                                <span>{{ formatCurrency(taxAmount) }}</span>
                            </div>
                            <div class="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>{{ formatCurrency(totalAmount) }}</span>
                            </div>
                        </div>
                        
                        <div class="flex gap-2 mt-4">
                            <Button label="Guardar Borrador" icon="pi pi-save" severity="secondary" @click="saveQuote('draft')" :loading="saving" />
                            <Button label="Enviar al Cliente" icon="pi pi-send" severity="primary" @click="saveQuote('sent')" :loading="saving" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dialogo de Rechazo -->
        <Dialog v-model:visible="showRejectDialog" header="Rechazar Cotización" :style="{ width: '400px' }" modal>
            <div class="flex flex-col gap-4">
                <p>Por favor indica el motivo del rechazo para que el proveedor pueda corregirlo.</p>
                <Textarea v-model="rejectionReason" rows="3" class="w-full" placeholder="Motivo del rechazo..." />
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="showRejectDialog = false" />
                    <Button label="Confirmar Rechazo" severity="danger" @click="confirmReject" :loading="saving" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
