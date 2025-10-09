<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Post } from '../types/Post';
import axios from 'axios';
import moment from 'moment';
import Markdown from 'vue3-markdown-it';
import { getPostUrl, isLoggedIn } from '../utils';
import type { Tag } from '../types/Tag';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

const props = defineProps<{
    id: string
    slug: string
}>();


const router = useRouter();
const postId = ref(parseInt(props.id, 16));
const post = ref<Post | null>(null);
const posts = ref<Post[]>([]);
const neighbors = ref<{ previous: Post | null, next: Post | null }>({ previous: null, next: null });
const isLangRu = ref(false)
const tagMeta = ref<Record<string, Pick<Tag, 'description' | 'background' | 'foreground'>>>({});
const mdContainer = ref<HTMLElement | null>(null);
let viewer: Viewer | null = null;
const viewerActive = ref(false);
const currentImageMeta = ref<{ title: string; description?: string; date: string }>({ title: '', description: '', date: '' });
const imageCount = ref(0);

const goPrevImage = () => {
    if (viewer) viewer.prev();
};

const goNextImage = () => {
    if (viewer) viewer.next();
};

const loadPost = async () => {
    const token = localStorage.getItem('enkadaDevAuthToken');
    try {
        const response = await axios.get(`/post/content/${postId.value}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        post.value = response.data;

        // Set document title when post loads
        if (typeof document !== 'undefined' && post.value) {
            const base = 'Enkada';
            const title = isLangRu.value ? (post.value.title_ru || post.value.title) : post.value.title;
            document.title = `${base} – ${title}`;
        }

        if (post.value && !post.value?.content && post.value.content_ru) {
            isLangRu.value = true;
        }
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            router.replace({ name: 'not-found' });
        } else {
            throw error;
        }
    }
};

const setNeighbors = () => {
    const currentIndex = posts.value.findIndex(a => Number(a.id) === postId.value);
    neighbors.value.previous = currentIndex > 0 ? posts.value[currentIndex - 1] : null;
    neighbors.value.next = currentIndex < posts.value.length - 1 ? posts.value[currentIndex + 1] : null;
};

onMounted(async () => {
    await loadPost();

    const token = localStorage.getItem('enkadaDevAuthToken');

    const tagResp = await axios.get('/tag/list', token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    const list: Array<Pick<Tag, 'name' | 'description' | 'background' | 'foreground'>> = tagResp.data;
    tagMeta.value = list.reduce((acc, t) => {
        acc[t.name] = {
            description: t.description,
            background: t.background,
            foreground: t.foreground,
        };
        return acc;
    }, {} as Record<string, Pick<Tag, 'description' | 'background' | 'foreground'>>);

    const listResponse = await axios.get('/post/list', token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    posts.value = listResponse.data;

    setNeighbors();

    await nextTick();
    initViewer();

    // Keyboard navigation between posts
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeydown);
    }
});

watch(() => props.id, async (newId) => {
    postId.value = parseInt(newId, 16);
    await loadPost();

    setNeighbors();

    if (isLangRu.value && !post.value?.content_ru) {
        isLangRu.value = false;
    }

    await nextTick();
    initViewer();
});

watch(() => isLangRu.value, async () => {
    await nextTick();
    initViewer();
});

onUnmounted(() => {
    if (viewer) {
        viewer.destroy();
        viewer = null;
    }
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown);
    }
});

const initViewer = () => {
    // Recreate viewer on the Markdown container
    if (viewer) {
        viewer.destroy();
        viewer = null;
    }
    if (!mdContainer.value) return;
    // Count images inside the markdown container
    imageCount.value = mdContainer.value.querySelectorAll('img').length;

    viewer = new Viewer(mdContainer.value, {
        // Keep it minimal for mobile
        toolbar: false,
        navbar: false,
        title: false, // We'll show our own overlay
        fullscreen: false,
        loop: true,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false,
        toggleOnDblclick: true,
        // Increase scroll sensitivity
        zoomRatio: 0.25,
        viewed(e) {
            const img = e.detail.image as HTMLImageElement;
            const src = img.getAttribute('src') || '';
            let original: HTMLImageElement | null = null;
            if (mdContainer.value) {
                // Match by src; fallback to first image
                original = (mdContainer.value.querySelector(`img[src="${src}"]`) as HTMLImageElement) || mdContainer.value.querySelector('img');
            }
            const target = original || img;
            const ds = target.dataset as Record<string, string | undefined>;
            const dateStr = ds.date || (post.value ? moment(post.value.date).format('LL') : '');
            currentImageMeta.value = {
                title: (ds.title || img.alt || 'Untitled image').toString(),
                description: ds.description,
                date: dateStr.toString(),
            };
            const wasInactive = !viewerActive.value;
            viewerActive.value = true;

            if (wasInactive) {
                requestAnimationFrame(() => {
                    if (viewer) {
                        (viewer as unknown as { options: { transition?: boolean } }).options.transition = false;
                    }
                });
            }
        },
        hide() {
            if (viewer) {
                (viewer as unknown as { options: { transition?: boolean } }).options.transition = true;
            }
        },
        hidden() {
            viewerActive.value = false;
            if (viewer) {
                (viewer as unknown as { options: { transition?: boolean } }).options.transition = true;
            }
        },
    });
};

const handleKeydown = (e: KeyboardEvent) => {
    // Don't interfere with Viewer.js or while typing
    if (viewerActive.value) return;
    if (e.defaultPrevented) return;

    const target = e.target as HTMLElement | null;
    if (target) {
        const tag = target.tagName;
        if (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            return;
        }
    }

    if (e.key === 'ArrowLeft' && neighbors.value.previous) {
        e.preventDefault();
        router.push(getPostUrl(neighbors.value.previous));
    } else if (e.key === 'ArrowRight' && neighbors.value.next) {
        e.preventDefault();
        router.push(getPostUrl(neighbors.value.next));
    }
};

const markdownPlugins = [
    {
        plugin: (md: any) => {
            // Override image renderer
            md.renderer.rules.image = (tokens: any[], idx: number) => {
                const token = tokens[idx];
                const rawSrc = token.attrGet('src');
                const src = rawSrc && rawSrc.includes('http') ? rawSrc : `https://files.enkada.dev/www/${rawSrc}`;
                const alt = token.content;
                const dateStr = post.value ? moment(post.value.date).format('LL') : '';
                const safe = (s: string | null | undefined) => (s ?? '').replace(/"/g, '&quot;');

                return `<img src="${src}" alt="${safe(alt)}" title="${safe(alt)}" data-title="${safe(alt)}" data-description="" data-date="${safe(dateStr)}" />`;
            };
        }
    },
    {
        // Spoiler syntax: ||hidden text|| -> <span class="spoiler">hidden text</span>
        plugin: (md: any) => {
            // Use a core rule to post-process inline text tokens and replace patterns
            md.core.ruler.push('spoiler', (state: any) => {
                state.tokens.forEach((blockToken: any) => {
                    if (blockToken.type !== 'inline' || !blockToken.children) return;
                    const newChildren: any[] = [];
                    blockToken.children.forEach((child: any) => {
                        if (child.type !== 'text' || child.content.indexOf('||') === -1) {
                            newChildren.push(child);
                            return;
                        }
                        const text = child.content;
                        const regex = /\|\|([^|]+)\|\|/g;
                        let lastIndex = 0;
                        let match: RegExpExecArray | null;
                        while ((match = regex.exec(text)) !== null) {
                            if (match.index > lastIndex) {
                                const t = new state.Token('text', '', 0);
                                t.content = text.slice(lastIndex, match.index);
                                newChildren.push(t);
                            }
                            const open = new state.Token('spoiler_open', 'span', 1);
                            open.attrSet('class', 'spoiler');
                            const inner = new state.Token('text', '', 0);
                            inner.content = match[1];
                            const close = new state.Token('spoiler_close', 'span', -1);
                            newChildren.push(open, inner, close);
                            lastIndex = match.index + match[0].length;
                        }
                        if (lastIndex < text.length) {
                            const t = new state.Token('text', '', 0);
                            t.content = text.slice(lastIndex);
                            newChildren.push(t);
                        }
                    });
                    blockToken.children = newChildren;
                });
                return false;
            });

            md.renderer.rules.spoiler_open = () => '<span class="spoiler">';
            md.renderer.rules.spoiler_close = () => '</span>';
        }
    },
    {
        // Wrap tables in a scroll container for responsiveness
        plugin: (md: any) => {
            const originalTableOpen = md.renderer.rules.table_open || (() => '<table>');
            const originalTableClose = md.renderer.rules.table_close || (() => '</table>');
            md.renderer.rules.table_open = (tokens: any[], idx: number, options: any, env: any, self: any) => {
                return '<div class="table-responsive">' + originalTableOpen(tokens, idx, options, env, self);
            };
            md.renderer.rules.table_close = (tokens: any[], idx: number, options: any, env: any, self: any) => {
                return originalTableClose(tokens, idx, options, env, self) + '</div>';
            };
        }
    }
];

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
    <main class="post-page">
        <article class="post" v-if="post">
            <div class="post__header">                
                <h2 class="post__title"><span class="post__emoji">{{ post.emoji }}</span> {{ isLangRu ? post.title_ru : post.title }}</h2>
                <div class="post__lang" v-if="post.content_ru && post.content" @click="isLangRu = !isLangRu">{{
                    isLangRu ? '🇷🇺' : '🇺🇸' }}</div>
            </div>
            <div class="post__info">
                <div class="post__date">{{ moment(post.date).format('LL') }}</div>
                <div class="post__tag-list">
                    <div class="post-tag hidden" v-if="Number(post.status) === 0" :style="{ '--index': 0 }">🔒
                        Hidden</div>
                    <router-link class="post-tag" v-for="(tag, index) in post.tags" :key="tag"
                        :style="{ '--index': index + 1, ...getTagStyle(tag) }" :title="tagMeta[tag]?.description || ''"
                        :to="{ name: 'posts', query: { t: tag } }">
                        {{ tag }}
                    </router-link>
                </div>
            </div>
            <div class="post__content-wrapper" ref="mdContainer">
                <Markdown class="post__content" :source="isLangRu ? post.content_ru : post.content"
                    :plugins="markdownPlugins" :linkify="true" />
            </div>
            <div v-if="viewerActive" class="post__viewer-overlay">
                <div class="post__viewer-overlay__title">{{ currentImageMeta.title }}</div>
                <div class="post__viewer-overlay__date">{{ currentImageMeta.date }}</div>
                <div class="post__viewer-overlay__description" v-if="currentImageMeta.description">{{ currentImageMeta.description }}</div>
            </div>
            <div v-if="viewerActive && imageCount > 1" class="post__viewer-nav" @click.stop>
                <button class="post__viewer-nav__btn post__viewer-nav__btn--prev" @click.stop="goPrevImage" aria-label="Previous image" title="Previous">
                    ❮
                </button>
                <button class="post__viewer-nav__btn post__viewer-nav__btn--next" @click.stop="goNextImage" aria-label="Next image" title="Next">
                    ❯
                </button>
            </div>
            <div class="post__edit-tools button-list" v-if="isLoggedIn()">
                <button @click="$router.push(`/post/edit/${postId}`)">Edit</button>
            </div>
            <div class="post__neighbors">
                <router-link
                    v-if="neighbors.previous"
                    class="post__neighbor post__neighbor--previous"
                    :to="getPostUrl(neighbors.previous)"
                >
                    <div class="post__neighbor__marker">{{ "❮" }}</div>
                    <div class="post__neighbor__emoji">{{ neighbors.previous.emoji }}</div>
                    <div class="post__neighbor__info">
                        <div class="post__neighbor__title">{{ neighbors.previous.title }}</div>
                        <div class="post__neighbor__date">{{ moment(neighbors.previous.date).format('MMM DD, YYYY')}}
                        </div>
                    </div>
                </router-link>
                <router-link
                    v-if="neighbors.next"
                    class="post__neighbor post__neighbor--next"
                    :to="getPostUrl(neighbors.next)"
                >
                    <div class="post__neighbor__emoji">{{ neighbors.next.emoji }}</div>
                    <div class="post__neighbor__info">
                        <div class="post__neighbor__title">{{ neighbors.next.title }}</div>
                        <div class="post__neighbor__date">{{ moment(neighbors.next.date).format('MMM DD, YYYY') }}
                        </div>
                    </div>
                    <div class="post__neighbor__marker">{{ "❯" }}</div>
                </router-link>
            </div>
        </article>
    </main>
</template>

<style lang="scss">
.post-page .post {
    display: grid;
    gap: 1rem;

    &__header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: .5rem;
    }

    &__lang {
        cursor: pointer;
        font-size: 1.5rem;

        animation: opacity-in 0.5s forwards;
    }

    .post-tag {
        opacity: 0;
        animation: from-bottom 0.5s forwards;
        animation-delay: calc(0.1s + 0.1s * var(--index));
        text-decoration: none;
    }

    &__info {
        display: flex;
        justify-content: space-between;
    }

    &__title {
        color: var(--clr-accent);
        font-size: 2rem;

        animation: from-left 0.5s forwards;
    }

    &__emoji {
        font-size: 2rem;
        translate: 0 -2px;

        animation: from-left 0.5s forwards;
    }

    &__tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
        align-items: center;
    }

    &__date {
        color: var(--clr-muted);

        opacity: 0;
        animation: from-left 0.5s forwards 0.1s;
    }

    &__neighbors {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;

        @media (width < 540px) {
            grid-template-columns: 1fr;

            &>* {
                grid-column: 1 !important;
            }
        }
    }

    &__neighbor {
        cursor: pointer;
        display: grid;
        gap: .25rem;
        align-items: center;
        grid-template-columns: min-content min-content auto;
        text-decoration: none;

        transition: background-color 0.2s ease, border 0.2s ease;
        border: 1px solid transparent;
        padding: 0.5rem;

        opacity: 0;
        animation: from-bottom 0.5s forwards 0.3s;

        &:hover {

            background-color: var(--clr-bg);
            border: 1px solid var(--clr-border);
            border-radius: 0.3rem;

            .post__neighbor__title,
            .post__neighbor__marker {
                color: var(--clr-accent);
            }
        }

        &__title,
        &__marker {
            transition: color 0.2s ease;
        }

        &__date {
            font-size: 0.9rem;
            color: var(--clr-muted);
        }

        &__emoji {
            font-size: 1.5rem;
            translate: 0 -2px;
        }

        &--next {
            grid-template-columns: min-content auto min-content;
            grid-column: 2;
            animation: from-bottom 0.5s forwards 0.4s;
        }
    }

    &__content {
        display: grid;
        gap: 1rem;
        line-height: 1.6;

        opacity: 0;
        animation: from-bottom 0.5s forwards 0.2s;

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            color: var(--clr-accent);
            line-height: 1;

            &:not(:first-child) {
                margin-top: 1.5rem;
            }
        }

        h2 {
            font-size: 1.25rem;
        }

        img {
            width: 100%;
            cursor: zoom-in;
        }

        p:has(img + img) {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;

            img {
                width: auto;
                height: 200px;
            }

            @media (width < 500px) {
                img {
                    width: 100%;
                    height: auto;
                }
            }
        }

        pre {
            background-color: hsl(0, 0%, 12%);
            padding: 1rem;
            border-radius: 0.25rem;
            overflow-x: auto;
        }

        code {
            font-family: monospace;

            &>* {
                font-family: inherit;
            }
        }

        .hljs {
            &-attr {
                color: hsl(220, 54%, 51%);
            }

            &-number {
                color: var(--clr-accent);
            }

            &-addition {
                color: var(--clr-accent);
                background-color: var(--clr-accent-bg);
            }

            &-deletion {
                color: hsl(0, 51%, 52%);
                background-color: hsla(0, 100%, 50%, 0.1);
            }
        }

        .table-responsive {
            width: 100%;
            margin: 1rem 0;
            overflow-x: auto;
            
            & > table {
                border-collapse: collapse;
                width: max-content; // allow table to be as wide as content
                min-width: 100%; // but at least fill container
            }

            th,
            td {
                border: 1px solid var(--clr-muted);
                padding: 0.5rem;
                vertical-align: top;
                background-clip: padding-box;
                white-space: nowrap; // prevent overly tall rows; long text can wrap with .wrap class
            }

            th {
                background-color: hsl(0, 0%, 12%);
                color: var(--clr-accent);
                position: sticky;
                top: 0; // if table taller than viewport when scrolled inside container horizontally
                z-index: 1;
            }

            .wrap { white-space: normal; }
        }

        p {
            text-align: justify;
            color: inherit;
        }

        blockquote {
            border-left: 4px solid var(--clr-accent);
            padding-left: 1rem;
            background-image: linear-gradient(to right, var(--clr-accent-bg), transparent);
            color: var(--clr-muted);
            font-style: italic;
            margin-left: 0;
        }

        .spoiler {
            background-color: var(--clr-muted);
            color: var(--clr-muted);
            padding-inline: 0.1rem;

            &:hover {
                color: var(--clr-text);
            }
        }

        ul,
        ol {
            display: grid;
            gap: 0.5rem;
            list-style: square;
            margin-left: 1rem;

            li {
                text-align: justify;

                &::marker {
                    color: var(--clr-accent) !important;
                }

                &:has(input[type="checkbox"]) {
                    input[type="checkbox"] {
                        display: none;
                    }

                    padding-left: 0.5rem;

                    &::marker {
                        content: '✘';
                        color: rgb(154, 47, 47) !important;
                    }
                }

                &:has(input[type="checkbox"]:checked) {
                    text-decoration: line-through;
                    color: var(--clr-muted);

                    &::marker {
                        content: '✔';
                        color: var(--clr-accent) !important;
                    }
                }
            }
        }
    }

    &__viewer-overlay {
        position: fixed;
        left: 50%;
        bottom: 1rem;
        transform: translateX(-50%);
        z-index: 3000; 
        background: var(--clr-bg);
        border: 1px solid var(--clr-border);
        border-radius: .3rem;
        padding: 1rem;
        width: min(90vw, 400px);

        display: grid;
        grid-template-columns: 1fr auto;
        gap: .5rem;

        &__title {
            font-weight: bold;
            color: var(--clr-accent);
        }

        &__date {
            font-size: .85rem;
            color: var(--clr-muted);
        }

        &__description {
            grid-column: 1 / -1;
        }
    }

    &__viewer-nav {
        position: fixed;
        inset: 0;
        z-index: 3000;
        pointer-events: none; 

        &__btn {
            pointer-events: auto;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 4rem;
            height: 4rem;
            display: grid;
            place-items: center;
            background: var(--clr-bg);
            border: 1px solid var(--clr-border);
            border-radius: 999px;
            font-size: 1.25rem;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease;

            &:hover {
                border-color: var(--clr-accent);
                color: var(--clr-accent);
            }

            &--prev { left: .5rem; }
            &--next { right: .5rem; }
        }
    }
}

.viewer-backdrop {
    backdrop-filter: blur(4px);
}
</style>
