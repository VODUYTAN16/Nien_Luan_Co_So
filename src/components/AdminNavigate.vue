<template>
  <div :class="['adminNavigate', isMenuOpen ? 'open' : 'closed']">
    <div class="text-end pt-3 menu-icon" @click="toggleMenu">
      <i class="bx bx-menu fs-1"></i>
    </div>
    <div>
      <hr />
      <div class="d-flex flex-column text-center">
        <router-link
          to="/booking"
          v-if="isMenuOpen"
          class="btn btn-primary my-2"
          type="button"
        >
          Booking
        </router-link>
        <router-link
          v-else
          to="/booking"
          class="btn btn-primary my-2"
          type="button"
          >B</router-link
        >
        <router-link
          to="/service"
          v-if="isMenuOpen"
          class="btn btn-primary"
          type="button"
        >
          Service
        </router-link>
        <router-link to="/service" v-else class="btn btn-primary" type="button"
          >S</router-link
        >
        <router-link
          to="/tour"
          v-if="isMenuOpen"
          class="btn btn-primary my-2"
          type="button"
        >
          Tour
        </router-link>
        <router-link
          to="/tour"
          v-else
          class="btn btn-primary my-2"
          type="button"
          >T</router-link
        >
        <router-link
          to="/adminBlog"
          v-if="isMenuOpen"
          class="btn btn-primary"
          type="button"
        >
          Blog
        </router-link>
        <router-link
          to="/adminBlog"
          v-else
          class="btn btn-primary"
          type="button"
          >BL</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isMenuOpen = ref(true);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};
</script>

<style>
.adminNavigate {
  background-color: aliceblue;
  height: 100vh;
  position: relative;
  left: 0;
  top: 0;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.adminNavigate.open {
  width: 250px;
}

.adminNavigate.closed {
  width: 60px;
}

.menu-icon {
  cursor: pointer;
  padding-right: 10px;
}

.btn {
  font-size: large;
  margin: 0 10px;
  transition: all 0.3s ease-in-out;
}

/* .adminNavigate.closed .btn {
  opacity: 0;
  pointer-events: none;
} */
</style>
