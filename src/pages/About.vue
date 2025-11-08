<script setup lang="ts">
import moment from 'moment';

const skills = [
    { name: 'PostgreSQL', icon: 'postgresql.svg' },
    { name: 'TypeScript', icon: 'typescript.svg' },
    { name: 'Vue.js', icon: 'vuejs.svg' },
    { name: 'React', icon: 'react.svg' },
    { name: 'PHP', icon: 'php.svg' },
    { name: 'Node.js', icon: 'nodejs.svg' },
    { name: 'MariaDB', icon: 'mariadb.svg' },
    { name: 'Python', icon: 'python.svg' },
    { name: 'Git', icon: 'git.svg' },
    { name: 'Linux', icon: 'linux.svg' },
    { name: 'Sass', icon: 'sass.png' },
    { name: 'C#', icon: 'csharp.svg' },
    { name: 'JavaScript', icon: 'javascript.svg' },
    { name: 'HTML', icon: 'html.svg' },
    { name: 'CSS', icon: 'css.svg' },
]

</script>

<template>
    <main>
        <div class="section" :style="{ '--index': 0 }">
            <div class="section__header">About Me</div>
            <div class="section__content">
                <table>
                    <tbody>
                        <tr>
                            <td>Name</td>
                            <td>Kirill</td>
                        </tr>
                        <tr>
                            <td>Age</td>
                            <td>{{ moment().diff(moment('2003-02-17'), 'years') }}yo ♒</td>
                        </tr>
                        <tr>
                            <td>MBTI</td>
                            <td>ISTJ</td>
                        </tr>
                        <tr>
                            <td>Occupation</td>
                            <td>Software Engineer specializing in databases</td>
                        </tr>
                        <tr>
                            <td>Location</td>
                            <td>Russia</td>
                        </tr>
                        <tr>
                            <td>Education</td>
                            <td title="Qualification: Programmer">Diploma in Information Systems and Programming (2023)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="section" :style="{ '--index': 1 }">
            <div class="section__header">Skills</div>
            <div class="section__content skill-grid">
                <div class="skill" v-for="(skill, index) in skills" :style="{ '--index': index }" :key="skill.name">
                    <img :src="`/icon/${skill.icon}`" :alt="skill.name" :title="skill.name">
                    <div class="skill__name">{{ skill.name }}</div>
                </div>
            </div>
        </div>
        <div class="section" :style="{ '--index': 2 }">
            <div class="section__header">Links</div>
            <div class="section__content link-grid">
                <router-link to="/music" class="link-button music" :style="{ '--index': 0 }">
                    <div class="link-button__icon">ᯓ</div>
                    <div class="link-button__text">Music</div>
                </router-link>
                <router-link to="/fumo" class="link-button fumo" :style="{ '--index': 1 }">
                    <div class="link-button__icon">ᗜˬᗜ</div>
                    <div class="link-button__text">Fumos</div>
                </router-link>
                <div class="hidden"></div>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
main {
	display: grid;
	gap: 2rem;
	align-content: start;
}

.skill-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
}

.link-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
}

.link-button {
    text-decoration: none;
    background-color: var(--clr-bg);
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: background-color 0.3s ease;

    opacity: 0;
    animation: from-bottom 0.5s forwards;
    animation-delay: calc(var(--index) * 0.1s);

    &:hover {
        background-color: var(--clr-bg-lighter);

        .link-button__text {
            scale: 1.2;
        }

        .link-button__icon {
            scale: 1.2;
        }
    }

    &__icon {
        aspect-ratio: 1 / 1;
        height: 100%;
        display: grid;
        place-items: center;
        border-radius: 0.25rem;
        background-color: var(--clr-border);
        transition: scale 0.3s ease;
    }

    &__text {
        font-size: 1.25rem;
        transition: scale 0.3s ease;
        transform-origin: left;
    }

    &.music {
        .link-button__icon {
            background-image: linear-gradient(to top, #f45fff, #07f);
        }
    }

    &.fumo {
        .link-button__icon {
            background-image: linear-gradient(to top, #044146, rgb(2, 59, 10));
            font-size: 0.8rem;
        }
    }
}

.skill {
    display: grid;
    grid-template-columns: 2em auto;
    align-items: center;
    gap: 1rem;

    opacity: 0;
    animation: from-bottom 0.5s forwards;
    animation-delay: calc(var(--index) * 0.03s);
}

table {

    td:nth-child(1) {
        font-weight: bold;
    }

    td {
        padding: 0 0.5rem 0.25rem 0;
    }
}
</style>
