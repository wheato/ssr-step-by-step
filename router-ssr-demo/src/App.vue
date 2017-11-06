<template>
  <div class="demo" id="app">
    <h1>Simple-webpack demo</h1>
    <p>这是一个简单的 Vue demo</p>
    <img src="./assets/logo.png" alt="">
    <p>测试一下 SSR</p>
    <!-- <p>继续测试修改</p> -->
    <!-- <p>增量编译</p> -->
  </div>
</template>

<script>
let serverData
function preFetchData (data) {
  console.log(data)
}
export default {
  preFetchData: preFetchData,
  data () {
    return {
      textArr: [],
      serverData: ''
    }
  },
  mounted () {
    if (window) {
      this.serverData = window.__INITIAL_DATA__
    }
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
