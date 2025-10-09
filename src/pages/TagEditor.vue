<script setup lang="ts">
import axios from 'axios';
import { onMounted, ref, watch } from 'vue';
import type { Tag } from '../types/Tag';

type EditedTag = Tag & {
    isModified: boolean;
}

const tags = ref<EditedTag[]>([]);

const defaultBackground = '#145c4a';
const defaultForeground = '#FFFFFF';

onMounted(async () => {
    const token = localStorage.getItem('enkadaDevAuthToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get('/tag/list', { headers });
    tags.value = response.data;

    tags.value.forEach(tag => {
        tag.background = tag.background || defaultBackground;
        tag.foreground = tag.foreground || defaultForeground;
        tag.isModified = false;
    });
})

watch(
    tags,
    (newTags) => {
        newTags.forEach((tag) => {
            watch(
                () => [tag.description, tag.background, tag.foreground],
                () => {
                    tag.isModified = true;
                },
                { deep: true }
            );
        });
    },
    { immediate: true }
);

const saveTag = async (tag: EditedTag) => {
    try {
        const token = localStorage.getItem('enkadaDevAuthToken');
        if (!token) {
            alert('Authentication required');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const body: any = { name: tag.name };
        
        if (tag.description) body.description = tag.description;
        if (tag.background) body.background = tag.background;
        if (tag.foreground) body.foreground = tag.foreground;

        await axios.post('/tag/edit', body, { headers });
        
        tag.isModified = false;
    } catch (error) {
        console.error('Error saving tag:', error);
    }
}
</script>

<template>
    <main>
        <div class="tag-editor" :class="{ 'modified': tag.isModified }" v-for="tag in tags" :key="tag.id">
            <div class="tag-editor__count">{{ tag.count }}</div>
            <div class="tag-editor__name">
                <div class="post-tag" :style="{ backgroundColor: tag.background || defaultBackground, color: tag.foreground || defaultForeground }">{{ tag.name }}</div>
            </div>
            <input class="tag-editor__description" placeholder="Description" type="text" v-model="tag.description" />
            <input class="tag-editor__background" type="color" v-model="tag.background" />
            <input class="tag-editor__foreground" type="color" v-model="tag.foreground" />
            <button @click="saveTag(tag)">Save</button>
        </div>
    </main>
</template>

<style lang="scss" scoped>
main {
	display: grid;
	align-content: start;
    gap: 0.25rem;
}

.tag-editor {
    display: grid;
    grid-template-columns: 1rem 8rem 1fr min-content min-content min-content;
    align-items: center;
    padding: 0.5rem;
	gap: 1rem;

    &.modified {
        background-color: var(--clr-accent-bg);
        border: 1px solid var(--clr-accent);
    }

    .post-tag {
        width: fit-content;
        font-size: 1rem;
        justify-self: center;
    }

    &__count {
        color: var(--clr-muted);
        text-align: right;
        font-size: 0.875rem;
    }
}

</style>
