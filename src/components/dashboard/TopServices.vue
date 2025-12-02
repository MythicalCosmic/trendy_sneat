<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  services: {
    type: Array,
    required: true
  }
})

const getServiceColor = (index) => {
  const colors = ['primary', 'success', 'info', 'warning', 'error']
  return colors[index % colors.length]
}
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Top Services</VCardTitle>
      <VCardSubtitle>Best performing services</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VList class="card-list">
        <VListItem
          v-for="(service, index) in services"
          :key="service.service_id"
        >
          <template #prepend>
            <VAvatar
              size="40"
              rounded
              variant="tonal"
              :color="getServiceColor(index)"
            >
              <span class="font-weight-bold">{{ index + 1 }}</span>
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-medium">
            {{ service.service_name }}
          </VListItemTitle>
          <VListItemSubtitle class="text-body-2">
            {{ service.order_count }} orders • {{ service.category }}
          </VListItemSubtitle>

          <template #append>
            <div class="text-end">
              <div class="font-weight-bold text-success">
                ${{ service.revenue.toLocaleString() }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Profit: ${{ service.profit.toLocaleString() }}
              </div>
            </div>
          </template>
        </VListItem>

        <VListItem v-if="services.length === 0">
          <VListItemTitle class="text-center text-medium-emphasis">
            No services data available
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
