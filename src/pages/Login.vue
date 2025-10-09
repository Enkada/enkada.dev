<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';

const errorText = ref("");
const password = ref("");

const login = async (password: string) => {
    try {
        const response = await axios.post('/login', { password });

        if (response.data.token) {
            localStorage.setItem('enkadaDevAuthToken', response.data.token);
            window.location.href = '/';
        } else {
            errorText.value = "No token received";
        }
    } catch (error) {
        console.error('Login failed:', error);
        if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
            errorText.value = error.response.data.error;
        } else {
            errorText.value = "An unexpected error occurred";
        }
    }
};
</script>

<template>
<div class="login">
    <input type="password" placeholder="Password" v-model="password" @keyup.enter="login(password)" />
    <div class="error-text">{{ errorText }}</div>
</div>
</template>

<style lang="scss" scoped>
.login {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    display: grid;
    gap: 0.5rem;
}

.error-text {
    color: red;
    text-align: center;
    height: 1.2rem;
}
</style>
