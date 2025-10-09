<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import type { Post } from '../types/Post';
import moment from 'moment';
import { getPostUrl } from '../utils';
import AttachmentList from '../components/AttachmentList.vue';

const props = defineProps<{
    id: string
}>();

const isNewMode = ref(false);
const isLangRu = ref(false);
const post = ref<Post>({
    id: -1,
    title: '',
    title_ru: '',
    date: new Date().toISOString(),
    content: '',
    content_ru: '',
    emoji: '',
    tags: ['Diary'],
    status: 1
});
const router = useRouter();

const tags = computed({
    get: () => post.value.tags.join(', '),
    set: (value: string) => {
        post.value.tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
});

const savePost = async () => {
    // PUT /post/edit
    // allowed = ['date','emoji','title','content','title_ru','content_ru','tags','status']
    const token = localStorage.getItem('enkadaDevAuthToken');
    const response = await axios.put(`/post/edit`, {
        id: post.value.id,
        date: post.value.date,
        emoji: post.value.emoji,
        title: post.value.title,
        content: post.value.content,
        title_ru: post.value.title_ru,
        content_ru: post.value.content_ru,
        tags: post.value.tags,
        status: Number(post.value.status)
    }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});

    if (response.status === 200) {
        router.push(getPostUrl(post.value));
    }
};

const addPost = async () => {    
    // POST /post/add
    // date, emoji, title, content, title_ru, content_ru, tags, status
    const token = localStorage.getItem('enkadaDevAuthToken');
    const response = await axios.post('/post/add', {
        date: post.value.date,
        emoji: post.value.emoji,
        title: post.value.title,
        content: post.value.content,
        title_ru: post.value.title_ru,
        content_ru: post.value.content_ru,
        tags: post.value.tags,
        status: Number(post.value.status)
    }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});

    if (response.status === 201) {
        post.value.id = response.data.id;
        router.push(getPostUrl(post.value));
    }
};

const deletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    // DELETE /post/delete/:id
    const token = localStorage.getItem('enkadaDevAuthToken');
    const response = await axios.delete(`/post/delete`, {
        data: { id: post.value.id },
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    });

    if (response.status === 200) {
        router.push('/posts');
    }
};

// Computed property to handle date conversion for date input
const dateForInput = computed({
    get: () => {
        // Convert ISO date to YYYY-MM-DD format for date input
        return new Date(post.value.date).toISOString().split('T')[0];
    },
    set: (value: string) => {
        // Convert YYYY-MM-DD back to ISO format
        const date = new Date(value + 'T12:00:00.000Z'); // Use noon UTC to avoid timezone issues
        post.value.date = date.toISOString();
    }
});

onMounted(async () => {
    isNewMode.value = props.id === 'new';
    const token = localStorage.getItem('enkadaDevAuthToken');

    if (!isNewMode.value) {
        const response = await axios.get(`/post/content/${props.id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        post.value = response.data;
        tags.value = post.value.tags.join(', ');
    }
});
</script>

<template>
    <main>
        <h2>{{ isNewMode ? 'New Post' : 'Edit Post' }}</h2>
        <div class="post-editor">
            <div class="post-editor__header">
                <input type="text" class="post-editor__emoji" v-model="post.emoji" placeholder="☺︎" />
                <input type="text" class="post-editor__title" v-if="!isLangRu" v-model="post.title"
                    placeholder="Title" />
                <input type="text" class="post-editor__title lang-ru" v-if="isLangRu" v-model="post.title_ru"
                    placeholder="Заголовок" />
                <div class="post-editor__lang" :class="{ 'has-lang-ru': post.content_ru && post.title_ru }"
                    @click="isLangRu = !isLangRu">{{ isLangRu ? '🇷🇺' : '🇺🇸' }}</div>
            </div>
            <div class="post-editor__row">
                <input type="date" class="post-editor__date" v-model="dateForInput" />
                <label>
                    <input type="checkbox" v-model="post.status" true-value="1" false-value="0" />
                    Active
                </label>
                <div class="post-editor__extra-dates" v-if="!isNewMode">
                    <div>Created: {{ moment(post.createdate).format('DD.MM.YYYY HH:mm:ss') }}</div>
                    <div>Updated: {{ moment(post.updatedate).format('DD.MM.YYYY HH:mm:ss') }}</div>
                </div>
            </div>
            
            <div class="post-editor__tags">
                <input type="text" class="post-editor__tags-input" v-model="tags" placeholder="tag1, tag2" />
                <div class="post-editor__tag-list">
                    <div class="post-tag" v-for="tag in tags.split(',').map(t => t.trim())" :key="tag">{{ tag }}</div>
                </div>
            </div>
            <textarea class="post-editor__content" v-if="!isLangRu" v-model="post.content"
                placeholder="Content"></textarea>
            <textarea class="post-editor__content lang-ru" v-if="isLangRu" v-model="post.content_ru"
                placeholder="Контент"></textarea>
            <AttachmentList :post="post"/>
            <div class="button-list">
                <button @click="$router.back()">Cancel</button>
                <button class="red" @click="deletePost" v-if="!isNewMode">Delete</button>
                <button 
                    class="green" 
                    :disabled="(!post.content && !post.content_ru) || (!post.title && !post.title_ru) || !post.date || !post.emoji"
                    @click="isNewMode ? addPost() : savePost()"
                >{{ isNewMode ? 'Create' : 'Save' }}</button>
            </div>
        </div>
    </main>
</template>

<style lang="scss" scoped>
main {
    display: grid;
    align-content: start;
    gap: 0.5rem;

    h2 {
        font-size: 1.5rem;
    }
}

.lang-ru {
    border-image: linear-gradient(to bottom, hsl(0, 0%, 83%), hsl(220, 54%, 51%), hsl(0, 46%, 39%)) 1;
    background-image: linear-gradient(to bottom, hsl(0, 0%, 83%, 0.1), hsl(220, 54%, 51%, 0.1), hsl(0, 46%, 39%, 0.1));
}

.post-editor {
    display: grid;
    gap: 0.5rem;

    &__row {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    &__header {
        display: grid;
        grid-template-columns: 4rem 1fr auto;
        align-items: center;
        gap: 0.5rem;
    }

    &__lang {
        cursor: pointer;
        padding-inline: 0.25rem;
        translate: 0 -2px;

        &::after {
            position: absolute;
            content: ' ✘';
            color: rgb(149, 54, 54);
            translate: 0 8px;
        }

        &.has-lang-ru {
            position: relative;

            &::after {
                position: absolute;
                content: ' ✔';
                color: var(--clr-accent);
            }
        }
    }

    &__tags {
        display: grid;
        align-items: center;
        gap: 1rem;
        grid-template-columns: 1fr 1fr;
    }

    &__tag-list {
        display: flex;
        gap: 0.5rem;
    }

    &__extra-dates {
        text-align: right;
        margin-left: auto;

        &>div {
            font-family: monospace;
            color: var(--clr-muted);
            font-size: 0.8rem;
        }
    }
}
</style>
