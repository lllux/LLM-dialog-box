<template>
  <div class="box">
    <div class="copy" v-if="!showCheck" @click="copyContent">
      <iconCopy />
    </div>
    <div class="copy" v-if="showCheck">
      <iconCheck />
    </div>
    <div class="like">
      <iconLike v-model="state"/>
    </div>
    <div class="unlike">
      <iconUnlike v-model="state"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import iconCopy from "./icons/iconCopy.vue";
import iconLike from "./icons/iconLike.vue";
import iconUnlike from "./icons/iconUnlike.vue";
import iconCheck from "./icons/iconCheck.vue";

const chatbox = defineProps(["message"]);

const showCheck = ref(false);
const state = ref({
  liked: false,
  unliked: false
});
const copyContent = async () => {
  try {
    const textToCopy = chatbox.message;
    await navigator.clipboard.writeText(textToCopy);
    showCheck.value = true;
    setTimeout(() => {
      showCheck.value = false;
    }, 2000);
  } catch (error) {
    console.error("复制失败：", error);
  }
};
</script>

<style lang="scss" scoped>
.box {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 90px;
  height: 25px;
  border-radius: 5px;
  margin-top: 10px;
}
.copy {
  width: 20px;
  height: 20px;
}
.like {
  width: 20px;
  height: 20px;
}
</style>
