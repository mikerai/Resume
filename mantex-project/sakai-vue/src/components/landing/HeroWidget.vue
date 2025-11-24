<template>
    <div id="hero" class="flex flex-col">
        <div class="intro mx-6 text-center">
            <h1 class="text-6xl font-bold text-gray-900 leading-tight clear"><span class="font-light block">Te damos la</span> bienvenida</h1>
            <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700 clear">A la plataforma de mantenimiento de Mantex.</p>
            <Button label="Registrarse" as="router-link" to="/signup" rounded class="!text-xl mt-8 !px-8"></Button>
        </div>
        <div class="flex justify-center md:justify-end">
            <img src="/demo/images/landing/screen-1.png" alt="Hero Image" class="w-9/12 md:w-auto" />
        </div>
    </div>
</template>
