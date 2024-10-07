const express = require('express')
const http = require('http')
const path = require('path')

const app = express()

const server = http.createServer(app)

const socket = require('socket.io')
const io = socket(server)

io.on('connection' , (socket)=>{
    socket.on('disconnect' , ()=>{
        
    })
})

const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))