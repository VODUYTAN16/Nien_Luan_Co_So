<script setup>
import { RouterLink, RouterView } from 'vue-router';
import AdminNavigate from './components/AdminNavigate.vue';
</script>

<template>
  <div class="row">
    <AdminNavigate class="col-1"></AdminNavigate>
    <router-view class="col"></router-view>
  </div>
</template>

<style scoped>
.row {
  overflow: hidden;
  max-width: 99vw;
}
</style>
