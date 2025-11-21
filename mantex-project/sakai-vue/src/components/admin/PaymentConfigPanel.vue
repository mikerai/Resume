<template>
    <div class="payment-config-panel">
        <div class="grid">
            <!-- Configuración General -->
            <div class="col-12">
                <div class="card">
                    <h6>⚙️ Configuración General</h6>
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="automation-enabled">
                                    <i class="pi pi-power-off mr-2"></i>
                                    Automatización Habilitada:
                                </label>
                                <InputSwitch
                                    id="automation-enabled"
                                    v-model="localConfig.auto_processing_enabled"
                                    @change="markAsChanged"
                                />
                                <small class="text-500">Habilita el procesamiento automático de pagos</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="delay-hours">
                                    <i class="pi pi-clock mr-2"></i>
                                    Horas de Retraso:
                                </label>
                                <InputNumber
                                    id="delay-hours"
                                    v-model="localConfig.payment_delay_hours"
                                    :min="1"
                                    :max="168"
                                    suffix=" horas"
                                    @input="markAsChanged"
                                />
                                <small class="text-500">Tiempo de espera después de la aprobación</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="business-hours">
                                    <i class="pi pi-calendar mr-2"></i>
                                    Solo Horario Laboral:
                                </label>
                                <InputSwitch
                                    id="business-hours"
                                    v-model="localConfig.business_hours_only"
                                    @change="markAsChanged"
                                />
                                <small class="text-500">Procesar solo en horario de 9 AM - 6 PM</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="exclude-weekends">
                                    <i class="pi pi-calendar-times mr-2"></i>
                                    Excluir Fines de Semana:
                                </label>
                                <InputSwitch
                                    id="exclude-weekends"
                                    v-model="localConfig.exclude_weekends"
                                    @change="markAsChanged"
                                />
                                <small class="text-500">No procesar en sábados y domingos</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Configuración de Montos -->
            <div class="col-12">
                <div class="card">
                    <h6>💰 Límites de Procesamiento Automático</h6>
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="min-amount">
                                    <i class="pi pi-arrow-up mr-2"></i>
                                    Monto Mínimo:
                                </label>
                                <InputNumber
                                    id="min-amount"
                                    v-model="localConfig.min_amount_auto_process"
                                    mode="currency"
                                    currency="MXN"
                                    locale="es-MX"
                                    @input="markAsChanged"
                                />
                                <small class="text-500">Monto mínimo para procesamiento automático</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="max-amount">
                                    <i class="pi pi-arrow-down mr-2"></i>
                                    Monto Máximo:
                                </label>
                                <InputNumber
                                    id="max-amount"
                                    v-model="localConfig.max_amount_auto_process"
                                    mode="currency"
                                    currency="MXN"
                                    locale="es-MX"
                                    @input="markAsChanged"
                                />
                                <small class="text-500">Monto máximo para procesamiento automático</small>
                            </div>
                        </div>

                        <div class="col-12">
                            <Message severity="info" :closable="false">
                                <div class="flex align-items-center">
                                    <i class="pi pi-info-circle mr-2"></i>
                                    <div>
                                        Los pagos fuera de este rango requerirán aprobación manual antes del procesamiento.
                                        Actualmente se procesarán automáticamente pagos entre
                                        <strong>${{ localConfig.min_amount_auto_process?.toLocaleString() || 0 }}</strong> y
                                        <strong>${{ localConfig.max_amount_auto_process?.toLocaleString() || 0 }}</strong>
                                    </div>
                                </div>
                            </Message>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Configuración de Reintentos -->
            <div class="col-12">
                <div class="card">
                    <h6>🔄 Configuración de Reintentos</h6>
                    <div class="grid">
                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label for="retry-enabled">
                                    <i class="pi pi-refresh mr-2"></i>
                                    Reintentos Habilitados:
                                </label>
                                <InputSwitch
                                    id="retry-enabled"
                                    v-model="localConfig.retry_enabled"
                                    @change="markAsChanged"
                                />
                                <small class="text-500">Habilita reintentos automáticos en caso de fallo</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label for="retry-interval">
                                    <i class="pi pi-stopwatch mr-2"></i>
                                    Intervalo de Reintento:
                                </label>
                                <InputNumber
                                    id="retry-interval"
                                    v-model="localConfig.retry_interval_hours"
                                    :min="1"
                                    :max="24"
                                    suffix=" horas"
                                    :disabled="!localConfig.retry_enabled"
                                    @input="markAsChanged"
                                />
                                <small class="text-500">Tiempo entre reintentos</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label for="max-retries">
                                    <i class="pi pi-sort-numeric-up mr-2"></i>
                                    Máximo de Reintentos:
                                </label>
                                <InputNumber
                                    id="max-retries"
                                    v-model="localConfig.max_retry_attempts"
                                    :min="1"
                                    :max="10"
                                    suffix=" intentos"
                                    :disabled="!localConfig.retry_enabled"
                                    @input="markAsChanged"
                                />
                                <small class="text-500">Número máximo de reintentos</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Configuración de Notificaciones -->
            <div class="col-12">
                <div class="card">
                    <h6>🔔 Configuración de Notificaciones</h6>
                    <div class="grid">
                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label for="notify-before">
                                    <i class="pi pi-bell mr-2"></i>
                                    Notificar Antes:
                                </label>
                                <InputNumber
                                    id="notify-before"
                                    v-model="localConfig.notify_before_hours"
                                    :min="0"
                                    :max="72"
                                    suffix=" horas"
                                    @input="markAsChanged"
                                />
                                <small class="text-500">Horas antes del pago para notificar</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label for="notify-completion">
                                    <i class="pi pi-check-circle mr-2"></i>
                                    Notificar Completado:
                                </label>
                                <InputSwitch
                                    id="notify-completion"
                                    v-model="localConfig.notify_after_completion"
                                    @change="markAsChanged"
                                />
                                <small class="text-500">Notificar cuando se complete el pago</small>
                            </div>
                        </div>

                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label for="notify-failure">
                                    <i class="pi pi-exclamation-triangle mr-2"></i>
                                    Notificar Fallos:
                                </label>
                                <InputSwitch
                                    id="notify-failure"
                                    v-model="localConfig.notify_on_failure"
                                    @change="markAsChanged"
                                />
                                <small class="text-500">Notificar cuando falle un pago</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Simulador de Configuración -->
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <h6 class="m-0">🧪 Simulador de Configuración</h6>
                        <Button
                            label="Probar Configuración"
                            icon="pi pi-play"
                            @click="testConfiguration"
                            class="p-button-info p-button-sm"
                        />
                    </div>

                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="test-amount">Monto de Prueba:</label>
                                <InputNumber
                                    id="test-amount"
                                    v-model="testConfig.amount"
                                    mode="currency"
                                    currency="MXN"
                                    locale="es-MX"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="field">
                                <label for="test-approval-date">Fecha de Aprobación:</label>
                                <Calendar
                                    id="test-approval-date"
                                    v-model="testConfig.approvalDate"
                                    :showTime="true"
                                    dateFormat="dd/mm/yy"
                                    :showButtonBar="true"
                                />
                            </div>
                        </div>
                        <div class="col-12">
                            <div v-if="simulationResult" class="p-3 bg-blue-50 border-round">
                                <div class="font-medium text-blue-800 mb-2">Resultado de la Simulación:</div>
                                <ul class="text-blue-700 m-0">
                                    <li>Fecha de pago programada: <strong>{{ simulationResult.scheduledDate }}</strong></li>
                                    <li>Procesamiento automático: <strong>{{ simulationResult.autoProcess ? 'SÍ' : 'NO' }}</strong></li>
                                    <li>Notificación previa: <strong>{{ simulationResult.notifyBefore }}</strong></li>
                                    <li>Días hábiles considerados: <strong>{{ simulationResult.businessDays ? 'SÍ' : 'NO' }}</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="col-12">
                <div class="flex justify-content-between">
                    <div class="flex gap-2">
                        <Button
                            label="Restaurar Valores Originales"
                            icon="pi pi-undo"
                            @click="resetConfig"
                            class="p-button-secondary"
                            :disabled="!hasChanges"
                        />
                        <Button
                            label="Valores por Defecto"
                            icon="pi pi-refresh"
                            @click="setDefaults"
                            class="p-button-outlined"
                        />
                    </div>

                    <div class="flex gap-2">
                        <Button
                            label="Validar Configuración"
                            icon="pi pi-check-circle"
                            @click="validateConfig"
                            class="p-button-info"
                        />
                        <Button
                            label="Guardar Cambios"
                            icon="pi pi-save"
                            @click="saveConfig"
                            :disabled="!hasChanges || !isConfigValid"
                            class="p-button-success"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useSupabaseClient } from '@/composables/useSupabaseClient';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    config: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['config-updated']);

const supabase = useSupabaseClient();
const toast = useToast();

// Estados reactivos
const localConfig = ref({ ...props.config });
const originalConfig = ref({ ...props.config });
const hasChanges = ref(false);
const simulationResult = ref(null);

// Configuración de prueba
const testConfig = ref({
    amount: 25000,
    approvalDate: new Date()
});

// Computadas
const isConfigValid = computed(() => {
    return localConfig.value.payment_delay_hours > 0 &&
           localConfig.value.min_amount_auto_process >= 0 &&
           localConfig.value.max_amount_auto_process > localConfig.value.min_amount_auto_process &&
           localConfig.value.max_retry_attempts > 0 &&
           localConfig.value.notify_before_hours >= 0;
});

// Watchers
watch(() => props.config, (newConfig) => {
    localConfig.value = { ...newConfig };
    originalConfig.value = { ...newConfig };
    hasChanges.value = false;
}, { deep: true });

// Métodos
const markAsChanged = () => {
    hasChanges.value = true;
};

const resetConfig = () => {
    localConfig.value = { ...originalConfig.value };
    hasChanges.value = false;
    simulationResult.value = null;
};

const setDefaults = () => {
    localConfig.value = {
        payment_delay_hours: 48,
        business_hours_only: true,
        exclude_weekends: true,
        auto_processing_enabled: true,
        min_amount_auto_process: 0,
        max_amount_auto_process: 50000,
        retry_enabled: true,
        retry_interval_hours: 4,
        max_retry_attempts: 3,
        notify_before_hours: 24,
        notify_after_completion: true,
        notify_on_failure: true
    };
    markAsChanged();
};

const validateConfig = () => {
    const errors = [];

    if (localConfig.value.payment_delay_hours < 1) {
        errors.push('Las horas de retraso deben ser al menos 1');
    }

    if (localConfig.value.max_amount_auto_process <= localConfig.value.min_amount_auto_process) {
        errors.push('El monto máximo debe ser mayor al mínimo');
    }

    if (localConfig.value.retry_enabled && localConfig.value.max_retry_attempts < 1) {
        errors.push('Debe haber al menos 1 reintento si están habilitados');
    }

    if (errors.length > 0) {
        toast.add({
            severity: 'error',
            summary: 'Configuración Inválida',
            detail: errors.join('. '),
            life: 5000
        });
        return false;
    }

    toast.add({
        severity: 'success',
        summary: 'Configuración Válida',
        detail: 'La configuración es correcta',
        life: 3000
    });
    return true;
};

const testConfiguration = () => {
    const config = localConfig.value;
    const approvalDate = testConfig.value.approvalDate;
    const amount = testConfig.value.amount;

    // Simular cálculo de fecha de pago
    let scheduledDate = new Date(approvalDate);
    scheduledDate.setHours(scheduledDate.getHours() + config.payment_delay_hours);

    // Ajustar por horario laboral y fines de semana
    if (config.business_hours_only || config.exclude_weekends) {
        // Simulación simplificada - en la base de datos se haría el cálculo real
        if (config.exclude_weekends) {
            while (scheduledDate.getDay() === 0 || scheduledDate.getDay() === 6) {
                scheduledDate.setDate(scheduledDate.getDate() + 1);
            }
        }

        if (config.business_hours_only) {
            const hour = scheduledDate.getHours();
            if (hour < 9) {
                scheduledDate.setHours(9, 0, 0, 0);
            } else if (hour >= 18) {
                scheduledDate.setDate(scheduledDate.getDate() + 1);
                scheduledDate.setHours(9, 0, 0, 0);
            }
        }
    }

    simulationResult.value = {
        scheduledDate: scheduledDate.toLocaleString('es-MX'),
        autoProcess: config.auto_processing_enabled &&
                    amount >= config.min_amount_auto_process &&
                    amount <= config.max_amount_auto_process,
        notifyBefore: config.notify_before_hours > 0 ?
                     `${config.notify_before_hours} horas antes` : 'No',
        businessDays: config.business_hours_only || config.exclude_weekends
    };
};

const saveConfig = async () => {
    if (!validateConfig()) return;

    try {
        let configToSave;

        if (props.config.id) {
            // Actualizar configuración existente
            const { error } = await supabase
                .from('payment_automation_config')
                .update({
                    ...localConfig.value,
                    updated_at: new Date().toISOString()
                })
                .eq('id', props.config.id);

            if (error) throw error;
        } else {
            // Desactivar configuraciones anteriores
            await supabase
                .from('payment_automation_config')
                .update({ is_active: false });

            // Crear nueva configuración
            const { data, error } = await supabase
                .from('payment_automation_config')
                .insert([{
                    ...localConfig.value,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;
            configToSave = data;
        }

        originalConfig.value = { ...localConfig.value };
        hasChanges.value = false;

        emit('config-updated', configToSave || localConfig.value);

        toast.add({
            severity: 'success',
            summary: 'Configuración Guardada',
            detail: 'La configuración de automatización se ha guardado correctamente',
            life: 3000
        });

    } catch (error) {
        console.error('Error saving config:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar la configuración',
            life: 4000
        });
    }
};
</script>

<style scoped>
.field label {
    font-weight: 500;
}

.field small {
    display: block;
    margin-top: 0.25rem;
}

.p-inputswitch {
    margin-left: 0.5rem;
}
</style>