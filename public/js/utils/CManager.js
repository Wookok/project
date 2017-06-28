var User = require('./CUser.js');
var gameConfig = require('./gameConfig');

var INTERVAL_TIMER = 1000/gameConfig.fps;

var CManager = function(){
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index]);
			this.users[userDatas[index].objectID] = tempUser;
			this.users[userDatas[index].objectID].changeState(userDatas[index].currentState);
		}
	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	moveUser : function(userData){
		if(this.checkUserAtUsers(userData)){

			console.log(this.users[userData.objectID]);

			this.users[userData.objectID].position = userData.position;
			// this.users[userData.objectID].currentState = userData.currentState;
	    this.users[userData.objectID].targetPosition = userData.targetPosition;
	    this.users[userData.objectID].speed = userData.speed;
	    this.users[userData.objectID].direction = userData.direction;
	    this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
	    this.users[userData.objectID].targetDirection = userData.targetDirection;

			console.log(this.users[userData.objectID].direction);

			this.users[userData.objectID].changeState(userData.currentState);
		}else{
  		console.log('can`t find user data');
		}
	},
};

module.exports = CManager;
