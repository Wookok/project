var Obstacle = require('./Obstacle.js');
var config = require('../../config.json');
var gameConfig = require('../public/gameConfig.json');
var util = require('../public/util.js');

var resources = require('../public/resource.json');
var map = require('../public/map.json');

var skills = require('../public/skill.json');

var QuadTree = require('quadtree-lib');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

//quadTree var
var entityTree;
var userEles = [];
var colliderEles = [];

var staticTree;
var staticEles = [];
var affectedEles = [];

function GameManager(){
  this.users = [];
  this.obstacles = [];
  this.updateInteval = null;
  this.staticInterval = null;
  this.affectInterval = null;
};

GameManager.prototype.start = function(){

  entityTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });
  staticTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });

  this.mapSetting();
  this.updateGame();
};
GameManager.prototype.mapSetting = function(){
  this.createObstacles();
};
GameManager.prototype.updateGame = function(){
  if(this.updateInteval === null){
    this.updateInteval = setInterval(updateIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.staticInterval === null){
    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.affectInterval === null){
    this.affectInterval = setInterval(affectIntervalHandler.bind(this), INTERVAL_TIMER);
  }
};

//create obstacles and static tree setup
GameManager.prototype.createObstacles = function(){
  for(var index in map.Trees){
    var tempObstacle = new Obstacle(map.Trees[index].posX, map.Trees[index].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id, resources.OBJ_TREE_SRC);
    // var tempObstacle = new Obstacle(util.worldXCoordToLocalX(map.Trees[index].posX, this.gameConfig.userOffset.x),
    // 																util.worldYCoordToLocalY(map.Trees[index].posY, this.gameConfig.userOffset.y),
    // 																resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id);
    this.obstacles.push(tempObstacle);
    staticEles.push(tempObstacle.staticEle);
  }
  staticTree.pushAll(staticEles);
  // var obstacle1 = new Obstacle(200, 200, 100, 100, generateRandomID("OR"));
  // var obstacle2 = new Obstacle(500, 500, 100, 100, generateRandomID("OR"));
  //
  // staticEles.push(obstacle1.staticEle);
  // staticEles.push(obstacle2.staticEle);
  //
  // staticTree.pushAll(staticEles);
};
//setting User for moving and move user;
GameManager.prototype.setUserTargetAndMove = function(user, targetPosition){
  var collisionObjs = util.checkCircleCollision(staticTree, targetPosition.x - user.size.width/2, targetPosition.y - user.size.width/2, user.size.width, user.objectID);
  //if click in obstacle calculate new target position
  if(collisionObjs.length > 0){
    var curPosX = user.position.x + user.size.width/2;
    var curPosY = user.position.y + user.size.width/2;

    var addPosX = collisionObjs[0].x + collisionObjs[0].width/2 - curPosX;
    var addPosY = collisionObjs[0].y + collisionObjs[0].width/2 - curPosY;

    var vecSize = Math.sqrt(Math.pow(addPosX,2) + Math.pow(addPosY,2));

    var unitVecX = addPosX/vecSize;
    var unitVecY = addPosY/vecSize;

    var radiusDist = collisionObjs[0].width/2 + user.size.width/2

    var newAddPosX = unitVecX * (vecSize - radiusDist);
    var newAddPosY = unitVecY * (vecSize - radiusDist);

    var newTargetPosX = curPosX + newAddPosX;
    var newTargetPosY = curPosY + newAddPosY;

    targetPosition.x = newTargetPosX;
    targetPosition.y = newTargetPosY;
  }
  user.setTargetPosition(targetPosition);
  user.setTargetDirection();
  user.setSpeed();

  user.changeState(gameConfig.OBJECT_STATE_MOVE);
};
//setting user for attack;
GameManager.prototype.setTargetandAttack = function(user){
  //setTarget
  var range = skills.baseAttack.range;
  var width = skills.baseAttack.width;
  var height = skills.baseAttack.height;

  var direction = user.direction;
  // if(direction >= 0 && direction < 90){
    var addPosX = range * Math.cos(direction);
    var addPosY = range * Math.sin(direction);
  // // }else if(direction >= 90){
  //   posX = range * Math.cos(direction);
  //   posY = range * Math.sin(direction);
  // }else if(direction <0 &&  direction >= -90){
  //   posX = range * Math.cos(direction);
  //   posY = range * Math.sin(direction);
  // }else if(direction < -90){
  //   posX = range * Math.cos(direction);
  //   posY = range * Math.sin(direction);
  // }
  var posX = user.position.x + addPosX;
  var posY = user.position.y + addPosY;



  var attackTime = skills.baseAttack.attackTime;
  var attackDelay = skills.baseAttack.attackDelay;
  user.changeState(gameConfig.OBJECT_STATE_ATTACK);
};
// user join, kick, update
GameManager.prototype.joinUser = function(user){
  this.users[user.objectID] = user;
  this.users[user.objectID].onMove = onMoveCalcCompelPos.bind(this);
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

  user.setRotateSpeed(20);
  user.setMaxSpeed(5);
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

    rotateSpeed : user.rotateSpeed,
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
  // for(var index in this.users){
  //   var tempUserEle = this.users[index].entityTreeEle;
  //   var collisionObjs = util.checkCircleCollision(staticTree, tempUserEle.x, tempUserEle.y, tempUserEle.width, tempUserEle.id);
  //   if(collisionObjs.length > 0 ){
  //     var addPos = util.calcCompelPos(tempUserEle, collisionObjs);
  //     // affectedEles.push({func : 'moveCompel', id : tempUserEle.id, arg1 : addPos.x, arg2 : addPos.y});
  //   }
  // }
};

function affectIntervalHandler(){
  // var i = affectedEles.length;
  // while(i--){
  //   if(affectedEles[i].func === 'moveCompel'){
  //     if(affectedEles[i].id in this.users){
  //       // this.users[affectedEles[i].id].stop();
  //       this.users[affectedEles[i].id].position.x += affectedEles[i].arg1;
  //       this.users[affectedEles[i].id].position.y += affectedEles[i].arg2;
  //       this.users[affectedEles[i].id].setCenter();
  //
  //       this.users[affectedEles[i].id].setTargetDirection();
  //       this.users[affectedEles[i].id].setSpeed();
  //       // this.users[affectedEles[i].id].changeState(gameConfig.OBJECT_STATE_MOVE);
  //     }
  //   }
  //   affectedEles.splice(i, 1);
  // }
};

var onMoveCalcCompelPos = function(user){
  var collisionObjs = util.checkCircleCollision(staticTree, user.entityTreeEle.x, user.entityTreeEle.y, user.entityTreeEle.width, user.entityTreeEle.id);
  if(collisionObjs.length > 0 ){
    var addPos = util.calcCompelPos(user.entityTreeEle, collisionObjs);
  }
  return addPos;
};

function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

module.exports = GameManager;
