const express = require('express');
require('dotenv').config();
const mysql = require('./config/mysql');
const mongo = require('./config/mongo');

const server = express();

server.use(express.json());

server.get('/mongo/usuarios', async (req, res) => {
    try {
        const db = await mongo();
        const usuarios = req.query.q ? 
            await db.collection('usuarios').find({
                name: req.query.q
            }).toArray() : 
            await db.collection('usuarios').find().toArray();
        const response = {
            size: usuarios.length,
            usuarios
        }
        return res.status(200).json(response)
    } catch {
        return res.status(400).json({ error: "Erro na operação"})
    }
})

server.post('/mongo/usuarios', async (req, res) => {
    try {
        const db = await mongo();
        await db.collection('usuarios').insertOne({ name: req.body.name });
        return res.status(201).json({ success: true})
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Erro na operação"})
    }
})

server.get('/mysql/produtos', async (req, res) => {
    try {
        const produtos = req.query.q ? 
            await mysql.awaitQuery(`
                select * from produtos where nome like '%${req.query.q}%' or descricao like '%${req.query.q}%'
            `) :
            await mysql.awaitQuery(`
                select * from produtos
            `)
        const response = {
            size: produtos.length,
            produtos
        }
        return res.status(200).json(response)
    } catch {
        return res.status(400).json({ error: "Erro na operação"})
    }
})

server.post('/mysql/produtos', async (req, res) => {
    try { 
        await mysql.awaitQuery(`
            insert into produtos (nome,descricao,preco)
            values ('${req.body.nome}', '${req.body.descricao}', ${req.body.preco});    
        `
        );
        return res.status(201).json({ success: true })
    } catch {
        return res.status(400).json({
            error: "Erro na operação"
        })
    }
}) 

server.listen(3000);