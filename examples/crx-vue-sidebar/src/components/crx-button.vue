<template>
  <div class="container">
    <button id="btn" @click="handleClick">hello world！</button>
  </div>
</template>

<script setup>
  function handleClick(){
    alert('hello world！')
  }
</script>

<style lang="less" scoped>
.container {
  width: 300px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>