<template>
  <div
    v-if="user.RoleName == 'Admin' || user.RoleName == 'Manager'"
    class="row"
  >
    <AdminNavigate class="col-1"></AdminNavigate>
    <div
      class="col custom-scroll"
      style="height: 100vh; overflow-y: auto; padding: 0"
    >
      <router-view></router-view>
    </div>
  </div>
  <div v-else>
    <Sign_In_And_Out></Sign_In_And_Out>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import AdminNavigate from './components/AdminNavigate.vue';
import Sign_In_And_Out from './views/Sign_In_And_Out.vue';
const user = ref({});
const fetchUser = () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (userData) {
    console.log(userData);
    user.value = userData;
  }
};

onMounted(() => {
  fetchUser();
});
</script>

<style scoped>
.row {
  overflow: hidden;
  max-width: 99vw;
  padding: 0;
  background-color: #f5f7f8;
}

/* Áp dụng cho phần tử có cuộn */

/* Kích thước thanh cuộn */
.custom-scroll::-webkit-scrollbar {
  width: 8px; /* chiều rộng thanh cuộn dọc */
  height: 8px; /* chiều cao thanh cuộn ngang */
}

/* Phần track (nền của thanh cuộn) */
.custom-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

/* Phần thumb (thanh kéo) */
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
  border: 2px solid #f1f1f1; /* tạo khoảng cách */
}

/* Khi hover vào thumb */
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
