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

wss.on('connection', function(ws) {
  var playerID = Math.random();

  var whichPlayer;

  waiting.unshift(playerID);

  var id = setInterval(function() {
    var playerRoom = playerRooms[playerID];

    // if no second player
    if(!playerRoom && waiting.length < 2){
      // wait for second player
      return ws.send(JSON.stringify({
        status: 'waiting for another player'
      }));
    // if second player joined
    }else if(!playerRoom){
      // put players in a room
      var room = {
        playersConnected: true,
        player1Move: null,
        player2Move: null,
        playerOrder: [waiting.pop(), waiting.pop()],
      };

      room.gotResults = {};
      room.gotResults[room.playerOrder[0]] = false;
      room.gotResults[room.playerOrder[1]] = false;

      playerRooms[room.playerOrder[0]] = room;
      playerRooms[room.playerOrder[1]] = room;

      return ws.send(JSON.stringify({
        status: 'another player connected'
      }));
    }

    // check if other player is connected
    if(!playerRoom.playersConnected){
      delete playerRooms[playerID];
      ws.send(JSON.stringify({
        status: 'player disconnected, restart needed'
      }));
      return ws.close();
    }

    // check if both players got the turn results
    var bothGotResults = _.every(playerRoom.gotResults, function(gotResult) {return gotResult;});
    if(bothGotResults){
      playerRoom.player1Move = null;
      playerRoom.player2Move = null;
      _.each(playerRoom.gotResults, function(gotResult, key, results) {
        results[key] = false;
      });
    }

    whichPlayer = playerRoom.playerOrder[0] === playerID ? 1 : 2;
    // if no card played this turn
    if(playerRoom.player1Move === null || playerRoom.player2Move === null){
      // tell player to play a card
      return ws.send(JSON.stringify({
        youAre: whichPlayer,
        status: 'waiting on a player to move'
      }));
    // if both cards are played
    } else {
      // send card data to each player
      playerRoom.gotResults[playerID] = true;
      return ws.send(JSON.stringify({
        result: {
          player1Move: playerRoom.player1Move,
          player2Move: playerRoom.player2Move
        },
        status: 'turn result'
      }));
    }

  }, 1000);

  console.log('websocket connection open');

  ws.on('close', function() {
    console.log('websocket connection close');
    waiting = waiting.filter(function(id){
      return id !== playerID;
    });
    clearInterval(id);
  });

  ws.on('message', function(data){
    data = JSON.parse(data);
    if(whichPlayer === 1){
      playerRooms[playerID].player1Move = data.index;
    }
    if(whichPlayer === 2){
      playerRooms[playerID].player2Move = data.index;
    }
  });
});
