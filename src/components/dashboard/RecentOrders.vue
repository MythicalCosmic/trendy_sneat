<script setup>
import { defineProps } from 'vue'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
  orders: {
    type: Array,
    required: true
  }
})

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

const formatDate = (date) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Recent Orders</VCardTitle>
      <VCardSubtitle>Latest transactions</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VList class="card-list">
        <VListItem
          v-for="order in orders"
          :key="order.id"
        >
          <template #prepend>
            <VAvatar
              size="40"
              rounded
              variant="tonal"
              :color="getStatusColor(order.status)"
            >
              <VIcon 
                :icon="order.status === 'COMPLETED' ? 'bx-check' : order.status === 'PENDING' ? 'bx-time' : 'bx-loader'"
                size="20"
              />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-medium">
            {{ order.service_name }}
          </VListItemTitle>
          <VListItemSubtitle class="text-body-2">
            {{ order.user_email }} • {{ formatDate(order.submitted_at) }}
          </VListItemSubtitle>

          <template #append>
            <div class="text-end">
              <div class="font-weight-bold">
                ${{ order.price_paid.toLocaleString() }}
              </div>
              <VChip
                :color="getStatusColor(order.status)"
                size="x-small"
                class="mt-1"
              >
                {{ order.status }}
              </VChip>
            </div>
          </template>
        </VListItem>

        <VListItem v-if="orders.length === 0">
          <VListItemTitle class="text-center text-medium-emphasis">
            No recent orders
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 1.25rem;
}
</style>
