# Vue.js SSR Step by Step (2) - 一个简单的同构DEMO
上一篇文章中介绍了如何从零开始搭建一个简单的 client-only webpack 配置。
接下来我们在前面代码的基础上写一个简单的前后端同构的DEMO。

## 改写入口
> 当编写纯客户端(client-only)代码时，我们习惯于每次在新的上下文中对代码进行取值。但是，Node.js 服务器是一个长期运行的进程。当我们的代码进入该进程时，它将进行一次取值并留存在内存中。这意味着如果创建一个单例对象，它将在每个传入的请求之间共享。  
>   
为了避免状态单例，改写入口， [Vue SSR 官方文档](https://ssr.vuejs.org/zh/structure.html)介绍的比较详细了，一定要去看一看。
创建对应的文件后，src 目录是这样的：
```
.
├── App.vue
├── app.js
├── assets
│   └── logo.png
├── entry-client.js
└── entry-server.js
```

改写 app.js 把里面创建 Vue 实例的部分改写一个工厂函数，用于创建返回 Vue 实例。
```javascript
// app.js
import Vue from 'vue'
import App from './App.vue'

export function createApp () {
  const app = new Vue({
    render: h => h(App)
  })
  return app
}
```

```javascript
// entry-client.js
import { createApp } from './app.js'

const app = createApp()
app.$mount('#app')
```

```javascript
// entry-server.js
import { createApp } from './app.js'

export default context => {
  const app = createApp()
  return app
}
```

## 改写 webpack 配置
因为服务器渲染的配置和客户端的配置略有不同，但其中有很多共用的配置，官方建议我们使用三个不同的配置文件：base、client、server， 通过 **webpack-merge** 插件来实现对 base 配置文件的覆盖和扩展。
```
build 目录下的文件目录
.
├── webpack.base.conf.js
├── webpack.client.conf.js
└── webpack.server.conf.js
```

再把之前 webpack.config.js 中的内容复制到 webpack.base.conf.js 中。在 webpack.server.conf.js 中加入 SSR 的 client 插件。
```
const webpack = require('webpack')
const path = require('path')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.conf')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

module.exports = merge(baseConfig, {
  plugins: [
    new VueSSRClientPlugin()
  ]
})
```

客户端的配置就完成了。server 端需要修改输入和输出的配置，还有 source-map 输出的格式，module 中 引入的 css 文件不打包到 module 中，增加 SSR 的 server 端插件。
```
const webpack = require('webpack')
const path = require('path')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.conf')
const nodeExternals = require('webpack-node-externals')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')

module.exports = merge(baseConfig, {
  entry: './src/entry-server.js',
  output: {
    filename: 'server-bundle.js',
    libraryTarget: 'commonjs2' // 代码中模块的实现方式，Node.js 使用 commonjs2
  },
  target: 'node', // 指定代码的运行环境是 node
  devtool: '#source-map',
  externals: nodeExternals({
    whitelist: /\.css$/
  }),
  plugins: [
    new VueSSRServerPlugin()
  ]
})
```

然后在 package.json 中添加编译的命令：
```
"scripts": {
  "test": "",
  "dev": "cross-env NODE_ENV=development webpack-dev-server --open --hot --config build/webpack.client.conf.js",
  "server": "node server.js",
  "build": "rimraf dist && npm run build:client && npm run build:server",
  "build:client": "cross-env NODE_ENV=production webpack --config build/webpack.client.conf.js --progress --hide-modules",
  "build:server": "cross-env NODE_ENV=production webpack --config build/webpack.server.conf.js --progress --hide-modules"
},
```

运行 `nom run build` 在dist 目录里就会生成构建后的文件，然后把 index.html 修改为 indext.template.html 这个文件名随便，不改也行。dist 目录中有两个不一样的文件，vue-ssr-client-manifest.json 和 vue-ssr-server-bundle.json。具体的使用方法和实现方式，文档写的很清楚，先去 [Bundle Renderer 指引 · GitBook](https://ssr.vuejs.org/zh/bundle-renderer.html) 看看。

## server.js
然后在写一个简单 Node Server，我这里使用 Koa，其他的都是一样。server.js 的内容如下：
```javascript
const Koa = require('koa')
const Vue = require('vue')
const { createBundleRenderer } = require('vue-server-renderer')
const path = require('path')
const fs = require('fs')
const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')
const app = new Koa()
const template = fs.readFileSync(path.resolve(__dirname, './index.template.html'), 'utf-8')
const renderer = createBundleRenderer(serverBundle, {
  basedir: path.resolve(__dirname, './dist'),
  runInNewContext: false,
  template,
  clientManifest
})

const renderToString = function (context) {
  return new Promise((resolve, reject) => {
    renderer.renderToString(context, (err, html) => {
      if (err) reject(err)
      resolve(html)
    })
  })
}

app.use(async ctx => {
  console.log(ctx.req.url)
  if (ctx.req.url === '/favicon.ico' || ctx.req.url === '/robots.txt') {
    ctx.body = ''
    return 
  }
  // 简单的静态文件处理
  if (ctx.req.url.indexOf('/dist/') > -1) {
    const urlpath = ctx.req.url.split('?')[0].slice(1)
    const filepath = path.resolve(__dirname, './', urlpath)
    ctx.body = fs.readFileSync(filepath)
    return
  }
  let html = ''
  try {
    html = await renderToString({})
  } catch(err) {
    ctx.throw(500, err)
  }
  ctx.body = html  
})

app.listen(3000)
console.log('Server listening on http://localhost:3000.')
```

运行 `nom run server` 就可以看到服务器渲染出来的页面了。
![](README/README/92BB248F-5ED9-441E-AF7D-C62C22CFA429.png)

## 增加前端方法
这只是一个简单的静态页面，没有 js 方法动态创建一些内容，我们再添加一些前端方法，看看渲染出来的页面中客户端 js 的运行是不是可以的。
修改 App.vue 文件：
```
<template>
  <div class="demo" id="app">
    <h1>Simple-webpack demo</h1>
    <p>这是一个简单的 Vue demo</p>
    <img src="./assets/logo.png" alt="">
    <p>测试一下 SSR</p>
    <p v-for="(text, index) in textArr" :key="index">{{ text }}</p>
    <button @click="clickHandler">新增一个行文字</button>
  </div>
</template>
<script>
export default {
  data () {
    return {
      textArr: []
    }
  },
  methods: {
    clickHandler () {
      this.textArr.push(`${this.textArr.length + 1}. 这是新增的文字。`)
    }
  }
}
</script>
```

然后再次构建整个工程，重新启动服务器。
![](README/README/74430951-85CB-4B44-BC5F-9876DDD7C742.png)
Success！

## 简单的数据注入
比如渲染一个新闻页面，希望网页的标题是页面直接渲染出来的？应该怎么做？Vue.js SSR 提供了方法，能够插入模板变量。只要在 index.template.html 中加入模板变量就可以像其他的后端模板一样插入数据。首先修改一下 index.template.html 中，增加 `title` 变量，`<title>SSR demo - {{ title }}</title>` 。
然后在 server.js 中的 `renderToString`方法中的第一个参数传入 `{ title: '第一个 SSR Demo'}`。
最后再重启一下后台服务，如下图，我们的页面标题变成了我们定义的了。
![](README/README/24FABAD4-2908-4138-A8EF-7AA7EDE5AD27.png)

如果还想更复杂的数据我们只能用注入一个 window 全局变量了。这个时候我们还没办法用组件的静态方法，通过后台服务去注入，因为我们没有用到router，不知道app中的组件是不是已经实例化，没办法去获取组件里的静态方法。借鉴 SSR 官方中的 `window.__INIT_STATE` 的方式，先在 index.template.html 中 增加一个 script 标签加入模板变量，然后在 server.js 中传入数据，最后修改 App.vue 文件在 `mounted` 中判断获取这个变量，将变量赋值给组件的 `data` 属性中，具体的代码如下：
```html
<!-- index.template.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>SSR demo - {{ title }}
  </title>
  <script>
    {{{ injectData }}}
  </script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

```javascript
// server.js
html = await renderToString({
  title: '第一个 SSR Demo',
  injectData: 'window.__INIT_DATA__ = ' + JSON.stringify({
    text: '这是服务器注入的数据。'
  }) 
})
```

```html
<!-- App.vue -->
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
```

重新编译，重启服务后，页面上就会多一段文字了，如下图所示：
![](README/README/9268B847-25CC-4B87-ACCD-8326FA71A039.png)

Success！
所有的代码都在这个上面
## 参考
[Vue.js 服务器端渲染指南](https://ssr.vuejs.org/zh/)