var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var path = require('path');
// var socket = io.connect('http://localhost:3000');

app.use('/', express.static(path.join(__dirname)));


http.listen(3000, function(){
  console.log('listening on *:3000');
});

var waiting = [];

var playerRooms = {};

var status = {
  waiting: 'waiting in queue',
  play: 'play a card',
  result: 'turn result, go again',
  waitingMe: 'waiting for your move',
  waitingYou: 'waiting for other player to move'
};

io.on('connection', function(socket) {
  console.log('websocket connection opened');

  var playerID = Math.random();
  waiting.unshift({
    id: playerID,
    socket: socket
  });
  
  var createRoom = function(){
    var player1 = waiting.pop();
    var player2 = waiting.pop();

    var room = {
      result: {
        player1Move: null,
        player2Move: null
      },
      player1: player1,
      player2: player2
    };

    playerRooms[player1.id] = room;
    playerRooms[player2.id] = room;

    player1.socket.emit('player joined', {
      youAre: 1,
      reset: true,
      status: status.play
    });
    player2.socket.emit('player joined', {
      youAre: 2,
      reset: true,
      status: status.play
    });
  };

  var checkQueue = function(){
    if(waiting.length < 2)
      socket.emit('waiting', {status: status.waiting});
    else{
      createRoom();
    }
  };

  socket.on('disconnect', function() {
    console.log('websocket connection closed');

    // clear player from waiting queue
    waiting = waiting.filter(function(player){
      return player.id !== playerID;
    });

    // clear room and move other player to queue
    var playerRoom = playerRooms[playerID];
    if(!playerRoom) return;
    var playerToRequeue;
    if(playerRoom.player1.id === playerID){
      playerToRequeue = playerRoom.player2;
    }else{
      playerToRequeue = playerRoom.player1;
    }
    waiting.unshift(playerToRequeue);
    delete playerRooms[playerRoom.player1.id];
    delete playerRooms[playerRoom.player2.id];

    checkQueue(playerToRequeue.socket);
  });

  var playCard = function(playerRoom, index){
    whichPlayer = playerRoom.player1.id === playerID ? 1 : 2;
    
    // save the move
    if(whichPlayer === 1)
      playerRoom.result.player1Move = index;
    else
      playerRoom.result.player2Move = index;

    // if both players moved, send results and reset turn
    if(_.every(playerRoom.result, function(move){return move !== null;})){
      playerRoom.player1.socket.emit('game on', {
        result: playerRoom.result,
        status: status.result
      });
      playerRoom.player2.socket.emit('game on', {
        result: playerRoom.result,
        status: status.result
      });
      playerRoom.result.player1Move = null;
      playerRoom.result.player2Move = null;

    // if one player has moved, tell other player to move
    }else if(playerRoom.result.player1Move === null){
      playerRoom.player1.socket.emit('game on', {
        status: status.waitingMe
      });
      playerRoom.player2.socket.emit('game on', {
        status: status.waitingYou
      });
    }else{
      playerRoom.player1.socket.emit('game on', {
        status: status.waitingYou
      });
      playerRoom.player2.socket.emit('game on', {
        status: status.waitingMe
      });
    }
  };

//here
  socket.on('chat', function(msg){
    io.emit('chat', msg);
    console.log('message: ' + msg);
  });

  
  socket.on('message', function(data){
    playerRoom = playerRooms[playerID];
    if(data.index !== undefined)
      return playCard(playerRoom, data.index);
  });

  checkQueue(socket);
});
