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
      <form @submit.prevent="createTour">
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
                v-model="TourInf.tourName"
              />
            </div>
            <div class="col-3">
              <label for="price" class="form-label"> Price of tour </label>
              <input
                type="number"
                id="price"
                class="form-control"
                v-model="TourInf.price"
                required
                placeholder="Your Answer"
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
              v-model="TourInf.description"
              required
              placeholder="Description about some interesting of the tour"
            ></textarea>
          </div>
          <div class="row">
            <div class="col">
              <label for="startLocation" class="form-label"
                >Start Location</label
              >
              <input
                id="startLocation"
                type="text"
                class="form-control"
                placeholder="Your Answer"
                required
                v-model="TourInf.startLocation"
              />
            </div>
            <div class="col">
              <label for="destination" class="form-label">Destination</label>
              <input
                type="text"
                id="destination"
                class="form-control"
                placeholder="Destination"
                required
                v-model="TourInf.destination"
              />
            </div>
          </div>
        </div>

        <div class="tourSchedule my-3">
          <h4>Tour Schedule</h4>
          <div class="text-center row">
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
                    :min-date="new Date()"
                    :rules="rules"
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

                <div class="text-end">
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
              v-for="(service, index) in serviceForm"
              :key="index"
              class="col-lg-6 col-sm-12"
            >
              <div>
                <div class="row">
                  <div class="col">
                    <label for="servicename" class="form-label"
                      >Service Name</label
                    >
                    <input
                      type="text"
                      id="servicename"
                      class="form-control"
                      required
                      placeholder="Your Answer"
                      v-model="service.serviceName"
                    />
                  </div>
                  <div class="col-3">
                    <label for="status" class="form-label">Status</label>
                    <select
                      required
                      class="form-select"
                      aria-label="Default select example"
                      v-model="service.status"
                    >
                      <option selected>Select status of this service</option>
                      <option value="Availabel">Available</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                </div>
                <div class="row my-2">
                  <div class="col-3">
                    <label for="availableSpot" class="form-label"
                      >Availabel Spots</label
                    >
                    <input
                      type="number"
                      class="form-control"
                      required
                      id="availableSpot"
                      v-model="service.availableSpots"
                    />
                  </div>
                  <div
                    class="col-1 d-flex justify-content-start align-items-end p-0"
                    style="max-width: fit-content"
                  ></div>
                  <div
                    class="col-1 d-flex justify-content-start align-items-end p-0"
                  >
                    <button
                      type="button"
                      class="btn btn-danger me-2"
                      @click="removeForm(serviceForm, index)"
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
            @click="addForm(serviceForm)"
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
import { reactive, ref } from 'vue';
import { useScreens } from 'vue-screen-utils';
import TourSection from './TourSection.vue';

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

const dateForms = reactive([{}]); // Khởi tạo mảng chứa form đầu tiên
const serviceForm = reactive([{}]);

const TourInf = reactive({
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

const createTour = () => {};
</script>
<style scoped>
.adminTour {
  height: 100vh;
  padding: 0 20px;
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
