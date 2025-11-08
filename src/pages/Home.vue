<script setup lang="ts">
import type { Post } from '../types/Post';
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { getPostUrl } from '../utils';
import moment from 'moment';
import type { Project } from '../types/Project';

const posts = ref<Post[]>([{
	id: -1,
	title: 'Sample Post',
	title_ru: '',
	emoji: '📓',
	date: new Date().toISOString(),
	tags: ['Diary'],
	status: 1,
	content: '',
	content_ru: ''
}]);
const lastPost = ref<Post | null>(null);
const projects = ref<Project[]>([]);

const tagMeta = ref<Record<string, { description?: string; background?: string; foreground?: string }>>({});

const getTagStyle = (name: string) => {
	const t = tagMeta.value[name];
	if (!t) return {};
	const style: Record<string, string> = {};
	if (t.background) style['background-color'] = t.background;
	if (t.foreground) style['color'] = t.foreground;
	return style;
}

onMounted(async () => {
	const token = localStorage.getItem('enkadaDevAuthToken');
	const headers = token ? { Authorization: `Bearer ${token}` } : {};
	const response = await axios.get('/post/list', { headers });
	posts.value = response.data;

	lastPost.value = posts.value ? posts.value.filter(a => Number(a.status) === 1)[0] : null;

	const tagResp = await axios.get('/tag/list', { headers });
	const list: Array<{ name: string; description?: string; background?: string; foreground?: string }> = tagResp.data;
	tagMeta.value = list.reduce((acc, t) => {
		acc[t.name] = {
			description: t.description,
			background: t.background,
			foreground: t.foreground,
		};
		return acc;
	}, {} as Record<string, { description?: string; background?: string; foreground?: string }>);

	const projectResponse = await axios.get('/project/list', { headers });
	projects.value = projectResponse.data;
})
</script>

<template>
	<main>
		<div class="section" :style="{ '--index': 0 }">
			<div class="section__header">What's this website?</div>
			<div class="section__content">
				<p>Welcome to my little corner of the Internet. It's a digital archive of me, my thoughts, reflections, and experiences.</p>
				<p>It's also a portfolio of projects of varying degrees of uselessness, that I've made over my programming journey.</p>
			</div>
		</div>
		<div class="section" :style="{ '--index': 1 }">
			<div class="section__header">Last Post</div>
			<div class="section__content" v-if="lastPost">
				<router-link class="post" :class="{ 'hidden': Number(lastPost.status) === 0 }"
					:to="getPostUrl(lastPost)">
					<div class="post__wrapper">
						<div class="post__header">
							<span class="post__emoji">{{ lastPost.emoji }}</span>
							<span class="post__title">{{ lastPost.title }}</span>
						</div>
						<div class="post__tag-list">
							<div
								class="post-tag"
								v-for="(tag, index) in lastPost.tags"
								:key="tag"
								:style="{ '--index': index + 1, ...getTagStyle(tag) }"
								:title="tagMeta[tag]?.description || ''"
							>
								{{ tag }}
							</div>
						</div>
					</div>
					<div class="post__date" :title="moment(lastPost.date).format('DD.MM.YYYY')">
						{{ moment(lastPost.date).format('MMM DD, YYYY') }}
					</div>
				</router-link>
			</div>
		</div>
		<div class="section" :style="{ '--index': 2 }">
			<div class="section__header">Projects</div>
			<div class="section__content project-list">
				<router-link class="project" v-for="(project, index) in projects" :key="project.id"
					:style="{ '--index': index }"
					:to="`/post/${project.post}`">
					<div class="project__image"
						:style="{ backgroundImage: `url(https://files.enkada.dev/www/${project.image})` }">
						<div class="project__title">{{ project.title }}</div>
						<div class="project__date">{{ moment(project.date).format('YYYY') }}</div>
					</div>
					<div class="project__description">{{ project.description }}</div>
					<div class="project__footer">
						<div class="project__tags">
							<img class="project__tag" v-for="tag in project.tags" :key="tag"
								:src="`/icon/${tag}.svg`" />
						</div>
						<a class="project__demo" :href="project.demo" @click.stop>Try it out</a>
					</div>
				</router-link>
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

.post {
    text-decoration: none;
    display: grid;
    align-items: center;
    grid-template-columns: 1fr auto;
    gap: .5rem;
    padding-block: .4rem;

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

	&:hover {
		background-color: hsl(0, 0%, 12%);
	}
}

.project-list {
	display: grid;
	gap: 1rem;
	grid-template-columns: 1fr 1fr;
	align-items: flex-start;

	@media (width <=720px) {
		grid-template-columns: 1fr;
	}
}

.project {
	background-color: var(--clr-bg);
	border-radius: 0.5rem;
	text-decoration: none;

	opacity: 0;
	animation: from-bottom 0.5s forwards;
	animation-delay: calc(0.1s + 0.1s * var(--index));

	&__description {
		padding: 1rem;
		color: var(--clr-muted);
		text-align: left;
	}

	&__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-block: 1rem;
		margin-inline: 1rem;
		border-top: 1px solid var(--clr-accent);
	}

	&__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	&__tag {
		width: 1rem;
	}

	&__image {
		aspect-ratio: 16 / 9;
		background-size: 100%;
		background-position: center;
		border-radius: 0.5rem;
		position: relative;
		overflow: hidden;

		transition: background-size 0.3s ease;

		&::before {
			content: "";
			position: absolute;
			inset: 0;
			background-color: hsla(0, 0%, 0%, 0.4);
			z-index: 1;
			pointer-events: none;

			transition: background-color 0.3s ease;
		}
	}

	&:hover {

		.project__image {
			background-size: 120%;

			&::before {
				background-color: hsla(0, 0%, 0%, 0.2);
			}
		}
	}

	&__title {
		position: absolute;
		bottom: 0;
		width: 100%;
		background-image: linear-gradient(to top, rgb(33, 45, 39), rgba(0, 0, 0, 0));
		padding-block: 0.5rem;
		text-shadow: 1px 1px 0px black;
		text-align: center;
		z-index: 2;
	}

	&__date {
		position: absolute;
		right: 0;
		margin: 0.5rem;
		padding: 0.1rem 0.2rem;
		border-radius: 0.3rem;
		z-index: 2;
		font-size: 0.75rem;
		background-color: var(--clr-accent-dark);
	}
}
</style>
