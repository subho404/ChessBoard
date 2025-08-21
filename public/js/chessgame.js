const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square',
                (rowIndex + squareIndex) % 2 === 0 ? 'light' : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color == 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);

                // Only allow dragging if it's the player's turn and color
                pieceElement.draggable = playerRole === square.color && chess.turn() === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData('text/plain', "");
                    }
                });

                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });

    });
    if(playerRole=='b'){
        boardElement.classList.add('flipped');

    }else{
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };
    // Try to make the move locally first
    const result = chess.move(move);
    if (result) {
        renderBoard();
        socket.emit('move', move);
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        'p': '♟', // Pawn
        'r': '♜', // Rook
        'n': '♞', // Knight
        'b': '♝', // Bishop
        'q': '♛', // Queen
        'k': '♚',
        'P': '♟', // Pawn
        'R': '♜', // Rook
        'N': '♞', // Knight
        'B': '♝',
        'Q': '♛',
        'K': '♚'
    };
    return unicodePieces[piece.type] || '';
};

socket.on('playerRole', function (role) {
    playerRole = role;
    renderBoard();
});

socket.on('spectator', function () {
    playerRole = null;
    renderBoard();
});

// Listen for boardstate (from server)
socket.on('boardstate', function (fen) {
    chess.load(fen);
    renderBoard();
});

// Listen for move (from server, if you want to animate or highlight)
socket.on('move', function (move) {
    chess.move(move);
    renderBoard();
});

renderBoard();