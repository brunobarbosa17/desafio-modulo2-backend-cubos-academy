// 200 = requisição bem sucedida
// 201 = requisição bem sucedida e algo foi criado
// 400 = o servidor não entendeu a requisição pois está com uma sintaxe/formato inválido
// 404 = o servidor não pode encontrar o recurso solicitado
const app = require('../index')
const banco = require('../data/bancodedados')
let numero = 0

function listarContas(req, res) {

    if (req.method === 'GET' && req.query.senha_banco === banco.banco.senha) {
        res.status(200)
        res.json(banco.contas)
    }
    else {
        res.status(400)
        res.json({ erro: "Ocorreu um erro com a senha, tente novamente!" })
    }

}

function criarConta(req, res) {
    let todosCPFS = []
    let todosEMAILS = []
    for (let i = 0; i < banco.contas.length; i++) {
        todosCPFS.push(Object.values(banco.contas[i].usuario.cpf).join(''))
        todosEMAILS.push(Object.values(banco.contas[i].usuario.email).join(''))
    }    
    const existeCPF = todosCPFS.find(cpf => cpf === req.body.cpf)
    const existeEMAIL = todosEMAILS.find(email => email === req.body.email)
    
    if (existeCPF || existeEMAIL) {
        res.status(404)
        res.send({erro: "Este CPF ou Email já existe!"})
    } else {

        if (req.body.nome && req.body.cpf && req.body.data_nascimento && req.body.telefone && req.body.email && req.body.senha) {
            banco.contas.push(
                {
                    numero: numero,
                    saldo: 0,
                    usuario: {
                        nome: req.body.nome,
                        cpf: req.body.cpf,
                        data_nascimento: req.body.data_nascimento,
                        telefone: req.body.telefone,
                        email: req.body.email,
                        senha: req.body.senha
                    }
                }
            )
            numero++;
            res.status(200)
            res.send(banco.contas)
    
        } else {
            res.status(400)
            res.send('Conta não criada, preencha todos os dados!')
        }

    }
    
}

function excluirConta(req, res) {
    const todasContas = banco.contas;
    const numeroConta = Number(req.params.numeroConta);
    const bancoAchado = todasContas.find(id => id.numero === numeroConta)
    if (bancoAchado) {
        // Achou o banco, verificar o saldo
        if (bancoAchado.saldo === 0) {
            const indice = banco.contas.indexOf(bancoAchado)
            banco.contas.splice(indice,1)
            res.status(200)
            res.send({sucesso: "Conta excluída com sucesso!"})
        } else {
            res.status(404)
            res.send({erro: "Não é possível excluir uma conta com saldo positivo!"})
        }
    } else {
        // Não achou o banco
        res.status(404)
        res.send({ erro: "Conta não encontrada com este número!" })
    }
}

function depositar(req, res) {
    const idPassado = Number(req.body.numero_conta)
    const todasContas = banco.contas;
    const contaAchada = todasContas.find(id => id.numero === idPassado)
    const valorPassado = Number(req.body.valor)

    if (req.body.numero_conta && req.body.valor) {
        // Se o usuário enviou o número da conta e o valor
        if (contaAchada) {
            // Se foi encontrada uma conta com o número passado
            if (valorPassado <= 0) {
                // Se o valor for negativo dá erro
                res.status(400)
                res.send({erro: "Só é possível realizar depósitos com valores positivos!"})
            } else {
                // Se tudo estiver certo
                const indice = banco.contas.indexOf(contaAchada)
                banco.contas[indice].saldo += valorPassado
                banco.depositos.push(req.body)
                res.status(200)
                res.send({sucesso: "Depósito realizado com sucesso!"})
            }

        } else {
            res.status(400)
            res.send({erro: "A conta informada não existe!"})
        }



    } else {
        res.status(400)
        res.send({erro: "Número da conta e valor são obrigatórios!"})
    }


}


function sacar(req, res) {
    const idPassado = Number(req.body.numero_conta)
    const senhaPassada = req.body.senha
    const todasContas = banco.contas;
    const contaAchada = todasContas.find(id => id.numero === idPassado)
    const valorPassado = Number(req.body.valor)
    const indice = banco.contas.indexOf(contaAchada)

    if (req.body.numero_conta && req.body.valor) {
        // Se o usuário enviou o número da conta e o valor
        if (contaAchada && banco.contas[indice].usuario.senha === senhaPassada) {
            // Se foi encontrada uma conta com o número passado e a senha pertence a conta correta
            if (banco.contas[indice].saldo >= valorPassado) {
                // Se o saldo for maior ou igual ao valor do saque
                
                banco.contas[indice].saldo -= valorPassado
                banco.saques.push({
                    data: req.body.data,
                    numero_conta: req.body.numero_conta,
                    valor: req.body.valor
                })
                
                res.status(200)
                res.send({sucesso: "Saque realizado com sucesso!"})
            } else {
                // Se não

                res.status(400)
                res.send({ erro: "Só é possível realizar saques tendo o valor em conta!" })                
            }

        } else {
            res.status(400)
            res.send({erro: "Dados informados da conta não encontrados!"})
        }

    } else {
        res.status(400)
        res.send({erro: "Número da conta e valor são obrigatórios!"})
    }
}


function transferir(req, res) {
    const contaOrigem = Number(req.body.numero_conta_origem)
    const contaDestino = Number(req.body.numero_conta_destino)
    const valor = req.body.valor
    const senhaConta = req.body.senha_conta
    const todasContas = banco.contas;
    const contaDestinoExiste = todasContas.find(id => id.numero === contaDestino)
    const contaOrigemExiste = todasContas.find(id => id.numero === contaOrigem)
    const indiceContaOrigem = banco.contas.indexOf(contaOrigemExiste)
    const indiceContaDestino = banco.contas.indexOf(contaDestinoExiste)


    if (req.body.numero_conta_origem && req.body.numero_conta_destino && req.body.valor && req.body.senha_conta && contaOrigem !== contaDestino) {
        //Verifica se passou todos os campos
        if (contaOrigemExiste.usuario.senha === senhaConta) {
            // Verificar se a senha passada é igual a da conta
            if (contaOrigemExiste.saldo >= valor) {
                banco.contas[indiceContaOrigem].saldo -= valor
                banco.contas[indiceContaDestino].saldo += valor
                banco.transferencias.push({
                    data: req.body.data,
                    numero_conta_origem: req.body.numero_conta_origem,
                    numero_conta_destino: req.body.numero_conta_destino,
                    valor: req.body.valor,
                  })
                
                res.status(200)
                res.send({sucesso: "Transferência realizada com sucesso!"})
            }

            else {
                res.status(400);
                res.send({erro: "Saldo insuficiente!"})
            }

        } else {
            res.status(400)
            res.send({erro: "As senhas não são iguais!"})
        }

    } else {
        res.status(400)
        res.send({erro: "Informe todos os dados para a transferência!"})
    }

}


function saldo(req, res) {
    const numeroConta = Number(req.query.numero_conta)
    const senhaConta = req.query.senha

    if (req.query.numero_conta && req.query.senha) {
        const todasContas = banco.contas;
        const contaAchada = todasContas.find(id => id.numero === numeroConta)
        const indice = banco.contas.indexOf(contaAchada)
        if (contaAchada && contaAchada.usuario.senha === senhaConta) {
            res.status(200)
            res.send({saldo: `${contaAchada.saldo}`})
        } else {
            res.status(400)
            res.send({erro: "Houve um problema com a conta e/ou a senha! Tente Novamente!"})
        }

    } else {
        res.status(404)
        res.send({ erro: "Informe os valores obrigatórios!"})
    }
}

function extrato(req, res) {
    const numeroConta = Number(req.query.numero_conta)
    const senhaConta = req.query.senha

    if (req.query.numero_conta && req.query.senha) {
        const todasContas = banco.contas;
        const contaAchada = todasContas.find(id => id.numero === numeroConta)
        const indice = banco.contas.indexOf(contaAchada)
        if (contaAchada && contaAchada.usuario.senha === senhaConta) {
            const listaDepositos = banco.depositos.filter(conta => Number(conta.numero_conta) == numeroConta)

            const listaSaques = banco.saques.filter(conta => Number(conta.numero_conta) === numeroConta)

            const transferenciasEnviadas = banco.transferencias.filter(conta => Number(conta.numero_conta_origem) === numeroConta)

            const transferenciasRecebidas = banco.transferencias.filter(conta => Number(conta.numero_conta_origem) === numeroConta)

            res.status(200)
            res.json({
                listaDepositos,
                listaSaques,
                transferenciasEnviadas,
                transferenciasRecebidas
            })

        } else {
            res.status(400)
            res.send({erro: "Houve um problema com a conta e/ou a senha! Tente Novamente!"})
        }

    } else {
        res.status(404)
        res.send({ erro: "Informe os valores obrigatórios!"})
    }
}

function atualizarUsuarioConta(req, res) {
    const numeroConta = Number(req.params.numeroConta)
    const todasContas = banco.contas;
    let todosCPFS = []
    let todosEMAILS = []
    for (let i = 0; i < banco.contas.length; i++) {
        todosCPFS.push(Object.values(banco.contas[i].usuario.cpf).join(''))
        todosEMAILS.push(Object.values(banco.contas[i].usuario.email).join(''))
    }
    const contaAchadaPUT = todasContas.find(id => id.numero === numeroConta)
    const existeCPF = todosCPFS.find(cpf => cpf === req.body.cpf)
    const existeEMAIL = todosEMAILS.find(email => email === req.body.email)
    const indice = banco.contas.indexOf(contaAchadaPUT)


    if (req.body.nome || req.body.cpf || req.body.data_nascimento || req.body.telefone || req.body.email || req.body.senha) { // Verificar se ao menos um elemento foi passado
        if (contaAchadaPUT) {
            if (req.body.email || req.body.cpf) {
                if (existeCPF || existeEMAIL) {
                    res.status(400)
                    res.send({erro: "Email ou CPF já cadastrado no sistema!"})
                }
            } else {
                banco.contas.splice(indice, 1, {
                    numero: banco.contas[indice].numero,
                    saldo: banco.contas[indice].saldo,
                        usuario: {
                            nome: req.body.nome ?? banco.contas[indice].usuario.nome,
                            cpf: req.body.cpf ?? banco.contas[indice].usuario.cpf,
                            data_nascimento: req.body.data_nascimento ?? banco.contas[indice].usuario.data_nascimento,
                            telefone: req.body.telefone ?? banco.contas[indice].usuario.telefone,
                            email: req.body.email ?? banco.contas[indice].usuario.email,
                            senha: req.body.senha ?? banco.contas[indice].usuario.senha
                        }
                })
                res.status(200)
                res.send(banco.contas)
            }
        } else {
            res.status(400)
            res.send({erro: "Conta não encontrada!"})
        }
    } else {
        res.status(400)
        res.send({ erro: "Insira ao menos 1 valor para editar!" })
    }
}
/*  {
    "numero": 0,
    "saldo": 0,
    "usuario": {
      "nome": "Foo Bar",
      "cpf": "0001112223a3",
      "data_nascimento": "2021-03-15",
      "telefone": "71999998888",
      "email": "foo@bar.coma",
      "senha": "1234"
    } */



module.exports = {
    listarContas,
    criarConta,
    excluirConta,
    depositar,
    sacar,
    transferir,
    saldo,
    extrato,
    atualizarUsuarioConta
}