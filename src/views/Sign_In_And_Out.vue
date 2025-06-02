<template>
  <div
    class="container-fluid vh-100 d-flex align-items-center justify-content-center"
  >
    <div
      class="row shadow-lg rounded-3 overflow-hidden"
      style="width: 70%; max-width: 900px"
    >
      <!-- Left Section -->
      <div
        class="col-md-6 bg-primary text-white p-5 d-flex flex-column align-items-center justify-content-center"
      >
        <h1 class="fw-bold mb-4 text-center">
          Learn From World’s <br />
          Best Instructors 🌎 <br />
          Around The World.
        </h1>
        <img
          src="../assets/tree.png"
          alt="Study Online"
          class="img-fluid"
          style="max-height: 200px"
        />
      </div>

      <!-- Right Section -->
      <div class="col-md-6 bg-white p-5">
        <h3 class="fw-bold mb-4">
          {{ isLogin ? 'Sign In' : 'Create Account' }}
        </h3>
        <form @submit.prevent="handleSubmit">
          <!-- Email -->
          <div class="mb-3">
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="Email Address"
              required
            />
          </div>

          <!-- Password -->
          <div class="mb-3 position-relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Password"
              required
            />
            <span
              class="position-absolute end-0 top-50 translate-middle-y me-3"
              style="cursor: pointer"
              @click="showPassword = !showPassword"
            >
              <i
                :class="
                  showPassword ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'
                "
              ></i>
            </span>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-primary w-100 mb-3">
            Sign In
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const showPassword = ref(false);
// Reactive variables
const isLogin = ref(true); // Toggle between Sign In and Sign Up
const email = ref('');
const password = ref('');
const name = ref('');
const avatarurl = ref(
  'https://i.pinimg.com/736x/f5/fd/14/f5fd146c41549072d5a7823e31ea8eae.jpg'
);

const handleSubmit = async () => {
  console.log(email.value);
  try {
    const payload = {
      Email: email.value,
      Password: password.value,
    };

    const response = await axios.post('/api/login/admin', payload);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/');
      location.reload();

      alert(response.data.message);
    }
  } catch (error) {
    alert('Error: ' + error.response.data.message);
  }
};

// Mounted equivalent for script setup
onMounted(() => {});
</script>

<style scoped>
h1 {
  font-size: 2rem;
}

.btn-outline-danger i {
  margin-right: 5px;
}

form {
  font-size: 0.9rem;
}

.btn-outline-secondary {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
