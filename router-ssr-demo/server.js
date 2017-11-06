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
  runInNewContext: false, // 推荐
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
  if (ctx.req.url.indexOf('/dist/') > -1) {
    const urlpath = ctx.req.url.split('?')[0].slice(1)
    const filepath = path.resolve(__dirname, './', urlpath)
    ctx.body = fs.readFileSync(filepath)
    return
  }
  let html = ''
  try {
    html = await renderToString({
      url: ctx.req.url,
      title: 'my ssr demo',
      preData: `window.__INITIAL_DATA__ = ` + JSON.stringify({ data: '服务器注入的数据'})
    })
  } catch(err) {
    ctx.throw(500, err)
  }
  ctx.body = html  
})

app.listen(3000)
console.log('Server listening on 3000.')
