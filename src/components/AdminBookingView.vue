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
      <form class="row">
        <div class="input-group mb-3 col">
          <span class="input-group-text" id="basic-addon1">Start Date</span>
          <VDatePicker v-model="Filter.StartDate">
            <template #default="{ inputValue, inputEvents }">
              <input
                class="form-control"
                :value="inputValue"
                v-on="inputEvents"
              />
            </template>
          </VDatePicker>
        </div>
        <div class="input-group mb-3 col">
          <span class="input-group-text" id="basic-addon1">End Date</span>
          <VDatePicker v-model="Filter.EndDate">
            <template #default="{ inputValue, inputEvents }">
              <input
                class="form-control"
                :value="inputValue"
                v-on="inputEvents"
              />
            </template>
          </VDatePicker>
        </div>
        <div class="form-floating col">
          <select
            v-model="Filter.TourID"
            class="form-select"
            id="floatingSelect"
            aria-label="Floating label select example"
          >
            <option value="-1">All</option>
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
            v-model="Filter.Status"
          >
            <option selected>All</option>
            <option value="Pending">Pending</option>
            <option value="Booked">Booked</option>
            <option value="Cancel">Cancel</option>
          </select>
          <label for="floatingSelect">Status</label>
        </div>
      </form>
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
          <tr v-for="(item, index) in filter(Filter)" :key="index">
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
import { useScreens } from 'vue-screen-utils';

const { mapCurrent } = useScreens({
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
});
const columns = mapCurrent({ lg: 2 }, 1);
const expanded = mapCurrent({ lg: false }, true);
const selectedColor = ref('blue');

const Filter = reactive({
  StartDate: '',
  EndDate: '',
  TourID: '',
  Status: '',
});

const currentStep = ref(1);
const tours = ref([]);

const goNext = () => {
  if (currentStep.value < 2) currentStep.value++;
};

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

var bookings = reactive([]); // Save current bookings
const tourNameList = ref([]); // Save current tour name list

const filter = (Filter) => {
  console.log(Filter);
  return bookings.filter((booking) => {
    return (
      (!Filter.TourID ||
        Filter.TourID == -1 ||
        booking.TourID == Filter.TourID) &&
      (!Filter.Status ||
        Filter.Status == 'All' ||
        booking.Status == Filter.Status) &&
      (!Filter.StartDate ||
        new Date(booking.StartDate) >= new Date(Filter.StartDate)) &&
      (!Filter.EndDate || new Date(booking.EndDate) <= new Date(Filter.EndDate))
    );
  });
};

const fetchBookings = async () => {
  try {
    const response = await axios.get('api/booking');
    console.log(response.data);
    bookings = response.data.reverse();
    bookings.map((item) => {
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
        bookings.map((booking) => [
          booking.TourID,
          { TourID: booking.TourID, TourName: booking.TourName },
        ])
      ).values(),
    ];
  } catch (error) {
    console.log(error);
  }
};

const fetchTours = async () => {
  try {
    const response = await axios.get(`/api/tour`);
    console.log(response.data);
    tours.value = response.data.reverse();
  } catch (error) {
    console.error('Error fetching tour:', error);
  }
};

onMounted(() => {
  fetchBookings();
  fetchTours();
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

.adminBooking {
  background-color: #f5f7f8;
}

table {
  margin-top: 20px;
}
</style>
