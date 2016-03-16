angular.module('myApp', [])
  .service('ecardService')
  .controller('ecardController', function($scope, $http) {

    $scope.init = function(){
      $scope.$applyAsync(function(){
        $scope.playOneCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Emperor'}, {hide: false}];
        $scope.playTwoCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Slave'}, {hide: false}];
        $scope.gamePlay = {oneCardValue: "", twoCardValue: "", oneScore: 0, twoScore: 0};
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
        return $scope.init();
      }
      if($scope.gamePlay.oneCardValue === 'Citizen' && $scope.gamePlay.twoCardValue === 'Citizen'){
        alert('Draw');
      }
      if($scope.gamePlay.oneCardValue === 'Citizen' && $scope.gamePlay.twoCardValue === 'Slave'){
        $scope.gamePlay.oneScore += 1;
        alert('Player One wins');
        $scope.init();
      }
      if($scope.gamePlay.oneCardValue === 'Emperor' && $scope.gamePlay.twoCardValue === 'Citizen'){
        $scope.gamePlay.oneScore += 1;
        console.log($scope.gamePlay.oneScore)
        alert('Player One wins');
        $scope.init();
      }
      if($scope.gamePlay.oneCardValue === 'Emperor' && $scope.gamePlay.twoCardValue === 'Slave'){
        $scope.gamePlay.twoScore += 1;
        alert('Player Two wins');
        $scope.init();
      }
    };

});