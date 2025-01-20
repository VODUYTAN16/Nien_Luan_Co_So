<template>
  <div class="container py-5">
    <div class="row">
      <div
        class="col-xl-3 col-md-6 col-lg-4 tour-item"
        v-for="(item, index) in tours.filter((tour) => tour.IsDeleted == 0)"
        :key="index"
      >
        <router-link :to="`/TourDetail/${item.TourID}`">
          <Card_Tour :Tour="item"></Card_Tour>
        </router-link>
        <button
          class="btn btn-link text-danger p-0 mt-2"
          @click="deleteTour(item.TourID)"
        >
          <i class="bx bxs-x-square fs-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import Card_Tour from './Card_Tour.vue';
import axios from 'axios';

const tours = ref([]);
const props = defineProps({});

const fetchTours = async () => {
  try {
    const response = await axios.get(`/api/tour`);
    console.log(response.data);
    tours.value = response.data.reverse();
  } catch (error) {
    console.error('Error fetching tour:', error);
  }
};

async function deleteTour(tourID) {
  try {
    // Hiển thị thông báo xác nhận trước khi xóa
    const isConfirmed = confirm('Are you sure you want to delete this tour?');
    if (!isConfirmed) {
      console.log('Deletion canceled by user.');
      return;
    }

    // Gửi yêu cầu DELETE đến API
    const response = await axios.put(`/api/tour/${tourID}`);

    // Kiểm tra phản hồi từ API
    if (response.status === 200) {
      console.log(response.data.message);
      fetchTours();
    }
  } catch (error) {
    // Xử lý lỗi
    if (error.response) {
      // Lỗi từ phía server
      console.error(error.response.data.message);
      alert(error.response.data.message); // Hiển thị thông báo lỗi
    } else {
      // Lỗi không xác định (kết nối hoặc vấn đề khác)
      console.error('Error deleting blog:', error.message);
      alert('Something went wrong. Please try again later.');
    }
  }
}

onMounted(() => {
  fetchTours();
});
</script>

<style scoped>
a {
  background: none;
}

.tour-item {
  position: relative;
}

button {
  position: absolute;
  top: 20px;
  right: 20px;
}
</style>
