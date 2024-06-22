const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

let players = {};
let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    if (waitingPlayer) {
        players[socket.id] = { opponent: waitingPlayer, symbol: 'O' };
        players[waitingPlayer].opponent = socket.id;
        players[waitingPlayer].symbol = 'X';
        io.to(socket.id).emit('gameStart', { symbol: 'O' });
        io.to(waitingPlayer).emit('gameStart', { symbol: 'X' });
        waitingPlayer = null;
    } else {
        waitingPlayer = socket.id;
        io.to(socket.id).emit('waiting');
    }

    socket.on('makeMove', (data) => {
        const opponent = players[socket.id]?.opponent;
        if (opponent) {
            io.to(opponent).emit('moveMade', data);
        }
    });

    socket.on('disconnect', () => {
        const opponent = players[socket.id]?.opponent;
        if (opponent) {
            io.to(opponent).emit('opponentDisconnected');
            delete players[opponent];
        }
        delete players[socket.id];
        if (waitingPlayer === socket.id) {
            waitingPlayer = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
