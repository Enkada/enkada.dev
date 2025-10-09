<script setup lang="ts">
import moment from 'moment';
</script>

<template>
    <footer>
        &copy; {{ moment().format('YYYY') }} Enkada
    </footer>
</template>

<style lang="scss" scoped>
footer {
    text-align: center;
    padding: 4rem 2rem 2rem 2rem;
    color: hsl(0, 0%, 20%);
}
</style>
