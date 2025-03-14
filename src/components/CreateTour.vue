<template>
  <div class="createTour">
    <h2 v-if="!editable" class="text-center">Create Tour</h2>
    <h2 v-else class="text-center">Modify Tour</h2>
    <form
      id="form"
      @submit.prevent="createTour(tourInf, dateForms, serviceForms, itinerary)"
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
              v-model="tourInf.TourName"
            />
          </div>
          <div class="col mb-2">
            <label for="tourimg" class="form-label">Image of tour</label>
            <input
              type="file"
              id="tourimg"
              class="form-control"
              placeholder="Your Anwer"
              @change="(event) => handleImage(event, props.tourInf, 'Img_Tour')"
            />
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="row">
              <div class="col">
                <label for="price" class="form-label"> Price of tour </label>
                <input
                  type="number"
                  id="price"
                  class="form-control"
                  v-model="tourInf.Price"
                  required
                  placeholder="$0"
                />
              </div>
              <div class="col">
                <label for="duration" class="form-label">Duration</label>
                <input
                  id="duration"
                  type="text"
                  class="form-control"
                  placeholder="Ex: 7 days"
                  required
                  v-model="tourInf.Duration"
                />
              </div>
            </div>

            <!-- <div>
              <label for="destination" class="form-label">Destination</label>
              <input
                type="text"
                id="destination"
                class="form-control"
                placeholder="Your Answer"
                required
                v-model="tourInf.Destination"
              />
            </div> -->
          </div>
          <div class="col">
            <img
              class="rounded border border-4 order-light-subtle"
              :src="tourInf.Img_Tour"
              alt="Image of Tour"
              style="height: 200px"
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
            v-model="tourInf.Description"
            required
            placeholder="Description about some interesting of the tour"
          ></textarea>
        </div>
      </div>
      <hr />
      <div class="itinerary">
        <div class="d-flex justify-content-between align-items-center">
          <h4>Itinerary</h4>
          <button
            type="button"
            id="btn"
            class="btn btn-primary"
            @click="addForm(props.itinerary)"
          >
            Add More
          </button>
        </div>

        <div class="row my-3">
          <div
            v-for="(item, index) in props.itinerary"
            :key="index"
            class="col-lg-6 col-sm-12 mb-4"
          >
            <div class="card p-3 shadow-sm">
              <div class="d-flex">
                <h5 class="text-primary mx-2">Day {{ item.DayNumber }}</h5>

                <button
                  type="button"
                  class="btn btn-danger me-2 mx-5"
                  @click="removeForm(props.itinerary, index)"
                >
                  Remove
                </button>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <label class="form-label">Day Number</label>
                  <input
                    type="number"
                    class="form-control"
                    v-model="item.DayNumber"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Image</label>
                  <input
                    type="file"
                    id="tourimg"
                    class="form-control"
                    placeholder="Your Anwer"
                    @change="(event) => handleImage(event, item, 'ImageUrl')"
                  />
                </div>
                <div class="row">
                  <div class="col">
                    <div class="mt-2">
                      <label class="form-label">Meals Included</label>
                      <input
                        type="text"
                        class="form-control"
                        v-model="item.MealsIncluded"
                      />
                    </div>

                    <div class="mt-2">
                      <label class="form-label">Activities</label>
                      <input
                        class="form-control"
                        rows="2"
                        v-model="item.Activities"
                      />
                    </div>

                    <div class="mt-2">
                      <label class="form-label">Location</label>
                      <input
                        type="text"
                        class="form-control"
                        v-model="item.Location"
                      />
                    </div>
                  </div>
                  <div class="col">
                    <img :src="item.ImageUrl" alt="" style="width: 250px" />
                  </div>
                </div>

                <div class="col-md-12 mt-2">
                  <label class="form-label">Description</label>
                  <textarea
                    type="text"
                    class="form-control"
                    v-model="item.Description"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr />
      <div class="tourSchedule my-3">
        <div class="d-flex">
          <h4>Tour Schedule</h4>
          <button
            style="max-width: 200px"
            type="button"
            class="btn btn-primary mx-3"
            @click="addForm(props.dateForms)"
          >
            Add More
          </button>
        </div>

        <div class="row my-3">
          <div
            v-for="(form, index) in props.dateForms"
            :key="index"
            class="mb-3 col-lg-6 col-sm-12"
          >
            <div class="d-flex">
              <div>
                <VDatePicker
                  v-model="form.date"
                  timezone="UTC"
                  :min-date="new Date()"
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
                          :value="inputValue"
                          v-on="inputEvents"
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
                  v-model="form.Capacity"
                  required
                />
              </div>
              <div
                class="col-1 d-flex justify-content-start align-items-end p-0"
              >
                <button
                  type="button"
                  class="btn btn-danger me-2"
                  @click="removeForm(props.dateForms, index)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        <hr />
      </div>

      <div class="tourServices">
        <div class="d-flex">
          <h4>Tour Services</h4>
          <button
            type="button"
            id="btn"
            class="btn btn-primary mx-3"
            @click="addForm(props.serviceForms)"
          >
            Add More
          </button>
        </div>
        <div class="row my-3">
          <div
            v-for="(service, index) in props.serviceForms"
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
                    v-model="service.ServiceID"
                    class="form-select"
                    id="servicename"
                  >
                    <option
                      v-for="ser in services.filter(
                        (service) => service.IsDeleted == 0
                      )"
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
                    v-model="service.Status"
                  >
                    <option value="Available">Available</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
              </div>
              <div class="row my-2">
                <div class="col-3">
                  <label for="availableSpot" class="form-label">Capacity</label>
                  <input
                    type="number"
                    class="form-control"
                    required
                    placeholder="Your Answer"
                    id="availableSpot"
                    v-model="service.Capacity"
                  />
                </div>
                <div
                  class="col-1 d-flex justify-content-start align-items-end p-0"
                >
                  <button
                    type="button"
                    class="btn btn-danger me-2"
                    @click="removeForm(props.serviceForms, index)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr />
      </div>

      <div v-if="!editable" class="text-end">
        <button type="submit" class="btn btn-primary btn-block my-3">
          Create Tour
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useScreens } from 'vue-screen-utils';
import TourSection from './TourSection.vue';
import axios from 'axios';
import { format } from 'date-fns';

const services = ref([]); // Lưu các services của tour

const { mapCurrent } = useScreens({
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
});

const selectedColor = ref('blue');

const props = defineProps({
  dateForms: reactive([{ date: null, Capacity: '' }]),
  serviceForms: reactive([{}]),
  tourInf: reactive({
    TourName: '',
    Description: '',
    Price: '',
    Img_Tour: '',
    Duration: '',
  }),
  itinerary: reactive([{}]),
  editable: false,
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

const handleImage = (event, targetObject, imageKey) => {
  const file = event.target.files[0];
  console.log('Hello');
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file); // Chuyển đổi file sang Base64

    reader.onload = () => {
      targetObject[imageKey] = reader.result; // Gán giá trị Base64 vào key tương ứng
      console.log(`Image uploaded for ${imageKey}:`, reader.result);
    };

    reader.onerror = (error) => {
      console.error('Lỗi khi đọc file:', error);
    };
  }
};

const createTour = async (tourInf, dateForms, serviceForms, itinerary) => {
  try {
    console.log(dateForms);
    dateForms.map((date) => {
      console.log(date.date);
      date.date = format(new Date(date.date), 'yyyy-MM-dd HH:mm:ss');
    });

    const confirm = window.confirm('Are you sure you want to create new tour?');
    if (!confirm) {
      return;
    } else {
      console.log(tourInf, dateForms, serviceForms, itinerary);
      const response = await axios.post('/api/create_tour', {
        tourInf,
        dateForms,
        serviceForms,
        itinerary,
      });
      if (response.status != 200) {
        alert(response.data.message);
      }
      alert('Create Tour Successfully');
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
