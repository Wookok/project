(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var User = require('./CUser.js');

var util = require('../public/util.js');

var gameConfig = require('../public/gameConfig.json');
var resources = require('../public/resources.json');
// var map = require('../public/map.json');
// var csvJson = require('../public/csvjson.js');
// var dataJson = require('../public/data.json');

// var obstacleTable = csvJson.toObject(dataJson.obstacleData, {delimiter : ',', quote : '"'});
var userStatTable, resourceTable, obstacleTable;

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
	this.userEffects = [];
	this.projectiles = [];
	this.riseText = [];

	this.userEffectTimer = Date.now();
	// this.objExps = [];
	this.objGolds = [];
	this.objJewels = [];
	this.objSkills = [];

	this.onMainUserMove = new Function();
	this.onSkillFire = new Function();
	this.onProjectileSkillFire = new Function();
	this.onCancelCasting = new Function();

	this.staticInterval = null;
	this.affectInterval = null;
};

CManager.prototype = {
	start : function(statTable, srcTable, ostTable){
		userStatTable = statTable;
		resourceTable = srcTable;
		obstacleTable = ostTable;

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
			var resourceData = Object.assign({}, util.findData(resourceTable, 'index', trees[i].imgData));
			var tempTree = new Obstacle(trees[i].posX, trees[i].posY, trees[i].radius, trees[i].id, resourceData);
			this.obstacles.push(tempTree);
			staticEles.push(tempTree.staticEle);
		}
		var rocks = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_ROCK));
		for(var i=0; i<Object.keys(rocks).length; i++){
			var resourceData = Object.assign({}, util.findData(resourceTable, 'index', rocks[i].imgData));
			var tempRock = new Obstacle(rocks[i].posX, rocks[i].posY, rocks[i].radius, rocks[i].id, resourceData);
			this.obstacles.push(tempRock);
			staticEles.push(tempRock.staticEle);
		}
		var chestGrounds = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_CHEST_GROUND));
		for(var i=0; i<Object.keys(chestGrounds).length; i++){
			var resourceData = Object.assign({}, util.findData(resourceTable, 'index', chestGrounds[i].imgData));
			var tempChestGround = new Obstacle(chestGrounds[i].posX, chestGrounds[i].posY, chestGrounds[i].radius, chestGrounds[i].id, resourceData);
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
				var chestGround = chestGrounds[i];
				var chestPosition = {x : chestGrounds[i].posX,  y : chestGrounds[i].posY};
				break;
			}
		}
		if(chestGround && chestPosition){
			// var resourceData = Object.assign({}, util.findData(resourceTable, 'index'))
			switch (chestData.grade) {
				case 1:
						var resourceIndex = gameConfig.RESOURCE_INDEX_CHEST_GRADE_1;
					break;
				case 2:
					resourceIndex = gameConfig.RESOURCE_INDEX_CHEST_GRADE_2;
					break;
				case 3:
					resourceIndex = gameConfig.RESOURCE_INDEX_CHEST_GRADE_3;
					break;
				case 4:
					resourceIndex = gameConfig.RESOURCE_INDEX_CHEST_GRADE_4;
					break;
				case 5:
					resourceIndex = gameConfig.RESOURCE_INDEX_CHEST_GRADE_5;
					break;
				default:
			}
			var resourceData = Object.assign({}, util.findData(resourceTable, 'index', resourceIndex));
			this.chests.push({
				objectID : chestData.objectID,
				locationID : chestData.locationID,
				grade : chestData.grade,
				position : chestPosition,
				size : {width : chestGround.radius * 2, height : chestGround.radius * 2},
				center : {x : chestPosition.x + chestGround.radius, y : chestPosition.y + chestGround.radius},
				imgData : resourceData
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
	deleteChest : function(locationID){
		for(var i=0; i<this.chests.length; i++){
			if(this.chests[i].locationID === locationID){
				this.chests.splice(i, 1)
				break;
			}
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
		for(var i=0; i<userDatas.length; i++){
			userDatas[i].imgData = this.setImgData(userDatas[i], resourceTable, userStatTable);
			var tempUser = new User(userDatas[i]);
			this.users[userDatas[i].objectID] = tempUser;
			this.users[userDatas[i].objectID].onMove = onMoveCalcCompelPos.bind(this);
			this.users[userDatas[i].objectID].changeState(userDatas[i].currentState);
		}
	},
	setImgData : function(userData){
		var imgIndex = util.findDataWithTwoColumns(userStatTable, 'type', userData.type, 'level', userData.level).imgData;
		return Object.assign({}, util.findData(resourceTable, 'index', imgIndex));
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
	iamRestart : function(userData){
		this.users[this.user.objectID] = this.user;

		this.user.changeState(gameConfig.OBJECT_STATE_IDLE);
	},
	iamDead : function(){
		this.user.changeState(gameConfig.OBJECT_STATE_DEATH);
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
			property : skillData.property,
			position : {x : skillData.targetPosition.x - skillData.explosionRadius,
									y : skillData.targetPosition.y - skillData.explosionRadius},
			radius : skillData.explosionRadius,
			startTime : Date.now(),
			lifeTime  : skillData.effectLastTime,
			scaleFactor : 1,

			isCheckCollision : false
		});
	},
	applyProjectile : function(skillData){
		this.projectiles.push({
			userID : skillData.userID,
			objectID : skillData.objectID,

			type : skillData.type,
			property : skillData.property,

			position : skillData.position,
			speed : skillData.speed,
			startTime : skillData.startTime,
			radius : skillData.radius,
			lifeTime : skillData.lifeTime,

			timer : Date.now(),
			effect : {
				property : skillData.property,
				position : skillData.position,
				radius : skillData.explosionRadius,
				startTime : 0,
				lifeTime : skillData.effectLastTime,
				scaleFactor : 1
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
			explode : function(position){
				this.setEffect(position);
				console.log('explode!!!!!!');
			},
			setEffect : function(position){
				this.effect.position = position;
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
	explodeProjectile : function(projectileID, userID, position){
		for(var i=0; i<this.projectiles.length; i++){
			if(this.projectiles[i].objectID === projectileID){
				if(this.projectiles[i].userID === userID){
					this.projectiles[i].explode(position);
					// this.projectiles[i].startEffectTimer();
					this.effects.push(this.projectiles[i].effect);
					this.projectiles.splice(i, 1);
					break;
				}
			}
		}
	},
	changeUserStat : function(userData, isUpdateImage){
		if(userData.objectID in this.users){
			if(userData.level !== this.users[userData.objectID].level || isUpdateImage){
				this.users[userData.objectID].level = userData.level;
				this.users[userData.objectID].imgData = this.setImgData(userData);
			}
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
			if(this.users[userData.objectID].currentState === gameConfig.OBJECT_STATE_CAST &&
				 this.users[userData.objectID].currentSkill){
				var consumeMP = this.users[userData.objectID].currentSkill.consumeMP;
				if(this.users[userData.objectID].conditions[gameConfig.USER_CONDITION_FREEZE] ||
					 this.users[userData.objectID].conditions[gameConfig.USER_CONDITION_SILENCE] ||
					 this.users[userData.objectID].MP < consumeMP){
						 this.users[userData.objectID].changeState(gameConfig.OBJECT_STATE_IDLE);
					 }
			}else if(this.users[userData.objectID].currentState === gameConfig.OBJECT_STATE_ATTACK){
				if(this.users[userData.objectID].conditions[gameConfig.USER_CONDITION_FREEZE]){
					this.users[userData.objectID].changeState(gameConfig.OBJECT_STATE_IDLE);
				}
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
	updateUserBuffImgData : function(userID, buffImgDataList){
		if(userID in this.users){
			this.users[userID].updateBuffImgData(buffImgDataList);
		}
	},
	updateSkillHitImgData : function(userID, skillImgData){
		if(userID in this.users){
			this.users[userID].updateSkillHitImgData(skillImgData);
		}
	},
	// set this client user
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
				this.user.onMainUserMove = onMainUserMoveHandler.bind(this, this.user);
			}
		}
		if(!this.user){
			console.log('if print me. Something is wrong');
		}
	},
	addRiseText : function(amount, color, position){
		var riseText = {text : amount, color : color, position : position};
		this.riseText.push(riseText);
		var thisRiseText = this.riseText;
		var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

		var tempInterval = setInterval(function(){
			riseText.position.y -= 1;
		}, INTERVAL_TIMER);
		setTimeout(function(){
			var index = thisRiseText.indexOf(riseText);
			if(index >= 0){
				thisRiseText.splice(index, 1);
			}
			clearInterval(tempInterval);
		}, gameConfig.RISE_TEXT_LIFE_TIME);
	},
	getUserHP : function(userID){
		if(userID in this.users){
			return this.users[userID].HP;
		}
	},
	getUserExp : function(userID){
		if(userID in this.users){
			return this.users[userID].exp;
		}
	},
	getUserCenter : function(userID){
		if(userID in this.users){
			return {
				x : this.users[userID].center.x,
				y : this.users[userID].center.y
			};
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
	for(var i=this.userEffects.length - 1; i>=0; i--){
		if(Date.now() - this.userEffects[i].startTime >= this.userEffects[i].resourceLifeTime){
			this.userEffects.splice(i, 1);
		}else if(Date.now() - this.userEffects[i].effectTimer >= gameConfig.USER_EFFECT_CHANGE_TIME){
			this.userEffects[i].changeIndex();
		}
	}
	if(Date.now() - this.userEffectTimer >= gameConfig.USER_EFFECT_CHANGE_TIME){
		for(var index in this.users){
			for(var i=0; i<this.users[index].buffImgDataList.length; i++){
				if(!this.users[index].buffImgDataList[i].isAttach){
					var userEffect = util.makeUserEffect(this.users[index], this.users[index].buffImgDataList[i]);
					this.userEffects.push(userEffect);
				}
			}
		}
		this.userEffectTimer = Date.now();
	}
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
					}, gameConfig.SKILL_HIT_EFFECT_TIME);
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
								 }, gameConfig.SKILL_HIT_EFFECT_TIME);
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
		}else{
			this.effects[i].scaleFactor = util.interpolationSine(Date.now() - this.effects[i].startTime, this.effects[i].lifeTime);
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
var onMainUserMoveHandler = function(user){
	this.onMainUserMove(user);
}
module.exports = CManager;

},{"../public/gameConfig.json":8,"../public/quadtree.min.js":9,"../public/resources.json":10,"../public/util.js":11,"./CObstacle.js":2,"./CUser.js":5}],2:[function(require,module,exports){
function CObstacle(posX, posY, radius, id, resourceData){
  this.objectID = id;

  this.imgData = resourceData;

  this.position = {
    x : posX, y : posY
  };
  // user when draw obstacle
  // this.localPosition = {
  //   x : posX, y : posY
  // };

  this.size = {
    width : radius * 2, height : radius * 2
  };
  this.center = {
    x : this.position.x + this.size.width/2,
    y : this.position.y + this.size.height/2
  }

  // this.setSize(radius * 2, radius * 2);
  // this.setPosition(posX, posY);

  this.staticEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID,

    isCollide : false
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
  }
};
module.exports = CObstacle;

},{}],3:[function(require,module,exports){
var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');

function CSkill(skillData, userAniStartTime){
  this.startTime = Date.now();

  this.index = skillData.index;
  this.type = skillData.type;
  this.property = skillData.property;

  this.consumeMP = skillData.consumeMP;
  this.totalTime = skillData.totalTime;
  this.fireTime = skillData.fireTime;
  this.range = skillData.range;
  this.explosionRadius = skillData.explosionRadius;

  this.radius = skillData.radius;
  this.maxSpeed = skillData.maxSpeed;
  this.lifeTime = skillData.lifeTime;

  this.direction = skillData.direction;
  this.targetPosition = skillData.targetPosition;

  this.userAniStartTime = userAniStartTime;
  this.effectLastTime = skillData.effectLastTime;

  this.effect = {
    position : this.targetPosition,
    radius : this.explosionRadius,
    startTime : 0,
    lifeTime  : this.effectLastTime
  };

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

    var skillInformTime = this.fireTime - gameConfig.SKILL_INFORM_TIME;
    if(skillInformTime < 0){
      skillInformTime = 0;
    }
    this.syncFireTime = Date.now() + this.fireTime; // for synchronize
    this.fireTimeout = setTimeout(fireTimeoutHandler.bind(this), skillInformTime);
    this.totalTimeout = setTimeout(totalTimeoutHandler.bind(this), this.totalTime);
  },
  startEffectTimer : function(){
    this.effect.startTime = Date.now();
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
  makeProjectile : function(userCenter, projectileID, direction){
    var forePosition = util.calcForePosition(userCenter, this.radius, direction, gameConfig.PROJECTILE_FIRE_DISTANCE);
    var projectile = new ProjectileSkill(this, forePosition, projectileID, direction)
    return projectile;
  }
};
function userAniTimeoutHandler(){
  this.onUserAniStart();
};
function fireTimeoutHandler(){
  console.log('fireSkill');
  this.onFire(this.syncFireTime);
};
function totalTimeoutHandler(){
  this.onTimeOver();
};

var ProjectileSkill = function(skillInstance, currentPosition, ID, direction){
  this.objectID = ID;

  this.index = skillInstance.index;
  this.position = {
    x : currentPosition.x,
    y : currentPosition.y
  };
  this.direction = direction;
  this.speed = {
    x : skillInstance.maxSpeed * Math.cos(this.direction * Math.PI/180),
    y : skillInstance.maxSpeed * Math.sin(this.direction * Math.PI/180)
  };
  // this.timer = Date.now();
  this.radius = skillInstance.radius;
  this.lifeTime = skillInstance.lifeTime;
  this.explosionRadius = skillInstance.explosionRadius;
};


module.exports = CSkill;

},{"../public/gameConfig.json":8,"../public/util.js":11}],4:[function(require,module,exports){
var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');
var skillTable, buffGroupTable;

var startScene, gameScene, standingScene;
var startButton, restartButton;

// var startSceneHudCenterCenterChar1, startSceneHudCenterCenterChar2, startSceneHudCenterCenterChar3;
var characterType = 1;

var baseSkill = 0;
var baseSkillData = null;
var inherentPassiveSkill = 0;
var inherentPassiveSkillData = null;
var equipSkills = new Array(4);
var equipSkillDatas = new Array(4);
var possessSkills = [];

var statPower = 0, statMagic = 0, statSpeed = 0;
var cooldownReduceRate = 0;

var hudBaseSkillImg, hudEquipSkill1Img, hudEquipSkill2Img, hudEquipSkill3Img, hudEquipSkill4Img, hudPassiveSkillImg;
var hudBtnSkillChange;
var gameSceneBuffsContainer;
var userHPProgressBar, userMPProgressBar, userExpProgressBar;

var isUseableBaseSkill = true, isUseableEquipSkill1 = true, isUseableEquipSkill2 = true, isUseableEquipSkill3 = true, isUseableEquipSkill4 = true;
var hudBaseSkillMask, hudEquipSkill1Mask, hudEquipSkill2Mask, hudEquipSkill3Mask, hudEquipSkill4Mask;
var hudBaseSkillBlockMask, hudEquipSkill1BlockMask, hudEquipSkill2BlockMask, hudEquipSkill3BlockMask, hudEquipSkill4BlockMask, hudPassiveSkillBlockMask;
var userStatPowerContainer, userStatMagicContainer, userStatSpeedContainer;
var gameSceneHudTopCenter, selectSkillIcon, selectSkillInfo, btnSelectSkillCancel;
var goldContainer, jewelContainer, gameSceneHudTopRight;
var gameSceneDeadScene, deadSceneText;
var flashMessageContainer;

var popUpSkillChange, popUpSkillContainer, popUpBackground;
var popUpSkillInfoIcon, popUpSkillInfoDesc, popUpSkillUpgradeCostGold, popUpSkillUpgradeCostJewel, popUpSkillUpgradeBtn;
var popUpEquipBaseSkill, popUpEquipSkill1, popUpEquipSkill2, popUpEquipSkill3, popUpEquipSkill4, popUpEquipPassiveSkill;

var miniMapUser, miniMapChest1, miniMapChest2, miniMapChest3, miniMapChest4, miniMapChest5, miniMapChest6, miniMapChest7, miniMapChest8, miniMapChest9;
var blankImg = '../css/blankFrame.png';

var selectedPanel = null;
var selectedDiv = null;
var selectedEquipIndex = null;
var selectedSkillIndex = null;

var isServerResponse = true;

function UIManager(sTable, bTable){
  skillTable = sTable;
  buffGroupTable = bTable;

  this.serverResponseTimeout = false;

  this.onStartBtnClick = new Function();

  this.onSelectSkillCancelBtnClick = new Function();
  this.onSkillIconClick = new Function();
  this.onSkillUpgrade = new Function();
  this.onExchangeSkill = new Function();
  this.onExchangePassive = new Function();
  this.onEquipPassive = new Function();
  this.onUnequipPassive = new Function();
};
UIManager.prototype = {
  initStartScene : function(){
    startScene = document.getElementById('startScene');
    gameScene = document.getElementById('gameScene');
    standingScene = document.getElementById('standingScene');
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    // startButton.addEventListener('click', startBtnClickHandler.bind(this, startButton), false);
    startButton.onclick = startBtnClickHandler.bind(this, startButton);

    var children = document.getElementById('startSceneHudCenterCenterCharSelect').children;
    for(var i=0; i<children.length; i++){
      children[i].onclick = function(){
        var type = parseInt(this.getAttribute('type'));
        characterType = type;
        for(var j=0; j<children.length; j++){
          children[j].classList.remove('select');
        }
        this.classList.add('select');
      };
    }
  },
  disableStartScene : function(){
    startScene.classList.add('disable');
    startScene.classList.remove('enable');

    gameScene.classList.add('enable');
    gameScene.classList.remove('disable');

    startButton.onclick = '';
    // startButton.removeEventListener('click', startBtnClickHandler);
  },
  initStandingScene : function(){
    // restartButton.addEventListener('click', startBtnClickHandler.bind(this, restartButton), false);
    restartButton.onclick = startBtnClickHandler.bind(this, restartButton);

    var children = document.getElementById('standingSceneHudCenterCenterCharSelect').children;
    for(var i=0; i<children.length; i++){
      children[i].onclick = function(){
        var type = parseInt(this.getAttribute('type'));
        characterType = type;
        for(var j=0; j<children.length; j++){
          children[j].classList.remove('select');
        }
        this.classList.add('select');
      };
    }
  },
  disableStandingScene : function(){
    standingScene.classList.add('disable');
    standingScene.classList.remove('enable');

    gameScene.classList.add('enable');
    gameScene.classList.remove('disable');

    restartButton.onclick = '';
    // restartButton.removeEventListener('click', startBtnClickHandler);
  },
  initHUD : function(){
    hudBaseSkillImg = document.getElementById('hudBaseSkillImg');
    hudEquipSkill1Img = document.getElementById('hudEquipSkill1Img');
    hudEquipSkill2Img = document.getElementById('hudEquipSkill2Img');
    hudEquipSkill3Img = document.getElementById('hudEquipSkill3Img');
    hudEquipSkill4Img = document.getElementById('hudEquipSkill4Img');
    hudPassiveSkillImg = document.getElementById('hudPassiveSkillImg');

    hudBaseSkillImg.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudBaseSkillImg, gameConfig.SKILL_BASIC_INDEX), false);
    hudEquipSkill1Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill1Img, gameConfig.SKILL_EQUIP1_INDEX), false);
    hudEquipSkill2Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill2Img, gameConfig.SKILL_EQUIP2_INDEX), false);
    hudEquipSkill3Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill3Img, gameConfig.SKILL_EQUIP3_INDEX), false);
    hudEquipSkill4Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill4Img, gameConfig.SKILL_EQUIP4_INDEX), false);
    hudPassiveSkillImg.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudPassiveSkillImg, gameConfig.SKILL_PASSIVE_INDEX), false);

    hudBaseSkillImg.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudBaseSkillImg), false);
    hudEquipSkill1Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill1Img), false);
    hudEquipSkill2Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill2Img), false);
    hudEquipSkill3Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill3Img), false);
    hudEquipSkill4Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill4Img), false);
    hudPassiveSkillImg.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudPassiveSkillImg), false);

    hudBaseSkillImg.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_BASIC_INDEX);
    hudEquipSkill1Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP1_INDEX);
    hudEquipSkill2Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP2_INDEX);
    hudEquipSkill3Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP3_INDEX);
    hudEquipSkill4Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP4_INDEX);

    hudBtnSkillChange = document.getElementById('hudBtnSkillChange');

    gameSceneBuffsContainer = document.getElementById('gameSceneBuffsContainer');
    userHPProgressBar = document.getElementById('userHPProgressBar');
    userExpProgressBar = document.getElementById('userExpProgressBar');
    userMPProgressBar = document.getElementById('userMPProgressBar');

    hudBaseSkillMask = document.getElementById('hudBaseSkillMask');
    hudEquipSkill1Mask = document.getElementById('hudEquipSkill1Mask');
    hudEquipSkill2Mask = document.getElementById('hudEquipSkill2Mask');
    hudEquipSkill3Mask = document.getElementById('hudEquipSkill3Mask');
    hudEquipSkill4Mask = document.getElementById('hudEquipSkill4Mask');

    hudBaseSkillMask.addEventListener('animationend', cooldownListener.bind(hudBaseSkillMask, gameConfig.SKILL_BASIC_INDEX), false);
    hudEquipSkill1Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill1Mask, gameConfig.SKILL_EQUIP1_INDEX), false);
    hudEquipSkill2Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill2Mask, gameConfig.SKILL_EQUIP2_INDEX), false);
    hudEquipSkill3Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill3Mask, gameConfig.SKILL_EQUIP3_INDEX), false);
    hudEquipSkill4Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill4Mask, gameConfig.SKILL_EQUIP4_INDEX), false);

    hudBaseSkillBlockMask = document.getElementById('hudBaseSkillBlockMask');
    hudEquipSkill1BlockMask = document.getElementById('hudEquipSkill1BlockMask');
    hudEquipSkill2BlockMask = document.getElementById('hudEquipSkill2BlockMask');
    hudEquipSkill3BlockMask = document.getElementById('hudEquipSkill3BlockMask');
    hudEquipSkill4BlockMask = document.getElementById('hudEquipSkill4BlockMask');
    hudPassiveSkillBlockMask = document.getElementById('hudPassiveSkillBlockMask');

    userStatPowerContainer = document.getElementById('userStatPowerContainer');
    userStatMagicContainer = document.getElementById('userStatMagicContainer');
    userStatSpeedContainer = document.getElementById('userStatSpeedContainer');

    userStatPowerContainer.addEventListener('mouseover', bottomTooltipOnHandler.bind(userStatPowerContainer, gameConfig.STAT_POWER_INDEX), false);
    userStatMagicContainer.addEventListener('mouseover', bottomTooltipOnHandler.bind(userStatMagicContainer, gameConfig.STAT_MAGIC_INDEX), false);
    userStatSpeedContainer.addEventListener('mouseover', bottomTooltipOnHandler.bind(userStatSpeedContainer, gameConfig.STAT_SPEED_INDEX), false);

    userStatPowerContainer.addEventListener('mouseout', bottomTooltipOffHandler.bind(userStatPowerContainer), false);
    userStatMagicContainer.addEventListener('mouseout', bottomTooltipOffHandler.bind(userStatMagicContainer), false);
    userStatSpeedContainer.addEventListener('mouseout', bottomTooltipOffHandler.bind(userStatSpeedContainer), false);

    miniMapUser = document.getElementById('miniMapUser');
    miniMapChest1 = document.getElementById('miniMapChest1');
    miniMapChest2 = document.getElementById('miniMapChest2');
    miniMapChest3 = document.getElementById('miniMapChest3');
    miniMapChest4 = document.getElementById('miniMapChest4');
    miniMapChest5 = document.getElementById('miniMapChest5');
    miniMapChest6 = document.getElementById('miniMapChest6');
    miniMapChest7 = document.getElementById('miniMapChest7');
    miniMapChest8 = document.getElementById('miniMapChest8');
    miniMapChest9 = document.getElementById('miniMapChest9');

    gameSceneHudTopCenter = document.getElementById('gameSceneHudTopCenter');
    selectSkillIcon = document.getElementById('selectSkillIcon');
    selectSkillInfo = document.getElementById('selectSkillInfo');
    btnSelectSkillCancel = document.getElementById('btnSelectSkillCancel');
    btnSelectSkillCancel.onclick = onSelectSkillCancelBtnClickHandler.bind(this);
    goldContainer = document.getElementById('goldContainer');
    jewelContainer = document.getElementById('jewelContainer');
    gameSceneHudTopRight = document.getElementById('gameSceneHudTopRight');

    gameSceneDeadScene = document.getElementById('gameSceneDeadScene');
    deadSceneText = document.getElementById('deadSceneText');

    flashMessageContainer = document.getElementById('flashMessageContainer');
  },
  drawStartScene : function(){
    // startScene.classList.add('enable');
    // startScene.classList.remove('disable');
    // gameScene.classList.add('disable');
    // gameScene.classList.remove('enable');
    // standingScene.classList.add('disable');
    // standingScene.classList.remove('enable');
  },
  drawGameScene : function(){

  },
  drawRestartScene : function(){
    // startScene.classList.add('disable');
    // startScene.classList.remove('enable');
    gameScene.classList.add('disable');
    gameScene.classList.remove('enable');
    standingScene.classList.add('enable');
    standingScene.classList.remove('disable');
  },
  enableSelectSkillInfo : function(skillData){
    selectSkillIcon.src = skillData.skillIcon;
    selectSkillInfo.innerHTML = skillData.name;

    gameSceneHudTopCenter.classList.add('enable');
    gameSceneHudTopCenter.classList.remove('disable');

    switch (skillData.index) {
      case baseSkill:
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[0]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[1]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[2]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[3]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      default:
    }
  },
  disableSelectSkillInfo : function(){
    selectSkillIcon.src = "";
    selectSkillInfo.innerHTML = "";

    gameSceneHudTopCenter.classList.add('disable');
    gameSceneHudTopCenter.classList.remove('enable');

    hudBaseSkillBlockMask.classList.add('disable');
    hudEquipSkill1BlockMask.classList.add('disable');
    hudEquipSkill2BlockMask.classList.add('disable');
    hudEquipSkill3BlockMask.classList.add('disable');
    hudEquipSkill4BlockMask.classList.add('disable');
    hudPassiveSkillBlockMask.classList.add('disable');
  },
  syncSkills : function(bSkill, bSkillData, eSkills, eSkillDatas, pSkills, iSkill, iSkillData){
    baseSkill = bSkill;
    baseSkillData = bSkillData;
    equipSkills = eSkills;
    equipSkillDatas = eSkillDatas;
    possessSkills = pSkills;
    inherentPassiveSkill = iSkill;
    inherentPassiveSkillData = iSkillData;
  },
  updatePossessionSkills : function(pSkills){
    possessSkills = pSkills;
  },
  updateHP : function(userData){
    var percent = userData.HP/userData.maxHP * 100;
    if(percent > 100){
      percent = 100;
    }
    userHPProgressBar.style.height = percent + "%";
  },
  updateMP : function(userData){
    var percent = userData.MP/userData.maxMP * 100;
    if(percent > 100){
      percent = 100;
    }
    userMPProgressBar.style.height = percent + "%";
  },
  updateExp : function(userData, needExp){
    var percent = userData.exp / needExp * 100;
    if(percent > 100){
      percent = 100;
    }
    userExpProgressBar.style.width = percent + "%";
  },
  applySkill : function(skillIndex){
    //check skill slot
    var slotMask = null;
    if(baseSkill === skillIndex){
      slotMask = hudBaseSkillMask;
      isUseableBaseSkill = false;
    }else if(equipSkills[0] === skillIndex){
      slotMask = hudEquipSkill1Mask;
      isUseableEquipSkill1 = false;
    }else if(equipSkills[1] === skillIndex){
      slotMask = hudEquipSkill2Mask;
      isUseableEquipSkill2 = false;
    }else if(equipSkills[2] === skillIndex){
      slotMask = hudEquipSkill3Mask;
      isUseableEquipSkill3 = false;
    }else if(equipSkills[3] === skillIndex){
      slotMask = hudEquipSkill4Mask;
      isUseableEquipSkill4 = false;
    }else{
      console.log('cant find skill slot');
    }
    //cooldown start
    if(slotMask){
      var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
      var cooldown = skillData.cooldown * (100 - cooldownReduceRate) / 100000;
      slotMask.style.animationDuration = (cooldown) + 's';
      slotMask.classList.add("cooldownMaskAni");
    }
  },
  checkCooltime : function(skillSlot){
    switch (skillSlot) {
      case gameConfig.SKILL_BASIC_INDEX:
        return isUseableBaseSkill;
      case gameConfig.SKILL_EQUIP1_INDEX:
        return isUseableEquipSkill1;
      case gameConfig.SKILL_EQUIP2_INDEX:
        return isUseableEquipSkill2;
      case gameConfig.SKILL_EQUIP3_INDEX:
        return isUseableEquipSkill3;
      case gameConfig.SKILL_EQUIP4_INDEX:
        return isUseableEquipSkill4;
      default:
        return false;
    }
  },
  setHUDSkills : function(){
    hudBaseSkillImg.src = baseSkillData ? baseSkillData.skillIcon : blankImg;
    hudEquipSkill1Img.src = equipSkillDatas[0] ? equipSkillDatas[0].skillIcon : blankImg;
    hudEquipSkill2Img.src = equipSkillDatas[1] ? equipSkillDatas[1].skillIcon : blankImg;
    hudEquipSkill3Img.src = equipSkillDatas[2] ? equipSkillDatas[2].skillIcon : blankImg;
    hudEquipSkill4Img.src = equipSkillDatas[3] ? equipSkillDatas[3].skillIcon : blankImg;
    hudPassiveSkillImg.src = inherentPassiveSkillData ? inherentPassiveSkillData.skillIcon : blankImg;
  },
  setHUDStats : function(power, magic, speed){
    userStatPowerContainer.children[1].innerHTML = statPower = power;
    userStatMagicContainer.children[1].innerHTML = statMagic = magic;
    userStatSpeedContainer.children[1].innerHTML = statSpeed = speed;
  },
  setCooldownReduceRate : function(reduceRate){
    cooldownReduceRate = reduceRate;
  },
  setSkillChangeBtn : function(){
    hudBtnSkillChange.onclick = function(){
      clearSelectedPanel();
      clearPopSkillChangeClass();
      popChange(popUpSkillChange);
    }
    popUpBackground.onclick = function(){
      clearSelectedPanel();
      clearPopSkillChangeClass();
      popChange(popUpSkillChange);
    }
  },
  getResource : function(resourceData){
    goldContainer.innerHTML = resourceData.gold;
    jewelContainer.innerHTML = resourceData.jewel;
  },
  updateBuffIcon : function(passiveList, buffList){
    while(gameSceneBuffsContainer.firstChild){
      gameSceneBuffsContainer.removeChild(gameSceneBuffsContainer.firstChild);
    }
    gameSceneBuffsContainer.innerHtml = '';
    if(inherentPassiveSkillData){
      var buffGroupData = Object.assign({}, util.findData(buffGroupTable, 'index', inherentPassiveSkillData.buffToSelf));
      var div = document.createElement('div');
      div.setAttribute('buffGroupIndex', inherentPassiveSkillData.buffToSelf);
      var img = document.createElement('img');
      img.src = buffGroupData.buffIcon;
      div.appendChild(img);
      gameSceneBuffsContainer.appendChild(div);
      div.addEventListener('mouseover', bottomTooltipOnHandler.bind(div, gameConfig.BUFF_ICON_INDEX));
      div.addEventListener('mouseout', bottomTooltipOffHandler.bind(div), false);
    }
    if(passiveList){
      for(var i=0; i<passiveList.length; i++){
        var passiveData = Object.assign({}, util.findData(buffGroupTable, 'index', passiveList[i]));
        var div = document.createElement('div');
        div.setAttribute('buffGroupIndex', passiveData.index);
        var img = document.createElement('img');
        img.src = passiveData.buffIcon;
        div.appendChild(img);
        gameSceneBuffsContainer.appendChild(div);
        div.addEventListener('mouseover', bottomTooltipOnHandler.bind(div, gameConfig.BUFF_ICON_INDEX));
        div.addEventListener('mouseout', bottomTooltipOffHandler.bind(div), false);
      }
    }
    if(buffList){
      for(var i=0; i<buffList.length; i++){
        var buffData = Object.assign({}, util.findData(buffGroupTable, 'index', buffList[i].index));
        var lifeTime = buffData.buffLifeTime;
        var pastTime = Date.now() - buffList[i].startTime;
        var buffListItem = buffList[i];

        var div = document.createElement('div');
        div.setAttribute('buffGroupIndex', buffData.index);
        var img = document.createElement('img');
        img.src = buffData.buffIcon;
        div.appendChild(img);
        gameSceneBuffsContainer.appendChild(div);
        div.addEventListener('mouseover', bottomTooltipOnHandler.bind(div, gameConfig.BUFF_ICON_INDEX));
        div.addEventListener('mouseout', bottomTooltipOffHandler.bind(div), false);

        var checkBuffLifeTimeHandler = function(){
          pastTime = Date.now() - buffListItem.startTime;
          if(lifeTime - pastTime <= 5000){
            div.classList.add('buffBeforeEndAni');
          }else{
            setTimeout(checkBuffLifeTimeHandler, 100);
          }
        }
        setTimeout(checkBuffLifeTimeHandler, 100);
      }
    }
  },
  initPopUpSkillChanger : function(){
    popUpSkillChange = document.getElementById('popUpSkillChange');
    popUpSkillContainer = document.getElementById('popUpSkillContainer');
    popUpBackground = document.getElementById('popUpBackground');

    popUpSkillInfoIcon = document.getElementById('popUpSkillInfoIcon');
    popUpSkillInfoDesc = document.getElementById('popUpSkillInfoDesc');
    popUpSkillUpgradeCostGold = document.getElementById('popUpSkillUpgradeCostGold');
    popUpSkillUpgradeCostJewel = document.getElementById('popUpSkillUpgradeCostJewel');
    popUpSkillUpgradeBtn = document.getElementById('popUpSkillUpgradeBtn');

    popUpEquipBaseSkill = document.getElementById('popUpEquipBaseSkill');
    popUpEquipSkill1 = document.getElementById('popUpEquipSkill1');
    popUpEquipSkill2 = document.getElementById('popUpEquipSkill2');
    popUpEquipSkill3 = document.getElementById('popUpEquipSkill3');
    popUpEquipSkill4 = document.getElementById('popUpEquipSkill4');
    popUpEquipPassiveSkill = document.getElementById('popUpEquipPassiveSkill');
  },
  upgradeBaseSkill : function(afterSkillIndex, afterSkillData){
    var beforeSkillIndex = baseSkill;
    baseSkill = afterSkillIndex;
    baseSkillData = afterSkillData;
    if(selectedSkillIndex === beforeSkillIndex){
      this.updateSelectedPanel(afterSkillIndex);
    }
    this.updateSkillImageAndIndex(beforeSkillIndex, afterSkillIndex);
    isServerResponse = true;
    if(this.serverResponseTimeout){
      clearTimeout(this.serverResponseTimeout);
      this.serverResponseTimeout = false;
    }
  },
  upgradeInherentSkill : function(afterSkillIndex, afterSkillData){
    var beforeSkillIndex = inherentPassiveSkill;
    inherentPassiveSkill = afterSkillIndex;
    inherentPassiveSkillData = afterSkillData;
    if(selectedSkillIndex === beforeSkillIndex){
      this.updateSelectedPanel(afterSkillIndex);
    }
    this.updateSkillImageAndIndex(beforeSkillIndex, afterSkillIndex);
    isServerResponse = true;
    if(this.serverResponseTimeout){
      clearTimeout(this.serverResponseTimeout);
      this.serverResponseTimeout = false;
    }
  },
  upgradePossessionSkill : function(beforeSkillIndex, afterSkillIndex){
    for(var i=0; i<possessSkills.length; i++){
      if(possessSkills[i] === beforeSkillIndex){
        var index = possessSkills.indexOf(beforeSkillIndex);
        possessSkills.splice(index, 1, afterSkillIndex);
        break;
      }
    }
    for(var i=0; i<equipSkills.length; i++){
      if(equipSkills[i] === beforeSkillIndex){
        var index = equipSkills.indexOf(beforeSkillIndex);
        equipSkills.splice(index, 1, afterSkillIndex);
        var skillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
        equipSkillDatas.splice(index, 1, skillData);
        break;
      }
    }
    if(selectedSkillIndex === beforeSkillIndex){
      this.updateSelectedPanel(afterSkillIndex);
    }
    this.updateSkillImageAndIndex(beforeSkillIndex, afterSkillIndex);
    isServerResponse = true;
    if(this.serverResponseTimeout){
      clearTimeout(this.serverResponseTimeout);
      this.serverResponseTimeout = false;
    }
  },
  updateSkillImageAndIndex : function(beforeSkillIndex, afterSkillIndex){
    var divs = document.querySelectorAll('[skillIndex="' + beforeSkillIndex + '"]');
    var afterData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
    for(var i=0; i<divs.length; i++){
      divs[i].setAttribute('skillIndex', afterSkillIndex);
      divs[i].getElementsByTagName('img')[0].src = afterData.skillIcon;
    }
    this.setHUDSkills()
  },
  setPopUpSkillChange : function(){
    while (popUpSkillContainer.firstChild) {
      popUpSkillContainer.removeChild(popUpSkillContainer.firstChild);
    }
    while(popUpEquipBaseSkill.firstChild){
      popUpEquipBaseSkill.removeChild(popUpEquipBaseSkill.firstChild);
    }
    while(popUpEquipSkill1.firstChild){
      popUpEquipSkill1.removeChild(popUpEquipSkill1.firstChild);
    }
    while(popUpEquipSkill2.firstChild){
      popUpEquipSkill2.removeChild(popUpEquipSkill2.firstChild);
    }
    while(popUpEquipSkill3.firstChild){
      popUpEquipSkill3.removeChild(popUpEquipSkill3.firstChild);
    }
    while(popUpEquipSkill4.firstChild){
      popUpEquipSkill4.removeChild(popUpEquipSkill4.firstChild);
    }
    while(popUpEquipPassiveSkill.firstChild){
      popUpEquipPassiveSkill.removeChild(popUpEquipPassiveSkill.firstChild);
    }

    var baseImg = document.createElement('img');
    baseImg.src = baseSkillData.skillIcon;
    popUpEquipBaseSkill.setAttribute('skillIndex', baseSkill);
    popUpEquipBaseSkill.appendChild(baseImg);
    popUpEquipBaseSkill.onclick = changeEquipSkillHandler.bind(this, popUpEquipBaseSkill, gameConfig.SKILL_CHANGE_PANEL_EQUIP);

    var inherentPassiveSkillImg = document.createElement('img');
    inherentPassiveSkillImg.src = inherentPassiveSkillData.skillIcon;
    popUpEquipPassiveSkill.setAttribute('skillIndex', inherentPassiveSkill);
    popUpEquipPassiveSkill.appendChild(inherentPassiveSkillImg);
    popUpEquipPassiveSkill.onclick = changeEquipSkillHandler.bind(this, popUpEquipPassiveSkill, gameConfig.SKILL_CHANGE_PANEL_EQUIP);

    if(equipSkillDatas[0]){
      var equipSkills1 = document.createElement('img');
      equipSkills1.src = equipSkillDatas[0].skillIcon;
      popUpEquipSkill1.setAttribute('skillIndex', equipSkillDatas[0].index);
      popUpEquipSkill1.appendChild(equipSkills1);
    }
    if(equipSkillDatas[1]){
      var equipSkills2 = document.createElement('img');
      equipSkills2.src = equipSkillDatas[1].skillIcon;
      popUpEquipSkill2.appendChild(equipSkills2);
    }
    if(equipSkillDatas[2]){
      var equipSkills3 = document.createElement('img');
      equipSkills3.src = equipSkillDatas[2].skillIcon;
      popUpEquipSkill3.appendChild(equipSkills3);
      }
    if(equipSkillDatas[3]){
      var equipSkills4 = document.createElement('img');
      equipSkills4.src = equipSkillDatas[3].skillIcon;
      popUpEquipSkill4.appendChild(equipSkills4);
    }
    popUpEquipSkill1.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill1, gameConfig.SKILL_CHANGE_PANEL_EQUIP);
    popUpEquipSkill2.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill2, gameConfig.SKILL_CHANGE_PANEL_EQUIP);
    popUpEquipSkill3.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill3, gameConfig.SKILL_CHANGE_PANEL_EQUIP);
    popUpEquipSkill4.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill4, gameConfig.SKILL_CHANGE_PANEL_EQUIP);

    var equipSkillIndexes = [];
    equipSkillIndexes.push(baseSkill);
    for(var i=0; i<equipSkills.length; i++){
      equipSkillIndexes.push(equipSkills[i]);
    }

    for(var i=0; i<possessSkills.length; i++){
      var isEquipSkill = false;
      for(var j=0; j<equipSkillIndexes.length; j++){
        if(equipSkillIndexes[j] === possessSkills[i]){
          isEquipSkill = true;
        }
      }
      if(!isEquipSkill){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', possessSkills[i]));
        var skillDiv = document.createElement('div');
        var skillImg = document.createElement('img');

        skillDiv.setAttribute('skillIndex', possessSkills[i]);

        skillDiv.classList.add('popUpSkillContainerItem');
        skillImg.src = skillData.skillIcon;
        skillDiv.appendChild(skillImg);
        popUpSkillContainer.appendChild(skillDiv);

        skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
      }
    }
  },
  updateSelectedPanel : function(skillIndex){
    if(skillIndex){
      while(popUpSkillInfoIcon.firstChild){
        popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
      }
      while(popUpSkillInfoDesc.firstChild){
        popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
      }
      selectedSkillIndex = skillIndex;

      var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
      var skillImg = document.createElement('img');
      var skillDesc = document.createElement('p');

      skillImg.src = skillData.skillIcon;
      skillDesc.innerHTML = skillData.clientName;
      popUpSkillUpgradeCostGold.innerHTML = skillData.upgradeGoldAmount;
      popUpSkillUpgradeCostJewel.innerHTML = skillData.upgradeJewelAmount;

      popUpSkillInfoIcon.appendChild(skillImg);
      popUpSkillInfoDesc.appendChild(skillDesc);
      // popUpSkillUpgradeBtn.addEventListener('click', skillUpgradeBtnHandler, false);
      popUpSkillUpgradeBtn.onclick = skillUpgradeBtnHandler.bind(this, skillData);
    }else{
      popUpSkillUpgradeBtn.onclick = new Function();
    }
  },
  setBoard : function(userDatas, userID){
    var rank = [];
    var userRank = 0;
    userDatas.sort(function(a, b){
      return b.killScore - a.killScore;
    });
    for(var i=0; i<userDatas.length; i++){
      if(userID === userDatas[i].objectID){
        userRank = i + 1;
      }
      rank.push({rank : i + 1, name : userDatas[i].objectID, kill : userDatas[i].killScore });
    }
    var output = "";
    var length = rank.length > 10 ? 10 : rank.length;
    for(var i=0; i<length; i++){
      output += rank[i].rank + ' : ' + rank[i].name + ' : ' + rank[i].kill + '<br>';
    }
    if(userRank > 10){
      output += rank[i].rank + ' : ' + rank[i].name + ' : ' + rank[i].kill;
    }
    gameSceneHudTopRight.innerHTML = "";
    gameSceneHudTopRight.innerHTML = output;
  },
  updateBoard : function(userDatas, userID){
    this.setBoard(userDatas, userID);
  },
  setMiniMapChests : function(chestDatas, chestLocationDatas){
    miniMapChest1.setAttribute('locationID', chestLocationDatas[0].id);
    miniMapChest1.style.left = Math.floor(chestLocationDatas[0].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest1.style.top = Math.floor(chestLocationDatas[0].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest2.setAttribute('locationID', chestLocationDatas[1].id);
    miniMapChest2.style.left = Math.floor(chestLocationDatas[1].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest2.style.top = Math.floor(chestLocationDatas[1].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest3.setAttribute('locationID', chestLocationDatas[2].id);
    miniMapChest3.style.left = Math.floor(chestLocationDatas[2].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest3.style.top = Math.floor(chestLocationDatas[2].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest4.setAttribute('locationID', chestLocationDatas[3].id);
    miniMapChest4.style.left = Math.floor(chestLocationDatas[3].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest4.style.top = Math.floor(chestLocationDatas[3].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest5.setAttribute('locationID', chestLocationDatas[4].id);
    miniMapChest5.style.left = Math.floor(chestLocationDatas[4].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest5.style.top = Math.floor(chestLocationDatas[4].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest6.setAttribute('locationID', chestLocationDatas[5].id);
    miniMapChest6.style.left = Math.floor(chestLocationDatas[5].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest6.style.top = Math.floor(chestLocationDatas[5].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest7.setAttribute('locationID', chestLocationDatas[6].id);
    miniMapChest7.style.left = Math.floor(chestLocationDatas[6].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest7.style.top = Math.floor(chestLocationDatas[6].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest8.setAttribute('locationID', chestLocationDatas[7].id);
    miniMapChest8.style.left = Math.floor(chestLocationDatas[7].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest8.style.top = Math.floor(chestLocationDatas[7].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest9.setAttribute('locationID', chestLocationDatas[8].id);
    miniMapChest9.style.left = Math.floor(chestLocationDatas[8].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest9.style.top = Math.floor(chestLocationDatas[8].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';

    // var parentDiv = miniMapChest1.parentNode;
    var childDivs = miniMapChest1.parentNode.getElementsByTagName('div');
    for(var i=1; i<childDivs.length; i++){
      childDivs[i].classList.add('chestOff');
    }
    for(var i=0; i<chestDatas.length; i++){
      for(var j=1; j<childDivs.length; j++){
        var locationID = childDivs[j].getAttribute('locationID');
        if(chestDatas[i].locationID === locationID){
          childDivs[j].classList.remove('chestOff');
          childDivs[j].classList.add('chestOn');
          break;
        }
      }
    }
  },
  createChest : function(locationID){
    var childDivs = miniMapChest1.parentNode.getElementsByTagName('div');
    for(var i=0; i<childDivs.length; i++){
      if(locationID === childDivs[i].getAttribute('locationID')){
        childDivs[i].classList.remove('chestOff');
        childDivs[i].classList.add('chestOn');
        childDivs[i].classList.add('chestAni');
        var div = childDivs[i];
        setTimeout(function(){
          div.classList.remove('chestAni');
        }, gameConfig.CHEST_ANI_PLAY_TIME);
      }
    }
  },
  deleteChest : function(locationID){
    var childDivs = miniMapChest1.parentNode.getElementsByTagName('div');
    for(var i=0; i<childDivs.length; i++){
      if(locationID === childDivs[i].getAttribute('locationID')){
        childDivs[i].classList.add('chestOff');
        childDivs[i].classList.remove('chestOn');
      }
    }
  },
  setUserPosition : function(position){
    miniMapUser.style.left = Math.floor(position.x * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapUser.style.top = Math.floor(position.y * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
  },
  updateUserPosition : function(position){
    miniMapUser.style.left = Math.floor(position.x * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapUser.style.top = Math.floor(position.y * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
  },
  playDeadScene : function(killUser){
    if(killUser){
      var text = "You are dead by " + killUser;
    }else{
      text = "You are dead"
    }
    deadSceneText.innerHTML = text;
    gameSceneDeadScene.style.display = 'block';
    gameSceneDeadScene.classList.add('deadSceneAni');
  },
  disableDeadScene : function(){
    deadSceneText.innerHTML = '';
    gameSceneDeadScene.classList.remove('deadSceneAni');
    gameSceneDeadScene.style.display = 'none';
  }
};
function popChange(popWindow){
  if(popWindow.classList.contains('disable')){
    popWindow.classList.add('enable');
    popWindow.classList.remove('disable');
    popUpBackground.classList.add('enable');
    popUpBackground.classList.remove('disable');
  }else if(popWindow.classList.contains('enable')){
    popWindow.classList.add('disable');
    popWindow.classList.remove('enable');
    popUpBackground.classList.add('disable')
    popUpBackground.classList.remove('enable');
  }
};

function changeEquipSkillHandler(selectDiv, selectPanel){
  //clear selected and equipable class
  // if(selectedDiv){
  //   selectedDiv.classList.remove('selected');
  // }
  // popUpEquipSkill1.classList.remove('equipable');
  // popUpEquipSkill2.classList.remove('equipable');
  // popUpEquipSkill3.classList.remove('equipable');
  // popUpEquipSkill4.classList.remove('equipable');
  //
  // for(var i=0; i<popUpSkillContainer.children.length; i++){
  //   popUpSkillContainer.children[i].classList.remove('equipable');
  // }
  clearPopSkillChangeClass();
  var selectEquipIndex = null ;
  if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
    //set selectedEquipIndex
    if(selectDiv === popUpEquipBaseSkill){
      selectEquipIndex = -1;
    }else if(selectDiv === popUpEquipSkill1){
      selectEquipIndex = 0;
    }else if(selectDiv === popUpEquipSkill2){
      selectEquipIndex = 1;
    }else if(selectDiv === popUpEquipSkill3){
      selectEquipIndex = 2;
    }else if(selectDiv === popUpEquipSkill4){
      selectEquipIndex = 3;
    }else if(selectDiv === popUpEquipPassiveSkill){
      selectEquipIndex = -1;
    }
  }
  var skillIndex = parseInt(selectDiv.getAttribute('skillIndex'));

  if(selectedPanel){
    if(selectedPanel !== selectPanel){
      //exchange
      if(selectedPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
        //find skill in container
        //selected === equipSkill selectDiv === container skill
        if(selectEquipIndex === -1){
          makeFlashMessage('cant change base skill');
          // alert('cant change base skill');
        }else{
          var nodeIndex = 0;
          for(var i=0; i<popUpSkillContainer.childNodes.length; i++){
            if(popUpSkillContainer.childNodes[i] === selectedDiv){
              nodeIndex = i;
              break;
            }
          }
          popUpSkillContainer.removeChild(selectedDiv);
          if(skillIndex){
            var beforeSkillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
            var skillDiv = document.createElement('div');
            var skillImg = document.createElement('img');
            skillDiv.setAttribute('skillIndex', skillIndex);

            skillDiv.classList.add('popUpSkillContainerItem');
            skillImg.src = beforeSkillData.skillIcon;
            skillDiv.appendChild(skillImg);

            popUpSkillContainer.insertBefore(skillDiv, popUpSkillContainer.childNodes[nodeIndex]);
            // popUpSkillContainer.appendChild(skillDiv);

            skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
          }

          while (selectDiv.firstChild) {
            selectDiv.removeChild(selectDiv.firstChild);
          }

          //data change
          equipSkills.splice(selectEquipIndex, 1);
          equipSkillDatas.splice(selectEquipIndex, 1);

          equipSkills.splice(selectEquipIndex, 0, selectedSkillIndex);
          var skillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
          equipSkillDatas.splice(selectEquipIndex, 0, skillData);

          var skillImg = document.createElement('img');
          skillImg.src = skillData.skillIcon;
          selectDiv.setAttribute('skillIndex', skillData.index);
          selectDiv.appendChild(skillImg);
        }
      }else{
        if(selectedEquipIndex === -1){
          makeFlashMessage('cant change base skill');
          // alert('cant change base skill');
        }else{
          var nodeIndex = 0;
          for(var i=0; i<popUpSkillContainer.childNodes.length; i++){
            if(popUpSkillContainer.childNodes[i] === selectDiv){
              nodeIndex = i;
              break;
            }
          }
          popUpSkillContainer.removeChild(selectDiv);
          if(selectedSkillIndex){
            var beforeSkillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
            var skillDiv = document.createElement('div');
            var skillImg = document.createElement('img');

            skillDiv.setAttribute('skillIndex', selectedSkillIndex);

            skillDiv.classList.add('popUpSkillContainerItem');
            skillImg.src = beforeSkillData.skillIcon;
            skillDiv.appendChild(skillImg);
            popUpSkillContainer.insertBefore(skillDiv, popUpSkillContainer.childNodes[nodeIndex]);
            // popUpSkillContainer.appendChild(skillDiv);

            skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
          }

          while (selectedDiv.firstChild) {
            selectedDiv.removeChild(selectedDiv.firstChild);
          }

          //data change
          equipSkills.splice(selectedEquipIndex, 1);
          equipSkillDatas.splice(selectedEquipIndex, 1);

          equipSkills.splice(selectedEquipIndex, 0, skillIndex);
          var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
          equipSkillDatas.splice(selectedEquipIndex, 0, skillData);

          var skillImg = document.createElement('img');
          skillImg.src = skillData.skillIcon;
          selectedDiv.setAttribute('skillIndex', skillData.index);
          selectedDiv.appendChild(skillImg);
        }
      }
      this.onExchangeSkill();
      //set equipSkills
      if(skillData && beforeSkillData){
        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE && beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          console.log(beforeSkillData.index + ' : ' + skillData.index);
          var beforeBuffIndex = Object.assign({}, util.findData(skillTable, 'index', beforeSkillData.index)).buffToSelf;
          var afterBuffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          this.onExchangePassive(beforeBuffIndex, afterBuffIndex);
        }else if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          var buffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          this.onEquipPassive(buffIndex);
        }else if(beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = Object.assign({}, util.findData(skillTable, 'index', beforeSkillData.index)).buffToSelf;
          this.onUnequipPassive(buffIndex);
        }
      }else if(skillData){
        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          this.onEquipPassive(buffIndex);
        }
      }else if(beforeSkillData){
        if(beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = Object.assign({}, util.findData(skillTable, 'index', beforeSkillData.index)).buffToSelf;
          this.onUnequipPassive(buffIndex);
        }
      }

      this.setHUDSkills();

      selectedSkillIndex = null;
      selectedPanel = null;
      selectedDiv = null;
      selectedEquipIndex = null;

    }else if(skillIndex === selectedSkillIndex){
      //if click same icon
      if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP && selectEquipIndex !== -1){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
        var skillDiv = document.createElement('div');
        var skillImg = document.createElement('img');

        skillDiv.setAttribute('skillIndex', selectedSkillIndex);

        skillDiv.classList.add('popUpSkillContainerItem');
        skillImg.src = skillData.skillIcon;
        skillDiv.appendChild(skillImg);
        popUpSkillContainer.appendChild(skillDiv);

        skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);

        while (selectedDiv.firstChild) {
          selectedDiv.removeChild(selectedDiv.firstChild);
          selectedDiv.setAttribute('skillIndex', '');
        }

        //data delete
        if(equipSkills[selectedEquipIndex]){
          equipSkills.splice(selectedEquipIndex, 1);
          equipSkillDatas.splice(selectedEquipIndex, 1);
        }
        equipSkills.splice(selectedEquipIndex, 0, undefined);
        equipSkillDatas.splice(selectedEquipIndex, 0, undefined);

        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          var buffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          console.log(buffIndex);
          this.onUnequipPassive(buffIndex);
        }
      }

      this.setHUDSkills();

      selectedSkillIndex = null;
      selectedPanel = null;
      selectedDiv = null;
      selectedEquipIndex = null;
    }else{
      selectedSkillIndex = skillIndex ? skillIndex : null;
      selectedPanel = selectPanel;
      selectedDiv = selectDiv;
      selectedEquipIndex = selectEquipIndex;

      selectDiv.classList.add('selected');
      if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
        popUpEquipSkill1.classList.add('equipable');
        popUpEquipSkill2.classList.add('equipable');
        popUpEquipSkill3.classList.add('equipable');
        popUpEquipSkill4.classList.add('equipable');
      }else if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
        switch (selectEquipIndex) {
          case -1:
            //case base or inherentPassiveSkill
            break;
          default:
            for(var i=0; i<popUpSkillContainer.children.length; i++){
              popUpSkillContainer.children[i].classList.add('equipable');
            }
        }
      }
    }
  }else{
    selectedSkillIndex = skillIndex ? skillIndex : null;
    selectedPanel = selectPanel;
    selectedDiv = selectDiv;
    selectedEquipIndex = selectEquipIndex;

    selectDiv.classList.add('selected');
    if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
      popUpEquipSkill1.classList.add('equipable');
      popUpEquipSkill2.classList.add('equipable');
      popUpEquipSkill3.classList.add('equipable');
      popUpEquipSkill4.classList.add('equipable');
    }else if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
      switch (selectEquipIndex) {
        case -1:
          //case base or inherentPassiveSkill
          break;
        default:
          for(var i=0; i<popUpSkillContainer.children.length; i++){
            popUpSkillContainer.children[i].classList.add('equipable');
          }
      }
    }
  }
  this.updateSelectedPanel(selectedSkillIndex);
  // //set info panel
  // while (popUpSkillInfoIcon.firstChild) {
  //   popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
  // }
  // while (popUpSkillInfoDesc.firstChild) {
  //   popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
  // }
  // if(selectedSkillIndex){
  //   var skillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
  //   var skillImg = document.createElement('img');
  //   var skillDesc = document.createElement('p');
  //
  //   skillImg.src = skillData.skillIcon;
  //   skillDesc.innerHTML = skillData.clientName;
  //   popUpSkillUpgradeCostGold.innerHTML = skillData.upgradeGoldAmount;
  //   popUpSkillUpgradeCostJewel.innerHTML = skillData.upgradeJewelAmount;
  //
  //   popUpSkillInfoIcon.appendChild(skillImg);
  //   popUpSkillInfoDesc.appendChild(skillDesc);
  //   // popUpSkillUpgradeBtn.addEventListener('click', skillUpgradeBtnHandler, false);
  //   popUpSkillUpgradeBtn.onclick = skillUpgradeBtnHandler.bind(this)
  // }else{
  //   popUpSkillUpgradeBtn.onclick = new Function();
  //   // popUpSkillUpgradeBtn.removeEventListener('click', skillUpgradeBtnHandler, false);
  // }
  // console.log(selectedSkillIndex);
};
function skillUpgradeBtnHandler(skillData){
  if(isServerResponse){
    if(selectedSkillIndex){
      //check resource
      var goldAmount = parseInt(goldContainer.innerHTML);
      var jewelAmount = parseInt(jewelContainer.innerHTML);
      if(goldAmount >= skillData.upgradeGoldAmount && jewelAmount >= skillData.upgradeJewelAmount){
        this.onSkillUpgrade(selectedSkillIndex);
        isServerResponse = false;
        this.serverResponseTimeout = setTimeout(function(){
          if(!isServerResponse){
            isServerResponse = true;
          }
        }, gameConfig.MAX_SERVER_RESPONSE_TIME);
      }else{
        makeFlashMessage('need more resource');
        // alert('need more resource');
      }
    }
  }
};
function startBtnClickHandler(button){
  if(button === startButton){
    var clickButton = gameConfig.START_BUTTON;
  }else if(button === restartButton){
    clickButton = gameConfig.RESTART_BUTTON;
  }
  this.onStartBtnClick(characterType, clickButton);
};
function cooldownListener(slot, e){
  this.classList.remove("cooldownMaskAni");
  this.style.opacity = 0;
  switch (slot) {
    case gameConfig.SKILL_BASIC_INDEX:
      isUseableBaseSkill = true;
      break;
    case gameConfig.SKILL_EQUIP1_INDEX:
      isUseableEquipSkill1 = true;
      break;
    case gameConfig.SKILL_EQUIP2_INDEX:
      isUseableEquipSkill2 = true;
      break;
    case gameConfig.SKILL_EQUIP3_INDEX:
      isUseableEquipSkill3 = true;
      break;
    case gameConfig.SKILL_EQUIP4_INDEX:
      isUseableEquipSkill4 = true;
      break;
    default:
  }
};
function bottomSkillTooltipOnHandler(slot){
  switch (slot) {
    case gameConfig.SKILL_BASIC_INDEX:
      if(baseSkillData){
        var skillData = baseSkillData;
      }
      break;
    case gameConfig.SKILL_EQUIP1_INDEX:
      if(equipSkillDatas[0]){
        skillData = equipSkillDatas[0];
      }
      break;
    case gameConfig.SKILL_EQUIP2_INDEX:
      if(equipSkillDatas[1]){
        skillData = equipSkillDatas[1];
      }
      break;
    case gameConfig.SKILL_EQUIP3_INDEX:
      if(equipSkillDatas[2]){
        skillData = equipSkillDatas[2];
      }
      break;
    case gameConfig.SKILL_EQUIP4_INDEX:
      if(equipSkillDatas[3]){
        skillData = equipSkillDatas[3];
      }
      break;
    case gameConfig.SKILL_PASSIVE_INDEX:
      if(inherentPassiveSkillData){
        skillData = inherentPassiveSkillData;
      }
      break;
    default:
  }
  if(skillData){
    var tooltipDiv = document.createElement('div');
    tooltipDiv.innerHTML = skillData.name;
    tooltipDiv.classList.add('bottomTooltip');

    var parentDiv = this.parentNode;
    parentDiv.appendChild(tooltipDiv);
  }
};
function bottomSkillTooltipOffHandler(){
  var parentDiv = this.parentNode;
  var tooltipDivs = parentDiv.getElementsByTagName('div');
  for(var i=0; tooltipDivs.length; i++){
    parentDiv.removeChild(tooltipDivs[i]);
  }
};
function bottomTooltipOnHandler(type){
  var tooltipDiv = document.createElement('div');
  switch (type) {
    case gameConfig.STAT_POWER_INDEX:
      tooltipDiv.innerHTML = statPower;
      break;
    case gameConfig.STAT_MAGIC_INDEX:
      tooltipDiv.innerHTML = statMagic;
      break;
    case gameConfig.STAT_SPEED_INDEX:
      tooltipDiv.innerHTML = statSpeed;
      break;
    case gameConfig.BUFF_ICON_INDEX:
      var buffGroupIndex = parseInt(this.getAttribute('buffGroupIndex'));
      var buffGroupData = Object.assign({}, util.findData(buffGroupTable, 'index', buffGroupIndex));
      tooltipDiv.innerHTML = buffGroupData.name;
      break;
    default:
  }
  tooltipDiv.classList.add('bottomTooltip');
  this.appendChild(tooltipDiv);
};
function clearSelectedPanel(){
  while(popUpSkillInfoIcon.firstChild){
    popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
  }
  while(popUpSkillInfoDesc.firstChild){
    popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
  }
  selectedSkillIndex = null;
  popUpSkillUpgradeBtn.onclick = new Function();

  selectedPanel = null;
  selectedDiv = null;
  selectedEquipIndex = null;
};
function clearPopSkillChangeClass(){
  popUpEquipBaseSkill.classList.remove('selected');
  popUpEquipPassiveSkill.classList.remove('selected');
  popUpEquipSkill1.classList.remove('selected');
  popUpEquipSkill2.classList.remove('selected');
  popUpEquipSkill3.classList.remove('selected');
  popUpEquipSkill4.classList.remove('selected');

  popUpEquipSkill1.classList.remove('equipable');
  popUpEquipSkill2.classList.remove('equipable');
  popUpEquipSkill3.classList.remove('equipable');
  popUpEquipSkill4.classList.remove('equipable');

  for(var i=0; i<popUpSkillContainer.children.length; i++){
    popUpSkillContainer.children[i].classList.remove('equipable');
    popUpSkillContainer.children[i].classList.remove('selected');
  }
};
function bottomTooltipOffHandler(){
  var tooltipDivs = util.getElementsByClassName(this, 'bottomTooltip');
  for(var i=0; i<tooltipDivs.length; i++){
    this.removeChild(tooltipDivs[i]);
  }
};
function onSkillIconClickHandler(skillSlot){
  this.onSkillIconClick(skillSlot);
};
function onSelectSkillCancelBtnClickHandler(){
  this.onSelectSkillCancelBtnClick();
};
function makeFlashMessage(msg){
  var message = document.createElement('p');
  message.innerHTML = msg;
  message.classList.add('flashMessage');
  flashMessageContainer.appendChild(message);
  // centerMessageContainer.insertBefore(messageDiv, centerMessageContainer.childNodes[0]);
  setTimeout(function(){
    flashMessageContainer.removeChild(message);
  }, 5000);
};
module.exports = UIManager;

},{"../public/gameConfig.json":8,"../public/util.js":11}],5:[function(require,module,exports){
var util = require('../public/util.js');
var Skill = require('./CSkill.js');
var resources = require('../public/resources.json');
var gameConfig = require('../public/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

var User = function(userData){
  this.objectID = userData.objectID;

  this.type = userData.type
  this.imgData = userData.imgData;

  this.hitImgDataList = [];
  this.buffImgDataList = [];

  this.imgHandIndex = 0;

  this.level = userData.level;
  this.exp = userData.exp;

  this.maxHP = userData.maxHP;
  this.maxMP = userData.maxMP;
  this.HP = userData.HP;
  this.MP = userData.MP;
  this.castSpeed = userData.castSpeed;
  this.conditions = userData.conditions;

  this.currentState = null;
  this.currentSkill = undefined;
  //use for execute skill only once.
  this.isExecutedSkill = false;
  //Effect around user skill effect, when cast skill. skill onFire set false.
  this.skillCastEffectPlay = false;
  this.castEffectFactor = 1;

  this.effectTimer = Date.now();
  this.effectRotateDegree = 0;
  this.effectIndex = 0;

  this.size = userData.size;

  this.position = userData.position;
  this.targetPosition = userData.targetPosition;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.timer = Date.now();

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.imgHandTimeout = false;
  this.updateFunction = null;

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };

  this.onMove = new Function();
  this.onMainUserMove = new Function();
};

User.prototype = {
  changeState : function(newState){
    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = this.idle.bind(this);
        break;
      case gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      // case gameConfig.OBJECT_STATE_MOVE_OFFSET:
        // this.updateFunction = this.rotate.bind(this);
        // break;
      case gameConfig.OBJECT_STATE_ATTACK:
        this.updateFunction = this.attack.bind(this);
        break;
      case gameConfig.OBJECT_STATE_CAST:
        this.updateFunction = this.rotate.bind(this);
        break;
      case gameConfig.OBJECT_STATE_DEATH:
        this.updateFunction = this.idle.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  idle : function(){
    this.doEveryTick();
  },
  rotate : function(){
    var deltaTime = (Date.now() - this.timer)/1000;
    util.rotate.call(this, deltaTime);
    this.doEveryTick();
  },
  move : function(deltaTime, isMoveSlight){
    if(isMoveSlight){
      util.move.call(this, deltaTime, isMoveSlight)
    }else{
      util.move.call(this, deltaTime);
    }
    this.onMainUserMove();
  },
  setTargetDirection : function(){
    util.setTargetDirection.call(this);
  },
  setSpeed : function(){
    util.setSpeed.call(this);
  },
  moveOffset : function(){
    util.moveOffset.call(this);
  },
  attack : function(){
    this.executeSkill();
    this.doEveryTick();
  },
  doEveryTick : function(){
    this.timer = Date.now();
    if(Date.now() - this.effectTimer >= gameConfig.USER_EFFECT_CHANGE_TIME){
      this.effectTimer = Date.now();
      this.effectRotateDegree += 10;
      if(this.effectIndex > 100){
        this.effectIndex = 0;
      }else{
        this.effectIndex += 1;
      }
    }
    for(var i=this.hitImgDataList.length - 1; i>=0; i--){
      if(Date.now() - this.hitImgDataList[i].startTime <= this.hitImgDataList[i].resourceLifeTime){
        this.hitImgDataList.splice(i, 1);
      }
    }
  },
  updateBuffImgData : function(buffImgDataList){
    this.buffImgDataList = [];
    for(var i=0; i<buffImgDataList.length; i++){
      this.buffImgDataList.push(buffImgDataList[i]);
    }
  },
  updateSkillHitImgData : function(skillImgData){
    skillImgData.startTime = Date.now();
    this.hitImgDataList.push(skillImgData);
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
      this.skillCastEffectPlay = false;
    }
    if(this.imgHandTimeout){
      clearTimeout(this.imgHandTimeout);
      this.imgHandTimeout = false;
    }
    this.imgHandIndex = 0;
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
    var userAniTime = Math.floor(gameConfig.USER_ANI_TIME * (100 / this.castSpeed));
    var skillInstance = new Skill(skillData, skillData.fireTime - userAniTime);
    skillInstance.onUserAniStart = onCastSkillHandler.bind(this, skillInstance, userAniTime);
    skillInstance.onTimeOver = onTimeOverHandler.bind(this, skillInstance);
    return skillInstance;
  },
  setSkill : function(skillInstance){
    this.currentSkill = skillInstance;
  },
  executeSkill : function(){
    if(!this.isExecutedSkill){
      this.skillCastEffectPlay = true;
      this.skillCastEffectStartTime = Date.now();
      this.isExecutedSkill = true;
      this.currentSkill.executeSkill();
    }
    this.setCastEffectFactor();
  },
  setCastEffectFactor : function(){
    var timeDiff = Date.now() - this.skillCastEffectStartTime;
    this.castEffectFactor = util.interpolationSine(timeDiff);
  },
  updateSkillPossessions : function(possessSkills){
    this.possessSkills = possessSkills;
    console.log('updateSkillPossessions');
    console.log(this.possessSkills);
  },
  makeProjectile : function(projectileID, skillInstance, direction){
    var projectile = skillInstance.makeProjectile(this.center, projectileID, direction);
    return projectile;
  }
};

function onTimeOverHandler(skillInstance){
  skillInstance.destroy();
  this.currentSkill = undefined;
  this.isExecutedSkill = false;
  this.skillCastEffectPlay = false;
  this.changeState(gameConfig.OBJECT_STATE_IDLE);
};
function onCastSkillHandler(skillInstance, userAniTime){
  var tickTime = userAniTime/5;
  this.imgHandTimeout = setTimeout(imgHandTimeoutHandler.bind(this, tickTime), tickTime);
  console.log('cast ani start');
};
function imgHandTimeoutHandler(tickTime){
  if(this.imgHandIndex < 4){
    this.imgHandIndex++;
    this.imgHandTimeout = setTimeout(imgHandTimeoutHandler.bind(this, tickTime), tickTime);
  }else{
    this.imgHandIndex = 0;
  }
};
module.exports = User;

},{"../public/gameConfig.json":8,"../public/resources.json":10,"../public/util.js":11,"./CSkill.js":3}],6:[function(require,module,exports){

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
              if(parseInt(tempItem) || parseInt(tempItem) === 0){
                hashItem[headerItem] = parseInt(tempItem);
              }else if(parseFloat(tempItem)){
                hashItem[headerItem] = parseFloat(tempItem);
              }else{
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

},{}],7:[function(require,module,exports){
module.exports={
  "userStatData" : "index,level,needExp,type,power,magic,speed,imgData\n1,1,100,1,30,15,18,1\n2,2,150,1,32,16,19,1\n3,3,250,1,34,17,21,1\n4,4,400,1,36,18,22,1\n5,5,600,1,38,19,24,2\n6,6,850,1,40,20,25,2\n7,7,1150,1,42,21,27,2\n8,8,1500,1,44,22,28,2\n9,9,1900,1,46,23,30,2\n10,10,2350,1,48,24,31,3\n11,11,2850,1,50,25,33,3\n12,12,3400,1,52,26,34,3\n13,13,4000,1,54,27,36,3\n14,14,4650,1,56,28,37,3\n15,15,5350,1,58,29,39,4\n16,16,6100,1,60,30,40,4\n17,17,6900,1,62,31,42,4\n18,18,7750,1,64,32,43,4\n19,19,8650,1,66,33,45,4\n20,20,-1,1,68,34,46,5\n101,1,100,2,15,30,18,6\n102,2,150,2,16,32,19,6\n103,3,250,2,17,34,21,6\n104,4,400,2,18,36,22,6\n105,5,600,2,19,38,24,7\n106,6,850,2,20,40,25,7\n107,7,1150,2,21,42,27,7\n108,8,1500,2,22,44,28,7\n109,9,1900,2,23,46,30,7\n110,10,2350,2,24,48,31,8\n111,11,2850,2,25,50,33,8\n112,12,3400,2,26,52,34,8\n113,13,4000,2,27,54,36,8\n114,14,4650,2,28,56,37,8\n115,15,5350,2,29,58,39,9\n116,16,6100,2,30,60,40,9\n117,17,6900,2,31,62,42,9\n118,18,7750,2,32,64,43,9\n119,19,8650,2,33,66,45,9\n120,20,-1,2,34,68,46,10\n201,1,100,3,18,18,18,11\n202,2,150,3,19,19,19,11\n203,3,250,3,21,21,21,11\n204,4,400,3,22,22,22,11\n205,5,600,3,24,24,24,12\n206,6,850,3,25,25,25,12\n207,7,1150,3,27,27,27,12\n208,8,1500,3,28,28,28,12\n209,9,1900,3,30,30,30,12\n210,10,2350,3,31,31,31,13\n211,11,2850,3,33,33,33,13\n212,12,3400,3,34,34,34,13\n213,13,4000,3,36,36,36,13\n214,14,4650,3,37,37,37,13\n215,15,5350,3,39,39,39,14\n216,16,6100,3,40,40,40,14\n217,17,6900,3,42,42,42,14\n218,18,7750,3,43,43,43,14\n219,19,8650,3,45,45,45,14\n220,20,-1,3,46,46,46,15\n",
  "skillData" : "index,name,level,type,property,groupIndex,nextSkillIndex,totalTime,fireTime,cooldown,range,explosionRadius,explosionDamageRate,consumeMP,fireDamage,frostDamage,arcaneDamage,doDamageToMP,damageToMPRate,doDamageToSelf,damageToSelfRate,healHP,healHPRate,healMP,healMPRate,repeatLifeTime,repeatTime,buffToSelf,buffToTarget,projectileCount,radius,maxSpeed,lifeTime,tickTime,upgradeGoldAmount,upgradeJewelAmount,clientName,effectLastTime,skillIcon,hitEffectGroup\n11,FireStrike1,1,1,1,10,12,1000,600,100,100,50,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,,1,0,0,0,0,0,100,0,Fire_Strike1,300,../images/tempSkill1.png,30\n12,FireStrike2,2,1,1,10,13,1000,600,100,100,50,0,0,110,0,0,0,0,0,0,0,0,0,0,0,0,,2,0,0,0,0,0,200,0,Fire_Strike2,300,../images/tempSkill1.png,30\n13,FireStrike3,3,1,1,10,14,1000,600,100,100,50,0,0,120,0,0,0,0,0,0,0,0,0,0,0,0,,3,0,0,0,0,0,300,1,Fire_Strike3,300,../images/tempSkill1.png,30\n14,FireStrike4,4,1,1,10,15,1000,600,100,100,50,0,0,130,0,0,0,0,0,0,0,0,0,0,0,0,,4,0,0,0,0,0,400,2,Fire_Strike4,300,../images/tempSkill1.png,30\n15,FireStrike5,5,1,1,10,-1,1000,600,100,100,50,0,0,140,0,0,0,0,0,0,0,0,0,0,0,0,,5,0,0,0,0,0,0,0,Fire_Strike5,300,../images/tempSkill1.png,30\n21,FireBall1,1,4,1,20,22,2000,1600,5000,0,100,0,100,100,0,0,0,0,0,0,0,0,0,0,0,0,,1,1,50,400,3000,0,100,0,Fire_Ball1,300,../images/tempSkill2.png,30\n22,FireBall2,2,4,1,20,23,2000,1600,5000,0,105,0,105,110,0,0,0,0,0,0,0,0,0,0,0,0,,2,1,52,400,3000,0,200,0,Fire_Ball2,300,../images/tempSkill2.png,30\n23,FireBall3,3,4,1,20,24,2000,1600,5000,0,110,0,110,120,0,0,0,0,0,0,0,0,0,0,0,0,,3,1,54,400,3000,0,300,1,Fire_Ball3,300,../images/tempSkill2.png,30\n24,FireBall4,4,4,1,20,25,2000,1600,5000,0,115,0,115,130,0,0,0,0,0,0,0,0,0,0,0,0,,4,1,56,400,3000,0,400,2,Fire_Ball4,300,../images/tempSkill2.png,30\n25,FireBall5,5,4,1,20,-1,2000,1600,5000,0,120,0,120,140,0,0,0,0,0,0,0,0,0,0,0,0,,5,1,58,400,3000,0,0,0,Fire_Ball5,300,../images/tempSkill2.png,30\n31,Explosion1,1,7,1,30,32,2000,1600,5000,500,115,0,115,130,0,0,0,0,0,0,0,0,0,0,0,0,,1,0,0,0,0,0,100,0,Explosion1,300,../images/tempSkill3.png,30\n32,Explosion2,2,7,1,30,33,2000,1600,5000,500,120,0,120,135,0,0,0,0,0,0,0,0,0,0,0,0,,2,0,0,0,0,0,200,0,Explosion2,300,../images/tempSkill3.png,30\n33,Explosion3,3,7,1,30,34,2000,1600,5000,500,125,0,125,140,0,0,0,0,0,0,0,0,0,0,0,0,,3,0,0,0,0,0,300,1,Explosion3,300,../images/tempSkill3.png,30\n34,Explosion4,4,7,1,30,35,2000,1600,5000,500,130,0,130,145,0,0,0,0,0,0,0,0,0,0,0,0,,4,0,0,0,0,0,400,2,Explosion4,300,../images/tempSkill3.png,30\n35,Explosion5,5,7,1,30,-1,2000,1600,5000,500,135,0,135,150,0,0,0,0,0,0,0,0,0,0,0,0,,5,0,0,0,0,0,0,0,Explosion5,300,../images/tempSkill3.png,30\n41,RollingFire1,1,5,1,40,42,2000,1600,5000,0,0,0,100,10,0,0,0,0,0,0,0,0,0,0,0,0,,1,1,100,400,3000,150,100,0,Rolling_Fire1,0,../images/tempSkill4.png,30\n42,RollingFire1,2,5,1,40,43,2000,1600,5000,0,0,0,105,11,0,0,0,0,0,0,0,0,0,0,0,0,,2,1,100,400,3000,150,200,0,Rolling_Fire2,0,../images/tempSkill4.png,30\n43,RollingFire1,3,5,1,40,44,2000,1600,5000,0,0,0,110,12,0,0,0,0,0,0,0,0,0,0,0,0,,3,1,100,400,3000,150,300,1,Rolling_Fire3,0,../images/tempSkill4.png,30\n44,RollingFire1,4,5,1,40,45,2000,1600,5000,0,0,0,115,13,0,0,0,0,0,0,0,0,0,0,0,0,,4,1,100,400,3000,150,400,2,Rolling_Fire4,0,../images/tempSkill4.png,30\n45,RollingFire1,5,5,1,40,-1,1000,600,5000,0,0,0,120,14,0,0,0,0,0,0,0,0,0,0,0,0,,5,1,100,400,3000,150,0,0,Rolling_Fire5,0,../images/tempSkill4.png,30\n51,FireShield1,1,8,1,50,52,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,,0,0,0,0,0,100,0,Fire_Shield1,0,../images/tempSkill5.png,30\n52,FireShield2,2,8,1,50,53,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,,0,0,0,0,0,200,0,Fire_Shield2,0,../images/tempSkill5.png,30\n53,FireShield3,3,8,1,50,54,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,,0,0,0,0,0,300,1,Fire_Shield3,0,../images/tempSkill5.png,30\n54,FireShield4,4,8,1,50,55,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,,0,0,0,0,0,400,2,Fire_Shield4,0,../images/tempSkill5.png,30\n55,FireShield5,5,8,1,50,-1,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,,0,0,0,0,0,0,0,Fire_Shield5,0,../images/tempSkill5.png,30\n61,Incinerate1,1,8,1,60,62,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,,0,0,0,0,0,100,0,Incinerate1,0,../images/tempSkill6.png,30\n62,Incinerate2,2,8,1,60,63,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,,0,0,0,0,0,200,0,Incinerate2,0,../images/tempSkill6.png,30\n63,Incinerate3,3,8,1,60,64,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,,0,0,0,0,0,300,1,Incinerate3,0,../images/tempSkill6.png,30\n64,Incinerate4,4,8,1,60,65,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,,0,0,0,0,0,400,2,Incinerate4,0,../images/tempSkill6.png,30\n65,Incinerate5,5,8,1,60,-1,1000,600,5000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,,0,0,0,0,0,0,0,Incinerate5,0,../images/tempSkill6.png,30\n71,InnerFire1,1,12,1,70,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,,0,0,0,0,0,100,0,Inner_Fire1,0,../images/tempSkill7.png,30\n72,InnerFire2,2,12,1,70,73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,,0,0,0,0,0,200,0,Inner_Fire2,0,../images/tempSkill7.png,30\n73,InnerFire3,3,12,1,70,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,,0,0,0,0,0,300,1,Inner_Fire3,0,../images/tempSkill7.png,30\n74,InnerFire4,4,12,1,70,75,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,19,,0,0,0,0,0,400,2,Inner_Fire4,0,../images/tempSkill7.png,30\n75,InnerFire5,5,12,1,70,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,,0,0,0,0,0,0,0,Inner_Fire5,0,../images/tempSkill7.png,30\n81,BurningSoul1,1,12,1,80,82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,,0,0,0,0,0,100,0,Burning_Soul1,0,../images/tempSkill8.png,30\n82,BurningSoul2,2,12,1,80,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,,0,0,0,0,0,200,0,Burning_Soul,0,../images/tempSkill8.png,30\n83,BurningSoul3,3,12,1,80,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,,0,0,0,0,0,300,1,Burning_Soul3,0,../images/tempSkill8.png,30\n84,BurningSoul4,4,12,1,80,85,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,,0,0,0,0,0,400,2,Burning_Soul4,0,../images/tempSkill8.png,30\n85,BurningSoul5,5,12,1,80,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25,,0,0,0,0,0,0,0,Burning_Soul5,0,../images/tempSkill8.png,30\n1001,FrostStrike1,1,1,2,1000,1002,1000,600,1000,100,50,0,100,0,50,0,0,0,0,0,0,0,0,0,0,0,,26,0,0,0,0,0,100,0,Frost_Strike1,300,../images/tempSkill9.png,30\n1002,FrostStrike2,2,1,2,1000,1003,1000,600,1000,100,50,0,100,0,50,0,0,0,0,0,0,0,0,0,0,0,,27,0,0,0,0,0,200,0,Frost_Strike2,300,../images/tempSkill9.png,30\n1003,FrostStrike3,3,1,2,1000,1004,1000,600,1000,100,50,0,100,0,50,0,0,0,0,0,0,0,0,0,0,0,,28,0,0,0,0,0,300,1,Frost_Strike3,300,../images/tempSkill9.png,30\n1004,FrostStrike4,4,1,2,1000,1005,1000,600,1000,100,50,0,100,0,50,0,0,0,0,0,0,0,0,0,0,0,,29,0,0,0,0,0,400,2,Frost_Strike4,300,../images/tempSkill9.png,30\n1005,FrostStrike5,5,1,2,1000,-1,1000,600,1000,100,50,0,100,0,50,0,0,0,0,0,0,0,0,0,0,0,,30,0,0,0,0,0,0,0,Frost_Strike5,300,../images/tempSkill9.png,30\n1011,IceSpear1,1,3,2,1010,1012,1200,800,1200,0,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,0,100,0,Ice_Spear1,300,../images/tempSkill10.png,30\n1012,IceSpear2,2,3,2,1010,1013,1200,800,1200,0,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,0,200,0,Ice_Spear2,300,../images/tempSkill10.png,30\n1013,IceSpear3,3,3,2,1010,1014,1200,800,1200,0,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,0,300,1,Ice_Spear3,300,../images/tempSkill10.png,30\n1014,IceSpear4,4,3,2,1010,1015,1200,800,1200,0,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,0,400,2,Ice_Spear4,300,../images/tempSkill10.png,30\n1015,IceSpear5,5,3,2,1010,-1,1200,800,1200,0,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,0,0,0,Ice_Spear5,300,../images/tempSkill10.png,30\n1021,FrostNova1,1,9,2,1020,1022,2000,1600,5000,500,300,0,100,0,70,0,0,0,0,0,0,0,0,0,0,0,,26,0,0,0,0,0,100,0,Frost_Nova1,300,../images/tempSkill11.png,30\n1022,FrostNova2,2,9,2,1020,1023,2000,1600,5000,500,300,0,100,0,70,0,0,0,0,0,0,0,0,0,0,0,,26,0,0,0,0,0,200,0,Frost_Nova2,300,../images/tempSkill11.png,30\n1023,FrostNova3,3,9,2,1020,1024,2000,1600,5000,500,300,0,100,0,70,0,0,0,0,0,0,0,0,0,0,0,,26,0,0,0,0,0,300,1,Frost_Nova3,300,../images/tempSkill11.png,30\n1024,FrostNova4,4,9,2,1020,1025,2000,1600,5000,500,300,0,100,0,70,0,0,0,0,0,0,0,0,0,0,0,,26,0,0,0,0,0,400,2,Frost_Nova4,300,../images/tempSkill11.png,30\n1025,FrostNova5,5,9,2,1020,-1,2000,1600,5000,500,300,0,100,0,70,0,0,0,0,0,0,0,0,0,0,0,,26,0,0,0,0,0,0,0,Frost_Nova5,300,../images/tempSkill11.png,30\n1031,FrozenOrb1,1,6,2,1030,1032,2000,1600,5000,0,100,0,100,0,30,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,500,100,0,Frozen_Orb1,300,../images/tempSkill12.png,30\n1032,FrozenOrb2,2,6,2,1030,1033,2000,1600,5000,0,100,0,100,0,30,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,500,200,0,Frozen_Orb2,300,../images/tempSkill12.png,30\n1033,FrozenOrb3,3,6,2,1030,1034,2000,1600,5000,0,100,0,100,0,30,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,500,300,1,Frozen_Orb3,300,../images/tempSkill12.png,30\n1034,FrozenOrb4,4,6,2,1030,1035,2000,1600,5000,0,100,0,100,0,30,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,500,400,2,Frozen_Orb4,300,../images/tempSkill12.png,30\n1035,FrozenOrb5,5,6,2,1030,-1,2000,1600,5000,0,100,0,100,0,30,0,0,0,0,0,0,0,0,0,0,0,,26,1,50,400,3000,500,0,0,Frozen_Orb5,300,../images/tempSkill12.png,30\n1041,IceShield1,1,8,2,1040,1042,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,31,,0,0,0,0,0,100,0,Ice_Shield1,300,../images/tempSkill1.png,30\n1042,IceShield2,2,8,2,1040,1043,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,32,,0,0,0,0,0,200,0,Ice_Shield2,300,../images/tempSkill1.png,30\n1043,IceShield3,3,8,2,1040,1044,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,33,,0,0,0,0,0,300,1,Ice_Shield3,300,../images/tempSkill1.png,30\n1044,IceShield4,4,8,2,1040,1045,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,34,,0,0,0,0,0,400,2,Ice_Shield4,300,../images/tempSkill1.png,30\n1045,IceShield5,5,8,2,1040,-1,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,35,,0,0,0,0,0,0,0,Ice_Shield5,300,../images/tempSkill1.png,30\n1051,IceBlock1,1,8,2,1050,1052,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,100,0,100,0,0,0,36,,0,0,0,0,0,100,0,Ice_Block1,300,../images/tempSkill2.png,30\n1052,IceBlock2,2,8,2,1050,1053,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,100,0,100,0,0,0,37,,0,0,0,0,0,200,0,Ice_Block2,300,../images/tempSkill2.png,30\n1053,IceBlock3,3,8,2,1050,1054,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,100,0,100,0,0,0,38,,0,0,0,0,0,300,1,Ice_Block3,300,../images/tempSkill2.png,30\n1054,IceBlock4,4,8,2,1050,1055,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,100,0,100,0,0,0,39,,0,0,0,0,0,400,2,Ice_Block4,300,../images/tempSkill2.png,30\n1055,IceBlock5,5,8,2,1050,-1,1000,600,2000,0,0,0,100,0,0,0,0,0,0,0,100,0,100,0,0,0,40,,0,0,0,0,0,0,0,Ice_Block5,300,../images/tempSkill2.png,30\n1061,FrozenSoul1,1,12,2,1060,1062,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,,0,0,0,0,0,100,0,Frozen_Soul1,0,../images/tempSkill3.png,30\n1062,FrozenSoul2,2,12,2,1060,1063,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,42,,0,0,0,0,0,200,0,Frozen_Soul2,0,../images/tempSkill3.png,30\n1063,FrozenSoul3,3,12,2,1060,1064,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,43,,0,0,0,0,0,300,1,Frozen_Soul3,0,../images/tempSkill3.png,30\n1064,FrozenSoul4,4,12,2,1060,1065,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,,0,0,0,0,0,400,2,Frozen_Soul4,0,../images/tempSkill3.png,30\n1065,FrozenSoul5,5,12,2,1060,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,45,,0,0,0,0,0,0,0,Frozen_Soul5,0,../images/tempSkill3.png,30\n1071,FrostArmor1,1,12,2,1070,1072,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,,0,0,0,0,0,100,0,Frost_Armor1,0,../images/tempSkill4.png,30\n1072,FrostArmor2,2,12,2,1070,1073,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,,0,0,0,0,0,200,0,Frost_Armor2,0,../images/tempSkill4.png,30\n1073,FrostArmor3,3,12,2,1070,1074,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,,0,0,0,0,0,300,1,Frost_Armor3,0,../images/tempSkill4.png,30\n1074,FrostArmor4,4,12,2,1070,1075,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,49,,0,0,0,0,0,400,2,Frost_Armor4,0,../images/tempSkill4.png,30\n1075,FrostArmor5,5,12,2,1070,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,,0,0,0,0,0,0,0,Frost_Armor5,0,../images/tempSkill4.png,30\n2001,ArcaneBolt1,1,2,3,2000,2002,1000,600,1000,0,0,0,0,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,100,0,Arcane_Bolt1,300,../images/tempSkill1.png,30\n2002,ArcaneBolt2,2,2,3,2000,2003,1000,600,1000,0,0,0,0,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,200,0,Arcane_Bolt2,300,../images/tempSkill1.png,30\n2003,ArcaneBolt3,3,2,3,2000,2004,1000,600,1000,0,0,0,0,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,300,1,Arcane_Bolt3,300,../images/tempSkill1.png,30\n2004,ArcaneBolt4,4,2,3,2000,2005,1000,600,1000,0,0,0,0,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,400,2,Arcane_Bolt4,300,../images/tempSkill1.png,30\n2005,ArcaneBolt5,5,2,3,2000,-1,1000,600,1000,0,0,0,0,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,0,0,Arcane_Bolt5,300,../images/tempSkill1.png,30\n2011,ArcaneMissiles1,1,3,3,2010,2012,1200,800,1200,0,0,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,3,50,400,3000,0,100,0,Arcane_Missiles1,300,../images/tempSkill2.png,30\n2012,ArcaneMissiles2,2,3,3,2010,2013,1200,800,1200,0,0,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,3,50,400,3000,0,200,0,Arcane_Missiles2,300,../images/tempSkill2.png,30\n2013,ArcaneMissiles3,3,3,3,2010,2014,1200,800,1200,0,0,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,3,50,400,3000,0,300,1,Arcane_Missiles3,300,../images/tempSkill2.png,30\n2014,ArcaneMissiles4,4,3,3,2010,2015,1200,800,1200,0,0,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,3,50,400,3000,0,400,2,Arcane_Missiles4,300,../images/tempSkill2.png,30\n2015,ArcaneMissiles5,5,3,3,2010,-1,1200,800,1200,0,0,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,3,50,400,3000,0,0,0,Arcane_Missiles5,300,../images/tempSkill2.png,30\n2021,ArcaneBomb1,1,4,3,2020,2022,2000,1600,5000,0,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,100,0,Arcane_Bomb1,300,../images/tempSkill3.png,30\n2022,ArcaneBomb2,2,4,3,2020,2023,2000,1600,5000,0,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,200,0,Arcane_Bomb2,300,../images/tempSkill3.png,30\n2023,ArcaneBomb3,3,4,3,2020,2024,2000,1600,5000,0,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,300,1,Arcane_Bomb3,300,../images/tempSkill3.png,30\n2024,ArcaneBomb4,4,4,3,2020,2025,2000,1600,5000,0,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,400,2,Arcane_Bomb4,300,../images/tempSkill3.png,30\n2025,ArcaneBomb5,5,4,3,2020,-1,2000,1600,5000,0,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,1,50,400,3000,0,0,0,Arcane_Bomb5,300,../images/tempSkill3.png,30\n2031,ArcaneBlast1,1,7,3,2030,2032,2000,1600,5000,500,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,0,0,0,0,0,100,0,Arcane_Blast1,300,../images/tempSkill4.png,30\n2032,ArcaneBlast2,2,7,3,2030,2033,2000,1600,5000,500,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,0,0,0,0,0,200,0,Arcane_Blast2,300,../images/tempSkill4.png,30\n2033,ArcaneBlast3,3,7,3,2030,2034,2000,1600,5000,500,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,0,0,0,0,0,300,1,Arcane_Blast3,300,../images/tempSkill4.png,30\n2034,ArcaneBlast4,4,7,3,2030,2035,2000,1600,5000,500,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,0,0,0,0,0,400,2,Arcane_Blast4,300,../images/tempSkill4.png,30\n2035,ArcaneBlast5,5,7,3,2030,-1,2000,1600,5000,500,300,0,100,0,0,100,1,50,0,0,0,0,0,0,0,0,,,0,0,0,0,0,0,0,Arcane_Blast5,300,../images/tempSkill4.png,30\n2041,Blink1,1,11,3,2040,2042,1000,600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,,0,0,0,0,0,100,0,Blink1,300,../images/tempSkill5.png,30\n2042,Blink2,2,11,3,2040,2043,1000,600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,,0,0,0,0,0,200,0,Blink2,300,../images/tempSkill5.png,30\n2043,Blink3,3,11,3,2040,2044,1000,600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,,0,0,0,0,0,300,1,Blink3,300,../images/tempSkill5.png,30\n2044,Blink4,4,11,3,2040,2045,1000,600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,,0,0,0,0,0,400,2,Blink4,300,../images/tempSkill5.png,30\n2045,Blink5,5,11,3,2040,-1,1000,600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,,0,0,0,0,0,0,0,Blink5,300,../images/tempSkill5.png,30\n2051,Silence1,1,7,3,2050,2052,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,51,0,0,0,0,0,100,0,Silence1,300,../images/tempSkill6.png,30\n2052,Silence2,2,7,3,2050,2053,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,52,0,0,0,0,0,200,0,Silence2,300,../images/tempSkill6.png,30\n2053,Silence3,3,7,3,2050,2054,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,53,0,0,0,0,0,300,1,Silence3,300,../images/tempSkill6.png,30\n2054,Silence4,4,7,3,2050,2055,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,54,0,0,0,0,0,400,2,Silence4,300,../images/tempSkill6.png,30\n2055,Silence5,5,7,3,2050,-1,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,55,0,0,0,0,0,0,0,Silence5,300,../images/tempSkill6.png,30\n2061,Blur1,1,8,3,2060,2062,1000,600,5000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,56,,0,0,0,0,0,100,0,Blur1,300,../images/tempSkill7.png,30\n2062,Blur2,2,8,3,2060,2063,1000,600,5000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,57,,0,0,0,0,0,200,0,Blur2,300,../images/tempSkill7.png,30\n2063,Blur3,3,8,3,2060,2064,1000,600,5000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,58,,0,0,0,0,0,300,1,Blur3,300,../images/tempSkill7.png,30\n2064,Blur4,4,8,3,2060,2065,1000,600,5000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,59,,0,0,0,0,0,400,2,Blur4,300,../images/tempSkill7.png,30\n2065,Blur5,5,8,3,2060,-1,1000,600,5000,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,60,,0,0,0,0,0,0,0,Blur5,300,../images/tempSkill7.png,30\n2071,Dispel1,1,7,3,2070,2072,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,61,0,0,0,0,0,100,0,Dispel1,300,../images/tempSkill8.png,30\n2072,Dispel2,2,7,3,2070,2073,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,62,0,0,0,0,0,200,0,Dispel2,300,../images/tempSkill8.png,30\n2073,Dispel3,3,7,3,2070,2074,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,63,0,0,0,0,0,300,1,Dispel3,300,../images/tempSkill8.png,30\n2074,Dispel4,4,7,3,2070,2075,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,64,0,0,0,0,0,400,2,Dispel4,300,../images/tempSkill8.png,30\n2075,Dispel5,5,7,3,2070,-1,2000,1600,5000,500,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,,65,0,0,0,0,0,0,0,Dispel5,300,../images/tempSkill8.png,30\n2081,ArcaneShield1,1,8,3,2080,2082,0,0,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,66,,0,0,0,0,0,100,0,Arcane_Shield1,300,../images/tempSkill9.png,30\n2082,ArcaneShield2,2,8,3,2080,2083,0,0,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,67,,0,0,0,0,0,200,0,Arcane_Shield2,300,../images/tempSkill9.png,30\n2083,ArcaneShield3,3,8,3,2080,2084,0,0,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,68,,0,0,0,0,0,300,1,Arcane_Shield3,300,../images/tempSkill9.png,30\n2084,ArcaneShield4,4,8,3,2080,2085,0,0,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,69,,0,0,0,0,0,400,2,Arcane_Shield4,300,../images/tempSkill9.png,30\n2085,ArcaneShield5,5,8,3,2080,-1,0,0,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,70,,0,0,0,0,0,0,0,Arcane_Shield5,300,../images/tempSkill9.png,30\n2091,ArcaneIntellect1,1,12,3,2090,2092,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,71,,0,0,0,0,0,100,0,Arcane_Intellect1,0,../images/tempSkill10.png,30\n2092,ArcaneIntellect2,2,12,3,2090,2093,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,,0,0,0,0,0,200,0,Arcane_Intellect2,0,../images/tempSkill10.png,30\n2093,ArcaneIntellect3,3,12,3,2090,2094,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,,0,0,0,0,0,300,1,Arcane_Intellect3,0,../images/tempSkill10.png,30\n2094,ArcaneIntellect4,4,12,3,2090,2095,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,,0,0,0,0,0,400,2,Arcane_Intellect4,0,../images/tempSkill10.png,30\n2095,ArcaneIntellect5,5,12,3,2090,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,,0,0,0,0,0,0,0,Arcane_Intellect5,0,../images/tempSkill10.png,30\n2101,ArcaneCloak1,1,12,3,2100,2102,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,,0,0,0,0,0,100,0,Arcane_Cloak1,0,../images/tempSkill11.png,30\n2102,ArcaneCloak2,2,12,3,2100,2103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,,0,0,0,0,0,200,0,Arcane_Cloak2,0,../images/tempSkill11.png,30\n2103,ArcaneCloak3,3,12,3,2100,2104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,,0,0,0,0,0,300,1,Arcane_Cloak3,0,../images/tempSkill11.png,30\n2104,ArcaneCloak4,4,12,3,2100,2105,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,79,,0,0,0,0,0,400,2,Arcane_Cloak4,0,../images/tempSkill11.png,30\n2105,ArcaneCloak5,5,12,3,2100,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,,0,0,0,0,0,0,0,Arcane_Cloak5,0,../images/tempSkill11.png,30\n5001,FiroPassive1,1,12,1,5000,5002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,81,,0,0,0,0,0,100,0,FiroPassive1,0,../images/tempSkill1.png,30\n5002,FiroPassive2,2,12,1,5000,5003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,,0,0,0,0,0,200,0,FiroPassive2,0,../images/tempSkill1.png,30\n5003,FiroPassive3,3,12,1,5000,5004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,,0,0,0,0,0,300,1,FiroPassive3,0,../images/tempSkill1.png,30\n5004,FiroPassive4,4,12,1,5000,5005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,,0,0,0,0,0,400,2,FiroPassive4,0,../images/tempSkill1.png,30\n5005,FiroPassive5,5,12,1,5000,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,85,,0,0,0,0,0,0,0,FiroPassive5,0,../images/tempSkill1.png,30\n5101,FreezerPassive1,1,12,2,5100,5102,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,,0,0,0,0,0,100,0,FreezePassive1,0,../images/tempSkill2.png,30\n5102,FreezerPassive2,2,12,2,5100,5103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,87,,0,0,0,0,0,200,0,FreezePassive2,0,../images/tempSkill2.png,30\n5103,FreezerPassive3,3,12,2,5100,5104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,,0,0,0,0,0,300,1,FreezePassive3,0,../images/tempSkill2.png,30\n5104,FreezerPassive4,4,12,2,5100,5105,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,89,,0,0,0,0,0,400,2,FreezePassive4,0,../images/tempSkill2.png,30\n5105,FreezerPassive5,5,12,2,5100,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,,0,0,0,0,0,0,0,FreezePassive5,0,../images/tempSkill2.png,30\n5201,MysterPassive1,1,12,3,5200,5202,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,91,,0,0,0,0,0,100,0,MysterPassive1,0,../images/tempSkill3.png,30\n5202,MysterPassive2,2,12,3,5200,5203,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,,0,0,0,0,0,200,0,MysterPassive2,0,../images/tempSkill3.png,30\n5203,MysterPassive3,3,12,3,5200,5204,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,93,,0,0,0,0,0,300,1,MysterPassive3,0,../images/tempSkill3.png,30\n5204,MysterPassive4,4,12,3,5200,5205,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,94,,0,0,0,0,0,400,2,MysterPassive4,0,../images/tempSkill3.png,30\n5205,MysterPassive5,5,12,3,5200,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,95,,0,0,0,0,0,0,0,MysterPassive5,0,../images/tempSkill3.png,30\n",
  "buffGroupData" : "index,name,desc,isBuff,buff1,buff2,buff3,buff4,buff5,buffLifeTime,buffApplyRate,buffIcon,buffEffectGroup\n1,ignite1,,0,1,,,,,10000,100,../images/tempSkill1.png,1\n2,ignite2,,0,2,,,,,10000,100,../images/tempSkill1.png,1\n3,ignite3,,0,3,,,,,10000,100,../images/tempSkill1.png,1\n4,ignite4,,0,4,,,,,10000,100,../images/tempSkill1.png,1\n5,ignite5,,0,5,,,,,10000,100,../images/tempSkill1.png,1\n6,FireShield1,,1,21,16,11,,,30000,100,../images/tempSkill5.png,2\n7,FireShield2,,1,22,17,12,,,30000,100,../images/tempSkill5.png,2\n8,FireShield3,,1,23,18,13,,,30000,100,../images/tempSkill5.png,2\n9,FireShield4,,1,24,19,14,,,30000,100,../images/tempSkill5.png,2\n10,FireShield5,,1,25,20,15,,,30000,100,../images/tempSkill5.png,2\n11,Incinerate1,,1,1,11,,,,30000,100,../images/tempSkill6.png,3\n12,Incinerate2,,1,2,12,,,,30000,100,../images/tempSkill6.png,3\n13,Incinerate3,,1,3,13,,,,30000,100,../images/tempSkill6.png,3\n14,Incinerate4,,1,4,14,,,,30000,100,../images/tempSkill6.png,3\n15,Incinerate5,,1,5,15,,,,30000,100,../images/tempSkill6.png,3\n16,InnerFire1,,1,26,31,,,,30000,100,../images/tempSkill7.png,4\n17,InnerFire2,,1,27,32,,,,30000,100,../images/tempSkill7.png,4\n18,InnerFire3,,1,28,33,,,,30000,100,../images/tempSkill7.png,4\n19,InnerFire4,,1,29,34,,,,30000,100,../images/tempSkill7.png,4\n20,InnerFire5,,1,30,35,,,,30000,100,../images/tempSkill7.png,4\n21,BurningSoul1,,1,6,11,,,,30000,100,../images/tempSkill8.png,5\n22,BurningSoul2,,1,7,12,,,,30000,100,../images/tempSkill8.png,5\n23,BurningSoul3,,1,8,13,,,,30000,100,../images/tempSkill8.png,5\n24,BurningSoul4,,1,9,14,,,,30000,100,../images/tempSkill8.png,5\n25,BurningSoul5,,1,10,15,,,,30000,100,../images/tempSkill8.png,5\n26,chill1,,0,36,,,,,10000,100,../images/tempSkill1.png,6\n27,chill2,,0,37,,,,,10000,100,../images/tempSkill1.png,6\n28,chill3,,0,38,,,,,10000,100,../images/tempSkill1.png,6\n29,chill4,,0,39,,,,,10000,100,../images/tempSkill1.png,6\n30,chill5,,0,40,,,,,10000,100,../images/tempSkill1.png,6\n31,IceShield1,,1,41,16,61,,,30000,100,../images/tempSkill2.png,7\n32,IceShield2,,1,42,17,62,,,30000,100,../images/tempSkill2.png,7\n33,IceShield3,,1,43,18,63,,,30000,100,../images/tempSkill2.png,7\n34,IceShield4,,1,44,19,64,,,30000,100,../images/tempSkill2.png,7\n35,IceShield5,,1,45,20,65,,,30000,100,../images/tempSkill2.png,7\n36,IceBlock1,,0,46,51,,,,30000,100,../images/tempSkill3.png,8\n37,IceBlock2,,0,47,52,,,,30000,100,../images/tempSkill3.png,8\n38,IceBlock3,,0,48,53,,,,30000,100,../images/tempSkill3.png,8\n39,IceBlock4,,0,49,54,,,,30000,100,../images/tempSkill3.png,8\n40,IceBlock5,,0,50,55,,,,30000,100,../images/tempSkill3.png,8\n41,FrozenSoul1,,1,56,61,,,,30000,100,../images/tempSkill4.png,9\n42,FrozenSoul2,,1,57,62,,,,30000,100,../images/tempSkill4.png,9\n43,FrozenSoul3,,1,58,63,,,,30000,100,../images/tempSkill4.png,9\n44,FrozenSoul4,,1,59,64,,,,30000,100,../images/tempSkill4.png,9\n45,FrozenSoul5,,1,60,65,,,,30000,100,../images/tempSkill4.png,9\n46,FrostArmor1,,1,41,66,71,,,30000,100,../images/tempSkill5.png,10\n47,FrostArmor2,,1,41,67,72,,,30000,100,../images/tempSkill5.png,10\n48,FrostArmor3,,1,41,68,73,,,30000,100,../images/tempSkill5.png,10\n49,FrostArmor4,,1,41,69,74,,,30000,100,../images/tempSkill5.png,10\n50,FrostArmor5,,1,41,70,75,,,30000,100,../images/tempSkill5.png,10\n51,Silence1,,0,76,,,,,10000,100,../images/tempSkill1.png,11\n52,Silence2,,0,76,,,,,10000,100,../images/tempSkill1.png,11\n53,Silence3,,0,76,,,,,10000,100,../images/tempSkill1.png,11\n54,Silence4,,0,76,,,,,10000,100,../images/tempSkill1.png,11\n55,Silence5,,0,76,,,,,10000,100,../images/tempSkill1.png,11\n56,Blur1,,1,81,,,,,30000,100,../images/tempSkill2.png,\n57,Blur2,,1,81,,,,,30000,100,../images/tempSkill2.png,\n58,Blur3,,1,81,,,,,30000,100,../images/tempSkill2.png,\n59,Blur4,,1,81,,,,,30000,100,../images/tempSkill2.png,\n60,Blur5,,1,81,,,,,30000,100,../images/tempSkill2.png,\n61,Dispel1,,0,86,,,,,100,100,../images/tempSkill3.png,13\n62,Dispel2,,0,87,,,,,100,100,../images/tempSkill3.png,13\n63,Dispel3,,0,88,,,,,100,100,../images/tempSkill3.png,13\n64,Dispel4,,0,89,,,,,100,100,../images/tempSkill3.png,13\n65,Dispel5,,0,90,,,,,100,100,../images/tempSkill3.png,13\n66,ArcaneShield1,,1,41,61,,,,30000,100,../images/tempSkill4.png,14\n67,ArcaneShield2,,1,42,62,,,,30000,100,../images/tempSkill4.png,14\n68,ArcaneShield3,,1,43,63,,,,30000,100,../images/tempSkill4.png,14\n69,ArcaneShield4,,1,44,64,,,,30000,100,../images/tempSkill4.png,14\n70,ArcaneShield5,,1,45,65,,,,30000,100,../images/tempSkill4.png,14\n71,ArcaneIntellect1,,1,91,56,61,,,0,100,../images/tempSkill5.png,15\n72,ArcaneIntellect2,,1,92,57,62,,,0,100,../images/tempSkill5.png,15\n73,ArcaneIntellect3,,1,93,58,63,,,0,100,../images/tempSkill5.png,15\n74,ArcaneIntellect4,,1,94,59,64,,,0,100,../images/tempSkill5.png,15\n75,ArcaneIntellect5,,1,95,60,65,,,0,100,../images/tempSkill5.png,15\n76,ArcaneCloak1,,1,91,96,,,,0,100,../images/tempSkill6.png,16\n77,ArcaneCloak2,,1,92,97,,,,0,100,../images/tempSkill6.png,16\n78,ArcaneCloak3,,1,93,98,,,,0,100,../images/tempSkill6.png,16\n79,ArcaneCloak4,,1,94,99,,,,0,100,../images/tempSkill6.png,16\n80,ArcaneCloak5,,1,95,100,,,,0,100,../images/tempSkill6.png,16\n81,firoPassive1,,1,101,,,,,0,100,../images/tempSkill1.png,17\n82,firoPassive2,,1,101,103,105,,,0,100,../images/tempSkill1.png,17\n83,firoPassive3,,1,102,103,105,,,0,100,../images/tempSkill1.png,17\n84,firoPassive4,,1,102,103,105,107,,0,100,../images/tempSkill1.png,17\n85,firoPassive5,,1,102,104,106,107,,0,100,../images/tempSkill1.png,17\n86,freezePassive1,,1,108,116,,,,0,100,../images/tempSkill2.png,18\n87,freezePassive2,,1,108,110,112,116,,0,100,../images/tempSkill2.png,18\n88,freezePassive3,,1,109,110,112,117,,0,100,../images/tempSkill2.png,18\n89,freezePassive4,,1,109,110,112,117,114,0,100,../images/tempSkill2.png,18\n90,freezePassive5,,1,109,111,113,117,115,0,100,../images/tempSkill2.png,18\n91,mysterPassive1,,1,118,,,,,0,100,../images/tempSkill3.png,19\n92,mysterPassive2,,1,118,122,,,,0,100,../images/tempSkill3.png,19\n93,mysterPassive3,,1,119,122,120,,,0,100,../images/tempSkill3.png,19\n94,mysterPassive4,,1,119,123,120,124,,0,100,../images/tempSkill3.png,19\n95,mysterPassive5,,1,119,123,121,125,,0,100,../images/tempSkill3.png,19\n96,mysterBuff1-1,,1,58,63,,,,10000,100,../images/tempSkill1.png,20\n97,mysterBuff1-2,,1,92,97,,,,10000,100,../images/tempSkill2.png,21\n98,mysterBuff1-3,,1,41,68,,,,10000,100,../images/tempSkill3.png,22\n99,mysterBuff1-4,,0,87,,,,,10000,30,../images/tempSkill4.png,23\n100,mysterBuff1-5,,0,76,,,,,10000,30,../images/tempSkill5.png,24\n101,mysterBuff2-1,,1,60,65,,,,10000,100,../images/tempSkill1.png,20\n102,mysterBuff2-2,,1,94,99,,,,10000,100,../images/tempSkill2.png,21\n103,mysterBuff2-3,,1,41,70,,,,10000,100,../images/tempSkill3.png,22\n104,mysterBuff2-4,,0,88,,,,,10000,30,../images/tempSkill4.png,23\n105,mysterBuff2-5,,0,76,,,,,10000,30,../images/tempSkill5.png,24\n106,freeze1,,0,126,,,,,3000,30,../images/tempSkill1.png,25\n107,freeze2,,0,127,,,,,3000,30,../images/tempSkill2.png,25\n200,startBuff,,1,46,,,,,5000,100,../images/tempSkill2.png,26\n",
  "buffData" : "index,name,buffTickTime,buffType,buffEffectType,buffAmount,buffApplyHPTickPercent,buffAdaptTime,skillProperty,fireUserCondition,hitUserCondition,buffGroup1,buffGroup2,buffGroup3,buffGroup4,buffGroup5\n1,ignite1,0,5,5,,0,1,0,0,0,,,,,\n2,ignite2,0,5,5,,0,1,0,0,0,,,,,\n3,ignite3,0,5,5,,0,1,0,0,0,,,,,\n4,ignite4,0,5,5,,0,1,0,0,0,,,,,\n5,ignite5,0,5,5,,0,1,0,0,0,,,,,\n6,maxHP1,0,2,1,100,0,1,0,0,0,,,,,\n7,maxHP2,0,2,1,110,0,1,0,0,0,,,,,\n8,maxHP3,0,2,1,120,0,1,0,0,0,,,,,\n9,maxHP4,0,2,1,130,0,1,0,0,0,,,,,\n10,maxHP5,0,2,1,140,0,1,0,0,0,,,,,\n11,HPRegen1,0,2,5,10,0,1,0,0,0,,,,,\n12,HPRegen2,0,2,5,11,0,1,0,0,0,,,,,\n13,HPRegen3,0,2,5,12,0,1,0,0,0,,,,,\n14,HPRegen4,0,2,5,13,0,1,0,0,0,,,,,\n15,HPRegen5,0,2,5,14,0,1,0,0,0,,,,,\n16,reductionFire1,0,2,23,5,0,1,0,0,0,,,,,\n17,reductionFire2,0,2,23,6,0,1,0,0,0,,,,,\n18,reductionFire3,0,2,23,7,0,1,0,0,0,,,,,\n19,reductionFire4,0,2,23,8,0,1,0,0,0,,,,,\n20,reductionFire5,0,2,23,9,0,1,0,0,0,,,,,\n21,reductionFrost1,0,2,24,5,0,1,0,0,0,,,,,\n22,reductionFrost2,0,2,24,6,0,1,0,0,0,,,,,\n23,reductionFrost3,0,2,24,7,0,1,0,0,0,,,,,\n24,reductionFrost4,0,2,24,8,0,1,0,0,0,,,,,\n25,reductionFrost5,0,2,24,9,0,1,0,0,0,,,,,\n26,damageByLife1,0,2,27,10,10,1,0,0,0,,,,,\n27,damageByLife2,0,2,27,11,10,1,0,0,0,,,,,\n28,damageByLife3,0,2,27,12,10,1,0,0,0,,,,,\n29,damageByLife4,0,2,27,13,10,1,0,0,0,,,,,\n30,damageByLife5,0,2,27,14,10,1,0,0,0,,,,,\n31,moveSpeedByLife1,0,2,28,10,10,1,0,0,0,,,,,\n32,moveSpeedByLife2,0,2,28,11,10,1,0,0,0,,,,,\n33,moveSpeedByLife3,0,2,28,12,10,1,0,0,0,,,,,\n34,moveSpeedByLife4,0,2,28,13,10,1,0,0,0,,,,,\n35,moveSpeedByLife5,0,2,28,14,10,1,0,0,0,,,,,\n36,chill1,0,5,2,0,0,1,0,0,0,,,,,\n37,chill2,0,5,2,0,0,1,0,0,0,,,,,\n38,chill3,0,5,2,0,0,1,0,0,0,,,,,\n39,chill4,0,5,2,0,0,1,0,0,0,,,,,\n40,chill5,0,5,2,0,0,1,0,0,0,,,,,\n41,reductionAll1,0,2,26,10,0,1,0,0,0,,,,,\n42,reductionAll2,0,2,26,10,0,1,0,0,0,,,,,\n43,reductionAll3,0,2,26,10,0,1,0,0,0,,,,,\n44,reductionAll4,0,2,26,10,0,1,0,0,0,,,,,\n45,reductionAll5,0,2,26,10,0,1,0,0,0,,,,,\n46,setImmortal1,0,5,1,0,0,1,0,0,0,,,,,\n47,setImmortal2,0,5,1,0,0,1,0,0,0,,,,,\n48,setImmortal3,0,5,1,0,0,1,0,0,0,,,,,\n49,setImmortal4,0,5,1,0,0,1,0,0,0,,,,,\n50,setImmortal5,0,5,1,0,0,1,0,0,0,,,,,\n51,setFreeze1,0,5,3,0,0,1,0,0,0,,,,,\n52,setFreeze2,0,5,3,0,0,1,0,0,0,,,,,\n53,setFreeze3,0,5,3,0,0,1,0,0,0,,,,,\n54,setFreeze4,0,5,3,0,0,1,0,0,0,,,,,\n55,setFreeze5,0,5,3,0,0,1,0,0,0,,,,,\n56,MaxMP1,0,2,2,100,0,1,0,0,0,,,,,\n57,MaxMP2,0,2,2,100,0,1,0,0,0,,,,,\n58,MaxMP3,0,2,2,100,0,1,0,0,0,,,,,\n59,MaxMP4,0,2,2,100,0,1,0,0,0,,,,,\n60,MaxMP5,0,2,2,100,0,1,0,0,0,,,,,\n61,MPRegen1,0,2,7,10,0,1,0,0,0,,,,,\n62,MPRegen2,0,2,7,10,0,1,0,0,0,,,,,\n63,MPRegen3,0,2,7,10,0,1,0,0,0,,,,,\n64,MPRegen4,0,2,7,10,0,1,0,0,0,,,,,\n65,MPRegen5,0,2,7,10,0,1,0,0,0,,,,,\n66,ResistAll1,0,2,22,10,0,1,0,0,0,,,,,\n67,ResistAll2,0,2,22,10,0,1,0,0,0,,,,,\n68,ResistAll3,0,2,22,10,0,1,0,0,0,,,,,\n69,ResistAll4,0,2,22,10,0,1,0,0,0,,,,,\n70,ResistAll5,0,2,22,10,0,1,0,0,0,,,,,\n71,ResistFire1,0,2,19,10,0,1,0,0,0,,,,,\n72,ResistFire2,0,2,19,10,0,1,0,0,0,,,,,\n73,ResistFire3,0,2,19,10,0,1,0,0,0,,,,,\n74,ResistFire4,0,2,19,10,0,1,0,0,0,,,,,\n75,ResistFire5,0,2,19,10,0,1,0,0,0,,,,,\n76,Silence,0,5,4,0,0,1,0,0,0,,,,,\n81,Blur,0,5,6,0,0,1,0,0,0,,,,,\n86,DispelBuff1,0,4,1,1,0,1,0,0,0,,,,,\n87,DispelBuff2,1,4,1,2,0,1,0,0,0,,,,,\n88,DispelBuff3,2,4,1,3,0,1,0,0,0,,,,,\n89,DispelBuff4,3,4,1,4,0,1,0,0,0,,,,,\n90,DispelBuff5,4,4,1,5,0,1,0,0,0,,,,,\n91,damageRate1,0,2,18,10,0,1,0,0,0,,,,,\n92,damageRate2,1,2,18,11,0,1,0,0,0,,,,,\n93,damageRate3,2,2,18,12,0,1,0,0,0,,,,,\n94,damageRate4,3,2,18,13,0,1,0,0,0,,,,,\n95,damageRate5,4,2,18,14,0,1,0,0,0,,,,,\n96,castSpeed1,0,2,10,10,0,1,0,0,0,,,,,\n97,castSpeed2,1,2,10,11,0,1,0,0,0,,,,,\n98,castSpeed3,2,2,10,12,0,1,0,0,0,,,,,\n99,castSpeed4,3,2,10,13,0,1,0,0,0,,,,,\n100,castSpeed5,4,2,10,14,0,1,0,0,0,,,,,\n101,firoPassiveAddFireDmg1,0,2,15,15,0,2,1,0,0,,,,,\n102,firoPassiveAddFireDmg2,0,2,15,30,0,2,1,0,0,,,,,\n103,firoPassiveAddDmgRateAtIgnite1,0,2,15,10,0,2,0,5,0,,,,,\n104,firoPassiveAddDmgRateAtIgnite2,0,2,15,20,0,2,0,5,0,,,,,\n105,firoPassiveAddHPRegenAtIgnite1,0,2,7,10,0,2,0,5,0,,,,,\n106,firoPassiveAddHPRegenAtIgnite2,0,2,7,20,0,2,0,5,0,,,,,\n107,firoPassiveSetIgnite,0,5,5,0,0,1,0,0,0,,,,,\n108,freezerPassiveAddFrostDmg1,0,2,16,15,0,2,2,0,0,,,,,\n109,freezerPassiveAddFrostDmg2,0,2,16,30,0,2,2,0,0,,,,,\n110,freezerPassiveSetFreezing1,0,6,1,0,0,2,2,0,0,106,,,,\n111,freezerPassiveSetFreezing2,0,6,1,0,0,2,2,0,0,107,,,,\n112,freezerPassiveAddDmgToChill1,0,2,13,10,0,3,2,0,2,,,,,\n113,freezerPassiveAddDmgToChill2,0,2,13,20,0,3,2,0,2,,,,,\n114,freezerPassiveAddDmgToFreeze1,0,2,13,30,0,3,2,0,3,,,,,\n115,freezerPassiveAddDmgToFreeze2,0,2,13,40,0,3,2,0,3,,,,,\n116,freezerPassiveAddDmgReduction1,0,2,26,10,0,1,0,0,0,,,,,\n117,freezerPassiveAddDmgReduction2,0,2,26,15,0,1,0,0,0,,,,,\n118,mysterPassiveAddDmg1,0,2,11,15,0,1,0,0,0,,,,,\n119,mysterPassiveAddDmg2,0,2,11,30,0,1,0,0,0,,,,,\n120,mysterPassiveAddDmgRate1,0,2,18,15,0,1,0,0,0,,,,,\n121,mysterPassiveAddDmgRate2,0,2,18,30,0,1,0,0,0,,,,,\n122,mysterPassiveAddBuff1,0,6,1,0,0,2,0,0,0,96,97,98,99,100\n123,mysterPassiveAddBuff2,0,6,1,0,0,2,0,0,0,101,102,103,104,105\n124,mysterPassiveReduceCooldown1,0,2,29,10,0,1,0,0,0,,,,,\n125,mysterPassiveReduceCooldown2,0,2,29,20,0,1,0,0,0,,,,,\n126,freeze1,0,5,3,0,0,1,0,0,2,,,,,\n127,freeze2,0,5,3,0,0,1,0,0,2,,,,,\n",
  "chestData" : "index,grade,HP,imgData,minGoldCount,maxGoldCount,minGoldAmount,maxGoldAmount,minJewelCount,maxJewelCount,minJewelAmount,maxJewelAmount,minSkillCount,maxSkillCount,SkillIndex1,SkillDropRate1,SkillIndex2,SkillDropRate2,SkillIndex3,SkillDropRate3,SkillIndex4,SkillDropRate4,SkillIndex5,SkillDropRate5,SkillIndex6,SkillDropRate6,SkillIndex7,SkillDropRate7,SkillIndex7,SkillDropRate7,SkillIndex8,SkillDropRate8,SkillIndex9,SkillDropRate9,SkillIndex10,SkillDropRate10,SkillIndex11,SkillDropRate11,SkillIndex12,SkillDropRate12,SkillIndex13,SkillDropRate13,SkillIndex14,SkillDropRate14,SkillIndex15,SkillDropRate15,SkillIndex16,SkillDropRate16,SkillIndex17,SkillDropRate17,SkillIndex18,SkillDropRate18,SkillIndex19,SkillDropRate19,SkillIndex20,SkillDropRate20\n1,1,100,107,3,5,10,20,0,0,0,0,1,2,21,30,1011,30,2011,30,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n2,2,200,108,4,6,15,30,0,1,1,1,1,3,21,30,1011,30,2011,30,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n3,3,300,109,5,7,20,40,1,2,1,1,1,5,21,30,1011,30,2011,30,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n4,4,400,110,6,8,25,50,1,3,1,1,1,5,21,30,1011,30,2011,30,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n5,5,500,111,7,9,30,60,2,3,1,1,1,5,21,30,1011,30,2011,30,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n",
  "obstacleData" :
  "index,type,id,posX,posY,radius,chestGradeMin,chestGradeMax,imgData\n1,1,OTT1,788,1628,30,,,103\n2,1,OTT2,2442,547,30,,,103\n3,1,OTT3,4912,5682,30,,,103\n4,1,OTT4,4843,464,30,,,103\n5,1,OTT5,2172,4425,30,,,103\n6,1,OTT6,3128,5919,30,,,103\n7,1,OTT7,5117,2739,30,,,103\n8,1,OTT8,1838,950,30,,,103\n9,1,OTT9,4900,4633,30,,,103\n10,1,OTT10,2307,1806,30,,,103\n11,1,OTT11,5042,2621,30,,,103\n12,1,OTT12,1070,239,30,,,103\n13,1,OTT13,2610,406,30,,,103\n14,1,OTT14,5498,2815,30,,,103\n15,1,OTT15,3197,3142,30,,,103\n16,1,OTT16,225,4570,30,,,103\n17,1,OTT17,5623,2371,30,,,103\n18,1,OTT18,3016,2842,30,,,103\n19,1,OTT19,1632,394,30,,,103\n20,1,OTT20,4705,4775,30,,,103\n21,1,OTT21,5623,2697,30,,,103\n22,1,OTT22,3656,2576,30,,,103\n23,1,OTT23,3521,1472,30,,,103\n24,1,OTT24,129,6056,30,,,103\n25,1,OTT25,5797,5879,40,,,102\n26,1,OTT26,6184,5417,40,,,102\n27,1,OTT27,2410,1135,40,,,102\n28,1,OTT28,3256,424,40,,,102\n29,1,OTT29,1210,5100,40,,,102\n30,1,OTT30,791,1701,40,,,102\n31,1,OTT31,895,333,40,,,102\n32,1,OTT32,1208,1934,40,,,102\n33,1,OTT33,1841,4270,40,,,102\n34,1,OTT34,15,1238,40,,,102\n35,1,OTT35,2800,3192,40,,,102\n36,1,OTT36,581,4745,40,,,102\n37,1,OTT37,4411,1593,40,,,102\n38,1,OTT38,3345,2643,40,,,102\n39,1,OTT39,1800,5872,40,,,102\n40,1,OTT40,4375,2651,50,,,101\n41,1,OTT41,5792,5467,50,,,101\n42,1,OTT42,4489,1762,50,,,101\n43,1,OTT43,5953,1488,50,,,101\n44,1,OTT44,2651,1520,50,,,101\n45,1,OTT45,4135,5602,50,,,101\n101,2,OTR1,141,3070,30,,,106\n102,2,OTR2,3091,3631,30,,,106\n103,2,OTR3,4182,2134,30,,,106\n104,2,OTR4,82,1628,30,,,106\n105,2,OTR5,3949,1424,30,,,106\n106,2,OTR6,3824,2412,50,,,105\n107,2,OTR7,2578,1716,50,,,105\n108,2,OTR8,5648,2832,50,,,105\n109,2,OTR9,2412,1391,50,,,105\n110,2,OTR10,1285,4939,50,,,105\n111,2,OTR11,4133,4007,50,,,105\n112,2,OTR12,4898,1620,50,,,105\n113,2,OTR13,1406,3464,50,,,105\n114,2,OTR14,1850,5136,50,,,105\n115,2,OTR15,1115,5691,50,,,105\n116,2,OTR16,858,541,50,,,105\n117,2,OTR17,2527,1835,50,,,105\n118,2,OTR18,4293,575,50,,,105\n119,2,OTR19,5306,1600,50,,,105\n120,2,OTR20,1022,3952,50,,,105\n121,2,OTR21,4187,4348,50,,,105\n122,2,OTR22,379,2582,50,,,105\n123,2,OTR23,5914,4052,50,,,105\n124,2,OTR24,3887,4042,50,,,105\n125,2,OTR25,2610,2695,50,,,105\n126,2,OTR26,531,166,50,,,105\n127,2,OTR27,1608,2839,50,,,105\n128,2,OTR28,6046,2272,50,,,105\n129,2,OTR29,3407,1201,50,,,105\n130,2,OTR30,1448,5333,50,,,105\n131,2,OTR31,2362,2874,70,,,104\n132,2,OTR32,846,4176,70,,,104\n133,2,OTR33,375,6188,70,,,104\n134,2,OTR34,2996,5364,70,,,104\n135,2,OTR35,2276,64,70,,,104\n136,2,OTR36,435,2455,70,,,104\n137,2,OTR37,2916,1868,70,,,104\n138,2,OTR38,2272,5086,70,,,104\n139,2,OTR39,2212,4950,70,,,104\n140,2,OTR40,2084,4241,70,,,104\n141,2,OTR41,2461,6005,70,,,104\n142,2,OTR42,6155,2509,70,,,104\n143,2,OTR43,3175,2429,70,,,104\n144,2,OTR44,3932,977,70,,,104\n145,2,OTR45,5250,5713,70,,,104\n201,3,OCG1,2090,920,35,1,2,112\n202,3,OCG2,4980,1400,35,2,4,112\n203,3,OCG3,2060,2000,35,3,5,112\n204,3,OCG4,6020,2400,35,1,3,112\n205,3,OCG5,3160,3160,35,3,4,112\n206,3,OCG6,300,3920,35,1,3,112\n207,3,OCG7,4260,4320,35,4,5,112\n208,3,OCG8,1340,4920,35,2,4,112\n209,3,OCG9,4230,5400,35,1,3,112\n",
  "resourceData" :
  "index,name,source,srcPosX,srcPosY,srcWidth,srcHeight,width,height\n1,firoNovice,1,0,0,70,70,65,65\n2,firoApprentice,1,70,0,70,70,65,65\n3,firoAdept,1,140,0,70,70,65,65\n4,firoExpert,1,210,0,70,70,65,65\n5,firoMaster,1,280,0,70,70,65,65\n6,freezerNovice,1,0,70,70,70,65,65\n7,freezerApprentice,1,70,70,70,70,65,65\n8,freezerAdept,1,140,70,70,70,65,65\n9,freezerExpert,1,210,70,70,70,65,65\n10,freezerMaster,1,280,70,70,70,65,65\n11,mysterNovice,1,0,140,70,70,65,65\n12,mysterApprentice,1,70,140,70,70,65,65\n13,mysterAdept,1,140,140,70,70,65,65\n14,mysterExpert,1,210,140,70,70,65,65\n15,mysterMaster,1,280,140,70,70,65,65\n16,charHandIdle,1,0,210,90,70,85,65\n17,charHandCast1,1,90,210,90,70,85,65\n18,charHandCast2,1,180,210,90,70,85,65\n19,charHandCast3,1,270,210,90,70,85,65\n20,charHandCast4,1,360,210,90,70,85,65\n21,castEffectFire,1,0,280,100,70,95,65\n22,castEffectFrost,1,100,280,100,70,95,65\n23,castEffectArcane,1,200,280,100,70,95,65\n24,projectileFire,1,0,350,70,70,65,65\n25,projectileFrost,1,70,350,70,70,65,65\n26,projectileArcane,1,140,350,70,70,65,65\n27,skillEffectFire,1,0,420,160,160,155,155\n28,skillEffectFrost,1,160,420,160,160,155,155\n29,skillEffectArcane,1,320,420,160,160,155,155\n30,conditionEffectFreeze,1,435,0,80,80,75,75\n31,conditionEffectChill,1,515,0,80,80,75,75\n32,conditionEffectImmortal,1,595,0,80,80,75,75\n33,conditionEffectSilence,1,665,0,80,80,75,75\n34,conditionEffectIgnite1,1,435,80,60,60,55,55\n35,conditionEffectIgnite2,1,495,80,60,60,55,55\n36,conditionEffectIgnite3,1,555,80,60,60,55,55\n37,conditionEffectIgnite4,1,615,80,60,60,55,55\n38,conditionEffectIgnite5,1,675,80,60,60,55,55\n39,skillEffectFireShield,1,435,140,80,80,75,75\n40,skillEffectFrostShield,1,515,140,80,80,75,75\n41,skillEffectArcaneShield,1,595,140,80,80,75,75\n101,objTreeLarge,2,210,0,210,210,205,205\n102,objTreeMedium,2,210,0,210,210,165,165\n103,objTreeSmall,2,210,0,210,210,125,125\n104,objStoneLarge,2,0,0,210,210,165,165\n105,objStoneMedium,2,0,0,210,210,125,125\n106,objStoneSmall,2,0,0,210,210,85,85\n107,objChest1,2,0,210,90,90,85,85\n108,objChest2,2,90,210,90,90,85,85\n109,objChest3,2,180,210,90,90,85,85\n110,objChest4,2,270,210,90,90,85,85\n111,objChest5,2,360,210,90,90,85,85\n112,objChestGround,2,450,210,90,90,85,85\n113,objGold,2,0,300,70,70,65,65\n114,objJewel,2,70,300,70,70,65,65\n115,objSkillFire,2,0,370,70,70,65,65\n116,objSkillFrost,2,70,370,70,70,65,65\n117,objSkillArcane,2,140,370,70,70,65,65\n",
  "effectGroupData" :
  "index,name,isRotate,rotateStartDegree,isAttach,resourceLifeTime,resourceIndex1,resourceIndex2,resourceIndex3,resourceIndex4,resourceIndex5,resourceIndex6,resourceIndex7,resourceIndex8,resourceIndex9,resourceIndex10\n1,ignite,0,0,0,3000,34,35,36,37,38,,,,,\n2,FireShield,1,0,1,,39,,,,,,,,,\n3,Incinerate,0,0,1,,,,,,,,,,,\n4,InnerFire,0,0,1,,,,,,,,,,,\n5,BurningSoul,0,0,1,,,,,,,,,,,\n6,chill,0,0,1,,,,,,,,,,,\n7,IceShield,1,120,1,,40,,,,,,,,,\n8,IceBlock,0,0,1,,,,,,,,,,,\n9,FrozenSoul,0,0,1,,,,,,,,,,,\n10,FrostArmor,0,0,1,,,,,,,,,,,\n11,Silence,0,0,1,,,,,,,,,,,\n12,Blur,0,0,1,,,,,,,,,,,\n13,Dispel,0,0,1,,,,,,,,,,,\n14,ArcaneShield,1,240,1,,41,,,,,,,,,\n15,ArcaneIntellect,0,0,1,,,,,,,,,,,\n16,ArcaneCloak,0,0,1,,,,,,,,,,,\n17,firoPassive,0,0,1,,,,,,,,,,,\n18,freezePassive,0,0,1,,,,,,,,,,,\n19,mysterPassive,0,0,1,,,,,,,,,,,\n20,mysterBuff1,0,0,1,,,,,,,,,,,\n21,mysterBuff2,0,0,1,,,,,,,,,,,\n22,mysterBuff3,0,0,1,,,,,,,,,,,\n23,mysterBuff4,0,0,1,,,,,,,,,,,\n24,mysterBuff5,0,0,1,,,,,,,,,,,\n25,freeze,0,0,1,,,,,,,,,,,\n26,startBuff,0,0,1,,32,,,,,,,,,\n30,hitEffectTest,0,0,1,5000,34,35,36,37,38,,,,,\n"
}

},{}],8:[function(require,module,exports){
module.exports={
  "MAX_SERVER_RESPONSE_TIME" : 5000,
  "INTERVAL" : 60,
  "FPS" : 60,

  "RESOURCES_COUNT" : 2,
  "RESOURCE_SRC_CHARACTER" : "../images/Character.png",
  "RESOURCE_SRC_OBJECT" : "../images/Objects.png",
  "RESOURCE_SRC_UI" : "",
  "SOURCE_CHARACTER" :	1,
  "SOURCE_OBJECT" : 2,
  "SOURCE_UI" : 3,

  "START_BUTTON" : 1,
  "RESTART_BUTTON" : 2,

  "SKILL_INFORM_TIME" : 150,
  "SKILL_HIT_EFFECT_TIME" : 100,
  "USER_EFFECT_CHANGE_TIME" : 150,
  "RISE_TEXT_LIFE_TIME" : 3000,

  "CHEST_ANI_PLAY_TIME" : 4500,
  "DEAD_SCENE_PLAY_TIME" : 5000,

  "CAST_EFFECT_INTERPOLATION_FACTOR" : 0.1,
  "SKILL_EFFECT_INTERPOLATION_FACTOR" : 0.6,
  "USER_ANI_TIME" : 300,

  "CANVAS_MAX_SIZE" : {"width" : 6400 , "height" : 6400},
  "CANVAS_MAX_LOCAL_SIZE" : {"width" : 1600, "height" : 1000},

  "DRAW_MODE_NORMAL" : 1,
  "DRAW_MODE_SKILL_RANGE" : 2,

  "SKILL_CHANGE_PANEL_CONTAINER" : 1,
  "SKILL_CHANGE_PANEL_EQUIP" : 2,

  "OBJECT_STATE_IDLE" : 1,
  "OBJECT_STATE_MOVE" : 2,
  "OBJECT_STATE_ATTACK" : 3,
  "OBJECT_STATE_CAST" : 4,
  "OBJECT_STATE_DEATH" : 5,

  "MOVE_SLIGHT_RATE" : 0.3,

  "GAME_STATE_LOAD" : 1,
  "GAME_STATE_START_SCENE" : 2,
  "GAME_STATE_GAME_START" : 3,
  "GAME_STATE_GAME_ON" : 4,
  "GAME_STATE_GAME_END" : 5,
  "GAME_STATE_RESTART_SCENE" : 6,
  "GAME_STATE_RESTART" : 7,

  "CHAR_TYPE_FIRE" : 1,
  "CHAR_TYPE_FROST" : 2,
  "CHAR_TYPE_ARCANE" : 3,

  "PREFIX_USER" : "USR",
  "PREFIX_SKILL" : "SKL",
  "PREFIX_SKILL_PROJECTILE" : "SKP",
  "PREFIX_CHEST" : "CHT",
  "PREFIX_OBSTACLE_TREE" : "OTT",
  "PREFIX_OBSTACLE_ROCK" : "OTR",
  "PREFIX_OBSTACLE_CHEST_GROUND" : "OCG",
  "PREFIX_OBJECT_EXP" : "OXP",
  "PREFIX_OBJECT_SKILL" : "OSK",
  "PREFIX_OBJECT_GOLD" : "OGD",
  "PREFIX_OBJECT_JEWEL" : "OJW",

  "USER_CONDITION_IMMORTAL" : 1,
  "USER_CONDITION_CHILL" : 2,
  "USER_CONDITION_FREEZE" : 3,
  "USER_CONDITION_SILENCE" : 4,
  "USER_CONDITION_IGNITE" : 5,
  "USER_CONDITION_BLUR" : 6,

  "SKILL_PROPERTY_FIRE" : 1,
  "SKILL_PROPERTY_FROST" : 2,
  "SKILL_PROPERTY_ARCANE" : 3,

  "SKILL_TYPE_INSTANT_RANGE" : 1,
  "SKILL_TYPE_INSTANT_PROJECTILE" : 2,
  "SKILL_TYPE_PROJECTILE" : 3,
  "SKILL_TYPE_PROJECTILE_EXPLOSION" : 4,
  "SKILL_TYPE_PROJECTILE_TICK" : 5,
  "SKILL_TYPE_PROJECTILE_TICK_EXPLOSION" : 6,
  "SKILL_TYPE_RANGE" : 7,
  "SKILL_TYPE_SELF" : 8,
  "SKILL_TYPE_SELF_EXPLOSION" : 9,
  "SKILL_TYPE_SELF_TRIGGER" : 10,
  "SKILL_TYPE_TELEPORT" : 11,
  "SKILL_TYPE_PASSIVE" : 12,

  "SKILL_BASIC_INDEX" : 1,
  "SKILL_EQUIP1_INDEX" : 2,
  "SKILL_EQUIP2_INDEX" : 3,
  "SKILL_EQUIP3_INDEX" : 4,
  "SKILL_EQUIP4_INDEX" : 5,
  "SKILL_PASSIVE_INDEX" : 6,

  "STAT_POWER_INDEX" : 1,
  "STAT_MAGIC_INDEX" : 2,
  "STAT_SPEED_INDEX" : 3,
  "BUFF_ICON_INDEX" : 4,

  "PROJECTILE_FIRE_DISTANCE" : 30,
  "MULTI_PROJECTILE_DEGREE" : 20,

  "OBJ_SKILL_RADIUS" : 30,
  "OBJ_JEWEL_RADIUS" : 20,

  "OBJ_TYPE_TREE" : 1,
  "OBJ_TYPE_ROCK" : 2,
  "OBJ_TYPE_CHEST_GROUND" : 3,

  "RESOURCE_INDEX_USER_HAND_1" : 16,
  "RESOURCE_INDEX_USER_HAND_2" : 17,
  "RESOURCE_INDEX_USER_HAND_3" : 18,
  "RESOURCE_INDEX_USER_HAND_4" : 19,
  "RESOURCE_INDEX_USER_HAND_5" : 20,

  "RESOURCE_INDEX_CASTING_FIRE" : 21,
  "RESOURCE_INDEX_CASTING_FROST" : 22,
  "RESOURCE_INDEX_CASTING_ARCANE" : 23,

  "RESOURCE_INDEX_PROJECTILE_FIRE" : 24,
  "RESOURCE_INDEX_PROJECTILE_FROST" : 25,
  "RESOURCE_INDEX_PROJECTILE_ARCANE" : 26,

  "RESOURCE_INDEX_SKILL_EFFECT_FIRE" : 27,
  "RESOURCE_INDEX_SKILL_EFFECT_FROST" : 28,
  "RESOURCE_INDEX_SKILL_EFFECT_ARCANE" : 29,

  "RESOURCE_INDEX_CONDITION_FREEZE" : 30,
  "RESOURCE_INDEX_CONDITION_CHILL" : 31,
  "RESOURCE_INDEX_CONDITION_IMMORTAL" : 32,
  "RESOURCE_INDEX_CONDITION_SILENCE" : 33,
  "RESOURCE_INDEX_CONDITION_IGNITE1" : 34,
  "RESOURCE_INDEX_CONDITION_IGNITE2" : 35,
  "RESOURCE_INDEX_CONDITION_IGNITE3" : 36,
  "RESOURCE_INDEX_CONDITION_IGNITE4" : 37,
  "RESOURCE_INDEX_CONDITION_IGNITE5" : 38,

  "RESOURCE_INDEX_OBJ_GOLD" : 113,
  "RESOURCE_INDEX_OBJ_JEWEL" : 114,
  "RESOURCE_INDEX_OBJ_SKILL_FIRE" : 115,
  "RESOURCE_INDEX_OBJ_SKILL_FROST" : 116,
  "RESOURCE_INDEX_OBJ_SKILL_ARCANE" : 117,

  "RESOURCE_INDEX_CHEST_GRADE_1" : 107,
  "RESOURCE_INDEX_CHEST_GRADE_2" : 108,
  "RESOURCE_INDEX_CHEST_GRADE_3" : 109,
  "RESOURCE_INDEX_CHEST_GRADE_4" : 110,
  "RESOURCE_INDEX_CHEST_GRADE_5" : 111
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
  "GRID_IMG_SIZE" : 60,

  "OBJ_TREE_SRC" : "",
  "OBJ_TREE_SIZE" : 100,

  "OBJ_CHEST_SRC" : "",
  "OBJ_CHEST_SIZE" : 50,

  "OBJ_CHEST_GROUND_SRC" : "",
  "OBJ_CHEST_GROUND_SIZE" : 50
}

},{}],11:[function(require,module,exports){
var gameConfig = require('./gameConfig.json');
var radianFactor = Math.PI/180;

//must use with bind or call method
exports.rotate = function(deltaTime){
  if(this.targetDirection === this.direction){
    if(this.currentState === gameConfig.OBJECT_STATE_MOVE){
      this.move(deltaTime);
    }else if(this.currentState === gameConfig.OBJECT_STATE_ATTACK){
    }else if(this.currentState === gameConfig.OBJECT_STATE_CAST){
      this.executeSkill();
    }
  }
  //check rotate direction
  else{
    if(this.direction > 0 && this.targetDirection < 0){
      if((180 - this.direction + 180 + this.targetDirection) < (this.direction - this.targetDirection)){
        if(Math.abs(this.targetDirection - this.direction) < this.rotateSpeed * deltaTime){
          this.direction += Math.abs(this.targetDirection - this.direction);
        }else{
          this.direction += this.rotateSpeed * deltaTime;
        }
      }else if(this.targetDirection < this.direction){
        if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed * deltaTime){
          this.direction -= Math.abs(this.targetDirection - this.direction);
        }else{
          this.direction -= this.rotateSpeed * deltaTime;
        }
      }
    }else if(this.direction < 0 && this.targetDirection >0 ){
      if((180 + this.direction + 180 - this.targetDirection) < (this.targetDirection - this.direction)){
        if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed * deltaTime){
          this.direction -= Math.abs(this.targetDirection - this.direction);
        }else{
          this.direction -= this.rotateSpeed * deltaTime;
        }
      }else if(this.targetDirection > this.direction){
        if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed * deltaTime){
          this.direction += Math.abs(this.targetDirection - this.direction);
        }else{
          this.direction += this.rotateSpeed * deltaTime;
        }
      }
    }else if(this.targetDirection > this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed * deltaTime){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed * deltaTime;
      }
    }else if(this.targetDirection < this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed * deltaTime){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed * deltaTime;
      }
    }
    if(this.currentState === gameConfig.OBJECT_STATE_MOVE){
      this.move(deltaTime, true);
    }
  }

  if(this.direction >= 180){
    this.direction -= 360;
  }else if(this.direction <= -180){
    this.direction += 360;
  }
};

//must use with bind or call method
exports.move = function(deltaTime, isMoveSlight){

  //calculate dist with target
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x) * deltaTime){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y) * deltaTime){
    this.speed.y = distY;
  }
  var addPos = this.onMove(this);
  if(addPos){
    if(exports.isNumeric(addPos.x) && exports.isNumeric(addPos.y)){
      this.position.x += addPos.x;
      this.position.y += addPos.y;
    }
  }
  if(isMoveSlight){
    this.position.x += this.speed.x * deltaTime * gameConfig.MOVE_SLIGHT_RATE;
    this.position.y += this.speed.y * deltaTime * gameConfig.MOVE_SLIGHT_RATE;
  }else{
    this.position.x += this.speed.x * deltaTime;
    this.position.y += this.speed.y * deltaTime;
  }

  if(this.position.x < 0){
    this.position.x = 0;
  }else if(this.position.x > gameConfig.CANVAS_MAX_SIZE.width - this.size.width){
    this.position.x = gameConfig.CANVAS_MAX_SIZE.width - this.size.width;
  }
  if(this.position.y < 0){
    this.position.y = 0;
  }else if(this.position.y > gameConfig.CANVAS_MAX_SIZE.height - this.size.height){
    this.position.y = gameConfig.CANVAS_MAX_SIZE.height - this.size.height;
  }

  this.setCenter();
};

//must use with bind or call method
//setup when click canvas for move
exports.setSpeed = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  var distXSquare = Math.pow(distX,2);
  var distYSquare = Math.pow(distY,2);

  if(distX == 0  && distY ==0){
    this.speed.x = 0;
    this.speed.y = 0;
  }else if(distXSquare + distYSquare < 100){
    this.speed.x = distX;
    this.speed.y = distY;
  }else{
    this.speed.x = (distX>=0?1:-1)* this.maxSpeed * Math.sqrt(distXSquare / (distXSquare + distYSquare));
    this.speed.y = (distY>=0?1:-1)* this.maxSpeed * Math.sqrt(distYSquare / (distXSquare + distYSquare));
  }
};

//must use with bind or call method
// setup when click canvas for move or fire skill
exports.setTargetDirection = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  if(isNaN(tangentDegree)){
    this.targetDirection = this.direction;
  }else{
    if(distX < 0 && distY >= 0){
      this.targetDirection = tangentDegree + 180;
    }else if(distX < 0 && distY < 0){
      this.targetDirection = tangentDegree - 180;
    }else{
      this.targetDirection = tangentDegree;
    }
  }
};
exports.setTargetPosition = function(clickPosition, user){
  var targetX = clickPosition.x;
  var targetY = clickPosition.y;
  if(targetX < user.size.width/2){
    targetX = user.size.width/2
  }else if(targetX > gameConfig.CANVAS_MAX_SIZE.width - user.size.width/2){
    targetX = gameConfig.CANVAS_MAX_SIZE.width - user.size.width/2;
  }

  if(targetY < user.size.height/2){
    targetY = user.size.height/2
  }else if(targetY > gameConfig.CANVAS_MAX_SIZE.height - user.size.height/2){
    targetY = gameConfig.CANVAS_MAX_SIZE.height - user.size.height/2;
  }

  return {
    x : targetX,
    y : targetY
  };
};
//check obstacle collision
exports.checkCircleCollision = function(tree, posX, posY, radius, id){
  var returnVal = [];
  var obj = {x : posX, y: posY, width:radius * 2, height: radius * 2, id: id};
  tree.onCollision(obj, function(item){
    if(obj.id !== item.id){
      var objCenterX = obj.x + radius;
      var objCenterY = obj.y + radius;

      var itemCenterX = item.x + item.width/2;
      var itemCenterY = item.y + item.height/2;

      // check sum of radius with item`s distance
      var distSquareDiff = Math.pow(radius + item.width/2,2) - Math.pow(itemCenterX - objCenterX,2) - Math.pow(itemCenterY - objCenterY,2);

      if(distSquareDiff > 0 ){
        returnVal.collisionPosition = {x : (objCenterX + itemCenterX) / 2,
                                       y : (objCenterY + itemCenterY) / 2};
        //collision occured
        returnVal.push(item);
      }
    }
  });
  return returnVal;
};
exports.calcCompelPos = function(obj, collisionObjs){
  var addPos = { x : 0 , y : 0 };
  for(var i=0; i<collisionObjs.length; i++){
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
  return {
    x : position.x + offset.x,
    y : position.y + offset.y
  };
};
exports.worldToLocalPosition = function(position, offset){
  return {
    x : position.x - offset.x,
    y : position.y - offset.y
  };
};
exports.worldXCoordToLocalX = function(x, offsetX){
  return x - offsetX;
};
exports.worldYCoordToLocalY = function(y, offsetY){
  return y - offsetY;
};
// exports.calculateOffset = function(obj, canvasSize){
//   var newOffset = {
//     x : obj.position.x + obj.size.width/2 - canvasSize.width/2,
//     y : obj.position.y + obj.size.height/2 - canvasSize.height/2
//   };
//   return newOffset;
// };
exports.isXInCanvas = function(x, gameConfig){
  var scaledX = x * gameConfig.scaleFactor;
  if(scaledX>0 && scaledX<gameConfig.canvasSize.width){
    return true;
  }
  return false;
};
exports.isYInCanvas = function(y, gameConfig){
  var scaledY = y * gameConfig.scaleFactor;
  if(scaledY>0 && scaledY<gameConfig.canvasSize.height){
    return true;
  }
  return false;
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
exports.calcSkillTargetPosition = function(skillData, clickPosition, user){
  switch (skillData.type) {
    case gameConfig.SKILL_TYPE_INSTANT_RANGE:
      var addPosX = skillData.range * Math.cos(user.direction * radianFactor);
      var addPosY = skillData.range * Math.sin(user.direction * radianFactor);

      return {
        x : user.center.x + addPosX,
        y : user.center.y + addPosY
      };
    case gameConfig.SKILL_TYPE_INSTANT_PROJECTILE:
      return {
        x : clickPosition.x,
        y : clickPosition.y
      };
    case gameConfig.SKILL_TYPE_RANGE:
      var distSquare = exports.distanceSquare(user.center, clickPosition);
      if(Math.pow(skillData.range,2) > distSquare){
        return {
          x : clickPosition.x,
          y : clickPosition.y
        };
      }else{
        var addPosX = skillData.range * Math.cos(user.direction * radianFactor);
        var addPosY = skillData.range * Math.sin(user.direction * radianFactor);

        return {
          x : user.center.x + addPosX,
          y : user.center.y + addPosY
        };
      }
    case gameConfig.SKILL_TYPE_SELF :
      return {
        x : user.center.x,
        y : user.center.y
      };
    case gameConfig.SKILL_TYPE_SELF_EXPLOSION :
      return {
        x : user.center.x,
        y : user.center.y
      };
    case gameConfig.SKILL_TYPE_TELEPORT :
      var distSquare = exports.distanceSquare(user.center, clickPosition);
      if(Math.pow(skillData.range,2) > distSquare){
        return {
          x : clickPosition.x,
          y : clickPosition.y
        };
      }else{
        var addPosX = skillData.range * Math.cos(user.direction * radianFactor);
        var addPosY = skillData.range * Math.sin(user.direction * radianFactor);

        return {
          x : user.center.x + addPosX,
          y : user.center.y + addPosY
        };
      }
    case gameConfig.SKILL_TYPE_PROJECTILE :
      return {
        x : clickPosition.x,
        y : clickPosition.y
      };
    case gameConfig.SKILL_TYPE_PROJECTILE_TICK :
      return {
        x : clickPosition.x,
        y : clickPosition.y
      };
    case gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION :
      return {
        x : clickPosition.x,
        y : clickPosition.y
      };
    case gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION :
      return{
        x : clickPosition.x,
        y : clickPosition.y
      };
    default:
  }
};
exports.calcSkillTargetDirection = function(skillType, targetPosition, user){
  switch (skillType) {
    case gameConfig.SKILL_TYPE_INSTANT_RANGE:
      return user.direction;
    case gameConfig.SKILL_TYPE_INSTANT_PROJECTILE:
      return user.direction;
    case gameConfig.SKILL_TYPE_RANGE:
      return exports.calcTargetDirection(targetPosition, user.center, user.direction);
    case gameConfig.SKILL_TYPE_SELF :
      return user.direction;
    case gameConfig.SKILL_TYPE_SELF_EXPLOSION :
      return user.direction;
    case gameConfig.SKILL_TYPE_TELEPORT :
      return exports.calcTargetDirection(targetPosition, user.center, user.direction);
    case gameConfig.SKILL_TYPE_PROJECTILE :
      return exports.calcTargetDirection(targetPosition, user.center, user.direction);
    case gameConfig.SKILL_TYPE_PROJECTILE_TICK :
      return exports.calcTargetDirection(targetPosition, user.center, user.direction);
    case gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION :
      return exports.calcTargetDirection(targetPosition, user.center, user.direction);
    case gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION :
      return exports.calcTargetDirection(targetPosition, user.center, user.direction);
    default:
  }
};
exports.calcTargetDirection = function(targetPosition, centerPosition, userDirection){
  var distX = targetPosition.x - centerPosition.x;
  var distY = targetPosition.y - centerPosition.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;

  var returnVal = 0;
  if(isNaN(tangentDegree)){
    return userDirection;
  }else{
    if(distX < 0 && distY >= 0){
      returnVal = tangentDegree + 180;
    }else if(distX < 0 && distY < 0){
      returnVal = tangentDegree - 180;
    }else{
      returnVal = tangentDegree;
    }
  }
  return returnVal;
};
exports.calcTargetPosition = function(centerPosition, direction, range){
  var addPosX = range * Math.cos(direction * radianFactor);
  var addPosY = range * Math.sin(direction * radianFactor);

  return {x : addPosX, y : addPosY};
};
//find last coincident data
exports.findData = function(table, columnName, value){
  var data = undefined;
  for(var i=0; i<table.length; i++){
    if(table[i][columnName] == value){
      data = table[i];
      break;
    }
  }
  // for(var index in table){
  //   //use ==, because value can be integer
  //   if(table[index][columnName] == value){
  //     data = table[index];
  //     break;
  //   }
  // }
  return data;
};
exports.findAllDatas = function(table, columnName, value){
  var datas = [];
  for(var i=0; i<table.length; i++){
    if(table[i][columnName] == value){
      datas.push(table[i]);
    }
  }
  // for(var index in table){
  //   if(table[index][columnName] == value){
  //     datas.push(table[index]);
  //   }
  // }
  return datas;
}
exports.findDataWithTwoColumns = function(table, columnName1, value1, columnName2, value2){
  var datas = [];
  var data = null;
  for(var i=0; i<table.length; i++){
    if(table[i][columnName1] == value1){
      datas.push(table[i]);
    }
  }
  if(datas.length > 0){
    for(var i=0; i<datas.length; i++){
      if(datas[i][columnName2] == value2){
        data = datas[i];
        break;
      }
    }
  }
  return data;
  // for(var index in table){
  //   if(table[index][columnName1] == value1){
  //     datas.push(table[index]);
  //   }
  // }
  // if(datas.length > 0){
  //   for(var index in datas){
  //     if(datas[index][columnName2] == value2){
  //       data = datas[index];
  //       break;
  //     }
  //   }
  // }else{
  //   return null;
  // }
  // return data;
}
exports.findAndSetBuffs = function(buffGroupData, buffTable, actorID){
  var returnVal = [];
  for(var i=0; i<5; i++){
    var buffIndex = buffGroupData['buff' + (i + 1)];
    if(buffIndex){
      var buffData = Object.assign({}, exports.findData(buffTable, 'index', buffIndex));
      buffData.actorID = actorID;
      returnVal.push(buffData);
    }else{
      return returnVal;
    }
  }
  return returnVal;
};
exports.getBuffs = function(buffGroupData){
  var returnVal = [];
  for(var i=0; i<5; i++){
    if(buffGroupData['buff' + (i + 1)]){
      returnVal.push(buffGroupData['buff' + (i + 1)]);
    }
  }
  return returnVal;
};
exports.setResourceData = function(resourceTable, buffImgData){
  var resourceDataList = [];
  buffImgData.resourceLength = 0;
  for(var i=0; i<10; i++){
    var resourceIndex = buffImgData['resourceIndex' + (i + 1)];
    if(resourceIndex){
      var resourceData = Object.assign({}, exports.findData(resourceTable, 'index', resourceIndex));
      buffImgData['resourceIndex' + (i + 1)] = resourceData;
      buffImgData.resourceLength = i + 1;
    }else{
      break;
    }
  }
  if(buffImgData.resourceLength){
    return true;
  }else{
    return false;
  }
};
exports.makeUserEffect = function(user, effectData){
  //set effect center
  var effectCenter = { x : user.center.x, y : user.center.y };
  //set effect index
  var effectIndex = 0;
  //set effect
  var effect = {
    index : effectData.index,
    isRotate : effectData.isRotate,
    resourceIndex1 : effectData.resourceIndex1,
    resourceIndex2 : effectData.resourceIndex2,
    resourceIndex3 : effectData.resourceIndex3,
    resourceIndex4 : effectData.resourceIndex4,
    resourceIndex5 : effectData.resourceIndex5,
    resourceIndex6 : effectData.resourceIndex6,
    resourceIndex7 : effectData.resourceIndex7,
    resourceIndex8 : effectData.resourceIndex8,
    resourceIndex9 : effectData.resourceIndex9,
    resourceIndex10 : effectData.resourceIndex10,
    resourceLength : effectData.resourceLength,

    resourceLifeTime : effectData.resourceLifeTime,
    startTime : Date.now(),
    effectTimer : Date.now(),

    effectIndex : effectIndex,
    center : effectCenter,

    changeIndex : function(){
      if(this.effectIndex + 1 >= this.resourceLength){
        this.effectIndex = 0;
      }else{
        this.effectIndex++;
      }
      this.effectTimer = Date.now();
    }
  }
  return effect;
};
exports.generateRandomUniqueID = function(uniqueCheckArray, prefix, idCount){
  if(!idCount){
    var IDisUnique = false;
    while(!IDisUnique){
      var randomID = generateRandomID(prefix);
      IDisUnique = true;
      for(var index in uniqueCheckArray){
        if(randomID == uniqueCheckArray[index].objectID){
          IDisUnique = false;
        }
      }
    }
    return randomID;
  }else if(idCount){
    var IDs = [];
    for(var i=0; i<idCount; i++){
      var IDisUnique = false;
      while(!IDisUnique){
        var randomID = generateRandomID(prefix);
        IDisUnique = true;
        for(var index in uniqueCheckArray){
          if(randomID == uniqueCheckArray[index].objectID){
            IDisUnique = false;
          }
        }
        for(var j=0; j<IDs.length; j++){
          if(randomID == IDs[j]){
            IDisUnique = false;
          }
        }
        if(IDisUnique){
          IDs.push(randomID);
        }
      }
    }
    return IDs;
  }
};
exports.getElementsByClassName = function(parentDiv, className){
  var returnDivs = [];
  var childrenDivs = parentDiv.getElementsByTagName('div');
  for(var i=0; i<childrenDivs.length; i++){
    for(var j=0; j<childrenDivs[i].classList.length; j++){
      if(childrenDivs[i].classList[j] === className){
        returnDivs.push(childrenDivs[i]);
      }
    }
  }
  return returnDivs;
};
exports.calcForePosition = function(center, radius, direction, distance){
  return {
    x : center.x + distance * Math.cos(direction * radianFactor) - radius,
    y : center.y + distance * Math.sin(direction * radianFactor) - radius
  };
};
exports.interpolationSine = function(time, lifeTime){
  if(lifeTime){
    return gameConfig.SKILL_EFFECT_INTERPOLATION_FACTOR * Math.sin(Math.PI * time / lifeTime) + 0.5;
  }else{
    return gameConfig.CAST_EFFECT_INTERPOLATION_FACTOR * Math.sin(2 * Math.PI * time / 1000) + 1;
  }
};
exports.isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

},{"./gameConfig.json":8}],12:[function(require,module,exports){
// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');
// var resource = require('../../modules/public/resource.json');
var csvJson = require('../../modules/public/csvjson.js');
var dataJson = require('../../modules/public/data.json');

var userStatTable = csvJson.toObject(dataJson.userStatData, {delimiter : ',', quote : '"'});
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});
var buffGroupTable = csvJson.toObject(dataJson.buffGroupData, {delimiter : ',', quote : '"'});
var resourceTable = csvJson.toObject(dataJson.resourceData, {delimiter : ',', quote : '"'});
var obstacleTable = csvJson.toObject(dataJson.obstacleData, {delimiter : ',', quote : '"'});
var effectGroupTable = csvJson.toObject(dataJson.effectGroupData, {delimiter : ',', quote : '"'});
var socket;

// document elements
// var startScene, gameScene, standingScene;
// var startButton;

var CUIManager = require('../../modules/client/CUIManager.js');
var UIManager;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/gameConfig.FPS;
var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

// game var
var Manager;

// resource var
var resources;
var loadedResourcesCount = 0;
var resourceObject, resourceCharacter, resourceUI;

var userHandImgData = new Array(5);
var objGoldImgData, objJewelImgData, objSkillFireImgData, objSkillFrostImgData, objSkillArcaneImgData;
var castFireImgData, castFrostImgData, castArcaneImgData;
var projectileFireImgData, projectileFrostImgData, projectileArcaneImgData;
var skillFireImgData, skillFrostImgData, skillArcaneImgData;
var conditionFreezeImgData, conditionChillImgData, conditionImmortalImgData, conditionSilenceImgData,
    conditionIgnite1ImgData, conditionIgnite2ImgData, conditionIgnite3ImgData, conditionIgnite4ImgData, conditionIgnite5ImgData;
// var userImage, userHand;
// var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = stateFuncLoad;
var gameUpdateFunc = null;

var latency = 0;
var drawInterval = false;
var userDataUpdateInterval = false;

//draw skills range, explosionRadius.
var drawMode = gameConfig.DRAW_MODE_NORMAL;
//use when draw mode skill.
var mousePoint = {x : 0, y : 0};
var currentSkillData = null;

var characterType = 1;

var firoBaseSkill = 0, firoInherentPassiveSkill = 0, firoEquipSkills = new Array(4),
    freezerBaseSkill = 0, freezerInherentPassiveSkill = 0, freezerEquipSkills = new Array(4),
    mysterBaseSkill = 0, mysterInherentPassiveSkill = 0, mysterEquipSkills = new Array(4);

var baseSkill = 0;
var baseSkillData = null;
var inherentPassiveSkill = 0;
var inherentPassiveSkillData = null;
var equipSkills = new Array(4);
var equipSkillDatas = new Array(4);
var possessSkills = [];

var killUser = null;
//state changer
function changeState(newState){
  clearInterval(drawInterval);
  clearInterval(userDataUpdateInterval);
  drawInterval = false;
  userDataUpdateInterval = false;

  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = stateFuncLoad;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = stateFuncStandby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = stateFuncStart;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = stateFuncGame;
      break;
    case gameConfig.GAME_STATE_END:
      gameState = newState;
      gameSetupFunc = stateFuncEnd;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_RESTART_SCENE:
      gameState = newState;
      gameSetupFunc = null;
      gameUpdateFunc = stateFuncStandbyRestart;
      break;
    case gameConfig.GAME_STATE_RESTART:
      gameState = newState;
      gameSetupFunc = stateFuncRestart;
      gameUpdateFunc = null;
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
};

//load resource, base setting
function stateFuncLoad(){
  setBaseSetting();
  setCanvasSize();
  window.oncontextmenu = function(){
    return false;
  };
  window.onresize = function(){
    setCanvasSize();
  };
  UIManager.setSkillChangeBtn();
  loadResources();
};
//when all resource loaded. just draw start scene
function stateFuncStandby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function stateFuncStart(){
  UIManager.disableStartScene();
  setupSocket();
  socket.emit('reqStartGame', characterType);
};
//game play on
function stateFuncGame(){
  drawGame();
};
//show end message and restart button
function stateFuncEnd(){
  //should init variables
  canvasDisableEvent();
  documentDisableEvent();

  UIManager.playDeadScene(killUser);
  setTimeout(function(){
    UIManager.disableDeadScene();
    UIManager.initStandingScene();
    changeState(gameConfig.GAME_STATE_RESTART_SCENE);
  }, gameConfig.DEAD_SCENE_PLAY_TIME);
};
function stateFuncStandbyRestart(){
  drawRestartScene();
}
function stateFuncRestart(){
  UIManager.disableStandingScene();
  socket.emit('reqRestartGame', characterType, equipSkills);
};
//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  UIManager = new CUIManager(skillTable, buffGroupTable);
  UIManager.onStartBtnClick = function(charType, clickButton){
    characterType = charType;
    if(clickButton === gameConfig.START_BUTTON){
      changeState(gameConfig.GAME_STATE_GAME_START);
    }else if(clickButton === gameConfig.RESTART_BUTTON){
      changeState(gameConfig.GAME_STATE_RESTART);
    }
  };
  UIManager.onSkillUpgrade = function(skillIndex){
    socket.emit('upgradeSkill', skillIndex);
  };
  UIManager.onExchangeSkill = function(){
    updateCharTypeSkill();
  };
  UIManager.onExchangePassive = function(beforeBuffGID, afterBuffGID){
    socket.emit('exchangePassive', beforeBuffGID, afterBuffGID);
  };
  UIManager.onEquipPassive = function(buffGroupIndex){
    console.log('equip Passive : ' + buffGroupIndex);
    socket.emit('equipPassive', buffGroupIndex);
  };
  UIManager.onUnequipPassive = function(buffGroupIndex){
    console.log('unequip Passive : ' + buffGroupIndex);
    socket.emit('unequipPassive', buffGroupIndex);
  };
  UIManager.onSkillIconClick = function(skillSlot){
    if(skillSlot === gameConfig.SKILL_BASIC_INDEX){
      if(UIManager.checkCooltime(gameConfig.SKILL_BASIC_INDEX)){
        var skillData = Object.assign({}, baseSkillData);
      }
    }else if(skillSlot === gameConfig.SKILL_EQUIP1_INDEX){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP1_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[0]);
      }
    }else if(skillSlot === gameConfig.SKILL_EQUIP2_INDEX){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP2_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[1]);
      }
    }else if(skillSlot === gameConfig.SKILL_EQUIP3_INDEX){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP3_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[2]);
      }
    }else if(skillSlot === gameConfig.SKILL_EQUIP4_INDEX){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP4_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[3]);
      }
    }
    checkSkillConditionAndUse(skillData);
  };
  UIManager.onSelectSkillCancelBtnClick = function(){
    changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  };
  UIManager.initStartScene();
  UIManager.initHUD();
  UIManager.initPopUpSkillChanger();

  document.body.onmousedown = function(e){
    if(e.button === 2){
      if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
        changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
      }
    }
  };

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);
  Manager.onSkillFire = onSkillFireHandler;
  Manager.onProjectileSkillFire = onProjectileSkillFireHandler;
  Manager.onCancelCasting = onCancelCastingHandler;
  // resource 관련
  resources = require('../../modules/public/resources.json');

  resourceObject = new Image()
  resourceCharacter = new Image();
  resourceUI = new Image();

  userHandImgData[0] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_1));
  userHandImgData[1] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_2));
  userHandImgData[2] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_3));
  userHandImgData[3] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_4));
  userHandImgData[4] = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_USER_HAND_5));

  objGoldImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_GOLD));
  objJewelImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_JEWEL));
  objSkillFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_SKILL_FIRE));
  objSkillFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_SKILL_FROST));
  objSkillArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_OBJ_SKILL_ARCANE));

  castFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CASTING_FIRE));
  castFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CASTING_FROST));
  castArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CASTING_ARCANE));

  projectileFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_FIRE));
  projectileFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_FROST));
  projectileArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_PROJECTILE_ARCANE));

  skillFireImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_SKILL_EFFECT_FIRE));
  skillFrostImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_SKILL_EFFECT_FROST));
  skillArcaneImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_SKILL_EFFECT_ARCANE));

  conditionFreezeImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_FREEZE));
  conditionChillImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_CHILL));
  conditionImmortalImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IMMORTAL));
  conditionSilenceImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_SILENCE));
  conditionIgnite1ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE1));
  conditionIgnite2ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE2));
  conditionIgnite3ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE3));
  conditionIgnite4ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE4));
  conditionIgnite5ImgData = Object.assign({}, util.findData(resourceTable, 'index', gameConfig.RESOURCE_INDEX_CONDITION_IGNITE5));
  // grid = new Image();
  // grid.src = resources.GRID_SRC;
};
function loadResources(){
  resourceObject.src = gameConfig.RESOURCE_SRC_OBJECT;
  resourceObject.onload = loadResourceHandler;
  resourceCharacter.src = gameConfig.RESOURCE_SRC_CHARACTER;
  resourceCharacter.onload = loadResourceHandler;
  // resourceUI.src = gameConfig.RESOURCE_SRC_UI;
  // resourceUI.onload = loadResourceHandler;
};
function loadResourceHandler(){
  loadedResourcesCount++;
  if(loadedResourcesCount >= gameConfig.RESOURCES_COUNT){
    changeState(gameConfig.GAME_STATE_START_SCENE);
  }
};
function onSkillFireHandler(rawSkillData, syncFireTime){
  var skillData = Manager.processSkillData(rawSkillData);
  skillData.syncFireTime = syncFireTime;
  socket.emit('skillFired', skillData);
};
function onProjectileSkillFireHandler(rawProjectileDatas, syncFireTime){
  var projectileDatas = Manager.processProjectileData(rawProjectileDatas);
  console.log(rawProjectileDatas);
  socket.emit('projectilesFired', projectileDatas, syncFireTime);
};
function onCancelCastingHandler(){
  var userData = Manager.processUserData();
  socket.emit('castCanceled', userData);
};
function setCanvasSize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
  setCanvasScale(gameConfig);
};

function drawStartScene(){
  UIManager.drawStartScene();
};

function drawGame(){
  UIManager.drawGameScene();

  var startTime = Date.now();

  gameConfig.userOffset = calcOffset();

  drawScreen();
  drawBackground();
  drawGrid();
  drawObjs();
  drawUserEffect();
  drawUsers();
  drawObstacles();
  drawChests();
  drawEffect();
  drawProjectile();
  drawRiseText();
  if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawSkillRange();
  }
  // console.log(Date.now() - startTime);
};

function drawRestartScene(){
  UIManager.drawRestartScene();
};

// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('connect', function(){
    console.log('connection to the server');
  });
  socket.on('disconnect', function(){
    console.log('disconnected');
    changeState(gameConfig.GAME_STATE_RESTART_SCENE);
  });
  socket.on('pong', function(lat){
    latency = lat;
  });

  socket.on('syncAndSetSkills', function(user){
    //synchronize user
    var startTime = Date.now();
    gameConfig.userID = user.objectID;
    // gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);

    baseSkill = user.baseSkill;
    baseSkillData = Object.assign({}, util.findData(skillTable, 'index', user.baseSkill));
    inherentPassiveSkill = user.inherentPassiveSkill;
    inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', user.inherentPassiveSkill));
    for(var i=0; i<4; i++){
      if(user.equipSkills[i]){
        equipSkills[i] = user.equipSkills[i];
      }else{
        equipSkills[i] = undefined;
      }
    }
    for(var i=0; i<4; i++){
      if(user.equipSkills[i]){
        equipSkillDatas[i] = Object.assign({}, util.findData(skillTable, 'index', user.equipSkills[i]));
      }else{
        equipSkillDatas[i] = undefined;
      }
    };

    possessSkills = user.possessSkills;

    UIManager.syncSkills(baseSkill, baseSkillData, equipSkills, equipSkillDatas, possessSkills, inherentPassiveSkill, inherentPassiveSkillData);
    UIManager.setHUDSkills();
    UIManager.updateBuffIcon();
    UIManager.setHUDStats(user.statPower, user.statMagic, user.statSpeed);
    UIManager.setCooldownReduceRate(user.cooldownReduceRate);
    UIManager.setPopUpSkillChange();

    UIManager.setUserPosition(user.position);
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, objDatas, chestDatas){
    Manager.start(userStatTable, resourceTable, obstacleTable);
    Manager.setUsers(userDatas);
    // Manager.setUsersSkills(skillDatas);
    // Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);
    Manager.setChests(chestDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.onMainUserMove = function(user){
      UIManager.updateUserPosition(user.position);
    }
    var chestLocationDatas = Object.assign({}, util.findAllDatas(obstacleTable, 'type', gameConfig.OBJ_TYPE_CHEST_GROUND));

    UIManager.setBoard(userDatas, gameConfig.userID);
    UIManager.setMiniMapChests(chestDatas, chestLocationDatas);
    // console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, INTERVAL_TIMER);
  });
  socket.on('resRestartGame', function(userData){
    Manager.iamRestart(userData);
    Manager.updateUserData(userData);
    Manager.changeUserStat(userData, true);

    canvasAddEvent();
    documentAddEvent();

    baseSkill = userData.baseSkill;
    baseSkillData = Object.assign({}, util.findData(skillTable, 'index', userData.baseSkill));
    inherentPassiveSkill = userData.inherentPassiveSkill;
    inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', userData.inherentPassiveSkill));

    switch (characterType) {
      case gameConfig.CHAR_TYPE_FIRE:
        for(var i=0; i<4; i++){
          equipSkills[i] = firoEquipSkills[i];
        }
        break;
      case gameConfig.CHAR_TYPE_FROST:
        for(var i=0; i<4; i++){
          equipSkills[i] = freezerEquipSkills[i];
        }
        break;
      case gameConfig.CHAR_TYPE_ARCANE:
        for(var i=0; i<4; i++){
          equipSkills[i] = mysterEquipSkills[i];
        }
        break;
    }

    for(var i=0; i<4; i++){
      if(equipSkills[i]){
        equipSkillDatas[i] = Object.assign({}, util.findData(skillTable, 'index', equipSkills[i]));
      }else{
        equipSkillDatas[i] = undefined;
      }
    };

    possessSkills = userData.possessSkills;

    UIManager.syncSkills(baseSkill, baseSkillData, equipSkills, equipSkillDatas, possessSkills, inherentPassiveSkill, inherentPassiveSkillData);
    UIManager.setHUDSkills();
    // UIManager.updateBuffIcon();
    UIManager.setHUDStats(userData.statPower, userData.statMagic, userData.statSpeed);
    UIManager.setCooldownReduceRate(userData.cooldownReduceRate);
    UIManager.setPopUpSkillChange();
    UIManager.updateHP(userData);
    UIManager.updateMP(userData);

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, INTERVAL_TIMER);
  });
  socket.on('userJoined', function(data, rankDatas){
    data.imgData = Manager.setImgData(data);
    Manager.setUser(data);
    UIManager.updateBoard(rankDatas, gameConfig.userID);
    console.log('user joined ' + data.objectID);
  });
  socket.on('userDataUpdate', function(userData){
    console.log(userData);
    Manager.updateUserData(userData);
  });
  socket.on('userDataUpdateAndUseSkill', function(userData){
    Manager.updateUserData(userData);
    var skillData = Object.assign({}, util.findData(skillTable, 'index', userData.skillIndex));

    Manager.applyCastSpeed(userData.objectID, skillData);
    skillData.targetPosition = userData.skillTargetPosition;
    skillData.direction = userData.skillDirection;
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION ||
       skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
      skillData.projectileIDs = userData.skillProjectileIDs;
    }
    Manager.useSkill(userData.objectID, skillData);
  });
  socket.on('skillFired', function(data, userID){
    var timeoutTime = data.syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      var skillData = Object.assign({}, util.findData(skillTable, 'index', data.skillIndex));
      skillData.targetPosition = data.skillTargetPosition;
      if(userID === gameConfig.userID){
        UIManager.applySkill(skillData.index);
      }
      Manager.applySkill(skillData);
    }, timeoutTime);
  });
  socket.on('projectilesFired', function(datas, syncFireTime, userID){
    var timeoutTime = syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      for(var i=0; i<datas.length; i++){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', datas[i].skillIndex));
        skillData.userID = userID;
        skillData.objectID = datas[i].objectID;
        skillData.position = datas[i].position;
        skillData.speed = datas[i].speed;
        skillData.startTime = Date.now();

        if(userID == gameConfig.userID){
          UIManager.applySkill(skillData.index);
        }
        Manager.applyProjectile(skillData);
      }
    }, timeoutTime);
  });
  socket.on('upgradeSkill', function(beforeSkillIndex, afterSkillIndex){
    if(beforeSkillIndex === baseSkill){
      baseSkill = afterSkillIndex;
      baseSkillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
      UIManager.upgradeBaseSkill(baseSkill, baseSkillData);
    }else if(beforeSkillIndex === inherentPassiveSkill){
      inherentPassiveSkill = afterSkillIndex;
      inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
      UIManager.upgradeInherentSkill(inherentPassiveSkill, inherentPassiveSkillData);
    }else{
      for(var i=0; i<possessSkills.length; i++){
        if(possessSkills[i] === beforeSkillIndex){
          UIManager.upgradePossessionSkill(beforeSkillIndex, afterSkillIndex);
          break;
        }
      }
    }
    updateCharTypeSkill();
  });
  socket.on('updateUserPrivateStat', function(statData){
    UIManager.setHUDStats(statData.statPower, statData.statMagic, statData.statSpeed);
    UIManager.setCooldownReduceRate(statData.cooldownReduceRate);
  });
  socket.on('deleteProjectile', function(projectileID, userID){
    Manager.deleteProjectile(projectileID, userID);
  });
  socket.on('explodeProjectile', function(projectileID, userID, position){
    Manager.explodeProjectile(projectileID, userID, position);
  });
  socket.on('castCanceled', function(userID){
    Manager.cancelCasting(userID);
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
    UIManager.createChest(chestData.locationID);
  });
  socket.on('deleteChest', function(locationID){
    Manager.deleteChest(locationID);
    UIManager.deleteChest(locationID);
  });
  socket.on('getResource', function(resourceData){
    UIManager.getResource(resourceData);
  });
  socket.on('changeUserStat', function(userData){
    if(userData.objectID === gameConfig.userID){
      var beforeHP = Manager.getUserHP(userData.objectID);
      var beforeExp = Manager.getUserExp(userData.objectID);
    }
    Manager.changeUserStat(userData);
    if(userData.objectID === gameConfig.userID){
      UIManager.updateHP(userData);
      UIManager.updateMP(userData);

      var needExp = Object.assign({}, util.findDataWithTwoColumns(userStatTable, 'type', characterType, 'level', userData.level)).needExp;
      UIManager.updateExp(userData, needExp);
    }
    if(userData.objectID === gameConfig.userID){
      var afterHP = Manager.getUserHP(userData.objectID);
      var afterExp = Manager.getUserExp(userData.objectID);
      var userCenter = Manager.getUserCenter(userData.objectID);
      if(beforeHP !== afterHP){
        Manager.addRiseText(afterHP - beforeHP, 'rgb(255, 0, 0)', userCenter);
      }
      if(afterExp > beforeExp){
        Manager.addRiseText(afterExp - beforeExp, 'rgb(0, 255, 0)', userCenter);
      }
    }
  });
  socket.on('userDamaged', function(userData, skillIndex){
    if(skillIndex){
      console.log('skillIndex : ' + skillIndex);
      var skillImgDataIndex = Object.assign({}, util.findData(skillTable, 'index', skillIndex)).hitEffectGroup;
      var skillImgData = Object.assign({}, util.findData(effectGroupTable, 'index', skillImgDataIndex));
      var hasResource = util.setResourceData(resourceTable, skillImgData);
      if(hasResource){
        Manager.updateSkillHitImgData(userData.objectID, skillImgData);
      }
    }
    Manager.changeUserStat(userData);
    if(userData.objectID === gameConfig.userID){
      UIManager.updateHP(userData);
    }
  });
  socket.on('updateBuff', function(buffData){
    if(buffData.objectID === gameConfig.userID){
      UIManager.updateBuffIcon(buffData.passiveList, buffData.buffList);
    }
    //set buffImg data
    var buffImgDataList = [];
    for(var i=0; i<buffData.buffList.length; i++){
      var buffImgDataIndex = Object.assign({}, util.findData(buffGroupTable, 'index', buffData.buffList[i].index)).buffEffectGroup;
      var buffImgData = Object.assign({}, util.findData(effectGroupTable, 'index', buffImgDataIndex));
      var hasResource = util.setResourceData(resourceTable, buffImgData);
      if(hasResource){
        buffImgDataList.push(buffImgData);
      }
    }
    Manager.updateUserBuffImgData(buffData.objectID, buffImgDataList);
  });
  socket.on('updateSkillPossessions', function(possessSkillIndexes){
    Manager.updateSkillPossessions(gameConfig.userID, possessSkillIndexes);
    possessSkills = possessSkillIndexes;
    UIManager.updatePossessionSkills(possessSkills);
    UIManager.setPopUpSkillChange();
  });
  socket.on('userDead', function(attackUserID, deadUserID, userDatas){
    if(deadUserID === gameConfig.userID){
      Manager.iamDead();
      changeState(gameConfig.GAME_STATE_END);
    }
    killUser = attackUserID;
    Manager.kickUser(deadUserID);
    UIManager.updateBoard(userDatas, gameConfig.userID);
  });
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "rgb(69, 46, 4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){
  // ctx.beginPath();
  // ctx.save();
  // var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
  // ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
  // ctx.rotate(radian);
  // ctx.drawImage(resourceCharacter, Manager.users[index].imgData.srcPosX, Manager.users[index].imgData.srcPosY, Manager.users[index].imgData.srcWidth, Manager.users[index].imgData.srcHeight,
  //               -Manager.users[index].imgData.width/2, -Manager.users[index].imgData.height/2, Manager.users[index].imgData.width, Manager.users[index].imgData.height);
  // ctx.closePath();

  for(var i=0; i<Manager.obstacles.length; i++){
    ctx.beginPath();
    // if(Manager.obstacles[i].staticEle.isCollide){
    //   ctx.fillStyle ="#ff0000";
    // }else{
    //   ctx.fillStyle ="#000000";
    // }
    var center = util.worldToLocalPosition(Manager.obstacles[i].center, gameConfig.userOffset);
    ctx.drawImage(resourceObject, Manager.obstacles[i].imgData.srcPosX, Manager.obstacles[i].imgData.srcPosY, Manager.obstacles[i].imgData.srcWidth, Manager.obstacles[i].imgData.srcHeight,
                  (center.x - Manager.obstacles[i].imgData.width/2) * gameConfig.scaleFactor, (center.y - Manager.obstacles[i].imgData.height/2) * gameConfig.scaleFactor, Manager.obstacles[i].imgData.width * gameConfig.scaleFactor, Manager.obstacles[i].imgData.height * gameConfig.scaleFactor);
    // ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor,
    //         resources.OBJ_TREE_SIZE/2 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.lineWidth = 5;
    // ctx.strokeStyle = '#003300';
    // ctx.stroke();
    ctx.closePath();
    // ctx.fillRect(Manager.obstacles[index].staticEle.x, Manager.obstacles[index].staticEle.y, resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE);
  }
};
function drawChests(){
  // ctx.fillStyle = "#00ff00";
  for(var i=0; i<Manager.chests.length; i++){
    ctx.beginPath();
    var center = util.worldToLocalPosition(Manager.chests[i].center, gameConfig.userOffset);
    ctx.drawImage(resourceObject, Manager.chests[i].imgData.srcPosX, Manager.chests[i].imgData.srcPosY, Manager.chests[i].imgData.srcWidth, Manager.chests[i].imgData.srcHeight,
                  (center.x - Manager.chests[i].imgData.width/2) * gameConfig.scaleFactor, (center.y - Manager.chests[i].imgData.height/2) * gameConfig.scaleFactor, Manager.chests[i].imgData.width * gameConfig.scaleFactor, Manager.chests[i].imgData.height * gameConfig.scaleFactor);
    // var pos = util.worldToLocalPosition(Manager.chests[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor,
    //               Manager.chests[i].size.width * gameConfig.scaleFactor, Manager.chests[i].size.height * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawObjs(){
  // var objGoldImgData, objJewelImgData, objSkillFireImgData, objSkillFrostImgData, objSkillArcaneImgData;

  for(var i=0; i<Manager.objGolds.length; i++){
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.objGolds[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.objGolds[i].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceObject, objGoldImgData.srcPosX, objGoldImgData.srcPosY, objGoldImgData.srcWidth, objGoldImgData.srcHeight, posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.objGolds[i].radius * 2 * gameConfig.scaleFactor, Manager.objGolds[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objGolds[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  for(var i=0; i<Manager.objJewels.length; i++){
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.objJewels[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.objJewels[i].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceObject, objJewelImgData.srcPosX, objJewelImgData.srcPosY, objJewelImgData.srcWidth, objJewelImgData.srcHeight, posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.objJewels[i].radius * 2 * gameConfig.scaleFactor, Manager.objJewels[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objJewels[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  // for(var i=0; i<Manager.objExps.length; i++){
  //   ctx.beginPath();
  //   var centerX = util.worldXCoordToLocalX(Manager.objExps[i].position.x + Manager.objExps[i].radius, gameConfig.userOffset.x);
  //   var centerY = util.worldYCoordToLocalY(Manager.objExps[i].position.y + Manager.objExps[i].radius, gameConfig.userOffset.y);
  //   ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objExps[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
  //   ctx.fill();
  //   // var pos = util.worldToLocalPosition(Manager.objExps[i].position, gameConfig.userOffset);
  //   // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor);
  //   ctx.closePath();
  // };
  for(var i=0; i<Manager.objSkills.length; i++){
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.objSkills[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.objSkills[i].position.y, gameConfig.userOffset.y);
    switch (Manager.objSkills[i].property) {
      case gameConfig.SKILL_PROPERTY_FIRE:
        var skillImgData = objSkillFireImgData;
        break;
      case gameConfig.SKILL_PROPERTY_FROST:
        skillImgData = objSkillFrostImgData;
        break;
      case gameConfig.SKILL_PROPERTY_ARCANE:
        skillImgData = objSkillArcaneImgData;
        break;
      default:
    }
    ctx.drawImage(resourceObject, skillImgData.srcPosX, skillImgData.srcPosY, skillImgData.srcWidth, skillImgData.srcHeight, posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objSkills[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawUserEffect(){
  for(var i=0; i<Manager.userEffects.length; i++){
    var imgData = Manager.userEffects[i]['resourceIndex' + (Manager.userEffects[i].effectIndex + 1)];
    var center = util.worldToLocalPosition(Manager.userEffects[i].center, gameConfig.userOffset);
    ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  (center.x - imgData.width/2) * gameConfig.scaleFactor, (center.y -imgData.height/2) * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
  }
};
function drawUsers(){
  for(var index in Manager.users){
    if(Manager.users[index].conditions[gameConfig.USER_CONDITION_BLUR]){
      if(index === gameConfig.userID){
        ctx.globalAlpha = 0.6;
      }else{
        ctx.globalAlpha = 0.3;
      }
    }else{
      ctx.globalAlpha = 1;
    }
    var radian = Manager.users[index].direction * radianFactor;
    ctx.beginPath();
    ctx.save();
    // ctx.setTransform(1,0,0,1,0,0);
    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
    ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
    ctx.rotate(radian);
    // var posX = util.worldXCoordToLocalX(Manager.users[index].position.x, gameConfig.userOffset.x);
    // var posY = util.worldYCoordToLocalY(Manager.users[index].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceCharacter, Manager.users[index].imgData.srcPosX, Manager.users[index].imgData.srcPosY, Manager.users[index].imgData.srcWidth, Manager.users[index].imgData.srcHeight,
                  -Manager.users[index].imgData.width/2 * gameConfig.scaleFactor, -Manager.users[index].imgData.height/2 * gameConfig.scaleFactor, Manager.users[index].imgData.width *gameConfig.scaleFactor, Manager.users[index].imgData.height * gameConfig.scaleFactor);
    //draw Hand
    var imgData = userHandImgData[Manager.users[index].imgHandIndex];
    ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
    ctx.closePath();

    //draw cast effect
    if(Manager.users[index].skillCastEffectPlay){
      // ctx.fillStyle ="#00ff00";
      ctx.beginPath();
      switch (Manager.users[index].currentSkill.property) {
        case gameConfig.SKILL_PROPERTY_FIRE:
          var imgData = castFireImgData;
          break;
        case gameConfig.SKILL_PROPERTY_FROST:
          imgData = castFrostImgData;
          break;
        case gameConfig.SKILL_PROPERTY_ARCANE:
          imgData = castArcaneImgData;
          break;
        default:
      }
      var scaleFactor = Manager.users[index].castEffectFactor;
      ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  -imgData.width/2 * gameConfig.scaleFactor * scaleFactor, -imgData.height/2 * gameConfig.scaleFactor * scaleFactor, imgData.width * gameConfig.scaleFactor * scaleFactor, imgData.height * gameConfig.scaleFactor * scaleFactor);
      ctx.closePath();
    }
    for(var i=0; i<Manager.users[index].hitImgDataList.length; i++){
      var imgIndex = Manager.users[index].effectIndex % Manager.users[index].hitImgDataList[i].resourceLength + 1;
      var imgData = Manager.users[index].hitImgDataList[i]['resourceIndex' + imgIndex];
      if(Manager.users[index].hitImgDataList[i].isAttach){
        if(Manager.users[index].hitImgDataList[i].isRotate){
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          var effectRadian = (Manager.users[index].hitImgDataList[i].rotateStartDegree + Manager.users[index].effectRotateDegree) * radianFactor;
          ctx.rotate(effectRadian);
          ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          ctx.rotate(radian);
        }else{
          ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
        }
      }
    }
    for(var i=0; i<Manager.users[index].buffImgDataList.length; i++){
      var imgIndex = Manager.users[index].effectIndex % Manager.users[index].buffImgDataList[i].resourceLength + 1;
      var imgData = Manager.users[index].buffImgDataList[i]['resourceIndex' + imgIndex];
      if(Manager.users[index].buffImgDataList[i].isAttach){
        if(Manager.users[index].buffImgDataList[i].isRotate){
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          var effectRadian = (Manager.users[index].buffImgDataList[i].rotateStartDegree + Manager.users[index].effectRotateDegree) * radianFactor;
          ctx.rotate(effectRadian);
          ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
          ctx.restore();
          ctx.save();
          ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
          ctx.rotate(radian);
        }else{
          ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
            -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
        }
      }
    }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_FREEZE]){
    //   ctx.drawImage(resourceCharacter, conditionFreezeImgData.srcPosX, conditionFreezeImgData.srcPosY, conditionFreezeImgData.srcWidth, conditionFreezeImgData.srcHeight,
    //                 -conditionFreezeImgData.width/2 * gameConfig.scaleFactor, -conditionFreezeImgData.height/2 * gameConfig.scaleFactor, conditionFreezeImgData.width * gameConfig.scaleFactor, conditionFreezeImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_CHILL]){
    //   ctx.drawImage(resourceCharacter, conditionChillImgData.srcPosX, conditionChillImgData.srcPosY, conditionChillImgData.srcWidth, conditionChillImgData.srcHeight,
    //                 -conditionChillImgData.width/2 * gameConfig.scaleFactor, -conditionChillImgData.height/2 * gameConfig.scaleFactor, conditionChillImgData.width * gameConfig.scaleFactor, conditionChillImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_SILENCE]){
    //   ctx.drawImage(resourceCharacter, conditionSilenceImgData.srcPosX, conditionSilenceImgData.srcPosY, conditionSilenceImgData.srcWidth, conditionSilenceImgData.srcHeight,
    //                 -conditionSilenceImgData.width/2 * gameConfig.scaleFactor, -conditionSilenceImgData.height/2 * gameConfig.scaleFactor, conditionSilenceImgData.width * gameConfig.scaleFactor, conditionSilenceImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_IMMORTAL]){
    //   radian = Manager.users[index].effectRotateDegree * radianFactor;
    //   ctx.rotate(radian);
    //   ctx.drawImage(resourceCharacter, conditionImmortalImgData.srcPosX, conditionImmortalImgData.srcPosY, conditionImmortalImgData.srcWidth, conditionImmortalImgData.srcHeight,
    //                 -conditionImmortalImgData.width/2 * gameConfig.scaleFactor, -conditionImmortalImgData.height/2 * gameConfig.scaleFactor, conditionImmortalImgData.width * gameConfig.scaleFactor, conditionImmortalImgData.height * gameConfig.scaleFactor);
    // }
    // if(Manager.users[index].conditions[gameConfig.USER_CONDITION_IGNITE]){
    //   switch (Manager.users[index].effectIndex) {
    //     case 0:
    //       imgData = conditionIgnite1ImgData;
    //       break;
    //     case 1:
    //       imgData = conditionIgnite2ImgData;
    //       break;
    //     case 2:
    //       imgData = conditionIgnite3ImgData;
    //       break;
    //     case 3:
    //       imgData = conditionIgnite4ImgData;
    //       break;
    //     case 4:
    //       imgData = conditionIgnite5ImgData;
    //       break;
    //     default:
    //   }
    //   ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
    //               -imgData.width/2 * gameConfig.scaleFactor, -imgData.height/2 * gameConfig.scaleFactor, imgData.width * gameConfig.scaleFactor, imgData.height * gameConfig.scaleFactor);
    // }

    ctx.restore();

    //draw HP gauge
    ctx.beginPath();
    var pos = util.worldToLocalPosition(Manager.users[index].position, gameConfig.userOffset);

    ctx.fillStyle = "#00ff00";
    var HPPercent = Manager.users[index].HP / Manager.users[index].maxHP;
    var width = Manager.users[index].HP / Manager.users[index].maxHP * 85 * gameConfig.scaleFactor;
    var height = 10 * gameConfig.scaleFactor;
    ctx.fillRect((pos.x - 10) * gameConfig.scaleFactor, (pos.y + 80) * gameConfig.scaleFactor, width, height);

    ctx.strokeStyle = "#000000";
    width = 85 * gameConfig.scaleFactor;
    ctx.strokeRect((pos.x - 10) * gameConfig.scaleFactor, (pos.y + 80) * gameConfig.scaleFactor, width, height);
    ctx.closePath();
  }
  ctx.globalAlpha = 1;
};
function drawEffect(){
  for(var i=0; i<Manager.effects.length; i++){
    ctx.beginPath();
    ctx.fillStyle ="#ff0000";
    switch (Manager.effects[i].property) {
      case gameConfig.SKILL_PROPERTY_FIRE:
        var imgData = skillFireImgData;
        break;
      case gameConfig.SKILL_PROPERTY_FROST:
        imgData = skillFrostImgData;
        break;
      case gameConfig.SKILL_PROPERTY_ARCANE:
        imgData = skillArcaneImgData;
        break;
      default:
    }
    var centerX = util.worldXCoordToLocalX(Manager.effects[i].position.x + Manager.effects[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.effects[i].position.y + Manager.effects[i].radius, gameConfig.userOffset.y);
    // var radius = Manager.effects[i].radius;
    var radius = Manager.effects[i].radius * Manager.effects[i].scaleFactor;
    // var posX = util.worldXCoordToLocalX(Manager.effects[i].position.x, gameConfig.userOffset.x);
    // var posY = util.worldYCoordToLocalY(Manager.effects[i].position.y, gameConfig.userOffset.y);
    ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  (centerX - radius) * gameConfig.scaleFactor, (centerY - radius) * gameConfig.scaleFactor, radius * 2 * gameConfig.scaleFactor, radius * 2 * gameConfig.scaleFactor);
    // var centerX = util.worldXCoordToLocalX(Manager.effects[i].position.x + Manager.effects[i].radius, gameConfig.userOffset.x);
    // var centerY = util.worldYCoordToLocalY(Manager.effects[i].position.y + Manager.effects[i].radius, gameConfig.userOffset.y);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.effects[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    // ctx.fill();

    ctx.closePath();
  }
};
function drawProjectile(){
  for(var i=0; i<Manager.projectiles.length; i++){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    var posX = util.worldXCoordToLocalX(Manager.projectiles[i].position.x, gameConfig.userOffset.x);
    var posY = util.worldYCoordToLocalY(Manager.projectiles[i].position.y, gameConfig.userOffset.y);
    // ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.projectiles[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    switch (Manager.projectiles[i].property) {
      case gameConfig.SKILL_PROPERTY_FIRE:
        var imgData = projectileFireImgData;
        break;
      case gameConfig.SKILL_PROPERTY_FROST:
        imgData = projectileFrostImgData;
        break;
      case gameConfig.SKILL_PROPERTY_ARCANE:
        imgData = projectileArcaneImgData;
        break;
      default:
    }
    ctx.drawImage(resourceCharacter, imgData.srcPosX, imgData.srcPosY, imgData.srcWidth, imgData.srcHeight,
                  posX * gameConfig.scaleFactor, posY * gameConfig.scaleFactor, Manager.projectiles[i].radius * 2 * gameConfig.scaleFactor, Manager.projectiles[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawRiseText(){
  for(var i=0; i<Manager.riseText.length; i++){
    ctx.font = "30px Arial";
    ctx.fillStyle = Manager.riseText[i].color;
    // console.log(Manager.riseText[i].position);
    var pos = util.worldToLocalPosition(Manager.riseText[i].position, gameConfig.userOffset);
    ctx.fillText(Manager.riseText[i].text, pos.x, pos.y);
  }
};
function drawSkillRange(){
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.8;
  var center = util.worldToLocalPosition(Manager.users[gameConfig.userID].center, gameConfig.userOffset);
  ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor, currentSkillData.range * gameConfig.scaleFactor, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  //draw explosionRadius
  ctx.beginPath();
  ctx.globalAlpha = 0.9;
  ctx.arc(mousePoint.x * gameConfig.scaleFactor, mousePoint.y * gameConfig.scaleFactor, currentSkillData.explosionRadius * gameConfig.scaleFactor, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1
};
function drawBackground(){
  ctx.fillStyle = "rgb(105, 147, 50)";
  var posX = -gameConfig.userOffset.x * gameConfig.scaleFactor;
  var posY = -gameConfig.userOffset.y * gameConfig.scaleFactor;
  var sizeW = gameConfig.CANVAS_MAX_SIZE.width * gameConfig.scaleFactor;
  var sizeH = gameConfig.CANVAS_MAX_SIZE.height * gameConfig.scaleFactor;
  ctx.fillRect(posX, posY, sizeW, sizeH);
};
function drawGrid(){
  // for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resources.GRID_SIZE){
  //   var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
  //   if(x * gameConfig.scaleFactor >= -resources.GRID_SIZE && x * gameConfig.scaleFactor <= gameConfig.canvasSize.width){
  //     for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resources.GRID_SIZE){
  //        var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
  //        if(y * gameConfig.scaleFactor >= -resources.GRID_SIZE && y * gameConfig.scaleFactor <= gameConfig.canvasSize.height){
  //          ctx.drawImage(grid, 0, 0, 48, 48, x * gameConfig.scaleFactor, y * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor);
  //        }
  //     }
  //   }
  // }
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgb(103, 124, 81)';
  // ctx.globalAlpha = 0.15;
  ctx.beginPath();
 // - (gameConfig.CANVAS_MAX_LOCAL_SIZE.width * gameConfig.scaleFactor)/2
 //  - (gameConfig.CANVAS_MAX_LOCAL_SIZE.height * gameConfig.scaleFactor)/2
  for(var x = - gameConfig.userOffset.x - 800; x<gameConfig.canvasSize.width; x += gameConfig.CANVAS_MAX_LOCAL_SIZE.width/32){
    if(util.isXInCanvas(x, gameConfig)){
      ctx.moveTo(x * gameConfig.scaleFactor, 0);
      ctx.lineTo(x * gameConfig.scaleFactor, gameConfig.canvasSize.height);
    }
  };
  for(var y = - gameConfig.userOffset.y - 500; y<gameConfig.canvasSize.height; y += gameConfig.CANVAS_MAX_LOCAL_SIZE.height/20){
    if(util.isYInCanvas(y, gameConfig)){
      ctx.moveTo(0, y * gameConfig.scaleFactor);
      ctx.lineTo(gameConfig.canvasSize.width, y * gameConfig.scaleFactor);
    }
  };
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.closePath();
};
function updateUserDataHandler(){
  var userData = Manager.processUserData();
  // userData.latency = latency;
  socket.emit('userDataUpdate', userData);
};
function canvasAddEvent(){
  canvas.addEventListener('click', canvasEventHandler, false);
};
function documentAddEvent(){
  document.addEventListener('keydown', documentEventHandler, false);
};
update();

var canvasEventHandler = function(e){
  var clickPosition ={
    x : e.clientX/gameConfig.scaleFactor,
    y : e.clientY/gameConfig.scaleFactor
  }
  var worldClickPosition = util.localToWorldPosition(clickPosition, gameConfig.userOffset);

  if(drawMode === gameConfig.DRAW_MODE_NORMAL){
    var targetPosition = util.setTargetPosition(worldClickPosition, Manager.users[gameConfig.userID]);
    Manager.moveUser(targetPosition);

    var userData = Manager.processUserData();
    userData.targetPosition = targetPosition;
    userData.latency = latency;
    socket.emit('userMoveStart', userData);
  }else if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    useSkill(currentSkillData, worldClickPosition, Manager.users[gameConfig.userID]);
    changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  }
};

var documentEventHandler = function(e){
  if(drawMode === gameConfig.DRAW_MODE_NORMAL){
    var keyCode = e.keyCode;

    if(keyCode === 69 || keyCode === 32){
      if(UIManager.checkCooltime(gameConfig.SKILL_BASIC_INDEX)){
        var skillData = Object.assign({}, baseSkillData);
      }
    }else if(keyCode === 49){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP1_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[0]);
      }
    }else if(keyCode === 50){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP2_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[1]);
      }
    }else if(keyCode === 51){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP3_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[2]);
      }
    }else if(keyCode === 52){
      if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP4_INDEX)){
        skillData = Object.assign({}, equipSkillDatas[3]);
      }
    }else if(keyCode === 27){
      if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
        changeDrawMode(gameConfig.DRAW_MODE_NORMAL)
      }
    }
    checkSkillConditionAndUse(skillData);
  }
};
function checkSkillConditionAndUse(skillData){
  if(skillData){
    if(Manager.user.MP > skillData.consumeMP){
      Manager.applyCastSpeed(gameConfig.userID, skillData);
      if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION
        || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION
        || skillData.type === gameConfig.SKILL_TYPE_RANGE){
        if(drawMode === gameConfig.DRAW_MODE_NORMAL){
          currentSkillData = skillData;
          changeDrawMode(gameConfig.DRAW_MODE_SKILL_RANGE);
        }
      }else{
        useSkill(skillData, Manager.users[gameConfig.userID].center, Manager.users[gameConfig.userID]);
      }
    }else{
      if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
        changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
      }
    }
  }
  // else if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
  //   changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  // }
};
function changeDrawMode(mode){
  if(mode === gameConfig.DRAW_MODE_NORMAL){
    drawMode = gameConfig.DRAW_MODE_NORMAL;
    currentSkillData = null;
    UIManager.disableSelectSkillInfo();
    canvas.removeEventListener('mousemove', mouseMoveHandler);
  }else if(mode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawMode = gameConfig.DRAW_MODE_SKILL_RANGE;
    UIManager.enableSelectSkillInfo(currentSkillData);
    canvas.addEventListener('mousemove', mouseMoveHandler, false);
  }
};
function mouseMoveHandler(e){
  mousePoint.x = e.clientX/gameConfig.scaleFactor;
  mousePoint.y = e.clientY/gameConfig.scaleFactor;
};
function useSkill(skillData, clickPosition, user){
  if(!user.conditions[gameConfig.USER_CONDITION_FREEZE] && !user.conditions[gameConfig.USER_CONDITION_SILENCE]){
    skillData.targetPosition = util.calcSkillTargetPosition(skillData, clickPosition, user);
    skillData.direction = util.calcSkillTargetDirection(skillData.type, skillData.targetPosition, user);
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
      skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION
      || skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
        skillData.projectileIDs = util.generateRandomUniqueID(Manager.projectiles, gameConfig.PREFIX_SKILL_PROJECTILE, skillData.projectileCount);
      }
      Manager.useSkill(gameConfig.userID, skillData);

      var userData = Manager.processUserData();
      userData.skillIndex = skillData.index;
      userData.skillDirection = skillData.direction;
      userData.skillTargetPosition = skillData.targetPosition;
      if(skillData.projectileIDs){
        userData.projectileIDs = skillData.projectileIDs;
      }
      if(user.conditions[gameConfig.USER_CONDITION_BLUR]){
        userData.cancelBlur = true;
      }
      console.log(userData);
      socket.emit('userUseSkill', userData);
  }
};
function updateCharTypeSkill(){
  switch (characterType) {
    case gameConfig.CHAR_TYPE_FIRE:
      firoBaseSkill = baseSkill;
      firoInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        firoEquipSkills[i] = equipSkills[i];
      }
      break;
    case gameConfig.CHAR_TYPE_FROST:
      freezerBaseSkill = baseSkill;
      freezerInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        freezerEquipSkills[i] = equipSkills[i];
      }
      break;
    case gameConfig.CHAR_TYPE_ARCANE:
      mysterBaseSkill = baseSkill;
      mysterInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        mysterEquipSkills[i] = equipSkills[i];
      }
      break;
  }
};
function canvasDisableEvent(){
  canvas.removeEventListener('click', canvasEventHandler);
};
function documentDisableEvent(){
  document.removeEventListener('keydown', documentEventHandler);
};
function setCanvasScale(gameConfig){
  gameConfig.scaleX = 1;
  gameConfig.scaleY = 1;
  if(gameConfig.canvasSize.width >= gameConfig.CANVAS_MAX_LOCAL_SIZE.width){
    gameConfig.scaleX =  (gameConfig.canvasSize.width / gameConfig.CANVAS_MAX_LOCAL_SIZE.width);
  }
  if(gameConfig.canvasSize.height >= gameConfig.CANVAS_MAX_LOCAL_SIZE.height){
    gameConfig.scaleY = (gameConfig.canvasSize.height / gameConfig.CANVAS_MAX_LOCAL_SIZE.height);
  }
  if(gameConfig.scaleX > gameConfig.scaleY){
    gameConfig.scaleFactor = gameConfig.scaleX;
  }else{
    gameConfig.scaleFactor = gameConfig.scaleY;
  }
};
function calcOffset(){
  return {
    x : Manager.user.center.x - gameConfig.canvasSize.width/(2 * gameConfig.scaleFactor),
    y : Manager.user.center.y - gameConfig.canvasSize.height/(2 * gameConfig.scaleFactor)
  };
};

},{"../../modules/client/CManager.js":1,"../../modules/client/CUIManager.js":4,"../../modules/client/CUser.js":5,"../../modules/public/csvjson.js":6,"../../modules/public/data.json":7,"../../modules/public/gameConfig.json":8,"../../modules/public/resources.json":10,"../../modules/public/util.js":11}]},{},[12]);
