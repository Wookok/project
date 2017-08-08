var User = require('./CUser.js');

var util = require('../public/util.js');

var gameConfig = require('../public/gameConfig.json');
var resources = require('../public/resource.json');
var map = require('../public/map.json');

var QuadTree = require('../public/quadtree.min.js');

var Obstacle = require('./CObstacle.js');

var colliderEles = [];

var staticTree;
var staticEles = [];
var affectedEles = [];

var CManager = function(){
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

	this.onSkillFire = new Function();
	this.onProjectileSkillFire = new Function();

	this.staticInterval = null;
	this.affectInterval = null;
};

CManager.prototype = {
	start : function(){
		staticTree = new QuadTree({
		  width : gameConfig.CANVAS_MAX_SIZE.width,
		  height : gameConfig.CANVAS_MAX_SIZE.height,
		  maxElements : 5
		});

		this.mapSetting();
		this.updateGame();
	},
	mapSetting : function(){
		this.createObstacles();
		// this.setObstaclesLocalPos();
	},
	updateGame : function(){
		var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

		if(this.staticInterval === null){
	    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
	  }
	},
	createObstacles : function(){
		for(var i=0; i<map.Trees.length; i++){
			var tempObstacle = new Obstacle(map.Trees[i].posX, map.Trees[i].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[i].id, resources.OBJ_TREE_SRC);
			this.obstacles.push(tempObstacle);
			staticEles.push(tempObstacle.staticEle);
		}
		for(var i=0; i<map.Chests.length; i++){
			var chestBase = new Obstacle(map.Chests[i].posX, map.Chests[i].posY, resources.OBJ_CHEST_SIZE, resources.OBJ_CHEST_SIZE, map.Chests[i].id, resources.OBJ_CHEST_SRC);
			this.obstacles.push(chestBase);
			staticEles.push(chestBase.staticEle);
		}
		staticTree.pushAll(staticEles);
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
				size : {width : resources.OBJ_CHEST_SIZE, height : resources.OBJ_CHEST_SIZE}
			});
		}
	},
	setUser : function(userData){
		if(!(userData.objectID in this.users)){
			var tempUser = new User(userData);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var i=0; i<Object.keys(userDatas).length; i++){
			var tempUser = new User(userDatas[i]);
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
	setObjs : function(objDatas){
		for(var i=0; i<Object.keys(objDatas).length; i++){
			if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_EXP){
				this.objExps.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_SKILL){
				this.objSkills.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}
		}
	},
	createOBJs : function(objDatas){
		for(var i=0; i<Object.keys(objDatas).length; i++){
			if(objDatas[i].objectID.substr(0,3) === gameConfig.PREFIX_OBJECT_EXP){
				this.objExps.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_SKILL){
				this.objSkills.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}
		}
	},
	deleteOBJ : function(objID){
		if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_EXP){
			for(var i=0; i<this.objExps.length; i++){
				if(this.objExps[i].objectID === objID){
					this.objExps.splice(i, 1);
					return;
				}
			}
		}else if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_SKILL){
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

		this.user.changeState(gameConfig.OBJECT_STATE_MOVE);
	},
	useSkill : function(userID, skillData){
		var skillInstance = this.users[userID].makeSkillInstance(skillData);
		var thisUser = this.user;
		var mainUser = this.users[userID];
		var thisProjectiles = this.projectiles;
		var thisEffects = this.effects;
		var thisOnSkillFire = this.onSkillFire;
		var thisOnProjectileSkillFire = this.onProjectileSkillFire;

		this.users[userID].targetDirection = skillData.direction;
		switch (skillData.type) {
			case gameConfig.SKILL_TYPE_BASIC:
	      // skillInstance = this.users[userID].makeSkillInstance(skillData);
	      skillInstance.onFire = function(){
					//inform to server
					if(thisUser === mainUser){
						thisOnSkillFire(skillData)
					}
					mainUser.skillCastEffectPlay = false;
					skillInstance.startEffectTimer();
					thisEffects.push(skillInstance.effect);
	      };
	      //on attack can cast skill but on attack cant attack;
	      this.users[userID].changeState(gameConfig.OBJECT_STATE_ATTACK);
	      break;
	    case gameConfig.SKILL_TYPE_INSTANT:
	      skillInstance.onFire = function(){
					if(thisUser === mainUser){
						thisOnSkillFire(skillData)
					}
					mainUser.skillCastEffectPlay = false;
					skillInstance.startEffectTimer();
					thisEffects.push(skillInstance.effect);
	      };
				this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
	      break;
	    case gameConfig.SKILL_TYPE_SELF:
	      skillInstance.onFire = function(){
					if(thisUser === mainUser){
						thisOnSkillFire(skillData)
					}
					mainUser.skillCastEffectPlay = false;
					skillInstance.startEffectTimer();
					thisEffects.push(skillInstance.effect);
	      };
	      this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
	      break;
			case gameConfig.SKILL_TYPE_SELF_EXPLOSION:
				skillInstance.onFire = function(){
					if(thisUser === mainUser){
						thisOnSkillFire(skillData)
					}
					mainUser.skillCastEffectPlay = false;
					skillInstance.startEffectTimer();
					thisEffects.push(skillInstance.effect);
				};
				this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
				break;
			case gameConfig.SKILL_TYPE_TELEPORT:
				skillInstance.onFire = function(){
					if(thisUser === mainUser){
						thisOnSkillFire(skillData)
					}
					mainUser.skillCastEffectPlay = false;
					skillInstance.startEffectTimer();
					thisEffects.push(skillInstance.effect);
				};
				this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
				break;
			case gameConfig.SKILL_TYPE_PROJECTILE:
				skillInstance.onFire = function(){
					var projectile = mainUser.makeProjectile(skillData.projectileID, skillInstance);
					if(thisUser === mainUser){
						thisOnProjectileSkillFire(projectile);
					}
					thisProjectiles.push(projectile);
					mainUser.skillCastEffectPlay = false;
				};
				this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
				break;
			case gameConfig.SKILL_TYPE_PROJECTILE_TICK:
				skillInstance.onFire = function(){
					var projectile = mainUser.makeProjectile(skillData.projectileID, skillInstance);
					if(thisUser === mainUser){
						thisOnProjectileSkillFire(projectile);
					}
					thisProjectiles.push(projectile);
					mainUser.skillCastEffectPlay = false;

				};
				this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
				break;
	    default:
				console.log('skill type error!!!');
	      break;
		}
		this.users[userID].setSkill(skillInstance);
	},
	explodeProjectile : function(projectileID){
		for(var i=0; i<this.projectiles.length; i++){
			if(this.projectiles[i].objectID === projectileID){
				this.projectiles[i].explode();
				break;
			}
		}
	},
	updateSkillPossessions : function(userID, possessSkills){
		this.users[userID].updateSkillPossessions(possessSkills);
	},
	updateUserData : function(userData){
		if(userData.objectID in this.users){
			this.users[userData.objectID].position = userData.position;
			this.users[userData.objectID].targetPosition = userData.targetPosition;

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
	// set this client user
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	},
	processUserData : function(){
		return {
			objectID : this.user.objectID,
			currentState : this.user.currentState,
			position : this.user.position,
			direction : this.user.direction,
		};
	},
	processSkillData : function(skillData){
		return {
			// userID : this.user.objectID,
			skillIndex : skillData.index,
			skillTargetPosition : skillData.targetPosition
		};
	},
	processProjectileData : function(projectileData){
		return {
			// userID : this.user.objectID,
			objectID : projectileData.objectID,
			skillIndex : projectileData.index,
			position : projectileData.position,
			speed : projectileData.speed,
			startTime : projectileData.startTime,
			lifeTime : projectileData.lifeTime
		};
	}
};

function staticIntervalHandler(){
	//user elements update for collision check
	for(var index in this.users){
		this.users[index].setEntityEle();
	}

	var i = this.projectiles.length;
  while(i--){
    if(this.projectiles[i].isExpired()){
      this.projectiles.splice(i, 1);
    }else{
      this.projectiles[i].move();
    }
  }
	var i=this.effects.length;
	while(i--){
		if(this.effects[i].startTime + this.effects[i].lifeTime < Date.now()){
			this.effects.splice(i, 1);
		}
	}
};
var onMoveCalcCompelPos = function(user){
	var collisionObjs = util.checkCircleCollision(staticTree, user.entityTreeEle.x, user.entityTreeEle.y, user.entityTreeEle.width/2, user.entityTreeEle.id);
  if(collisionObjs.length > 0 ){
    var addPos = util.calcCompelPos(user.entityTreeEle, collisionObjs);
  }
  return addPos;
};
module.exports = CManager;
