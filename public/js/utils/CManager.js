var User = require('./CUser.js');
var gameConfig = require('./gameConfig');

var INTERVAL_TIMER = 1000/gameConfig.fps;

var CManager = function(offset){
	//user correspond client
	this.user = null;
	this.offset = offset;
	//all users
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData, offset){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData, this.offset);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas, offset){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index], this.offset);
			this.users[userDatas[index].objectID] = tempUser;
			this.users[userDatas[index].objectID].changeState(userDatas[index].currentState);
		}
	},
	updateUsers : function(){


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
			if(this.user.objectID == userData.objectID){
				this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.offset);
		    this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.offset);

				this.users[userData.objectID].speed.x = userData.speed.x;
				this.users[userData.objectID].speed.y = userData.speed.y;

				this.users[userData.objectID].direction = userData.direction;
		    this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
		    this.users[userData.objectID].targetDirection = userData.targetDirection;

				//offset targetPosition change >> targetPosition == position
				this.users[userData.objectID].changeState(gameConfig.OBJECT_STATE_MOVE_OFFSET);
			}else{
				this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.offset);
		    this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.offset);

		    this.users[userData.objectID].speed.x = userData.speed.x - this.user.speed.x;
				this.users[userData.objectID].speed.y = userData.speed.y - this.user.speed.y;

				this.users[userData.objectID].direction = userData.direction;
		    this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
		    this.users[userData.objectID].targetDirection = userData.targetDirection;

				this.users[userData.objectID].changeState(userData.currentState);
			}
		}else{
  		console.log('can`t find user data');
		}
	},
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	}
};

module.exports = CManager;
