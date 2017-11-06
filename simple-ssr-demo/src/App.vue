<template>
  <div class="demo" id="app">
    <h1>Simple-webpack demo</h1>
    <p>这是一个简单的 Vue demo</p>
    <img src="./assets/logo.png" alt="">
    <p>测试一下 SSR</p>
    <p> {{ serverData.text }}</p>
    <p v-for="(text, index) in textArr" :key="index">{{ text }}</p>
    <button @click="clickHandler">新增一个行文字</button>
  </div>
</template>

<script>
export default {
  data () {
    return {
      textArr: [],
      serverData: ''
    }
  },
  mounted () {
    this.serverData = window.__INIT_DATA__
  },
  methods: {
    clickHandler () {
      this.textArr.push(`${this.textArr.length + 1}. 这是新增的文字。`)
    }
  }
}
</script>

<style lang="sass">
p
  background: #eee;
body
  h1 
    background: #ff0000;
</style>
