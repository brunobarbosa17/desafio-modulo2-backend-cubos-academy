const express = require('express')
const roteador = require('./roteador')
const app = express()
const swaggerUi = require('swagger-ui-express')

app.use(express.json())

app.use(roteador)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(require('./swagger.json')))

app.listen(3000)