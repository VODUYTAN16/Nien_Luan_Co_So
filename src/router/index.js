import { createRouter, createWebHistory } from 'vue-router';
import AdminView from '@/views/AdminView.vue';
import AdminBookingView from '@/components/AdminBookingView.vue';
import AdminTourView from '@/components/AdminTourView.vue';
import AdminServiceView from '@/components/AdminServiceView.vue';
import AdminBlogView from '@/components/AdminBlogView.vue';
import TourDetail from '@/views/TourDetail.vue';
import BlogDetail from '@/components/BlogDetail.vue';
import FileViewer from '@/components/FileViewer.vue';
import Sign_In_And_Out from '@/views/Sign_In_And_Out.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AdminView,
    },
    { path: '/sign_in_and_out', component: Sign_In_And_Out },
    { path: '/booking', name: 'Booking', component: AdminBookingView },
    { path: '/service', name: 'Service', component: AdminServiceView },
    { path: '/tour', name: 'Tour', component: AdminTourView },
    { path: '/adminBlog', component: AdminBlogView },
    {
      path: '/TourDetail/:tourid',
      component: TourDetail,
    },
    { path: '/blogs/:id', component: BlogDetail },
    {
      path: '/view-file/:id', // Chúng ta sẽ truyền tham số fileId
      name: 'FileViewer',
      component: FileViewer,
    },
  ],
});

export default router;
