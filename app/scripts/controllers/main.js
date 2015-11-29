'use strict';

/**
 * @ngdoc function
 * @name kinesolveApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the kinesolveApp
 */
angular.module('kinesolveApp')
  .controller('MainCtrl',['$scope', 'graph', function ($scope, graph) {

      var _def_msg = "Developed by Sreejith Pp";
      $scope.status = _def_msg;
      
      $scope.$on("status:changed", function(event, message) {
	  $scope.status = message;
      });
      $scope.$on("status:default", function(event) {
	  $scope.status = _def_msg;
      });
      $scope.$on("node:added", function(event, id) {
	  graph.addNode(id);
      });
      $scope.$on("node:removed", function(event, id) {
	  var nodes = graph.removeNode(id);
	  for (var i in nodes)
	      $scope.$emit("edge:remove", id, nodes[i]);
      });
      $scope.$on("edge:added", function(event, from, to) {
	  graph.addEdge(from, to);
	  $scope.$apply();
      });
      $scope.$on("edge:removed", function(event, from, to) {
	  graph.removeEdge(from, to);
	  $scope.$apply();
      });
      $scope.getLoops = graph.getLoops;
      $scope.highlight = function(loop) {
	  $scope.$emit("loop:highlight", loop);
      };
      $scope.lowlight = function(loop) {
	  $scope.$emit("loop:lowlight", loop);
      };
      $scope.selectLoop = function() {
	  $scope.$emit("loop:selectLoop");
      };
      $scope.selectedLoop = function(loop) {
	  $scope.$emit("loop:selectedLoop", loop);
      };
  }]);
