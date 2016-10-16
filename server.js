'use strict'

const express = require('express')
const { Server } = require('http')
const socketio = require('socket.io')

const app = express()
const server = Server(app)
const io = socketio(server)

const PORT = process.env.PORT || 3000


app.set('view engine', 'pug')

app.use(express.static('public'))

app.get('/', (req, res) => res.render('index'))

server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
