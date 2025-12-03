<script setup>
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
</script>

<template>
  <!-- 👉 Dashboards -->
  <VerticalNavGroup
    :item="{
      title: 'Dashboards',
      icon: 'bx-home-smile',
    }"
  >
    <VerticalNavLink
      :item="{
        title: 'Analytics',
        to: '/dashboard',
      }"
    />
  </VerticalNavGroup>

  <!-- 👉 Apps & Pages -->
  <VerticalNavSectionTitle
    :item="{
      heading: 'Apps & Pages',
    }"
  />
   <VerticalNavLink
    :item="{
      title: 'Users',
      icon: 'bx-user',
      to: '/users',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Categories',
      icon: 'bx-category',
      to: '/categories',
    }"
  />
  <VerticalNavLink
    :item="{
      title: 'Suppliers',
      icon: 'bx bxs-factory',
      to: '/suppliers',
    }"
  />

</template>
