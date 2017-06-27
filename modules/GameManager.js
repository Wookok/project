var gameConfig = require('../public/js/utils/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.fps;

function GameManager(){
  this.users = [];
  this.updateInteval = null;
};

GameManager.prototype.updateGame = function(){
  if(this.updateInteval != null){
      return;
  };
  this.updateInteval = setInterval(function(){

  }, INTERVAL_TIMER);
};

//setting User for moving and move user;
GameManager.prototype.setUserTargetAndMove = function(user, targetPosition){
  user.setTargetPosition(targetPosition);
  user.setTargetDirection(targetPosition);
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
  user.setPosition(10, 10);
  user.setSize(64,64);
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

      speed : this.users[index].speed,
      direction : this.users[index].direction,

      rotateSpeed :  this.users[index].rotateSpeed,
      targetDirection : this.users[index].targetDirection
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

    speed : user.speed,
    direction : user.direction,

    rotateSpeed :  user.rotateSpeed,
    targetDirection : user.targetDirection
  };

  return updateUser;
};

function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
}
module.exports = GameManager;
