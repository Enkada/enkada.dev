<script setup lang="ts">
</script>

<template>
    <nav>
        <router-link to="/" :style="{'--index': 0}">Home</router-link>
        <router-link to="/posts" :style="{'--index': 1}">Posts</router-link>
        <router-link to="/about" :style="{'--index': 2}">About</router-link>
    </nav>
</template>

<style lang="scss" scoped>
nav {
    display: flex;
    gap: 1rem;

    @media (width < 760px) {
        flex-direction: column;
        align-items: end;
    }

    @media (width <= 600px) {
        flex-direction: row;
        grid-column: 1 / -1;
        width: 100%;
        justify-content: space-evenly;
    }
}

a {
    text-decoration: none;
    color: var(--clr-muted);

    opacity: 0;
    animation: from-bottom 0.5s ease forwards;
    animation-delay: calc(0.1s + 0.1s * var(--index));

    &:hover {
        color: var(--clr-text);
    }

    &.router-link-active {
        position: relative;
        color: var(--clr-text);
        
        &::after {
            content: '';
            position: absolute;
            display: block;
            width: 100%;
            height: 2px;
            background-color: var(--clr-accent);
            margin-top: 2px;
        }
    }
}
</style>
