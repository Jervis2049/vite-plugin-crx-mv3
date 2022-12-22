<template>
  <div class="container">
    <img src="../assets/Chrome-Logo.png" alt="logo" />
    <button @click="open" class="btn">options page</button>
  </div>
</template>

<script setup>
function open(){
  let url = chrome.runtime.getURL('options.html')
  chrome.tabs.create({ url })
}
</script>

<style scoped>
.btn{
    width: 100%;
    height: 30px;
}
</style>