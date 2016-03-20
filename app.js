angular.module('myApp', ['ngMaterial'])
  .service('ecardService')
  .controller('ecardController', function($scope, $http) {

    $scope.init = function(){
      $scope.$applyAsync(function(){
        $scope.playOneCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Emperor'}, {hide: false}];
        $scope.playTwoCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Slave'}, {hide: false}];
        $scope.gamePlay = {oneCardValue: "", twoCardValue: "", oneScore: 0, twoScore: 0, round: 0};
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

    var host = location.origin.replace(/^http/, 'ws');
    var ws = new WebSocket(host);
    var whichPlayer = null;
    var playedACard = false;

    ws.onmessage = function(event){
      var data = JSON.parse(event.data);
      if(data.reset){
        console.log('game reset');
        $scope.init();
      }
      if(data.youAre){
        console.log('you are player ' + data.youAre);
        whichPlayer = data.youAre;
      }
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
    };

    ws.onclose = function(event){
      throw 'Client lost connection to the server.';
    };

    $scope.send = function(index){
      var data = {
        index: index
      };
      ws.send(JSON.stringify(data));
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

      winner === 'Player One wins' ? $scope.gamePlay.oneScore++ : $scope.gamePlay.twoScore++;
      $scope.gamePlay.round++;

      if($scope.gamePlay.round%5 === 0 && $scope.gameTrack === $scope.reset) {
        $scope.gameTrack = $scope.swap;
      }
      else if ($scope.gamePlay.round%5 === 0 && $scope.gameTrack === $scope.swap){
        $scope.gameTrack = $scope.reset;
      }
      $scope.gameTrack();
    };

});