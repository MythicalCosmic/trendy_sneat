<script setup>
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'

const toast = useToast()

const suppliers = ref([])
const stats = ref({
  total_suppliers: 0,
  active_suppliers: 0,
  inactive_suppliers: 0
})
const loading = ref(false)
const testingConnection = ref(false)

// MODAL STATES
const viewDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const createDialog = ref(false)
const selectedSupplier = ref(null)
const supplierToDelete = ref(null)

// CREATE/EDIT FORM
const form = ref({
  first_name: "",
  last_name: "",
  api_url: "",
  api_key: "no_api_key",
  api_type: "",
  currency: "USD",
  rate_multipler: "",
  status: "ACTIVE",
  min_order_amount: "",
  max_order_amount: "",
  sync_enabled: false,
  description: "",
  support_url: "",
  terms_url: "",
})

// FILTER STATES
const search = ref("")
const filterStatus = ref("")
const ordering = ref("-id")

// PAGINATION STATES
const page = ref(1)
const perPage = ref(20)
const totalPages = ref(1)

const resetForm = () => {
  form.value = {
    first_name: "",
    last_name: "",
    api_url: "",
    api_key: "",
    api_type: "",
    currency: "USD",
    rate_multipler: "",
    status: "ACTIVE",
    min_order_amount: "",
    max_order_amount: "",
    sync_enabled: false,
    description: "",
    support_url: "",
    terms_url: "",
  }
}

const fetchSuppliers = async () => {
  try {
    loading.value = true
    const res = await api.get('/api-admin/suppliers', {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: search.value || undefined,
        status: filterStatus.value || undefined,
        ordering: ordering.value || undefined,
      }
    })

    suppliers.value = res.data.data.suppliers
    totalPages.value = res.data.data.pagination.total_pages
  } catch (err) {
    console.error("Error loading suppliers:", err)
    toast.error('Failed to load suppliers', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get('/api-admin/suppliers/stats')
    stats.value = res.data.data
  } catch (err) {
    console.error("Error loading stats:", err)
  }
}

onMounted(() => {
  fetchSuppliers()
  fetchStats()
})

watch([search, filterStatus, ordering, page], () => {
  fetchSuppliers()
})

const viewSupplier = supplier => {
  selectedSupplier.value = supplier
  viewDialog.value = true
}

const openCreateDialog = () => {
  resetForm()
  createDialog.value = true
}

const createSupplier = async () => {
  try {
    loading.value = true
    await api.post('/api-admin/suppliers/create', form.value)

    createDialog.value = false
    resetForm()

    toast.success('Supplier created successfully! 🎉', {
      position: 'top-right',
    })

    await fetchSuppliers()
    await fetchStats()
  } catch (err) {
    console.error("Create error:", err)
    toast.error(err.response?.data?.message || 'Failed to create supplier', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const editSupplier = supplier => {
  selectedSupplier.value = supplier
  form.value = { ...supplier }
  editDialog.value = true
}

const updateSupplier = async () => {
  try {
    loading.value = true
    await api.patch(
      `/api-admin/suppliers/${selectedSupplier.value.id}/update`,
      form.value
    )

    Object.assign(selectedSupplier.value, form.value)
    editDialog.value = false
    resetForm()
    toast.success('Supplier updated successfully! 🎉', {
      position: 'top-right',
    })

    await fetchSuppliers()
    await fetchStats()
  } catch (err) {
    console.error("Update error:", err)
    toast.error(err.response?.data?.message || 'Failed to update supplier', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (supplier) => {
  try {
    loading.value = true
    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    
    await api.patch(`/api-admin/suppliers/${supplier.id}/status`, {
      status: newStatus
    })

    supplier.status = newStatus

    toast.success(`Supplier ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`, {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Status toggle error:", err)
    toast.error('Failed to update status', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const toggleSync = async (supplier) => {
  try {
    loading.value = true
    
    await api.post(`/api-admin/suppliers/${supplier.id}/toggle-sync`)

    supplier.sync_enabled = !supplier.sync_enabled

    toast.success(`Sync ${supplier.sync_enabled ? 'enabled' : 'disabled'} successfully!`, {
      position: 'top-right',
    })
  } catch (err) {
    console.error("Sync toggle error:", err)
    toast.error('Failed to toggle sync', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const testConnection = async (supplier) => {
  try {
    testingConnection.value = true
    
    const res = await api.post(`/api-admin/suppliers/${supplier.id}/test`)

    if (res.data.success) {
      toast.success('Connection successful! ✅', {
        position: 'top-right',
      })
    } else {
      toast.error('Connection failed', {
        position: 'top-right',
      })
    }
  } catch (err) {
    console.error("Test connection error:", err)
    toast.error(err.response?.data?.message || 'Connection test failed', {
      position: 'top-right',
    })
  } finally {
    testingConnection.value = false
  }
}

const deleteSupplier = (supplier) => {
  supplierToDelete.value = supplier
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    loading.value = true
    await api.delete(`/api-admin/suppliers/${supplierToDelete.value.id}/delete`)

    suppliers.value = suppliers.value.filter(s => s.id !== supplierToDelete.value.id)
    deleteDialog.value = false

    toast.success('Supplier deleted successfully', {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Delete error:", err)
    toast.error('Failed to delete supplier', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  return status === 'ACTIVE' ? 'success' : 'error'
}

const getStatusIcon = (status) => {
  return status === 'ACTIVE' ? 'bx-check-circle' : 'bx-x-circle'
}

const formatDate = (date) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleString()
}
</script>

<template>
  <div>
    <!-- Header with Stats -->
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">Supplier Management</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">Manage API suppliers and integrations</p>

      <!-- Stats Cards -->
      <VRow>
        <VCol cols="12" md="4">
          <VCard class="elevation-2">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Total Suppliers</p>
                  <h3 class="text-h3 font-weight-bold">{{ stats.total_suppliers }}</h3>
                </div>
                <VAvatar color="primary" size="56" variant="tonal">
                  <VIcon icon="bx-server" size="32" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="4">
          <VCard class="elevation-2">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Active Suppliers</p>
                  <h3 class="text-h3 font-weight-bold text-success">{{ stats.active_suppliers }}</h3>
                </div>
                <VAvatar color="success" size="56" variant="tonal">
                  <VIcon icon="bx-check-circle" size="32" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="4">
          <VCard class="elevation-2">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Inactive Suppliers</p>
                  <h3 class="text-h3 font-weight-bold text-error">{{ stats.inactive_suppliers }}</h3>
                </div>
                <VAvatar color="error" size="56" variant="tonal">
                  <VIcon icon="bx-x-circle" size="32" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- Filters Card -->
    <VCard class="mb-6 elevation-2">
      <VCardText>
        <VRow dense align="center">
          <!-- Search -->
          <VCol cols="12" md="5">
            <VTextField
              v-model="search"
              label="Search suppliers..."
              placeholder="Name, description..."
              prepend-inner-icon="bx-search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </VCol>

          <!-- Status Filter -->
          <VCol cols="12" md="3">
            <VSelect
              v-model="filterStatus"
              :items="[
                { title: 'All Status', value: '' },
                { title: 'Active', value: 'ACTIVE' },
                { title: 'Inactive', value: 'INACTIVE' },
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
              ]"
              label="Sort by"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Create Button -->
          <VCol cols="12" md="1">
            <VBtn
              color="primary"
              block
              size="large"
              @click="openCreateDialog"
            >
              <VIcon icon="bx-plus" start />
              New
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Suppliers Table Card -->
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
              <th class="text-uppercase">Supplier</th>
              <th class="text-uppercase">API Info</th>
              <th class="text-uppercase">Currency</th>
              <th class="text-uppercase">Sync</th>
              <th class="text-uppercase">Status</th>
              <th class="text-uppercase text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="supplier in suppliers"
              :key="supplier.id"
              class="table-row"
            >
              <!-- Supplier Info -->
              <td>
                <div class="d-flex align-center gap-3">
                  <VAvatar
                    :color="getStatusColor(supplier.status)"
                    size="40"
                    variant="tonal"
                  >
                    <VIcon icon="bx-server" size="20" />
                  </VAvatar>
                  <div>
                    <div class="font-weight-semibold">
                      {{ supplier.first_name }} {{ supplier.last_name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ supplier.api_type || 'API Type' }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- API Info -->
              <td>
                <div>
                  <div class="d-flex align-center gap-1 mb-1">
                    <VIcon icon="bx-link" size="16" class="text-medium-emphasis" />
                    <span class="text-body-2" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ supplier.api_url }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Min: ${{ supplier.min_order_amount }} • Max: ${{ supplier.max_order_amount }}
                  </div>
                </div>
              </td>

              <!-- Currency -->
              <td>
                <VChip size="small" variant="tonal" color="info">
                  {{ supplier.currency }}
                </VChip>
                <div class="text-caption text-medium-emphasis mt-1">
                  Rate: {{ supplier.rate_multipler }}x
                </div>
              </td>

              <!-- Sync Status -->
              <td>
                <VChip
                  :color="supplier.sync_enabled ? 'success' : 'warning'"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  <VIcon :icon="supplier.sync_enabled ? 'bx-sync' : 'bx-pause'" start size="16" />
                  {{ supplier.sync_enabled ? 'Enabled' : 'Disabled' }}
                </VChip>
                <div v-if="supplier.last_sync_at" class="text-caption text-medium-emphasis mt-1">
                  Last: {{ formatDate(supplier.last_sync_at) }}
                </div>
              </td>

              <!-- Status -->
              <td>
                <VChip
                  :color="getStatusColor(supplier.status)"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  <VIcon :icon="getStatusIcon(supplier.status)" start size="16" />
                  {{ supplier.status }}
                </VChip>
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
                        @click="viewSupplier(supplier)"
                      >
                        <VIcon icon="bx-show" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Test Connection">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="primary"
                        :loading="testingConnection"
                        @click="testConnection(supplier)"
                      >
                        <VIcon icon="bx-wifi" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip :text="supplier.sync_enabled ? 'Disable Sync' : 'Enable Sync'">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        :color="supplier.sync_enabled ? 'warning' : 'success'"
                        @click="toggleSync(supplier)"
                      >
                        <VIcon :icon="supplier.sync_enabled ? 'bx-pause' : 'bx-play'" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip :text="supplier.status === 'ACTIVE' ? 'Deactivate' : 'Activate'">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        :color="supplier.status === 'ACTIVE' ? 'warning' : 'success'"
                        @click="toggleStatus(supplier)"
                      >
                        <VIcon :icon="supplier.status === 'ACTIVE' ? 'bx-toggle-right' : 'bx-toggle-left'" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Edit Supplier">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="warning"
                        @click="editSupplier(supplier)"
                      >
                        <VIcon icon="bx-edit" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Delete Supplier">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteSupplier(supplier)"
                      >
                        <VIcon icon="bx-trash" />
                      </VBtn>
                    </template>
                  </VTooltip>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="suppliers.length === 0 && !loading">
              <td colspan="6" class="text-center pa-8">
                <VIcon icon="bx-server" size="64" class="text-disabled mb-4" />
                <div class="text-h6 text-medium-emphasis mb-2">No Suppliers Found</div>
                <div class="text-body-2 text-disabled mb-4">Add your first supplier to get started</div>
                <VBtn color="primary" @click="openCreateDialog">
                  <VIcon icon="bx-plus" start />
                  Add Supplier
                </VBtn>
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

    <!-- VIEW SUPPLIER MODAL -->
    <VDialog
      v-model="viewDialog"
      max-width="800"
      transition="dialog-bottom-transition"
      persistent
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar
              :color="getStatusColor(selectedSupplier?.status)"
              size="48"
              variant="tonal"
            >
              <VIcon icon="bx-server" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Supplier Details</div>
              <div class="text-body-2 text-medium-emphasis">Complete supplier information</div>
            </div>
          </div>
          <VBtn icon variant="text" @click="viewDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Basic Info -->
            <VCol cols="12">
              <div class="text-overline text-medium-emphasis mb-3">Basic Information</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-user" size="18" />
                  First Name
                </div>
                <div class="info-value">{{ selectedSupplier?.first_name }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-user" size="18" />
                  Last Name
                </div>
                <div class="info-value">{{ selectedSupplier?.last_name }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-detail" size="18" />
                  Description
                </div>
                <div class="info-value">{{ selectedSupplier?.description || 'No description' }}</div>
              </div>
            </VCol>

            <!-- API Configuration -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">API Configuration</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-link" size="18" />
                  API URL
                </div>
                <div class="info-value">{{ selectedSupplier?.api_url }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-key" size="18" />
                  API Key
                </div>
                <div class="info-value">{{ selectedSupplier?.api_key ? '••••••••••' : 'Not set' }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-code" size="18" />
                  API Type
                </div>
                <div class="info-value">{{ selectedSupplier?.api_type }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-sync" size="18" />
                  Sync Status
                </div>
                <VChip :color="selectedSupplier?.sync_enabled ? 'success' : 'warning'" size="small">
                  {{ selectedSupplier?.sync_enabled ? 'Enabled' : 'Disabled' }}
                </VChip>
              </div>
            </VCol>

            <!-- Pricing & Limits -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Pricing & Limits</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-dollar" size="18" />
                  Currency
                </div>
                <div class="info-value">{{ selectedSupplier?.currency }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-trending-up" size="18" />
                  Rate Multiplier
                </div>
                <div class="info-value">{{ selectedSupplier?.rate_multipler }}x</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-down-arrow" size="18" />
                  Min Order Amount
                </div>
                <div class="info-value">${{ selectedSupplier?.min_order_amount }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-up-arrow" size="18" />
                  Max Order Amount
                </div>
                <div class="info-value">${{ selectedSupplier?.max_order_amount }}</div>
              </div>
            </VCol>

            <!-- Support Links -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Support Links</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-help-circle" size="18" />
                  Support URL
                </div>
                <div class="info-value">{{ selectedSupplier?.support_url || 'Not set' }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-file" size="18" />
                  Terms URL
                </div>
                <div class="info-value">{{ selectedSupplier?.terms_url || 'Not set' }}</div>
              </div>
            </VCol>

            <!-- Status & Sync -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Status Information</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon :icon="getStatusIcon(selectedSupplier?.status)" size="18" />
                  Status
                </div>
                <VChip :color="getStatusColor(selectedSupplier?.status)" size="small" variant="flat">
                  {{ selectedSupplier?.status }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-time" size="18" />
                  Last Sync
                </div>
                <div class="info-value">{{ formatDate(selectedSupplier?.last_sync_at) }}</div>
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

    <!-- CREATE SUPPLIER MODAL -->
   <VDialog
      v-model="createDialog"
      max-width="800"
      transition="dialog-bottom-transition"
      persistent
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="success" size="48" variant="tonal">
              <VIcon icon="bx-plus-circle" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Create New Supplier</div>
              <div class="text-body-2 text-medium-emphasis">Add a new supplier to your system</div>
            </div>
          </div>
          <VBtn icon variant="text" @click="createDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VForm>
            <VRow>
              <VCol cols="12" class="pb-0">
                <div class="text-overline text-medium-emphasis">Basic Information</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.first_name"
                  label="Supplier First Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., Social Media"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.last_name"
                  label="Supplier Last Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., social-media"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextarea
                  v-model="form.api_url"
                  label="API Url"
                  prepend-inner-icon="bx-world"
                  variant="outlined"
                  density="comfortable"
                  rows="1"
                  placeholder="API url of this Supplier"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.api_type"
                  label="API TYPE"
                  :items="['TES', 'TEST']"
                  prepend-inner-icon="bx-wifi"
                  variant="outlined"
                  density="comfortable",
                  placeholder="API type of this URL"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.api_key"
                  label="API KEY"
                  prepend-inner-icon="bx bx-lock"
                  variant="outlined"
                  density="comfortable"
                  placeholder="API key"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.currency"
                  :items="['USD', 'UZS', 'RUB']"
                  label="Currency *"
                  prepend-inner-icon="bx-money"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.rate_multipler"
                  label="Rate Multipler"
                  prepend-inner-icon="bx bx-calculator"
                  variant="outlined"
                  type="number"
                  density="comfortable"
                  placeholder="Rate Multipler"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.min_order_amount"
                  label="Minimum Order Amount"
                  prepend-inner-icon="bx-shopping-bag"
                  variant="outlined"
                  type="number"
                  density="comfortable"
                  placeholder="Minimum Order Amount"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.max_order_amount"
                  label="Maximum Order Amount"
                  prepend-inner-icon="bx-shopping-bag"
                  variant="outlined"
                  type="number"
                  density="comfortable"
                  placeholder="Maximum Order Amount"
                />
              </VCol>

               <VCol cols="12">
                <VTextarea
                  v-model="form.description"
                  label="Description"
                  prepend-inner-icon="bx-detail"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  placeholder="Brief description of this supplier..."
                />
              </VCol>
               <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.support_url"
                  label="Support Url"
                  prepend-inner-icon="bx-link"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Support Url"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.terms_url"
                  label="Terms Url"
                  prepend-inner-icon="bx-file"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Terms Url"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn variant="text" @click="createDialog = false">
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="createSupplier"
          >
            <VIcon icon="bx-plus" start />
            Create Supplier
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    <VDialog
      v-model="editDialog"
      max-width="800"
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
              <div class="text-h5 font-weight-bold">Edit Supplier</div>
              <div class="text-body-2 text-medium-emphasis">Update supplier information</div>
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
              <VCol cols="12" class="pb-0">
                <div class="text-overline text-medium-emphasis">Basic Information</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.first_name"
                  label="Supplier First Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., Social Media"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.last_name"
                  label="Supplier Last Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., social-media"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextarea
                  v-model="form.api_url"
                  label="API Url"
                  prepend-inner-icon="bx-world"
                  variant="outlined"
                  density="comfortable"
                  rows="1"
                  placeholder="API url of this Supplier"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.api_type"
                  label="API TYPE"
                  :items="['TES', 'TEST']"
                  prepend-inner-icon="bx-wifi"
                  variant="outlined"
                  density="comfortable",
                  placeholder="API type of this URL"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.api_key"
                  label="API KEY"
                  prepend-inner-icon="bx bx-lock"
                  variant="outlined"
                  density="comfortable"
                  placeholder="API key"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.currency"
                  :items="['USD', 'UZS', 'RUB']"
                  label="Currency *"
                  prepend-inner-icon="bx-money"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>
            <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.rate_multipler"
                  label="Rate Multipler"
                  prepend-inner-icon="bx bx-calculator"
                  variant="outlined"
                  type="number"
                  density="comfortable"
                  placeholder="Rate Multipler"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.min_order_amount"
                  label="Minimum Order Amount"
                  prepend-inner-icon="bx-shopping-bag"
                  variant="outlined"
                  type="number"
                  density="comfortable"
                  placeholder="Minimum Order Amount"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.max_order_amount"
                  label="Maximum Order Amount"
                  prepend-inner-icon="bx-shopping-bag"
                  variant="outlined"
                  type="number"
                  density="comfortable"
                  placeholder="Maximum Order Amount"
                />
              </VCol>

               <VCol cols="12">
                <VTextarea
                  v-model="form.description"
                  label="Description"
                  prepend-inner-icon="bx-detail"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  placeholder="Brief description of this supplier..."
                />
              </VCol>
               <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.support_url"
                  label="Support Url"
                  prepend-inner-icon="bx-link"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Support Url"
                />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.terms_url"
                  label="Terms Url"
                  prepend-inner-icon="bx-file"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Terms Url"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
     <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn variant="text" @click="editDialog = false">
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="updateSupplier"
          >
            <VIcon icon="bx-save" start />
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
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
              <div class="text-h5 font-weight-bold">Delete Category</div>
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
            You are about to permanently delete this supplier.
          </VAlert>

          <div class="text-body-1">
            Are you sure you want to delete 
            <strong class="text-error">{{ supplierToDelete?.first_name }}</strong>?
          </div>
          <div class="text-body-2 text-medium-emphasis mt-2">
            All services under this supplier may be affected. This action cannot be undone.
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
            Delete Supplier
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
