<template>
  <div class="adminTour pb-5">
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
          Create Tour
        </li>
        <li
          class="breadcrumb-item px-2 rounded"
          :class="{ active: currentStep === 2 }"
          @click="goNext"
        >
          List Tour
        </li>
      </ol>
    </nav>
    <div v-if="currentStep == 1" class="createTour">
      <h2 class="text-center">Create Tour</h2>
      <form
        id="form"
        @submit.prevent="createTour(tourInf, dateForms, serviceForms)"
      >
        <h4>Tour Infomation</h4>
        <div class="tourInfo">
          <div class="row">
            <div class="col">
              <label for="tourName" class="form-label">Name of tour</label>
              <input
                type="text"
                id="tourName"
                class="form-control"
                placeholder="Your Anwer"
                v-model="tourInf.tourName"
              />
            </div>
            <div class="col mb-2">
              <label for="tourimg" class="form-label">Image of tour</label>
              <input
                type="file"
                id="tourimg"
                class="form-control"
                placeholder="Your Anwer"
                @change="handleImage"
              />
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div>
                <label for="price" class="form-label"> Price of tour </label>
                <input
                  type="number"
                  id="price"
                  class="form-control"
                  v-model="tourInf.price"
                  required
                  placeholder="$0"
                />
              </div>
              <div class="my-2">
                <label for="startLocation" class="form-label"
                  >Start Location</label
                >
                <input
                  id="startLocation"
                  type="text"
                  class="form-control"
                  placeholder="Your Answer"
                  required
                  v-model="tourInf.startLocation"
                />
              </div>
              <div>
                <label for="destination" class="form-label">Destination</label>
                <input
                  type="text"
                  id="destination"
                  class="form-control"
                  placeholder="Your Answer"
                  required
                  v-model="tourInf.destination"
                />
              </div>
            </div>
            <div class="col">
              <img
                class="rounded border border-4 order-light-subtle"
                :src="tourInf.image"
                alt=""
                style="height: 250px"
              />
            </div>
          </div>
          <div class="my-2">
            <label for="description" class="form-label"
              >Description of tour</label
            >
            <textarea
              id="description"
              class="form-control"
              v-model="tourInf.description"
              required
              placeholder="Description about some interesting of the tour"
            ></textarea>
          </div>
        </div>
        <hr />
        <div class="tourSchedule my-3">
          <h4>Tour Schedule</h4>
          <div class="row">
            <div
              v-for="(form, index) in dateForms"
              :key="index"
              class="mb-3 col-lg-6 col-sm-12"
            >
              <div class="d-flex">
                <div>
                  <VDatePicker
                    v-model="form.date"
                    is-range
                    timezone="UTC"
                    :min-date="new Date()"
                    :columns="columns"
                    :expanded="expanded"
                    :color="selectedColor"
                    borderless
                    is-required
                  >
                    <template #default="{ inputValue, inputEvents }">
                      <div
                        class="d-flex justify-content-center align-items-center"
                      >
                        <div class="input-group mb-3">
                          <span class="input-group-text">Start</span>
                          <input
                            :value="inputValue.start"
                            v-on="inputEvents.start"
                            type="text"
                            class="form-control"
                          />
                        </div>
                        <i class="bx bx-right-arrow-alt fs-3"></i>

                        <div class="input-group mb-3">
                          <span class="input-group-text">End</span>
                          <input
                            :value="inputValue.end"
                            v-on="inputEvents.end"
                            type="text"
                            class="form-control"
                          />
                        </div>
                      </div>
                    </template>
                  </VDatePicker>
                </div>
              </div>
              <div class="row">
                <div class="col-3">
                  <label for="capacity" class="form-label">Capacity</label>
                  <input
                    type="number"
                    class="form-control"
                    placeholder="Your Answer"
                    id="capacity"
                    v-model="form.capacity"
                    required
                  />
                </div>
                <div
                  class="col-1 d-flex justify-content-start align-items-end p-0"
                >
                  <button
                    type="button"
                    class="btn btn-danger me-2"
                    @click="removeForm(dateForms, index)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            style="max-width: 200px"
            type="button"
            class="btn btn-primary"
            @click="addForm(dateForms)"
          >
            ADD
          </button>
          <hr />
        </div>

        <div class="tourServices">
          <h4>Tour Services</h4>
          <div class="row">
            <div
              v-for="(service, index) in serviceForms"
              :key="index"
              class="col-lg-6 col-sm-12"
            >
              <div>
                <div class="row">
                  <div class="col">
                    <label for="servicename" class="form-label"
                      >Service Name</label
                    >
                    <select
                      v-model="service.serviceID"
                      class="form-select"
                      id="servicename"
                    >
                      <option
                        v-for="ser in services"
                        :key="ser.ServiceID"
                        :value="ser.ServiceID"
                      >
                        {{ ser.ServiceName }}
                      </option>
                    </select>
                  </div>
                  <div class="col-3">
                    <label for="status" class="form-label">Status</label>
                    <select
                      required
                      class="form-select"
                      aria-label="Default select example"
                      v-model="service.status"
                    >
                      <option value="Available">Available</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                </div>
                <div class="row my-2">
                  <div class="col-3">
                    <label for="availableSpot" class="form-label"
                      >Capacity</label
                    >
                    <input
                      type="number"
                      class="form-control"
                      required
                      placeholder="Your Answer"
                      id="availableSpot"
                      v-model="service.capacity"
                    />
                  </div>
                  <div
                    class="col-1 d-flex justify-content-start align-items-end p-0"
                  >
                    <button
                      type="button"
                      class="btn btn-danger me-2"
                      @click="removeForm(serviceForms, index)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            id="btn"
            class="btn btn-primary"
            @click="addForm(serviceForms)"
          >
            ADD
          </button>
          <hr />
        </div>

        <div class="text-end">
          <button type="submit" class="btn btn-primary btn-block my-3">
            Create Tour
          </button>
        </div>
      </form>
    </div>
    <div v-if="currentStep == 2" class="listTour">
      <TourSection></TourSection>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useScreens } from 'vue-screen-utils';
import TourSection from './TourSection.vue';
import axios from 'axios';
import { format } from 'date-fns';

const services = ref([]); // Lưu các services của tour

const range = ref({
  start: new Date(2020, 0, 6),
  end: new Date(2020, 0, 10),
});
const { mapCurrent } = useScreens({
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
});

const columns = mapCurrent({ lg: 2 }, 1);
const expanded = mapCurrent({ lg: false }, true);
const selectedColor = ref('blue');

const currentStep = ref(1);

const goNext = () => {
  if (currentStep.value < 2) currentStep.value++;
};

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const dateForms = reactive([{ date: {}, capacity: '' }]);
const serviceForms = reactive([{}]);
const tourInf = reactive({
  tourName: '',
  description: '',
  price: '',
  image: '',
  startLocation: '',
  destination: '',
});

const isObjectEmpty = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

const addForm = (form) => {
  console.log(form.length);
  if (form.length === 0 || !isObjectEmpty(form[form.length - 1])) {
    console.log(form);
    form.push({}); // Thêm đối tượng mới vào mảng
  }
};

// Hàm xóa form
const removeForm = (form, index) => {
  console.log(index);
  console.log(form[index]);

  // Xóa phần tử tại vị trí index
  form.splice(index, 1);
  console.log(form);

  // Kiểm tra nếu phần tử cuối cùng là rỗng thì xóa
  if (isObjectEmpty(form[form.length - 1])) {
    form.pop();
    console.log('Đã xóa phần tử rỗng cuối cùng:', form);
  }
};

const handleImage = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Chuyển đổi file sang Base64
    reader.onload = () => {
      tourInf.image = reader.result; // Gán Base64 cho imagePreview
      console.log(tourInf.image);
    };
    reader.onerror = (error) => {
      console.error('Lỗi khi đọc file:', error);
    };
  }
};

const createTour = async (tourInf, dateForms, serviceForms) => {
  try {
    dateForms.map((date) => {
      console.log(date.date);
      date.date.start = format(
        new Date(date.date.start),
        'yyyy-MM-dd HH:mm:ss'
      );
      date.date.end = format(new Date(date.date.end), 'yyyy-MM-dd HH:mm:ss');
    });

    const confirm = window.confirm('Are you sure you want to create new tour?');
    if (!confirm) {
      return;
    } else {
      const response = await axios.post('/api/create_tour', {
        tourInf,
        dateForms,
        serviceForms,
      });
      if (response.status != 200) {
        alert(response.data.message);
      }
      location.reload();
    }
  } catch (error) {
    console.error('Lỗi khi tạo tour:', error);
  }
};

const fetchTourService = async () => {
  try {
    const response = await axios.get(`/api/services`);
    console.log(response.data);
    services.value = response.data;
  } catch (error) {
    console.error('Error fetching Tour Detail:', error);
  }
};

onMounted(() => {
  fetchTourService();
});
</script>
<style scoped>
.adminTour {
  padding: 0 20px;
  background-color: #f5f7f8;
}
/* .form-control:invalid {
  border-color: red;
} */

.adminTour {
  overflow-y: auto; /* Hiển thị thanh cuộn dọc */
  overflow-x: hidden; /* Ẩn thanh cuộn ngang */
}

/* Tùy chỉnh thanh cuộn */
.adminTour::-webkit-scrollbar {
  width: 8px; /* Chiều rộng của thanh cuộn dọc */
}

.adminTour::-webkit-scrollbar-thumb {
  background-color: #888; /* Màu của thanh cuộn */
  border-radius: 4px; /* Bo góc thanh cuộn */
}

.adminTour::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* Màu của thanh cuộn khi hover */
}

.adminTour::-webkit-scrollbar-track {
  background: #f1f1f1; /* Màu nền của thanh cuộn */
}

#btn {
  margin-top: auto;
}

.breadcrumb .active {
  color: blue;
}
</style>
