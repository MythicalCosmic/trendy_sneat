<script setup>
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'

const toast = useToast()

const users = ref([])
const loading = ref(false)

// MODAL STATES
const viewDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const selectedUser = ref(null)
const userToDelete = ref(null)

// EDIT FORM
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

// FILTER STATES
const search = ref("")
const filterStatus = ref("")
const ordering = ref("-id")

// PAGINATION STATES
const page = ref(1)
const perPage = ref(10)
const totalPages = ref(1)

const fetchUsers = async () => {
  try {
    loading.value = true
    const res = await api.get('/api-admin/users', {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: search.value || undefined,
        status: filterStatus.value || undefined,
        ordering: ordering.value || undefined,
      }
    })

    users.value = res.data.data.users
    totalPages.value = res.data.data.total_pages
  } catch (err) {
    console.error("Error loading users:", err)
    toast.error('Failed to load users', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

watch([search, filterStatus, ordering, page], () => {
  fetchUsers()
})

const viewUser = user => {
  selectedUser.value = user
  viewDialog.value = true
}

const editUser = user => {
  selectedUser.value = user
  editForm.value = { ...user }  
  editDialog.value = true
}

const updateUser = async () => {
  try {
    loading.value = true
    await api.patch(
      `/api-admin/users/${selectedUser.value.id}/update`,
      editForm.value
    )

    Object.assign(selectedUser.value, editForm.value)
    editDialog.value = false

    toast.success('User updated successfully! 🎉', {
      position: 'top-right',
    })

    await fetchUsers()
  } catch (err) {
    console.error("Update error:", err)
    toast.error('Failed to update user', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const deleteUser = (user) => {
  userToDelete.value = user
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    loading.value = true
    await api.delete(`/api-admin/users/${userToDelete.value.id}/delete`)

    users.value = users.value.filter(u => u.id !== userToDelete.value.id)
    deleteDialog.value = false

    toast.success('User deleted successfully', {
      position: 'top-right',
    })
  } catch (err) {
    console.error("Delete error:", err)
    toast.error('Failed to delete user', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  const colors = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    BANNED: 'error',
  }
  return colors[status] || 'secondary'
}

const getStatusIcon = (status) => {
  const icons = {
    ACTIVE: 'bx-check-circle',
    INACTIVE: 'bx-time-five',
    BANNED: 'bx-block',
  }
  return icons[status] || 'bx-info-circle'
}

const getRoleColor = (role) => {
  return role === 'ADMIN' ? 'primary' : 'info'
}

const formatDate = (date) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleString()
}
</script>

<template>
  <div>
    <!-- Header -->
    <!-- Filters Card -->
    <VCard class="mb-6 elevation-2">
      <VCardText>
        <VRow dense>
          <!-- Search -->
          <VCol cols="12" md="5">
            <VTextField
              v-model="search"
              label="Search users..."
              placeholder="Name, email, phone..."
              prepend-inner-icon="bx-search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </VCol>

          <!-- Status Filter -->
          <VCol cols="12" md="4">
            <VSelect
              v-model="filterStatus"
              :items="[
                { title: 'All Status', value: '' },
                { title: 'Active', value: 'ACTIVE' },
                { title: 'Inactive', value: 'INACTIVE' },
                { title: 'Banned', value: 'BANNED' },
              ]"
              label="Filter by Status"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Sort -->
          <VCol cols="12" md="3">
            <VSelect
              v-model="ordering"
              :items="[
                { title: 'Newest First', value: '-id' },
                { title: 'Oldest First', value: 'id' },
                { title: 'Name A-Z', value: 'first_name' },
                { title: 'Name Z-A', value: '-first_name' },
                { title: 'Email A-Z', value: 'email' },
                { title: 'Email Z-A', value: '-email' },
              ]"
              label="Sort by"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Users Table Card -->
    <VCard class="elevation-2">
      <VCardText class="pa-0">
        <!-- Loading Overlay -->
        <VProgressLinear
          v-if="loading"
          indeterminate
          color="primary"
        />

        <!-- Table -->
        <VTable class="modern-table">
          <thead>
            <tr>
              <th class="text-uppercase">User</th>
              <th class="text-uppercase">Contact</th>
              <th class="text-uppercase">Role</th>
              <th class="text-uppercase">Status</th>
              <th class="text-uppercase">Balance</th>
              <th class="text-uppercase text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="table-row"
            >
              <!-- User Info -->
              <td>
                <div class="d-flex align-center gap-3">
                  <VAvatar
                    :color="user.status === 'ACTIVE' ? 'success' : 'error'"
                    size="40"
                    variant="tonal"
                  >
                    <span class="text-h6">{{ user.first_name.charAt(0) }}{{ user.last_name.charAt(0) }}</span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-semibold">
                      {{ user.first_name }} {{ user.last_name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      ID: #{{ user.id }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td>
                <div>
                  <div class="d-flex align-center gap-1 mb-1">
                    <VIcon icon="bx-envelope" size="16" class="text-medium-emphasis" />
                    <span class="text-body-2">{{ user.email }}</span>
                  </div>
                  <div v-if="user.phone_number" class="d-flex align-center gap-1">
                    <VIcon icon="bx-phone" size="16" class="text-medium-emphasis" />
                    <span class="text-body-2 text-medium-emphasis">{{ user.phone_number }}</span>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td>
                <VChip
                  :color="getRoleColor(user.role)"
                  size="small"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  <VIcon :icon="user.role === 'ADMIN' ? 'bx-shield' : 'bx-user'" start size="16" />
                  {{ user.role }}
                </VChip>
              </td>

              <!-- Status -->
              <td>
                <VChip
                  :color="getStatusColor(user.status)"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  <VIcon :icon="getStatusIcon(user.status)" start size="16" />
                  {{ user.status }}
                </VChip>
              </td>

              <!-- Balance -->
              <td>
                <div class="font-weight-semibold text-success">
                  ${{ user.balance?.toLocaleString() || '0.00' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ user.currency || 'USD' }}
                </div>
              </td>

              <!-- Actions -->
              <td>
                <div class="d-flex justify-center gap-1">
                  <VTooltip text="View Details">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="info"
                        @click="viewUser(user)"
                      >
                        <VIcon icon="bx-show" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Edit User">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="warning"
                        @click="editUser(user)"
                      >
                        <VIcon icon="bx-edit" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Delete User">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteUser(user)"
                      >
                        <VIcon icon="bx-trash" />
                      </VBtn>
                    </template>
                  </VTooltip>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="users.length === 0 && !loading">
              <td colspan="6" class="text-center pa-8">
                <VIcon icon="bx-user-x" size="64" class="text-disabled mb-4" />
                <div class="text-h6 text-medium-emphasis mb-2">No Users Found</div>
                <div class="text-body-2 text-disabled">Try adjusting your search or filters</div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>

      <!-- Pagination -->
      <VCardText v-if="totalPages > 1" class="d-flex justify-center">
        <VPagination
          v-model="page"
          :length="totalPages"
          :total-visible="7"
          rounded="circle"
          size="small"
        />
      </VCardText>
    </VCard>

    <!-- VIEW USER MODAL -->
    <VDialog
      v-model="viewDialog"
      max-width="700"
      transition="dialog-bottom-transition"
      persistent
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar
              :color="getStatusColor(selectedUser?.status)"
              size="48"
              variant="tonal"
            >
              <VIcon :icon="getStatusIcon(selectedUser?.status)" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">User Profile</div>
              <div class="text-body-2 text-medium-emphasis">Complete user information</div>
            </div>
          </div>
          <VBtn icon variant="text" @click="viewDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Personal Info -->
            <VCol cols="12">
              <div class="text-overline text-medium-emphasis mb-3">Personal Information</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-user" size="18" />
                  First Name
                </div>
                <div class="info-value">{{ selectedUser?.first_name }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-user" size="18" />
                  Last Name
                </div>
                <div class="info-value">{{ selectedUser?.last_name }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-envelope" size="18" />
                  Email Address
                </div>
                <div class="info-value">{{ selectedUser?.email }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-phone" size="18" />
                  Phone Number
                </div>
                <div class="info-value">{{ selectedUser?.phone_number || 'Not provided' }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-globe" size="18" />
                  Country
                </div>
                <div class="info-value">{{ selectedUser?.country || 'Not provided' }}</div>
              </div>
            </VCol>

            <!-- Account Info -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Account Details</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-shield" size="18" />
                  Role
                </div>
                <VChip :color="getRoleColor(selectedUser?.role)" size="small" variant="tonal">
                  {{ selectedUser?.role }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon :icon="getStatusIcon(selectedUser?.status)" size="18" />
                  Status
                </div>
                <VChip :color="getStatusColor(selectedUser?.status)" size="small" variant="flat">
                  {{ selectedUser?.status }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-wallet" size="18" />
                  Balance
                </div>
                <div class="info-value text-success font-weight-bold">
                  ${{ selectedUser?.balance?.toLocaleString() || '0.00' }} {{ selectedUser?.currency }}
                </div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-time" size="18" />
                  Timezone
                </div>
                <div class="info-value">{{ selectedUser?.timezone || 'Not set' }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-log-in" size="18" />
                  Last Login
                </div>
                <div class="info-value">{{ formatDate(selectedUser?.last_login_at) }}</div>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn color="primary" variant="flat" @click="viewDialog = false">
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- EDIT USER MODAL -->
    <VDialog
      v-model="editDialog"
      max-width="700"
      transition="dialog-bottom-transition"
      persistent
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="warning" size="48" variant="tonal">
              <VIcon icon="bx-edit" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Edit User</div>
              <div class="text-body-2 text-medium-emphasis">Update user information</div>
            </div>
          </div>
          <VBtn icon variant="text" @click="editDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VForm>
            <VRow>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="editForm.first_name"
                  label="First Name"
                  prepend-inner-icon="bx-user"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="editForm.last_name"
                  label="Last Name"
                  prepend-inner-icon="bx-user"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="editForm.email"
                  label="Email Address"
                  type="email"
                  prepend-inner-icon="bx-envelope"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="editForm.phone_number"
                  label="Phone Number"
                  prepend-inner-icon="bx-phone"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="editForm.country"
                  label="Country"
                  prepend-inner-icon="bx-globe"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="editForm.status"
                  :items="['ACTIVE', 'INACTIVE', 'BANNED']"
                  label="Status"
                  prepend-inner-icon="bx-info-circle"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="editForm.timezone"
                  label="Timezone"
                  prepend-inner-icon="bx-time"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn variant="text" @click="editDialog = false">
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="updateUser"
          >
            <VIcon icon="bx-save" start />
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- DELETE CONFIRMATION MODAL -->
    <VDialog
      v-model="deleteDialog"
      max-width="500"
      transition="dialog-bottom-transition"
      persistent
    >
      <VCard class="rounded-xl">
        <VCardTitle class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="error" size="48" variant="tonal">
              <VIcon icon="bx-trash" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Delete User</div>
              <div class="text-body-2 text-medium-emphasis">This action cannot be undone</div>
            </div>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VAlert
            type="warning"
            variant="tonal"
            prominent
            class="mb-4"
          >
            <VAlertTitle class="font-weight-bold">Warning!</VAlertTitle>
            You are about to permanently delete this user.
          </VAlert>

          <div class="text-body-1">
            Are you sure you want to delete 
            <strong class="text-error">{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong>?
          </div>
          <div class="text-body-2 text-medium-emphasis mt-2">
            All associated data will be permanently removed from the system.
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog = false">
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            :loading="loading"
            @click="confirmDelete"
          >
            <VIcon icon="bx-trash" start />
            Delete User
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.modern-table {
  thead {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    
    th {
      font-weight: 600;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
      color: rgb(var(--v-theme-on-surface-variant));
      padding: 1rem !important;
    }
  }

  tbody {
    tr.table-row {
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(var(--v-theme-primary), 0.04);
      }
      
      td {
        padding: 1rem !important;
        border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      }
    }
  }
}

.info-item {
  .info-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgb(var(--v-theme-on-surface-variant));
    margin-bottom: 0.5rem;
  }

  .info-value {
    font-size: 0.95rem;
    font-weight: 500;
    color: rgb(var(--v-theme-on-surface));
  }
}
</style>
