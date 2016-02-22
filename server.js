var WebSocketServer = require('ws').Server;
var express = require('express');
var io = require('socket.io')(app);
var app = express();
var http = require('http');
var _ = require('lodash');

app.get('/', function(req, res) {res.sendFile(__dirname + '/index.html');});
app.get('/app.js', function(req, res) {res.sendFile(__dirname + '/app.js');});
app.get('/style.css', function(req, res) {res.sendFile(__dirname + '/style.css');});

var server = http.createServer(app);
server.listen(process.env.PORT || 3000);

var wss = new WebSocketServer({server: server});

var waiting = [];

var playerRooms = {};

var status = {
  waiting: 'waiting in queue',
  play: 'play a card',
  result: 'turn result, go again',
  waitingMe: 'waiting for your move',
  waitingYou: 'waiting for other player to move'
};

wss.on('connection', function(ws) {
  var playerID = Math.random();

  waiting.unshift({
    id: playerID,
    ws: ws
  });

  console.log('websocket connection open');

  var waitingInQueue = function(playerWS){
    playerWS.send(JSON.stringify({
      status: status.waiting
    }));
  };

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

    player1.ws.send(JSON.stringify({
      youAre: 1,
      reset: true,
      status: status.play
    }));
    player2.ws.send(JSON.stringify({
      youAre: 2,
      reset: true,
      status: status.play
    }));
  };

  var checkQueue = function(playerWS){
    if(waiting.length < 2)
      return waitingInQueue(playerWS);
    else
      return createRoom();
  };

  ws.on('close', function() {
    console.log('websocket connection close');

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

    checkQueue(playerToRequeue.ws);
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
      playerRoom.player1.ws.send(JSON.stringify({
        result: playerRoom.result,
        status: status.result
      }));
      playerRoom.player2.ws.send(JSON.stringify({
        result: playerRoom.result,
        status: status.result
      }));
      playerRoom.result.player1Move = null;
      playerRoom.result.player2Move = null;

    // if one player has moved, tell other player to move
    }else if(playerRoom.result.player1Move === null){
      playerRoom.player1.ws.send(JSON.stringify({
        status: status.waitingMe
      }));
      playerRoom.player2.ws.send(JSON.stringify({
        status: status.waitingYou
      }));
    }else{
      playerRoom.player1.ws.send(JSON.stringify({
        status: status.waitingYou
      }));
      playerRoom.player2.ws.send(JSON.stringify({
        status: status.waitingMe
      }));
    }
  };
  
  ws.on('message', function(data){
    playerRoom = playerRooms[playerID];
    data = JSON.parse(data);
    if(data.index !== undefined)
      return playCard(playerRoom, data.index);
  });

  checkQueue(ws);
});
