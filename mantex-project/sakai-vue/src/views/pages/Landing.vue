<script setup lang="ts">
import FeaturesWidget from '@/components/landing/FeaturesWidget.vue';
import FooterWidget from '@/components/landing/FooterWidget.vue';
import HeroWidget from '@/components/landing/HeroWidget.vue';
import HighlightsWidget from '@/components/landing/HighlightsWidget.vue';
import PricingWidget from '@/components/landing/PricingWidget.vue';
import TopbarWidget from '@/components/landing/TopbarWidget.vue';
import SocialProofWidget from '@/components/landing/SocialProofWidget.vue';
import HowItWorksWidget from '@/components/landing/HowItWorksWidget.vue';
import CTAWidget from '@/components/landing/CTAWidget.vue';
</script>

<template>
    <div class="bg-surface-0 dark:bg-surface-900">
        <TopbarWidget />
        <div id="home" class="landing-wrapper overflow-hidden">
            <HeroWidget />
            <SocialProofWidget />
            <HowItWorksWidget />
            <FeaturesWidget />
            <HighlightsWidget />
            <PricingWidget />
            <CTAWidget />
            <FooterWidget />
        </div>
    </div>
</template>
