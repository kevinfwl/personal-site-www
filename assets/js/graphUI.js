const PATH = " "
const WALL = "#"
const SEARCH_PATH = "="

var NODE_SIZE = 20;
const PATH_COLOR = "#1b1b1b";
const BLOCK_COLOR = "#0f0f0f";
const STANDBY_COLOR = "#3d0b0b";
const SEARCHED_COLOR = "#0c1f29";
const FINAL_PATH_COLOR = "#0f2e0d";
const ctx = document.getElementById("grid").getContext('2d');
//constants for datascructures
var numNodes = 0
var needResizing = false;
var curMazeGenAlgo = 0;

/**
 * MODELS
 */
function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Tree(x, y) {
  this.x = x;
  this.y = y;
  this.parent = undefined;
}

Tree.prototype.getRoot = function() {
  return this.parent? this.parent.getRoot() : this;
}

Tree.prototype.connect = function(tree) {
  tree.getRoot().parent = this;
}

Tree.prototype.isConnected = function(tree) {
  return tree.getRoot() == this.getRoot();
}

//used to model graphs
function Edge(node1, node2, weight) {
  this.weight = weight;
  this.node1 = node1;
  this.node2 = node2;
  this.node1.edges.push(this);
  this.node2.edges.push(this);
}

Edge.prototype.disconnect = function() {
  for(let i =0; i < this.node1.edges.length; i++) {
    if (this.node1.edges[i] === this) {
      this.node1.edges.splice(i, 1);
      break;
    }
  }
  for(let i = 0; i < this.node2.edges.length; i++) {
    if (this.node2.edges[i] === this) {
      this.node2.edges.splice(i, 1);
      break;
    }
  }
}



function Node(val) {
  this.key = numNodes++
  this.val = val
  this.edges = []
}

Node.prototype.connect = function(node, weight) {
  let edge = new Edge(this, node, weight)
  return edge;
}


Node.prototype.getNeighbors = function() {
  let uniqueNeighbours = {};
  for (let i = 0; i < this.edges.length; i++) {
    let neighbour = this.edges[i].node1 === this? this.edges[i].node2 : this.edges[i].node1;
    if (uniqueNeighbours[neighbour.key] == undefined) {
      uniqueNeighbours[neighbour.key] = { "edge": [this.edges[i]], "node": neighbour};
    }
    else {
      uniqueNeighbours[neighbour.key]["edge"].push(this.edges[i]);
    }
  }
  return Object.values(uniqueNeighbours);
}

Node.prototype.disconnectByEdge = function(edge) {
  edge.disconnect();
}

Node.prototype.disconnectByNode = function(node) {
  this.edges.forEach(edge => {
    if (edge.node1 === node || edge.node2 === node) edge.disconnect();
  })
}

Node.prototype.disconnectAll = function(node) {
  this.edges.forEach(edge => {
    edge.disconnect();
  })
}



//used for dkstras algo
function KeyVal(w, val) {
  this.w = w;
  this.val = val;
}

function PriorityQueue() {
  this.queue = []
}

PriorityQueue.prototype.isEmpty = function() {
  return this.queue.length == 0;
}

PriorityQueue.prototype.insert = function(keyVal) {
    this.queue.push(keyVal)
    let i = this.queue.length - 1
    while (true) {
      if (this.queue[i].w < this.queue[Math.floor(i / 2)].w) {
        let temp = this.queue[i];
        this.queue[i] = this.queue[Math.floor(i / 2)];
        this.queue[Math.floor(i / 2)] = temp;
        i = Math.floor(i / 2);
      }
      else {
        break;
      }
  }
}

PriorityQueue.prototype.deleteMax = function() {
  let max = this.queue[0];  
  let i = 0;
  let last = this.queue.pop();
  if (this.queue.length != 0) this.queue[0] = last

  while (i * 2 < this.queue.length) {
    let minChild = i * 2;

    if (2 * i + 1 < this.queue.length && this.queue[2 * i + 1].w < this.queue[minChild].w) {
      minChild = 2 * i + 1;
    }

    if (this.queue[minChild].w < this.queue[i].w) {
      let temp = this.queue[i];
      this.queue[i] = this.queue[minChild];
      this.queue[minChild] = temp;
      i = minChild;
    }
    else {
      break;
    }
  }
  return max;
}

/**
 * UTILITY FUNCTIONS
 */
function createArray(wid, len) {
  array = new Array(); 
    for (var j = 0; j < len; j++) {
      array.push([]);
      for (var i = 0; i < wid; i++) {
        array[j].push("#")
    }
  }
  return array;
}

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

function print(arr) {
  var line = ""
  for (var i = 0; i < arr.length; i++) {
    console.log(arr[i].join(""))
  }
}

function getNeighbours(point, maze, neighbourOffset, symbol) {
  let neighbours = [];
  for (var i = 0; i < neighbourOffset.length; i++) {
    var x = neighbourOffset[i].x + point.x;
    var y = neighbourOffset[i].y + point.y;
    if (x > 0 && y > 0 && x < maze[0].length - 1 && y < maze.length - 1 && maze[y][x] == symbol) {
      neighbours.push(new Point(x, y))
    } 
  }
  return neighbours;
}

function arrayToGraph(array) {
  let pointArray = []
  //init point array
  for(let y = 0; y < array.length; y++) {
    pointArray.push([])
    for(let x = 0; x < array[0].length; x++){
      pointArray[y].push(new Node(new Point(x, y)));
    }
  }

  //iterate through all the stuff
  for(let y = 1; y < pointArray.length - 1; y++) {
    for(let x = 1; x < pointArray[0].length - 1; x++){
      if (array[y][x] == PATH) {
        if (array[y + 1][x] == PATH) pointArray[y][x].connect(pointArray[y + 1][x], 1)
        if (array[y][x + 1] == PATH) pointArray[y][x].connect(pointArray[y][x + 1], 1)
      }
    }
  }
  return [pointArray[1][1], pointArray[pointArray.length - 2][pointArray[0].length - 2]]
}

function chooseMazeGen(state, ctx, nodeSize) {

  state = createArray(state[0].length, state.length);
  let algDesTitle = document.getElementById("alg-description-title")
  let algDesBody = document.getElementById("alg-description-body")
 
  switch(curMazeGenAlgo) {
    case 0:
      setTimeout(() => { 
        fillGrid(ctx, BLOCK_COLOR)
        algDesTitle.innerHTML =  "Kruskal's Algorithm"
        algDesBody.innerHTML = "Simple minimum spanning tree algorith for maze generation"
        kruskalsUI(state, ctx, nodeSize) 
      }, 3000)
      break;
    case 1:
      setTimeout(() => {
        algDesTitle.innerHTML =  "Prim's Algorithm"
        algDesBody.innerHTML = "Simple minimum spanning tree algorith for maze generation"
        fillGrid(ctx, BLOCK_COLOR)
        primsUI(state, ctx, nodeSize) 
      }, 3000)
      break;
    case 2:
      setTimeout(() => {
        algDesTitle.innerHTML =  "Backtrack Algorithm"
        algDesBody.innerHTML = "Simple maze generation algorithm"
        fillGrid(ctx, BLOCK_COLOR)
        backtrackUI(state, ctx, nodeSize) 
      }, 3000)
  }
  curMazeGenAlgo = (curMazeGenAlgo + 1) % 3
}

function chooseMazeSolve(state, ctx, nodeSize) {
  let algDesTitle = document.getElementById("alg-description-title")
  let algDesBody = document.getElementById("alg-description-body")

    algDesTitle.innerHTML =  "A* Search"
    algDesBody.innerHTML = "simple shortest path finding algorithm"
    AStarUI(state,ctx, nodeSize);
}

function choose() {
  
}





function setNodeSize() {
  if (window.innerHeight >= 2000 && window.innerWidth >= 4000) NODE_SIZE = 40;
  else if (window.innerHeight <= 2000 && window.innerWidth <= 4000) NODE_SIZE = 20;
  else NODE_SIZE = 30;
}

function fillGrid(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
}

function initGrid() {
  setNodeSize();
  let w = window.innerWidth + NODE_SIZE - window.innerWidth % NODE_SIZE;
  let h = window.innerHeight + NODE_SIZE - window.innerHeight % NODE_SIZE;
  console.log("Grid: ", w, h)
  if (w % (NODE_SIZE * 2) == 0) w += NODE_SIZE;
  if (h % (NODE_SIZE * 2) == 0) h += NODE_SIZE;
  
  ctx.canvas.width  = w;
  ctx.canvas.height = h;
  
  fillGrid(ctx, BLOCK_COLOR)
}






/**
 * MAZE GENERATION, GRAPH SEARCH ALGORITHMS
 */

//actual impls used for web
function backtrackUI(state, ctx, nodeSize) {
  let stack = [new Point(1,1)];
  let traverseOrder = [new Point(0, 2), new Point(0, -2), new Point(2, 0), new Point(-2, 0)];
  let curNode = stack[0];
  ctx.fillStyle = PATH_COLOR;
  
  function step() {
    if (needResizing) {
      initAnimation();
      return;
    }

    if (stack.length != 0) {
      var hasNeighbours = false;
      shuffle(traverseOrder);
      for(var i = 0; i < traverseOrder.length; i++) {
        var frontierX = curNode.x + traverseOrder[i].x;
        var frontierY = curNode.y + traverseOrder[i].y;

        if (frontierX > 0 && frontierY > 0 && frontierX < state[0].length - 1 && frontierY < state.length - 1 && state[frontierY][frontierX] == "#") {
          // ctx.fillStyle = PATH;
          for (var x = Math.min(frontierX, curNode.x); x <= Math.max(frontierX, curNode.x); x++) {
            state[frontierY][x] = " ";  
            ctx.fillRect(x * nodeSize, frontierY * nodeSize, nodeSize, nodeSize);             
          }
          for (var y = Math.min(frontierY, curNode.y); y <= Math.max(frontierY, curNode.y); y++) {
            state[y][frontierX] = " "; 
            ctx.fillRect(frontierX * nodeSize, y * nodeSize, nodeSize, nodeSize);
          }
          curNode = new Point(frontierX, frontierY);
          
          stack.push(curNode);
          hasNeighbours = true;
          break;
        }
      }
      if (!hasNeighbours) {
        curNode = stack.pop();
        setTimeout(step, 1)
      }
      else {
        setTimeout(step, 15)
      }
    }
    else {
      chooseMazeSolve(state, ctx, NODE_SIZE)
    }
  }

  step();
}

function primsUI(state, ctx, nodeSize) {
  var curPoint = new Point(1,1);
  var queue = [new Point(1, 3), new Point(3, 1)]
  var traverseOrder = [new Point(0, 2), new Point(0, -2), new Point(2, 0), new Point(-2, 0)];
  state[1][1] = PATH;
  ctx.fillStyle = PATH_COLOR;
  shuffle(queue)


  function step() {
    let edgeConnected = false;

    if (needResizing) {
      initAnimation();
      return;
    }

    if (queue.length) {
      curPoint = queue.shift();
      shuffle(traverseOrder);
      if (state[curPoint.y][curPoint.x] != PATH) {
        var traversedNeighbors = getNeighbours(curPoint, state, traverseOrder, PATH)
        var frontier = getNeighbours(curPoint, state, traverseOrder, WALL)
    
        //connect with the first traversed neighbors
        if (traversedNeighbors.length != 0) {
          let frontierX = traversedNeighbors[0].x;
          let frontierY = traversedNeighbors[0].y;
          
          for (var x = Math.min(frontierX, curPoint.x); x <= Math.max(frontierX, curPoint.x); x++) {
            state[frontierY][x] = PATH;
            ctx.fillRect(x * nodeSize, frontierY * nodeSize, nodeSize, nodeSize);       
          }
          for (var y = Math.min(frontierY, curPoint.y); y <= Math.max(frontierY, curPoint.y); y++) {
            state[y][frontierX] = PATH;
            ctx.fillRect(frontierX * nodeSize, y * nodeSize, nodeSize, nodeSize);
            
          }
          edgeConnected = true;
        }
        queue = queue.concat(frontier);
        shuffle(queue);
      }

      if (edgeConnected) setTimeout(step, 15)
      else setTimeout(step, 1)

    }
    else {
      chooseMazeSolve(state, ctx, NODE_SIZE)
    }
  }

  step()
}


function kruskalsUI(state, ctx, nodeSize) {
  let edges = []
  let sets = []

  //init edges and sets
  for(let y = 0; y < array.length; y++) {
    sets.push([])
    for(let x = 0; x < array[0].length; x++) {
        sets[y].push(new Tree(x, y))
        if (y > 0 && x > 0 && y < array.length - 1 && x < array[0].length - 1 &&
          ((y % 2 == 0 && x % 2 != 0) || (y % 2 != 0 && x % 2 == 0))){
          edges.push(new Point(x, y))
        }
      }
  }
  ctx.fillStyle = PATH_COLOR;
  shuffle(edges)

  function step() {
    let edgeConnected = false 

    if (needResizing) {
      initAnimation();
      return;
    }

    if (edges.length) {
      let curEdge = edges.pop() 

      if (curEdge.x % 2 == 0) {
        if (!sets[curEdge.y][curEdge.x - 1].isConnected(sets[curEdge.y][curEdge.x + 1])) {
          sets[curEdge.y][curEdge.x - 1].connect(sets[curEdge.y][curEdge.x + 1])

          for (let x = -1; x <= 1; x++) {
            array[curEdge.y][curEdge.x + x] = PATH;
            ctx.fillRect((curEdge.x + x) * nodeSize, curEdge.y * nodeSize, nodeSize, nodeSize)
          }
        }
      }
      else {
        if (!sets[curEdge.y - 1][curEdge.x].isConnected(sets[curEdge.y + 1][curEdge.x])) {
          sets[curEdge.y + 1][curEdge.x].connect(sets[curEdge.y - 1][curEdge.x])

          for (let y = -1; y <= 1; y++) {
            array[curEdge.y + y][curEdge.x] = PATH;
            ctx.fillRect(curEdge.x * nodeSize, (curEdge.y + y) * nodeSize, nodeSize, nodeSize)
          }
          edgeConnected = true
        }
      }

      if (edgeConnected) setTimeout(step, 15)
      else setTimeout(step, 1)
    }
    else {
      chooseMazeSolve(state, ctx, NODE_SIZE)
    }
  }
  step();
}

function AStarUI(state, ctx, nodeSize, heuristic) {
  document.getEleme

  let graph = arrayToGraph(state)
  let start = graph[0]
  let end = graph[1]
  //init starting point is visited
  let pq = new PriorityQueue();
  let visited = {}
  visited[start.key] = new Path(0, start, start)
  pq.insert(new KeyVal(0, visited[start.key]))
  function Path(w, last, cur) {
    this.w = w;
    this.last = last;
    this.cur = cur;
  } 

  function traceSolution(start, end) {
    let path = []
    let cur = end;
    while (true) {
      path.unshift(cur);
      if (cur === start) break;
      if (visited[cur.key]) {
        cur = visited[cur.key].last;
      }
      else {
        return []
      }
    }
    return path;
  }
 
  function drawSolution(array, index) {
    if (needResizing) {
      initAnimation();
      return;
    }

    if (index < array.length) {
      ctx.fillStyle = FINAL_PATH_COLOR
      ctx.fillRect(array[index].val.x * nodeSize, array[index].val.y * nodeSize, nodeSize, nodeSize)
      setTimeout(() => { drawSolution(array, index + 1) }, 10)
    }
    else {
      chooseMazeGen(state, ctx, NODE_SIZE);
    }
  }

  function tracePath() {
    if (needResizing) {
      initAnimation();
      return;
    }

    if (!pq.isEmpty()) {
      let path = pq.deleteMax().val;
      visited[path.cur.key] = path;
      ctx.fillStyle = SEARCHED_COLOR
      ctx.fillRect(path.cur.val.x * nodeSize, path.cur.val.y * nodeSize, nodeSize, nodeSize)

      if (path.cur === end) {
        let solution = traceSolution(start, end, visited);
        setTimeout(drawSolution(solution, 0), 10)
        return;
      }
  
      let neighbors = path.cur.getNeighbors();
      for (let i = 0 ; i < neighbors.length; i++) {
        //there might be multiple edges between two nodes, find the min
        let minWeight = Math.min(neighbors[i].edge.map(edge => { return edge.weight; }))
        let neighbor = neighbors[i].node;
        
        if (!visited[neighbor.key]) {
          pq.insert(new KeyVal(path.w, new Path(path.w + minWeight + graph[1].val.x - neighbor.val.x + graph[1].val.y - neighbor.val.y, path.cur, neighbor)))
          ctx.fillStyle = STANDBY_COLOR
          ctx.fillRect(neighbor.val.x * nodeSize, neighbor.val.y * nodeSize, nodeSize, nodeSize)
        }
      }
      setTimeout(tracePath, 10)
    }
    else {
      chooseMazeGen(state, ctx, NODE_SIZE);
    }
  }

  tracePath()
}

// initGrid();
var state
// let state = createArray(ctx.canvas.width / NODE_SIZE, ctx.canvas.height / NODE_SIZE);
// print(state)
// kruskalsUI(state, ctx, NODE_SIZE);
initAnimation()
window.onresize = function() {
  needResizing = true;
} 

function initAnimation() {
  initGrid();
  needResizing = false;
  state = createArray(ctx.canvas.width / NODE_SIZE, ctx.canvas.height / NODE_SIZE);
  chooseMazeGen(state, ctx, NODE_SIZE);
}


