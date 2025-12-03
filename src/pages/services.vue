<script setup>
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'

const toast = useToast()
const base_url = import.meta.env.VITE_API_URL

const services = ref([])
const stats = ref({
  total_services: 0,
  active_services: 0,
  inactive_services: 0,
  featured_services: 0,
  total_orders: 0
})
const categories = ref([])
const suppliers = ref([])
const loading = ref(false)

// MODAL STATES
const viewDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const createDialog = ref(false)
const selectedService = ref(null)
const serviceToDelete = ref(null)

// CREATE/EDIT FORM
const form = ref({
  name: "",
  slug: "",
  photo: null,
  description: "",
  price_per_100: "",
  min_quantity: "",
  max_quantity: "",
  average_time: "",
  is_featured: false,
  refill_enabled: false,
  cancel_enabled: false,
  status: "ACTIVE",
  category_id: null,
  supplier_id: null,
})

// FILTER STATES
const search = ref("")
const filterStatus = ref("")
const filterCategory = ref("")
const filterFeatured = ref("")
const ordering = ref("-id")

// PAGINATION STATES
const page = ref(1)
const perPage = ref(20)
const totalPages = ref(1)

const resetForm = () => {
  form.value = {
    name: "",
    slug: "",
    photo: null,
    description: "",
    price_per_100: "",
    min_quantity: "",
    max_quantity: "",
    average_time: "",
    is_featured: false,
    refill_enabled: false,
    cancel_enabled: false,
    status: "ACTIVE",
    category_id: null,
    supplier_id: null,
  }
}

const fetchServices = async () => {
  try {
    loading.value = true
    const res = await api.get('/api-admin/services', {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: search.value || undefined,
        status: filterStatus.value || undefined,
        category: filterCategory.value || undefined,
        is_featured: filterFeatured.value || undefined,
        ordering: ordering.value || undefined,
      }
    })

    services.value = res.data.data.services
    totalPages.value = res.data.data.pagination.total_pages
  } catch (err) {
    console.error("Error loading services:", err)
    toast.error('Failed to load services', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get('/api-admin/services/stats')
    stats.value = res.data.data
  } catch (err) {
    console.error("Error loading stats:", err)
  }
}

const fetchCategories = async () => {
  try {
    const res = await api.get('/api-admin/categories')
    categories.value = res.data.data.categories
  } catch (err) {
    console.error("Error loading categories:", err)
  }
}

const fetchSuppliers = async () => {
  try {
    const res = await api.get('/api-admin/suppliers')
    suppliers.value = res.data.data.suppliers
  } catch (err) {
    console.error("Error loading suppliers:", err)
  }
}

onMounted(() => {
  fetchServices()
  fetchStats()
  fetchCategories()
  fetchSuppliers()
})

watch([search, filterStatus, filterCategory, filterFeatured, ordering, page], () => {
  fetchServices()
})

const viewService = service => {
  selectedService.value = service
  viewDialog.value = true
}

const openCreateDialog = () => {
  resetForm()
  createDialog.value = true
}

const createService = async () => {
  try {
    loading.value = true
    const formData = new FormData()
    
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== null && form.value[key] !== '') {
        formData.append(key, form.value[key])
      }
    })

    // Let browser set Content-Type with boundary automatically
    await api.post('/api-admin/services/create', formData)

    createDialog.value = false
    resetForm()

    toast.success('Service created successfully! 🎉', {
      position: 'top-right',
    })

    await fetchServices()
    await fetchStats()
  } catch (err) {
    console.error("Create error:", err)
    toast.error(err.response?.data?.message || 'Failed to create service', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const editService = service => {
  selectedService.value = service
  form.value = {
    name: service.name,
    slug: service.slug,
    photo: null,
    description: service.description,
    price_per_100: service.price_per_100,
    min_quantity: service.min_quantity,
    max_quantity: service.max_quantity,
    average_time: service.average_time,
    is_featured: service.is_featured,
    refill_enabled: service.refill_enabled,
    cancel_enabled: service.cancel_enabled,
    status: service.status,
    category_id: service.category.id,
    supplier_id: service.supplier.id,
    supplier_service_id: service.supplier_service_id || "",
    supplier_price_per_100: service.supplier_price_per_100 || "",
  }
  editDialog.value = true
}

const updateService = async () => {
  try {
    loading.value = true
    
    // Check if there's a file to upload
    const hasFile = form.value.photo && form.value.photo instanceof File
    
    if (hasFile) {
      // Use FormData for file upload with POST (Django doesn't support PATCH with files well)
      const formData = new FormData()
      
      // Add _method field to simulate PATCH
      formData.append('_method', 'PATCH')
      
      Object.keys(form.value).forEach(key => {
        if (form.value[key] !== null && form.value[key] !== '') {
          // Convert boolean to string for FormData
          if (typeof form.value[key] === 'boolean') {
            formData.append(key, form.value[key] ? 'true' : 'false')
          } else {
            formData.append(key, form.value[key])
          }
        }
      })

      // Use POST instead of PATCH for file uploads
      await api.post(
        `/api-admin/services/${selectedService.value.id}/update`,
        formData
      )
    } else {
      // Use JSON for regular update (no file)
      const updateData = {}
      Object.keys(form.value).forEach(key => {
        if (key !== 'photo' && form.value[key] !== null && form.value[key] !== '') {
          updateData[key] = form.value[key]
        }
      })

      await api.patch(
        `/api-admin/services/${selectedService.value.id}/update`,
        updateData
      )
    }

    editDialog.value = false
    resetForm()

    toast.success('Service updated successfully! 🎉', {
      position: 'top-right',
    })

    await fetchServices()
    await fetchStats()
  } catch (err) {
    console.error("Update error:", err)
    console.error("Response:", err.response?.data)
    toast.error(err.response?.data?.message || 'Failed to update service', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (service) => {
  try {
    loading.value = true
    const newStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    
    await api.post(`/api-admin/services/${service.id}/status`, {
      status: newStatus
    })

    service.status = newStatus

    toast.success(`Service ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`, {
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

const toggleFeatured = async (service) => {
  try {
    loading.value = true
    
    await api.post(`/api-admin/services/${service.id}/toggle-featured`)

    service.is_featured = !service.is_featured

    toast.success(`Service ${service.is_featured ? 'marked as featured' : 'removed from featured'}!`, {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Featured toggle error:", err)
    toast.error('Failed to toggle featured status', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const deleteService = (service) => {
  serviceToDelete.value = service
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    loading.value = true
    await api.delete(`/api-admin/services/${serviceToDelete.value.id}/delete`)

    services.value = services.value.filter(s => s.id !== serviceToDelete.value.id)
    deleteDialog.value = false

    toast.success('Service deleted successfully', {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Delete error:", err)
    toast.error('Failed to delete service', {
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

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.value.photo = file
  }
}
</script>

<template>
  <div>
    <!-- Header with Stats -->
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">Service Management</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">Manage all services and offerings</p>

      <!-- Stats Cards -->
      <VRow>
        <VCol cols="12" sm="6" md="3">
          <VCard class="elevation-2 stats-card">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Total Services</p>
                  <h3 class="text-h3 font-weight-bold">{{ stats.total_services }}</h3>
                </div>
                <VAvatar color="primary" size="56" variant="tonal">
                  <VIcon icon="bx-package" size="32" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="elevation-2 stats-card">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Active Services</p>
                  <h3 class="text-h3 font-weight-bold text-success">{{ stats.active_services }}</h3>
                </div>
                <VAvatar color="success" size="56" variant="tonal">
                  <VIcon icon="bx-check-circle" size="32" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="elevation-2 stats-card">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Featured</p>
                  <h3 class="text-h3 font-weight-bold text-warning">{{ stats.featured_services }}</h3>
                </div>
                <VAvatar color="warning" size="56" variant="tonal">
                  <VIcon icon="bx-star" size="32" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="elevation-2 stats-card">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Total Orders</p>
                  <h3 class="text-h3 font-weight-bold text-info">{{ stats.total_orders }}</h3>
                </div>
                <VAvatar color="info" size="56" variant="tonal">
                  <VIcon icon="bx-cart" size="32" />
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
          <VCol cols="12" md="4">
            <VTextField
              v-model="search"
              label="Search services..."
              placeholder="Name, description..."
              prepend-inner-icon="bx-search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </VCol>

          <!-- Category Filter -->
          <VCol cols="12" md="2">
            <VSelect
              v-model="filterCategory"
              :items="[
                { title: 'All Categories', value: '' },
                ...categories.map(c => ({ title: c.name, value: c.id }))
              ]"
              label="Category"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Status Filter -->
          <VCol cols="12" md="2">
            <VSelect
              v-model="filterStatus"
              :items="[
                { title: 'All Status', value: '' },
                { title: 'Active', value: 'ACTIVE' },
                { title: 'Inactive', value: 'INACTIVE' },
              ]"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Featured Filter -->
          <VCol cols="12" md="2">
            <VSelect
              v-model="filterFeatured"
              :items="[
                { title: 'All', value: '' },
                { title: 'Featured', value: 'true' },
                { title: 'Not Featured', value: 'false' },
              ]"
              label="Featured"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Sort -->
          <VCol cols="12" md="1">
            <VSelect
              v-model="ordering"
              :items="[
                { title: 'Newest', value: '-id' },
                { title: 'Oldest', value: 'id' },
                { title: 'Name A-Z', value: 'name' },
                { title: 'Price ↑', value: 'price_per_100' },
                { title: 'Price ↓', value: '-price_per_100' },
              ]"
              label="Sort"
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
              <VIcon icon="bx-plus" />
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Services Grid/Table -->
    <VCard class="elevation-2">
      <VCardText class="pa-0">
        <!-- Loading Overlay -->
        <VProgressLinear
          v-if="loading"
          indeterminate
          color="primary"
        />

        <!-- Services Grid -->
        <VRow class="pa-6">
          <VCol
            v-for="service in services"
            :key="service.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <VCard class="service-card h-100" elevation="2">
              <!-- Service Image -->
              <div class="service-image-wrapper">
               <VImg
                    :src="service.photo ? base_url + service.photo : 'https://via.placeholder.com/300x200'"
                    height="200"
                    cover
                    class="service-image"
                    />

                
                <!-- Featured Badge -->
                <VChip
                  v-if="service.is_featured"
                  color="warning"
                  size="small"
                  class="featured-badge"
                >
                  <VIcon icon="bx-star" start size="16" />
                  Featured
                </VChip>

                <!-- Status Badge -->
                <VChip
                  :color="getStatusColor(service.status)"
                  size="small"
                  class="status-badge"
                >
                  {{ service.status }}
                </VChip>
              </div>

              <VCardText class="pb-2">
                <!-- Service Name -->
                <h6 class="text-h6 font-weight-bold mb-2 text-truncate">
                  {{ service.name }}
                </h6>

                <!-- Category & Supplier -->
                <div class="d-flex flex-column gap-1 mb-3">
                  <VChip size="x-small" variant="tonal" color="primary">
                    <VIcon icon="bx-category" start size="14" />
                    {{ service.category.name }}
                  </VChip>
                  <VChip size="x-small" variant="tonal" color="info">
                    <VIcon icon="bx-package" start size="14" />
                    {{ service.supplier.name }}
                  </VChip>
                </div>

                <!-- Price & Stats -->
                <div class="mb-3">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption text-medium-emphasis">Price per 100:</span>
                    <span class="text-h6 font-weight-bold text-success">
                      ${{ service.price_per_100 }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-caption text-medium-emphasis">Min/Max:</span>
                    <span class="text-caption">{{ service.min_quantity }} - {{ service.max_quantity }}</span>
                  </div>
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption text-medium-emphasis">Orders:</span>
                    <span class="text-caption font-weight-bold">{{ service.total_orders }}</span>
                  </div>
                </div>

                <!-- Features -->
                <div class="d-flex gap-1 flex-wrap mb-3">
                  <VChip
                    v-if="service.refill_enabled"
                    size="x-small"
                    color="success"
                    variant="tonal"
                  >
                    <VIcon icon="bx-refresh" start size="12" />
                    Refill
                  </VChip>
                  <VChip
                    v-if="service.cancel_enabled"
                    size="x-small"
                    color="error"
                    variant="tonal"
                  >
                    <VIcon icon="bx-x" start size="12" />
                    Cancel
                  </VChip>
                </div>
              </VCardText>

              <VDivider />

              <!-- Actions -->
              <VCardActions class="pa-3">
                <VBtn
                  size="small"
                  variant="text"
                  color="info"
                  @click="viewService(service)"
                >
                  <VIcon icon="bx-show" start size="18" />
                  View
                </VBtn>

                <VSpacer />

                <VTooltip :text="service.is_featured ? 'Remove from Featured' : 'Mark as Featured'">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      icon
                      size="small"
                      variant="text"
                      :color="service.is_featured ? 'warning' : 'grey'"
                      @click="toggleFeatured(service)"
                    >
                      <VIcon :icon="service.is_featured ? 'bxs-star' : 'bx-star'" />
                    </VBtn>
                  </template>
                </VTooltip>

                <VTooltip text="Edit">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      icon
                      size="small"
                      variant="text"
                      color="warning"
                      @click="editService(service)"
                    >
                      <VIcon icon="bx-edit" />
                    </VBtn>
                  </template>
                </VTooltip>

                <VTooltip text="Delete">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteService(service)"
                    >
                      <VIcon icon="bx-trash" />
                    </VBtn>
                  </template>
                </VTooltip>
              </VCardActions>
            </VCard>
          </VCol>

          <!-- Empty State -->
          <VCol v-if="services.length === 0 && !loading" cols="12">
            <div class="text-center pa-12">
              <VIcon icon="bx-package" size="64" class="text-disabled mb-4" />
              <div class="text-h6 text-medium-emphasis mb-2">No Services Found</div>
              <div class="text-body-2 text-disabled mb-4">Create your first service to get started</div>
              <VBtn color="primary" @click="openCreateDialog">
                <VIcon icon="bx-plus" start />
                Create Service
              </VBtn>
            </div>
          </VCol>
        </VRow>
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

    <!-- VIEW SERVICE MODAL -->
    <VDialog
      v-model="viewDialog"
      max-width="800"
      transition="dialog-bottom-transition"
      persistent
      scrollable
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar
              :color="getStatusColor(selectedService?.status)"
              size="48"
              variant="tonal"
            >
              <VIcon icon="bx-package" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ selectedService?.name }}</div>
              <div class="text-body-2 text-medium-emphasis">Service Details</div>
            </div>
          </div>
          <VBtn icon variant="text" @click="viewDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Service Image -->
            <VCol cols="12">
              <VImg
                :src="selectedService?.photo 
        ? base_url + selectedService.photo 
        : 'https://via.placeholder.com/300x200'"

                height="300"
                cover
                class="rounded-lg mb-4"
              />
            </VCol>

            <!-- Basic Info -->
            <VCol cols="12">
              <div class="text-overline text-medium-emphasis mb-3">Basic Information</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-label" size="18" />
                  Service Name
                </div>
                <div class="info-value">{{ selectedService?.name }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-link" size="18" />
                  Slug
                </div>
                <div class="info-value">{{ selectedService?.slug }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-detail" size="18" />
                  Description
                </div>
                <div class="info-value">{{ selectedService?.description || 'No description' }}</div>
              </div>
            </VCol>

            <!-- Pricing & Quantity -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Pricing & Quantity</div>
            </VCol>

            <VCol cols="12" sm="4">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-dollar" size="18" />
                  Price per 100
                </div>
                <div class="info-value text-success font-weight-bold">
                  ${{ selectedService?.price_per_100 }}
                </div>
              </div>
            </VCol>

            <VCol cols="12" sm="4">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-down-arrow" size="18" />
                  Min Quantity
                </div>
                <div class="info-value">{{ selectedService?.min_quantity }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="4">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-up-arrow" size="18" />
                  Max Quantity
                </div>
                <div class="info-value">{{ selectedService?.max_quantity }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-time" size="18" />
                  Average Time
                </div>
                <div class="info-value">{{ selectedService?.average_time }}</div>
              </div>
            </VCol>

            <!-- Category & Supplier -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Associations</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-category" size="18" />
                  Category
                </div>
                <VChip color="primary" size="small" variant="tonal">
                  {{ selectedService?.category.name }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-package" size="18" />
                  Supplier
                </div>
                <VChip color="info" size="small" variant="tonal">
                  {{ selectedService?.supplier.name }}
                </VChip>
              </div>
            </VCol>

            <!-- Features & Status -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Features & Status</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-star" size="18" />
                  Featured
                </div>
                <VChip
                  :color="selectedService?.is_featured ? 'warning' : 'grey'"
                  size="small"
                  variant="flat"
                >
                  {{ selectedService?.is_featured ? 'Yes' : 'No' }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon :icon="getStatusIcon(selectedService?.status)" size="18" />
                  Status
                </div>
                <VChip
                  :color="getStatusColor(selectedService?.status)"
                  size="small"
                  variant="flat"
                >
                  {{ selectedService?.status }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-refresh" size="18" />
                  Refill Enabled
                </div>
                <VChip
                  :color="selectedService?.refill_enabled ? 'success' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedService?.refill_enabled ? 'Yes' : 'No' }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-x" size="18" />
                  Cancel Enabled
                </div>
                <VChip
                  :color="selectedService?.cancel_enabled ? 'error' : 'grey'"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedService?.cancel_enabled ? 'Yes' : 'No' }}
                </VChip>
              </div>
            </VCol>

            <!-- Statistics -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Statistics</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-cart" size="18" />
                  Total Orders
                </div>
                <div class="info-value font-weight-bold">{{ selectedService?.total_orders }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-check" size="18" />
                  Completed Orders
                </div>
                <div class="info-value font-weight-bold text-success">{{ selectedService?.total_completed }}</div>
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

    <!-- CREATE SERVICE MODAL -->
    <VDialog
      v-model="createDialog"
      max-width="900"
      transition="dialog-bottom-transition"
      persistent
      scrollable
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="success" size="48" variant="tonal">
              <VIcon icon="bx-plus-circle" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Create New Service</div>
              <div class="text-body-2 text-medium-emphasis">Add a new service to your platform</div>
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
              <!-- Basic Information -->
              <VCol cols="12" class="pb-0">
                <div class="text-overline text-medium-emphasis">Basic Information</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.name"
                  label="Service Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., Instagram Followers"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.slug"
                  label="Slug *"
                  prepend-inner-icon="bx-link"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., instagram-followers"
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
                  placeholder="Detailed service description..."
                />
              </VCol>

              <VCol cols="12">
                <VFileInput
                  label="Service Photo"
                  prepend-inner-icon="bx-image"
                  variant="outlined"
                  density="comfortable"
                  accept="image/*"
                  @change="handleFileUpload"
                />
              </VCol>

              <!-- Pricing & Quantity -->
              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">Pricing & Quantity</div>
              </VCol>

              <VCol cols="12" sm="4">
                <VTextField
                  v-model="form.price_per_100"
                  label="Price per 100 *"
                  type="number"
                  step="0.01"
                  prepend-inner-icon="bx-dollar"
                  variant="outlined"
                  density="comfortable"
                  placeholder="0.00"
                />
              </VCol>

              <VCol cols="12" sm="4">
                <VTextField
                  v-model="form.min_quantity"
                  label="Min Quantity *"
                  type="number"
                  prepend-inner-icon="bx-down-arrow"
                  variant="outlined"
                  density="comfortable"
                  placeholder="100"
                />
              </VCol>

              <VCol cols="12" sm="4">
                <VTextField
                  v-model="form.max_quantity"
                  label="Max Quantity *"
                  type="number"
                  prepend-inner-icon="bx-up-arrow"
                  variant="outlined"
                  density="comfortable"
                  placeholder="10000"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.average_time"
                  label="Average Time"
                  prepend-inner-icon="bx-time"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., 1-2 hours"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.supplier_service_id"
                  label="Supplier Service ID *"
                  prepend-inner-icon="bx-hash"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Service ID from supplier"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.supplier_price_per_100"
                  label="Supplier Price per 100 *"
                  type="number"
                  step="0.01"
                  prepend-inner-icon="bx-dollar"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Cost from supplier"
                />
              </VCol>

              <!-- Associations -->
              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">Associations</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.category_id"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Category *"
                  prepend-inner-icon="bx-category"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.supplier_id"
                  :items="suppliers"
                  item-title="first_name"
                  item-value="id"
                  label="Supplier *"
                  prepend-inner-icon="bx-package"
                  variant="outlined"
                  density="comfortable"
                >
                  <template #item="{ props, item }">
                    <VListItem v-bind="props">
                      <VListItemTitle>{{ item.raw.first_name }} {{ item.raw.last_name }}</VListItemTitle>
                    </VListItem>
                  </template>
                </VSelect>
              </VCol>

              <!-- Features & Settings -->
              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">Features & Settings</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.status"
                  :items="['ACTIVE', 'INACTIVE']"
                  label="Status *"
                  prepend-inner-icon="bx-info-circle"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex gap-4">
                  <VCheckbox
                    v-model="form.is_featured"
                    label="Featured Service"
                    color="warning"
                    hide-details
                  />
                  <VCheckbox
                    v-model="form.refill_enabled"
                    label="Refill Enabled"
                    color="success"
                    hide-details
                  />
                  <VCheckbox
                    v-model="form.cancel_enabled"
                    label="Cancel Enabled"
                    color="error"
                    hide-details
                  />
                </div>
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
            @click="createService"
          >
            <VIcon icon="bx-plus" start />
            Create Service
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- EDIT SERVICE MODAL -->
    <VDialog
      v-model="editDialog"
      max-width="900"
      transition="dialog-bottom-transition"
      persistent
      scrollable
    >
      <VCard class="rounded-xl">
        <VCardTitle class="d-flex justify-space-between align-center pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="warning" size="48" variant="tonal">
              <VIcon icon="bx-edit" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Edit Service</div>
              <div class="text-body-2 text-medium-emphasis">Update service information</div>
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
              <!-- Basic Information -->
              <VCol cols="12" class="pb-0">
                <div class="text-overline text-medium-emphasis">Basic Information</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.name"
                  label="Service Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.slug"
                  label="Slug *"
                  prepend-inner-icon="bx-link"
                  variant="outlined"
                  density="comfortable"
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
                />
              </VCol>

              <VCol cols="12">
                <VFileInput
                  label="Update Service Photo"
                  prepend-inner-icon="bx-image"
                  variant="outlined"
                  density="comfortable"
                  accept="image/*"
                  @change="handleFileUpload"
                />
              </VCol>

              <!-- Pricing & Quantity -->
              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">Pricing & Quantity</div>
              </VCol>

              <VCol cols="12" sm="4">
                <VTextField
                  v-model="form.price_per_100"
                  label="Price per 100 *"
                  type="number"
                  step="0.01"
                  prepend-inner-icon="bx-dollar"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="4">
                <VTextField
                  v-model="form.min_quantity"
                  label="Min Quantity *"
                  type="number"
                  prepend-inner-icon="bx-down-arrow"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="4">
                <VTextField
                  v-model="form.max_quantity"
                  label="Max Quantity *"
                  type="number"
                  prepend-inner-icon="bx-up-arrow"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.average_time"
                  label="Average Time"
                  prepend-inner-icon="bx-time"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.supplier_service_id"
                  label="Supplier Service ID *"
                  prepend-inner-icon="bx-hash"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Service ID from supplier"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.supplier_price_per_100"
                  label="Supplier Price per 100 *"
                  type="number"
                  step="0.01"
                  prepend-inner-icon="bx-dollar"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Cost from supplier"
                />
              </VCol>

              <!-- Associations -->
              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">Associations</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.category_id"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Category *"
                  prepend-inner-icon="bx-category"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.supplier_id"
                  :items="suppliers"
                  item-title="first_name"
                  item-value="id"
                  label="Supplier *"
                  prepend-inner-icon="bx-package"
                  variant="outlined"
                  density="comfortable"
                >
                  <template #item="{ props, item }">
                    <VListItem v-bind="props">
                      <VListItemTitle>{{ item.raw.first_name }} {{ item.raw.last_name }}</VListItemTitle>
                    </VListItem>
                  </template>
                </VSelect>
              </VCol>

              <!-- Features & Settings -->
              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">Features & Settings</div>
              </VCol>

              <VCol cols="12" sm="6">
                <VSelect
                  v-model="form.status"
                  :items="['ACTIVE', 'INACTIVE']"
                  label="Status *"
                  prepend-inner-icon="bx-info-circle"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex gap-4">
                  <VCheckbox
                    v-model="form.is_featured"
                    label="Featured Service"
                    color="warning"
                    hide-details
                  />
                  <VCheckbox
                    v-model="form.refill_enabled"
                    label="Refill Enabled"
                    color="success"
                    hide-details
                  />
                  <VCheckbox
                    v-model="form.cancel_enabled"
                    label="Cancel Enabled"
                    color="error"
                    hide-details
                  />
                </div>
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
            @click="updateService"
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
              <div class="text-h5 font-weight-bold">Delete Service</div>
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
            You are about to permanently delete this service.
          </VAlert>

          <div class="text-body-1">
            Are you sure you want to delete 
            <strong class="text-error">{{ serviceToDelete?.name }}</strong>?
          </div>
          <div class="text-body-2 text-medium-emphasis mt-2">
            All orders and associated data will be affected. This action cannot be undone.
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
            Delete Service
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.stats-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }
}

.service-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
    
    .service-image {
      transform: scale(1.05);
    }
  }
}

.service-image-wrapper {
  position: relative;
  overflow: hidden;
}

.service-image {
  transition: transform 0.3s ease;
}

.featured-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
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
