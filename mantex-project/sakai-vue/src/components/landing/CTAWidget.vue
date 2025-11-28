<template>
    <div id="cta-final" class="py-20 px-6 lg:px-20 mx-0 lg:mx-20 mt-20" style="background: linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/demo/images/landing/hvac_hero.jpg'); background-size: cover; background-position: center; border-radius: 20px;">
        <div class="text-center">
            <div class="text-white font-bold mb-4 text-5xl">Comienza a Transformar tu Negocio Hoy</div>
            <p class="text-white text-2xl mb-8 leading-normal" style="max-width: 800px; margin: 0 auto;">
                Únete a cientos de empresas que ya están ahorrando tiempo y dinero con Mantex
            </p>
            <div class="flex gap-4 justify-center flex-wrap">
                <Button label="Comenzar Gratis" as="router-link" to="/signup" rounded size="large" class="!text-xl !px-10 !py-4 font-bold"></Button>
                <Button label="Hablar con Ventas" as="router-link" to="/signup" rounded outlined size="large" class="!text-xl !px-10 !py-4 !text-white !border-white"></Button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Ensure button text is visible on dark background */
:deep(.p-button-outlined) {
    background-color: transparent !important;
}

:deep(.p-button-outlined:hover) {
    background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
