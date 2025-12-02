import { h } from 'vue'

// Import custom SVG icons
import checkboxChecked from '@images/svg/checkbox-checked.svg'
import checkboxIndeterminate from '@images/svg/checkbox-indeterminate.svg'
import checkboxUnchecked from '@images/svg/checkbox-unchecked.svg'
import radioChecked from '@images/svg/radio-checked.svg'
import radioUnchecked from '@images/svg/radio-unchecked.svg'

// Import Vuetify MDI set
import { aliases as mdiAliases, mdi } from 'vuetify/iconsets/mdi'

// ------------------------------------------------------
// CUSTOM SVG ICONS
// ------------------------------------------------------
const customIcons = {
  'mdi-checkbox-blank-outline': checkboxUnchecked,
  'mdi-checkbox-marked': checkboxChecked,
  'mdi-minus-box': checkboxIndeterminate,
  'mdi-radiobox-marked': radioChecked,
  'mdi-radiobox-blank': radioUnchecked,
}

// ------------------------------------------------------
// BOXICONS & CUSTOM ALIASES
// ------------------------------------------------------
const customAliases = {
  calendar: 'bx-calendar',
  collapse: 'bx-chevron-up',
  complete: 'bx-check',
  cancel: 'bx-x',
  close: 'bx-x',
  delete: 'bx-bxs-x-circle',
  clear: 'bx-x-circle',
  success: 'bx-check-circle',
  info: 'bx-info-circle',
  warning: 'bx-error',
  error: 'bx-error-circle',
  prev: 'bx-chevron-left',
  ratingEmpty: 'bx-star',
  ratingFull: 'bx-bxs-star',
  ratingHalf: 'bx-bxs-star-half',
  next: 'bx-chevron-right',
  delimiter: 'bx-circle',
  sort: 'bx-up-arrow-alt',
  expand: 'bx-chevron-down',
  menu: 'bx-menu',
  subgroup: 'bx-caret-down',
  dropdown: 'bx-chevron-down',
  edit: 'bx-pencil',
  loading: 'bx-refresh',
  first: 'bx-skip-previous',
  last: 'bx-skip-next',
  unfold: 'bx-move-vertical',
  file: 'bx-paperclip',
  plus: 'bx-plus',
  minus: 'bx-minus',
  sortAsc: 'bx-up-arrow-alt',
  sortDesc: 'bx-down-arrow-alt',
}

// ------------------------------------------------------
// ICONIFY SET HANDLER
// ------------------------------------------------------
export const iconify = {
  component: props => {
    // Replace specific MDI names with custom SVGs
    if (typeof props.icon === 'string') {
      const iconSVG = customIcons[props.icon]
      if (iconSVG) return h(iconSVG)
    }

    // Fall back to CSS class icons (Boxicons)
    return h(props.tag, {
      ...props,
      class: [props.icon],
      tag: undefined,
      icon: undefined,
    })
  },
}

// ------------------------------------------------------
// FINAL VUETIFY ICON CONFIG
// ------------------------------------------------------
export const icons = {
  defaultSet: 'mdi', // We use MDI by default (so your <v-icon>mdi-pencil</v-icon> works)
  aliases: {
    ...mdiAliases,
    ...customAliases,
  },
  sets: {
    mdi,      // Material Design Icons
    iconify,  // Your custom SVGs + Boxicons
  },
}
