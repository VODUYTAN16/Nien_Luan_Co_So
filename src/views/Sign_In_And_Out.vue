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
          <!-- Full Name -->
          <div class="mb-3" v-if="!isLogin">
            <input
              v-model="name"
              type="text"
              class="form-control"
              placeholder="Full Name"
              required
            />
          </div>

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
              type="password"
              class="form-control"
              placeholder="Password"
              required
            />
          </div>

          <!-- Confirm Password -->
          <div class="mb-3" v-if="!isLogin">
            <input
              v-model="confirmPassword"
              type="password"
              class="form-control"
              placeholder="Confirm Password"
              required
            />
          </div>

          <!-- Terms & Conditions -->
          <div class="form-check mb-3" v-if="!isLogin">
            <input
              type="checkbox"
              class="form-check-input"
              id="terms"
              required
            />
            <label class="form-check-label" for="terms">
              I agree to the
              <a href="#" class="text-decoration-none">terms of service</a> and
              <a href="#" class="text-decoration-none">privacy policy</a>.
            </label>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-primary w-100 mb-3">
            {{ isLogin ? 'Sign In' : 'Sign Up' }}
          </button>

          <!-- Google Sign In -->
          <!-- <div>
            <div
              id="g_id_onload"
              :data-client_id="clientId"
              :data-callback="handleCredentialResponse"
              data-auto_prompt="true"
            >
              <div class="g_id_signin" data-type="standard"></div>
            </div>
          </div> -->
          <div id="buttonDiv"></div>

          <!-- Toggle Form -->
          <p class="text-center">
            {{
              isLogin ? "Don't have an account?" : 'Already have an account?'
            }}
            <a href="#" class="text-decoration-none" @click="toggleForm">
              {{ isLogin ? 'Sign Up' : 'Sign In' }}
            </a>
          </p>
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

// Reactive variables
const isLogin = ref(true); // Toggle between Sign In and Sign Up
const email = ref('');
const password = ref('');
const name = ref('');
const confirmPassword = ref('');
const avatarurl = ref(
  'https://i.pinimg.com/736x/f5/fd/14/f5fd146c41549072d5a7823e31ea8eae.jpg'
);
const clientId = ref(
  '87667223869-08fsea38r378m40iqpfarbmdm6a7n9bl.apps.googleusercontent.com'
);

// Methods
const toggleForm = () => {
  isLogin.value = !isLogin.value;
  clearForm();
};

const clearForm = () => {
  email.value = '';
  password.value = '';
  name.value = '';
};

const handleSubmit = async () => {
  try {
    if (!isLogin.value && password.value !== confirmPassword.value) {
      alert('Passwords do not match.');
      return;
    }
    const endpoint = isLogin.value ? '/api/login' : '/api/register';
    const payload = {
      email: email.value,
      password: password.value,
      ...(isLogin.value ? {} : { name: name.value }),
      avatarurl: avatarurl.value,
    };

    const response = await axios.post(endpoint, payload);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/');
      alert(response.data.message);
    }
  } catch (error) {
    alert('Error: ' + error.response.data.message);
  }
};

const handleCredentialResponse = async (response) => {
  const data = parseJwt(response.credential);

  try {
    console.log(data);
    console.log(data);
    const res = await axios.post(
      '/api/google-login',
      {
        name: data.name,
        email: data.email,
        avatarurl: data.picture,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('authToken', res.data.token);
    router.push('/');
    alert('Sign in successful!');
  } catch (error) {
    console.error('Error during the request:', error);
  }
};

const parseJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

// Mounted equivalent for script setup
onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  document.body.appendChild(script);

  script.onload = () => {
    google.accounts.id.initialize({
      client_id: clientId.value,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(document.getElementById('buttonDiv'), {
      theme: 'outline',
      size: 'large',
    });
  };
});
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
