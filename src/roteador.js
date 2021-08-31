const express = require('express');
const roteador = express();
const transacoes = require('./data/transacoes')

roteador.get('/contas', transacoes.listarContas)
roteador.get('/contas/saldo', transacoes.saldo)
roteador.get('/contas/extrato', transacoes.extrato)
roteador.post('/contas', transacoes.criarConta)

roteador.post('/transacoes/depositar', transacoes.depositar)
roteador.post('/transacoes/sacar', transacoes.sacar)
roteador.post('/transacoes/transferir', transacoes.transferir)

roteador.delete('/contas/:numeroConta', transacoes.excluirConta)

roteador.put('/contas/:numeroConta/usuario', transacoes.atualizarUsuarioConta)

module.exports = roteador