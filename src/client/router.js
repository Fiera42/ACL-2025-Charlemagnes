import {createRouter, createWebHistory} from 'vue-router';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import RegisterView from './views/RegisterView.vue';

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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    console.log('Guard:', { to: to.path, hasToken: !!token }); // Pour déboguer

    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.meta.hideForAuth && token) {
        next('/');
    } else {
        next();
    }
});

export default router;