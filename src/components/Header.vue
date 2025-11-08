<script setup lang="ts">
import NavBar from './NavBar.vue'

const links = [
    {
        name: "GitHub",
        url: "https://github.com/Enkada",
        icon: "github.svg"
    },
    {
        name: "Telegram",
        url: "https://t.me/EnkadaDev",
        icon: "telegram.svg"
    },
    {
        name: "Mail",
        url: "mailto:bunneypass@gmail.com",
        icon: "gmail.ico"
    },
    {
        name: "Steam",
        url: "https://steamcommunity.com/id/siceria/",
        icon: "steam.ico"
    },
]
</script>

<template>
    <header>
        <div class="logo">
            <img @click="$router.push('/')" class="logo away" src="/sara_0.png"></img>
            <img @click="$router.push('/')" class="logo looking" src="/sara_1.png"></img>
        </div>
        <div class="title">
            <h1 @click="$router.push('/')">Enkada</h1>
            <h2>Software Engineer</h2>
            <div class="link-list">
                <a v-for="(link, index) in links" :style="{ '--index': index }" :key="link.name" :href="link.url" :title="link.name" target="_blank" rel="noopener">
                    <img :src="`/icon/${link.icon}`">
                </a>    
            </div>
        </div>
        <NavBar />
    </header>
</template>

<style lang="scss">
header {
    display: grid;
    grid-template-columns: 10em auto auto;
    gap: 1rem 0;
    align-items: center;
    padding-block: 2rem;

    @media (width <= 600px) {
        grid-template-columns: 8em auto;
    }

    @media (width <= 380px) {
        grid-template-columns: 6em auto;
    }

    .logo {
        cursor: pointer;
        z-index: 100;

        animation: logo 0.5s ease forwards;
        position: relative;
        aspect-ratio: 160 / 187;

        .away, .looking {
            top: 0;
            left: 0;
            position: absolute;
            margin-left: -0.5rem;
        }

        &:hover {
            .away {
                opacity: 0 !important;
            }

            .looking {
                opacity: 1 !important;
            }
        }

        .looking {
            opacity: 0 !important;
        }

        @keyframes logo {
            0% {
                scale: 0.5;
                rotate: -15deg;
                opacity: 0;
            }
            100% {
                scale: 1;
                rotate: 0deg;
                opacity: 1;
            }
        }
    }

    .link-list {
        margin-top: .5rem;
        display: flex;
        gap: .5rem;

        a {
            opacity: 0;
            animation: opacity-in 0.5s ease forwards;
            animation-delay: calc(0.3s + 0.1s * var(--index));
            transform-origin: center;
            transition: scale 0.1s ease;

            &:active {
                transform: translateY(1px);
                scale: 1.15;
            }

            &:hover {
                scale: 1.15;
            }
        }

        img {
            width: 1.35rem;
        }
    }

    h1 {
        font-size: 3.5rem;
        margin-left: -0.15rem;
        color: var(--clr-accent);
        cursor: pointer;

        opacity: 0;
        animation: from-left 0.5s ease forwards 0.1s;

        position: relative;
        background: linear-gradient(
            90deg,
            var(--clr-accent) 0%,
            var(--clr-accent) 40%,
            hsl(169, 47%, 67%) 50%,
            var(--clr-accent) 60%,
            var(--clr-accent) 100%
        );
        background-size: 200% 100%;
        background-position: 120% 0;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        &:hover {
            background-position: -100% 0;
            transition: background-position 2.5s ease;
        }

        @media (width <= 600px) {
            font-size: 2.5rem;
        }

        @media (width <= 380px) {
            font-size: 2rem;
        }
    }

    h2 {
        font-weight: normal;
        font-size: 1rem;
        color: var(--clr-muted);

        opacity: 0;
        animation: from-left 0.5s ease forwards 0.2s;
    }

    nav {
        justify-self: end;
    }
}
</style>
