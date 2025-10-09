import type { Post } from "./types/Post";

export const getPostUrl = (post: Post) => {
    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const idHex = Number(post.id).toString(16).padStart(2, '0').toLowerCase();
    return `/post/${idHex}/${slug}`;
}

export const isLoggedIn = () => {
    return !!localStorage.getItem('enkadaDevAuthToken');
};

// Converts number of bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
