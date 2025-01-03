<template>
  <div class="body">
    <header>
      <Navigate class="navigate"></Navigate>
      <div class="herosection">
        <HeroSection
          image="https://media.istockphoto.com/id/488876192/vi/anh/hoi-an-vietnam.jpg?s=2048x2048&w=is&k=20&c=i9PyzEChi5gMuB4Jf1HAzOmdEmY28_Bo3aBVx0tJb3Q="
          p1="14 Days - Da Nang to Hoi An"
          p2=""
        ></HeroSection>
      </div>
    </header>
    <div class="card-box">
      <div class="card text-center card-booking">
        <h1 class="Card-title">$1240</h1>
        <h6>deposit $200</h6>
        <hr />
        <div class="btn btn-success" @click="openPopup">Book Now</div>
        <hr />
        <router-link class="btn btn-info">Ask a question</router-link>
      </div>
    </div>

    <main>
      <!-- Popup -->
      <div
        class="modal fade"
        id="bookingPopup"
        tabindex="-1"
        aria-labelledby="popupTitle"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="popupTitle">Discover Vietnam</h5>
              <button
                type="button"
                class="btn-close"
                @click="closePopup"
              ></button>
            </div>
            <div class="modal-body">
              <div class="container-fluid">
                <div class="row">
                  <div class="col-md-8">
                    <h6>Select Departure</h6>
                    <div class="mb-3">
                      <!-- Lịch hiển thị toàn bộ calendar -->
                      <VCalendar
                        :columns="columns"
                        :expanded="expanded"
                        :color="selectedColor"
                        :attributes="attrs"
                        borderless
                      />
                    </div>

                    <h6>Package</h6>
                    <div class="mb-3">
                      <p>
                        Trip Price: <strong>${{ tripPrice }}</strong>
                      </p>
                    </div>

                    <h6>Select Options</h6>
                    <div
                      class="form-check"
                      v-for="(option, index) in options"
                      :key="index"
                    >
                      <input
                        class="form-check-input"
                        type="checkbox"
                        v-model="selectedOptions"
                        :value="option"
                      />
                      <label class="form-check-label">
                        {{ option.name }} (+${{ option.price }})
                      </label>
                    </div>
                  </div>

                  <div class="col-md-4">
                    <h6>Your Booking</h6>
                    <p>Trip Price: ${{ tripPrice }}</p>
                    <p>Total: ${{ calculateTotal() }}</p>
                    <p>Due at Booking: ${{ calculateDeposit() }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closePopup"
              >
                Close
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="confirmBooking"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tour_Information
        :Schedules="schedules"
        :Tour="tour"
        :Services="services"
      ></Tour_Information>
      <Footer></Footer>
    </main>
  </div>
</template>

<script setup>
import Navigate from '@/components/Navigate.vue';
import HeroSection from '@/components/HeroSection.vue';
import Footer from '@/components/Footer.vue';
import Tour_Information from '@/components/Tour_Information.vue';
import { onMounted, ref } from 'vue';
import { useScreens } from 'vue-screen-utils';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const schedules = ref([]);
const tour = ref({});
const services = ref([]);

const { mapCurrent } = useScreens({
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
});
const columns = mapCurrent({ lg: 2 }, 1);
const expanded = mapCurrent({ lg: false }, true);
const selectedColor = ref('blue');
const attrs = ref([
  {
    key: 'test',
    highlight: true,
    dates: { start: new Date(2019, 3, 15), end: new Date(2019, 3, 19) },
    // dates: new Date(),
  },
]);

const selectedDate = ref(null);
const tripPrice = ref(1495);
const deposit = ref(200);
const options = ref([
  { name: 'Pre-Nights Accommodation', price: 60 },
  { name: 'Secret Handicraft Villages of Hanoi', price: 49 },
  { name: 'Private Room Upgrade', price: 500 },
]);
const selectedOptions = ref([]);

const openPopup = () => {
  const modal = new bootstrap.Modal(document.getElementById('bookingPopup'));
  modal.show();
};

const closePopup = () => {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById('bookingPopup')
  );
  modal.hide();
};

const calculateTotal = () => {
  let optionsTotal = selectedOptions.value.reduce(
    (sum, option) => sum + option.price,
    0
  );
  return tripPrice.value + optionsTotal;
};

const calculateDeposit = () => {
  return deposit.value;
};

const confirmBooking = () => {
  alert('Booking confirmed!');
  closePopup();
};

const fetchTourSchedule = async (tourid) => {
  try {
    const response = await axios.get(`/api/tour/${tourid}/schedule`);
    schedules.value = response.data;

    schedules.value.map((item) => {
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
  } catch (error) {
    console.error('Error fetching Tour Schedule:', error);
  }
};

const fetchTourDetail = async (tourid) => {
  try {
    const response = await axios.get(`/api/tour/${tourid}`);
    tour.value = response.data;
  } catch (error) {
    console.error('Error fetching Tour Detail:', error);
  }
};

const fetchTourService = async (tourid) => {
  try {
    const response = await axios.get(`/api/tour/${tourid}/service`);
    console.log(response.data);
    services.value = response.data;
  } catch (error) {
    console.error('Error fetching Tour Detail:', error);
  }
};

onMounted(() => {
  const tourid = route.params.tourid;
  fetchTourSchedule(tourid);
  fetchTourService(tourid);
  fetchTourDetail(tourid);
});
</script>

<style scoped>
.herosection {
  height: 450px;
  overflow: hidden;
}
.navigatge {
  margin: auto;
}

.card-box {
  position: absolute; /* Phần tử cha cần có position khác "static" */
  height: 180%;
  top: 60%;
  right: 5%;
}

.card-booking {
  width: 250px;
  padding: 20px;
  position: sticky;
  top: 20px; /* Vị trí cố định cách đỉnh khi dính */
  background: white;
  border: 1px solid #ccc;
  z-index: 10;
}
.modal .modal-content {
  border-radius: 10px;
}
</style>
