var User = require('./CUser.js');

var util = require('../public/util.js');

var resources = require('../public/resource.json');
var map = require('../public/map.json');

var QuadTree = require('../public/quadtree.min.js');

var Obstacle = require('./CObstacle.js');
var Effect = require('./CEffect.js');

var staticTree;
var staticEles = [];
var affectedEles = [];

var CManager = function(gameConfig){
	this.gameConfig = gameConfig;

	//user correspond client
	this.user = null;
	//all users
	this.users = [];
	this.obstacles = [];
	this.effects = [];

	this.staticInterval = null;
	this.affectInterval = null;
};

CManager.prototype = {
	start : function(){
		staticTree = new QuadTree({
		  width : this.gameConfig.CANVAS_MAX_SIZE.width,
		  height : this.gameConfig.CANVAS_MAX_SIZE.height,
		  maxElements : 5
		});

		this.mapSetting();
		this.updateGame();
	},
	mapSetting : function(){
		this.createObstacles();
		this.setObstaclesLocalPos();
	},
	updateGame : function(){
		var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;

		if(this.staticInterval === null){
	    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
	  }
	  if(this.affectInterval === null){
	    this.affectInterval = setInterval(affectIntervalHandler.bind(this), INTERVAL_TIMER);
	  }
	},
	createObstacles : function(){
		for(var index in map.Trees){
			var tempObstacle = new Obstacle(map.Trees[index].posX, map.Trees[index].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id, resources.OBJ_TREE_SRC);
			this.obstacles.push(tempObstacle);
		}
	},
	updateObstacleEles : function(){
		staticEles = [];

		for(var index in this.obstacles){
			var localPos = util.worldToLocalPosition(this.obstacles[index].position, this.gameConfig.userOffset);
			this.obstacles[index].staticEle.x = localPos.x
			this.obstacles[index].staticEle.y = localPos.y

			//will add filtering method

			staticEles.push(this.obstacles[index].staticEle);
		}

	  staticTree.pushAll(staticEles);
	},
	setObstaclesLocalPos : function(){
		for(var index in this.obstacles){
			var localPos = util.worldToLocalPosition(this.obstacles[index].position, this.gameConfig.userOffset);
			this.obstacles[index].localPosition.x = localPos.x
			this.obstacles[index].localPosition.y = localPos.y
		}
	},
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData, this.gameConfig);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index], this.gameConfig);
			this.users[userDatas[index].objectID] = tempUser;
			this.users[userDatas[index].objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userDatas[index].objectID].changeState(userDatas[index].currentState);
		}
	},
	kickUser : function(objID){
		if(!(objID in this.users)){
			console.log("user already out");
		}else{
			delete this.users[objID];
		}
	},
	createSkillEffect : function(targetPos, radius, direction, lifeTime){
		// var effect = new Effect(targetPos, radius, direction, lifeTime);
		//
    // //create skill fireEffect
    // this.createSkillEffect(skillData.targetPosition, skillData.radius, userData.direction, skillData.totalTime - skillData.fireTime);

		// this.effects.push(effect);
	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	//will be merge to updateUser function
	moveUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			if(this.user.objectID == userData.objectID){
				//offset targetPosition change >> targetPosition == position
				this.users[userData.objectID].changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
			}else{
				this.users[userData.objectID].changeState(userData.currentState);
			}
		}else{
  		console.log('can`t find user data');
		}
	},
	attackUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			this.users[userData.objectID].changeState(this.gameConfig.currentState);
		}
	},
	updateUserData : function(userData){
		if(this.checkUserAtUsers(userData)){
			this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
			this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);

			// this.users[userData.objectID].speed.x = userData.speed.x;
			// this.users[userData.objectID].speed.y = userData.speed.y;

			this.users[userData.objectID].direction = userData.direction;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
			// this.users[userData.objectID].targetDirection = userData.targetDirection;

			this.users[userData.objectID].setCenter();
			this.users[userData.objectID].setTargetDirection();
			this.users[userData.objectID].setSpeed();
		}else{
  		console.log('can`t find user data');
		}
	},
	//execute every frame this client user move
	moveUsersOffset : function(addPos){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].addPosAndTargetPos(-this.user.speed.x, -this.user.speed.y);
					if(addPos){
						this.users[index].addPosAndTargetPos(-addPos.x, -addPos.y);
					}
				}
			}else{
				console.log('can`t find user data');
			}
		}
		for(var index in this.obstacles){
			this.obstacles[index].localPosition.x -= this.user.speed.x;
			this.obstacles[index].localPosition.y -= this.user.speed.y;
		}
		if(addPos !== undefined){
			for(var index in this.obstacles){
				this.obstacles[index].localPosition.x -= addPos.x;
				this.obstacles[index].localPosition.y -= addPos.y;
				// this.obstacles[index].staticEle.x -= addPos.x;
				// this.obstacles[index].staticEle.y -= addPos.y;
			}
		}
	},
	compelUsersOffset : function(compelToX, compelToY){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].addPosAndTargetPos(-compelToX, -compelToY);
				}
			}
		}
	},
	revisionUserPos : function(revisionX, revisionY){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].addPosAndTargetPos(revisionX, revisionY);
				}
			}
		}
		for(var index in this.obstacles){
			this.obstacles[index].localPosition.x += revisionX;
			this.obstacles[index].localPosition.y += revisionY;

			// this.obstacles[index].staticEle.x += revisionX;
			// this.obstacles[index].staticEle.y += revisionY;
		}
	},
	revisionAllObj : function(revisionX, revisionY){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				this.users[index].addPosAndTargetPos(revisionX, revisionY);
			}
		}
		for(var index in this.obstacles){
			this.obstacles[index].localPosition.x += revisionX;
			this.obstacles[index].localPosition.y += revisionY;

			// this.obstacles[index].staticEle.x += revisionX;
			// this.obstacles[index].staticEle.y += revisionY;
		}
	},
	// set this client user
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
				this.user.onMoveOffset = this.moveUsersOffset.bind(this);
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	},
	findUserAsWorldPosition : function(userID, offset){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				var returnVal = {
					position : util.localToWorldPosition(this.users[index].position, offset),
					size : this.users[index].size
				};
				return returnVal;
			}
		}
	},
	//if canvas size changed re calculate all object local position
	reCalcLocalPosition : function(beforeOffset, afterOffset){
		for(var index in this.users){
			// before local position transform world position[position, targetPosition, center]
			var worldPosition = util.localToWorldPosition(this.users[index].position, beforeOffset);
			var worldTargetPosition = util.localToWorldPosition(this.users[index].targetPosition, beforeOffset);

			this.users[index].position = util.worldToLocalPosition(worldPosition, afterOffset);
			this.users[index].targetPosition = util.worldToLocalPosition(worldTargetPosition, afterOffset);
			this.users[index].setCenter();
		}
	}
};

function staticIntervalHandler(){
	//user elements update for collision check
	for(var index in this.users){
		this.users[index].setUserEle();
	}
	//obstacle elements remove at tree and update position
	for(var index in staticEles){
		staticTree.remove(staticEles[index]);
	}
	this.updateObstacleEles();

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
	// 			if(affectedEles[i].id === this.user.objectID){
	// 				this.users[affectedEles[i].id].targetPosition.x -= affectedEles[i].arg1;
	//         this.users[affectedEles[i].id].targetPosition.y -= affectedEles[i].arg2;
	//
	// 				this.gameConfig.userOffset.x += affectedEles[i].arg1;
	// 				this.gameConfig.userOffset.y += affectedEles[i].arg2;
	//
	//         this.users[affectedEles[i].id].setTargetDirection();
	//         this.users[affectedEles[i].id].setSpeed();
	//
	// 				this.compelUsersOffset(affectedEles[i].arg1 , affectedEles[i].arg2);
	// 			}else{
	//         this.users[affectedEles[i].id].position.x += affectedEles[i].arg1;
	//         this.users[affectedEles[i].id].position.y += affectedEles[i].arg2;
	//         this.users[affectedEles[i].id].setCenter();
	//
	//         this.users[affectedEles[i].id].setTargetDirection();
	//         this.users[affectedEles[i].id].setSpeed();
	// 			}
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
module.exports = CManager;
