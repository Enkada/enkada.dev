<template>
  <div class="not-found">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <router-link to="/">Go to Home</router-link>
  </div>
</template>

<script setup lang="ts">
// No script needed for basic 404 page
</script>

<style scoped>
.not-found {
  text-align: center;
  margin-top: 80px;
}
h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
}
p {
  margin-bottom: 24px;
}
</style>
