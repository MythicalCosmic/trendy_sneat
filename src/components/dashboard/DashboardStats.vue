<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const stats = computed(() => [
  {
    title: 'Total Revenue',
    value: `$${props.data.total.revenue.toLocaleString()}`,
    change: props.data.this_week.revenue > 0 ? '+' + ((props.data.this_week.revenue / props.data.total.revenue) * 100).toFixed(1) : '0',
    icon: 'bx-dollar',
    color: 'primary',
    subtitle: 'This Week'
  },
  {
    title: 'Total Orders',
    value: props.data.total.orders.toString(),
    change: props.data.this_week.orders > 0 ? '+' + props.data.this_week.orders : '0',
    icon: 'bx-cart',
    color: 'success',
    subtitle: 'This Week'
  },
  {
    title: 'Total Profit',
    value: `$${props.data.total.profit.toLocaleString()}`,
    change: props.data.this_week.profit > 0 ? '+' + ((props.data.this_week.profit / props.data.total.profit) * 100).toFixed(1) : '0',
    icon: 'bx-trending-up',
    color: 'info',
    subtitle: 'This Week'
  },
  {
    title: 'Avg Order Value',
    value: `$${props.data.total.avg_order_value.toLocaleString()}`,
    change: '0',
    icon: 'bx-wallet',
    color: 'warning',
    subtitle: 'Per Order'
  }
])
</script>

<template>
  <VRow>
    <VCol
      v-for="stat in stats"
      :key="stat.title"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <p class="text-sm text-medium-emphasis mb-1">
                {{ stat.title }}
              </p>
              <h4 class="text-h4 mb-1">
                {{ stat.value }}
              </h4>
              <div class="d-flex align-center gap-1">
                <VIcon
                  v-if="parseFloat(stat.change) > 0"
                  icon="bx-up-arrow-alt"
                  size="20"
                  color="success"
                />
                <span class="text-sm" :class="parseFloat(stat.change) > 0 ? 'text-success' : 'text-medium-emphasis'">
                  {{ stat.change }}% {{ stat.subtitle }}
                </span>
              </div>
            </div>
            <VAvatar
              :color="stat.color"
              variant="tonal"
              size="46"
              rounded
            >
              <VIcon
                :icon="stat.icon"
                size="28"
              />
            </VAvatar>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
