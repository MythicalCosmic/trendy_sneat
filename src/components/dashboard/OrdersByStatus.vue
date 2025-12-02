<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const vuetifyTheme = useTheme()

const series = computed(() => [
  props.data.pending || 0,
  props.data.processing || 0,
  props.data.completed || 0,
  props.data.cancelled || 0,
  props.data.partial || 0,
])

const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors

  return {
    chart: {
      sparkline: { enabled: true },
    },
    labels: ['Pending', 'Processing', 'Completed', 'Cancelled', 'Partial'],
    colors: [
      currentTheme.warning,
      currentTheme.info,
      currentTheme.success,
      currentTheme.error,
      currentTheme.secondary,
    ],
    stroke: {
      width: 6,
      colors: [currentTheme.surface],
    },
    legend: { show: false },
    tooltip: { enabled: true },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${parseInt(val)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: 'Total',
              formatter: () => {
                const total = Object.values(props.data).reduce((a, b) => a + b, 0)
                return total.toString()
              },
            },
          },
        },
      },
    },
  }
})

const statusList = computed(() => [
  {
    title: 'Pending',
    count: props.data.pending || 0,
    color: 'warning',
    icon: 'bx-time',
  },
  {
    title: 'Processing',
    count: props.data.processing || 0,
    color: 'info',
    icon: 'bx-loader-alt',
  },
  {
    title: 'Completed',
    count: props.data.completed || 0,
    color: 'success',
    icon: 'bx-check-circle',
  },
  {
    title: 'Cancelled',
    count: props.data.cancelled || 0,
    color: 'error',
    icon: 'bx-x-circle',
  },
  {
    title: 'Partial',
    count: props.data.partial || 0,
    color: 'secondary',
    icon: 'bx-info-circle',
  },
])
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Orders by Status</VCardTitle>
      <VCardSubtitle>Order distribution</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <div class="mb-6">
        <VueApexCharts
          type="donut"
          :height="250"
          :options="chartOptions"
          :series="series"
        />
      </div>

      <VList class="card-list">
        <VListItem
          v-for="status in statusList"
          :key="status.title"
          density="compact"
        >
          <template #prepend>
            <VAvatar
              size="36"
              rounded
              variant="tonal"
              :color="status.color"
            >
              <VIcon :icon="status.icon" size="20" />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-medium">
            {{ status.title }}
          </VListItemTitle>

          <template #append>
            <span class="font-weight-bold">{{ status.count }}</span>
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.8rem;
}
</style>
