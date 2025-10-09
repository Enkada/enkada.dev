<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Attachment } from '../types/Attachment';
import axios from 'axios';
import { formatBytes } from '../utils';
import { type Post } from '../types/Post';

// State
const attachments = ref<Attachment[]>([]);
const type = ref(0); // 0 - other, 1 - images, 2 - video
const selectedAttachment = ref<Attachment | null>(null);
const posts = ref<Post[]>([]);
const searchQuery = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

// Props
const props = defineProps<{
    post: Post
}>();

const authHeaders = () => {
    const token = localStorage.getItem('enkadaDevAuthToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchAttachments = async () => {
    try {
        const response = await axios.get('/attachment/list', { headers: { ...authHeaders() } });
        attachments.value = response.data;
    } catch (e) {
        console.error('Failed to fetch attachments', e);
    }
};

const fetchPosts = async () => {
    try {
        const response = await axios.get('/post/list', { headers: { ...authHeaders() } });
        posts.value = response.data;
    } catch (e) {
        console.error('Failed to fetch posts', e);
    }
};

onMounted(async () => {
    await Promise.all([fetchAttachments(), fetchPosts()]);
});

// Upload
const triggerAdd = () => {
    fileInputRef.value?.click();
};

const handleFileSelected = async (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('/attachment/add', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...authHeaders()
            }
        });
        // Push new attachment to list (API returns meta)
        attachments.value.unshift(response.data);
        input.value = '';
    } catch (e) {
        console.error('Upload failed', e);
    }
};

// Edit
const saveAttachment = async () => {
    if (!selectedAttachment.value) return;
    try {
        const { id, date, title, description } = selectedAttachment.value;
        await axios.put('/attachment/edit', { id, date, title, description }, { headers: { ...authHeaders() } });
        // After successful save, optionally refresh this item (cheap: re-fetch list)
        await fetchAttachments();
        // Keep selection but update reference
        selectedAttachment.value = attachments.value.find(a => a.id === id) || null;
    } catch (e) {
        console.error('Save failed', e);
    }
};

// Delete
const deleteAttachment = async (attachment: Attachment) => {
    if (!confirm(`Delete attachment ${attachment.filename}?`)) return;
    try {
        await axios.delete('/attachment/delete', { data: { id: attachment.id }, headers: { ...authHeaders() } });
        attachments.value = attachments.value.filter(a => a.id !== attachment.id);
        if (selectedAttachment.value?.id === attachment.id) {
            selectedAttachment.value = null;
        }
    } catch (e) {
        console.error('Delete failed', e);
    }
};

const copyLink = (attachment: Attachment) => {
    const link = attachment.type === 1 ? `![${attachment.title || props.post.title || ''}](${attachment.filename})` : `[](${attachment.filename})`;
    navigator.clipboard.writeText(link);
};

const dateForInput = computed({
    get: () => {
        if (selectedAttachment.value && selectedAttachment.value.date) {
            return new Date(selectedAttachment.value.date).toISOString().split('T')[0];
        }
        return '';
    },
    set: (value: string) => {
        if (selectedAttachment.value) {
            const date = new Date(value + 'T12:00:00.000Z');
            selectedAttachment.value.date = date.toISOString();
        }
    }
});

const isAttachmentUsed = (attachment: Attachment) => {
    return isAttachmentInContent(attachment) || posts.value.some(post =>
        post.content?.includes(attachment.filename) ||
        post.content_ru?.includes(attachment.filename));
};

const isAttachmentInContent = (attachment: Attachment) => {
    return props.post.content?.includes(attachment.filename) ||
        props.post.content_ru?.includes(attachment.filename);
};

const searchTest = (attachment: Attachment) => {
    const searchValue = searchQuery.value.toLowerCase().trim();
    if (!searchValue) return true;
    return attachment.filename.toLowerCase().includes(searchValue) ||
        attachment.original_name.toLowerCase().includes(searchValue) ||
        (attachment.title?.toLowerCase().includes(searchValue)) ||
        (attachment.description?.toLowerCase().includes(searchValue));
};
</script>

<template>
    <div class="attachment-settings">
        <input type="search" placeholder="Search" v-model="searchQuery"/>
        <div class="attachment-type">
            <label>
                <input type="radio" v-model="type" value="0" />
                Other ({{ attachments.filter(att => Number(att.type) === 0).length }})
            </label>
            <label>
                <input type="radio" v-model="type" value="1" />
                Images ({{ attachments.filter(att => Number(att.type) === 1).length }})
            </label>
            <label>
                <input type="radio" v-model="type" value="2" />
                Video ({{ attachments.filter(att => Number(att.type) === 2).length }})
            </label>
        </div>
        <button class="green" @click="triggerAdd">Add</button>
        <input type="file" hidden ref="fileInputRef" @change="handleFileSelected">
    </div>
    <div class="attachment-list" :class="['other', 'image', 'video'][type]">
        <div 
            class="attachment" 
            v-if="Number(type) === 0" 
            v-for="attachment in attachments
                .filter(att => Number(att.type) === 0 && searchTest(att))
                .sort((a, b) => Number(isAttachmentUsed(a)) - Number(isAttachmentUsed(b)))"
            :key="attachment.id"
        >
            <div class="attachment__used" v-if="isAttachmentUsed(attachment)">🔁</div>
            <img
                class="attachment__icon" 
                :src="`/icon/${['zip', 'rar', '7z'].includes((attachment.filename.split('.').pop() || '').toLowerCase()) ? 'zip.png' : 'txt.png'}`">
            <div class="attachment__filename">{{ attachment.filename }}</div>
            <div class="attachment__size">({{ formatBytes(Number(attachment.size)) }})</div>
            <div class="attachment__action-list">
                <div class="attachment__action" @click="copyLink(attachment)">📋</div>
                <div class="attachment__action" @click="deleteAttachment(attachment)">🗑️</div>
            </div>
        </div>
        <div 
            class="attachment" 
            :class="{ 'selected': selectedAttachment && selectedAttachment.id === attachment.id, 'used': isAttachmentUsed(attachment), 'in-content': isAttachmentInContent(attachment) }"
            v-if="Number(type) === 1" 
            v-for="attachment in attachments
                .filter(att => Number(att.type) === 1 && searchTest(att))
                .sort((a, b) => {
                    const aUsed = isAttachmentUsed(a);
                    const bUsed = isAttachmentUsed(b);
                    const aInContent = isAttachmentInContent(a);
                    const bInContent = isAttachmentInContent(b);
                    
                    // Priority: Unused (0) -> In Content (1) -> Used (2)
                    const getPriority = (used: boolean, inContent: boolean) => {
                        if (!used) return 0; // Unused
                        if (inContent) return 1; // In Content
                        return 2; // Used (but not in content)
                    };
                    
                    return getPriority(aUsed, aInContent) - getPriority(bUsed, bInContent);
                })"
            :key="attachment.id"
        >
            <div class="attachment__used" v-if="isAttachmentUsed(attachment)">🔁</div>
            <div class="attachment__in-content" v-if="isAttachmentInContent(attachment)">📃</div>
            <img class="attachment__image" v-if="Number(attachment.type) === 1" :src="`https://files.enkada.dev/www/${attachment.filename}`" />
            <div class="attachment__action-list">
                <div class="attachment__action" @click="copyLink(attachment)">📋</div>
                <div class="attachment__action" @click="selectedAttachment = attachment">✏️</div>
                <div class="attachment__action" @click="deleteAttachment(attachment)">🗑️</div>
            </div>
            <div class="attachment__editor" v-if="selectedAttachment && selectedAttachment.id === attachment.id">
                <div class="attachment__filename" :title="attachment.original_name">{{ attachment.filename }}</div>
                <div class="attachment__size">({{ formatBytes(Number(attachment.size)) }})</div>
                <input type="date" v-model="dateForInput" />
                <input type="text" v-model="selectedAttachment.title" placeholder="Title"/>
                <textarea v-model="selectedAttachment.description" placeholder="Description"></textarea>
                <div class="button-list">
                    <button @click="selectedAttachment = null">Close</button>
                    <button class="green" @click="saveAttachment">Save</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.attachment-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: .5rem;
    max-height: 50vh;
    overflow-y: auto;
    padding: 1px 0.5rem 0 0;

    .attachment {
        display: grid;
        border: 1px solid var(--clr-border);
        background-color: var(--clr-bg);
        border-radius: 0.3rem;
        padding: 0.3rem;
        position: relative;

        &__used {
            position: absolute;
            top: 0;
            z-index: 1;
        }

        &__in-content {
            position: absolute;
            top: 0;
            left: 1.5rem;
            z-index: 1;
        }
        
        &__action {
            cursor: pointer;

            &:hover {
                scale: 1.1;
            }
        }

        &__size {
            color: var(--clr-muted);
            font-size: 0.8rem;
        }
    }

    &.other .attachment {
        grid-template-columns: 1.5rem auto auto 1fr;
        align-items: center;
        gap: 0.3rem;

        &__action-list {
            margin-left: auto;
        }        
    }

    &.image {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));

        .attachment {
            align-items: center;
            gap: 0.5rem;

            &__editor {
                display: grid;
                gap: 0.5rem;
            }

            &.in-content {
                outline: 1px solid var(--clr-accent);
            }

            &.used:not(.selected, .in-content) {

                &:hover {
                    .attachment__image {
                        opacity: 1;
                        filter: brightness(70%);
                    }
                }
                
                .attachment__image {
                    opacity: 0.3;
                    filter: grayscale(50%);
                }
            }

            &:not(.selected):hover {
                .attachment__action-list {
                    opacity: 1;
                }

                .attachment__image {
                    filter: brightness(70%);
                }
            }

            &__image {
                transition: filter .3s ease, opacity .3s ease;
            }

            &__action-list {
                display: flex;
                gap: 0.5rem;
                padding: 0.5rem;
                border-radius: 2rem;
                justify-content: center;
                position: absolute;
                width: fit-content;
                left: 50%;
                bottom: 20%;
                translate: -50% 0;
                background-color: hsl(0, 0%, 0%, 0.5);
                opacity: 0;
                transition: opacity .3s ease;
            }  

            &.selected {
                grid-column: 1 / -1;
                grid-template-columns: 1fr 2fr;
            }
        }
    }
}

.attachment-settings {
    display: grid;
    gap: .5rem;
    align-items: center;
    grid-template-columns: auto auto 1fr;

    border-top: 1px solid var(--clr-border);
    margin-top: 1rem;
    padding-top: 1.5rem;

    button {
        margin-left: auto;
    }
}
</style>