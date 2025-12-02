<script setup>
import axios from '@/plugins/api/axios'
import { onMounted, ref } from 'vue'

const base_url = import.meta.env.VITE_API_URL || '{{base_url}}'

const users = ref([])

// MODAL STATES
const viewDialog = ref(false)
const selectedUser = ref(null)

const fetchUsers = async () => {
  try {
    const res = await axios.get(`${base_url}/api-admin/users`, {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: search.value || undefined,
        role: filterRole.value || undefined,
        status: filterStatus.value || undefined,
        ordering: ordering.value || undefined,
      }
    })

    users.value = res.data.data.users
    totalPages.value = res.data.data.total_pages
  } catch (err) {
    console.error("Error loading users:", err)
  }
}


onMounted(fetchUsers)

const viewUser = user => {
  selectedUser.value = user
  viewDialog.value = true
}

const editDialog = ref(false)
const editForm = ref({
  first_name: "",
  last_name: "",
  email: "",
  status: "",
  role: "",
  phone_number: "",
  country: "",
  timezone: "",
})

const deleteDialog = ref(false)
const userToDelete = ref(null)
//
// FILTER STATES
//
const search = ref("")
const filterRole = ref("")
const filterStatus = ref("")
const ordering = ref("-id") // default: newest first

//
// PAGINATION STATES
//
const page = ref(1)
const perPage = ref(10) // change if needed
const totalPages = ref(1)


const editUser = user => {
  selectedUser.value = user
  editForm.value = { ...user }  
  editDialog.value = true
}

const updateUser = async () => {
  try {
    const res = await axios.patch(
      `${base_url}/api-admin/users/${selectedUser.value.id}/update`,
      editForm.value
    )

    // Update table instantly
    Object.assign(selectedUser.value, editForm.value)

    editDialog.value = false

    console.log("Updated:", res.data)
  } catch (err) {
    console.error("Update error:", err)
  }
}

const deleteUser = (user) => {
  userToDelete.value = user
  deleteDialog.value = true
}


const confirmDelete = async () => {
  try {
    await axios.delete(`${base_url}/api-admin/users/${userToDelete.value.id}/delete`)

    // Remove the user from the list without reload
    users.value = users.value.filter(u => u.id !== userToDelete.value.id)

    deleteDialog.value = false
  } catch (err) {
    console.error("Delete error:", err)
  }
}


import { watch } from "vue"

watch([search, filterRole, filterStatus, ordering, page], () => {
  fetchUsers()
})

</script>


<template>
  <!-- SEARCH + FILTER BAR -->
<v-row class="mb-4" align="center" dense>

  <!-- SEARCH -->
  <v-col cols="12" md="4">
    <v-text-field
      v-model="search"
      label="Search users..."
      prepend-inner-icon="mdi-magnify"
      clearable
      variant="outlined"
      density="comfortable"
    />
  </v-col>

  <!-- ROLE FILTER -->
  <v-col cols="12" md="3">
    <v-select
      v-model="filterRole"
      :items="['USER', 'ADMIN']"
      label="Filter by Role"
      clearable
      variant="outlined"
      density="comfortable"
    />
  </v-col>

  <!-- STATUS FILTER -->
  <v-col cols="12" md="3">
    <v-select
      v-model="filterStatus"
      :items="['ACTIVE', 'INACTIVE', 'BANNED']"
      label="Filter by Status"
      clearable
      variant="outlined"
      density="comfortable"
    />
  </v-col>

  <!-- ORDERING -->
  <v-col cols="12" md="2">
    <v-select
      v-model="ordering"
      :items="[
        { title: 'Newest', value: '-id' },
        { title: 'Oldest', value: 'id' },
        { title: 'Name A-Z', value: 'first_name' },
        { title: 'Name Z-A', value: '-first_name' },
        { title: 'Email A-Z', value: 'email' },
        { title: 'Email Z-A', value: '-email' },
      ]"
      label="Sort"
      variant="outlined"
      density="comfortable"
    />
  </v-col>

</v-row>

  <VTable class="elevation-1 rounded-lg">
    <thead>
      <tr>
        <th>ID</th>
        <th>First Name</th>
        <th>Last Name</th>
        <th>Email</th>
        <th>Status</th>
        <th class="text-center">Actions</th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="item in users"
        :key="item.id"
        class="hover:bg-grey-lighten-4 transition-all"
      >
        <td>{{ item.id }}</td>
        <td>{{ item.first_name }}</td>
        <td>{{ item.last_name }}</td>
        <td>{{ item.email }}</td>

        <td>
          <v-chip
            :color="item.status === 'ACTIVE' ? 'success' : 'error'"
            variant="flat"
            size="small"
            class="text-white"
          >
            {{ item.status }}
          </v-chip>
        </td>

        <!-- FIXED ACTIONS COLUMN -->
        <td class="text-center" style="white-space: nowrap;">
          <v-btn
            icon
            variant="text"
            color="primary"
            @click="viewUser(item)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>

          <v-btn
            icon
            variant="text"
            color="yellow"
            @click="editUser(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>

          <v-btn
            icon
            variant="text"
            color="error"
            @click="deleteUser(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </td>
      </tr>
    </tbody>
  </VTable>
  <!-- PAGINATION -->
<div class="d-flex justify-center my-4">
  <v-pagination
    v-model="page"
    :length="totalPages"
    rounded="circle"
    total-visible="7"
  />
</div>

  <!-- VIEW USER MODAL -->
<v-dialog v-model="viewDialog" max-width="600" transition="dialog-bottom-transition">
  <v-card class="rounded-xl">
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h6 font-weight-bold">User Details</span>
      <v-btn icon @click="viewDialog = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-row dense>
        <v-col cols="6">
          <strong>First Name:</strong><br>
          {{ selectedUser?.first_name }}
        </v-col>

        <v-col cols="6">
          <strong>Last Name:</strong><br>
          {{ selectedUser?.last_name }}
        </v-col>

        <v-col cols="12" class="mt-3">
          <strong>Email:</strong><br>
          {{ selectedUser?.email }}
        </v-col>

        <v-col cols="6" class="mt-3">
          <strong>Role:</strong><br>
          <v-chip size="small" color="primary" variant="flat">{{ selectedUser?.role }}</v-chip>
        </v-col>

        <v-col cols="6" class="mt-3">
          <strong>Status:</strong><br>
          <v-chip
            size="small"
            variant="flat"
            :color="selectedUser?.status === 'ACTIVE' ? 'success' : 'error'"
          >
            {{ selectedUser?.status }}
          </v-chip>
        </v-col>

        <v-col cols="6" class="mt-3">
          <strong>Phone:</strong><br>
          {{ selectedUser?.phone_number }}
        </v-col>

        <v-col cols="6" class="mt-3">
          <strong>Country:</strong><br>
          {{ selectedUser?.country }}
        </v-col>

        <v-col cols="6" class="mt-3">
          <strong>Timezone:</strong><br>
          {{ selectedUser?.timezone }}
        </v-col>

        <v-col cols="6" class="mt-3">
          <strong>Balance:</strong><br>
          {{ selectedUser?.balance }} {{ selectedUser?.currency }}
        </v-col>

        <v-col cols="12" class="mt-3">
          <strong>Last Login:</strong><br>
          {{ selectedUser?.last_login_at }}
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions class="justify-end">
      <v-btn color="primary" variant="flat" @click="viewDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<!-- EDIT USER MODAL -->
<v-dialog v-model="editDialog" max-width="600" transition="dialog-bottom-transition">
  <v-card class="rounded-xl">
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h6 font-weight-bold">Edit User</span>
      <v-btn icon @click="editDialog = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-form>
        <v-row dense>

          <v-col cols="6">
            <v-text-field label="First Name" v-model="editForm.first_name" />
          </v-col>

          <v-col cols="6">
            <v-text-field label="Last Name" v-model="editForm.last_name" />
          </v-col>

          <v-col cols="12">
            <v-text-field type="email" label="Email" v-model="editForm.email" />
          </v-col>

          <v-col cols="6">
            <v-select
              label="Role"
              :items="['USER', 'ADMIN']"
              v-model="editForm.role"
            />
          </v-col>

          <v-col cols="6">
            <v-select
              label="Status"
              :items="['ACTIVE', 'INACTIVE', 'BANNED']"
              v-model="editForm.status"
            />
          </v-col>

          <v-col cols="6">
            <v-text-field label="Phone Number" v-model="editForm.phone_number" />
          </v-col>

          <v-col cols="6">
            <v-text-field label="Country" v-model="editForm.country" />
          </v-col>

          <v-col cols="6">
            <v-text-field label="Timezone" v-model="editForm.timezone" />
          </v-col>

        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions class="justify-end">
      <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" @click="updateUser">
        Save Changes
      </v-btn>
    </v-card-actions>

  </v-card>
</v-dialog>

<!-- DELETE USER CONFIRMATION MODAL -->
<v-dialog v-model="deleteDialog" max-width="450" transition="dialog-bottom-transition">
  <v-card class="rounded-xl pa-4">

    <v-card-title class="text-h6 font-weight-bold d-flex align-center">
      <v-icon color="error" class="mr-2">mdi-alert</v-icon>
      Delete User
    </v-card-title>

    <v-divider class="my-2"></v-divider>

    <v-card-text class="text-body-1">
      Are you sure you want to delete 
      <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong>?
      <br>
      This action cannot be undone.
    </v-card-text>

    <v-card-actions class="justify-end mt-4">
      <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
      <v-btn color="error" variant="flat" @click="confirmDelete">
        Delete
      </v-btn>
    </v-card-actions>

  </v-card>
</v-dialog>


</template>
