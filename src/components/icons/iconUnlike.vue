<template>
  <svg
    t="1738570677291"
    class="icon"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="5530"
    width="16"
    height="16"
    @click="toggleUnliked"
  >
    <path
      d="M250.4 114.9l1.4 0.2h4.1l518-0.2h4.9c9.5 0.8 18.6 4 26.7 9.3 9.3 6.2 16.6 14.7 21.7 25.3l1.5 3.2 0.9 1.3 79.6 366.1v0.9c0 1.6 0.1 3.7 0.3 6v0.2c1 14.2-2.2 28-9.4 40-10.9 18.2-28.8 29.2-49.2 30l-3.1 0.1-2 0.3-196.7 0.2c-18.1 0-35.4 8.7-46.1 23.3-10.8 14.6-14 33.7-8.6 51 10.9 35.4 16.5 72.4 16.5 110 0 20.5-1.7 41.2-5.1 61.6l-3.6 16.3c-3.1 13.8-10.5 26.3-21 35.1-7.2 6-19.3 13.3-35.8 13.3-32.3 0-58.6-28.3-58.6-63 0-1.6 0.1-3.5 0.3-5.7l0.3-2.9-0.1-2.9c-3.9-146.3-113-264.5-253.8-274.9l-1.8-0.1h-1.8l-115.8-0.3-0.3-443.4 131-0.1h4.1l1.5-0.2m0.1-50.3c-1.9 0-3.8 0.2-5.6 0.5l-137.8 0.1c-1.9-0.3-3.9-0.5-5.9-0.5-20.6 0-37.3 17.3-37.3 38.8l0.3 466.5c0 21.4 16.7 38.8 37.3 38.8 1.5 0 3-0.1 4.5-0.3l123.9 0.3c114 8.5 204.3 106.4 207.5 226.4-0.3 3.3-0.5 6.7-0.5 10.2 0 62.4 48.6 113 108.6 113 51.5 0 94.6-37.4 105.7-87.6l0.5 0.1c6.1-28.6 9.4-58.3 9.4-88.8 0-43.6-6.6-85.5-18.7-124.8-1.5-4.7 2-9.5 7-9.5l198.2-0.2c1.9 0 3.8-0.2 5.6-0.5 35.6-1.5 69.8-20.5 90-54.4 12.9-21.6 18-45.7 16.3-69.2-0.3-4.3 0-8.7-1.1-13.1l-80.6-370.5c-1.2-4.4-3-8.4-5.4-12-8.6-18-21.7-33.8-39.2-45.4-18.3-12.1-38.8-17.8-59-17.8h-0.2v0.2l-518 0.2c-1.8-0.3-3.6-0.5-5.5-0.5z"
      p-id="5531"
      :fill="modelValue.unliked ? '#6495ed' : '#8a8a8a'"
     ></path>
    <path d="M212 102.1h50v480h-50z" p-id="5532" :fill="unliked ? '#6495ed' : '#8a8a8a'"></path>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const liked = computed(() => props.modelValue.liked);
const unliked = computed(() => props.modelValue.unliked);

const toggleUnliked = () => {
  const newUnliked = !unliked.value;
  const newLiked = newUnliked ? false : liked.value;

  emit('update:modelValue', { liked: newLiked, unliked: newUnliked });
};
</script>

<style lang="scss" scoped>
.icon:hover {
  path {
    fill: #6495ed;
  }
}
</style>
