<script setup>
import { ref } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import CompanyInfo from './account/CompanyInfo.vue';
import Headquarters from './account/Headquarters.vue';
import Branches from './account/Branches.vue';
import ContactPersons from './account/ContactPersons.vue';

const activeTab = ref(0);
</script>

<template>
    <div class="grid-cols-12 gap-8">
        <div class="col-12">
            <div class="card">
                <h5>Mi Cuenta</h5>
                <p class="text-500 mb-4">Gestiona la información de tu empresa, oficinas y personas de contacto</p>
                
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
                    <TabPanel header="Personas de Contacto">
                        <ContactPersons />
                    </TabPanel>
                </TabView>
            </div>
        </div>
    </div>
</template>