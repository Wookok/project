var config = require('../config.json');
var gameConfig = require('../public/js/utils/gameConfig.json');
var util = require('../public/js/utils/util.js');
var QuadTree = require('quadtree-lib');

var INTERVAL_TIMER = 1000/gameConfig.fps;

function GameManager(){
  this.users = [];
  this.updateInteval = null;

  this.treeUser = new QuadTree({
    width : config.canvasMaxSize.width,
    height : config.canvasMaxSize.height,
    maxElements : 5
  });
  this.treeUserEles = [];
  this.colliderEles = [];
};

GameManager.prototype.start = function(){
  this.updateGame();
};
GameManager.prototype.updateGame = function(){
  if(this.updateInteval === null){
    this.updateInteval = setInterval( updateIntervalHandler.bind(this), INTERVAL_TIMER);
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
  }
  delete this.users[user.objectID];
};
GameManager.prototype.updateUser = function(user){
  if(!(user.objectID in this.users)){
    console.log("can`t find user`s ID. something is wrong");
  }
  this.users[user.objectID] = user;
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
  console.log(randomID);
  //initialize variables;
  user.assignID(randomID);

  user.setSize(64,64);
  user.setPosition(10, 10);

  user.setRotateSpeed(10);
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
  for(var index in this.colliderEles){
    this.treeUser.onCollision(this.colliderEles[index], function(item){

      console.log(item);
      console.log(this.colliderEles);

      var colCenterX = this.colliderEles[index].x + this.colliderEles[index].width/2;
      var colCenterY = this.colliderEles[index].y + this.colliderEles[index].height/2;

      var itemCenterX = item.x + item.width/2;
      var itemCenterY = item.y + item.height/2;

      var dist = Math.pow(itemCenterX - colCenterX,2) + Math.pow(itemCenterY - colCenterY ,2);
      if(dist < Math.pow(this.colliderEles[index].width/2 + item.width/2)){
        console.log('collision is occured');
      }
    });
  }
  //clear tree and treeArray
  for(var index in this.treeUserEles){
    this.treeUser.remove(this.treeUserEles[index]);
  }
  this.treeUserEles = [];
  this.colliderEles = [];
  //updateUserArray
  for(var id in this.users){
    this.users[id].setTreeUserEle();
    this.treeUserEles.push(this.users[id].treeUserEle);
  }
  //test
  for(var id in this.users){
    this.colliderEles.push(this.users[id].treeUserEle);
  }
  //put users data to tree
  this.treeUser.pushAll(this.treeUserEles);
};

function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

module.exports = GameManager;
