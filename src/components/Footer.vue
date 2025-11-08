<script setup lang="ts">
import moment from 'moment';
import { onMounted, ref } from 'vue';

const buildInfo = ref({ commit_hash: '', commit_date: '', build_date: '' });

const showBuildInfo = ref(false);

onMounted(() => {
    // get ./build.json
    console.log('Fetching build.json');
    fetch('/build.json')
        .then(response => response.json())
        .then(data => {
            buildInfo.value = data;
        })
        .catch(error => {
            console.error('Error fetching build.json:', error);
        });
});

const toggleBuildInfo = () => {
    showBuildInfo.value = !showBuildInfo.value;

    if (showBuildInfo.value) {
        setTimeout(() => {
            const footer = document.querySelector('footer');
            if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
};

</script>

<template>
    <footer>
        <div class="copyright" @dblclick="toggleBuildInfo">&copy; {{ moment().format('YYYY') }} Enkada</div>
        <div class="build-info" v-if="buildInfo && showBuildInfo">
                <div class="build-info__name">Commit Hash:</div>
                <a
                    class="build-info__value commit-hash"
                    :href="'https://github.com/Enkada/enkada.dev/commit/' + buildInfo.commit_hash"
                    target="_blank"
                    rel="noopener"
                >
                    {{ buildInfo.commit_hash.substring(0, 19) }}
                </a>
                <div class="build-info__name">Commit Date:</div>
                <div class="build-info__value commit-date">
                    {{ moment(buildInfo.commit_date).format('YYYY-MM-DD HH:mm:ss') }}
                </div>
                <div class="build-info__name">Build Date:</div>
                <div class="build-info__value build-date">
                    {{ moment(buildInfo.build_date).format('YYYY-MM-DD HH:mm:ss') }}
                </div>
        </div>
    </footer>
</template>

<style lang="scss" scoped>
.copyright {
    text-align: center;
    padding: 4rem 2rem 2rem 2rem;
    color: hsl(0, 0%, 20%);
}

.build-info {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.5rem;
    padding-bottom: 2rem;
    width: fit-content;
    margin: 0 auto;

    &__name {
        font-weight: bold;
        text-align: right;
    }

    &__value {
        font-family: monospace;
        overflow-wrap: anywhere;
    }
}
</style>
