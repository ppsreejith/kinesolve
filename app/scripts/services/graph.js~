'use strict';

/*
  service for the visualizing screen
*/
angular.module('kinesolveApp')
    .factory('graph', function () {
	return (function() {
	    var _graph = {};
	    var loops = (function() {
		var _SIZE = 4;
		var _loops = [];
		var _foundLoops = {};
		var _lastUpdated = 0;
		var _visited = {};
		var Node = function(data, parent) {
		    return {
			data:data,
			parent:parent,
		    };
		};

		function findLoop(node, val, stack) {
		    stack = stack || [];
		    stack.push(node.data);
		    if (node.data == val) {
			if (stack.length >= _SIZE)
			    addLoop(stack);
			return ;
		    }
		    findLoop(node.parent, val, stack);
		}

		function addLoop(vals) {
		    var signature = String(vals.slice().sort());
		    if (!_foundLoops[signature]) {
			_foundLoops[signature] = true;
			_loops.push(vals);
		    }
		}
		
		function dfs(node) {
		    var id = node.data;
		    _visited[id] = true;
		    var nexts = _graph[id];
		    for (var i in nexts) {
			if (!_visited[nexts[i]])
			    dfs( Node(nexts[i], node) );
			else
			    findLoop(node, nexts[i])
		    }
		    delete _visited[id];
		}

		return {
		    refresh : function() {
			var nodes = Object.keys(_graph);
			if (nodes.length == 0)
			    return;
			_loops = [];
			_visited = {};
			_foundLoops = {};
			dfs( Node(nodes[0], null) );
			_lastUpdated = Date.now();
		    },
		    
		    getLoops : function() {
			return _loops;
		    },

		    getLastUpdated : function() {
			return _lastUpdated;
		    }
		};
	    }());

	    return {
		addNode : function(id) {
		    if (!_graph.hasOwnProperty(id))
			_graph[id] = [];
		},

		removeNode : function(id) {
		    var temp = [];
		    if (_graph.hasOwnProperty(id)) {
			temp = _graph[id];
			delete _graph[id];
		    }
		    return temp;
		},

		addEdge : function(from, to) {
		    if (_graph.hasOwnProperty(from) && _graph.hasOwnProperty(to))
			if (_graph[from].indexOf(to) == -1) {
			    _graph[from].push(to);
			    _graph[to].push(from);
			    loops.refresh();
			}
		},

		removeEdge : function(from, to) {
		    if (_graph.hasOwnProperty(from)) {
			_graph[from] = _graph[from].filter(function(x) {
			    return x != to;
			});
		    }
		    if (_graph.hasOwnProperty(to)) {
			_graph[to] = _graph[to].filter(function(x) {
			    return x != from;
			});
		    }
		    loops.refresh();
		},

		getLoops : function() {
		    return loops.getLoops();
		},

		checkNewLoops : function() {
		    return loops.getLastUpdated();
		},

		// For debug purposes
		getGraph : function() {
		    return _graph;
		}
	    }
	}());
    });
