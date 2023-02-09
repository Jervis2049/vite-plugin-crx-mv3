<template>
  <div class="container">
    <div class="button" @click="handleClick"></div>
  </div>
</template>
<script setup>
function handleClick() {
  alert('This is a fun Chrome extension.')
}
</script>
<style scoped>
.button {
  width: 200px;
  height: 80px;
  background: url(../assets/click-here.png) no-repeat;
  background-size: 100% 100%;
  position: fixed;
  top: 50%;
  margin-top: -40px;
  left: 0;
  cursor: pointer;
  z-index: 1000;
}
</style>
