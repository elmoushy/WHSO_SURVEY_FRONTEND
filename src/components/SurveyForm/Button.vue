<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      $style.button,
      $style[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      $style[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
      {
        [$style.buttonLoading]: loading,
        [$style.buttonDisabled]: disabled,
        [$style.buttonFullWidth]: fullWidth
      }
    ]"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <span v-if="loading" :class="$style.spinner" aria-hidden="true">
      <i class="fas fa-spinner fa-spin"></i>
    </span>
    
    <!-- Start Icon -->
    <i v-if="startIcon && !loading" :class="[startIcon, $style.startIcon]" aria-hidden="true"></i>
    
    <!-- Button Text -->
    <span :class="{ [$style.buttonText]: loading }">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- End Icon -->
    <i v-if="endIcon && !loading" :class="[endIcon, $style.endIcon]" aria-hidden="true"></i>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  text?: string
  startIcon?: string
  endIcon?: string
}

interface Emits {
  click: [event: MouseEvent]
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style module>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--button-height);
  padding-block: var(--space-3);
  padding-inline: var(--space-6);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  position: relative;
  overflow: hidden;
}

.button:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.button:active {
  transform: translateY(1px);
}

/* Variants */
.buttonPrimary {
  color: white;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.buttonPrimary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.buttonSecondary {
  color: white;
  background: var(--color-secondary);
  border-color: var(--color-secondary);
}

.buttonSecondary:hover:not(:disabled) {
  background: var(--color-secondary-hover);
  border-color: var(--color-secondary-hover);
}

.buttonOutline {
  color: var(--color-primary);
  background: transparent;
  border-color: var(--color-primary);
}

.buttonOutline:hover:not(:disabled) {
  color: white;
  background: var(--color-primary);
}

.buttonGhost {
  color: var(--color-text-secondary);
  background: transparent;
  border-color: transparent;
}

.buttonGhost:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-surface-accent);
}

.buttonDanger {
  color: white;
  background: var(--color-error);
  border-color: var(--color-error);
}

.buttonDanger:hover:not(:disabled) {
  background: #c82333;
  border-color: #c82333;
}

/* Sizes */
.buttonSm {
  min-height: 2.25rem;
  padding-block: var(--space-2);
  padding-inline: var(--space-4);
  font-size: var(--font-size-sm);
}

.buttonLg {
  min-height: 3rem;
  padding-block: var(--space-4);
  padding-inline: var(--space-8);
  font-size: var(--font-size-lg);
}

/* States */
.buttonDisabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.buttonDisabled:hover {
  transform: none;
}

.buttonLoading {
  cursor: wait;
}

.buttonFullWidth {
  width: 100%;
}

/* Icons */
.startIcon {
  margin-inline-end: var(--space-1);
}

.endIcon {
  margin-inline-start: var(--space-1);
}

.spinner {
  margin-inline-end: var(--space-2);
}

.buttonText {
  opacity: 0.7;
}

/* RTL Support */
[dir="rtl"] .startIcon {
  margin-inline-end: 0;
  margin-inline-start: var(--space-1);
}

[dir="rtl"] .endIcon {
  margin-inline-start: 0;
  margin-inline-end: var(--space-1);
}

[dir="rtl"] .spinner {
  margin-inline-end: 0;
  margin-inline-start: var(--space-2);
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .button {
    padding-inline: var(--space-4);
  }
  
  .buttonLg {
    padding-inline: var(--space-6);
  }
}

/* Animation effects */
.button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.button:hover::before {
  left: 100%;
}

.buttonDisabled::before {
  display: none;
}
</style>
