<template>
  <div class="all">
    <chat class="base"/>
    <hang class="over"/>
  </div>
  
</template>

<script setup>
import chat from "./components/chat.vue";
import hang from "./components/hang.vue";
// import { RouterLink, RouterView } from 'vue-router'
</script>


<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
::-webkit-scrollbar{
  width: 3px;
  height: 3px;
  /* scroll-behavior: smooth; */
}
::-webkit-scrollbar-track {
background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: #2db1ba;
  border-radius: 1.5px;
}
body {
  font: 16px/1.5 "Microsoft Yahei",
    "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", sans-serif;
  color: #333;
}
em,
i {
  font-style: normal;
}
i{
  display: inline-block;
  vertical-align: middle;
}

a {
  text-decoration: none;
  color: #333;
}


.all{
  position: relative;
}
.base{
  position: relative;
  z-index: 1;         
  width: 100%;
  height: 100%;
}

.over{
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 2;         
  pointer-events: auto; 
}
</style>