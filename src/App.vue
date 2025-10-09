<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

// Allow routes to opt-out of the global layout via meta: { layout: 'none' }
const route = useRoute();
const hasLayout = computed(() => route.meta.layout !== 'none');
</script>

<template>
	<div class="app-layout">
		<Header v-if="hasLayout" />
		<!-- Optional page transition without re-mounting persistent layout -->
		<transition name="page" mode="out-in">
			<RouterView />
		</transition>
		<Footer v-if="hasLayout" />
	</div>
</template>

<style lang="scss">
.app-layout {
	display: contents;
}

.page-enter-active, 
.page-leave-active { 
	transition: opacity .25s, transform .25s; 
}

.page-enter-from, 
.page-leave-to { 
	opacity: 0; 
	transform: translateY(10px); 
}
</style>
