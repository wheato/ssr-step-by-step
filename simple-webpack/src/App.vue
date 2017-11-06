<template>
  <div class="demo">
    <h1>Simple-webpack demo</h1>
    <p>这是一个简单的 Vue demo</p>
    <img src="./assets/logo.png" alt="">
    <p>测试一下 Hot replace module</p>
    <p>继续测试修改</p>
    <p>增量编译</p>
  </div>
</template>

<script>
export default {
  data () {
    return {}
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
