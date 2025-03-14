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
        <div class="nav-button">
          <button
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#staticBackdrop"
            class="btn btn-link text-success p-0 mt-2"
            @click="editTour(item.TourID)"
          >
            <i class="bx bxs-comment-edit fs-2"></i>
          </button>
          <button
            class="btn btn-link text-danger p-0 mt-2"
            @click="deleteTour(item.TourID)"
          >
            <i class="bx bxs-x-square fs-2"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      class="modal fade"
      id="staticBackdrop"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="staticBackdropLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="staticBackdropLabel"></h1>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <CreateTour
              :tourInf="infEditTour.tourInf"
              :dateForms="infEditTour.dateForms"
              :serviceForms="infEditTour.serviceForms"
              :itinerary="infEditTour.itinerary"
              :editable="true"
            ></CreateTour>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="
                saveEditTour(
                  infEditTour.tourInf,
                  infEditTour.dateForms,
                  infEditTour.serviceForms,
                  infEditTour.itinerary
                )
              "
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import Card_Tour from './Card_Tour.vue';
import CreateTour from './CreateTour.vue';
import axios from 'axios';
import { format } from 'date-fns';

const tours = ref([]);
let infEditTour = ref({
  dateForms: reactive([{ date: null, Capacity: '' }]),
  serviceForms: reactive([{}]),
  itinerary: reactive([{}]),
  tourInf: reactive({
    TourName: '',
    Description: '',
    Price: '',
    Duration: '',
    Img_Tour: '',
  }),
});

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
      alert('Delete Tour Successfully');
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

async function editTour(tourID) {
  try {
    const response = await axios.get(`/api/basis_inf/${tourID}`);
    infEditTour.value = response.data;
    console.log(infEditTour.value);
    console.log(response.data);
  } catch (err) {
    console.log('Error edit tour:', err);
  }
}

const saveEditTour = async (tourInf, dateForms, serviceForms, itinerary) => {
  console.log(tourInf, dateForms, serviceForms, itinerary);

  try {
    dateForms.map((date) => {
      date.date = format(new Date(date.date), 'yyyy-MM-dd HH:mm:ss');
    });

    const confirm = window.confirm(
      'Are you sure you want to save modification?'
    );
    if (!confirm) {
      return;
    } else {
      console.log(tourInf, dateForms, serviceForms, itinerary);
      const response = await axios.put('/api/edit_tour', {
        tourInf,
        dateForms,
        serviceForms,
        itinerary,
      });
      if (response.status != 200) {
        alert(response.data.message);
      }
      alert('Save Modification  Successfully');
      location.reload();
    }
  } catch (error) {
    alert('Can not modify because of appointments');
    console.error('Lỗi khi lưu chỉnh sửa tour:', error);
  }
};

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

.nav-button {
  position: absolute;
  top: 30px;
  right: 20px;
  background-color: white;
  border-radius: 10px;
  padding-inline: 5px;
}
</style>
