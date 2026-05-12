const app = require('./app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Notes API running on port ${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`Health check: http://localhost:${PORT}/health`)
})