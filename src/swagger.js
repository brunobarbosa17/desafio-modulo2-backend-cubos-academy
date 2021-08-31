const swaggerAutoGen = require('swagger-autogen')

swaggerAutoGen()('./swagger.json', ['./roteador.js'])