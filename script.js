const socket = io();

const coverPage = document.getElementById('coverPage');
const findingMatch = document.getElementById('findingMatch');
const gameContainer = document.getElementById('gameContainer');
const board = document.getElementById('board');
const cellElements = document.querySelectorAll('[data-cell]');
const winningMessageElement = document.getElementById('winningMessage');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const restartButton = document.getElementById('restartButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const playButton = document.getElementById('playButton');

const X_CLASS = 'x';
const CIRCLE_CLASS = 'circle';
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let circleTurn;
let mySymbol;
let isMyTurn = false;

playButton.addEventListener('click', () => {
    coverPage.style.display = 'none';
    findingMatch.style.display = 'flex';
    socket.emit('findMatch');
});

mainMenuButton.addEventListener('click', () => {
    gameContainer.style.display = 'none';
    coverPage.style.display = 'block';
});

restartButton.addEventListener('click', () => {
    startGame();
    socket.emit('restartGame');
});

socket.on('waiting', () => {
    findingMatch.style.display = 'flex';
});

socket.on('gameStart', (data) => {
    findingMatch.style.display = 'none';
    gameContainer.style.display = 'block';
    mySymbol = data.symbol;
    startGame();
});

socket.on('moveMade', (data) => {
    const cell = cellElements[data.index];
    const currentClass = data.symbol;
    placeMark(cell, currentClass);
    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
    }
});

socket.on('opponentDisconnected', () => {
    alert('Opponent disconnected');
    gameContainer.style.display = 'none';
    coverPage.style.display = 'block';
});

function startGame() {
    circleTurn = false;
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(CIRCLE_CLASS);
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
}

function handleClick(e) {
    if (!isMyTurn) return;

    const cell = e.target;
    const currentClass = mySymbol;
    const index = Array.from(cellElements).indexOf(cell);
    placeMark(cell, currentClass);
    socket.emit('makeMove', { index, symbol: mySymbol });

    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
    }
}

function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
    } else {
        winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Wins!`;
    }
    winningMessageElement.classList.add('show');
}

function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS);
    });
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
}

function swapTurns() {
    isMyTurn = !isMyTurn;
}

function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(CIRCLE_CLASS);
    if (mySymbol === X_CLASS) {
        board.classList.add(X_CLASS);
    } else {
        board.classList.add(CIRCLE_CLASS);
    }
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}
