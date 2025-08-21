const express=require('express');
const socket=require('socket.io');
const http=require('http');
const {Chess}=require('chess.js');
const path=require('path');
const { title } = require('process');
const { log } = require('console');
const app=express();

const server=http.createServer(app);
const io=socket(server);

const chess=new Chess();

let players={};
let currentplayer='W';
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));

app.get('/',(req,res)=>{
    res.render('index',{title: 'Chess Game'});
});

io.on('connection', function(uniquesocket) {
    console.log('A user connected: ' + uniquesocket.id);

    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit('playerRole','w');
    
    }else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit('playerRole','b');
    }else{
        uniquesocket.emit('spectator');
    }

    uniquesocket.on('disconnect',function(){
        if(uniquesocket.id===players.white){
            delete players.white;
        }else if(uniquesocket.id===players.black){
            delete players.black;
        }   
    });

    uniquesocket.on('move',(move)=>{
        try {
            if(chess.turn()==='w' && uniquesocket.id!==players.white) return;
            if(chess.turn()==='b' && uniquesocket.id!==players.black) return;

            const result=chess.move(move);
            if(result){
                currentplayer=chess.turn();
                io.emit('move',move);
                io.emit('boardstate',chess.fen());
            }else{
                console.log('error in move:', move);
                uniquesocket.emit('invalidMove', move);
            }
            
        } catch (error) {
            console.log(error);
            
            uniquesocket.emit('Error processing move:', move);
            
        }
    })
     
});



server.listen(3000,()=>{
    console.log('Server is running on port 3000');
});