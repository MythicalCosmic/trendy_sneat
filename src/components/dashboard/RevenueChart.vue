<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@core/utils/colorConverter'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const vuetifyTheme = useTheme()

const series = computed(() => [
  {
    name: 'Revenue',
    data: [
      props.data.total.revenue || 0,
      props.data.this_month.revenue || 0,
      props.data.this_week.revenue || 0,
      props.data.today.revenue || 0,
    ]
  },
  {
    name: 'Profit',
    data: [
      props.data.total.profit || 0,
      props.data.this_month.profit || 0,
      props.data.this_week.profit || 0,
      props.data.today.profit || 0,
    ]
  }
])

const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`
  const borderColor = `rgba(${hexToRgb(String(variableTheme['border-color']))},${variableTheme['border-opacity']})`

  return {
    chart: {
      stacked: false,
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    colors: [currentTheme.primary, currentTheme.success],
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      fontFamily: 'Public Sans',
      labels: { colors: currentTheme.secondary },
      itemMargin: {
        vertical: 4,
        horizontal: 10,
      },
      markers: {
        width: 11,
        height: 11,
        radius: 10,
      },
    },
    grid: {
      strokeDashArray: 6,
      borderColor,
      padding: { 
        top: 0,
        bottom: 5,
        left: 20,
        right: 20,
      },
    },
    xaxis: {
      categories: ['Total', 'This Month', 'This Week', 'Today'],
      labels: {
        style: {
          fontSize: '13px',
          colors: disabledTextColor,
          fontFamily: 'Public Sans',
        },
      },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '13px',
          colors: disabledTextColor,
          fontFamily: 'Public Sans',
        },
        formatter: (value) => `$${value.toLocaleString()}`,
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value) => `$${value.toLocaleString()}`,
      },
    },
  }
})
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Revenue Overview</VCardTitle>
      <VCardSubtitle>Total revenue and profit breakdown</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VueApexCharts
        type="area"
        :height="350"
        :options="chartOptions"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>

