var User = reqire('./CUser.js');

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
			users[data.objectID].position = data.position;
	    users[data.objectID].targetPosition = data.targetPosition;
	    users[data.objectID].speed = data.speed;
	    users[data.objectID].direction = data.direction;
	    users[data.objectID].rotateSpeed = data.rotateSpeed;
	    users[data.objectID].targetDirection = data.targetDirection;

	    users[data.objectID].stop();
	    users[data.objectID].rotate();
		}else{
  		console.log('can`t find user data');
		}
	},
};

module.exports = CManager;
