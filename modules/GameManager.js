function GameManager(){
  this.users = [];
  this.updateInteval = null;
};

GameManager.prototype.updateGame = function(){
  if(this.updateInteval != null){
      return;
  };
  this.updateInteval = setInterval(function(){

  }, 1000/30);
};

//setting User for moving and move user;
GameManager.prototype.setUserTargetAndMove = function(user, targetPosition){
  user.setTargetPosition(targetPosition);
  user.setTargetDirection(targetPosition);
  user.stop();
  user.setSpeed();
  if(user.direction != user.targetDirection){
    user.rotate();
  }else{
    user.move();
  }
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

// data setting for send to client
GameManager.prototype.updateDataSettings = function(){
  var userData = [];

  for(var index in this.users){
    var tempUser = {
      objectID : index,
      position : this.users[index].position,
      targetPosition : this.users[index].targetPosition,

      speed : this.users[index].speed,
      direction : this.users[index].direction,

      rotateSpeed :  this.users[index].rotateSpeed,
      targetDirection : this.users[index].targetDirection
    };
    userData.push(tempUser);
  };
  console.log(userData);

  return userData;
};
GameManager.prototype.updateDataSetting = function(user){
  var updateUser = {
    objectID : user.objectID,
    position : user.position,
    targetPosition : user.targetPosition,

    speed : user.speed,
    direction : user.direction,

    rotateSpeed :  user.rotateSpeed,
    targetDirection : user.targetDirection
  };

  return updateUser;
};
module.exports = GameManager;
