<template>
  <div
    class="modal fade"
    id="bookingPopup"
    tabindex="-1"
    aria-labelledby="popupTitle"
    aria-hidden="true"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="popupTitle">{{ title }}</h5>
          <button type="button" class="btn-close" @click="closePopup"></button>
        </div>
        <div class="breadcrumb">
          <span class="breadcrumb-item" :class="{ active: currentStep === 1 }"
            >Choose a Package</span
          >
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-item" :class="{ active: currentStep === 2 }"
            >Add Participant Info</span
          >
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-item" :class="{ active: currentStep === 3 }"
            >Complete Payment</span
          >
        </div>
        <div class="modal-body">
          <slot
            :currentStep="currentStep"
            :tour="tour"
            :schedules="schedules"
            :selectedOptions="selectedOptions"
          ></slot>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="goBack">
            {{ currentStep > 1 ? 'Back' : 'Close' }}
          </button>
          <button type="button" class="btn btn-primary" @click="goNext">
            {{ currentStep === 3 ? 'Confirm Booking' : 'Continue' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Popup Title',
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    tour: {
      type: Object,
      required: true,
    },
    schedules: {
      type: Array,
      default: () => [],
    },
    selectedOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update:currentStep', 'confirmBooking'],
  methods: {
    closePopup() {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('bookingPopup')
      );
      modal.hide();
    },
    goNext() {
      if (this.currentStep < 3) {
        this.$emit('update:currentStep', this.currentStep + 1);
      } else {
        this.$emit('confirmBooking');
      }
    },
    goBack() {
      if (this.currentStep > 1) {
        this.$emit('update:currentStep', this.currentStep - 1);
      } else {
        this.closePopup();
      }
    },
  },
};
</script>

<style scoped>
.modal .modal-content {
  border-radius: 10px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4a4a4a;
  padding: 10px;
  color: #ffffff;
  font-family: Arial, sans-serif;
  font-size: 14px;
}
.breadcrumb-item {
  padding: 0 5px;
}
.breadcrumb-item.active {
  font-weight: bold;
}
.breadcrumb-separator {
  padding: 0 5px;
  color: #cccccc;
}
</style>
