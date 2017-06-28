var User = require('./CUser.js');
var util = require('./util.js');

var CManager = function(gameConfig){
	this.gameConfig = gameConfig;

<<<<<<< HEAD
	//user correspond client
	this.user = null;
=======
var CManager = function(offset){
	//user correspond client
	this.user = null;
	this.offset = offset;
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
	//all users
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData, offset){
		if(!this.checkUserAtUsers(userData)){
<<<<<<< HEAD
			var tempUser = new User(userData, this.gameConfig);
=======
			var tempUser = new User(userData, this.offset);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas, offset){
		for(var index in userDatas){
<<<<<<< HEAD
			var tempUser = new User(userDatas[index], this.gameConfig);
=======
			var tempUser = new User(userDatas[index], this.offset);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
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
<<<<<<< HEAD
			this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
			this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);

			this.users[userData.objectID].speed.x = userData.speed.x;
			this.users[userData.objectID].speed.y = userData.speed.y;

			this.users[userData.objectID].direction = userData.direction;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
			this.users[userData.objectID].targetDirection = userData.targetDirection;

			if(this.user.objectID == userData.objectID){
				//offset targetPosition change >> targetPosition == position
				this.users[userData.objectID].changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
			}else{
=======
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

>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
				this.users[userData.objectID].changeState(userData.currentState);
			}
		}else{
  		console.log('can`t find user data');
		}
	},
<<<<<<< HEAD
	//execute every frame this client user move
	moveUsersOffset : function(){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].position.x -= this.user.speed.x;
					this.users[index].position.y -= this.user.speed.y;

					this.users[index].targetPosition.x -= this.user.speed.x;
					this.users[index].targetPosition.y -= this.user.speed.y;
				}
			}else{
				console.log('can`t find user data');
			}
		}
	},
	// set this client user
=======
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
<<<<<<< HEAD
				this.user.onMoveOffset = this.moveUsersOffset.bind(this);
=======
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	}
};

module.exports = CManager;
