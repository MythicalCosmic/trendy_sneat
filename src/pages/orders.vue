<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'
import { formatDistanceToNow } from 'date-fns'

const toast = useToast()

const orders = ref([])
const stats = ref({
  overall: {
    total_orders: 0,
    total_revenue: 0,
    total_profit: 0,
    avg_order_value: 0,
    status_breakdown: {}
  }
})
const loading = ref(false)
const selectedOrders = ref([])

// MODAL STATES
const viewDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const bulkActionDialog = ref(false)
const selectedOrder = ref(null)
const orderToDelete = ref(null)

// EDIT FORM
const editForm = ref({
  status: '',
  admin_note: '',
  start_count: '',
  remains: '',
})

// FILTER STATES
const search = ref("")
const filterStatus = ref("")
const filterService = ref("")
const dateFrom = ref("")
const dateTo = ref("")
const ordering = ref("-id")

// BULK ACTION
const bulkAction = ref("")

// PAGINATION
const page = ref(1)
const perPage = ref(20)
const totalPages = ref(1)

const services = ref([])

const fetchOrders = async () => {
  try {
    loading.value = true
    const res = await api.get('/api-admin/orders', {
      params: {
        page: page.value,
        per_page: perPage.value,
        search: search.value || undefined,
        status: filterStatus.value || undefined,
        service_id: filterService.value || undefined,
        date_from: dateFrom.value || undefined,
        date_to: dateTo.value || undefined,
        ordering: ordering.value || undefined,
      }
    })

    orders.value = res.data.data.orders
    totalPages.value = res.data.data.pagination.total_pages
  } catch (err) {
    console.error("Error loading orders:", err)
    toast.error('Failed to load orders', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get('/api-admin/orders/analytics')
    stats.value = res.data.data
  } catch (err) {
    console.error("Error loading stats:", err)
  }
}

const fetchServices = async () => {
  try {
    const res = await api.get('/api-admin/services')
    services.value = res.data.data.services
  } catch (err) {
    console.error("Error loading services:", err)
  }
}

onMounted(() => {
  fetchOrders()
  fetchStats()
  fetchServices()
})

watch([search, filterStatus, filterService, dateFrom, dateTo, ordering, page], () => {
  fetchOrders()
})

const viewOrder = order => {
  selectedOrder.value = order
  viewDialog.value = true
}

const editOrder = order => {
  selectedOrder.value = order
  editForm.value = {
    status: order.status,
    admin_note: order.admin_note || '',
    start_count: order.start_count,
    remains: order.remains,
  }
  editDialog.value = true
}

const updateOrder = async () => {
  try {
    loading.value = true
    await api.patch(
      `/api-admin/orders/${selectedOrder.value.id}/update`,
      editForm.value
    )

    editDialog.value = false

    toast.success('Order updated successfully! 🎉', {
      position: 'top-right',
    })

    await fetchOrders()
    await fetchStats()
  } catch (err) {
    console.error("Update error:", err)
    toast.error(err.response?.data?.message || 'Failed to update order', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const updateOrderStatus = async (order, newStatus) => {
  try {
    loading.value = true
    await api.patch(`/api-admin/orders/${order.id}/status`, {
      status: newStatus
    })

    order.status = newStatus

    toast.success(`Order status updated to ${newStatus}!`, {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Status update error:", err)
    toast.error('Failed to update status', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const deleteOrder = (order) => {
  orderToDelete.value = order
  deleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    loading.value = true
    await api.delete(`/api-admin/orders/${orderToDelete.value.id}/delete`)

    orders.value = orders.value.filter(o => o.id !== orderToDelete.value.id)
    deleteDialog.value = false

    toast.success('Order deleted successfully', {
      position: 'top-right',
    })

    await fetchStats()
  } catch (err) {
    console.error("Delete error:", err)
    toast.error('Failed to delete order', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const handleBulkAction = () => {
  if (selectedOrders.value.length === 0) {
    toast.warning('Please select orders first', {
      position: 'top-right',
    })
    return
  }
  bulkActionDialog.value = true
}

const confirmBulkAction = async () => {
  try {
    loading.value = true
    const orderIds = selectedOrders.value.map(o => o.id)

    if (bulkAction.value === 'delete') {
      await api.post('/api-admin/orders/bulk-delete', {
        order_ids: orderIds
      })
      
      orders.value = orders.value.filter(o => !orderIds.includes(o.id))
      toast.success(`${orderIds.length} orders deleted`, {
        position: 'top-right',
      })
    } else {
      await api.post('/api-admin/orders/bulk-update', {
        order_ids: orderIds,
        status: bulkAction.value
      })
      
      selectedOrders.value.forEach(order => {
        order.status = bulkAction.value
      })
      
      toast.success(`${orderIds.length} orders updated to ${bulkAction.value}`, {
        position: 'top-right',
      })
    }

    selectedOrders.value = []
    bulkActionDialog.value = false
    await fetchStats()
  } catch (err) {
    console.error("Bulk action error:", err)
    toast.error('Failed to perform bulk action', {
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  const colors = {
    PENDING: 'warning',
    PROCESSING: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error',
    PARTIAL: 'secondary',
    FAILED: 'error',
  }
  return colors[status] || 'secondary'
}

const getStatusIcon = (status) => {
  const icons = {
    PENDING: 'bx-time',
    PROCESSING: 'bx-loader-alt',
    COMPLETED: 'bx-check-circle',
    CANCELLED: 'bx-x-circle',
    PARTIAL: 'bx-info-circle',
    FAILED: 'bx-error-circle',
  }
  return icons[status] || 'bx-info-circle'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'Invalid date'
  }
}

const allSelected = computed(() => {
  return orders.value.length > 0 && selectedOrders.value.length === orders.value.length
})

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedOrders.value = []
  } else {
    selectedOrders.value = [...orders.value]
  }
}

const isSelected = (order) => {
  return selectedOrders.value.some(o => o.id === order.id)
}

const toggleSelect = (order) => {
  const index = selectedOrders.value.findIndex(o => o.id === order.id)
  if (index > -1) {
    selectedOrders.value.splice(index, 1)
  } else {
    selectedOrders.value.push(order)
  }
}
</script>

<template>
  <div>
    <!-- Header with Stats -->
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">Orders Management</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">Track and manage all customer orders</p>

      <!-- Stats Cards -->
      <VRow>
        <VCol cols="12" sm="6" md="3">
          <VCard class="elevation-2 stats-card">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <p class="text-sm text-medium-emphasis mb-1">Total Orders</p>
                  <h3 class="text-h3 font-weight-bold">{{ stats.overall.total_orders }}</h3>
                </div>
                <VAvatar color="primary" size="56" variant="tonal">
                  <VIcon icon="bx-cart" size="32" />
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
                  <p class="text-sm text-medium-emphasis mb-1">Total Revenue</p>
                  <h3 class="text-h3 font-weight-bold text-success">${{ stats.overall.total_revenue?.toFixed(2) }}</h3>
                </div>
                <VAvatar color="success" size="56" variant="tonal">
                  <VIcon icon="bx-dollar" size="32" />
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
                  <p class="text-sm text-medium-emphasis mb-1">Total Profit</p>
                  <h3 class="text-h3 font-weight-bold text-info">${{ stats.overall.total_profit?.toFixed(2) }}</h3>
                </div>
                <VAvatar color="info" size="56" variant="tonal">
                  <VIcon icon="bx-trending-up" size="32" />
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
                  <p class="text-sm text-medium-emphasis mb-1">Avg Order Value</p>
                  <h3 class="text-h3 font-weight-bold text-warning">${{ stats.overall.avg_order_value?.toFixed(2) }}</h3>
                </div>
                <VAvatar color="warning" size="56" variant="tonal">
                  <VIcon icon="bx-wallet" size="32" />
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
          <VCol cols="12" md="3">
            <VTextField
              v-model="search"
              label="Search orders..."
              placeholder="Order number, email..."
              prepend-inner-icon="bx-search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </VCol>

          <!-- Service Filter -->
          <VCol cols="12" md="2">
            <VSelect
              v-model="filterService"
              :items="[
                { title: 'All Services', value: '' },
                ...services.map(s => ({ title: s.name, value: s.id }))
              ]"
              label="Service"
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
                { title: 'Pending', value: 'PENDING' },
                { title: 'Processing', value: 'PROCESSING' },
                { title: 'Completed', value: 'COMPLETED' },
                { title: 'Cancelled', value: 'CANCELLED' },
                { title: 'Partial', value: 'PARTIAL' },
                { title: 'Failed', value: 'FAILED' },
              ]"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Date From -->
          <VCol cols="12" md="2">
            <VTextField
              v-model="dateFrom"
              label="From Date"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>

          <!-- Date To -->
          <VCol cols="12" md="2">
            <VTextField
              v-model="dateTo"
              label="To Date"
              type="date"
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
                { title: 'Price ↑', value: 'price_paid' },
                { title: 'Price ↓', value: '-price_paid' },
              ]"
              label="Sort"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </VCol>
        </VRow>

        <!-- Bulk Actions -->
        <VRow v-if="selectedOrders.length > 0" class="mt-4" dense>
          <VCol cols="12">
            <div class="d-flex align-center gap-3">
              <VChip color="primary" variant="flat">
                {{ selectedOrders.length }} selected
              </VChip>
              
              <VSelect
                v-model="bulkAction"
                :items="[
                  { title: 'Set as Pending', value: 'PENDING' },
                  { title: 'Set as Processing', value: 'PROCESSING' },
                  { title: 'Set as Completed', value: 'COMPLETED' },
                  { title: 'Set as Cancelled', value: 'CANCELLED' },
                  { title: 'Delete Selected', value: 'delete' },
                ]"
                label="Bulk Action"
                variant="outlined"
                density="comfortable"
                hide-details
                style="max-width: 250px;"
              />

              <VBtn
                color="primary"
                :disabled="!bulkAction"
                @click="handleBulkAction"
              >
                Apply
              </VBtn>

              <VBtn
                variant="text"
                @click="selectedOrders = []"
              >
                Clear Selection
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Orders Table -->
    <VCard class="elevation-2">
      <VCardText class="pa-0">
        <!-- Loading -->
        <VProgressLinear
          v-if="loading"
          indeterminate
          color="primary"
        />

        <!-- Table -->
        <VTable class="modern-table">
          <thead>
            <tr>
              <th style="width: 50px;">
                <VCheckbox
                  :model-value="allSelected"
                  @update:model-value="toggleSelectAll"
                  hide-details
                  density="compact"
                />
              </th>
              <th class="text-uppercase">Order</th>
              <th class="text-uppercase">Customer</th>
              <th class="text-uppercase">Service</th>
              <th class="text-uppercase">Quantity</th>
              <th class="text-uppercase">Amount</th>
              <th class="text-uppercase">Status</th>
              <th class="text-uppercase text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="order in orders"
              :key="order.id"
              class="table-row"
              :class="{ 'selected-row': isSelected(order) }"
            >
              <!-- Checkbox -->
              <td>
                <VCheckbox
                  :model-value="isSelected(order)"
                  @update:model-value="toggleSelect(order)"
                  hide-details
                  density="compact"
                />
              </td>

              <!-- Order Info -->
              <td>
                <div>
                  <div class="font-weight-semibold text-primary cursor-pointer" @click="viewOrder(order)">
                    {{ order.order_number }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDate(order.submitted_at) }}
                  </div>
                </div>
              </td>

              <!-- Customer -->
              <td>
                <div>
                  <div class="font-weight-medium">{{ order.user.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ order.user.email }}</div>
                </div>
              </td>

              <!-- Service -->
              <td>
                <div>
                  <div class="font-weight-medium">{{ order.service.name }}</div>
                  <VChip size="x-small" variant="tonal" color="primary">
                    {{ order.service.category }}
                  </VChip>
                </div>
              </td>

              <!-- Quantity -->
              <td>
                <div class="text-body-2">
                  <div>Total: <span class="font-weight-bold">{{ order.quantity }}</span></div>
                  <div class="text-caption">Remains: {{ order.remains }}</div>
                </div>
              </td>

              <!-- Amount -->
              <td>
                <div>
                  <div class="font-weight-bold text-success">${{ order.price_paid.toFixed(2) }}</div>
                  <div class="text-caption text-info">Profit: ${{ order.profit.toFixed(2) }}</div>
                </div>
              </td>

              <!-- Status -->
              <td>
                <VChip
                  :color="getStatusColor(order.status)"
                  size="small"
                  variant="flat"
                >
                  <VIcon :icon="getStatusIcon(order.status)" start size="16" />
                  {{ order.status }}
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
                        @click="viewOrder(order)"
                      >
                        <VIcon icon="bx-show" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Edit Order">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="warning"
                        @click="editOrder(order)"
                      >
                        <VIcon icon="bx-edit" />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip text="Delete Order">
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteOrder(order)"
                      >
                        <VIcon icon="bx-trash" />
                      </VBtn>
                    </template>
                  </VTooltip>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="orders.length === 0 && !loading">
              <td colspan="8" class="text-center pa-12">
                <VIcon icon="bx-cart-alt" size="64" class="text-disabled mb-4" />
                <div class="text-h6 text-medium-emphasis mb-2">No Orders Found</div>
                <div class="text-body-2 text-disabled">No orders match your current filters</div>
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

    <!-- VIEW ORDER MODAL -->
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
              :color="getStatusColor(selectedOrder?.status)"
              size="48"
              variant="tonal"
            >
              <VIcon icon="bx-receipt" size="28" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ selectedOrder?.order_number }}</div>
              <div class="text-body-2 text-medium-emphasis">Order Details</div>
            </div>
          </div>
          <VBtn icon variant="text" @click="viewDialog = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Customer Info -->
            <VCol cols="12">
              <div class="text-overline text-medium-emphasis mb-3">Customer Information</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-user" size="18" />
                  Name
                </div>
                <div class="info-value">{{ selectedOrder?.user.name }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-envelope" size="18" />
                  Email
                </div>
                <div class="info-value">{{ selectedOrder?.user.email }}</div>
              </div>
            </VCol>

            <!-- Service Info -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Service Information</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-package" size="18" />
                  Service
                </div>
                <div class="info-value">{{ selectedOrder?.service.name }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-category" size="18" />
                  Category
                </div>
                <VChip color="primary" size="small" variant="tonal">
                  {{ selectedOrder?.service.category }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-link" size="18" />
                  Link
                </div>
                <div class="info-value">
                  <a :href="selectedOrder?.link" target="_blank" class="text-primary">
                    {{ selectedOrder?.link }}
                  </a>
                </div>
              </div>
            </VCol>

            <!-- Order Details -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Order Details</div>
            </VCol>

            <VCol cols="12" sm="4">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-hash" size="18" />
                  Quantity
                </div>
                <div class="info-value font-weight-bold">{{ selectedOrder?.quantity }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="4">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-play-circle" size="18" />
                  Start Count
                </div>
                <div class="info-value">{{ selectedOrder?.start_count }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="4">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-loader" size="18" />
                  Remains
                </div>
                <div class="info-value">{{ selectedOrder?.remains }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-dollar" size="18" />
                  Price Paid
                </div>
                <div class="info-value text-success font-weight-bold">
                  ${{ selectedOrder?.price_paid?.toFixed(2) }}
                </div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-trending-up" size="18" />
                  Profit
                </div>
                <div class="info-value text-info font-weight-bold">
                  ${{ selectedOrder?.profit?.toFixed(2) }}
                </div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon :icon="getStatusIcon(selectedOrder?.status)" size="18" />
                  Status
                </div>
                <VChip :color="getStatusColor(selectedOrder?.status)" variant="flat">
                  {{ selectedOrder?.status }}
                </VChip>
              </div>
            </VCol>

            <!-- Notes -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Notes</div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-message" size="18" />
                  Customer Note
                </div>
                <div class="info-value">{{ selectedOrder?.customer_note || 'No note' }}</div>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-note" size="18" />
                  Admin Note
                </div>
                <div class="info-value">{{ selectedOrder?.admin_note || 'No note' }}</div>
              </div>
            </VCol>

            <!-- Timestamps -->
            <VCol cols="12" class="mt-4">
              <div class="text-overline text-medium-emphasis mb-3">Timestamps</div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-time" size="18" />
                  Submitted At
                </div>
                <div class="info-value">{{ formatDate(selectedOrder?.submitted_at) }}</div>
              </div>
            </VCol>

            <VCol cols="12" sm="6">
              <div class="info-item">
                <div class="info-label">
                  <VIcon icon="bx-check" size="18" />
                  Completed At
                </div>
                <div class="info-value">{{ selectedOrder?.completed_at ? formatDate(selectedOrder.completed_at) : 'Not completed' }}</div>
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
  </div>
    </template>
