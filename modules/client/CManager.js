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
				HP : chestData.HP,
				maxHP : chestData.maxHP,
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
	updateChest : function(locationID, HP){
		for(var i=0; i<this.chests.length; i++){
			if(this.chests[i].locationID === locationID){
				this.chests[i].HP = HP;
				break;
			}
		}
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
			this.users[objID].stop();
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
	moveAndAttackUser : function(userID, userTargetPosition, skillData, moveBackward){
		if(userID in this.users){
			this.users[userID].targetPosition = userTargetPosition;
			this.users[userID].setCenter();
			if(moveBackward){
				this.users[userID].setTargetDirection(moveBackward);
				this.users[userID].setSpeed(gameConfig.MOVE_BACK_WARD_SPEED_DECREASE_RATE);
			}else{
				this.users[userID].setTargetDirection();
				this.users[userID].setSpeed();
			}

			skillData.direction = this.users[userID].targetDirection;
			var skillInstance = this.users[userID].makeSkillInstance(skillData);

			var thisUser = this.user;
			var mainUser = this.users[userID];
			var thisOnSkillFire = this.onSkillFire;

			skillInstance.onFire = function(syncFireTime){
				if(thisUser === mainUser){
					thisOnSkillFire(skillData);
				}
				mainUser.skillCastEffectPlay = false;
			}
			this.users[userID].changeState(gameConfig.OBJECT_STATE_MOVE_AND_ATTACK);
			this.users[userID].setSkill(skillInstance);
		}
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
		if(userID in this.users){
			this.users[userID].updateSkillPossessions(possessSkills);
		}
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
		if(this.user.currentState === gameConfig.OBJECT_STATE)
		var currentState
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
