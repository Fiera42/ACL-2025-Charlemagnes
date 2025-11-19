import {createRouter, createWebHistory} from 'vue-router';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import RegisterView from './views/RegisterView.vue';
import ProfileView from './views/ProfileView.vue'; // <- ajout

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: {requiresAuth: true}
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: {hideForAuth: true}
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView,
        meta: {hideForAuth: true}
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
        meta: {requiresAuth: true}
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    console.log('Guard:', {to: to.path, hasToken: !!token});

    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.meta.hideForAuth && token) {
        next('/');
    } else {
        next();
    }
});

export default router;