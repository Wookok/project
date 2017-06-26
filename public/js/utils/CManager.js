var User = require('./CUser.js');

var CManager = function(){
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData);
			this.users[userData.objectID] = tempUser;
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index]);
			this.users[userDatas[index].objectID] = tempUser;
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
			this.users[userData.objectID].position = userData.position;
	    this.users[userData.objectID].targetPosition = userData.targetPosition;
	    this.users[userData.objectID].speed = userData.speed;
	    this.users[userData.objectID].direction = userData.direction;
	    this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
	    this.users[userData.objectID].targetDirection = userData.targetDirection;

	    this.users[userData.objectID].stop();
	    this.users[userData.objectID].rotate();
		}else{
  		console.log('can`t find user data');
		}
	},
};

module.exports = CManager;
