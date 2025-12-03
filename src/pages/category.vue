<script setup>
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'

const toast = useToast()

const categories = ref([])
const stats = ref({
  total_categories: 0,
  active_categories: 0,
  inactive_categories: 0
})
const loading = ref(false)

// MODAL STATES
const viewDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const createDialog = ref(false)
const selectedCategory = ref(null)
const categoryToDelete = ref(null)

// CREATE/EDIT FORM
const form = ref({
  name: "",
  slug: "",
  description: "",
  icon: "",
  sort_order: "",
  status: "ACTIVE",
  meta_title: "",
  meta_description: "",
})

// FILTER STATES
const search = ref("")
const filterStatus = ref("")
const ordering = ref("sort_order")

// PAGINATION STATES
const page = ref(1)
const perPage = ref(20)
const totalPages = ref(1)

const resetForm = () => {
  form.value = {
    name: "",
    slug: "",
    description: "",
    icon: "",
    sort_order: "",
    status: "ACTIVE",
    meta_title: "",
    meta_description: "",
  }
}

const fetchCategories = async () => {
  try {
    loading.value = true
    const res = await api.get('/api-admin/categories', {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: search.value || undefined,
        status: filterStatus.value || undefined,
        ordering: ordering.value || undefined,
      }
    })

    categories.value = res.data.data.categories
    totalPages.value = res.data.data.pagination.total_pages
  } catch (err) {
    console.error("Error loading categories:", err)
    toast.error('Failed to load categories', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get('/api-admin/categories/stats')
    stats.value = res.data.data
  } catch (err) {
    console.error("Error loading stats:", err)
  }
}

onMounted(() => {
  fetchCategories()
  fetchStats()
})

watch([search, filterStatus, ordering, page], () => {
  fetchCategories()
})

const viewCategory = category => {
  selectedCategory.value = category
  viewDialog.value = true
}

const openCreateDialog = () => {
  resetForm()
  createDialog.value = true
}

const createCategory = async () => {
  try {
    loading.value = true
    await api.post('/api-admin/categories/create', form.value)

    createDialog.value = false
    resetForm()

    toast.success('Category created successfully! 🎉', {
      position: 'top-right',
    })

    await fetchCategories()
    await fetchStats()
  } catch (err) {
    console.error("Create error:", err)
    toast.error(err.response?.data?.message || 'Failed to create category', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const editCategory = category => {
  selectedCategory.value = category
  form.value = { ...category }
  editDialog.value = true
}

const updateCategory = async () => {
  try {
    loading.value = true
    await api.patch(
      `/api-admin/categories/${selectedCategory.value.id}/update`,
      form.value
    )

    Object.assign(selectedCategory.value, form.value)
    editDialog.value = false
    resetForm()

    toast.success('Category updated successfully! 🎉', {
      position: 'top-right',
    })

    await fetchCategories()
    await fetchStats()
  } catch (err) {
    console.error("Update error:", err)
    toast.error(err.response?.data?.message || 'Failed to update category', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (category) => {
  try {
    loading.value = true
    const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    
    await api.patch(`/api-admin/categories/${category.id}/status`, {
      status: newStatus
    })

    category.status = newStatus

    toast.success(`Category ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`, {
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

const deleteCategory = (category) => {
  categoryToDelete.value = category
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    loading.value = true
    await api.delete(`/api-admin/categories/${categoryToDelete.value.id}/delete`)

    categories.value = categories.value.filter(c => c.id !== categoryToDelete.value.id)
    deleteDialog.value = false

    toast.success('Category deleted successfully', {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Delete error:", err)
    toast.error('Failed to delete category', {
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
</script>

<template>
  <div>
    <!-- Header with Stats -->
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">Category Management</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">Organize and manage service categories</p>

      <!-- Stats Cards -->
      <VRow>
        <VCol cols="12" md="4">
          <VCard class="elevation-2">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Total Categories</p>
                  <h3 class="text-h3 font-weight-bold">{{ stats.total_categories }}</h3>
                </div>
                <VAvatar color="primary" size="56" variant="tonal">
                  <VIcon icon="bx-category" size="32" />
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
                  <p class="text-sm text-medium-emphasis mb-1">Active Categories</p>
                  <h3 class="text-h3 font-weight-bold text-success">{{ stats.active_categories }}</h3>
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
                  <p class="text-sm text-medium-emphasis mb-1">Inactive Categories</p>
                  <h3 class="text-h3 font-weight-bold text-error">{{ stats.inactive_categories }}</h3>
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
              label="Search categories..."
              placeholder="Name, slug, description..."
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
                { title: 'Sort Order', value: 'sort_order' },
                { title: 'Name A-Z', value: 'name' },
                { title: 'Name Z-A', value: '-name' },
                { title: 'Newest First', value: '-id' },
                { title: 'Oldest First', value: 'id' },
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

    <!-- Categories Table Card -->
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
              <th class="text-uppercase">Category</th>
              <th class="text-uppercase">Description</th>
              <th class="text-uppercase">Sort Order</th>
              <th class="text-uppercase">Status</th>
              <th class="text-uppercase text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="category in categories"
              :key="category.id"
              class="table-row"
            >
              <!-- Category Info -->
              <td>
                <div class="d-flex align-center gap-3">
                  <VAvatar
                    :color="getStatusColor(category.status)"
                    size="40"
                    variant="tonal"
                  >
                    <VIcon v-if="category.icon" :icon="category.icon" size="20" />
                    <span v-else class="text-h6">{{ category.name.charAt(0) }}</span>
                  </VAvatar>
                  <div>
                    <div class="font-weight-semibold">
                      {{ category.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ category.slug }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Description -->
              <td>
                <div class="text-body-2" style="max-width: 300px;">
                  {{ category.description || 'No description' }}
                </div>
              </td>

              <!-- Sort Order -->
              <td>
                <VChip size="small" variant="tonal" color="info">
                  {{ category.sort_order || 'N/A' }}
                </VChip>
              </td>

              <!-- Status -->
              <td>
                <VChip
                  :color="getStatusColor(category.status)"
                  size="small"
                  variant="flat"
                  class="font-weight-medium"
                >
                  <VIcon :icon="getStatusIcon(category.status)" start size="16" />
                  {{ category.status }}
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
                        @click="viewCategory(category)"
                      >
                        <VIcon icon="bx-show" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip :text="category.status === 'ACTIVE' ? 'Deactivate' : 'Activate'">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        :color="category.status === 'ACTIVE' ? 'warning' : 'success'"
                        @click="toggleStatus(category)"
                      >
                        <VIcon :icon="category.status === 'ACTIVE' ? 'bx-toggle-right' : 'bx-toggle-left'" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Edit Category">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="warning"
                        @click="editCategory(category)"
                      >
                        <VIcon icon="bx-edit" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Delete Category">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteCategory(category)"
                      >
                        <VIcon icon="bx-trash" />
                      </VBtn>
                    </template>
                  </VTooltip>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="categories.length === 0 && !loading">
              <td colspan="5" class="text-center pa-8">
                <VIcon icon="bx-category" size="64" class="text-disabled mb-4" />
                <div class="text-h6 text-medium-emphasis mb-2">No Categories Found</div>
                <div class="text-body-2 text-disabled mb-4">Create your first category to get started</div>
                <VBtn color="primary" @click="openCreateDialog">
                  <VIcon icon="bx-plus" start />
                  Create Category
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

    <!-- VIEW CATEGORY MODAL -->
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
              :color="getStatusColor(selectedCategory?.status)"
              size="48"
              variant="tonal"
            >
              <VIcon icon="bx-category" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">Category Details</div>
              <div class="text-body-2 text-medium-emphasis">Complete category information</div>
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
                  <VIcon icon="bx-label" size="18" />
                  Name
                </div>
                <div class="info-value">{{ selectedCategory?.name }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-link" size="18" />
                  Slug
                </div>
                <div class="info-value">{{ selectedCategory?.slug }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-detail" size="18" />
                  Description
                </div>
                <div class="info-value">{{ selectedCategory?.description || 'No description' }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-sort" size="18" />
                  Sort Order
                </div>
                <div class="info-value">{{ selectedCategory?.sort_order || 'Not set' }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon :icon="getStatusIcon(selectedCategory?.status)" size="18" />
                  Status
                </div>
                <VChip :color="getStatusColor(selectedCategory?.status)" size="small" variant="flat">
                  {{ selectedCategory?.status }}
                </VChip>
              </div>
            </VCol>

            <!-- SEO Info -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">SEO Information</div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-heading" size="18" />
                  Meta Title
                </div>
                <div class="info-value">{{ selectedCategory?.meta_title || 'Not set' }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-text" size="18" />
                  Meta Description
                </div>
                <div class="info-value">{{ selectedCategory?.meta_description || 'Not set' }}</div>
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

    <!-- CREATE CATEGORY MODAL -->
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
              <div class="text-h5 font-weight-bold">Create New Category</div>
              <div class="text-body-2 text-medium-emphasis">Add a new category to your system</div>
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
                  v-model="form.name"
                  label="Category Name *"
                  prepend-inner-icon="bx-label"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., Social Media"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.slug"
                  label="Slug *"
                  prepend-inner-icon="bx-link"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., social-media"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="form.description"
                  label="Description"
                  prepend-inner-icon="bx-detail"
                  variant="outlined"
                  density="comfortable"
                  aria-required=""
                  rows="3"
                  placeholder="Brief description of this category..."
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.icon"
                  label="Icon"
                  prepend-inner-icon="bx-image"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., bx-category"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.sort_order"
                  label="Sort Order"
                  type="number"
                  prepend-inner-icon="bx-sort"
                  variant="outlined"
                  density="comfortable"
                  placeholder="0"
                />
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

              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">SEO Settings</div>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.meta_title"
                  label="Meta Title"
                  prepend-inner-icon="bx-heading"
                  variant="outlined"
                  density="comfortable"
                  placeholder="SEO title for this category"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="form.meta_description"
                  label="Meta Description"
                  prepend-inner-icon="bx-text"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
                  placeholder="SEO description for this category"
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
            @click="createCategory"
          >
            <VIcon icon="bx-plus" start />
            Create Category
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- EDIT CATEGORY MODAL -->
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
              <div class="text-h5 font-weight-bold">Edit Category</div>
              <div class="text-body-2 text-medium-emphasis">Update category information</div>
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
                  v-model="form.name"
                  label="Category Name *"
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

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.icon"
                  label="Icon"
                  prepend-inner-icon="bx-image"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12" sm="6">
                <VTextField
                  v-model="form.sort_order"
                  label="Sort Order"
                  type="number"
                  prepend-inner-icon="bx-sort"
                  variant="outlined"
                  density="comfortable"
                />
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

              <VCol cols="12" class="pt-6 pb-0">
                <div class="text-overline text-medium-emphasis">SEO Settings</div>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.meta_title"
                  label="Meta Title"
                  prepend-inner-icon="bx-heading"
                  variant="outlined"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="form.meta_description"
                  label="Meta Description"
                  prepend-inner-icon="bx-text"
                  variant="outlined"
                  density="comfortable"
                  rows="2"
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
            @click="updateCategory"
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
            You are about to permanently delete this category.
          </VAlert>

          <div class="text-body-1">
            Are you sure you want to delete 
            <strong class="text-error">{{ categoryToDelete?.name }}</strong>?
          </div>
          <div class="text-body-2 text-medium-emphasis mt-2">
            All services under this category may be affected. This action cannot be undone.
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
            Delete Category
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
