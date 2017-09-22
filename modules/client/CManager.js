var User = require('./CUser.js');

var util = require('../public/util.js');

var gameConfig = require('../public/gameConfig.json');
var resources = require('../public/resources.json');
// var map = require('../public/map.json');
var csvJson = require('../public/csvjson.js');
var dataJson = require('../public/data.json');

var obstacleTable = csvJson.toObject(dataJson.obstacleData, {delimiter : ',', quote : '"'});

var QuadTree = require('../public/quadtree.min.js');

var Obstacle = require('./CObstacle.js');

var colliderEles = [];

var staticTree;
var staticEles = [];
var checkCollisionEles = [];
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

	// this.objExps = [];
	this.objGolds = [];
	this.objJewels = [];
	this.objSkills = [];

	this.onSkillFire = new Function();
	this.onProjectileSkillFire = new Function();
	this.onCancelCasting = new Function();

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
		var trees = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_TREE));
		for(var i=0; i<Object.keys(trees).length; i++){
				var tempTree = new Obstacle(trees[i].posX, trees[i].posY, trees[i].radius, trees[i].id, resources.OBJ_TREE_SRC);
				this.obstacles.push(tempTree);
				staticEles.push(tempTree.staticEle);
		}
		var chestGrounds = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_CHEST_GROUND));
		for(var i=0; i<Object.keys(chestGrounds).length; i++){
			var tempChestGround = new Obstacle(chestGrounds[i].posX, chestGrounds[i].posY, chestGrounds[i].radius, chestGrounds[i].id, resources.OBJ_CHEST_GROUND_SRC);
			this.obstacles.push(tempChestGround);
			staticEles.push(tempChestGround.staticEle);
		}
		// for(var i=0; i<map.Trees.length; i++){
		// 	var tempObstacle = new Obstacle(map.Trees[i].posX, map.Trees[i].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[i].id, resources.OBJ_TREE_SRC);
		// 	this.obstacles.push(tempObstacle);
		// 	staticEles.push(tempObstacle.staticEle);
		// }
		// for(var i=0; i<map.Chests.length; i++){
		// 	var chestBase = new Obstacle(map.Chests[i].posX, map.Chests[i].posY, resources.OBJ_CHEST_SIZE, resources.OBJ_CHEST_SIZE, map.Chests[i].id, resources.OBJ_CHEST_SRC);
		// 	this.obstacles.push(chestBase);
		// 	staticEles.push(chestBase.staticEle);
		// }
		staticTree.pushAll(staticEles);
	},
	setChests : function(chestDatas){
		for(var i=0; i<chestDatas.length; i++){
			this.createChest(chestDatas[i]);
		}
	},
	createChest : function(chestData){
		//find chest location
		var chestGrounds = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_CHEST_GROUND));
		for(var i=0; i<Object.keys(chestGrounds).length; i++){
			if(chestGrounds[i].id === chestData.locationID){
				var chestPosition = {x : chestGrounds[i].posX,  y : chestGrounds[i].posY};
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
		// for(var i=0; i<map.Chests.length; i++){
		// 	if(map.Chests[i].id === chestData.locationID){
		// 		var chestPosition = {x : map.Chests[i].posX, y : map.Chests[i].posY};
		// 		break;
		// 	}
		// }
		// if(chestPosition){
		// 	this.chests.push({
		// 		objectID : chestData.objectID,
		// 		grade : chestData.grade,
		// 		position : chestPosition,
		// 		size : {width : resources.OBJ_CHEST_SIZE, height : resources.OBJ_CHEST_SIZE}
		// 	});
		// }
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
		for(var i=0; i<userDatas.length; i++){
			var tempUser = new User(userDatas[i]);
			this.users[userDatas[i].objectID] = tempUser;
			this.users[userDatas[i].objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userDatas[i].objectID].changeState(userDatas[i].currentState);
		}
	},
	setUsersSkills : function(skillDatas){
		for(var i=0; i<skillDatas.length; i++){
			if(skillDatas[i].fireTime > 0){
				this.userSkill(skillDatas[i].userID, skillDatas[i]);
			}
		}
	},
	setObjs : function(objDatas){
		for(var i=0; i<objDatas.length; i++){
			// if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_EXP){
			// 	this.objExps.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			// }else
			if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_SKILL){
				this.objSkills.push(objDatas[i]);
					// {objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_GOLD){
				this.objGolds.push(objDatas[i]);
					// {objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_JEWEL){
				this.objJewels.push(objDatas[i]);
					// {objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else{
				console.log('check object : ' + objDatas[i].objectID)
			}
		}
	},
	createOBJs : function(objDatas){
		for(var i=0; i<objDatas.length; i++){
			// if(objDatas[i].objectID.substr(0,3) === gameConfig.PREFIX_OBJECT_EXP){
			// 	this.objExps.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			// }else
			if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_SKILL){
				this.objSkills.push(objDatas[i]);
					// {objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_GOLD){
				this.objGolds.push(objDatas[i]);
				// {objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_JEWEL){
				this.objJewels.push(objDatas[i]);
				// {objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else{
				console.log('check object : ' + objDatas[i].objectID)
			}
		}
	},
	deleteOBJ : function(objID){
		// if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_EXP){
		// 	for(var i=0; i<this.objExps.length; i++){
		// 		if(this.objExps[i].objectID === objID){
		// 			this.objExps.splice(i, 1);
		// 			return;
		// 		}
		// 	}
		// }else
		if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_SKILL){
			for(var i=0; i<this.objSkills.length; i++){
				if(this.objSkills[i].objectID === objID){
					this.objSkills.splice(i, 1);
					return;
				}
			}
		}else if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_GOLD){
			for(var i=0; i<this.objGolds.length; i++){
				if(this.objGolds[i].objectID === objID){
					this.objGolds.splice(i, 1);
					return;
				}
			}
		}else if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_JEWEL){
			for(var i=0; i<this.objJewels.length; i++){
				if(this.objJewels[i].objectID === objID){
					this.objJewels.splice(i, 1);
					return;
				}
			}
		}else{
			console.log('check object id : ' + objID);
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
		if(userID in this.users){
			var skillInstance = this.users[userID].makeSkillInstance(skillData);
			var thisUser = this.user;
			var mainUser = this.users[userID];
			// var thisProjectiles = this.projectiles;
			// var thisEffects = this.effects;
			var thisOnSkillFire = this.onSkillFire;
			var thisOnProjectileSkillFire = this.onProjectileSkillFire;

			this.users[userID].targetDirection = skillData.direction;
			if(skillData.type === gameConfig.SKILL_TYPE_INSTANT_RANGE){
				skillInstance.onFire = function(syncFireTime){
					//inform to server
					if(thisUser === mainUser){
						thisOnSkillFire(skillData);
					}

					mainUser.skillCastEffectPlay = false;
					// skillInstance.startEffectTimer();
					// thisEffects.push(skillInstance.effect);
				};
				//on attack can cast skill but on attack cant attack;
				this.users[userID].changeState(gameConfig.OBJECT_STATE_ATTACK);
			}else if(skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
				skillInstance.onFire = function(syncFireTime){
					var projectile = mainUser.makeProjectile(skillData.projectileIDs[0], skillInstance, skillData.direction);
					if(thisUser === mainUser){
						thisOnProjectileSkillFire([projectile], syncFireTime);
					}
					// thisProjectiles.push(projectile);
					mainUser.skillCastEffectPlay = false;
				}
				//on attack can cast skill but on attack cant attack;
				this.users[userID].changeState(gameConfig.OBJECT_STATE_ATTACK);
			}else if(skillData.type === gameConfig.SKILL_TYPE_RANGE || skillData.type === gameConfig.SKILL_TYPE_SELF ||
				skillData.type === gameConfig.SKILL_TYPE_SELF_EXPLOSION || skillData.type === gameConfig.SKILL_TYPE_TELEPORT){
					skillInstance.onFire = function(syncFireTime){
						if(thisUser === mainUser){
							thisOnSkillFire(skillData, syncFireTime)
						}
						mainUser.skillCastEffectPlay = false;
						// skillInstance.startEffectTimer();
						// thisEffects.push(skillInstance.effect);
					};
					this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
				}else if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
					skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION){
						skillInstance.onFire = function(syncFireTime){
							var projectiles = [];
							var direction = skillData.direction;
							for(var i=0; i<skillData.projectileCount; i++){
								if(skillData.projectileCount % 2 === 0){
									var midPoint = skillData.projectileCount/2 - 0.5;
									var factor = i - midPoint;
									direction = skillData.direction + factor * gameConfig.MULTI_PROJECTILE_DEGREE;
								}else if(skillData.projectileCount % 2 === 1){
									var midPoint = Math.floor(skillData.projectileCount/2);
									factor = i - midPoint;
									direction = skillData.direction + factor * gameConfig.MULTI_PROJECTILE_DEGREE;
								}
								var projectile = mainUser.makeProjectile(skillData.projectileIDs[i], skillInstance, direction);
								// thisProjectiles.push(projectile);
								projectiles.push(projectile);
								if(thisUser === mainUser && projectiles.length === skillData.projectileCount){
									thisOnProjectileSkillFire(projectiles, syncFireTime);
								}
								mainUser.skillCastEffectPlay = false;
							}
						};
						this.users[userID].changeState(gameConfig.OBJECT_STATE_CAST);
					}else{
						console.log('skill type error!!!');
					}
					this.users[userID].setSkill(skillInstance);
		}
	},
	applySkill : function(skillData){
		this.effects.push({
			position : skillData.targetPosition,
			radius : skillData.explosionRadius,
			startTime : Date.now(),
			lifeTime  : skillData.effectLastTime,

			isCheckCollision : false
		});
	},
	applyProjectile : function(skillData){
		this.projectiles.push({
			userID : skillData.userID,
			objectID : skillData.objectID,

			type : skillData.type,

			position : skillData.position,
			speed : skillData.speed,
			startTime : skillData.startTime,
			radius : skillData.radius,
			lifeTime : skillData.lifeTime,

			timer : Date.now(),
			effect : {
					position : skillData.position,
					radius : skillData.explosionRadius,
					startTime : 0,
					lifeTime : skillData.lifeTime
			},

			move : function(){
				var deltaTime = (Date.now() - this.timer)/ 1000;
		    this.position.x += this.speed.x * deltaTime;
		    this.position.y += this.speed.y * deltaTime;
		    this.timer = Date.now();
			},
			isExpired : function(){
		    if(this.lifeTime > Date.now() - this.startTime){
		      return false;
		    }
		    return true;
		  },
			explode : function(){
				this.setEffect();
				console.log('explode!!!!!!');
			},
			setEffect : function(){
				this.effect.startTime = Date.now();
			}
		});
	},
	applyCastSpeed : function(userID, skillData){
		if(userID in this.users){
			console.log(this.users[userID].castSpeed);
			console.log(skillData.fireTime + ' : ' + skillData.totalTime);
			skillData.fireTime = Math.floor(skillData.fireTime * (100 / this.users[userID].castSpeed));
			skillData.totalTime = Math.floor(skillData.totalTime * (100 / this.users[userID].castSpeed));
			console.log(skillData.fireTime + ' : ' + skillData.totalTime);
		}
	},
	cancelCasting : function(userID){
		if(userID in this.users){
			this.users[userID].changeState(gameConfig.OBJECT_STATE_IDLE);
			if(userID === this.user.objectID){
				this.onCancelCasting();
			}
		}
	},
	deleteProjectile : function(projectileID, userID){
		for(var i=0; i<this.projectiles.length; i++){
			if(this.projectiles[i].objectID === projectileID){
				if(this.projectiles[i].userID === userID){
					this.projectiles.splice(i, 1);
					break;
				}
			}
		}
	},
	explodeProjectile : function(projectileID, userID){
		for(var i=0; i<this.projectiles.length; i++){
			if(this.projectiles[i].objectID === projectileID){
				if(this.projectiles[i].userID === userID){
					this.projectiles[i].explode();
					// this.projectiles[i].startEffectTimer();
					this.effects.push(this.projectiles[i].effect);
					this.projectiles.splice(i, 1);
					break;
				}
			}
		}
	},
	changeUserStat : function(userData){
		if(userData.objectID in this.users){
			this.users[userData.objectID].level = userData.level;
			this.users[userData.objectID].exp = userData.exp;

			this.users[userData.objectID].maxHP = userData.maxHP;
			this.users[userData.objectID].maxMP = userData.maxMP;
			this.users[userData.objectID].HP = userData.HP;
			this.users[userData.objectID].MP = userData.MP;
			this.users[userData.objectID].castSpeed = userData.castSpeed;
			this.users[userData.objectID].maxSpeed = userData.maxSpeed;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
			this.users[userData.objectID].conditions = userData.conditions;
			this.users[userData.objectID].buffList = userData.buffList;
			this.users[userData.objectID].passiveList = userData.passiveList;

			//apply maxSpeed
			this.users[userData.objectID].setSpeed();
			if(this.users[userData.objectID].currentState === gameConfig.OBJECT_STATE_CAST){

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
			this.users[userData.objectID].maxSpeed = userData.maxSpeed;
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

			time : this.user.timer
		};
	},
	processSkillData : function(skillData){
		return {
			// userID : this.user.objectID,
			skillIndex : skillData.index,
			skillTargetPosition : skillData.targetPosition
		};
	},
	processProjectileData : function(projectileDatas){
		var projectiles = [];
		for(var i=0; i<projectileDatas.length; i++){
			projectiles.push({
				objectID : projectileDatas[i].objectID,
				skillIndex : projectileDatas[i].index,
				position : projectileDatas[i].position,
				speed : projectileDatas[i].speed,
				// startTime : projectileDatas[i].startTime,
				// lifeTime : projectileDatas[i].lifeTime
			});
		}
		return projectiles;
	}
};

function staticIntervalHandler(){
	var i=checkCollisionEles.length;
	while(i--){
		var collisionObjs = util.checkCircleCollision(staticTree, checkCollisionEles[i].position.x, checkCollisionEles[i].position.y, checkCollisionEles[i].radius, gameConfig.PREFIX_SKILL);
		if(collisionObjs.length){
			for(var j=0; j<collisionObjs.length; j++){
				var tempCollider = collisionObjs[j];
				if(!tempCollider.isCollide){
					tempCollider.isCollide = true;
					setTimeout(function(){
						tempCollider.isCollide = false;
					}, gameConfig.SKiLL_HIT_EFFECT_TIME);
				}
			}
		}
		checkCollisionEles.splice(i, 1);
	}


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

			if(this.projectiles[i].type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE || this.projectiles[i].type === gameConfig.SKILL_TYPE_PROJECTILE ||
				 this.projectiles[i].type === gameConfig.SKILL_TYPE_PROJECTILE_TICK || this.projectiles[i].type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION){
					 //check collision with obstacles
					 var collisionObjs = util.checkCircleCollision(staticTree, this.projectiles[i].position.x, this.projectiles[i].position.y, this.projectiles[i].radius, gameConfig.PREFIX_SKILL_PROJECTILE);
					 if(collisionObjs.length){
						 for(var j=0; j<collisionObjs.length; j++){
							 var tempCollider = collisionObjs[j];
							 if(!tempCollider.isCollide){
								 tempCollider.isCollide = true;
								 setTimeout(function(){
									 tempCollider.isCollide = false;
								 }, gameConfig.SKiLL_HIT_EFFECT_TIME);
							 }
						 }
					 }
				 }
		}
  }
	var i=this.effects.length;
	while(i--){
		if(!this.effects[i].isCheckCollision){
			if(Date.now() - this.effects[i].startTime > this.effects[i].lifeTime/2){
				checkCollisionEles.push(this.effects[i]);
				this.effects[i].isCheckCollision = true;
			}
		}
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
