import { createApp } from './app.js'

export default context => {
  return new Promise((resolve, reject) => {
    const app = createApp()
    console.log(app.preFetchData)
    app.preFetchData && app.preFetchData(context.preData)
    resolve(app)
  })
}
