import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import Home from '../pages/Home.vue'
import Post from '../pages/Post.vue'
import PostList from '../pages/PostList.vue'
import About from '../pages/About.vue'
import Login from '../pages/Login.vue'
import EditPost from '../pages/EditPost.vue'
import NotFound from '../pages/NotFound.vue'
import TagEditor from '../pages/TagEditor.vue'
import Music from '../pages/Music.vue'
import Fumo from '../pages/Fumo.vue'

const routes: RouteRecordRaw[] = [
  { 
    path: '/', 
    name: 'home', 
    component: Home
  },
  { 
    path: '/post/:id/:slug', 
    name: 'post', 
    component: Post, 
    props: true
  },
  { 
    path: '/posts', 
    name: 'posts', 
    component: PostList,
    meta: { title: 'Posts' }
  },
  { 
    path: '/about', 
    name: 'about', 
    component: About,
    meta: { title: 'About' }
  },
  { 
    path: '/secret-login',
    name: 'login', 
    component: Login,
    meta: { layout: 'none' }
  },
  {
    path: '/post/edit/:id',
    name: 'edit-post',
    component: EditPost,
    props: true

  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  },
  {
    path: '/tag-editor',
    name: 'tag-editor',
    component: TagEditor
  },
  {
    path: '/music',
    name: 'music',
    component: Music
  },
  {
    path: '/fumo',
    name: 'fumo',
    component: Fumo
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Global after hook to set document title based on route meta
router.afterEach((to) => {
  const base = 'Enkada';
  const title = to.meta && (to.meta as any).title ? `${base} – ${(to.meta as any).title}` : base;
  if (typeof document !== 'undefined') document.title = title;
});

export default router
