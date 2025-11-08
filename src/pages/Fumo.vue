<script setup lang="ts">
import { ref } from 'vue';
import { fumos } from '../types/Fumo';

const hideUnobtained = ref(false);

const toggleFumos = (e: MouseEvent) => {
    e.preventDefault();
    hideUnobtained.value = !hideUnobtained.value;
};

</script>

<template>
    <main>
        <div class="section" :style="{ '--index': 0 }">
			<div class="section__header">Fumos</div>
			<div class="section__content">
				<p>This page shows a list of the most popular existing Touhou Fumo plushies. You can <a @click="toggleFumos">toggle this</a> to show/hide ones that I have not obtained yet.</p>
			</div>
		</div>
        <div class="fumo-grid" :class="{ 'hide-unobtained': hideUnobtained }">
            <div v-for="fumo in fumos" :key="fumo.id" class="fumo" :class="[fumo.id, { 'obtained': fumo.isObtained } ]">
                <img :src="`/fumo/${fumo.id}.png`" :alt="fumo.fullName" class="fumo__image" />
                <div class="fumo__full-name" :style="{ color: fumo.color }">{{ fumo.fullName }}</div>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
.fumo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 2rem;

    &.hide-unobtained {
        .fumo:not(.obtained) {
            filter: grayscale(1) brightness(0.5);
        }
    }
}

.fumo {
    display: grid;
    padding: 0.5rem;
    border-radius: 4px;

    transition: background-color 0.2s ease, filter 0.2s ease;

    &.remilia {
        .fumo__image {
            scale: 1.1;
            translate: 0 8px;
        }
    }

    &.reisen {
        .fumo__image {
            scale: 1.4;
            translate: 0 8px;
        }
    }
    
    &:hover {
        background-color: var(--clr-bg);
        filter: grayscale(0) brightness(1);
    }

    &__full-name {
        text-align: center;
        // font-weight: bold;
    }

    &__image {
        filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3));
        height: 200px;
        object-fit: contain;
        transform-origin: bottom;
        
        transition: transform 0.2s;
        &:hover {
            transform: scale(1.05);
        }
    }
}
</style>
