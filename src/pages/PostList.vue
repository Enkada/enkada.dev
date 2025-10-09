<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import moment from 'moment'
import axios from 'axios'
import type { Post } from '../types/Post'
import { getPostUrl, isLoggedIn } from '../utils'
import type { Tag } from '../types/Tag'

type PostWithIndex = Post & { index: number };

const route = useRoute();
const router = useRouter();

const posts = ref<PostWithIndex[]>([]);
const firstYear = ref(0);
const lastYear = ref(new Date().getFullYear());
const search = ref("");

const showHidden = ref(false);

const tags = ref<{ name: string, count: number }[]>([]);
const selectedTag = ref("");

// Tag metadata map by name -> { description, background, foreground }
const tagMeta = ref<Record<string, Pick<Tag, 'description' | 'background' | 'foreground'>>>({});

// Initialize search and selectedTag from URL parameters
const initializeFromParams = () => {
    const query = route.query;
    if (query.q && typeof query.q === 'string') {
        search.value = query.q;
    }
    if (query.t && typeof query.t === 'string') {
        selectedTag.value = query.t;
    }
};

// Update URL parameters when search or tag changes
const updateUrlParams = () => {
    const query: Record<string, string> = {};
    
    if (search.value.trim()) {
        query.q = search.value.trim();
    }
    
    if (selectedTag.value) {
        query.t = selectedTag.value;
    }
    
    // Only update if query params are different
    const currentQuery = route.query;
    const shouldUpdate = 
        (query.q !== currentQuery.q) || 
        (query.t !== currentQuery.t) ||
        (!query.q && currentQuery.q) ||
        (!query.t && currentQuery.t);
    
    if (shouldUpdate) {
        router.replace({ 
            path: route.path, 
            query: Object.keys(query).length > 0 ? query : undefined 
        });
    }
};

// Watch for changes in search and selectedTag to update URL
watch([search, selectedTag], () => {
    updateUrlParams();
});

onMounted(async () => {
    // Initialize from URL parameters first
    initializeFromParams();
    
    const token = localStorage.getItem('enkadaDevAuthToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch tag metadata for styling and tooltips (before posts)
    const tagResp = await axios.get('/tag/list', { headers });
    const list: Array<Pick<Tag, 'name' | 'description' | 'background' | 'foreground'>> = tagResp.data;
    tagMeta.value = list.reduce((acc, t) => {
        acc[t.name] = {
            description: t.description,
            background: t.background,
            foreground: t.foreground,
        };
        return acc;
    }, {} as Record<string, Pick<Tag, 'description' | 'background' | 'foreground'>>);

    const response = await axios.get('/post/list', { headers });
    posts.value = response.data;

    firstYear.value = Math.min(...posts.value.map(a => new Date(a.date).getFullYear()));

    posts.value = posts.value.map((post, index) => ({ ...post, index }));

    tags.value = posts.value
        .flatMap(post => post.tags.map(tag => ({ name: tag, count: 1 })))
        .reduce((acc: { name: string, count: number }[], curr: { name: string, count: number }) => {
            const existing = acc.find((item: { name: string, count: number }) => item.name === curr.name);
            if (existing) {
                existing.count += curr.count;
            } else {
                acc.push(curr);
            }
            return acc;
        }, [])
        .sort((a, b) => b.count - a.count);
})

const searchTest = (post: Post) => {
    const searchValue = search.value.trim().toLocaleLowerCase();
    let textFound = searchValue ? false : true;
    let tagFound = selectedTag.value ? post.tags.includes(selectedTag.value) : true;

    if (post.title.toLowerCase().includes(searchValue)) textFound = true;
    if (searchValue.length > 1 && post.content && post.content.toLowerCase().includes(searchValue)) textFound = true;

    return textFound && tagFound;
}

const highlightSearch = (text: string) => {
    const searchValue = search.value.trim().toLocaleLowerCase();

    if (!searchValue) return text;

    const regex = new RegExp(`(${searchValue})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

const findInstancesWithContext = (text: string) => {
    const searchValue = search.value.trim().toLocaleLowerCase();
    
    if (!searchValue) return [];

    const escapedQuery = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
    const regex = new RegExp(`(.{0,30}${escapedQuery}.{0,30})`, 'gi');
    const instances = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        instances.push(match[1]);
    }
    return instances;
};

const selectTag = (event: MouseEvent, tag: string) => {
    event.preventDefault();
    if (selectedTag.value === tag) {
        selectedTag.value = "";
    } else {
        selectedTag.value = tag;
    }
}

const getTagStyle = (name: string) => {
    const t = tagMeta.value[name];
    if (!t) return {} as Record<string, string>;
    const style: Record<string, string> = {};
    if (t.background) style['background-color'] = t.background;
    if (t.foreground) style['color'] = t.foreground;
    return style;
}

</script>

<template>
    <main>
        <div class="section" :style="{ '--index': 0 }">
			<div class="section__header">Posts</div>
			<div class="section__content">
				<p>On this page, you'll find a collection of posts that I've written over the years. 
                    Most of them are personal diaries, where I share my thoughts and experiences. 
                    The rest of them are related to projects I've worked on, showcasing their functionality and design.</p>
			</div>
		</div>
        <div class="filter-list" :style="{ '--index': 1 }">
            <input type="search" placeholder="Search" v-model="search"/>
            <select v-model="selectedTag" :class="{ 'no-selection': !selectedTag }">
                <option value="">Select Tag</option>
                <option v-for="tag in tags" :key="tag.name" :value="tag.name">
                    {{ tag.name }} ({{ tag.count }})
                </option>
            </select>
            <label v-if="isLoggedIn()">
                <input type="checkbox" v-model="showHidden"/>
                Hidden
            </label>
        </div>
        <div class="post-list" v-if="posts.length > 0">
            <div 
                class="post-year" 
                v-for="year in Array.from({ length: lastYear - firstYear + 1 }, (_, i) => lastYear - i)" 
                :style="{ '--index': Math.min(...posts.filter(a => new Date(a.date).getFullYear() === year).map(a => a.index)) }"
                :key="year"
                >
                <div class="post-year__number">
                    {{ year }}
                </div>
                <div class="post-year__list">
                    <router-link 
                        v-for="post in posts.filter(a => new Date(a.date).getFullYear() === year && searchTest(a) && (showHidden || Number(a.status) !== 0))" 
                        :key="post.id" 
                        class="post"
                        :style="{ '--index': post.index }"
                        :class="{ 'hidden': Number(post.status) === 0}"
                        :to="getPostUrl(post)"
                    >
                        <div class="post__wrapper">
                            <div class="post__header">
                                <span class="post__emoji">{{ post.emoji }}</span>
                                <span class="post__title" v-html="highlightSearch(post.title)"></span>
                            </div>
                            <div class="post__tag-list">
                                <div
                                    class="post-tag"
                                    v-for="tag in post.tags"
                                    :key="tag"
                                    :style="getTagStyle(tag)"
                                    :title="tagMeta[tag]?.description || ''"
                                    @click="(e) => selectTag(e, tag)"
                                >
                                    {{ tag }}
                                </div>
                            </div>
                        </div>
                        <div
                            class="post__date"
                            :title="moment(post.date).format('DD.MM.YYYY')"
                        >
                            {{ moment(post.date).format('MMM DD') }}
                        </div>
                        <div class="post__content-search" v-if="search.trim().length > 1">
                            <div 
                                class="post__content-search__instance" 
                                v-for="instance in findInstancesWithContext(post.content)" 
                                :key="instance"
                                v-html="highlightSearch(instance)"></div>
                            <div 
                                class="post__content-search__instance" 
                                v-for="instance in findInstancesWithContext(post.content_ru)" 
                                :key="instance"
                                v-html="highlightSearch(instance)"></div>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>
        <div class="loading" v-else></div>
    </main>
</template>

<style lang="scss" scoped>
.section {
    margin-bottom: 2rem;
}

.post-list {
    display: grid;
    gap: 1.5rem;
}

.post-year {
    display: grid;
    gap: .25rem;

    &:has(> .post-year__list:empty) {
        display: none;
    }

    &__number {
        text-align: right;
        opacity: 0;
        animation: post 0.5s forwards;
        animation-delay: calc(var(--index) * 0.01s);
    }

    &__list {
        display: grid;
    }
}

.post {
    text-decoration: none;
    display: grid;
    align-items: center;
    grid-template-columns: 1fr auto;
    gap: .5rem;
    padding-block: .4rem;

    opacity: 0;
    animation: post 0.5s forwards;
    animation-delay: calc(var(--index) * 0.01s);

    &.hidden {
        filter: grayscale(1) brightness(0.5);
    }

    &__wrapper {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: .5rem;
    }

    &__title {
        line-height: 1.5;
    }

    &__emoji {
        font-size: 1.5rem;
        line-height: 0;
        display: inline-block;
        translate: 0 2px;
        margin-right: .25rem;

        @media (width < 400px) {
            font-size: 1.25rem;            
        }
    }

    &__date {
        color: var(--clr-muted);
        font-size: 0.9rem;
    }

    &__tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
    }

    &__content-search {
        grid-column: auto / span 4;
        border-left: 2px solid var(--clr-muted);
        padding-left: 1rem;
        margin-left: 1rem;
        display: grid;
        gap: 0.5rem;
        margin-bottom: .5rem;

        &__instance {
            font-size: 0.9rem;

            mask-image: linear-gradient(to right, transparent, black 14px, black calc(100% - 14px), transparent);
            width: fit-content;
        }
    }

    &:hover {
        background-color: hsl(0, 0%, 12%);
    }
}

.filter-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;

    opacity: 0;
    animation: from-bottom 0.5s forwards;
    animation-delay: calc(var(--index) * 0.1s);

    select {
        min-width: 147px;

        option:first-child {
            color: var(--clr-muted);
        }

        &.no-selection {
            color: var(--clr-muted);
        }
    }
}

@keyframes post {
    0% {
        transform: translateY(10px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

</style>
