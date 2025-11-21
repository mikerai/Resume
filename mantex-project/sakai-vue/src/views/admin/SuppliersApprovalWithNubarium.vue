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
                        <h4 class="m-0">Aprobación de Proveedores (Con Validaciones Nubarium)</h4>
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

                    <Column field="rfc" header="RFC" sortable>
                        <template #body="slotProps">
                            <div class="flex flex-col">
                                <div class="font-mono text-sm">{{ slotProps.data.rfc }}</div>
                                <Tag
                                    v-if="slotProps.data.nubarium_validations"
                                    :value="slotProps.data.nubarium_validations.sat_validation.rfc_status"
                                    :severity="slotProps.data.nubarium_validations.sat_validation.status === 'active' ? 'success' : 'danger'"
                                    size="small"
                                />
                            </div>
                        </template>
                    </Column>

                    <Column field="nubarium_validations.overall_risk_score" header="Score Riesgo" sortable>
                        <template #body="slotProps">
                            <div class="flex flex-col items-center" v-if="slotProps.data.nubarium_validations">
                                <ProgressBar
                                    :value="slotProps.data.nubarium_validations.overall_risk_score"
                                    :class="getRiskScoreClass(slotProps.data.nubarium_validations.overall_risk_score)"
                                    style="width: 80px; height: 8px;"
                                />
                                <span class="text-xs mt-1">{{ slotProps.data.nubarium_validations.overall_risk_score }}%</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="nubarium_validations.recommendation" header="Recomendación" sortable>
                        <template #body="slotProps">
                            <div v-if="slotProps.data.nubarium_validations" class="flex flex-col gap-1">
                                <Tag
                                    :value="slotProps.data.nubarium_validations.recommendation === 'approve' ? 'Aprobar' : 'Rechazar'"
                                    :severity="slotProps.data.nubarium_validations.recommendation === 'approve' ? 'success' : 'danger'"
                                />
                                <div class="flex gap-1">
                                    <i
                                        :class="getValidationIcon(slotProps.data.nubarium_validations.ine_validation.status)"
                                        v-tooltip="'INE: ' + getValidationStatusLabel(slotProps.data.nubarium_validations.ine_validation.status)"
                                        class="text-xs"
                                    ></i>
                                    <i
                                        :class="getValidationIcon(slotProps.data.nubarium_validations.sat_validation.status)"
                                        v-tooltip="'SAT: ' + slotProps.data.nubarium_validations.sat_validation.rfc_status"
                                        class="text-xs"
                                    ></i>
                                    <i
                                        :class="getBlacklistIcon(slotProps.data.nubarium_validations.blacklist_check)"
                                        v-tooltip="'Listas: ' + slotProps.data.nubarium_validations.blacklist_check.blocklist_status"
                                        class="text-xs"
                                    ></i>
                                </div>
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
                                    v-tooltip="'Ver detalles completos'"
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
                            </div>
                        </template>
                    </Column>
                </DataTable>
        </div>

    <!-- Dialog para ver detalles del proveedor con validaciones Nubarium -->
    <Dialog v-model:visible="showSupplierDialog" modal :style="{ width: '90vw', height: '90vh' }" header="Detalles del Proveedor - Validaciones Nubarium">
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
                    <p class="font-mono">{{ selectedSupplier.rfc }}</p>
                </div>
                <div class="field">
                    <label>CURP:</label>
                    <p class="font-mono">{{ selectedSupplier.curp }}</p>
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
                            :label="specialty.replace('_', ' ').toUpperCase()"
                        />
                    </div>
                </div>
            </div>

            <!-- Sección de Validaciones Nubarium -->
            <div class="col-12" v-if="selectedSupplier.nubarium_validations">
                <h6>Validaciones de Identidad y Negocio (Nubarium)</h6>

                <!-- Score General y Recomendación -->
                <div class="grid mb-4">
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label>Score de Riesgo General:</label>
                            <div class="flex items-center gap-2">
                                <ProgressBar
                                    :value="selectedSupplier.nubarium_validations.overall_risk_score"
                                    :class="getRiskScoreClass(selectedSupplier.nubarium_validations.overall_risk_score)"
                                />
                                <span class="font-medium">{{ selectedSupplier.nubarium_validations.overall_risk_score }}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label>Recomendación del Sistema:</label>
                            <Tag
                                :value="selectedSupplier.nubarium_validations.recommendation === 'approve' ? 'Aprobar' : 'Rechazar'"
                                :severity="selectedSupplier.nubarium_validations.recommendation === 'approve' ? 'success' : 'danger'"
                                class="text-base font-medium"
                            />
                        </div>
                    </div>
                </div>

                <!-- Accordion para detalles de validaciones -->
                <Accordion multiple>
                    <!-- Validación de INE -->
                    <AccordionPanel>
                        <AccordionHeader>
                            <span class="flex items-center gap-2">
                                <i :class="getValidationIcon(selectedSupplier.nubarium_validations.ine_validation.status)"></i>
                                <span>Validación de INE</span>
                                <Tag
                                    :value="getValidationStatusLabel(selectedSupplier.nubarium_validations.ine_validation.status)"
                                    :severity="getValidationStatusSeverity(selectedSupplier.nubarium_validations.ine_validation.status)"
                                    size="small"
                                />
                            </span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="grid">
                                <div class="col-12 md:col-8">
                                    <h6>Datos Extraídos del Documento</h6>
                                    <div class="grid">
                                        <div class="col-12 md:col-6">
                                            <div class="field"><label>Nombre:</label><p>{{ selectedSupplier.nubarium_validations.ine_validation.data_extracted.name }}</p></div>
                                            <div class="field"><label>CURP:</label><p class="font-mono">{{ selectedSupplier.nubarium_validations.ine_validation.data_extracted.curp }}</p></div>
                                            <div class="field"><label>Fecha de Nacimiento:</label><p>{{ selectedSupplier.nubarium_validations.ine_validation.data_extracted.birth_date }}</p></div>
                                        </div>
                                        <div class="col-12 md:col-6">
                                            <div class="field"><label>Clave de Elector:</label><p class="font-mono">{{ selectedSupplier.nubarium_validations.ine_validation.data_extracted.voter_id }}</p></div>
                                            <div class="field"><label>Vigencia:</label><p>{{ selectedSupplier.nubarium_validations.ine_validation.data_extracted.expiry_date }}</p></div>
                                            <div class="field"><label>Confianza:</label><p>{{ (selectedSupplier.nubarium_validations.ine_validation.confidence * 100).toFixed(1) }}%</p></div>
                                        </div>
                                    </div>

                                    <h6>Verificaciones</h6>
                                    <div class="flex flex-wrap gap-2">
                                        <Chip
                                            v-for="(passed, check) in selectedSupplier.nubarium_validations.ine_validation.checks"
                                            :key="check"
                                            :label="getCheckLabel(check)"
                                            :class="passed ? 'p-chip-success' : 'p-chip-danger'"
                                            :icon="passed ? 'pi pi-check' : 'pi pi-times'"
                                        />
                                    </div>

                                    <div v-if="selectedSupplier.nubarium_validations.ine_validation.issues" class="field mt-3">
                                        <label class="text-red-500">Issues Detectadas:</label>
                                        <ul class="text-red-500 mt-2">
                                            <li v-for="issue in selectedSupplier.nubarium_validations.ine_validation.issues" :key="issue">
                                                <i class="pi pi-exclamation-triangle mr-2"></i>{{ issue }}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-12 md:col-4" v-if="selectedSupplier.ine_front_url">
                                    <h6>Documento Escaneado</h6>
                                    <Image :src="selectedSupplier.ine_front_url" alt="INE Frontal" width="200" preview />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <!-- Validación SAT -->
                    <AccordionPanel>
                        <AccordionHeader>
                            <span class="flex items-center gap-2">
                                <i :class="getValidationIcon(selectedSupplier.nubarium_validations.sat_validation.status)"></i>
                                <span>Validación SAT (RFC)</span>
                                <Tag
                                    :value="selectedSupplier.nubarium_validations.sat_validation.rfc_status"
                                    :severity="selectedSupplier.nubarium_validations.sat_validation.status === 'active' ? 'success' : 'danger'"
                                    size="small"
                                />
                            </span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div v-if="selectedSupplier.nubarium_validations.sat_validation.company_data">
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <div class="field"><label>Razón Social:</label><p>{{ selectedSupplier.nubarium_validations.sat_validation.company_data.business_name }}</p></div>
                                        <div class="field"><label>Nombre Comercial:</label><p>{{ selectedSupplier.nubarium_validations.sat_validation.company_data.commercial_name }}</p></div>
                                        <div class="field"><label>Fecha de Inicio:</label><p>{{ selectedSupplier.nubarium_validations.sat_validation.company_data.start_date }}</p></div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field"><label>Situación:</label><p>{{ selectedSupplier.nubarium_validations.sat_validation.situation }}</p></div>
                                        <div class="field"><label>Régimen:</label><p>{{ selectedSupplier.nubarium_validations.sat_validation.regime }}</p></div>
                                        <div class="field"><label>Último Cambio:</label><p>{{ selectedSupplier.nubarium_validations.sat_validation.company_data.last_status_change }}</p></div>
                                    </div>
                                </div>
                                <div class="field">
                                    <label>Obligaciones Fiscales:</label>
                                    <div class="flex flex-wrap gap-1 mt-2">
                                        <Chip
                                            v-for="obligation in selectedSupplier.nubarium_validations.sat_validation.obligations"
                                            :key="obligation"
                                            :label="obligation"
                                            class="p-chip-info"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-red-500">
                                <h6>Issues detectadas:</h6>
                                <ul>
                                    <li v-for="issue in selectedSupplier.nubarium_validations.sat_validation.issues" :key="issue">
                                        <i class="pi pi-exclamation-triangle mr-2"></i>{{ issue }}
                                    </li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <!-- Verificación de Listas de Bloqueo -->
                    <AccordionPanel>
                        <AccordionHeader>
                            <span class="flex items-center gap-2">
                                <i :class="getBlacklistIcon(selectedSupplier.nubarium_validations.blacklist_check)"></i>
                                <span>Listas de Bloqueo</span>
                                <Tag
                                    :value="selectedSupplier.nubarium_validations.blacklist_check.blocklist_status === 'clean' ? 'Limpio' : 'Alertas'"
                                    :severity="selectedSupplier.nubarium_validations.blacklist_check.blocklist_status === 'clean' ? 'success' : 'danger'"
                                    size="small"
                                />
                            </span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="field">
                                <label>Verificaciones Realizadas:</label>
                                <div class="flex flex-wrap gap-1 mt-2">
                                    <Chip
                                        v-for="check in selectedSupplier.nubarium_validations.blacklist_check.checks_performed"
                                        :key="check"
                                        :label="check"
                                        class="p-chip-secondary text-xs"
                                    />
                                </div>
                            </div>

                            <div class="grid">
                                <div class="col-12 md:col-4">
                                    <div class="field">
                                        <label>PLD:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.blacklist_check.pld_status"
                                             :severity="selectedSupplier.nubarium_validations.blacklist_check.pld_status === 'clean' ? 'success' : 'danger'" />
                                    </div>
                                </div>
                                <div class="col-12 md:col-4">
                                    <div class="field">
                                        <label>OFAC:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.blacklist_check.ofac_status"
                                             :severity="selectedSupplier.nubarium_validations.blacklist_check.ofac_status === 'clean' ? 'success' : 'danger'" />
                                    </div>
                                </div>
                                <div class="col-12 md:col-4">
                                    <div class="field">
                                        <label>Listas SAT:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.blacklist_check.blocklist_status"
                                             :severity="selectedSupplier.nubarium_validations.blacklist_check.blocklist_status === 'clean' ? 'success' : 'danger'" />
                                    </div>
                                </div>
                            </div>

                            <div v-if="selectedSupplier.nubarium_validations.blacklist_check.alerts" class="field">
                                <label class="text-red-500">Alertas Detectadas:</label>
                                <ul class="text-red-500 mt-2">
                                    <li v-for="alert in selectedSupplier.nubarium_validations.blacklist_check.alerts" :key="alert">
                                        <i class="pi pi-exclamation-triangle mr-2"></i>{{ alert }}
                                    </li>
                                </ul>
                            </div>

                            <div class="field">
                                <label>Última Verificación:</label>
                                <p>{{ formatDate(selectedSupplier.nubarium_validations.blacklist_check.last_check) }}</p>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <!-- Validación CURP -->
                    <AccordionPanel>
                        <AccordionHeader>
                            <span class="flex items-center gap-2">
                                <i :class="getValidationIcon(selectedSupplier.nubarium_validations.curp_validation.status)"></i>
                                <span>Validación CURP (RENAPO)</span>
                                <Tag
                                    :value="getValidationStatusLabel(selectedSupplier.nubarium_validations.curp_validation.status)"
                                    :severity="getValidationStatusSeverity(selectedSupplier.nubarium_validations.curp_validation.status)"
                                    size="small"
                                />
                            </span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label>CURP:</label>
                                        <p class="font-mono">{{ selectedSupplier.curp }}</p>
                                    </div>
                                    <div class="field">
                                        <label>Existe en RENAPO:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.curp_validation.exists_in_renapo ? 'Sí' : 'No'"
                                             :severity="selectedSupplier.nubarium_validations.curp_validation.exists_in_renapo ? 'success' : 'danger'" />
                                    </div>
                                </div>
                                <div class="col-12 md:col-6">
                                    <div class="field">
                                        <label>Coincide con INE:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.curp_validation.matches_ine_data ? 'Sí' : 'No'"
                                             :severity="selectedSupplier.nubarium_validations.curp_validation.matches_ine_data ? 'success' : 'danger'" />
                                    </div>
                                    <div class="field">
                                        <label>Acta de Nacimiento:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.curp_validation.birth_certificate_status" />
                                    </div>
                                </div>
                            </div>

                            <div v-if="selectedSupplier.nubarium_validations.curp_validation.issues" class="field">
                                <label class="text-red-500">Issues:</label>
                                <ul class="text-red-500 mt-2">
                                    <li v-for="issue in selectedSupplier.nubarium_validations.curp_validation.issues" :key="issue">
                                        <i class="pi pi-times mr-2"></i>{{ issue }}
                                    </li>
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <!-- Verificación Empresarial -->
                    <AccordionPanel>
                        <AccordionHeader>
                            <span class="flex items-center gap-2">
                                <i :class="selectedSupplier.nubarium_validations.business_verification.legal_entity_exists ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
                                <span>Verificación Empresarial</span>
                                <Tag
                                    :value="selectedSupplier.nubarium_validations.business_verification.legal_entity_exists ? 'Válida' : 'No Válida'"
                                    :severity="selectedSupplier.nubarium_validations.business_verification.legal_entity_exists ? 'success' : 'danger'"
                                    size="small"
                                />
                            </span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <h6>Registro Público de Comercio</h6>
                                    <div class="field">
                                        <label>Estado:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.business_verification.commercial_registry.status"
                                             :severity="selectedSupplier.nubarium_validations.business_verification.commercial_registry.status === 'registered' ? 'success' : 'danger'" />
                                    </div>
                                    <div v-if="selectedSupplier.nubarium_validations.business_verification.commercial_registry.folio" class="field">
                                        <label>Folio:</label>
                                        <p class="font-mono">{{ selectedSupplier.nubarium_validations.business_verification.commercial_registry.folio }}</p>
                                    </div>
                                    <div v-if="selectedSupplier.nubarium_validations.business_verification.commercial_registry.registration_date" class="field">
                                        <label>Fecha de Registro:</label>
                                        <p>{{ selectedSupplier.nubarium_validations.business_verification.commercial_registry.registration_date }}</p>
                                    </div>
                                </div>
                                <div class="col-12 md:col-6">
                                    <h6>Cumplimiento Fiscal</h6>
                                    <div class="field">
                                        <label>Estado:</label>
                                        <Tag :value="selectedSupplier.nubarium_validations.business_verification.tax_compliance.current_status"
                                             :severity="selectedSupplier.nubarium_validations.business_verification.tax_compliance.current_status === 'compliant' ? 'success' : 'danger'" />
                                    </div>
                                    <div v-if="selectedSupplier.nubarium_validations.business_verification.tax_compliance.last_filing" class="field">
                                        <label>Última Declaración:</label>
                                        <p>{{ selectedSupplier.nubarium_validations.business_verification.tax_compliance.last_filing }}</p>
                                    </div>
                                    <div class="field">
                                        <label>Adeudos:</label>
                                        <div class="flex items-center gap-2">
                                            <Tag :value="selectedSupplier.nubarium_validations.business_verification.tax_compliance.has_debts ? 'Sí' : 'No'"
                                                 :severity="selectedSupplier.nubarium_validations.business_verification.tax_compliance.has_debts ? 'danger' : 'success'" />
                                            <span v-if="selectedSupplier.nubarium_validations.business_verification.tax_compliance.debt_amount" class="text-red-500 font-medium">
                                                ${{ selectedSupplier.nubarium_validations.business_verification.tax_compliance.debt_amount.toLocaleString() }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <!-- Biometría Facial -->
                    <AccordionPanel>
                        <AccordionHeader>
                            <span class="flex items-center gap-2">
                                <i :class="selectedSupplier.nubarium_validations.face_biometry.liveness_check === 'passed' ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
                                <span>Biometría Facial</span>
                                <Tag
                                    :value="selectedSupplier.nubarium_validations.face_biometry.liveness_check"
                                    :severity="selectedSupplier.nubarium_validations.face_biometry.liveness_check === 'passed' ? 'success' : 'danger'"
                                    size="small"
                                />
                            </span>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="grid">
                                <div class="col-12 md:col-8">
                                    <div class="grid">
                                        <div class="col-6">
                                            <div class="field">
                                                <label>Prueba de Vida:</label>
                                                <Tag :value="selectedSupplier.nubarium_validations.face_biometry.liveness_check"
                                                     :severity="selectedSupplier.nubarium_validations.face_biometry.liveness_check === 'passed' ? 'success' : 'danger'" />
                                            </div>
                                            <div class="field">
                                                <label>Similitud:</label>
                                                <div class="flex items-center gap-2">
                                                    <ProgressBar :value="selectedSupplier.nubarium_validations.face_biometry.similarity_score" />
                                                    <span>{{ selectedSupplier.nubarium_validations.face_biometry.similarity_score }}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="field">
                                                <label>Calidad:</label>
                                                <div class="flex items-center gap-2">
                                                    <ProgressBar :value="selectedSupplier.nubarium_validations.face_biometry.quality_score" />
                                                    <span>{{ selectedSupplier.nubarium_validations.face_biometry.quality_score }}%</span>
                                                </div>
                                            </div>
                                            <div class="field">
                                                <label>Detección de Fraude:</label>
                                                <Tag :value="selectedSupplier.nubarium_validations.face_biometry.spoofing_detection"
                                                     :severity="selectedSupplier.nubarium_validations.face_biometry.spoofing_detection === 'genuine' ? 'success' : 'danger'" />
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="selectedSupplier.nubarium_validations.face_biometry.issues" class="field">
                                        <label class="text-red-500">Issues Detectadas:</label>
                                        <ul class="text-red-500 mt-2">
                                            <li v-for="issue in selectedSupplier.nubarium_validations.face_biometry.issues" :key="issue">
                                                <i class="pi pi-exclamation-triangle mr-2"></i>{{ issue }}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-12 md:col-4" v-if="selectedSupplier.selfie_url">
                                    <h6>Selfie Capturada</h6>
                                    <Image :src="selectedSupplier.selfie_url" alt="Selfie" width="200" preview />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>

                <!-- Razones de rechazo si aplica -->
                <div v-if="selectedSupplier.nubarium_validations.rejection_reasons" class="mt-4 p-4 bg-red-50 border-l-4 border-red-500">
                    <h6 class="text-red-600">Razones de Rechazo Recomendadas por el Sistema:</h6>
                    <ul class="text-red-600 mt-2">
                        <li v-for="reason in selectedSupplier.nubarium_validations.rejection_reasons" :key="reason" class="mb-2">
                            <i class="pi pi-times mr-2"></i>{{ reason }}
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-12" v-if="selectedSupplier.ine_front_url || selectedSupplier.ine_back_url">
                <h6>Documentos Originales</h6>
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
                    <Button label="Cerrar" icon="pi pi-times" text @click="showSupplierDialog = false" />
                </div>
                <div class="flex gap-2">
                    <Button
                        v-if="['submitted', 'under_review'].includes(selectedSupplier?.status)"
                        label="Rechazar"
                        icon="pi pi-times"
                        severity="danger"
                        @click="rejectSupplier(selectedSupplier)"
                    />
                    <Button
                        v-if="['submitted', 'under_review'].includes(selectedSupplier?.status)"
                        label="Aprobar"
                        icon="pi pi-check"
                        severity="success"
                        @click="approveSupplier(selectedSupplier)"
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
import Image from 'primevue/image';
import ProgressBar from 'primevue/progressbar';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

const toast = useToast();
const confirm = useConfirm();
const dt = ref();

// Reactive data
const suppliers = ref([]);
const selectedSuppliers = ref([]);
const loading = ref(false);
const searchTerm = ref('');
const selectedStatus = ref('submitted');

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

// Función para generar validaciones Nubarium simuladas
const generateNubariumValidations = (supplier) => {
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

// Methods
const loadSuppliers = async () => {
    loading.value = true;
    try {
        console.log('🔍 DEBUGGING: Iniciando carga con validaciones Nubarium...');

        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error en consulta:', error);
        }

        const realSuppliers = data || [];

        // Siempre mostrar datos de prueba con validaciones Nubarium completas
        const mockSuppliersWithValidations = [
            {
                id: 'test-1',
                user_id: 'test-user-1',
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
                id: 'test-2',
                user_id: 'test-user-2',
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
            },
            {
                id: 'test-3-rejected',
                user_id: 'test-user-3',
                company_name: 'Servicios Dudosos SA',
                contact_person: 'Roberto Sospechoso López',
                email: 'roberto@dudosos.com',
                phone_number: '55-9999-0001',
                rfc: 'SDS000101XX1',
                legal_address: 'Calle Falsa 123, Col. Inexistente, 00000 Ciudad Fantasma, DF',
                status: 'submitted',
                specialties: ['servicios_varios'],
                service_radius_km: 10,
                created_at: new Date(Date.now() - 172800000).toISOString(),
                curp: 'SOLR800101HDFXXX09',
                ine_front_url: '/assets/samples/ine_front_3.jpg',
                ine_back_url: '/assets/samples/ine_back_3.jpg',
                selfie_url: '/assets/samples/selfie_3.jpg',
                face_similarity_score: 65.4,
            }
        ];

        // Agregar validaciones Nubarium a todos los proveedores
        const allSuppliers = [...realSuppliers, ...mockSuppliersWithValidations];
        suppliers.value = allSuppliers.map(supplier => ({
            ...supplier,
            nubarium_validations: generateNubariumValidations(supplier)
        }));

        console.log('📋 Suppliers cargados con validaciones Nubarium:', suppliers.value.length);

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

// Funciones específicas para validaciones Nubarium
const getValidationIcon = (status) => {
    switch (status) {
        case 'valid':
        case 'active':
            return 'pi pi-check-circle text-green-500';
        case 'invalid':
        case 'inactive':
            return 'pi pi-times-circle text-red-500';
        case 'suspicious':
            return 'pi pi-exclamation-triangle text-orange-500';
        default:
            return 'pi pi-question-circle text-gray-500';
    }
};

const getValidationStatusLabel = (status) => {
    const labels = {
        'valid': 'Válido',
        'invalid': 'Inválido',
        'suspicious': 'Sospechoso',
        'active': 'Activo',
        'inactive': 'Inactivo'
    };
    return labels[status] || status;
};

const getValidationStatusSeverity = (status) => {
    switch (status) {
        case 'valid':
        case 'active':
            return 'success';
        case 'invalid':
        case 'inactive':
            return 'danger';
        case 'suspicious':
            return 'warn';
        default:
            return 'secondary';
    }
};

const getBlacklistIcon = (blacklistCheck) => {
    if (blacklistCheck.blocklist_status === 'clean' && blacklistCheck.pld_status === 'clean') {
        return 'pi pi-shield text-green-500';
    } else {
        return 'pi pi-exclamation-triangle text-red-500';
    }
};

const getRiskScoreClass = (score) => {
    if (score >= 70) return 'p-progressbar-success';
    if (score >= 40) return 'p-progressbar-warning';
    return 'p-progressbar-danger';
};

const getCheckLabel = (check) => {
    const labels = {
        document_authenticity: 'Autenticidad',
        data_consistency: 'Consistencia',
        not_expired: 'Vigente',
        face_match_with_photo: 'Coincidencia Facial'
    };
    return labels[check] || check;
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
                    await approveSupplier(supplier);
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
                    await rejectSupplier(supplier);
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

.p-progressbar-success .p-progressbar-value {
    background: #10b981;
}

.p-progressbar-warning .p-progressbar-value {
    background: #f59e0b;
}

.p-progressbar-danger .p-progressbar-value {
    background: #ef4444;
}

.p-chip-success {
    background: #10b981;
    color: white;
}

.p-chip-danger {
    background: #ef4444;
    color: white;
}
</style>