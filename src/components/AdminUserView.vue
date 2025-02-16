<template>
  <div class="userView">
    <div v-if="user.Role == 'Admin'">
      <h4 class="m-2">Promote User</h4>
      <form id="form_promote" class="form row mb-5" @submit.prevent="promote()">
        <div class="col-2">
          <label class="form-label"> User Id</label>
          <input
            type="text"
            required
            class="form-control"
            v-model="form.UserID"
          />
        </div>
        <div class="col-5">
          <label class="form-label">Email</label>
          <input
            type="email"
            required
            class="form-control"
            v-model="form.Email"
          />
        </div>
        <div class="col-2">
          <label class="form-label">Role</label>
          <select
            required
            class="form-select"
            aria-label="Default select example"
            v-model="form.Role"
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div class="col-1 d-flex align-items-end">
          <button type="submit" class="btn btn-primary">Promote</button>
        </div>
      </form>
      <hr />
    </div>
    <div>
      <h4 class="m-2">Add User</h4>
      <form id="form_adduser" class="form row mb-5" @submit.prevent="addUser()">
        <div class="col-2">
          <label class="form-label"> Full Name</label>
          <input
            type="text"
            required
            class="form-control"
            v-model="newUser.FullName"
          />
        </div>
        <div class="col-5">
          <label class="form-label">Email</label>
          <input
            type="email"
            required
            class="form-control"
            v-model="newUser.Email"
          />
        </div>
        <div class="col-5">
          <label class="form-label">Phone Number</label>
          <input
            type="text"
            class="form-control"
            v-model="newUser.PhoneNumber"
          />
        </div>
        <div class="col-5">
          <label class="form-label">Password</label>
          <input
            type="text"
            required
            class="form-control"
            v-model="newUser.Password"
          />
        </div>

        <div class="col-1 d-flex align-items-end">
          <button type="submit" class="btn btn-primary">Add</button>
        </div>
      </form>
    </div>

    <hr />

    <nav
      style="--bs-breadcrumb-divider: '|'"
      aria-label="breadcrumb"
      class="fs-4 my-2"
    >
      <ol class="breadcrumb fw-bold">
        <li
          class="breadcrumb-item px-2 rounded"
          :class="{ active: currentStep === 1 }"
          @click="goBack"
        >
          List Of User
        </li>
        <li
          class="breadcrumb-item px-2 rounded"
          :class="{ active: currentStep === 2 }"
          @click="goNext"
        >
          List of Admin
        </li>
      </ol>
    </nav>

    <div v-if="currentStep === 1">
      <table class="table table-striped table-bordered table-hover table-sm">
        <thead class="table-light">
          <tr>
            <th class="fw-bold">#</th>
            <th class="fw-bold">UserID</th>
            <th class="fw-bold">Full Name</th>
            <th class="fw-bold">Email</th>
            <th class="fw-bold">Phone Number</th>
            <th class="fw-bold">Password</th>
            <th class="fw-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in usersList" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.UserID }}</td>
            <td v-if="editableRow !== item.UserID">{{ item.FullName }}</td>
            <td v-else>
              <input v-model="editedData.FullName" class="form-control" />
            </td>

            <td v-if="editableRow !== item.UserID">{{ item.Email }}</td>
            <td v-else>
              <input
                v-model="editedData.Email"
                type="email"
                class="form-control"
              />
            </td>

            <td v-if="editableRow !== item.UserID">{{ item.PhoneNumber }}</td>
            <td v-else>
              <input v-model="editedData.PhoneNumber" class="form-control" />
            </td>

            <td v-if="editableRow !== item.UserID">{{ item.Password }}</td>
            <td v-else>
              <input v-model="editedData.Password" class="form-control" />
            </td>

            <td>
              <div v-if="editableRow !== item.UserID">
                <button
                  @click="editUser(item)"
                  class="btn btn-sm btn-outline-success"
                >
                  Edit
                </button>
                <button
                  v-if="user.Role === 'Admin'"
                  @click="deleteUser(item)"
                  class="btn btn-sm btn-outline-danger mx-2"
                >
                  Delete
                </button>
              </div>

              <div v-else>
                <button
                  @click="saveUserEdit"
                  class="btn btn-sm btn-outline-primary"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-sm btn-outline-secondary mx-2"
                >
                  Cancel
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="currentStep === 2">
      <table class="table table-striped table-bordered table-hover table-sm">
        <thead class="table-light">
          <tr>
            <th class="fw-bold">#</th>
            <th class="fw-bold">UserID</th>
            <th class="fw-bold">Full Name</th>
            <th class="fw-bold">Email</th>
            <th class="fw-bold">Phone Number</th>
            <th class="fw-bold">Password</th>
            <th class="fw-bold">Role</th>
            <th class="fw-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in adminsList" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.UserID }}</td>
            <td v-if="editableRow !== item.UserID">{{ item.FullName }}</td>
            <td v-else>
              <input v-model="editedData.FullName" class="form-control" />
            </td>

            <td v-if="editableRow !== item.UserID">{{ item.Email }}</td>
            <td v-else>
              <input
                v-model="editedData.Email"
                type="email"
                class="form-control"
              />
            </td>

            <td v-if="editableRow !== item.UserID">{{ item.PhoneNumber }}</td>
            <td v-else>
              <input v-model="editedData.PhoneNumber" class="form-control" />
            </td>

            <td v-if="editableRow !== item.UserID">{{ item.Password }}</td>
            <td v-else>
              <input v-model="editedData.Password" class="form-control" />
            </td>
            <td>{{ item.Role }}</td>
            <td v-if="user.Role === 'Admin'">
              <div v-if="editableRow !== item.UserID">
                <button
                  @click="editUser(item)"
                  class="btn btn-sm btn-outline-success"
                >
                  Edit
                </button>
                <button
                  v-if="user.Role === 'Admin'"
                  @click="deleteUser(item)"
                  class="btn btn-sm btn-outline-danger mx-2"
                >
                  Delete
                </button>
                <button
                  class="btn btn-sm btn-outline-warning"
                  @click="dismissal(item)"
                >
                  Dismissal
                </button>
              </div>
              <div v-else>
                <button
                  @click="saveUserEdit"
                  class="btn btn-sm btn-outline-primary"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-sm btn-outline-secondary mx-2"
                >
                  Cancel
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import axios from 'axios';
const usersList = ref([]); // Lưu danh sách người dùng có trong hệ thống
const adminsList = ref([]); // Lưu danh sách người dùng có quyền quản trị
const currentStep = ref(1);
const user = ref({}); // Lưu Thông tin người dùng đang đăng nhập hiện tại
const newUser = ref({});
const form = reactive({});
const goNext = () => {
  if (currentStep.value < 2) currentStep.value++;
};

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const fetchUsersList = async () => {
  try {
    const response = await axios.get('/api/users_list');
    usersList.value = response.data.filter((user) => {
      return user.IsDeleted == 0;
    });
    console.log(usersList.value);
  } catch (error) {
    if (error) {
      console.log('Error fetching users list:', error);
    }
  }
};

const fetchAdminsList = async () => {
  try {
    const response = await axios.get('/api/admins_list');
    adminsList.value = response.data;
    console.log(response.data);
  } catch (error) {
    if (error) {
      console.log('Error fetching admins list:', error);
    }
  }
};

const promote = async () => {
  try {
    const response = await axios.post('/api/promote', form);
    console.log(response.data);
    if (response.status == 200) {
      alert(response.data.message);
      fetchAdminsList();
      form.value = {};
      document.getElementById('form_promote').reset();
    }
  } catch (error) {
    if (error) {
      console.log('Error fetching admins list:', error);
    }
  }
};

const deleteUser = async (user) => {
  try {
    const isConfirmed = confirm('Are you sure you want to DELETE user');
    if (!isConfirmed) {
      console.log('Deletion canceled by user.');
      return;
    }
    const response = await axios.put('/api/delete_user', user);
    if (response.status == 200) {
      fetchUsersList();
      fetchAdminsList();
    }
    alert(response.data.message);
  } catch (error) {
    if (error) {
      console.log('Error delete user');
      alert('Error delete user');
    }
  }
};

const dismissal = async (user) => {
  try {
    const isConfirmed = confirm('Are you sure you want dismissal');
    if (!isConfirmed) {
      console.log('Deletion canceled by user.');
      return;
    }
    const response = await axios.delete(`/api/dismissal/${user.UserID}`);
    if (response.status == 200) {
      fetchAdminsList();
    }
    alert(response.data.message);
  } catch (error) {
    if (error) {
      console.log('Error dismissal user');
      alert('Error dismissal user');
    }
  }
};

const fetchUser = () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (userData) {
    user.value = userData;
  }
};

const addUser = async () => {
  try {
    const isConfirmed = confirm('Are you sure you want to ADD user');
    if (!isConfirmed) {
      console.log('Deletion canceled by user.');
      return;
    }
    const response = await axios.post('/api/register', newUser.value);
    if (response.status == 200) {
      fetchUsersList();
      newUser.value = {};
      document.getElementById('form_adduser').reset();
    }
    alert(response.data.message);
  } catch (error) {
    if (error) {
      console.log('Error add user');
      alert('Error add user');
    }
  }
};

const editableRow = ref(null); // Theo dõi ID của hàng đang chỉnh sửa
const editedData = reactive({}); // Lưu thông tin chỉnh sửa tạm thời

const editUser = (item) => {
  editableRow.value = item.UserID; // Gán hàng đang chỉnh sửa
  editedData.UserID = item.UserID;
  editedData.FullName = item.FullName;
  editedData.Email = item.Email;
  editedData.PhoneNumber = item.PhoneNumber;
  editedData.Password = item.Password;
};

const saveUserEdit = async () => {
  try {
    const response = await axios.put('/api/update_user', editedData);
    if (response.status == 200) {
      fetchUsersList();
      fetchAdminsList();
      editableRow.value = null; // Thoát khỏi chế độ chỉnh sửa
      alert(response.data.message);
    }
  } catch (error) {
    console.log('Error updating user:', error);
    alert('Error updating user');
  }
};

const cancelEdit = () => {
  editableRow.value = null; // Hủy chỉnh sửa
};

onMounted(() => {
  fetchUsersList();
  fetchAdminsList();
  fetchUser();
});
</script>

<style scoped>
.userView {
  background-color: #f5f7f8;
}
</style>
