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
              v-model="tourInf.tourname"
              required
            />
          </div>
          <div class="col mb-2">
            <label for="tourimg" class="form-label">Image of tour</label>
            <input
              type="file"
              id="tourimg"
              class="form-control"
              placeholder="Your Anwer"
              required
              @change="(event) => handleImage(event, props.tourInf, 'imgtour')"
            />
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="row">
              <div class="col" v-if="!editable">
                <label for="price" class="form-label"> Price of tour </label>
                <input
                  type="number"
                  step="0.01"
                  id="price"
                  min="0"
                  class="form-control"
                  v-model="tourInf.price"
                  required
                  placeholder="$0"
                />
              </div>
              <div class="col" v-else>
                <label for="price" class="form-label"> Price of tour </label>
                <input
                  type="number"
                  step="0.01"
                  id="price"
                  min="0"
                  class="form-control"
                  v-model="tourInf.price"
                  required
                  placeholder="$0"
                  disabled
                />
              </div>
              <div class="col">
                <label for="duration" class="form-label">Duration</label>
                <input
                  id="duration"
                  type="number"
                  step="1"
                  min="1"
                  class="form-control"
                  placeholder="Ex: 7 days"
                  required
                  v-model="tourInf.duration"
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
              class="rounded order-light-subtle"
              :src="
                tourInf.imgtour?.preview
                  ? tourInf.imgtour.preview
                  : tourInf.imgtour
              "
              alt="Image of Tour"
              style="height: 200px; border-radius: 10px"
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
            placeholder="Description about some interesting of the tour"
          ></textarea>
        </div>
      </div>
      <hr />
      <div class="itinerary">
        <div class="d-flex">
          <h4>Itinerary</h4>
          <button
            type="button"
            id="btn"
            class="btn btn-primary mx-3"
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
              <div class="d-flex my-2">
                <h5
                  class="text-primary mx-2 text-center d-flex align-items-center"
                >
                  Day {{ item.daynumber }}
                </h5>

                <button
                  v-if="!editable"
                  type="button"
                  class="btn btn-danger me-2 mx-2"
                  @click="removeForm(props.itinerary, index)"
                >
                  Remove
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-danger me-2 mx-2"
                  @click="deleteForm(props, index, 'iti')"
                >
                  Delete
                </button>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <label class="form-label">Day Number</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Day order in tour"
                    :max="tourInf?.duration"
                    required
                    class="form-control"
                    v-model="item.daynumber"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Image</label>
                  <input
                    type="file"
                    id="tourimg"
                    class="form-control"
                    required
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
                        placeholder="Your Anwer"
                        v-model="item.mealsincluded"
                      />
                    </div>

                    <div class="mt-2">
                      <label class="form-label">Activities</label>
                      <input
                        type="text"
                        class="form-control"
                        required
                        placeholder="Your Anwer"
                        rows="2"
                        v-model="item.activities"
                      />
                    </div>

                    <div class="mt-2">
                      <label class="form-label">Location</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Anwer"
                        class="form-control"
                        v-model="item.location"
                      />
                    </div>
                  </div>
                  <div class="col">
                    <img
                      :src="
                        item.imageurl?.preview
                          ? item.imageurl.preview
                          : item.imageurl
                      "
                      alt=""
                      style="width: 250px; border-radius: 5px; margin: 5px"
                    />
                  </div>
                </div>

                <div class="col-md-12 mt-2">
                  <label class="form-label">Description</label>
                  <textarea
                    type="text"
                    placeholder="Description about the interesting of that place"
                    class="form-control"
                    v-model="item.description"
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
            class="mb-3 col-lg-3 col-sm-12"
          >
            <div class="card p-3 shadow-sm">
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
                            placeholder="Departure Date"
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
                <div class="col-6">
                  <label for="capacity" class="form-label">Capacity</label>
                  <input
                    type="number"
                    step="1"
                    class="form-control"
                    min="0"
                    placeholder="Your Anwer"
                    id="capacity"
                    v-model="form.capacity"
                    required
                  />
                </div>
                <div
                  class="col-1 d-flex justify-content-start align-items-end p-0"
                >
                  <button
                    v-if="!editable"
                    type="button"
                    class="btn btn-danger me-2"
                    @click="removeForm(props.dateForms, index)"
                  >
                    Remove
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn btn-danger me-2"
                    @click="deleteForm(props, index, 'sch')"
                  >
                    Delete
                  </button>
                </div>
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
            class="col-lg-6 col-sm-12 my-2"
          >
            <div class="card p-3 shadow-sm">
              <div class="row">
                <div class="col">
                  <label for="servicename" class="form-label"
                    >Service Name</label
                  >
                  <select
                    v-model="service.serviceid"
                    class="form-select"
                    id="servicename"
                  >
                    <option
                      v-for="ser in services?.filter(
                        (service) => service.isdeleted == 0
                      )"
                      :key="ser.serviceid"
                      :value="ser.serviceid"
                    >
                      {{ ser.servicename }}
                    </option>
                  </select>
                </div>
                <div class="col-4">
                  <label for="status" class="form-label">Status</label>
                  <select
                    required
                    class="form-select"
                    aria-label="Default select example"
                    v-model="service.status"
                  >
                    <option value="available">Available</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
              </div>
              <div class="row my-2">
                <div
                  class="col-2 d-flex justify-content-end align-items-end p-0"
                >
                  <button
                    v-if="!editable"
                    type="button"
                    class="btn btn-danger me-3"
                    @click="removeForm(props.serviceForms, index)"
                  >
                    Remove
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn btn-danger me-3 px-2"
                    @click="deleteForm(props, index, 'ser')"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <!-- Bảng nhập dịch vụ theo lịch trình -->
      <div class="schedule_service">
        <table class="table table-bordered" style="border-radius: 10px">
          <thead class="table-primary" style="border-radius: 10px">
            <tr>
              <th>Schedule</th>
              <th>Service</th>
              <th>Available Quantity</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(schedule, index) in props.dateForms">
              <tr
                v-for="(service, index1) in ListOptionalService(
                  props.serviceForms
                )"
                :key="`${index}-${index1}`"
              >
                <td
                  v-if="index1 == 0"
                  :rowspan="ListOptionalService(props.serviceForms).length"
                >
                  {{ formatDate(schedule.date) }}
                </td>
                <td>
                  {{
                    services?.filter((item) => {
                      return item.serviceid == service.serviceid;
                    })[0]?.servicename
                  }}
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    :value="getServiceCapacity(schedule, service.serviceid)"
                    @input="
                      updateServiceCapacity(
                        schedule,
                        service.serviceid,
                        $event.target.value
                      )
                    "
                    class="form-control"
                    required
                    placeholder="Your Answer"
                    min="1"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
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
import { onMounted, reactive, ref, computed } from 'vue';
import { useScreens } from 'vue-screen-utils';
import TourSection from './TourSection.vue';
import api from '@/axios';
import { format } from 'date-fns';
// import { applyRulesForDateParts } from 'v-calendar/dist/types/src/utils/date/helpers';

const services = ref([]); // Lưu các services của tour

const { mapCurrent } = useScreens({
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
});

const selectedColor = ref('blue');

const props = defineProps({
  dateForms: reactive([{ date: null, capacity: '' }]),
  serviceForms: reactive([{}]),
  tourInf: reactive({
    tourname: '',
    description: '',
    price: '',
    imgtour: new FormData(),
    duration: '',
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

const deleteForm = async (form, index, type) => {
  try {
    console.log(form, index, type);
    switch (type) {
      case 'sch':
        const confirm = window.confirm(
          'Are you sure you want to DELETE this schedule?'
        );
        if (!confirm) {
          return;
        }
        const respone1 = await api.put('/api/delete_schedule', {
          id: form.dateForms[index].scheduleid,
        });
        if (respone1.status == 200) {
          removeForm(form.dateForms, index);
        }
        alert(respone1.data.message);
        break;
      case 'ser':
        const confirm2 = window.confirm(
          'Are you sure you want to DELETE this service?'
        );
        if (!confirm2) {
          return;
        }
        const respone2 = await api.put('/api/delete_tourService', {
          TourID: form.tourInf.tourid,
          ServiceID: form.serviceForms[index].serviceid,
        });
        if (respone2.status == 200) {
          removeForm(form.serviceForms, index);
        }
        alert(respone2.data.message);
        break;
      case 'iti':
        const confirm3 = window.confirm(
          'Are you sure you want to DELETE this itinerary?'
        );
        if (!confirm3) {
          return;
        }
        const respone3 = await api.put('/api/delete_itinerary', {
          id: form.itinerary[index].itineraryid,
        });
        if (respone3.status == 200) {
          removeForm(form.itinerary, index);
        }
        alert(respone3.data.message);
        break;
      default:
        console.log('Invalid type');
    }
  } catch (err) {
    console.log('Error deleteform:', err);
  }
};

// const handleImage = (event, targetObject, imageKey) => {
//   const file = event.target.files[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.readAsDataURL(file); // Chuyển đổi file sang Base64

//     reader.onload = () => {
//       targetObject[imageKey] = reader.result; // Gán giá trị Base64 vào key tương ứng
//       console.log(`Image uploaded for ${imageKey}:`, reader.result);
//     };

//     reader.onerror = (error) => {
//       console.error('Lỗi khi đọc file:', error);
//     };
//   }
// };

const handleImage = (event, targetObject, imageKey) => {
  const file = event.target.files[0];

  if (file) {
    // Tạo URL preview
    const objectUrl = URL.createObjectURL(file);

    // Lưu cả file và preview URL
    targetObject[imageKey] = {
      file,
      preview: objectUrl,
    };
    console.log(targetObject[imageKey]);
  }
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file); // Append File object vào FormData

  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Bắt buộc phải có header này
      },
    });
    return response.data.imageurl;
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    throw error;
  }
};

const filterLiveValue = async (schedules, services) => {
  return schedules.map((schedule) => {
    // Lấy các ServiceID từ mảng services
    const serviceIDs = services
      ?.filter((service) => service.status === 'optional') // Lọc các service có Status là 'Optional'
      .map((service) => Number(service.serviceid)); // Chuyển đổi ServiceID thành số

    if (schedule.services) {
      // Lấy các key từ schedule.services và chuyển đổi chúng thành số
      const numericKeys = Object.keys(schedule.services).map((key) =>
        Number(key)
      );

      console.log(Object.entries(schedule.services));
      // Lọc các key trong schedule.services mà có trong mảng serviceIDs
      const filteredServices = numericKeys
        ?.filter((key) => serviceIDs.includes(key)) // Lọc các key hợp lệ
        .reduce((acc, key) => {
          acc[key] = schedule.services[key]; // Giữ lại giá trị tương ứng của key
          return acc;
        }, {});

      // Trả về schedule mới với services đã được lọc
      return {
        ...schedule,
        services: filteredServices,
      };
    } else {
      return schedule;
    }
  });
};

const createTour = async (tourInf, dateForms, serviceForms, itinerary) => {
  console.log(dateForms, serviceForms);
  try {
    // tiền xử lý
    dateForms = await filterLiveValue(dateForms, serviceForms);
    console.log('filterLiveValue khong loi ');
    //xử lý ảnh
    const [mainImage, ...itineraryResults] = await Promise.all([
      uploadImage(tourInf.imgtour.file).catch((error) => {
        console.error('Lỗi upload ảnh chính:', error);
        return null;
      }),
      ...itinerary.map((item, index) =>
        item.imageurl?.file
          ? uploadImage(item.imageurl.file).catch((error) => {
              console.error(`Lỗi upload ảnh ngày ${index + 1}:`, error);
              return null;
            })
          : Promise.resolve(null)
      ),
    ]);

    // Gán kết quả
    console.log(mainImage, itineraryResults);
    tourInf.imgtour = mainImage || '';
    itinerary.forEach((item, index) => {
      item.imageurl = itineraryResults[index] || '';
    });
    // Xử lý form date
    dateForms.map((date) => {
      console.log(date.date);
      date.date = format(new Date(date.date), 'yyyy-MM-dd HH:mm:ss');
    });

    const confirm = window.confirm('Are you sure you want to create new tour?');
    if (!confirm) {
      return;
    } else {
      console.log(tourInf, dateForms, serviceForms, itinerary);
      const response = await api.post('/api/create_tour', {
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
    alert('Error Create Tour');
    console.error('Lỗi khi tạo tour:', error);
  }
};

const ListOptionalService = (services) => {
  console.log(services);
  return services?.filter((item) => {
    return item.status == 'optional';
  });
};
const formatDate = (dateString) => {
  if (dateString) {
    return format(new Date(dateString), 'dd/MM/yyyy');
  }
  return '';
};

const fetchTourService = async () => {
  try {
    const response = await api.get(`/api/services`);
    console.log(response.data);
    services.value = response.data;
  } catch (error) {
    console.error('Error fetching Tour Detail:', error);
  }
};

const getServiceCapacity = (schedule, serviceid) => {
  if (!schedule.services) {
    schedule.services = {};
  }
  return schedule.services[serviceid];
};

const updateServiceCapacity = (schedule, serviceid, value) => {
  if (!schedule.services) {
    schedule.services = {};
  }
  schedule.services[serviceid] = Number(value);
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
