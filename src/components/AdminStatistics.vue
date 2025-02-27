<template>
  <div class="container mt-4">
    <h2 class="text-center mb-4">Thống kê đặt tour</h2>

    <!-- Bộ lọc -->
    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label">Chọn năm</label>
        <select class="form-select" v-model="selectedYear" @change="fetchData">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Chọn quý</label>
        <select
          class="form-select"
          v-model="selectedQuarter"
          @change="fetchData"
        >
          <option value="">Cả năm</option>
          <option v-for="q in 4" :key="q" :value="q">Quý {{ q }}</option>
        </select>
      </div>
    </div>

    <!-- Thống kê -->
    <div class="row text-center">
      <div class="col-md-3" v-for="(item, key) in stats" :key="key">
        <div class="card p-3 shadow">
          <h5>{{ item.label }}</h5>
          <p class="fw-bold fs-4">{{ item.value }}</p>
        </div>
      </div>
    </div>

    <!-- Biểu đồ -->
    <div class="row mt-4">
      <div class="col-md-6">
        <h5 class="text-center">Tỷ lệ lấp đầy tour</h5>
        <DoughnutChart :chart-data="chartData" />
      </div>
      <div class="col-md-6">
        <h5 class="text-center">Doanh thu & Số lượng khách theo tour</h5>
        <LineChart :chart-data="lineChartData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { DoughnutChart, LineChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const selectedYear = ref(new Date().getFullYear());
const selectedQuarter = ref('');
const availableYears = ref([2022, 2023, 2024]);

const stats = ref({
  totalBookings: { label: 'Tổng lượt đặt tour', value: 0 },
  totalRevenue: { label: 'Doanh thu', value: '0 VND' },
  totalGuests: { label: 'Số khách tham gia', value: 0 },
  avgAge: { label: 'Độ tuổi trung bình', value: '0 tuổi' },
});

const chartData = ref({
  labels: ['Lấp đầy', 'Chưa lấp đầy'],
  datasets: [
    {
      backgroundColor: ['#36A2EB', '#FF6384'],
      data: [0, 0],
    },
  ],
});

const lineChartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Doanh thu (triệu VND)',
      borderColor: '#FF6384',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      data: [],
    },
    {
      label: 'Số lượng khách',
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      data: [],
    },
  ],
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const fetchData = async () => {
  const response = await new Promise((resolve) =>
    setTimeout(() => {
      resolve([
        { tourName: 'Tour A', revenue: 100000000, guests: 50 },
        { tourName: 'Tour B', revenue: 150000000, guests: 70 },
        { tourName: 'Tour C', revenue: 120000000, guests: 60 },
        { tourName: 'Tour D', revenue: 180000000, guests: 90 },
      ]);
    }, 1000)
  );

  stats.value.totalBookings.value = response.length;
  stats.value.totalRevenue.value = formatCurrency(
    response.reduce((sum, tour) => sum + tour.revenue, 0)
  );
  stats.value.totalGuests.value = response.reduce(
    (sum, tour) => sum + tour.guests,
    0
  );
  stats.value.avgAge.value = `${(Math.random() * (50 - 18) + 18).toFixed(
    1
  )} tuổi`;

  // Cập nhật biểu đồ Doughnut
  chartData.value.datasets[0].data = [Math.random() * 100, Math.random() * 100];

  // Cập nhật biểu đồ đường theo tour
  lineChartData.value.labels = response.map((tour) => tour.tourName);
  lineChartData.value.datasets[0].data = response.map(
    (tour) => tour.revenue / 1000000
  );
  lineChartData.value.datasets[1].data = response.map((tour) => tour.guests);
};

onMounted(fetchData);
</script>

<style scoped>
.card {
  border-radius: 10px;
}
</style>
