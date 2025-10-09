export type Post = {
    id: number;
    createdate?: string;
    updatedate?: string;
    date: string;
    emoji: string;
    title: string;
    content: string;
    title_ru: string;
    content_ru: string;
    tags: string[];
    status: 0 | 1;
}