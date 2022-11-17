<template>
  <div class="crx-container" :class="{ show: showModal }">
    <img src="./Google-logo.png" alt="logo" />
  </div>
</template>
<script setup>
import { ref } from 'vue'
const showModal = ref(false)

chrome.runtime.onMessage.addListener((msg) => {
  if (msg === 'toggle') {
    showModal.value = !showModal.value
  }
})
</script>
<style scoped>
.crx-container {
  width: 500px;
  height: 100%;
  right: 0;
  top: 0;
  position: fixed;
  background-color: #fff;
  transform: translateX(500px);
  box-sizing: border-box;
  z-index: 999999;
  transition: all 0.4s ease 0s;
  box-shadow: rgb(0 0 0 / 12%) 0px 0px 15px 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crx-container.show {
  transform: translateX(0);
}
.crx-container img {
  width: 90%;
}
</style>
