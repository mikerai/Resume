<script setup>
import { ref } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import CompanyInfo from './account/CompanyInfo.vue';
import Headquarters from './account/Headquarters.vue';
import Branches from './account/Branches.vue';
import Technicians from './account/Technicians.vue';

const activeTab = ref(0);
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <div class="card">
                <h5 class="mb-2">Mi Empresa</h5>
                <p class="text-sm text-muted-color mb-4">Gestiona la información de tu empresa, oficinas y equipo técnico</p>
                
                <TabView v-model:activeIndex="activeTab">
                    <TabPanel header="Información de Empresa">
                        <CompanyInfo />
                    </TabPanel>
                    <TabPanel header="Oficina Central">
                        <Headquarters />
                    </TabPanel>
                    <TabPanel header="Sucursales">
                        <Branches />
                    </TabPanel>
                    <TabPanel header="Técnicos">
                        <Technicians />
                    </TabPanel>
                </TabView>
            </div>
        </div>
    </div>
</template>