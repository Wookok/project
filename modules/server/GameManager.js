var Obstacle = require('./Obstacle.js');
var config = require('../../config.json');
var gameConfig = require('../public/gameConfig.json');
var util = require('../public/util.js');

var QuadTree = require('quadtree-lib');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

//quadTree var
var entityTree = new QuadTree({
  width : gameConfig.CANVAS_MAX_SIZE.width,
  height : gameConfig.CANVAS_MAX_SIZE.height,
  maxElements : 5
});
var userEles = [];
var colliderEles = [];

var staticTree = new QuadTree({
  width : gameConfig.CANVAS_MAX_SIZE.width,
  height : gameConfig.CANVAS_MAX_SIZE.height,
  maxElements : 5
});
var staticEles = [];
var affectedEles = [];

function GameManager(){
  this.users = [];
  this.obstacles = [];
  this.updateInteval = null;
  this.staticInterval = null;
  this.affectInterval = null;

  // this.entityTree = new QuadTree({
  //   width : gameConfig.CANVAS_MAX_SIZE.width,
  //   height : gameConfig.CANVAS_MAX_SIZE.height,
  //   maxElements : 5
  // });
  //
  // this.userEles = [];
  // this.colliderEles = [];
  //
  // staticTree = new QuadTree({
  //   width : gameConfig.CANVAS_MAX_SIZE.width,
  //   height : gameConfig.CANVAS_MAX_SIZE.height,
  //   maxElements : 5
  // });
  // staticEles = [];
  // affectedEles = [];
};

GameManager.prototype.createObstacle = function(){
  var obstacle1 = new Obstacle(200, 200, 100, 100, generateRandomID("OR"));
  var obstacle2 = new Obstacle(500, 500, 100, 100, generateRandomID("OR"));

  staticEles.push(obstacle1.staticEle);
  staticEles.push(obstacle2.staticEle);

  staticTree.pushAll(staticEles);
};

GameManager.prototype.start = function(){
  this.mapSetting();
  this.updateGame();
};
GameManager.prototype.mapSetting = function(){
  this.createObstacle();
};
GameManager.prototype.updateGame = function(){
  if(this.updateInteval === null){
    this.updateInteval = setInterval( updateIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.staticInterval === null){
    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.affectInterval === null){
    this.affectInterval = setInterval(affectIntervalHandler.bind(this), INTERVAL_TIMER);
  }
};
//setting User for moving and move user;
GameManager.prototype.setUserTargetAndMove = function(user, targetPosition){
  user.setTargetPosition(targetPosition);
  user.setTargetDirection();
  user.setSpeed();

  user.changeState(gameConfig.OBJECT_STATE_MOVE);
};

// user join, kick, update
GameManager.prototype.joinUser = function(user){
  this.users[user.objectID] = user;
  console.log(this.users);
  console.log(user.objectID + ' join in GameManager');
};
GameManager.prototype.kickUser = function(user){
  if(!(user.objectID in this.users)){
    console.log("can`t find user`s ID. something is wrong");
  }else{
    delete this.users[user.objectID];
  }
};
GameManager.prototype.updateUser = function(user){
  if(!(user.objectID in this.users)){
    console.log("can`t find user`s ID. something is wrong");
  }else{
    this.users[user.objectID] = user;
  }
};

//user initialize
GameManager.prototype.initializeUser = function(user){
  // check ID is unique
  var IDisUnique = false;
  while(!IDisUnique){
    var randomID = generateRandomID('U');
    IDisUnique = true;
    for(var index in this.users){
      if(randomID == this.users[index].objectID){
        IDisUnique = false;
      }
    }
  }
  //initialize variables;
  user.assignID(randomID);

  user.setSize(64,64);
  user.setPosition(10, 10);

  user.setRotateSpeed(30);
  user.setMaxSpeed(10);
};

GameManager.prototype.stopUser = function(user){
  user.stop();
};

// data setting for send to client
GameManager.prototype.updateDataSettings = function(){
  var userData = [];

  for(var index in this.users){
    var tempUser = {
      objectID : index,

      currentState : this.users[index].currentState,
      position : this.users[index].position,
      targetPosition : this.users[index].targetPosition,

      // speed : this.users[index].speed,
      maxSpeed : this.users[index].maxSpeed,

      direction : this.users[index].direction,

      rotateSpeed :  this.users[index].rotateSpeed,
      // targetDirection : this.users[index].targetDirection,

      size : this.users[index].size
    };
    userData.push(tempUser);
  };

  return userData;
};
GameManager.prototype.updateDataSetting = function(user){
  var updateUser = {
    objectID : user.objectID,

    currentState : user.currentState,
    position : user.position,
    targetPosition : user.targetPosition,

    // speed : user.speed,
    maxSpeed : user.maxSpeed,
    direction : user.direction,

    rotateSpeed :  user.rotateSpeed,
    // targetDirection : user.targetDirection,

    size : user.size
  };

  return updateUser;
};

function updateIntervalHandler(){
  for(var i=0; i<colliderEles.length; i++){
    var tempCollider = colliderEles[i];
    entityTree.onCollision(tempCollider, function(item){
      if(tempCollider.id !== item.id){
        var colCenterX = tempCollider.x + tempCollider.width/2;
        var colCenterY = tempCollider.y + tempCollider.height/2;

        var itemCenterX = item.x + item.width/2;
        var itemCenterY = item.y + item.height/2;

        var distSquare = Math.pow(itemCenterX - colCenterX,2) + Math.pow(itemCenterY - colCenterY ,2);
        if(distSquare < Math.pow(tempCollider.width/2 + item.width/2, 2)){
          console.log('collision is occured');
        }
      }
    });
  }
  //clear tree and treeArray
  for(var index in userEles){
    entityTree.remove(userEles[index]);
  }
  userEles = [];
  colliderEles = [];

  //updateUserArray
  for(var index in this.users){
    this.users[index].setUserEle();
    userEles.push(this.users[index].entityTreeEle);
  }
  //test
  for(var index in this.users){
    colliderEles.push(this.users[index].entityTreeEle);
  }
  //put users data to tree
  entityTree.pushAll(userEles);
};
function staticIntervalHandler(){
  for(var index in this.users){
    var tempUserEle = this.users[index].entityTreeEle;
    staticTree.onCollision(tempUserEle, function(item){
      if(tempUserEle.id !== item.id){
        var userCenterX = tempUserEle.x + tempUserEle.width/2;
        var userCenterY = tempUserEle.y + tempUserEle.height/2;

        var itemCenterX = item.x + item.width/2;
        var itemCenterY = item.y + item.height/2;

        var distSquare = Math.pow(itemCenterX - userCenterX,2) + Math.pow(itemCenterY - userCenterY,2) - Math.pow(tempUserEle.width/2 + item.width/2,2);
        //if collision, distSquare == speedSquare
        if(distSquare<0){
          //find reverse direction
          var dist = tempUserEle.width/2 + item.width/2 - Math.sqrt(Math.pow(itemCenterX - userCenterX,2) + Math.pow(itemCenterY - userCenterY,2));
          var distSquare = Math.pow(dist,2);

          var vecX = userCenterX - itemCenterX;
          var vecY = userCenterY - itemCenterY;

          var ratioXY = vecY/vecX;
          var ratioXYSquare = Math.pow(ratioXY,2);

          var vecScalar = (Math.pow(vecX, 2) + Math.pow(vecY, 2));
          // var unitVecX = vecX/vecScalar;
          // var unitVecY = vecY/vecScalar;

          var distFactorX = Math.sqrt(distSquare/(1+ratioXYSquare));
          var distFactorY = Math.sqrt((ratioXYSquare * distSquare) / (ratioXYSquare + 1));

          var addToPosX = (vecX > 0 ? 1 : -1) * distFactorX * 1.5;
          var addToPosY = (vecY > 0 ? 1 : -1) * distFactorY * 1.5;
          //function name, userID, arg1, arg2
          affectedEles.push({func : 'moveCompel', id : tempUserEle.id, arg1 : addToPosX, arg2 : addToPosY});
          console.log(affectedEles);
        }
      }
    });
  }
};
function affectIntervalHandler(){
  var i = affectedEles.length;
  while(i--){
    if(affectedEles[i].func === 'moveCompel'){
      if(affectedEles[i].id in this.users){
        this.users[affectedEles[i].id].stop();
        console.log(this.users[affectedEles[i].id].position);
        console.log(affectedEles[i].arg1);
        console.log(affectedEles[i].arg1 + this.users[affectedEles[i].id].position.x);
        this.users[affectedEles[i].id].position.x += affectedEles[i].arg1;
        this.users[affectedEles[i].id].position.y += affectedEles[i].arg2;
        this.users[affectedEles[i].id].setCenter();
        console.log(this.users[affectedEles[i].id].position);
      }
    }
    affectedEles.splice(i, 1);
  }
  // for(var index in affectedEles){
  //   if(affectedEles[index].func === 'moveCompel'){
  //     this.users[affectedEles[index].id].position.x += affectedEles[index].arg1;
  //     this.users[affectedEles[index].id].position.y += affectedEles[index].arg2;
  //     affectedEles.splice(index, 1);
  //   }
  // }
};
function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

module.exports = GameManager;
