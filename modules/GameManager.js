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
GameManager.prototype.updateDataSetting = function(){
  var userData = [];
  var tempUser = {
    position : { x : 0, y : 0 },
    targetPosition : { x : 0, y : 0 }
  };
  for(var index in this.users){
    tempUser.position = this.users[index].position;
    tempUser.targetPosition = this.users[index].targetPosition;
    userData.push(tempUser);
  };
  return userData;
};
GameManager.prototype.joinUser = function(user){
  this.users.push(user);
  console.log(user.userID + ' join in GameManager');
};
GameManager.prototype.updateUser = function(user){
  var index = this.findUserIndex(user);
  if(index != -1){
    this.users[index] = user;
  }
}
GameManager.prototype.kickUser = function(user){
  var index = this.findUserIndex(user);
  if(index != -1){
    users.splice(index, 1);
    console.log(user.userID + ' exit GameManager');
  }
};
GameManager.prototype.findUserIndex = function(user){
  for(var index in users){
    if(this.users[index].userID == user.userID){
      return index;
    }
  }
  return -1;
}

module.exports = GameManager;
