<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/plugins/api/axios'
import DashboardStats from '@/components/dashboard/DashboardStats.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import TopServices from '@/components/dashboard/TopServices.vue'
import RecentOrders from '@/components/dashboard/RecentOrders.vue'
import OrdersByStatus from '@/components/dashboard/OrdersByStatus.vue'

const toast = useToast()
const isLoading = ref(true)
const dashboardData = ref(null)
const analytics = ref(null)
const topServices = ref([])
const recentOrders = ref([])

const fetchDashboardData = async () => {
  try {
    isLoading.value = true

    // Fetch all dashboard data in parallel
    const [statsRes, analyticsRes, servicesRes, ordersRes] = await Promise.all([
      api.get('/api-admin/orders/dashboard-stats'),
      api.get('/api-admin/orders/analytics'),
      api.get('/api-admin/orders/top-services'),
      api.get('/api-admin/orders/recent')
    ])

    dashboardData.value = statsRes.data.data
    analytics.value = analyticsRes.data.data
    topServices.value = servicesRes.data.data
    recentOrders.value = ordersRes.data.data

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    toast.error('Failed to load dashboard data', {
      position: 'top-right',
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
    </div>

    <!-- Dashboard Content -->
    <VRow v-else>
      <!-- Stats Cards -->
      <VCol cols="12">
        <DashboardStats 
          v-if="dashboardData"
          :data="dashboardData" 
        />
      </VCol>

      <!-- Revenue Chart -->
      <VCol cols="12" md="8">
        <RevenueChart 
          v-if="dashboardData"
          :data="dashboardData"
        />
      </VCol>

      <!-- Orders by Status -->
      <VCol cols="12" md="4">
        <OrdersByStatus 
          v-if="dashboardData"
          :data="dashboardData.by_status"
        />
      </VCol>

      <!-- Top Services -->
      <VCol cols="12" md="6">
        <TopServices :services="topServices" />
      </VCol>

      <!-- Recent Orders -->
      <VCol cols="12" md="6">
        <RecentOrders :orders="recentOrders" />
      </VCol>
    </VRow>
  </div>
</template>
