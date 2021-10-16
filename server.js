const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, removeCurrentUser, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static("public"));

const botName = 'ChatCord Bot';
// run when client connects
io.on('connection', socket => {
    
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName,'Welcome to ChatCord!')); 


        // Broadcast to all clients except the user who is connecting
        socket.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room, 
            users: getRoomUsers(user.room)
        })
    })
    
    // console.log(socket.id, '<- id')
    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        console.log(user)
        if(user !== undefined) {
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        }
    })

    // Broadcast to all clients
    // Run when client disconnected
    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id)
        removeCurrentUser(socket.id);
        if(user !== undefined) {
            console.log(`room is: ${user.room}`)
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        }
    })
})


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));