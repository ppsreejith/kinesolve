'use strict';

/*
  directive for the visualizing screen
*/
angular.module('kinesolveApp')
  .directive('kineVisualizer', function () {

      var stage;
      var loopSelectMode = false;
      var selectedLoop = null;
      var layer = null;
      var currentLine = null;
      var counter = 0;
      var lineCounter = -1;
      var clearSolving;
      var lineMap = (function() {
	  var _lineMap = {}

	  return {
	      get : function(from_id, to_id) {
		  return _lineMap[from_id + '-' + to_id] || 
		      _lineMap[to_id + '-' + from_id];
	      },

	      set : function(from_id, to_id, id) {
		  _lineMap[from_id + '-' + to_id] = id;
	      },

	      remove : function(from_id, to_id) {
		  delete _lineMap[from_id + '-' + to_id];
		  delete _lineMap[to_id + '-' + from_id];
	      }
	  };
      }());

      function link(scope, elem, attrs) {
	  var height = window.innerHeight - angular.element("div.header").outerHeight() - angular.element("div.footer").outerHeight();
	  console.log(height);

	  stage = new Konva.Stage({
	      container: elem[0].id,
	      height: height,
	      width:window.innerWidth,
	  });
	  
	  if (layer == null)
	      layer = new Konva.Layer();
	  stage.add(layer);
	  addStageEvents();

	  clearSolving = function() {
	      var loop = selectedLoop;
	      selectedLoop = null;
	      selectInputNode(null);
	      scope.$emit("loop:lowlight", loop);
	      scope.$emit("status:default");
	  }

	  //Add events here
	  scope.$on('node:add', function(event, pos, id) {
	      if (id >= counter)
		  counter = id;
	      addCircle(pos);
	  });
	  scope.$on('node:remove', function(event, id) {
	      removeCircle(stage.find("#"+id)[0]);
	  });
	  scope.$on('edge:add', function(event, from_id, to_id) {
	      var from = stage.find("#"+from_id)[0];
	      var to = stage.find("#"+to_id)[0];
	      addLine(from, to);
	  });
	  scope.$on('edge:remove', function(event, from_id, to_id) {
	      var id = lineMap.get(from_id, to_id);
	      if (id != undefined)
		  removeLine(stage.find("#"+id)[0]);
	  });
	  scope.$on('loop:highlight', function(event, loop) {
	      if (selectedLoop)
		  return;
	      var node2 = loop.reduce(function(node1, node2) {
		  highlight(node1, node2);
		  return node2;
	      });
	      highlight(loop[0], node2);
	      layer.draw();
	  });
	  scope.$on('loop:lowlight', function(event, loop) {
	      if (selectedLoop || !loop)
		  return;
	      var node2 = loop.reduce(function(node1, node2) {
		  lowlight(node1, node2);
		  return node2;
	      });
	      lowlight(loop[0], node2);
	      layer.draw();
	  });
	  scope.$on('loop:selectLoop', function(event) {
	      loopSelectMode = !loopSelectMode;
	  });
	  scope.$on('loop:selectedLoop', function(event, loop) {
	      if (!loopSelectMode)
		  return;
	      loopSelectMode = !loopSelectMode;
	      var equal = isEqual(selectedLoop, loop);
	      var prevLoop = selectedLoop;
	      clearSolving();
	      if (!equal) {
		  scope.$emit("loop:highlight", loop);
		  selectedLoop = loop;
		  selectInputAngles(scope, loop);
	      }
	  });
	  window.trigger = function(event, data1, data2) {
	      scope.$emit(event, data1, data2);
	  };
	  stage.$emit = function(event, data1, data2, data3) {
	      scope.$emit(event, data1, data2, data3);
	  }
      }
      
      function addStageEvents() {
	  stage.on("contentClick", function(evt) {
	      if (evt.evt.cancelBubble == true)
		  return;
	      var pos = stage.getPointerPosition();
	      if (currentLine) {
		  removeLine(currentLine);
		  currentLine = null;
		  return;
	      }
	      addCircle(pos);
	  });

	  stage.on("contentMousemove", function() {
	      if (currentLine) {
		  updateLine(stage.getPointerPosition());
	      }
	  });
      }

      function updateLine(pos) {
	  var points = currentLine.points()
	  points[2] = pos.x;
	  points[3] = pos.y;
	  currentLine.points(points);
	  layer.draw();
      }

      function addTempLine(points) {
	  var line = new Konva.Line({
	      points: points,
	      stroke: 'green',
	      strokeWidth: 2,
	      lineCap: 'round',
	      dash: [10, 5]
	  });
	  return addLineEvents(line);
      }

      function addLine(start, end) {
	  var from = start.id();
	  var to = end.id();
	  if (from == to)
	      return;
	  if (lineMap.get(from, to) != undefined)
	      return;
	  var id = lineCounter--;
	  lineMap.set(from, to, id);
	  var line = new Konva.Line({
	      points: [start.x(), start.y(), end.x(), end.y()],
	      stroke: 'red',
	      strokeWidth: 5,
	      lineCap: 'round',
	      id: id,
	  });
	  line.from_id = from;
	  line.to_id = to;
	  stage.$emit("edge:added", from, to);
	  return addLineEvents(line);
      }

      function addLineEvents(line) {
	  line.on("dblclick", function(evt) {
	      removeLine(line);
	  });
	  line.on("click", function(evt) {
	      evt.evt.cancelBubble = true;
	  });
	  layer.add(line);
	  line.moveToBottom();
	  layer.draw();
	  return line;
      }

      function removeLine(line) {
	  if (line.from_id != undefined && line.to_id != undefined) {
	      lineMap.remove(line.from_id, line.to_id);
	      stage.$emit("edge:removed", line.from_id, line.to_id);
	  }
	  removeNode(line);
      }

      function addCircle(pos) {
	  stage.$emit("node:added", counter);
	  var circle = new Konva.Circle({
	      x: pos.x,
	      y: pos.y,
	      fill: 'blue',
	      radius: 10,
	      id: ""+counter++,
	  });
	  return addCircleEvents(circle);
      }

      function addCircleEvents(circle) {
	  circle.on("dblclick", function(evt) {
	      removeCircle(circle);
	  });
	  circle.on("mouseup", function(evt) {
	      evt.evt.cancelBubble = true;
	      if (currentLine) {
		  var startNode = currentLine.startNode;
		  removeLine(currentLine);
		  addLine(startNode, circle);
		  currentLine = null;
	      }
	  });
	  circle.on("click", function(evt) {
	      if (selectedLoop) {
		  selectInputNode(circle);
	      }
	  });
	  circle.on("mousedown", function(evt) {
	      var pos = stage.getPointerPosition();
	      if (currentLine == null) {
		  currentLine = addTempLine([circle.x(), circle.y(), pos.x, pos.y]);
		  currentLine.startNode = circle;
	      }
	  });
	  layer.add(circle).draw();
	  return circle;
      }

      function removeCircle(circle) {
	  stage.$emit("node:removed", circle.id());
	  removeNode(circle);
      }
      
      function removeNode(node) {
	  node.remove();
	  layer.draw();
      }

      function highlight(from, to) {
	  var id = lineMap.get(from, to);
	  var edge = stage.find("#"+id)[0];
	  edge.stroke('yellow');
      }
      
      function lowlight(from, to) {
	  var id = lineMap.get(from, to);
	  var edge = stage.find("#"+id)[0];
	  edge.stroke('red');
      }

      function isEqual(loop1, loop2) {
	  if (!loop1 || !loop2)
	      return false;
	  if (loop1.length != loop2.length)
	      return false;
	  for (var elem in loop1) {
	      if (loop1[elem] != loop2[elem])
		  return false;
	  }
	  return true;
      }

      function selectInputAngles(scope, loop) {
	  var _msg = "Select a node to determine input angle";
	  scope.$emit("status:changed", _msg);
      }

      var selectInputNode = (function() {
	  var _node_ids = {};
	  var nodes = [];

	  return function(node) {
	      if (!selectedLoop) {
		  _node_ids = {};
		  nodes = [];
		  return;
	      }
	      var size = selectedLoop.length - 3;
	      if (Object.keys(_node_ids).length == size)
		  anglesSelected(nodes, _node_ids);
	      if (!_node_ids[node.getId()]) {
		  _node_ids[node.getId()] = true;
		  nodes.push(node);
	      }
	      if (Object.keys(_node_ids).length == size)
		  anglesSelected(nodes, _node_ids);
	      /*
	      var length = Object.keys(_nodes).length;
	      if (length == 3) return; // remove when adding more input angles
	      if (length != 0 && (!_nodes[line.from_id] && !_nodes[line.to_id]))
		  return;
	      _nodes[line.from_id] = true;
	      _nodes[line.to_id] = true;
	      console.log(_nodes);
	      if (Object.keys(_nodes).length == 3)
		  anglesSelected(_nodes);
*/
	  };
      }());

      function anglesSelected(inputs, verify) {
	  var layer = inputs[0].getLayer();
	  var loop = selectedLoop.map(function(x) {
	      return layer.findOne("#"+x);
	  });
	  var others = loop.filter(function(x) {
	      return !verify[x.getId()];
	  });
	  clearSolving();
	  layer.getStage().$emit("simulate", loop, inputs, others);
      }
      
      return {link:link};
  });
