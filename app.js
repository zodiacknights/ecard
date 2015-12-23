angular.module('myApp', [])
  .service('ecardService')
  .controller('ecardController', function($scope, $http) {

    var playOneCards = ['Citizen', 'Citizen', 'Citizen', 'Citizen', 'Emperor'];
    var playTwoCards = ['Citizen', 'Citizen', 'Citizen', 'Citizen', 'Slave'];
    $scope.playOneCards = playOneCards;
    $scope.playTwoCards = playTwoCards;


});