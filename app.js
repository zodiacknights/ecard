angular.module('myApp', [])
  .service('ecardService')
  .controller('ecardController', function($scope, $http) {

    var whichPlayer = null;
    var playedACard = false;
    var socket = io();
    $scope.messages = [];
    $scope.im = {};
    $scope.text = '';
    $scope.p1Scores= [ "-", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "];
    $scope.p2Scores= [ "-", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "];
 
    $scope.init = function(){
      $scope.$applyAsync(function(){
        $scope.playOneCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Emperor'}, {hide: false}];
        $scope.playTwoCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Slave'}, {hide: false}];
        $scope.gamePlay = {oneCardValue: "", twoCardValue: "", oneScore: 0, twoScore: 0, round: 1};
        $scope.gameTrack = $scope.reset;
      });
    };

    $scope.reset = function(){
      $scope.$applyAsync(function(){
        $scope.playOneCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Emperor'}, {hide: false}];
        $scope.playTwoCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Slave'}, {hide: false}];
        $scope.swapped = false;
      });
    };

    $scope.swap = function(){
      $scope.$applyAsync(function(){
        $scope.playOneCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Slave'}, {hide: false}];
        $scope.playTwoCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Emperor'}, {hide: false}];
        $scope.swapped = true;
      });
    };

    $scope.init();

    socket.on('waiting', function(data){
      console.log(data.status);
    });

    socket.on('player joined', function (data){
      if(data.reset){
        console.log('game reset');
        $scope.init();
      }
      if(data.youAre){
        console.log('you are player ' + data.youAre);
        whichPlayer = data.youAre;
      }
    });

    socket.on('game on', function(data){
      if(data.status){
        console.log(data.status);
      }
      if(data.result){
        $scope.gamePlay.oneCardValue = $scope.playOneCards[data.result.player1Move].card;
        $scope.gamePlay.twoCardValue = $scope.playTwoCards[data.result.player2Move].card;
        $scope.$apply(function(){
          $scope.playOneCards[data.result.player1Move].hide = true;
          $scope.playTwoCards[data.result.player2Move].hide = true;
        });
        $scope.showDown();
        playedACard = false;
      }
    });

    socket.on('disconnect', function(event){
      throw 'Client lost connection to the server.';
    });

    $scope.send = function(index){
      var data = {
        index: index
      };
     socket.send(data);
    };

    $scope.submit = function(){
      console.log($scope.bet)
    }

    $scope.oneClicked = function(pOne, index){
      if (whichPlayer === 1 && playedACard === false){
        playedACard = true;
        pOne.hide = true;
        $scope.send(index);
      }
    };

    $scope.twoClicked = function(pTwo, index){
      if (whichPlayer === 2 && playedACard === false){
        playedACard = true;      	
        pTwo.hide = true;
        $scope.send(index);
      }
    };

    $scope.isCheating = function(){
      var hideCheck = function(card){
        return card.hide;
      };
      return $scope.playOneCards.filter(hideCheck).length !== $scope.playTwoCards.filter(hideCheck).length;
    };

    $scope.showDown = function(){
      if($scope.isCheating()){
        alert('Someone Cheated');
        return $scope.reset();
      }
      var results = [];
      var winner;

      if (!$scope.swapped){
        results.push($scope.gamePlay.oneCardValue, $scope.gamePlay.twoCardValue, 'Player One wins', 'Player Two wins');
      }
      else{
        results.push($scope.gamePlay.twoCardValue, $scope.gamePlay.oneCardValue, 'Player Two wins', 'Player One wins');
      }

      if(results[0] === 'Citizen' && results[1] === 'Citizen'){
        alert('Draw');
        return;
      }
      if(results[0] === 'Citizen' && results[1] === 'Slave' || results[0] === 'Emperor' && results[1] === 'Citizen'){
        winner = results[2];
        alert(results[2]);
      }

      if(results[0] === 'Emperor' && results[1] === 'Slave'){
        winner = results[3];
        alert(results[3]);
      }

      if (winner === 'Player One wins'){
        $scope.gamePlay.oneScore++;
        $scope.p1Scores[$scope.gamePlay.round - 1] = "W";
        $scope.p2Scores[$scope.gamePlay.round - 1] = "L";
      }
      else if (winner === 'Player Two wins'){
        $scope.gamePlay.twoScore++;
        $scope.p1Scores[$scope.gamePlay.round - 1] = "L"; 
        $scope.p2Scores[$scope.gamePlay.round - 1] = "W";       
      }
      
      $scope.p1Scores[$scope.gamePlay.round] = "-";
      $scope.p2Scores[$scope.gamePlay.round] = "-";
      $scope.gamePlay.round++;

      if($scope.gamePlay.round%5 === 0 && $scope.gameTrack === $scope.reset) {
        $scope.gameTrack = $scope.swap;
      }
      else if ($scope.gamePlay.round%5 === 0 && $scope.gameTrack === $scope.swap){
        $scope.gameTrack = $scope.reset;
      }


      $scope.gameTrack();
    };

    $scope.func = function(element, player){
      if (element < 4){
        return "Citizen";
      }
      if (player === 'one' && element === 4){
        if (!$scope.swapped){
          return 'Emperor';
        } 
        else {
          return 'Slave';
        }
      }
      if (player === 'two' && element === 4){
        if(!$scope.swapped){
          return 'Slave';
        }
        else{
          return 'Emperor';
        }
      }
    };

    
    $scope.submit = function(){
      if ($scope.text) {
        socket.emit('chat', {msg: this.text, player: whichPlayer});
      $scope.text = '';
      }
    };

    socket.on('chat', function(data){
      $scope.messages.push("Player " + data.player + ": " + data.msg);
      $scope.$apply()
    });

});