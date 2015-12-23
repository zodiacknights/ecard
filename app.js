angular.module('myApp', [])
  .service('ecardService')
  .controller('ecardController', function($scope, $http) {

    var playOneCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Emperor'}, {hide: false}];
    var playTwoCards = [{card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Citizen'}, {card: 'Slave'}, {hide: false}];
    var gamePlay = {oneCounter: true, twoCounter: false, oneValue: "", twoValue: ""};
    $scope.playOneCards = playOneCards;
    $scope.playTwoCards = playTwoCards;

    $scope.oneClicked = function(pOne, index){
      if (gamePlay.oneCounter){
        gamePlay.oneCounter = false;
        gamePlay.twoCounter = true;
        pOne.hide = true;
        gamePlay.oneValue = pOne.card;
      }
    };

    $scope.twoClicked = function(pTwo, index){
      if (gamePlay.twoCounter){
        gamePlay.oneCounter = true;
        gamePlay.twoCounter = false;      	
        pTwo.hide = true;
        gamePlay.twoValue = pTwo.card;
        $scope.showDown();
      }
    };

    $scope.showDown = function(){
      if(gamePlay.oneValue === 'Citizen' && gamePlay.twoValue === 'Citizen'){
        console.log('Draw');
      }
      if(gamePlay.oneValue === 'Citizen' && gamePlay.twoValue === 'Slave'){
        console.log('Player One wins');
      }
      if(gamePlay.oneValue === 'Emperor' && gamePlay.twoValue === 'Citizen'){
        console.log('Player One wins');
      }
      if(gamePlay.oneValue === 'Emperor' && gamePlay.twoValue === 'Slave'){
        console.log('Player Two wins');
      }
    };

});