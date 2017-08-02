(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
	useSkill : function(userID, skillData){
		var skillInstance = this.users[userID].makeSkillInstance(skillData);
		var thisUser = this.users[userID];
		var thisEffects = this.effects;

		switch (parseInt(skillData.type)) {
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

},{"../public/map.json":8,"../public/quadtree.min.js":9,"../public/resource.json":10,"../public/util.js":11,"./CObstacle.js":2,"./CSkill.js":3,"./CUser.js":4}],2:[function(require,module,exports){
function CObstacle(posX, posY, sizeW, sizeH, id, src){
  this.objectID = id;
  this.src = src;
  this.position = {
    x : posX, y : posY
  };
  // user when draw obstacle
  this.localPosition = {
    x : posX, y : posY
  };
  this.size = {
    width : sizeW, height : sizeH
  };
  this.center = {
    x : this.position.x + this.size.width/2,
    y : this.position.y + this.size.height/2
  }

  this.setSize(sizeW, sizeH);
  this.setPosition(posX, posY);

  this.staticEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};

CObstacle.prototype = {
  setPosition : function(x, y){
    this.position.x = x;
    this.position.y = y;
    this.setCenter();
  },
  setSize : function(w, h){
    this.size.width = w;
    this.size.height = h;
  },
  setCenter : function(){
    if(this.size.width == 0 || this.size.height == 0){
      console.log('setSize before setCenter');
    }
    this.center.x = this.position.x + this.size.width/2;
    this.center.y = this.position.y + this.size.height/2;
  },
};
module.exports = CObstacle;

},{}],3:[function(require,module,exports){
var util = require('../public/util.js');

function CSkill(skillData, userAniStartTime, offset){

  this.startTime = Date.now();
  this.timeSpan = skillData.timeSpan;

  this.index = skillData.index;
  this.type = skillData.type;
  this.name = skillData.name;
  this.totalTime = skillData.totalTime;
  this.fireTime = skillData.fireTime;
  this.range = skillData.range;
  this.explosionRadius = skillData.explosionRadius;

  this.radius = skillData.radius;
  this.maxSpeed = skillData.maxSpeed;
  this.lifeTime = skillData.lifeTime;

  this.direction = skillData.direction;
  this.targetPosition = util.worldToLocalPosition(skillData.targetPosition, offset);

  this.userAniStartTime = userAniStartTime;
  this.effectLastTime = skillData.effectLastTime;

  this.userAniTimeout = false;
  this.fireTimeout = false;
  this.totalTimeout = false;

  this.onUserAniStart = new Function();
  this.onFire = new Function();
  this.onTimeOver = new Function();
};

CSkill.prototype = {
  executeSkill : function(){
    this.userAniTimeout = setTimeout(userAniTimeoutHandler.bind(this), this.userAniStartTime);

    this.fireTimeout = setTimeout(fireTimeoutHandler.bind(this), this.fireTime);
    this.totalTimeout = setTimeout(totalTimeoutHandler.bind(this), this.totalTime);
  },
  destroy : function(){
    if(this.userAniTimeout){
      clearTimeout(this.userAniTimeout);
    }
    if(this.fireTimeout){
      console.log('clearTimeout');
      clearTimeout(this.fireTimeout);
    }
    if(this.totalTimeout){
      clearTimeout(this.totalTimeout);
    }
  },
  skillAniIsExpired : function(){
    return this.aniTime + this.fireTime > Date.now() - this.startTime
  },
  //static function
  makeProjectile : function(projectileData, offset){
    var projectile = new ProjectileSkill(projectileData, offset);
    return projectile;
  },
  makeProjectileEffect : function(projectileData, offset){
    var returnVal = {
      targetPosition : util.worldToLocalPosition(projectileData.position, offset),
      explosionRadius : projectileData.explosionRadius,
      direction : 0
    }
    return returnVal;
  }
};

function userAniTimeoutHandler(){
  this.onUserAniStart();
};
function fireTimeoutHandler(){
  console.log('fireSkill');
  this.onFire();
};
function totalTimeoutHandler(){
  this.onTimeOver();
};

var ProjectileSkill = function(projectileData, offset){
  this.startTime = Date.now();

  this.objectID = projectileData.objectID;
  this.position = util.worldToLocalPosition(projectileData.position, offset);
  this.speed = projectileData.speed;
  this.radius = projectileData.radius;
  this.lifeTime = projectileData.lifeTime;
  this.explosionRadius = projectileData.explosionRadius;

  this.currentOffset = offset;
  // this.direction = skillInstance.direction;
  // this.position = {x : user.position.x, y : user.position.y};
  // this.speed = {
    // x : skillInstance.maxSpeed * Math.cos(skillInstance.direction * Math.PI/180),
    // y : skillInstance.maxSpeed * Math.sin(skillInstance.direction * Math.PI/180)
  // };
};

ProjectileSkill.prototype = {
  move : function(offset){
    this.position.x += this.speed.x;
    this.position.y += this.speed.y;
    if(this.currentOffset !== offset){
      this.revision(offset);
    }
  },
  revision : function(offset){
    var diffX = this.currentOffset.x - offset.x;
    var diffY = this.currentOffset.y - offset.y;
    this.position.x -= diffX;
    this.position.y -= diffY;
    this.currentOffset = offset;
  },
  hit : function(user){
    console.log('hit something');
  },
  isExpired : function(){
    if(this.lifeTime > Date.now() - this.startTime){
      return false;
    }else{
      return true;
    }
  }
};


module.exports = CSkill;

},{"../public/util.js":11}],4:[function(require,module,exports){
var util = require('../public/util.js');
var Skill = require('./CSkill.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

  this.objectID = userData.objectID;

  this.currentState = null;
  this.currentSkill = undefined;

  //use for execute skill only once.
  this.isExecutedSkill = false;
  //Effect around user skill effect, when cast skill. skill onFire set false.
  this.skillEffectPlay = false;

  this.size = userData.size;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.equipSkills = [];
  this.possessSkills = [];

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.updateFunction = null;

  this.onMoveOffset = new Function();

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };

  this.onMove = new Function();
};

User.prototype = {
  changeState : function(newState){

    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case this.gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = null;
        break;
      case this.gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_ATTACK:
        this.updateFunction = this.attack.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_CAST:
        this.updateFunction = this.rotate.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  rotate : function(){
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
  },
  setTargetDirection : function(){
    util.setTargetDirection.call(this);
  },
  setSpeed : function(){
    util.setSpeed.call(this, this.gameConfig.scaleFactor);
  },
  moveOffset : function(){
    util.moveOffset.call(this);
  },
  attack : function(){
    this.executeSkill();
  },
  addPosAndTargetPos : function(addPosX , addPosY){
    this.position.x += addPosX;
    this.position.y += addPosY;

    this.targetPosition.x += addPosX;
    this.targetPosition.y += addPosY;

    this.setCenter();
  },
  stop : function(){
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
    if(this.currentSkill){
      this.currentSkill.destroy();
      this.currentSkill = undefined;
      this.isExecutedSkill = false;
      this.skillEffectPlay = false;
    }
  },
  setEntityEle : function(){
    this.entityTreeEle = {
      x : this.position.x,
      y : this.position.y,
      width : this.size.width,
      height : this.size.height,
      id : this.objectID
    };
  },
  makeSkillInstance : function(skillData){
    var skillInstance = new Skill(skillData, skillData.fireTime - 100, this.gameConfig.userOffset);
    skillInstance.onUserAniStart = onCastSkillHandler.bind(this, skillInstance);
    skillInstance.onTimeOver = onTimeOverHandler.bind(this, skillInstance);
    return skillInstance;
  },
  setSkill : function(skillInstance){
    this.currentSkill = skillInstance;
  },
  executeSkill : function(){
    if(!this.isExecutedSkill){
      this.skillEffectPlay = true;
      this.isExecutedSkill = true;
      this.currentSkill.executeSkill();
    }
  },
  updateSkillPossessions : function(possessSkills){
    this.possessSkills = possessSkills;
    console.log('updateSkillPossessions');
    console.log(this.possessSkills);
  }
};
function onTimeOverHandler(skillInstance){
  skillInstance.destroy();
  this.currentSkill = undefined;
  this.isExecutedSkill = false;
  this.skillEffectPlay = false;
  this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
};
function onCastSkillHandler(skillInstance){
  console.log('cast ani start');
};
// var skillData = {
//   timeSpan : Date.now() - skill.startTime,
//   totalTime : skill.totalTime,
//   fireTime : skill.fireTime,
//   radius : skill.radius,
//   targetPosition : skill.targetPosition
// }
module.exports = User;

},{"../public/util.js":11,"./CSkill.js":3}],5:[function(require,module,exports){

module.exports = {
    toObject        : toObject,
    toArray         : toArray,
    toColumnArray   : toColumnArray,
    toSchemaObject  : toSchemaObject,
    toCSV           : toCSV
}


function toColumnArray(data, opts){

    opts = opts || { };

    var delimiter   = (opts.delimiter || ',');
    var quote       = _getQuote(opts.quote);
    var content     = data;
    var headers     = null;

    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input data should be a string");
    }

    content         = content.split(/[\n\r]+/ig);

    if(typeof(opts.headers) === "string"){
        headers = opts.headers.split(/[\n\r]+/ig);
        headers = quote ?
                _convertArray(headers.shift(), delimiter, quote) :
                headers.shift().split(delimiter);
    }else{
        headers = quote ?
                _convertArray(content.shift(), delimiter, quote) :
                content.shift().split(delimiter);
    }


    var hashData    = { };

    headers.forEach(function(item){
        hashData[item] = [];
    });

    content.forEach(function(item){
        if(item){
            item = quote ?
                  _convertArray(item, delimiter, quote) :
                  item.split(delimiter);
            item.forEach(function(val, index){
                hashData[headers[index]].push(_trimQuote(val));
            });
        }
    });

    return hashData;
}

function toObject(data, opts){

    opts = opts || { };

    var delimiter   = (opts.delimiter || ',');
    var quote       = _getQuote(opts.quote);
    var content     = data;
    var headers     = null;

    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input data should be a string");
    }

    content = content.split(/[\n\r]+/ig);

    if(typeof(opts.headers) === "string"){
        headers = opts.headers.split(/[\n\r]+/ig);
        headers = quote ?
                _convertArray(headers.shift(), delimiter, quote) :
                headers.shift().split(delimiter);
    }else{
        headers = quote ?
                _convertArray(content.shift(), delimiter, quote) :
                content.shift().split(delimiter);
    }

    var hashData = [ ];
    content.forEach(function(item){
        if(item){
          item = quote ?
                _convertArray(item, delimiter, quote) :
                item.split(delimiter);
          var hashItem = { };
          headers.forEach(function(headerItem, index){
              var tempItem = _trimQuote(item[index]);
              if(parseInt(tempItem)){
                hashItem[headerItem] = parseInt(tempItem);
              }else if(parseFloat(tempItem)){
                hashItem[headerItem] = parseFloat(tempItem);
              }
              else{
                hashItem[headerItem] = tempItem;
              }
          });
          hashData.push(hashItem);
        }
    });
    return hashData;
}

function toSchemaObject(data, opts){

    opts = opts || { };

    var delimiter   = (opts.delimiter || ',');
    var quote       = _getQuote(opts.quote);
    var content     = data;
    var headers     = null;
    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input should be a string");
    }

    content         = content.split(/[\n\r]+/ig);


    if(typeof(opts.headers) === "string"){
        headers = opts.headers.split(/[\n\r]+/ig);
        headers = quote ?
                _convertArray(headers.shift(), delimiter, quote) :
                headers.shift().split(delimiter);
    }else{
        headers = quote ?
                _convertArray(content.shift(), delimiter, quote) :
                content.shift().split(delimiter);
    }


    var hashData    = [ ];

    content.forEach(function(item){
        if(item){
          item = quote ?
                _convertArray(item, delimiter, quote) :
                item.split(delimiter);
            var schemaObject = {};
            item.forEach(function(val, index){
                _putDataInSchema(headers[index], val, schemaObject , delimiter, quote);
            });
            hashData.push(schemaObject);
        }
    });

    return hashData;
}

function toArray(data, opts){

    opts = opts || { };

    var delimiter   = (opts.delimiter || ',');
    var quote       = _getQuote(opts.quote);
    var content     = data;

    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input data should be a string");
    }

    content = content.split(/[\n\r]+/ig);
    var arrayData = [ ];
    content.forEach(function(item){
        if(item){
            item = quote ?
                _convertArray(item, delimiter, quote) :
                item.split(delimiter);

            item = item.map(function(cItem){
                return _trimQuote(cItem);
            });
            arrayData.push(item);
        }
    });
    return arrayData;
}

function _getQuote(q){
  if(typeof(q) === "string"){
    return q;
  }else if(q === true){
    return '"';
  }
  return null;
}

function _dataType(arg) {
    if (arg === null) {
        return 'null';
    }
    else if (arg && (arg.nodeType === 1 || arg.nodeType === 9)) {
        return 'element';
    }
    var type = (Object.prototype.toString.call(arg)).match(/\[object (.*?)\]/)[1].toLowerCase();
    if (type === 'number') {
        if (isNaN(arg)) {
            return 'nan';
        }
        if (!isFinite(arg)) {
            return 'infinity';
        }
    }
    return type;
}

function toCSV(data, opts){

    opts                = (opts || { });
    opts.delimiter      = (opts.delimiter || ',');
    opts.wrap           = (opts.wrap || '');
    opts.arrayDenote    = (opts.arrayDenote && String(opts.arrayDenote).trim() ? opts.arrayDenote : '[]');
    opts.objectDenote   = (opts.objectDenote && String(opts.objectDenote).trim() ? opts.objectDenote : '.');
    opts.detailedOutput = (typeof(opts.detailedOutput) !== "boolean" ? true : opts.detailedOutput);
    opts.headers        = String(opts.headers).toLowerCase();
    var csvJSON         = { };
    var csvData         = "";

    if(!opts.headers.match(/none|full|relative|key/)){
      opts.headers = 'full';
    }else{
      opts.headers = opts.headers.match(/none|full|relative|key/)[0];
    }

    if(opts.wrap === true){
        opts.wrap = '"';
    }

    if(typeof(data) === "string"){
        data = JSON.parse(data);
    }

    _toCsv(data, csvJSON, "", 0, opts);

    var headers = _getHeaders(opts.headers, csvJSON, opts);

    if(headers){
      if(opts.wrap){
        headers = headers.map(function(item){
          return opts.wrap + item + opts.wrap;
        });
      }
      csvData = headers.join(opts.delimiter);
    }

    var bigArrayLen = _getBigArrayLength(csvJSON);
    var keys        = Object.keys(csvJSON);
    var row         = [ ];

    var replaceNewLinePattern = /\n|\r/g;
    if(!opts.wrap){
        replaceNewLinePattern = new RegExp('\n|\r|' + opts.delimiter, 'g');
    }


    for(var i = 0; i < bigArrayLen; i++){
        row = [ ];
        for(var j = 0; j < keys.length; j++){
            if(csvJSON[keys[j]][i]){
                csvJSON[keys[j]][i] = csvJSON[keys[j]][i].replace(replaceNewLinePattern, '\t');
                if(opts.wrap){
                    csvJSON[keys[j]][i] = opts.wrap + csvJSON[keys[j]][i] + opts.wrap;
                }
                row[row.length] = csvJSON[keys[j]][i];
            }else{
                row[row.length] = "";
            }
        }
      csvData += '\n' + row.join(opts.delimiter);
    }
    return csvData;
}

function _toCsv(data, table, parent, row, opt){
    if(_dataType(data) === 'undefined'){
        return _putData('', table, parent, row, opt);
    }else if(_dataType(data) === 'null'){
        return _putData('null', table, parent, row, opt);
    }else if(Array.isArray(data)){
        return _arrayToCsv(data, table, parent, row, opt);
    }else if(typeof(data) === "object"){
        return _objectToCsv(data, table, parent, row, opt);
    }else{
        return _putData(String(data), table, parent, row, opt);
    }
}

function _putData(data, table, parent, row, opt){
  if(!table || !table[parent]){
      table[parent] = [ ];
  }
  if(row < table[parent].length){
    row = table[parent].length;
  }
  table[parent][row] = data;
  return table;
}

function _arrayToCsv(data, table, parent, row, opt){
    if(_doesNotContainsObjectAndArray(data)){
      return _putData(data.join(';'), table, parent + opt.arrayDenote, row, opt);
    }
    data.forEach(function(item, index){
        return _toCsv(item, table, parent + opt.arrayDenote, index, opt);
    });
}

function _doesNotContainsObjectAndArray(array){
  return array.every(function(item){
        var datatype = _dataType(item);
        if(!datatype.match(/array|object/)){
          return true;
        }
        return false;
  });
}

function _objectToCsv(data, table, parent, row, opt){
  Object.keys(data).forEach(function(item){
      return _toCsv(data[item], table, parent + opt.objectDenote + item, row, opt);
  });
}

function _getHeaders(headerType, table, opt){
  var keyMatchPattern       = /([^\[\]\.]+)$/;
  var relativeMatchPattern  = /\[\]\.?([^\[\]]+)$/;
  switch(headerType){
    case "none":
      return null;
    case "full":
      return Object.keys(table);
    case "key":
      return Object.keys(table).map(function(header){
        var head = header.match(keyMatchPattern);
        if(head && head.length === 2){
          return head[1];
        }
        return header;
      });
    case "relative":
      return Object.keys(table).map(function(header){
        var head = header.match(relativeMatchPattern);
        if(head && head.length === 2){
          return head[1];
        }
        return header;
      });
  }
}

function _getBigArrayLength(table){
  var len = 0;
  Object.keys(table).forEach(function(item){
      if(Array.isArray(table[item]) && table[item].length > len){
        len = table[item].length;
      }
  });
  return len;
}

function _putDataInSchema(header, item, schema, delimiter, quote){
    var match = header.match(/\[*[\d]\]\.(\w+)|\.|\[\]|\[(.)\]|-|\+/ig);
    var headerName, currentPoint;
    if(match){
        var testMatch = match[0];
        if(match.indexOf('-') !== -1){
            return true;
        }else if(match.indexOf('.') !== -1){
            var headParts = header.split('.');
            currentPoint = headParts.shift();
            schema[currentPoint] = schema[currentPoint] || {};
            _putDataInSchema(headParts.join('.'), item, schema[currentPoint], delimiter, quote);
        }else if(match.indexOf('[]') !== -1){
            headerName = header.replace(/\[\]/ig,'');
            if(!schema[headerName]){
            schema[headerName] = [];
            }
            schema[headerName].push(item);
        }else if(/\[*[\d]\]\.(\w+)/.test(testMatch)){
            headerName = header.split('[').shift();
            var index = parseInt(testMatch.match(/\[(.)\]/).pop(),10);
            currentPoint = header.split('.').pop();
            schema[headerName] = schema[headerName] || [];
            schema[headerName][index] = schema[headerName][index] || {};
            schema[headerName][index][currentPoint] = item;
        }else if(/\[(.)\]/.test(testMatch)){
            var delimiter = testMatch.match(/\[(.)\]/).pop();
            headerName = header.replace(/\[(.)\]/ig,'');
            schema[headerName] = _convertArray(item, delimiter, quote);
        }else if(match.indexOf('+') !== -1){
            headerName = header.replace(/\+/ig,"");
            schema[headerName] = Number(item);
        }
    }else{
        schema[header] = _trimQuote(item);
    }
    return schema ;
}

function _trimQuote(str){
    if(str){
        return String(str).trim().replace(/^["|'](.*)["|']$/, '$1');
    }
    return "";
}

function _convertArray(str, delimiter, quote) {
    if(quote && str.indexOf(quote) !== -1){
      return _csvToArray(str, delimiter, quote);
    }
    var output = [];
    var arr = str.split(delimiter);
    arr.forEach(function(val) {
        var trimmed = val.trim();
        output.push(trimmed);
    });
    return output;
}

function _csvToArray(text, delimit, quote) {

    delimit = delimit || ",";
    quote   = quote || '"';

    var value = new RegExp("(?!\\s*$)\\s*(?:" +  quote + "([^" +  quote + "\\\\]*(?:\\\\[\\S\\s][^" +  quote + "\\\\]*)*)" +  quote + "|([^" +  delimit  +  quote + "\\s\\\\]*(?:\\s+[^" +  delimit  +  quote + "\\s\\\\]+)*))\\s*(?:" +  delimit + "|$)", "g");

    var a = [ ];

    text.replace(value,
        function(m0, m1, m2) {
            if(m1 !== undefined){
                a.push(m1.replace(/\\'/g, "'"));
            }else if(m2 !== undefined){
                a.push(m2);
            }
            return '';
        }
    );

    if (/,\s*$/.test(text)){
        a.push('');
    }
    return a;
}

},{}],6:[function(require,module,exports){
module.exports={
  "userBaseData" : "level,needExp,baseHP,baseMP,baseMaxSpeed,baseRotateSpeed,baseHPRegen,baseMPRegen,baseCastSpeed,baseDamage,baseDamageRate\n1,100,100,1000,10,15,0.5,5,1,0,1\n2,150,100,1000,10,15,0.5,5,1,0,1\n3,250,100,1000,10,15,0.5,5,1,0,1\n4,400,100,1000,10,15,0.5,5,1,0,1\n5,600,100,1000,10,15,0.5,5,1,0,1\n6,850,100,1000,10,15,0.5,5,1,0,1\n7,1150,100,1000,10,15,0.5,5,1,0,1\n8,1500,100,1000,10,15,0.5,5,1,0,1\n9,1900,100,1000,10,15,0.5,5,1,0,1\n10,2350,100,1000,10,15,0.5,5,1,0,1\n11,2850,100,1000,10,15,0.5,5,1,0,1\n12,3400,100,1000,10,15,0.5,5,1,0,1\n13,4000,100,1000,10,15,0.5,5,1,0,1\n14,4650,100,1000,10,15,0.5,5,1,0,1\n15,5350,100,1000,10,15,0.5,5,1,0,1\n16,6100,100,1000,10,15,0.5,5,1,0,1\n17,6900,100,1000,10,15,0.5,5,1,0,1\n18,7750,100,1000,10,15,0.5,5,1,0,1\n19,8650,100,1000,10,15,0.5,5,1,0,1\n20,-1,100,1000,10,15,0.5,5,1,0,1\n",
  "skillData" : "index,name,level,type,groupIndex,nextSkillIndex,totalTime,fireTime,coolDown,range,explosionRadius,consumeMP,damage,buffToSelf1,buffToSelf2,buffToSelf3,buffToTarget1,buffToTarget2,buffToTarget3,debuffToSelf1,debuffToSelf2,debuffToSelf3,debuffToTarget1,debuffToTarget2,debuffToTarget3,radius,maxSpeed,lifeTime,effectLastTime\n11,RedSkillBase1,1,1,10,12,1000,600,,30,50,0,30,,,,,,,,,,,,,0,0,0,10\n12,RedSkillBase2,2,1,10,13,1000,600,,30,50,0,35,,,,,,,,,,,,,0,0,0,100\n13,RedSkillBase3,3,1,10,14,1000,600,,30,50,0,40,,,,,,,,,,,,,0,0,0,100\n14,RedSkillBase4,4,1,10,15,1000,600,,30,50,0,45,,,,,,,,,,,,,0,0,0,100\n15,RedSkillBase5,5,1,10,-1,1000,600,,30,50,0,50,,,,,,,,,,,,,0,0,0,100\n21,RedSkillProjectileWeak1,1,2,20,22,1500,900,,0,100,100,30,,,,,,,,,,,,,30,10,3000,100\n22,RedSkillProjectileWeak2,2,2,20,23,1500,900,,0,100,100,35,,,,,,,,,,,,,30,10,3000,100\n23,RedSkillProjectileWeak3,3,2,20,24,1500,900,,0,100,100,40,,,,,,,,,,,,,30,10,3000,100\n24,RedSkillProjectileWeak4,4,2,20,25,1500,900,,0,100,100,45,,,,,,,,,,,,,30,10,3000,100\n25,RedSkillProjectileWeak5,5,2,20,-1,1500,900,,0,100,100,50,,,,,,,,,,,,,30,10,3000,100\n31,RedSkillProjectileStrong1,1,2,30,32,2000,1200,,0,150,200,30,,,,,,,,,,,,,30,10,3000,100\n32,RedSkillProjectileStrong2,2,2,30,33,2000,1200,,0,150,200,35,,,,,,,,,,,,,30,10,3000,100\n33,RedSkillProjectileStrong3,3,2,30,34,2000,1200,,0,150,200,40,,,,,,,,,,,,,30,10,3000,100\n34,RedSkillProjectileStrong4,4,2,30,35,2000,1200,,0,150,200,45,,,,,,,,,,,,,30,10,3000,100\n35,RedSkillProjectileStrong5,5,2,30,-1,2000,1200,,0,150,200,50,,,,,,,,,,,,,30,10,3000,100\n41,RedSkillRange1,1,1,40,42,2000,1200,,400,150,300,30,,,,,,,,,,,,,,,,100\n42,RedSkillRange2,2,1,40,43,2000,1200,,400,150,300,35,,,,,,,,,,,,,,,,100\n43,RedSkillRange3,3,1,40,44,2000,1200,,400,150,300,40,,,,,,,,,,,,,,,,100\n44,RedSkillRange4,4,1,40,45,2000,1200,,400,150,300,45,,,,,,,,,,,,,,,,100\n45,RedSkillRange5,5,1,40,-1,2000,1200,,400,150,300,50,,,,,,,,,,,,,,,,100\n51,RedSkillSelfRange1,1,3,50,52,1500,900,,0,250,500,30,,,,,,,,,,,,,,,,100\n52,RedSkillSelfRange2,2,3,50,53,1500,900,,0,250,500,35,,,,,,,,,,,,,,,,100\n53,RedSkillSelfRange3,3,3,50,54,1500,900,,0,250,500,40,,,,,,,,,,,,,,,,100\n54,RedSkillSelfRange4,4,3,50,55,1500,900,,0,250,500,45,,,,,,,,,,,,,,,,100\n55,RedSkillSelfRange5,5,3,50,-1,1500,900,,0,250,500,50,,,,,,,,,,,,,,,,100\n111,BlueSkillBase1,1,0,110,112,1000,600,,30,50,0,30,,,,,,,,,,,,,0,0,0,100\n112,BlueSkillBase2,2,0,110,113,1000,600,,30,50,0,35,,,,,,,,,,,,,0,0,0,100\n113,BlueSkillBase3,3,0,110,114,1000,600,,30,50,0,40,,,,,,,,,,,,,0,0,0,100\n114,BlueSkillBase4,4,0,110,115,1000,600,,30,50,0,45,,,,,,,,,,,,,0,0,0,100\n115,BlueSkillBase5,5,0,110,-1,1000,600,,30,50,0,50,,,,,,,,,,,,,0,0,0,100\n121,BlueSkillProjectileWeak1,1,2,120,122,1500,900,,0,100,100,30,,,,,,,,,,,,,30,10,3000,100\n122,BlueSkillProjectileWeak2,2,2,120,123,1500,900,,0,100,100,35,,,,,,,,,,,,,30,10,3000,100\n123,BlueSkillProjectileWeak3,3,2,120,124,1500,900,,0,100,100,40,,,,,,,,,,,,,30,10,3000,100\n124,BlueSkillProjectileWeak4,4,2,120,125,1500,900,,0,100,100,45,,,,,,,,,,,,,30,10,3000,100\n125,BlueSkillProjectileWeak5,5,2,120,-1,1500,900,,0,100,100,50,,,,,,,,,,,,,30,10,3000,100\n131,BlueSkillProjectileStrong1,1,2,130,132,2000,1200,,0,150,200,30,,,,,,,,,,,frozen1,,30,10,3000,100\n132,BlueSkillProjectileStrong2,2,2,130,133,2000,1200,,0,150,200,35,,,,,,,,,,,frozen2,,30,10,3000,100\n133,BlueSkillProjectileStrong3,3,2,130,134,2000,1200,,0,150,200,40,,,,,,,,,,,frozen3,,30,10,3000,100\n134,BlueSkillProjectileStrong4,4,2,130,135,2000,1200,,0,150,200,45,,,,,,,,,,,frozen4,,30,10,3000,100\n135,BlueSkillProjectileStrong5,5,2,130,-1,2000,1200,,0,150,200,50,,,,,,,,,,,frozen5,,30,10,3000,100\n141,BlueSkillRange1,1,1,140,142,2000,1200,,400,150,300,30,,,,,,,,,,,,,,,,100\n142,BlueSkillRange2,2,1,140,143,2000,1200,,400,150,300,35,,,,,,,,,,,,,,,,100\n143,BlueSkillRange3,3,1,140,144,2000,1200,,400,150,300,40,,,,,,,,,,,,,,,,100\n144,BlueSkillRange4,4,1,140,145,2000,1200,,400,150,300,45,,,,,,,,,,,,,,,,100\n145,BlueSkillRange5,5,1,140,-1,2000,1200,,400,150,300,50,,,,,,,,,,,,,,,,100\n151,BlueSkillRangeTick1,1,3,150,152,1500,900,,0,250,500,30,,,,,,,,,,,,,,,,100\n152,BlueSkillRangeTick2,2,3,150,153,1500,900,,0,250,500,35,,,,,,,,,,,,,,,,100\n153,BlueSkillRangeTick3,3,3,150,154,1500,900,,0,250,500,40,,,,,,,,,,,,,,,,100\n154,BlueSkillRangeTick4,4,3,150,155,1500,900,,0,250,500,45,,,,,,,,,,,,,,,,100\n155,BlueSkillRangeTick5,5,3,150,-1,1500,900,,0,250,500,50,,,,,,,,,,,,,,,,100\n211,YellowSkillBase1,1,0,210,212,1000,600,,30,50,0,30,,,,,,,,,,,,,0,0,0,100\n212,YellowSkillBase2,2,0,210,213,1000,600,,30,50,0,35,,,,,,,,,,,,,0,0,0,100\n213,YellowSkillBase3,3,0,210,214,1000,600,,30,50,0,40,,,,,,,,,,,,,0,0,0,100\n214,YellowSkillBase4,4,0,210,215,1000,600,,30,50,0,45,,,,,,,,,,,,,0,0,0,100\n215,YellowSkillBase5,5,0,210,-1,1000,600,,30,50,0,50,,,,,,,,,,,,,0,0,0,100\n221,YellowSkillProjectileWeak1,1,2,220,222,1500,900,,0,100,100,30,,,,,,,,,,,,,30,10,3000,100\n222,YellowSkillProjectileWeak2,2,2,220,223,1500,900,,0,100,100,35,,,,,,,,,,,,,30,10,3000,100\n223,YellowSkillProjectileWeak3,3,2,220,224,1500,900,,0,100,100,40,,,,,,,,,,,,,30,10,3000,100\n224,YellowSkillProjectileWeak4,4,2,220,225,1500,900,,0,100,100,45,,,,,,,,,,,,,30,10,3000,100\n225,YellowSkillProjectileWeak5,5,2,220,-1,1500,900,,0,100,100,50,,,,,,,,,,,,,30,10,3000,100\n231,YellowSkillProjectileStrong1,1,2,230,232,2000,1200,,0,150,200,30,,,,,,,,,,,,,30,10,3000,100\n232,YellowSkillProjectileStrong2,2,2,230,233,2000,1200,,0,150,200,35,,,,,,,,,,,,,30,10,3000,100\n233,YellowSkillProjectileStrong3,3,2,230,234,2000,1200,,0,150,200,40,,,,,,,,,,,,,30,10,3000,100\n234,YellowSkillProjectileStrong4,4,2,230,235,2000,1200,,0,150,200,45,,,,,,,,,,,,,30,10,3000,100\n235,YellowSkillProjectileStrong5,5,2,230,-1,2000,1200,,0,150,200,50,,,,,,,,,,,,,30,10,3000,100\n241,YellowSkillRange1,1,1,240,242,2000,1200,,400,150,300,30,,,,,,,,,,,,,,,,100\n242,YellowSkillRange2,2,1,240,243,2000,1200,,400,150,300,35,,,,,,,,,,,,,,,,100\n243,YellowSkillRange3,3,1,240,244,2000,1200,,400,150,300,40,,,,,,,,,,,,,,,,100\n244,YellowSkillRange4,4,1,240,245,2000,1200,,400,150,300,45,,,,,,,,,,,,,,,,100\n245,YellowSkillRange5,5,1,240,-1,2000,1200,,400,150,300,50,,,,,,,,,,,,,,,,100\n251,YellowSkillProjectileVStrong1,1,3,250,252,1500,900,,0,250,500,30,,,,,,,,,,,,,,,,100\n252,YellowSkillProjectileVStrong2,2,3,250,253,1500,900,,0,250,500,35,,,,,,,,,,,,,,,,100\n253,YellowSkillProjectileVStrong3,3,3,250,254,1500,900,,0,250,500,40,,,,,,,,,,,,,,,,100\n254,YellowSkillProjectileVStrong4,4,3,250,255,1500,900,,0,250,500,45,,,,,,,,,,,,,,,,100\n255,YellowSkillProjectileVStrong5,5,3,250,-1,1500,900,,0,250,500,50,,,,,,,,,,,,,,,,100\n301,BPurpleSkillTeleportShort1,1,SKILL_TYPE_TELEPORT,300,302,1000,600,,150,0,150,0,,,,,,,,,,,,,,,,100\n302,BPurpleSkillTeleportShort2,2,SKILL_TYPE_TELEPORT,300,303,1000,600,,150,0,150,0,,,,,,,,,,,,,,,,100\n303,BPurpleSkillTeleportShort3,3,SKILL_TYPE_TELEPORT,300,304,1000,600,,150,0,150,0,,,,,,,,,,,,,,,,100\n304,BPurpleSkillTeleportShort4,4,SKILL_TYPE_TELEPORT,300,305,1000,600,,150,0,150,0,,,,,,,,,,,,,,,,100\n305,BPurpleSkillTeleportShort5,5,SKILL_TYPE_TELEPORT,300,-1,1000,600,,150,0,150,0,,,,,,,,,,,,,,,,100\n311,BPurpleSkillTeleportLong1,1,SKILL_TYPE_TELEPORT,310,312,2000,1200,,400,0,250,0,,,,,,,,,,,,,,,,100\n312,BPurpleSkillTeleportLong2,2,SKILL_TYPE_TELEPORT,310,313,2000,1200,,400,0,250,0,,,,,,,,,,,,,,,,100\n313,BPurpleSkillTeleportLong3,3,SKILL_TYPE_TELEPORT,310,314,2000,1200,,400,0,250,0,,,,,,,,,,,,,,,,100\n314,BPurpleSkillTeleportLong4,4,SKILL_TYPE_TELEPORT,310,315,2000,1200,,400,0,250,0,,,,,,,,,,,,,,,,100\n315,BPurpleSkillTeleportLong5,5,SKILL_TYPE_TELEPORT,310,-1,2000,1200,,400,0,250,0,,,,,,,,,,,,,,,,100\n",
  "buffData" : "index,name,isPermanent,timeDuration,buffType,buffTickTime,buffAmount,buffApplyRate\n1,damageUP1,0,60000,BUFF_TICK_DAMAGE,,20,1\n2,damageUP2,0,60000,baseDamage,,30,1\n3,damageUP3,1,0,baseDamageRate,,0.1,1\n4,Heal1,0,60000,currentHP,,10,1\n5,Heal2,0,60000,currentHP,,20,1\n6,Heal3,0,60000,currentHP,,-30,0.2\n",
  "chestData" : "index,grade,HP,minExpCount,maxExpCount,minExpAmount,maxExpAmount,minSkillCount,maxSkillCount,SkillIndex1,SkillDropRate1,SkillIndex2,SkillDropRate2,SkillIndex3,SkillDropRate3,SkillIndex4,SkillDropRate4,SkillIndex5,SkillDropRate5,SkillIndex6,SkillDropRate6,SkillIndex7,SkillDropRate7,SkillIndex7,SkillDropRate7,SkillIndex8,SkillDropRate8,SkillIndex9,SkillDropRate9,SkillIndex10,SkillDropRate10,SkillIndex11,SkillDropRate11,SkillIndex12,SkillDropRate12,SkillIndex13,SkillDropRate13,SkillIndex14,SkillDropRate14,SkillIndex15,SkillDropRate15,SkillIndex16,SkillDropRate16,SkillIndex17,SkillDropRate17,SkillIndex18,SkillDropRate18,SkillIndex19,SkillDropRate19,SkillIndex20,SkillDropRate20\n1,1,100,3,5,30,50,1,1,11,35,21,25,31,20,41,15,51,5,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n2,2,200,4,6,50,75,1,2,111,35,121,25,131,20,141,15,151,5,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n3,3,300,5,7,75,100,1,3,211,35,221,25,231,20,241,15,251,5,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n"
}

},{}],7:[function(require,module,exports){
module.exports={
  "INTERVAL" : 20,

  "CANVAS_MAX_SIZE" : {"width" : 5600 , "height" : 3360},
  "CANVAS_MAX_LOCAL_SIZE" : {"width" : 1600, "height" : 1000},

  "OBJECT_STATE_IDLE" : 1,
  "OBJECT_STATE_MOVE" : 2,
  "OBJECT_STATE_ATTACK" : 3,
  "OBJECT_STATE_CAST" : 4,

  "FPS" : 60,
  "PLUS_SIZE_WIDTH" : 500,
  "PLUS_SIZE_HEIGHT" : 500,

  "OBJECT_STATE_MOVE_OFFSET" : 99,

  "GAME_STATE_LOAD" : 1,
  "GAME_STATE_START_SCENE" : 2,
  "GAME_STATE_GAME_START" : 3,
  "GAME_STATE_GAME_ON" : 4,
  "GAME_STATE_GAME_END" : 5,

  "PREFIX_USER" : "USR",
  "PREFIX_SKILL" : "SKL",
  "PREFIX_SKILL_PROJECTILE" : "SKP",
  "PREFIX_CHEST" : "CHT",
  "PREFIX_OBSTACLE_TREE" : "OTT",
  "PREFIX_OBSTACLE_ROCK" : "OTR",
  "PREFIX_OBJECT_EXP" : "OXP",
  "PREFIX_OBJECT_SKILL" : "OSK",

  "USER_CONDITION_IMMORTAL" : 1,
  "USER_CONDITION_FREEZE" : 2,
  "USER_CONDITION_FROZEN" : 3,
  "USER_CONDITION_STUN" : 4,
  "USER_CONDITION_SILENCE" : 5,
  "USER_CONDITION_ANTIMAGIC" : 6,

  "SKILL_TYPE_BASIC" : 1,
  "SKILL_TYPE_INSTANT" : 2,
  "SKILL_TYPE_PROJECTILE" : 3,
  "SKILL_TYPE_SELF" : 4,
  "SKILL_TYPE_SELF_EXPLOSION" : 5,
  "SKILL_TYPE_TELEPORT" : 6,
  "SKILL_TYPE_PROJECTILE_TICK" : 7,

  "OBJ_SKILL_RADIUS" : 30
}

},{}],8:[function(require,module,exports){
module.exports={
  "Trees" : [
    {"id" : "OT1", "posX" : 200, "posY" : 200},
    {"id" : "OT2", "posX" : 500, "posY" : 500}
  ],
  "Chests" : [
    {"id" : "CH1", "gradeMin" : 2, "gradeMax" : 3, "posX" : 350, "posY" : 50},
    {"id" : "CH2", "gradeMin" : 1, "gradeMax" : 2, "posX" : 50, "posY" : 350}
  ]
}

},{}],9:[function(require,module,exports){
!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&module.exports?module.exports=t():e.Quadtree=t()}(this,function(){return function(){function e(t){var n,i;if(this.x=t.x,this.y=t.y,this.width=t.width,this.height=t.height,this.maxElements=t.maxElements,null==this.width||null==this.height)throw new Error("Missing quadtree dimensions.");if(null==this.x&&(this.x=0),null==this.y&&(this.y=0),null==this.maxElements&&(this.maxElements=1),this.contents=[],this.oversized=[],this.size=0,this.width<1||this.height<1)throw new Error("Dimensions must be positive integers.");if(!Number.isInteger(this.x)||!Number.isInteger(this.y))throw new Error("Coordinates must be integers");if(this.maxElements<1)throw new Error("The maximum number of elements before a split must be a positive integer.");i=this,this.children={NW:{create:function(){return new e({x:i.x,y:i.y,width:Math.max(Math.floor(i.width/2),1),height:Math.max(Math.floor(i.height/2),1),maxElements:i.maxElements})},tree:null},NE:{create:function(){return new e({x:i.x+Math.max(Math.floor(i.width/2),1),y:i.y,width:Math.ceil(i.width/2),height:Math.max(Math.floor(i.height/2),1),maxElements:i.maxElements})},tree:null},SW:{create:function(){return new e({x:i.x,y:i.y+Math.max(Math.floor(i.height/2),1),width:Math.max(Math.floor(i.width/2),1),height:Math.ceil(i.height/2),maxElements:i.maxElements})},tree:null},SE:{create:function(){return new e({x:i.x+Math.max(Math.floor(i.width/2),1),y:i.y+Math.max(Math.floor(i.height/2),1),width:Math.ceil(i.width/2),height:Math.ceil(i.height/2),maxElements:i.maxElements})},tree:null}};for(n in this.children)this.children[n].get=function(){return null!=this.tree?this.tree:(this.tree=this.create(),this.tree)}}var t,n,i,r,h,l,o,s;return r=function(e){var t,n;return{x:Math.floor((null!=(t=e.width)?t:1)/2)+e.x,y:Math.floor((null!=(n=e.height)?n:1)/2)+e.y}},t=function(e,t){var n,i,r,h;return!(e.x>=t.x+(null!=(n=t.width)?n:1)||e.x+(null!=(i=e.width)?i:1)<=t.x||e.y>=t.y+(null!=(r=t.height)?r:1)||e.y+(null!=(h=e.height)?h:1)<=t.y)},n=function(e,t){var n;return n=r(t),e.x<n.x?e.y<n.y?"NW":"SW":e.y<n.y?"NE":"SE"},s=function(e){if("object"!=typeof e)throw new Error("Element must be an Object.");if(null==e.x||null==e.y)throw new Error("Coordinates properties are missing.");if((null!=e?e.width:void 0)<0||(null!=e?e.height:void 0)<0)throw new Error("Width and height must be positive integers.")},l=function(e){var t,n,i,r;return n=Math.max(Math.floor(e.width/2),1),i=Math.ceil(e.width/2),r=Math.max(Math.floor(e.height/2),1),t=Math.ceil(e.height/2),{NW:{x:e.x,y:e.y,width:n,height:r},NE:{x:e.x+n,y:e.y,width:i,height:r},SW:{x:e.x,y:e.y+r,width:n,height:t},SE:{x:e.x+n,y:e.y+r,width:i,height:t}}},i=function(e,n){var i,r,h,o;o=[],h=l(n);for(r in h)i=h[r],t(e,i)&&o.push(r);return o},h=function(e,t){var n;return n=function(n){return e["_"+n]=e[n],Object.defineProperty(e,n,{set:function(e){return t.remove(this,!0),this["_"+n]=e,t.push(this)},get:function(){return this["_"+n]},configurable:!0})},n("x"),n("y"),n("width"),n("height")},o=function(e){var t;return t=function(t){if(null!=e["_"+t])return delete e[t],e[t]=e["_"+t],delete e["_"+t]},t("x"),t("y"),t("width"),t("height")},e.prototype.push=function(e,t){return this.pushAll([e],t)},e.prototype.pushAll=function(e,t){var n,r,l,o,u,f,c,d,a,g,p,m,x,y,v,w,E,M,z,b;for(p=0,y=e.length;p<y;p++)g=e[p],s(g),t&&h(g,this);for(c=[{tree:this,elements:e}];c.length>0;){for(E=c.shift(),b=E.tree,f=E.elements,d={NW:null,NE:null,SW:null,SE:null},m=0,v=f.length;m<v;m++)if(u=f[m],b.size++,a=i(u,b),1!==a.length||1===b.width||1===b.height)b.oversized.push(u);else if(b.size-b.oversized.length<=b.maxElements)b.contents.push(u);else{for(o=a[0],z=b.children[o],null==d[o]&&(d[o]={tree:z.get(),elements:[]}),d[o].elements.push(u),M=b.contents,x=0,w=M.length;x<w;x++)r=M[x],l=i(r,b)[0],null==d[l]&&(d[l]={tree:b.children[l].get(),elements:[]}),d[l].elements.push(r);b.contents=[]}for(o in d)null!=(n=d[o])&&c.push(n)}return this},e.prototype.remove=function(e,t){var i,r;return s(e),(i=this.oversized.indexOf(e))>-1?(this.oversized.splice(i,1),this.size--,t||o(e),!0):(i=this.contents.indexOf(e))>-1?(this.contents.splice(i,1),this.size--,t||o(e),!0):(r=this.children[n(e,this)],!(null==r.tree||!r.tree.remove(e,t))&&(this.size--,0===r.tree.size&&(r.tree=null),!0))},e.prototype.colliding=function(e,n){var r,h,l,o,u,f,c,d,a,g,p,m,x,y;for(null==n&&(n=t),s(e),u=[],l=[this];l.length>0;){for(y=l.shift(),m=y.oversized,f=0,a=m.length;f<a;f++)(h=m[f])!==e&&n(e,h)&&u.push(h);for(x=y.contents,c=0,g=x.length;c<g;c++)(h=x[c])!==e&&n(e,h)&&u.push(h);for(o=i(e,y),0===o.length&&(o=[],e.x>=y.x+y.width&&o.push("NE"),e.y>=y.y+y.height&&o.push("SW"),o.length>0&&(1===o.length?o.push("SE"):o=["SE"])),d=0,p=o.length;d<p;d++)r=o[d],null!=y.children[r].tree&&l.push(y.children[r].tree)}return u},e.prototype.onCollision=function(e,n,r){var h,l,o,u,f,c,d,a,g,p,m,x,y;for(null==r&&(r=t),s(e),o=[this];o.length>0;){for(y=o.shift(),m=y.oversized,f=0,a=m.length;f<a;f++)(l=m[f])!==e&&r(e,l)&&n(l);for(x=y.contents,c=0,g=x.length;c<g;c++)(l=x[c])!==e&&r(e,l)&&n(l);for(u=i(e,y),0===u.length&&(u=[],e.x>=y.x+y.width&&u.push("NE"),e.y>=y.y+y.height&&u.push("SW"),u.length>0&&(1===u.length?u.push("SE"):u=["SE"])),d=0,p=u.length;d<p;d++)h=u[d],null!=y.children[h].tree&&o.push(y.children[h].tree)}return null},e.prototype.get=function(e){return this.where(e)},e.prototype.where=function(e){var t,i,r,h,l,o,u,f,c,d,a,g,p;if("object"==typeof e&&(null==e.x||null==e.y))return this.find(function(t){var n,i;n=!0;for(i in e)e[i]!==t[i]&&(n=!1);return n});for(s(e),h=[],r=[this];r.length>0;){for(p=r.shift(),d=p.oversized,l=0,f=d.length;l<f;l++){i=d[l],t=!0;for(u in e)e[u]!==i[u]&&(t=!1);t&&h.push(i)}for(a=p.contents,o=0,c=a.length;o<c;o++){i=a[o],t=!0;for(u in e)e[u]!==i[u]&&(t=!1);t&&h.push(i)}g=p.children[n(e,p)],null!=g.tree&&r.push(g.tree)}return h},e.prototype.each=function(e){var t,n,i,r,h,l,o,s,u,f;for(n=[this];n.length>0;){for(f=n.shift(),s=f.oversized,r=0,l=s.length;r<l;r++)i=s[r],"function"==typeof e&&e(i);for(u=f.contents,h=0,o=u.length;h<o;h++)i=u[h],"function"==typeof e&&e(i);for(t in f.children)null!=f.children[t].tree&&n.push(f.children[t].tree)}return this},e.prototype.find=function(e){var t,n,i,r,h,l,o,s,u,f,c;for(n=[this],r=[];n.length>0;){for(c=n.shift(),u=c.oversized,h=0,o=u.length;h<o;h++)i=u[h],("function"==typeof e?e(i):void 0)&&r.push(i);for(f=c.contents,l=0,s=f.length;l<s;l++)i=f[l],("function"==typeof e?e(i):void 0)&&r.push(i);for(t in c.children)null!=c.children[t].tree&&n.push(c.children[t].tree)}return r},e.prototype.filter=function(t){var n;return(n=function(i){var r,h,l,o,s,u,f,c,d,a,g;h=new e({x:i.x,y:i.y,width:i.width,height:i.height,maxElements:i.maxElements}),h.size=0;for(r in i.children)null!=i.children[r].tree&&(h.children[r].tree=n(i.children[r].tree),h.size+=null!=(c=null!=(d=h.children[r].tree)?d.size:void 0)?c:0);for(a=i.oversized,o=0,u=a.length;o<u;o++)l=a[o],(null==t||("function"==typeof t?t(l):void 0))&&h.oversized.push(l);for(g=i.contents,s=0,f=g.length;s<f;s++)l=g[s],(null==t||("function"==typeof t?t(l):void 0))&&h.contents.push(l);return h.size+=h.oversized.length+h.contents.length,0===h.size?null:h})(this)},e.prototype.reject=function(e){return this.filter(function(t){return!("function"==typeof e?e(t):void 0)})},e.prototype.visit=function(e){var t,n,i;for(n=[this];n.length>0;){i=n.shift(),e.bind(i)();for(t in i.children)null!=i.children[t].tree&&n.push(i.children[t].tree)}return this},e.prototype.pretty=function(){var e,t,n,i,r,h,l;for(h="",n=function(e){var t,n,i;for(i="",t=n=e;n<=0?t<0:t>0;n<=0?++t:--t)i+="   ";return i},t=[{label:"ROOT",tree:this,level:0}];t.length>0;){l=t.shift(),i=n(l.level),h+=i+"| "+l.label+"\n"+i+"| ------------\n",l.tree.oversized.length>0&&(h+=i+"| * Oversized elements *\n"+i+"|   "+l.tree.oversized+"\n"),l.tree.contents.length>0&&(h+=i+"| * Leaf content *\n"+i+"|   "+l.tree.contents+"\n"),r=!1;for(e in l.tree.children)null!=l.tree.children[e].tree&&(r=!0,t.unshift({label:e,tree:l.tree.children[e].tree,level:l.level+1}));r&&(h+=i+"└──┐\n")}return h},e}()});


},{}],10:[function(require,module,exports){
module.exports={
  "USER_BODY_SRC" : "../images/CharBase.svg",
  "USER_BODY_SIZE" : 64,
  "USER_HAND_SRC" : "../images/CharHand.svg",
  "USER_HAND_SIZE" : 64,
  "GRID_SRC" : "../images/map-grass.png",
  "GRID_SIZE" : 60,
  "GRID_IMG_SIZE" : 58,

  "OBJ_TREE_SRC" : "",
  "OBJ_TREE_SIZE" : 100,

  "OBJ_CHEST_SRC" : "",
  "OBJ_CHEST_SIZE" : 50
}

},{}],11:[function(require,module,exports){
var gameConfig = require('./gameConfig.json');

//must use with bind or call method
exports.rotate = function(){
  if(this.targetDirection === this.direction){
    if(this.currentState === gameConfig.OBJECT_STATE_MOVE){
      this.move();
    }else if(this.currentState === gameConfig.OBJECT_STATE_MOVE_OFFSET){
        //only use at client
        this.moveOffset();
    }else if(this.currentState === gameConfig.OBJECT_STATE_ATTACK){
    }else if(this.currentState === gameConfig.OBJECT_STATE_CAST){
      this.executeSkill();
    }
  }
  //check rotate direction
  else if(this.direction > 0 && this.targetDirection < 0){
    if((180 - this.direction + 180 + this.targetDirection) < (this.direction - this.targetDirection)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }else if(this.targetDirection < this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }
  }else if(this.direction < 0 && this.targetDirection >0 ){
    if((180 + this.direction + 180 - this.targetDirection) < (this.targetDirection - this.direction)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }else if(this.targetDirection > this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }
  }else if(this.targetDirection > this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction += Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction += this.rotateSpeed;
    }
  }else if(this.targetDirection < this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction -= Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction -= this.rotateSpeed;
    }
  }

  if(this.direction >= 180){
    this.direction -= 360;
  }else if(this.direction <= -180){
    this.direction += 360;
  }
};

//must use with bind or call method
exports.move = function(){
  //calculate dist with target
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }

  // this.setEntityEle();
  // check collision with obstacle
  // calculate compel add pos
  // add compel pos to postion
  // console.log(this.position);
  var addPos = this.onMove(this);
  if(addPos !== undefined){
    this.position.x += addPos.x;
    this.position.y += addPos.y;
  }
  this.position.x += this.speed.x;
  this.position.y += this.speed.y;

  this.setCenter();
};
exports.moveOffset = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }
  // this.setEntityEle();
  var addPos = this.onMove(this);
  if(addPos !== undefined){
    this.targetPosition.x -= addPos.x;
    this.targetPosition.y -= addPos.y;

    this.gameConfig.userOffset.x += addPos.x;
    this.gameConfig.userOffset.y += addPos.y;
  }
  this.targetPosition.x -= this.speed.x;
  this.targetPosition.y -= this.speed.y;

  this.gameConfig.userOffset.x += this.speed.x;
  this.gameConfig.userOffset.y += this.speed.y;

  this.onMoveOffset(addPos);
}

//must use with bind or call method
//setup when click canvas for move
exports.setSpeed = function(scaleFactor){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0  && distY ==0){
    this.speed.x = 0;
    this.speed.y = 0;
  }else if(Math.pow(distX,2) + Math.pow(distY,2) < 100){
    this.speed.x = distX;
    this.speed.y = distY;
  }else{
    this.speed.x = (distX>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distX,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
    this.speed.y = (distY>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distY,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
  }
};

//must use with bind or call method
// setup when click canvas for move or fire skill
exports.setTargetDirection = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  if(distX < 0 && distY >= 0){
    this.targetDirection = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    this.targetDirection = tangentDegree - 180;
  }else{
    this.targetDirection = tangentDegree;
  }
};
//check obstacle collision
exports.checkCircleCollision = function(tree, posX, posY, radius, id){
  var returnVal = [];
  var obj = {x : posX, y: posY, width:radius * 2, height: radius * 2, id: id};
  tree.onCollision(obj, function(item){
    if(obj.id !== item.id){
      var objCenterX = obj.x + obj.width/2;
      var objCenterY = obj.y + obj.height/2;

      var itemCenterX = item.x + item.width/2;
      var itemCenterY = item.y + item.height/2;

      // check sum of radius with item`s distance
      var distSquareDiff = Math.pow(obj.width/2 + item.width/2,2) - Math.pow(itemCenterX - objCenterX,2) - Math.pow(itemCenterY - objCenterY,2);

      if(distSquareDiff > 0 ){
        //collision occured
        returnVal.push(item);
      }
    }
  });
  return returnVal;
};
exports.calcCompelPos = function(obj, collisionObjs){
  var addPos = { x : 0 , y : 0 };
  for(var i in collisionObjs){
    var objCenterX = obj.x + obj.width/2;
    var objCenterY = obj.y + obj.height/2;

    var itemCenterX = collisionObjs[i].x + collisionObjs[i].width/2;
    var itemCenterY = collisionObjs[i].y + collisionObjs[i].height/2;

    var vecX = objCenterX - itemCenterX;
    var vecY = objCenterY - itemCenterY;

    var dist = obj.width/2 + collisionObjs[i].width/2 - Math.sqrt(Math.pow(vecX,2) + Math.pow(vecY,2));
    var ratioXYSquare = Math.pow(vecY/vecX,2);

    var distFactorX = dist * Math.sqrt(1/(1+ratioXYSquare));
    var distFactorY = dist * Math.sqrt((ratioXYSquare) / (1 + ratioXYSquare));

    // 1.3 is make more gap between obj and collisionObjs
    addPos.x += (vecX > 0 ? 1 : -1) * distFactorX * 1;
    addPos.y += (vecY > 0 ? 1 : -1) * distFactorY * 1;
  }
  return addPos;
};

exports.checkAndCalcCompelPos = function(tree, posX, posY, radius, id, obj){
  var collisionObjs = [];
  var obj = {x : posX, y: posY, width:radius * 2, height: radius * 2, id: id};
  tree.onCollision(obj, function(item){
    if(obj.id !== item.id){
      var objCenterX = obj.x + obj.width/2;
      var objCenterY = obj.y + obj.height/2;

      var itemCenterX = item.x + item.width/2;
      var itemCenterY = item.y + item.height/2;

      // check sum of radius with item`s distance
      var distSquareDiff = Math.pow(obj.width/2 + item.width/2,2) - Math.pow(itemCenterX - objCenterX,2) - Math.pow(itemCenterY - objCenterY,2);

      if(distSquareDiff > 0 ){
        //collision occured
        collisionObjs.push(item);
      }
    }
  });
  var addPos = { x : 0 , y : 0 };
  for(var i in collisionObjs){
    var objCenterX = obj.x + obj.width/2;
    var objCenterY = obj.y + obj.height/2;

    var itemCenterX = collisionObjs[i].x + collisionObjs[i].width/2;
    var itemCenterY = collisionObjs[i].y + collisionObjs[i].height/2;

    var vecX = objCenterX - itemCenterX;
    var vecY = objCenterY - itemCenterY;

    var dist = obj.width/2 + collisionObjs[i].width/2 - Math.sqrt(Math.pow(vecX,2) + Math.pow(vecY,2));
    var ratioXYSquare = Math.pow(vecY/vecX,2);

    var distFactorX = dist * Math.sqrt(1/(1+ratioXYSquare));
    var distFactorY = dist * Math.sqrt((ratioXYSquare) / (1 + ratioXYSquare));

    // 1.3 is make more gap between obj and collisionObjs
    addPos.x += (vecX > 0 ? 1 : -1) * distFactorX * 1;
    addPos.y += (vecY > 0 ? 1 : -1) * distFactorY * 1;
  }
  return addPos;
};

//coordinate transform
exports.localToWorldPosition = function(position, offset){
  var newPosition = {
    x : position.x + offset.x,
    y : position.y + offset.y
  };
  return newPosition;
};
exports.worldToLocalPosition = function(position, offset){
  var newPosition = {
    x : position.x - offset.x,
    y : position.y - offset.y
  };
  return newPosition;
};
exports.worldXCoordToLocalX = function(x, offsetX){
  return x - offsetX;
};
exports.worldYCoordToLocalY = function(y, offsetY){
  return y - offsetY;
};
exports.isDrawX = function(x, gameConfig){
  if(x <= gameConfig.userOffset.x - gameConfig.PLUS_SIZE_WIDTH){
    return false;
  }else if(x >= gameConfig.userOffset.x + gameConfig.canvasSize.width + gameConfig.PLUS_SIZE_WIDTH){
    return false;
  }else{
    return true;
  }
};
exports.isDrawY = function(y, gameConfig){
  if(y <= gameConfig.userOffset.y - gameConfig.PLUS_SIZE_HEIGHT){
    return false;
  }else if(y >= gameConfig.userOffset.y + gameConfig.canvasSize.height + gameConfig.PLUS_SIZE_HEIGHT){
    return false;
  }else{
    return true;
  }
};
exports.calculateOffset = function(obj, canvasSize){
  var newOffset = {
    x : obj.position.x + obj.size.width/2 - canvasSize.width/2,
    y : obj.position.y + obj.size.height/2 - canvasSize.height/2
  };
  return newOffset;
};

//calcurate distance
exports.distanceSquare = function(position1, position2){
  var distX = position1.x - position2.x;
  var distY = position2.y - position2.y;

  var distSquare = Math.pow(distX, 2) + Math.pow(distY, 2);
  return distSquare;
};
exports.distance = function(position1, position2){
  var distSqure = exports.distanceSpuare(position1, position2);
  return Math.sqrt(distSqure);
};
//calcurate targetDirection;
exports.calcTargetDirection = function(targetPosition, centerPosition){
  var distX = targetPosition.x - centerPosition.x;
  var distY = targetPosition.y - centerPosition.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  var returnVal = 0;
  if(distX < 0 && distY >= 0){
    returnVal = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    returnVal = tangentDegree - 180;
  }else{
    returnVal = tangentDegree;
  }
  return returnVal;
};
exports.calcTargetPosition = function(centerPosition, direction, range){
  var addPosX = range * Math.cos(direction * Math.PI/180);
  var addPosY = range * Math.sin(direction * Math.PI/180);

  return {x : addPosX, y : addPosY};
};
exports.findData = function(table, columnName, value){
  var data = undefined;
  for(var index in table){
    //use ==, because value can be integer
    if(table[index][columnName] == value){
      data = table[index];
    }
  }
  return data;
}
exports.findAndSetBuffs = function(skillData, buffTable, columnName, length){
  var returnVal = [];
  for(var i=0; i<length; i++){
    var buffIndex = skillData[columnName + (i + 1)];
    if(buffIndex === ''){
      return returnVal;
    }else{
      var buffData = exports.findData(buffTable, 'index', buffIndex);
      returnVal.push(buffData);
    }
  }
  return returnVal;
}

},{"./gameConfig.json":7}],12:[function(require,module,exports){
// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');
// var resource = require('../../modules/public/resource.json');
var csvJson = require('../../modules/public/csvjson.js');
var dataJson = require('../../modules/public/data.json');
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});
var socket;

// document elements
var infoScene, gameScene, standingScene;
var startButton;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/60;

// game var
var Manager;

// resource var
var resources;

var userImage, userHand;
var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = load;
var gameUpdateFunc = null;

var drawInterval = null;

//state changer
function changeState(newState){
  clearInterval(drawInterval);
  drawInterval = null;
  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = load;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = standby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = start;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = game;
      break;
    case gameConfig.GAME_STATE_END:
      gameSate = newState;
      gameSetupFunc = null;
      gameUpdateFunc = end;
      break;
  }
  update();
};
function update(){
  if(gameSetupFunc === null && gameUpdateFunc !== null){
    drawInterval = setInterval(gameUpdateFunc,fps);
  }else if(gameSetupFunc !==null && gameUpdateFunc === null){
    gameSetupFunc();
  }
}

//load resource, base setting
function load(){
  setBaseSetting();
  setCanvasSize();
  //event handle config
  startButton.onclick = function(){
    changeState(gameConfig.GAME_STATE_GAME_START);
  };
  window.onresize = function(){
    setCanvasSize();
  };
  changeState(gameConfig.GAME_STATE_START_SCENE);
};
//when all resource loaded. just draw start scene
function standby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function start(){
  setupSocket();
  socket.emit('reqStartGame');
};
//game play on
function game(){
  drawGame();
};
//show end message and restart button
function end(){

};

//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  infoScene = document.getElementById('infoScene');
  gameScene = document.getElementById('gameScene');
  standingScene = document.getElementById('standingScene');
  startButton = document.getElementById('startButton');

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);

  // resource 관련
  resources = require('../../modules/public/resource.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resources.USER_BODY_SRC;
  userHand.src = resources.USER_HAND_SRC;
  grid.src = resources.GRID_SRC;
};

function setCanvasSize(){

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if(gameConfig.userOffset){
    var oldOffsetX = gameConfig.userOffset.x;
    var oldOffsetY = gameConfig.userOffset.y;
  }

  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
  setCanvasScale(gameConfig);

  if(gameConfig.userOffset){
    var worldPosUser = {
      position : util.localToWorldPosition(Manager.user.position,gameConfig.userOffset),
      size : Manager.user.size
    };
    gameConfig.userOffset = util.calculateOffset(worldPosUser, {width : gameConfig.canvasSize.width/gameConfig.scaleFactor, height : gameConfig.canvasSize.height/gameConfig.scaleFactor});

    var revisionX = oldOffsetX - gameConfig.userOffset.x;
    var revisionY = oldOffsetY - gameConfig.userOffset.y;

    Manager.revisionAllObj(revisionX, revisionY);
  }
};

function drawStartScene(){
  infoScene.classList.add('enable');
  infoScene.classList.remove('disable');
  gameScene.classList.add('disable');
  gameScene.classList.remove('enable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');
};

function drawGame(){
  infoScene.classList.add('disable');
  infoScene.classList.remove('enable');
  gameScene.classList.add('enable');
  gameScene.classList.remove('disable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');

  drawScreen();
  drawGrid();
  drawObstacles();
  drawChests();
  drawObjs();
  drawUsers();
  drawEffect();
  drawProjectile();
};
// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    // Manager = new CManager(gameConfig);
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, skillDatas, projectileDatas, objDatas, chestDatas){
    Manager.setUsers(userDatas, skillDatas);
    Manager.setUsersSkills(skillDatas);
    Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);
    Manager.setChests(chestDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.start();
    console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);
    console.log('user joined ' + data.objectID);
  });

  socket.on('resMove', function(userData){
    if(userData.objectID === gameConfig.userID){
      revisionUserPos(userData);
    }
    console.log(userData.objectID + ' move start');
    Manager.updateUserData(userData);
    Manager.moveUser(userData);
  });
  socket.on('resSkill', function(userData, resSkillData){
    if(userData.objectID === gameConfig.userID){
      revisionUserPos(userData);
    }
    var skillData = util.findData(skillTable, 'index', resSkillData.index);
    // console.log(userData.position);
    console.log(resSkillData.targetPosition);
    // console.log((userData.position.x - resSkillData.targetPosition.x) + ' : ' + (userData.position.y - resSkillData.targetPosition.y));
    skillData.targetPosition = resSkillData.targetPosition;
    skillData.direction = resSkillData.direction;
    skillData.totalTime = resSkillData.totalTime;
    skillData.fireTime = resSkillData.fireTime;

    Manager.updateUserData(userData);
    // console.log(Manager.users[gameConfig.userID].position);
    // console.log(skillData.targetPosition);
    // console.log((Manager.users[gameConfig.userID].position.x - skillData.targetPosition.x) + ' : ' + (Manager.users[gameConfig.userID].position.y - skillData.targetPosition.y))
    Manager.useSkill(userData.objectID, skillData);

    //create user castingEffect
    // Manager.createSkillEffect(skillData.targetPosition, skillData.radius, userData.direction, skillData.fireTime);

    // var animator = animateCastingEffect(userData, skillData.totalTime, ctx);
    // setInterval(animator.startAnimation, fps * 2);
    // user state change
    // animation start
  });
  socket.on('setProjectile', function(projectileData){
    console.log(projectileData);
    if(projectileData.explode){
      var skillData = util.findData(skillTable, 'index', projectileData.index);
      Manager.explodeProjectile(projectileData, skillData.effectLastTime);
    }else{
      Manager.makeProjectile(projectileData);
    }
  });
  socket.on('createOBJs', function(objDatas){
    Manager.createOBJs(objDatas);
  });
  socket.on('deleteOBJ', function(objID){
    Manager.deleteOBJ(objID);
  });
  socket.on('createChest', function(chestData){
    console.log(chestData);
    Manager.createChest(chestData);
  });
  socket.on('updateUser', function(userData){
    console.log('in updateUser')
    console.log(userData);
  });
  socket.on('updateSkillPossessions', function(possessSkills){
    Manager.updateSkillPossessions(gameConfig.userID, possessSkills);
  })
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

function revisionUserPos(userData){
  var oldOffsetX = gameConfig.userOffset.x;
  var oldOffsetY = gameConfig.userOffset.y;

  gameConfig.userOffset = util.calculateOffset(userData, gameConfig.canvasSize);
  var revisionX = oldOffsetX - gameConfig.userOffset.x;
  var revisionY = oldOffsetY - gameConfig.userOffset.y;
  // Manager.revisionAllObj(revisionX, revisionY);
  Manager.revisionUserPos(revisionX, revisionY);
};
//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){
  ctx.fillStyle ="#000000";

  for(var index in Manager.obstacles){
    ctx.beginPath();
    ctx.arc((Manager.obstacles[index].localPosition.x + resources.OBJ_TREE_SIZE/2) * gameConfig.scaleFactor, (Manager.obstacles[index].localPosition.y + resources.OBJ_TREE_SIZE/2) * gameConfig.scaleFactor,
            resources.OBJ_TREE_SIZE/2 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    ctx.closePath();
    // ctx.fillRect(Manager.obstacles[index].staticEle.x, Manager.obstacles[index].staticEle.y, resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE);
  }
};
function drawChests(){
  ctx.fillStyle = "#00ff00";
  for(var i=0; i<Manager.chests.length; i++){
    ctx.beginPath();
    ctx.fillRect((Manager.chests[i].localPosition.x) * gameConfig.scaleFactor, Manager.chests[i].localPosition.y * gameConfig.scaleFactor,
                  Manager.chests[i].size.width * gameConfig.scaleFactor, Manager.chests[i].size.height * gameConfig.scaleFactor);
    ctx.closePath();
  }
}
function drawObjs(){
  ctx.fillStyle = "#0000ff";
  for(var i=0; i<Manager.objExps.length; i++){
    ctx.beginPath();
    ctx.fillRect((Manager.objExps[i].position.x) * gameConfig.scaleFactor, (Manager.objExps[i].position.y) * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  ctx.fillStyle = "#ff0000";
  for(var i=0; i<Manager.objSkills.length; i++){
    ctx.beginPath();
    ctx.fillRect((Manager.objSkills[i].position.x) * gameConfig.scaleFactor, (Manager.objSkills[i].position.y) * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
}
function drawUsers(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    // console.log('user positionX : ' + (Manager.users[index].position.x  * gameConfig.scaleFactor));
    if(Manager.users[index].objectID === gameConfig.userID){
      ctx.translate(Manager.users[index].center.x * gameConfig.scaleFactor, Manager.users[index].center.y * gameConfig.scaleFactor);
      // ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
    }else{
      ctx.translate((Manager.users[index].center.x) * gameConfig.scaleFactor, (Manager.users[index].center.y) * gameConfig.scaleFactor);
    }
    ctx.rotate(radian);
    ctx.fillStyle = 'yellow';
    ctx.arc(0, 0, 64 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    // ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    // ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);

    //draw cast effect
    if(Manager.users[index].skillEffectPlay){
      ctx.fillStyle ="#00ff00";
      ctx.beginPath();
      ctx.arc(-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 100, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }
};
function drawEffect(){
  for(var index in Manager.effects){
    var radian = Manager.effects[index].direction * radianFactor;

    ctx.fillStyle ="#ff0000";
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    var centerX = (Manager.effects[index].targetPosition.x + Manager.effects[index].explosionRadius) * gameConfig.scaleFactor;
    var centerY = (Manager.effects[index].targetPosition.y + Manager.effects[index].explosionRadius) * gameConfig.scaleFactor;
    ctx.translate(centerX, centerY);
    // ctx.rotate(radian);
    ctx.fillRect(-Manager.effects[index].explosionRadius * gameConfig.scaleFactor, -Manager.effects[index].explosionRadius * gameConfig.scaleFactor,
                 Manager.effects[index].explosionRadius * 2 * gameConfig.scaleFactor, Manager.effects[index].explosionRadius * 2 * gameConfig.scaleFactor);
    // ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    // ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.restore();
  }
};
function drawProjectile(){
  for(var index in Manager.projectiles){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    ctx.arc((Manager.projectiles[index].position.x + Manager.projectiles[index].radius) * gameConfig.scaleFactor,
            (Manager.projectiles[index].position.y + Manager.projectiles[index].radius) * gameConfig.scaleFactor, 50, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
};
function drawGrid(){
  //draw boundary
  //draw grid
  for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resources.GRID_SIZE){
    if(util.isDrawX(i, gameConfig)){
      var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
      for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resources.GRID_SIZE){
        if(util.isDrawY(j, gameConfig)){
          var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
          ctx.drawImage(grid, 0, 0, 48, 48, x * gameConfig.scaleFactor, y * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor);
        }
      }
    }
  }
};

function canvasAddEvent(){
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX/gameConfig.scaleFactor,
      y : e.clientY/gameConfig.scaleFactor
    }
    console.log(targetPosition);
    var worldTargetPosition = util.localToWorldPosition(targetPosition, gameConfig.userOffset);
    console.log(worldTargetPosition);
    socket.emit('reqMove', worldTargetPosition);
  }, false);
}
function documentAddEvent(){
  document.addEventListener('keydown', function(e){
    var keyCode = e.keyCode;
    var tempPos = util.localToWorldPosition({x : 0, y : 0}, gameConfig.userOffset);
    if(keyCode === 69 || keyCode === 32){
      socket.emit('reqSkill', 11);
    }else if(keyCode === 49){
      socket.emit('reqSkill', 21, tempPos);
    }else if(keyCode === 50){
      socket.emit('reqSkill', 41, tempPos);
    }else if(keyCode === 51){
      socket.emit('reqSkill', 51);
    }
  }, false);
}
update();

function setCanvasScale(gameConfig){
  gameConfig.scaleX = 1;
  gameConfig.scaleY = 1;
  if(gameConfig.canvasSize.width >= gameConfig.CANVAS_MAX_LOCAL_SIZE.width){
    gameConfig.scaleX =  (gameConfig.canvasSize.width / gameConfig.CANVAS_MAX_LOCAL_SIZE.width);
  }
  if(gameConfig.canvasSize.height >= gameConfig.CANVAS_MAX_LOCAL_SIZE.height){
    gameConfig.scaleY = (gameConfig.canvasSize.height / gameConfig.CANVAS_MAX_LOCAL_SIZE.height);
  }
  // if(gameConfig.canvasSize.width >= canvasMaxLocalSize.width || gameConfig.canvasSize.height >= canvasMaxLocalSize.height){
  // }
  if(gameConfig.scaleX > gameConfig.scaleY){
    gameConfig.scaleFactor = gameConfig.scaleX;
  }else{
    gameConfig.scaleFactor = gameConfig.scaleY;
  }
}

},{"../../modules/client/CManager.js":1,"../../modules/client/CUser.js":4,"../../modules/public/csvjson.js":5,"../../modules/public/data.json":6,"../../modules/public/gameConfig.json":7,"../../modules/public/resource.json":10,"../../modules/public/util.js":11}]},{},[12]);
