<template>
  <div>
    <p class="d-inline-flex gap-1">
      <button
        class="btn btn-primary"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#collapseExample"
        aria-expanded="false"
        aria-controls="collapseExample"
      >
        <i class="bx bx-filter-alt"></i>
        Filter
      </button>
    </p>
    <div class="collapse" id="collapseExample">
      <div class="card card-body">
        <div class="input-group mb-3 col">
          <span class="input-group-text"> Search by Tour Name</span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Finding by name of tour..."
          />
        </div>
        <div class="form-floating col">
          <select
            v-model="Filter.tourid"
            class="form-select"
            id="floatingSelect"
            aria-label="Floating label select example"
          >
            <option value="">All</option>
            <option
              v-for="(item, index) in tourNameList"
              :key="index"
              :value="item.tourid"
            >
              {{ item.tourname }}
            </option>
          </select>
          <label for="floatingSelect">Select Tour</label>
        </div>
      </div>
    </div>

    <div v-for="tour in filteredTours" :key="tour.tourid" class="mb-4">
      <h4 class="text-center">{{ tour.tourname }}</h4>
      <div
        v-for="(schedule, index) in tour.schedules"
        :key="index"
        class="card mb-3"
      >
        <button
          class="btn btn-primary card-header bg-primary text-white text-center"
          type="button"
          @click="toggleParticipants(tour.tourid, schedule.scheduleid)"
        >
          Date: {{ schedule.startdate }} - {{ schedule.enddate }}
        </button>

        <div
          v-show="expandedSchedule === `${tour.tourid}-${schedule.scheduleid}`"
        >
          <table class="table table-bordered table-hover table-sm">
            <thead class="table-light">
              <tr>
                <th class="fw-bold">#</th>
                <th class="fw-bold">Full Name</th>
                <th class="fw-bold">Date of Birth</th>
                <th class="fw-bold">Gender</th>
                <th class="fw-bold">Email</th>
                <th class="fw-bold">PhoneNumber</th>
                <th class="fw-bold">Full Name on Passport</th>
                <th class="fw-bold">Passport Number</th>
                <th class="fw-bold">Nationality</th>
                <th class="fw-bold">Booked Services</th>
                <th class="fw-bold">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="
                  loadingSchedule === `${tour.tourid}-${schedule.scheduleid}`
                "
              >
                <td colspan="10" class="text-center">Loading...</td>
              </tr>

              <template
                v-for="(bookingPackage, bookingPackageIndex) in participants[
                  `${tour.tourid}-${schedule.scheduleid}`
                ]
                  ? Object.values(
                      participants[`${tour.tourid}-${schedule.scheduleid}`]
                    )
                  : []"
              >
                <!-- Lặp qua từng participant trong nhóm -->
                <tr
                  v-for="(participant, index) in bookingPackage.items"
                  :key="`participant-${bookingPackageIndex}-${index}`"
                  :class="
                    (index === 0 ? 'text-danger ' : '',
                    getColor(bookingPackageIndex, participant.status))
                  "
                >
                  <td>
                    {{ index + 1 }}
                  </td>
                  <td :class="index === 0 ? 'text-danger' : ''">
                    {{ participant.fullname }}

                    <i
                      class="bx bx-money text-success fs-5"
                      v-if="(participant.status === 'Paid') & (index === 0)"
                    ></i>
                  </td>
                  <td>{{ formatDate(participant.dateofbirth) }}</td>
                  <td>{{ participant.gender }}</td>
                  <td>{{ participant.email }}</td>
                  <td>{{ participant.phonenumber }}</td>
                  <td>{{ participant.fullnameonpassport }}</td>
                  <td>{{ participant.passportnumber }}</td>
                  <td>{{ participant.nationality }}</td>
                  <td v-if="index === 0" :rowspan="bookingPackage.items.length">
                    {{
                      bookingPackage.services && index === 0
                        ? bookingPackage.services
                            .map(
                              (service) =>
                                `(${service.quantity}) - ${service.servicename}`
                            )
                            .join(', ')
                        : ''
                    }}
                  </td>
                  <td v-if="index === 0" :rowspan="bookingPackage.items.length">
                    ${{ participant.totalamount }}
                    <i
                      class="bx bx-money text-success fs-5"
                      v-if="(participant.status === 'Paid') & (index === 0)"
                    ></i>
                  </td>
                </tr>
              </template>

              <tr class="total-row table-secondary">
                <td colspan="9"></td>
                <td colspan="2">
                  <div
                    class="d-flex justify-content-between align-items-center p-2 bg-light rounded"
                  >
                    <!-- Total Collected -->
                    <div class="d-flex align-items-center">
                      <span class="badge bg-success me-2">
                        <i class="bi bi-currency-dollar"></i>
                      </span>
                      <div>
                        <div class="text-muted small">Total Collected</div>
                        <div class="fw-bold text-success">
                          ${{
                            totalAmount?.[
                              `${tour.tourid}-${schedule.scheduleid}`
                            ]?.[0]?.total_collected || 0
                          }}
                        </div>
                      </div>
                    </div>

                    <div class="vr mx-3"></div>

                    <!-- Total Pending -->
                    <div class="d-flex align-items-center">
                      <span class="badge bg-warning me-2">
                        <i class="bi bi-clock-history"></i>
                      </span>
                      <div>
                        <div class="text-muted small">Total Pending</div>
                        <div class="fw-bold text-warning">
                          ${{
                            totalAmount?.[
                              `${tour.tourid}-${schedule.scheduleid}`
                            ]?.[0]?.total_pending || 0
                          }}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr
                v-if="
                  participants[`${tour.tourid}-${schedule.scheduleid}`] &&
                  participants[`${tour.tourid}-${schedule.scheduleid}`]
                    .length === 0
                "
              >
                <td colspan="11" class="text-center">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <hr />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import api from '@/axios';
import { toRaw } from 'vue';

const tours = ref([]);
const searchQuery = ref('');

const expandedSchedule = ref(null);
const participants = ref([{}]);
const loadingSchedule = ref(null);
const tourNameList = ref([]);
var totalAmount = ref({});

const Filter = reactive({
  startdate: '',
  enddate: '',
  tourid: '',
  status: '',
  tourname: '', // Thêm trường mới
  bookingid: '',
});

// Lấy màu từ danh sách sách màu sắc
const getColor = (index, status) => {
  if (status == 'Cancelled') return 'table-danger';
  const colors = ['table-light', 'table-secondary'];
  return colors[index % colors.length]; // Lặp lại màu nếu hết danh sách
};

// Hàm tải danh sách tour
const fetchTours = async () => {
  try {
    const { data } = await api.get('/api/tour');
    tourNameList.value = data.reduce((acc, tourName) => [...acc, tourName], []);

    console.log('tourName: ', tourNameList);
    return data.reverse();
  } catch (error) {
    console.error('Lỗi khi tải danh sách tour:', error);
    return [];
  }
};

// Hàm tải danh sách lịch trình của tour
const fetchTourSchedule = async (tourid) => {
  try {
    const { data } = await api.get(`/api/tour/${tourid}/schedule`);
    console.log(data);
    return data.map((item) => ({
      ...item,
      StartDate: formatDate(item.startdate),
      EndDate: formatDate(
        new Date(item.startdate).setDate(
          new Date(item.startdate).getDate() + item.duration - 1
        )
      ),
    }));
  } catch (error) {
    console.error('Lỗi khi tải lịch trình:', error);
    return [];
  }
};

// Lọc danh sách tour theo tên
const removeDiacritics = (str) => {
  return str
    ? str
        .normalize('NFD') // Chuyển thành dạng Unicode tổ hợp
        .replace(/[\u0300-\u036f]/g, '')
    : ''; // Xóa dấu tiếng Việt
};

const filteredTours = computed(() => {
  if (Filter.tourid) {
    return tours.value.filter((tour) => tour.tourid === Filter.tourid);
  } else {
    const query = removeDiacritics(searchQuery.value.toLowerCase()).trim();
    console.log(tours.value);
    return tours.value.filter((tour) => {
      const tourName = removeDiacritics(
        tour.tourname ? tour.tourname.toLowerCase() : tour.tourname
      );

      // Kiểm tra nếu toàn bộ query nằm trong tên tour
      if (tourName.includes(query)) return true;

      // Tách query thành các từ nhỏ hơn
      const queryWords = query.split(' ');
      const tourWords = tourName.split(' ');

      // Kiểm tra nếu mọi từ trong query đều có trong tên tour
      return queryWords.every((q) =>
        tourWords.some((word) => word.includes(q))
      );
    });
  }
});

// Hàm lấy danh sách người tham gia theo schedule
const fetchParticipants = async (tourid, scheduleid) => {
  const key = `${tourid}-${scheduleid}`;
  loadingSchedule.value = key;
  try {
    const { data } = await api.get(`/api/participant/${tourid}/${scheduleid}`);
    //Chuyển mảng đối tượng về đối tượng với key là bookingId
    participants.value[key] = data.reduce((acc, item) => {
      const bookingId = item.bookingid;

      // Kiểm tra xem booking đã có trong acc chưa
      if (!acc[bookingId]) {
        acc[bookingId] = {
          items: [], // Dùng mảng lưu thông tin thành viên
        };
      }

      // Thêm item vào mảng items
      acc[bookingId].items.push(item);

      return acc;
    }, {});
    console.log(toRaw(participants.value[key]));

    const objects = await Promise.all(
      Object.keys(participants.value[key]).map(async (bookingId) => {
        const services = await bookedServices(bookingId);
        participants.value[key][bookingId] = {
          items: toRaw(participants.value[key][bookingId].items),
          services,
        };
      })
    );

    console.log(participants.value[key]);
  } catch (error) {
    console.error('Lỗi khi tải danh sách người tham gia:', error);
    participants.value[key] = [];
  }
  loadingSchedule.value = null;
};

const totalAmount_Booking = async (key) => {
  console.log(key);
  const items = Object.values(participants.value[key]).map(
    (item) => item.items[0]
  );

  const { total_collected, total_pending } = items.reduce(
    (acc, item) => {
      if (item.status === 'Paid')
        acc.total_collected += Number(item.totalamount);
      if (item.status === 'Booked')
        acc.total_pending += Number(item.totalamount);
      return acc;
    },
    { total_collected: 0, total_pending: 0 }
  );
  console.log(total_collected, total_pending);
  return {
    total_collected: Number(total_collected.toFixed(2)),
    total_pending: Number(total_pending.toFixed(2)),
  };
};

// Khi người dùng click vào schedule
const toggleParticipants = async (tourid, scheduleid) => {
  const key = `${tourid}-${scheduleid}`;
  if (expandedSchedule.value === key) {
    expandedSchedule.value = null;
  } else {
    expandedSchedule.value = key;
    if (!participants.value[key]) {
      await fetchParticipants(tourid, scheduleid);
      // Đảm bảo totalAmount.value[key] là mảng
      if (!totalAmount.value[key]) {
        totalAmount.value[key] = [];
      }

      const result = await totalAmount_Booking(key);
      totalAmount.value[key].push(result);
      console.log(totalAmount.value[key]?.[0].total_collected);
      console.log(totalAmount.value);
    }
  }
};

// Định dạng ngày tháng
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const bookedServices = async (bookingId) => {
  try {
    const response = await api.get(`/api/booked_service/${bookingId}`);
    return response.data;
  } catch (error) {
    console.log('Error bookedServices', error);
  }
};

// Tải dữ liệu ban đầu
onMounted(async () => {
  const tourList = await fetchTours();
  tours.value = await Promise.all(
    tourList.map(async (tour) => ({
      ...tour,
      schedules: await fetchTourSchedule(tour.tourid),
    }))
  );
});
</script>

<style scoped>
.card-header {
  font-weight: bold;
}
</style>
