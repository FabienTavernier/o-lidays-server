// @see https://github.com/typicode/json-server#module
const jsonServer = require('json-server')

const PORT = 3000

const server = jsonServer.create()
const router = jsonServer.router('./db.json')
const middlewares = jsonServer.defaults()

// Set default middlewares (logger, static, cors and no-cache)
// server.use(middlewares)

// // Add custom routes before JSON Server router
// server.use(jsonServer.rewriter({
//     '/api/*': '/$1',
// }))

// // Use default router
// server.use(router)

// Mount on `/api`
server.get('/', function (req, res) {
  res.redirect('/api')
});

server.use('/api', middlewares)
server.use('/api', router)

server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`)
})

// Export the Server API
module.exports = server
