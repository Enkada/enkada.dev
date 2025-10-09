<script setup lang="ts">
import moment from 'moment';
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';

type Song = {
    id: number;
    title: string;
    subtitle: string;
    performer_title: string;
    performers: string[];
    featured: string[];
    cover: string;
    duration: number;
    isClaimed: boolean;
}

const songs = ref<Song[]>([]);

const searchQuery = ref('');

const testSong = (song: Song) => {
    const search = searchQuery.value.toLowerCase().trim();

    if (!search) return true;

    return song.title.toLowerCase().includes(search) ||
           song.subtitle.toLowerCase().includes(search) ||
           song.performer_title.toLowerCase().includes(search);
};

const highlightSearch = (text: string) => {
    const searchValue = searchQuery.value.trim().toLocaleLowerCase();

    if (!searchValue) return text;

    const regex = new RegExp(`(${searchValue})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

watch(searchQuery, () => {
    displayCount.value = displayStep;
});

const displayStep = 200;
const displayCount = ref(displayStep);

// Infinite scroll: observe a sentinel at the bottom to auto-load more
const sentinel = ref<HTMLElement | null>(null);
let io: IntersectionObserver | null = null;
const isAutoLoading = ref(false);

const loadMore = () => {
    if (displayCount.value < songs.value.length) {
        displayCount.value += displayStep;
    }
};

onMounted(async () => {
    const response = await fetch('./songs.json');
    songs.value = await response.json();

    // Setup IntersectionObserver after initial render
    io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
            if (!isAutoLoading.value && displayCount.value < songs.value.length) {
                isAutoLoading.value = true;
                loadMore();
                // Release the guard on next render cycle
                nextTick(() => { isAutoLoading.value = false; });
            }
        }
    }, { root: null, rootMargin: '200px', threshold: 0 });

    if (sentinel.value) io.observe(sentinel.value);
});

// Reconnect observer when sentinel ref changes (e.g., toggled by v-if)
watch(sentinel, (el, prev) => {
    if (io && prev) io.unobserve(prev);
    if (io && el) io.observe(el);
});

onUnmounted(() => {
    if (io) {
        io.disconnect();
        io = null;
    }
});

</script>

<template>
    <main>
        <div class="section" :style="{ '--index': 0 }">
            <div class="section__header">Music</div>
            <div class="section__content">
                <p>Here you can find a list of my favorite music tracks, saved in VK Music. There's a total of <b>{{ songs.length }}</b> songs. 
                    File, containing JSON data for these songs can be downloaded <a href="../songs.json" download>here</a>.</p>
            </div>
        </div>
        <div class="search">
            <input type="search" v-model="searchQuery" placeholder="Search">
            <div class="search__status">Found {{ songs.filter(testSong).length }} songs</div>
        </div>
        <div class="song-list">
            <div class="loading" v-if="!songs.length"></div>
            <div class="song" v-for="(song, index) in songs.filter(testSong).slice(0, displayCount)" :key="song.id" :style="{ '--index': index % displayStep }">
                <div class="song__cover" :style="{ backgroundImage: `url(${song.cover})` }" :class="{ 'empty': !song.cover }">
                    <div class="note" v-if="!song.cover">♪</div>
                </div>
                <div class="song__header">
                    <div class="song__title" v-html="highlightSearch(song.title)"></div>
                    <div class="song__subtitle" v-html="highlightSearch(song.subtitle)"></div>
                </div>
                <div class="song__performer" v-html="highlightSearch(song.performer_title)"></div>
                <div class="song__duration">{{ moment(song.duration * 1000).format('m:ss') }}</div>
            </div>
            <div v-if="displayCount < songs.filter(testSong).length" ref="sentinel" class="sentinel"></div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
main {
	display: grid;
	gap: 2rem;
	align-content: start;
}

.song-list {
    display: grid;
    gap: 1rem;
}

.sentinel {
    width: 100%;
    height: 1px;
}

.search {
    display: grid;
    gap: 0.5rem;

    &__status {
        text-align: right;
        color: var(--clr-muted);
        font-size: 0.875rem;
    }
}

.song {
    display: grid;
    grid-template-columns: 2.5rem 1fr auto;
    align-items: center;
    gap: 0.15rem 0.5rem;

    opacity: 0;
    animation: from-bottom 0.5s forwards;
    animation-delay: calc(var(--index) * 0.005s);

    &__cover {
        aspect-ratio: 1 / 1;
        grid-row: 1 / span 2;
        background-size: cover;
        border-radius: 0.2rem;

        &.empty {
            display: grid;
            place-items: center;
            background-color: var(--clr-bg);

            .note {
                font-size: 1.5rem;
                color: var(--clr-muted);
            }
        }
    }

    &__performer {
        grid-column: 2;
        grid-row: 2;
        color: var(--clr-muted);
    }

    &__header {
        display: flex;
        gap: 0.3rem;
    }

    &__title {
        font-weight: bold;
    }

    &__subtitle {
        color: var(--clr-muted);
    }

    &__duration {
        grid-row: 1 / span 2;
        color: var(--clr-muted);
    }
}

</style>
