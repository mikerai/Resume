<template>
    <div id="hero" class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden">
        <div class="mx-6 md:mx-20 mt-0 md:mt-6">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6 p-6 text-center md:text-left flex items-center intro">
                    <section>
                        <span class="block text-6xl font-bold mb-2 text-gray-900">Conecta con los Mejores Proveedores de Mantenimiento</span>
                        <div class="text-xl text-gray-700 line-height-3 mt-4 mb-4">
                            Gestiona, cotiza y paga servicios de mantenimiento en un solo lugar. Ahorra hasta 30% en costos operativos.
                        </div>
                        <div class="flex gap-3 mt-6 justify-center md:justify-start flex-wrap">
                            <Button label="Comenzar Gratis" as="router-link" to="/signup" rounded class="!text-xl !px-8 font-bold"></Button>
                            <Button label="Ver Demo" as="router-link" to="/signup" rounded outlined class="!text-xl !px-8"></Button>
                        </div>
                    </section>
                </div>
                <div class="col-span-12 md:col-span-6 flex justify-center md:justify-end">
                    <img src="/demo/images/landing/screen-1.png" alt="Dashboard de Mantex" class="w-full md:w-auto" style="max-height: 500px;" />
                </div>
            </div>
        </div>
    </div>
</template>
