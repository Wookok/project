var User = require('./CUser.js');

var util = require('../public/util.js');

var resources = require('../public/resource.json');
var map = require('../public/map.json');

var QuadTree = require('../public/quadtree.min.js');

var Obstacle = require('./CObstacle.js');
var Skill = require('./CSkill.js');

var colliderEles = [];

var staticTree;
var staticEles = [];
var affectedEles = [];

var CManager = function(gameConfig){
	this.gameConfig = gameConfig;

	//user correspond client
	this.user = null;
	//all users
	this.users = [];
	this.chests = [];
	this.obstacles = [];
	this.effects = [];
	this.projectiles = [];
	this.objExps = [];
	this.objSkills = [];

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
		for(var i=0; i<map.Trees.length; i++){
			var tempObstacle = new Obstacle(map.Trees[i].posX, map.Trees[i].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[i].id, resources.OBJ_TREE_SRC);
			this.obstacles.push(tempObstacle);
		}
		for(var i=0; i<map.Chests.length; i++){
			var chestBase = new Obstacle(map.Chests[i].posX, map.Chests[i].posY, resources.OBJ_CHEST_SIZE, resources.OBJ_CHEST_SIZE, map.Chests[i].id, resources.OBJ_CHEST_SRC);
			this.obstacles.push(chestBase);
		}
	},
	updateObstacleEles : function(){
		staticEles = [];

		for(var i=0; i<this.obstacles.length; i++){
			var localPos = util.worldToLocalPosition(this.obstacles[i].position, this.gameConfig.userOffset);

			this.obstacles[i].staticEle.x = localPos.x
			this.obstacles[i].staticEle.y = localPos.y

			//will add filtering method

			staticEles.push(this.obstacles[i].staticEle);
		}

	  staticTree.pushAll(staticEles);
	},
	setObstaclesLocalPos : function(){
		for(var i=0; i<this.obstacles.length; i++){
			var localPos = util.worldToLocalPosition(this.obstacles[i].position, this.gameConfig.userOffset);
			this.obstacles[i].localPosition.x = localPos.x
			this.obstacles[i].localPosition.y = localPos.y
		}
	},
	setChests : function(chestDatas){
		for(var i=0; i<chestDatas.length; i++){
			this.createChest(chestDatas[i]);
		}
	},
	createChest : function(chestData){
		//find chest location
		for(var i=0; i<map.Chests.length; i++){
			if(map.Chests[i].id === chestData.locationID){
				var chestPosition = {x : map.Chests[i].posX, y : map.Chests[i].posY};
				break;
			}
		}
		if(chestPosition){
			this.chests.push({
				objectID : chestData.objectID,
				grade : chestData.grade,
				position : chestPosition,
				localPosition : util.worldToLocalPosition(chestPosition, this.gameConfig.userOffset),
				size : {width : resources.OBJ_CHEST_SIZE, height : resources.OBJ_CHEST_SIZE}
			});
		}
	},
	// updateProjectile : function(){
	// 	for(var index in this.projectiles){
	// 		this.projectiles[index].move();
	// 	}
	// },
	setUser : function(userData){
		if(!(userData.objectID in this.users)){
			var tempUser = new User(userData, this.gameConfig);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var i=0; i<Object.keys(userDatas).length; i++){
			var tempUser = new User(userDatas[i], this.gameConfig);
			this.users[userDatas[i].objectID] = tempUser;
			this.users[userDatas[i].objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userDatas[i].objectID].changeState(userDatas[i].currentState);
		}
	},
	setUsersSkills : function(skillDatas){
		for(var i=0; i<Object.keys(skillDatas).length; i++){
			if(skillDatas[i].fireTime > 0){
				this.userSkill(skillDatas[i].userID, skillDatas[i]);
			}
		}
	},
	setProjectiles : function(projectileDatas){
		for(var i=0; i<Object.keys(projectileDatas).length; i++){
			this.makeProjectile(projectileDatas[i]);
		}
	},
	setObjs : function(objDatas){
		for(var i=0; i<Object.keys(objDatas).length; i++){
			if(objDatas[i].objectID.substr(0, 3) === this.gameConfig.PREFIX_OBJECT_EXP){
				var localPosition = util.worldToLocalPosition(objDatas[i].position,this.gameConfig.userOffset);
				this.objExps.push({objectID : objDatas[i].objectID, position : localPosition, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === this.gameConfig.PREFIX_OBJECT_SKILL){
				var localPosition = util.worldToLocalPosition(objDatas[i].position,this.gameConfig.userOffset);
				this.objSkills.push({objectID : objDatas[i].objectID, position : localPosition, radius : objDatas[i].radius });
			}
		}
	},
	createOBJs : function(objDatas){
		for(var i=0; i<Object.keys(objDatas).length; i++){
			if(objDatas[i].objectID.substr(0,3) === this.gameConfig.PREFIX_OBJECT_EXP){
				var localPosition = util.worldToLocalPosition(objDatas[i].position,this.gameConfig.userOffset);
				this.objExps.push({objectID : objDatas[i].objectID, position : localPosition, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === this.gameConfig.PREFIX_OBJECT_SKILL){
				var localPosition = util.worldToLocalPosition(objDatas[i].position,this.gameConfig.userOffset);
				this.objSkills.push({objectID : objDatas[i].objectID, position : localPosition, radius : objDatas[i].radius });
			}
		}
	},
	deleteOBJ : function(objID){
		if(objID.substr(0,3) === this.gameConfig.PREFIX_OBJECT_EXP){
			for(var i=0; i<this.objExps.length; i++){
				if(this.objExps[i].objectID === objID){
					this.objExps.splice(i, 1);
					return;
				}
			}
		}else if(objID.substr(0,3) === this.gameConfig.PREFIX_OBJECT_SKILL){
			for(var i=0; i<this.objSkills.length; i++){
				if(this.objSkills[i].objectID === objID){
					this.objSkills.splice(i, 1);
					return;
				}
			}
		}
	},
	kickUser : function(objID){
		if(!(objID in this.users)){
			console.log("user already out");
		}else{
			delete this.users[objID];
		}
	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	//will be merge to updateUser function
	moveUser : function(targetPosition){
		this.user.targetPosition = targetPosition;
		this.user.setCenter();
		this.user.setTargetDirection();
		this.user.setSpeed();

		this.user.changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
	},
	// moveUser : function(userData){
	// 	if(this.checkUserAtUsers(userData)){
	// 		if(this.user.objectID == userData.objectID){
	// 			//offset targetPosition change >> targetPosition == position
	// 			this.users[userData.objectID].changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
	// 		}else{
	// 			this.users[userData.objectID].changeState(userData.currentState);
	// 		}
	// 	}else{
  // 		console.log('can`t find user data');
	// 	}
	// },
	useSkill : function(userID, skillData){
		var skillInstance = this.users[userID].makeSkillInstance(skillData);
		var thisUser = this.users[userID];
		var thisEffects = this.effects;

		switch (skillData.type) {
			case this.gameConfig.SKILL_TYPE_BASIC:
	      // skillInstance = this.users[userID].makeSkillInstance(skillData);
	      skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
					thisEffects.push(skillInstance);
					setTimeout(function(){
						var index = thisEffects.indexOf(skillInstance);
						if(index !== -1){
							thisEffects.splice(index, 1);
						}
					}, skillInstance.effectLastTime);
	      };
				skillInstance.direction = this.users[userID].direction;
	      //on attack can cast skill but on attack cant attack;
	      this.users[userID].changeState(this.gameConfig.OBJECT_STATE_ATTACK);
	      break;
	    case this.gameConfig.SKILL_TYPE_INSTANT:
	      skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
					thisEffects.push(skillInstance);
					setTimeout(function(){
						var index = thisEffects.indexOf(skillInstance);
						if(index !== -1){
							thisEffects.splice(index, 1);
						}
					}, skillInstance.effectLastTime);
	      };
	      this.users[userID].targetDirection = util.calcTargetDirection(skillData.targetPosition, this.users[userID].center);
				skillInstance.direction = this.users[userID].targetDirection;
				this.users[userID].changeState(this.gameConfig.OBJECT_STATE_CAST);
	      break;
	    case this.gameConfig.SKILL_TYPE_PROJECTILE:
	      skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
	      };
				this.users[userID].targetDirection = util.calcTargetDirection(skillData.targetPosition, this.users[userID].center);
				skillInstance.direction = this.users[userID].targetDirection;
				this.users[userID].changeState(this.gameConfig.OBJECT_STATE_CAST);
	      break;
	    case this.gameConfig.SKILL_TYPE_SELF:
	      skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
					thisEffects.push(skillInstance);
					setTimeout(function(){
						var index = thisEffects.indexOf(skillInstance);
						if(index !== -1){
							thisEffects.splice(index, 1);
						}
					}, skillInstance.effectLastTime);
	      };
				this.users[userID].targetDirection = this.users[userID].direction;
				skillInstance.direction = this.users[userID].direction;
	      this.users[userID].changeState(this.gameConfig.OBJECT_STATE_CAST);
	      break;
			case this.gameConfig.SKILL_TYPE_SELF_EXPLOSION:
				skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
					thisEffects.push(skillInstance);
					setTimeout(function(){
						var index = thisEffects.indexOf(skillInstance);
						if(index !== -1){
							thisEffects.splice(index, 1);
						}
					}, skillInstance.effectLastTime);
				};
				this.users[userID].targetDirection = this.users[userID].direction;
				skillInstance.direction = this.users[userID].direction;
				this.users[userID].changeState(this.gameConfig.OBJECT_STATE_CAST);
				break;
			case this.gameConfig.SKILL_TYPE_TELEPORT:
				skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
					thisEffects.push(skillInstance);
					setTimeout(function(){
						var index = thisEffects.indexOf(skillInstance);
						if(index !== -1){
							thisEffects.splice(index, 1);
						}
					}, skillInstance.effectLastTime);
				};
				this.users[userID].targetDirection = util.calcTargetDirection(skillData.targetPosition, this.users[userID].center);
				skillInstance.direction = this.users[userID].targetDirection;
				this.users[userID].changeState(this.gameConfig.OBJECT_STATE_CAST);
				break;
			case this.gameConfig.SKILL_TYPE_PROJECTILE_TICK:
				skillInstance.onFire = function(){
					thisUser.skillEffectPlay = false;
				};
				this.users[userID].targetDirection = util.calcTargetDirection(skillData.targetPosition, this.users[userID].center);
				skillInstance.direction = this.users[userID].targetDirection;
				this.users[userID].changeState(this.gameConfig.OBJECT_STATE_CAST);
				break;
	    default:
				console.log('skill type error!!!');
	      break;
		}
		this.users[userID].setSkill(skillInstance);
	},
	updateSkillPossessions : function(userID, possessSkills){
		this.users[userID].updateSkillPossessions(possessSkills);
	},
	makeProjectile : function(projetileData){
		var projectile = Skill.prototype.makeProjectile(projetileData, this.gameConfig.userOffset);
		this.projectiles.push(projectile);
	},
	explodeProjectile : function(projectileData, effectLastTime){
		var thisEffects = this.effects;
		var projectileEffect = Skill.prototype.makeProjectileEffect(projectileData, this.gameConfig.userOffset);
		//delete if this projectile is exist in projectile array
		for(var i=0; i<Object.keys(this.projectiles).length; i++){
			if(this.projectiles[i].objectID === projectileData.objectID){
				this.projectiles.splice(i, 1);
			}
		}

		thisEffects.push(projectileEffect)
		setTimeout(function(){
			var index = thisEffects.indexOf(projectileEffect);
			if(index !== -1){
				thisEffects.splice(index, 1);
			}
		}, effectLastTime);
	},
	updateUserData : function(userData){
		if(userData.objectID in this.users){
			this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
			this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);

			this.users[userData.objectID].direction = userData.direction;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;

			this.users[userData.objectID].setCenter();
			this.users[userData.objectID].setTargetDirection();
			this.users[userData.objectID].setSpeed();

			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('can`t find user data');
		}
	},
	// updateUserData : function(userData){
	// 	if(this.checkUserAtUsers(userData)){
	// 		this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
	// 		this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
	//
	// 		// this.users[userData.objectID].speed.x = userData.speed.x;
	// 		// this.users[userData.objectID].speed.y = userData.speed.y;
	//
	// 		this.users[userData.objectID].direction = userData.direction;
	// 		this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
	// 		// this.users[userData.objectID].targetDirection = userData.targetDirection;
	//
	// 		this.users[userData.objectID].setCenter();
	// 		this.users[userData.objectID].setTargetDirection();
	// 		this.users[userData.objectID].setSpeed();
	// 	}else{
  // 		console.log('can`t find user data');
	// 	}
	// },
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
		for(var i=0; i<Object.keys(this.obstacles).length; i++){
			this.obstacles[i].localPosition.x -= this.user.speed.x;
			this.obstacles[i].localPosition.y -= this.user.speed.y;
		}
		for(var i=0; i<Object.keys(this.projectiles).length; i++){
			this.projectiles[i].position.x -= this.user.speed.x;
			this.projectiles[i].position.y -= this.user.speed.y;
		}
		for(var i=0; i<this.objExps.length; i++){
			this.objExps[i].position.x -= this.user.speed.x;
			this.objExps[i].position.y -= this.user.speed.y;
		}
		for(var i=0; i<this.objSkills.length; i++){
			this.objSkills[i].position.x -= this.user.speed.x;
			this.objSkills[i].position.y -= this.user.speed.y;
		}
		for(var i=0; i<this.chests.length; i++){
			this.chests[i].localPosition.x -= this.user.speed.x;
			this.chests[i].localPosition.y -= this.user.speed.y;
		}
		if(addPos){
			for(var i=0; i<Object.keys(this.obstacles).length; i++){
				this.obstacles[i].localPosition.x -= addPos.x;
				this.obstacles[i].localPosition.y -= addPos.y;
				// this.obstacles[index].staticEle.x -= addPos.x;
				// this.obstacles[index].staticEle.y -= addPos.y;
			}
			for(var i=0; i<this.chests.length; i++){
				this.chests[i].localPosition.x -= addPos.x;
				this.chests[i].localPosition.y -= addPos.y;
			}
			for(var i=0; i<Object.keys(this.projectiles).length; i++){
				this.projectiles[i].position.x -= addPos.x;
				this.projectiles[i].position.y -= addPos.y;
			}
			for(var i=0; i<this.objExps.length; i++){
				this.objExps[i].position.x -= addPos.x;
				this.objExps[i].position.y -= addPos.y;
			}
			for(var i=0; i<this.objSkills.length; i++){
				this.objSkills[i].position.x -= addPos.x;
				this.objSkills[i].position.y -= addPos.y;
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
		}
		for(var i=0; i<this.chests.length; i++){
			this.chests[i].localPosition.x += revisionX;
			this.chests[i].localPosition.y += revisionY;
		}
		for(var i=0; i<this.objExps.length; i++){
			this.objExps[i].position.x += revisionX;
			this.objExps[i].position.y += revisionY;
		}
		for(var i=0; i<this.objSkills.length; i++){
			this.objSkills[i].position.x += revisionX;
			this.objSkills[i].position.y += revisionY;
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
		}
		for(var i=0; i<this.chests.length; i++){
			this.chests[i].localPosition.x += revisionX;
			this.chests[i].localPosition.y += revisionY;
		}
		for(var i=0; i<this.objExps.length; i++){
			this.objExps[i].position.x += revisionX;
			this.objExps[i].position.y += revisionY;
		}
		for(var i=0; i<this.objSkills.length; i++){
			this.objSkills[i].position.x += revisionX;
			this.objSkills[i].position.y += revisionY;
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
	settingUserData : function(){
		return {
			objectID : this.user.objectID,
			currentState : this.user.currentState === this.gameConfig.OBJECT_STATE_MOVE_OFFSET ? this.gameConfig.OBJECT_STATE_MOVE : this.user.currentState,
			position : util.localToWorldPosition(this.user.position, this.gameConfig.userOffset),
			direction : this.user.direction,
		}
	}
};

function staticIntervalHandler(){
	//user elements update for collision check
	for(var index in this.users){
		this.users[index].setEntityEle();
	}
	//obstacle elements remove at tree and update position
	for(var index in staticEles){
		staticTree.remove(staticEles[index]);
	}
	this.updateObstacleEles();
	var i = this.projectiles.length;
  while(i--){
    if(this.projectiles[i].isExpired()){
      this.projectiles.splice(i, 1);
    }else{
      this.projectiles[i].move(this.gameConfig.userOffset);
    }
  }
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
	var collisionObjs = util.checkCircleCollision(staticTree, user.entityTreeEle.x, user.entityTreeEle.y, user.entityTreeEle.width/2, user.entityTreeEle.id);
  if(collisionObjs.length > 0 ){
    var addPos = util.calcCompelPos(user.entityTreeEle, collisionObjs);
  }
  return addPos;
};
module.exports = CManager;
