<template>
    <div
        id="hero"
        class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden">
        <div class="intro mx-6 md:mx-20 mt-0 md:mt-6">
            <h1 class="text-6xl font-bold text-gray-900 leading-tight clear"><span class="font-light block">Eu sem integer</span>eget magna fermentum</h1>
            <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700 clear">Sed blandit libero volutpat sed cras. Fames ac turpis egestas integer. Placerat in egestas erat...</p>
            <Button label="Registrarse" as="router-link" to="/register" rounded class="!text-xl mt-8 !px-8"></Button>
        </div>
        <div class="flex justify-center md:justify-end">
            <img src="/demo/images/landing/screen-1.png" alt="Hero Image" class="w-9/12 md:w-auto" />
        </div>
    </div>
</template>
