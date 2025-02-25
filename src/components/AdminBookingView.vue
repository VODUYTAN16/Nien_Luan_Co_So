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
      <div class="input-group mb-3 col">
        <span class="input-group-text">Tour Name</span>
        <input
          type="text"
          class="form-control"
          v-model="Filter.TourName"
          placeholder="Search by tour name"
        />
      </div>

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
              <!-- Button trigger modal -->
              <button
                type="button"
                class="btn btn-sm btn-outline-success"
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
                @click="
                  getDetailOfSpecificedBooking(item),
                    bookedServices(item.BookingID)
                "
              >
                Detail
              </button>
              <button
                class="btn btn-sm btn-outline-danger mx-2"
                @click="deleteBooking(item.BookingID)"
              >
                Delete
              </button>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-primary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Status
                </button>
                <ul class="dropdown-menu text-center">
                  <li
                    class="dropdown-items"
                    @click="changeStatus(item.BookingID, 'Pending')"
                  >
                    Pending
                  </li>
                  <li
                    class="dropdown-items"
                    @click="changeStatus(item.BookingID, 'Booked')"
                  >
                    Booked
                  </li>
                  <li
                    class="dropdown-items"
                    @click="changeStatus(item.BookingID, 'Paid')"
                  >
                    Paid
                  </li>
                  <li
                    class="dropdown-items"
                    @click="changeStatus(item.BookingID, 'Cancelled')"
                  >
                    Cancelled
                  </li>
                </ul>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="currentStep == 2">
      <ListOfPaticipantOfTour></ListOfPaticipantOfTour>
    </div>

    <!-- Modal -->
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5 text-primary" id="exampleModalLabel">
              DETAIL OF BOOKING
            </h1>

            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col">
                <h5 class="text-success">Info Of Tour</h5>
                <h6>Name of tour: {{ BookingDetail[0].TourName }}</h6>
                <h6>Start Location: {{ BookingDetail[0].StartLocation }}</h6>
                <h6>Destination: {{ BookingDetail[0].Destination }}</h6>

                <h6>
                  Start Date:
                  {{
                    new Date(BookingDetail[0].StartDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )
                  }}
                </h6>
                <h6>
                  End Date:
                  {{
                    new Date(BookingDetail[0].EndDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )
                  }}
                </h6>
              </div>
              <div class="col">
                <h5 class="text-success">Whose Booking</h5>
                <h6>FullName: {{ BookingDetail[0].FullName }}</h6>
                <h6>
                  Booking Date:
                  {{
                    new Date(BookingDetail[0].BookingDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )
                  }}
                </h6>
                <h6>
                  Number of participant: {{ BookingDetail[0].NumberOfGuests }}
                </h6>
                <h6>Total Amount: ${{ BookingDetail[0].TotalAmount }}</h6>
              </div>
              <div class="col">
                <h5 class="text-success">Booked Services</h5>
                <table
                  class="table table-striped table-bordered table-hover table-sm"
                >
                  <thead class="table-light">
                    <tr>
                      <th class="fw-bold">#</th>
                      <th class="fw-bold">Service</th>
                      <th class="fw-bold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(service, index) in bookServices" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>{{ service.ServiceName }}</td>
                      <td>{{ service.Quantity }}</td>
                    </tr>
                    <tr v-if="bookServices && bookServices.length === 0">
                      <td colspan="7" class="text-center">No data</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table
              class="table table-striped table-bordered table-hover table-sm"
            >
              <thead class="table-light">
                <tr>
                  <th class="fw-bold">#</th>
                  <th class="fw-bold">FullName</th>
                  <th class="fw-bold">Date of Birth</th>
                  <th class="fw-bold">Gender</th>
                  <th class="fw-bold">Email</th>
                  <th class="fw-bold">Phone Number</th>
                  <th class="fw-bold">Full Name on passport</th>
                  <th class="fw-bold">Passport number</th>
                  <th class="fw-bold">Nationality</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in BookingDetail" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.FullName }}</td>
                  <td>
                    {{
                      new Date(item.DateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    }}
                  </td>
                  <td>{{ item.Gender }}</td>
                  <td>{{ item.Email }}</td>
                  <td>{{ item.PhoneNumber }}</td>
                  <td>{{ item.FullNameOnPassport }}</td>
                  <td>{{ item.PassportNumber }}</td>
                  <td>{{ item.Nationality }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import { useScreens } from 'vue-screen-utils';
import ListOfPaticipantOfTour from './ListOfPaticipantOfTour.vue';

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
  TourName: '', // Thêm trường mới
  BookingID: '',
});

const currentStep = ref(1);
const BookingDetail = ref([{}]);
const bookServices = ref([{}]);

const goNext = () => {
  if (currentStep.value < 2) currentStep.value++;
};

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

var bookings = reactive([]); // Save current bookings
const tourNameList = ref([]); // Save current tour name list

const removeDiacritics = (str) => {
  return str
    .normalize('NFD') // Chuyển thành dạng Unicode tổ hợp
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
    .toLowerCase(); // Chuyển về chữ thường
};

const filter = (Filter) => {
  const query = removeDiacritics(Filter.TourName || '').trim();

  return bookings.filter((booking) => {
    const tourName = removeDiacritics(booking.TourName);

    // ✅ Kiểm tra nếu toàn bộ query nằm trong tên tour
    if (tourName.includes(query)) return true;

    // ✅ Tách query thành các từ nhỏ hơn
    const queryWords = query.split(' ');
    const tourWords = tourName.split(' ');

    // ✅ Kiểm tra nếu mọi từ trong query đều có trong tên tour
    const matchEachWord = queryWords.every((q) =>
      tourWords.some((word) => word.includes(q))
    );

    return (
      (!Filter.TourID ||
        Filter.TourID == -1 ||
        booking.TourID == Filter.TourID) &&
      (!Filter.Status ||
        Filter.Status == 'All' ||
        booking.Status == Filter.Status) &&
      (!Filter.StartDate ||
        new Date(booking.StartDate) >= new Date(Filter.StartDate)) &&
      (!Filter.EndDate ||
        new Date(booking.EndDate) <= new Date(Filter.EndDate)) &&
      (!Filter.TourName || matchEachWord) // Áp dụng lọc tên
    );
  });
};

const fetchBookings = async () => {
  try {
    const response = await axios.get('api/booking');
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

const getDetailOfSpecificedBooking = async (booking) => {
  try {
    const response = await axios.get(
      `/api/detail_booking/${booking.BookingID}`
    );
    BookingDetail.value = response.data;
  } catch (err) {
    console.log('err of getDetailOfSpecificedBooking', err);
  }
};

const bookedServices = async (bookingId) => {
  try {
    const response = await axios.get(`/api/booked_service/${bookingId}`);
    bookServices.value = response.data;
  } catch (error) {
    console.log('Error bookedServices', error);
  }
};

const changeStatus = async (bookingId, status) => {
  try {
    const isConfirmed = confirm(`Are you sure you want change to ${status} `);
    if (!isConfirmed) {
      console.log('Deletion canceled by user.');
      return;
    }

    const response = await axios.post(`/api/change_status`, {
      bookingId,
      status,
    });
    if (response.status == 200) {
      alert('Change status successfully');
    } else {
      alert('Change status failed');
    }

    fetchBookings();
  } catch (error) {
    console.log('Error changeStatus', error);
  }
};

const deleteBooking = async (bookingId) => {
  try {
    const isConfirmed = confirm(
      'Are you sure you want to delete this booking?'
    );
    if (!isConfirmed) {
      console.log('Deletion canceled by user.');
      return;
    }
    const response = await axios.put(`/api/delete_booking`, { bookingId });
    if (response.status == 200) {
      alert('Delete booking successfully');
    } else {
      alert('Delete booking failed');
    }
    fetchBookings();
  } catch (err) {
    console.log(`error deleteBooking: ${err}`);
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

.adminBooking {
  background-color: #f5f7f8;
}

table {
  margin-top: 20px;
}

.dropdown-items:hover {
  cursor: pointer;
  background-color: blue;
  color: white;
}
</style>
