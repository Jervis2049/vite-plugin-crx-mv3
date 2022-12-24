<template>
  <div class="container">
      <HelloWorld/>
      <a-button>button</a-button> <br>
      <a-switch v-model:checked="checked" /> <br>
      <a-input v-model:value="inputValue" placeholder="Basic usage" />
  </div>
</template>
<script setup>
import { ref } from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'

const checked = ref(true)
const inputValue = ref('')

</script>

<style lang="less"></style>
