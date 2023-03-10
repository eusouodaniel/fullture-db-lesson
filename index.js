const express = require('express');
const { ObjectId } = require("mongodb");
require('dotenv').config();
const mongo = require('./config/mongo');

const server = express();

server.use(express.json());

server.put('/funcionarios', async (req,res) => {
    const db = await mongo();

    await db.collection('funcionarios').updateMany(
        { },
        { $set: { cnis: req.body.cnis }, $unset: { rg: "" }  }
    )

    return res.status(200).json("OK");
})

server.get('/funcionarios/folha', async (req,res) => {
    const db = await mongo();
    const funcionarios = await db.collection('funcionarios').find({}).toArray();
    
    let salarios = [];
    
    funcionarios.forEach(async (funcionario,index) => {
        // const funcionarios = await db.collection('transacoes').find({ "funcionario.cpf": funcionario.cpf }).toArray();
        // console.log(funcionarios)
        salarios[index] = {
            nome: funcionario.nome,
            sobrenome: funcionario.sobrenome,
            cargo: funcionario.cargo.nome,
            salario_mes: funcionario.cargo.salario
        }
    })

    return res.status(200).json(salarios);
})

server.delete('/transacoes', async (req, res) => {
    try {
        const db = await mongo();
        const transacao = await db.collection('transacoes').deleteMany({});
        return res.status(204).json(transacao)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
})

server.get('/transacoes/produtos', async (req, res) => {
    try {
        const db = await mongo();
        const produtos = await db.collection('transacoes').find({ 
            itens: { $elemMatch: 
                { codigo_de_barras: Number(req.query.codigo_de_barras) }
            } 
        }).toArray();
        return res.status(201).json(produtos)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
})

server.post('/transacoes', async (req, res) => {
    try {
        let precoFinal = 0;
        req.body.itens.forEach(item => {
            precoFinal += item.preco * item.quantidade;
        });

        const db = await mongo();
        const funcionario = await db.collection('funcionarios').findOne({ cpf: req.body.funcionario_cpf });

        const transactions = await db.collection('transacoes').insertOne({
            "preco": precoFinal,
            "cpf": req.body.cpf ? req.body.cpf : "",
            "forma_de_pagamento": req.body.forma_de_pagamento,
            "itens": req.body.itens,
            "funcionario": {
                "_id": funcionario._id,
                "nome": funcionario.nome,
                "sobrenome": funcionario.sobrenome,
                "cpf": funcionario.cpf
            }
        });
        if (transactions.acknowledged) {
            req.body.itens.forEach(async item => {
                const produtoComprado = await db.collection('produtos').findOne({ codigo_de_barras: item.codigo_de_barras });
                const valorEmEstoque = produtoComprado.quantidade_em_estoque;

                const newValues = { $set: { quantidade_em_estoque: Number(valorEmEstoque) - Number(item.quantidade) } }
                const query = { codigo_de_barras: item.codigo_de_barras };
                await db.collection('produtos').updateOne(query, newValues);
            });

            return res.status(201).json(transactions)
        }

        return res.status(400).json({ error: "Erro na operação"})
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
})

server.get('/transacoes', async (req, res) => {
    try {
        const db = await mongo();
        const users = await db.collection('transacoes').find({}).toArray();
        return res.status(201).json(users)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.get('/funcionarios/busca/salario', async (req, res) => {
    try {
        const db = await mongo();
        const users = await db.collection('funcionarios').find({ 
            "cargo.salario": { $lt: Number(req.query.salario) }
        }).toArray();
        return res.status(201).json({
            users,
            count: users.length
        })
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.get('/funcionarios/busca', async (req, res) => {
    try {
        const db = await mongo();
        const users = await db.collection('funcionarios').find({ $and: [{ 
            nome: req.query.nome,
            cnis: Number(req.query.cnis),
            "cargo.salario": { $gt: Number(req.query.salario) }
        }]}).toArray();
        return res.status(201).json(users)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.post('/funcionarios', async (req, res) => {
    try {
        const db = await mongo();
        const users = await db.collection('funcionarios').insertOne({
            "nome": req.body.nome,
            "sobrenome": req.body.sobrenome,
            "cpf": req.body.cpf,
            "rg": req.body.rg,
            "data_de_nascimento": req.body.data_de_nascimento,
            "data_de_vinculo": req.body.data_de_vinculo,
            "cnis": req.body.cnis,
            "cargo": req.body.cargo
        });
        return res.status(201).json(users)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.get('/funcionarios', async (req, res) => {
    try {
        const db = await mongo();
        const users = await db.collection('funcionarios').find({}).toArray();
        return res.status(201).json(users)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.get('/produtos/busca/categoria', async (req, res) => {
    try {
        const db = await mongo();
        const products = await db.collection('produtos').find({ 
            categoria: { $in: [ req.query.categoria1, req.query.categoria2 ] }
        }).toArray();
        return res.status(201).json({
            products,
            count: products.length
        })
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.get('/produtos/busca', async (req, res) => {
    try {
        const db = await mongo();
        const users = await db.collection('produtos').find({ 
            $or: [{ nome: req.query.nome, categoria: req.query.categoria }]
        }).toArray();
        return res.status(201).json(users)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.post('/produtos', async (req, res) => {
    try {
        const db = await mongo();
        const products = await db.collection('produtos').insertOne({
            "nome": req.body.nome,
            "descricao": req.body.descricao,
            "preco": req.body.preco,
            "categoria": req.body.categoria,
            "codigo_de_barras": req.body.codigo_de_barras,
            "quantidade_em_estoque": req.body.quantidade_em_estoque
        });
        return res.status(201).json(products)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.patch('/produtos/:categoria', async (req, res) => {
    try {
        const db = await mongo();
        const products = await db.collection('produtos').updateMany({ 
            categoria: req.params.categoria 
        },
        { $set: { quantidade_em_estoque: Number(req.body.quantidade) }
        });
        return res.status(200).json(products)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.get('/produtos', async (req, res) => {
    try {
        const db = await mongo();
        const products = await db.collection('produtos').find({}).toArray();
        return res.status(201).json(products)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
});

server.put('/cargos/:id', async (req, res) => {
    try {
        const db = await mongo();
        const offices = await db.collection('cargos').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: {nome: req.body.nome, descricao: req.body.descricao, faixa_salarial: req.body.faixa_salarial } }
        )
        return res.status(200).json(offices)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação" })
    }
});

server.delete('/cargos/deletar/nome/:nome', async (req, res) => {
    try {
        const db = await mongo();
        const offices = await db.collection('cargos').deleteMany(
            { nome: req.params.nome },
        )
        return res.status(204).json(offices)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação" })
    }
});

server.delete('/cargos/:id', async (req, res) => {
    try {
        const db = await mongo();
        const offices = await db.collection('cargos').deleteOne(
            { _id: new ObjectId(req.params.id) },
        )
        return res.status(204).json(offices)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação" })
    }
});

server.post('/cargos', async (req, res) => {
    try {
        const db = await mongo();
        const offices = await db.collection('cargos').insertOne({
            "nome": req.body.nome,
            "descricao": req.body.descricao,
            "faixa_salarial": req.body.faixa_salarial
        })
        return res.status(201).json(offices)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação" })
    }
});

server.get('/cargos/busca/faixa-salarial', async (req, res) => {
    try {
        const db = await mongo();
        const offices = await db.collection('cargos').find({
            faixa_salarial: { $exists: true }
        }).toArray();
        return res.status(201).json({
            offices,
            count: offices.length
        })
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação" })
    }
});

server.get('/cargos', async (req, res) => {
    try {
        const db = await mongo();
        const offices = await db.collection('cargos').find({}).toArray();
        return res.status(201).json(offices)
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação" })
    }
});

server.listen(3332);