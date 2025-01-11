import { createRouter, createWebHistory } from 'vue-router';
import AdminView from '@/views/AdminView.vue';
import AdminBookingView from '@/components/AdminBookingView.vue';
import AdminTourView from '@/components/AdminTourView.vue';
import AdminServiceView from '@/components/AdminServiceView.vue';
import AdminBlogView from '@/components/AdminBlogView.vue';
import TourDetail from '@/views/TourDetail.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AdminView,
    },
    { path: '/booking', name: 'Booking', component: AdminBookingView },
    { path: '/service', name: 'Service', component: AdminServiceView },
    { path: '/tour', name: 'Tour', component: AdminTourView },
    { path: '/adminBlog', component: AdminBlogView },
    {
      path: '/TourDetail/:tourid',
      component: TourDetail,
    },
  ],
});

export default router;
