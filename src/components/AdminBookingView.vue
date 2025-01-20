<template>
  <div class="adminBooking">
    <nav
      style="--bs-breadcrumb-divider: '|'"
      aria-label="breadcrumb"
      class="fs-4 my-2"
    >
      <ol class="breadcrumb fw-bold">
        <li
          class="breadcrumb-item px-2 rounded"
          :class="{ active: currentStep === 1 }"
          @click="goBack"
        >
          Booking
        </li>
        <li
          class="breadcrumb-item px-2 rounded"
          :class="{ active: currentStep === 2 }"
          @click="goNext"
        >
          List of participant of tour
        </li>
      </ol>
    </nav>
    <div v-if="currentStep == 1">
      <div class="row">
        <div class="input-group mb-3 col">
          <span class="input-group-text" id="basic-addon1">Start Date</span>
          <input
            type="text"
            class="form-control"
            aria-label="Username"
            aria-describedby="basic-addon1"
          />
        </div>
        <div class="input-group mb-3 col">
          <span class="input-group-text" id="basic-addon1">End Date</span>
          <input
            type="text"
            class="form-control"
            aria-label="Username"
            aria-describedby="basic-addon1"
          />
        </div>
        <div class="form-floating col">
          <select
            class="form-select"
            id="floatingSelect"
            aria-label="Floating label select example"
          >
            <option
              v-for="(item, index) in tourNameList"
              :key="index"
              :value="item.TourID"
            >
              {{ item.TourName }}
            </option>
          </select>
          <label for="floatingSelect">Select Tour</label>
        </div>
        <div class="form-floating col-3">
          <select
            class="form-select"
            id="floatingSelect"
            aria-label="Floating label select example"
          >
            <option selected>All</option>
            <option value="1">Pending</option>
            <option value="2">Booked</option>
            <option value="3">Cancel</option>
          </select>
          <label for="floatingSelect">Status</label>
        </div>
      </div>
      <table class="table table-striped table-bordered table-hover table-sm">
        <thead class="table-light">
          <tr>
            <th class="fw-bold">#</th>
            <th class="fw-bold">Tour</th>
            <th class="fw-bold">Start Date</th>
            <th class="fw-bold">End Date</th>
            <th class="fw-bold">Quantity</th>
            <th class="fw-bold">Status</th>
            <th class="fw-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in bookings.filter(
              (booking) => booking.IsDeleted === 0
            )"
            :key="index"
          >
            <td>{{ index + 1 }}</td>
            <td>{{ item.TourName }}</td>
            <td>{{ item.StartDate }}</td>
            <td>{{ item.EndDate }}</td>
            <td>{{ item.NumberOfGuests }}</td>
            <td>{{ item.Status }}</td>
            <td>
              <button class="btn btn-sm btn-outline-success">Detail</button>
              <button class="btn btn-sm btn-outline-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const currentStep = ref(1);

const goNext = () => {
  if (currentStep.value < 2) currentStep.value++;
};

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const bookings = ref([]);
const tourNameList = ref([]);

const fetchBookings = async () => {
  try {
    const response = await axios.get('api/booking');
    console.log(response.data);
    bookings.value = response.data.reverse();
    bookings.value.map((item) => {
      item.StartDate = new Date(item.StartDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      item.EndDate = new Date(item.EndDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });
    tourNameList.value = [
      ...new Map(
        bookings.value.map((booking) => [
          booking.TourID,
          { TourID: booking.TourID, TourName: booking.TourName },
        ])
      ).values(),
    ];
    console.log(tourNameList.value);
  } catch (error) {
    console.log(error);
  }
};

onMounted(() => {
  fetchBookings();
});
</script>

<style scoped>
/* .adminBooking {
  background-color: brown;
  height: 100vh;
  width: 100vw;
} */
.breadcrumb .active {
  color: blue;
}

table {
  margin-top: 20px;
}
</style>
