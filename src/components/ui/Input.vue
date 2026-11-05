<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  error?: string
  id?: string
  required?: boolean
  autoFocus?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  label: '',
  error: '',
  id: '',
  required: false,
  autoFocus: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full text-left">
    <label
      v-if="label"
      :for="id"
      class="text-xs font-medium text-text-muted select-none flex items-center justify-between"
    >
      <span>{{ label }} <span v-if="required" class="text-danger">*</span></span>
      <slot name="label-right" />
    </label>

    <div class="relative flex items-center">
      <div
        v-if="$slots.leading"
        class="absolute left-3.5 flex items-center pointer-events-none text-text-muted"
      >
        <slot name="leading" />
      </div>

      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autofocus="autoFocus"
        @input="onInput"
        @keydown="emit('keydown', $event)"
        class="w-full bg-surface text-text-base placeholder:text-text-muted/60 text-sm border rounded-xl px-4 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 disabled:bg-surface-muted"
        :class="[
          $slots.leading ? 'pl-10' : '',
          $slots.trailing ? 'pr-10' : '',
          error ? 'border-danger focus:ring-danger/30 focus:border-danger' : 'border-border-subtle hover:border-border-hover'
        ]"
      />

      <div
        v-if="$slots.trailing"
        class="absolute right-3.5 flex items-center text-text-muted"
      >
        <slot name="trailing" />
      </div>
    </div>

    <p v-if="error" class="text-xs text-danger mt-0.5">
      {{ error }}
    </p>
  </div>
</template>
