(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var User = require('./CUser.js');

var util = require('../public/util.js');

var gameConfig = require('../public/gameConfig.json');
var resources = require('../public/resources.json');
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
			if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_EXP){
				this.objExps.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}else if(objDatas[i].objectID.substr(0, 3) === gameConfig.PREFIX_OBJECT_SKILL){
				this.objSkills.push({objectID : objDatas[i].objectID, position : objDatas[i].position, radius : objDatas[i].radius });
			}
		}
	},
	createOBJs : function(objDatas){
		for(var i=0; i<objDatas.length; i++){
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
	cancelCasting : function(userID){
		if(userID in this.users){
			this.users[userID].changeState(gameConfig.OBJECT_STATE_IDLE);
			if(userID === this.user.objectID){
				this.onCancelCasting();
			}
		}
	},
	deleteProjectile : function(projectileID){
		for(var i=0; i<this.projectiles.length; i++){
			if(this.projectiles[i].objectID === projectileID){
				this.projectiles.splice(i, 1);
				break;
			}
		}
	},
	explodeProjectile : function(projectileID){
		for(var i=0; i<this.projectiles.length; i++){
			if(this.projectiles[i].objectID === projectileID){
				this.projectiles[i].explode();
				this.projectiles[i].startEffectTimer();
				this.effects.push(this.projectiles[i].effect);
				this.projectiles.splice(i, 1);
				break;
			}
		}
	},
	changeUserStat : function(userData){
		this.users[userData.objectID].maxHP = userData.maxHP;
		this.users[userData.objectID].maxMP = userData.maxMP;
		this.users[userData.objectID].HP = userData.HP;
		this.users[userData.objectID].MP = userData.MP;
		this.users[userData.objectID].castSpeed = userData.castSpeed;
		this.users[userData.objectID].maxSpeed = userData.maxSpeed;
		this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
		this.users[userData.objectID].conditions = userData.conditions;

		//apply maxSpeed
		this.users[userData.objectID].setSpeed();
		if(this.users[userData.objectID].currentState === gameConfig.OBJECT_STATE_CAST){

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

},{"../public/gameConfig.json":7,"../public/map.json":8,"../public/quadtree.min.js":9,"../public/resources.json":10,"../public/util.js":11,"./CObstacle.js":2,"./CUser.js":4}],2:[function(require,module,exports){
function CObstacle(posX, posY, sizeW, sizeH, id, src){
  this.objectID = id;
  this.src = src;
  this.position = {
    x : posX, y : posY
  };
  // user when draw obstacle
  // this.localPosition = {
  //   x : posX, y : posY
  // };
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

function CSkill(skillData, userAniStartTime){

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

    this.fireTimeout = setTimeout(fireTimeoutHandler.bind(this), this.fireTime);
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
  makeProjectile : function(currentPosition, projectileID){
    var projectile = new ProjectileSkill(this, currentPosition, projectileID)
    return projectile;
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

var ProjectileSkill = function(skillInstance, currentPosition, ID){
  this.startTime = Date.now();

  this.objectID = ID;

  this.index = skillInstance.index;
  this.position = {
    x : currentPosition.x,
    y : currentPosition.y
  };
  this.direction = skillInstance.direction;
  this.speed = {
    x : skillInstance.maxSpeed * Math.cos(this.direction * Math.PI/180),
    y : skillInstance.maxSpeed * Math.sin(this.direction * Math.PI/180)
  };
  this.timer = Date.now();
  this.radius = skillInstance.radius;
  this.lifeTime = skillInstance.lifeTime;
  this.explosionRadius = skillInstance.explosionRadius;

  this.effect = {
    position : this.position,
    radius : this.explosionRadius,
    startTime : 0,
    lifeTime  : skillInstance.effectLastTime
  };

  this.onExplosion = new Function();
};

ProjectileSkill.prototype = {
  move : function(){
    var deltaTime = (Date.now() - this.timer)/ 1000;
    this.position.x += this.speed.x * deltaTime;
    this.position.y += this.speed.y * deltaTime;
    this.timer = Date.now();
  },
  startEffectTimer : function(){
    this.effect.startTime = Date.now();
  },
  isExpired : function(){
    if(this.lifeTime > Date.now() - this.startTime){
      return false;
    }
    return true;
  },
  explode : function(){
    console.log('explode!!!!!!');
  }
};


module.exports = CSkill;

},{"../public/util.js":11}],4:[function(require,module,exports){
var util = require('../public/util.js');
var Skill = require('./CSkill.js');
var resources = require('../public/resources.json');
var gameConfig = require('../public/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

var User = function(userData){
  this.objectID = userData.objectID;

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

  this.equipSkills = [];
  this.possessSkills = [];

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.updateFunction = null;

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
      case gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = this.idle.bind(this);
        break;
      case gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
        break;
      case gameConfig.OBJECT_STATE_ATTACK:
        this.updateFunction = this.attack.bind(this);
        break;
      case gameConfig.OBJECT_STATE_CAST:
        this.updateFunction = this.rotate.bind(this);
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
    this.timer = Date.now();
  },
  rotate : function(){
    var deltaTime = (Date.now() - this.timer)/1000;
    util.rotate.call(this, deltaTime);
    this.timer = Date.now();
  },
  move : function(deltaTime){
    util.move.call(this, deltaTime);
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
    this.timer = Date.now();
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
    var skillInstance = new Skill(skillData, skillData.fireTime - 100);
    skillInstance.onUserAniStart = onCastSkillHandler.bind(this, skillInstance);
    skillInstance.onTimeOver = onTimeOverHandler.bind(this, skillInstance);
    return skillInstance;
  },
  setSkill : function(skillInstance){
    this.currentSkill = skillInstance;
  },
  executeSkill : function(){
    if(!this.isExecutedSkill){
      this.skillCastEffectPlay = true;
      this.isExecutedSkill = true;
      this.currentSkill.executeSkill();
    }
  },
  updateSkillPossessions : function(possessSkills){
    this.possessSkills = possessSkills;
    console.log('updateSkillPossessions');
    console.log(this.possessSkills);
  },
  makeProjectile : function(projectileID, skillInstance){
    var projectile = skillInstance.makeProjectile(this.position, projectileID);
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
function onCastSkillHandler(skillInstance){
  console.log('cast ani start');
};
module.exports = User;

},{"../public/gameConfig.json":7,"../public/resources.json":10,"../public/util.js":11,"./CSkill.js":3}],5:[function(require,module,exports){

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

},{}],6:[function(require,module,exports){
module.exports={
  "userStatData" : "index,level,needExp,type,might,intellect,perception\n1,1,100,1,30,15,18\n2,2,150,1,32,16,19\n3,3,250,1,34,17,21\n4,4,400,1,36,18,22\n5,5,600,1,38,19,24\n6,6,850,1,40,20,25\n7,7,1150,1,42,21,27\n8,8,1500,1,44,22,28\n9,9,1900,1,46,23,30\n10,10,2350,1,48,24,31\n11,11,2850,1,50,25,33\n12,12,3400,1,52,26,34\n13,13,4000,1,54,27,36\n14,14,4650,1,56,28,37\n15,15,5350,1,58,29,39\n16,16,6100,1,60,30,40\n17,17,6900,1,62,31,42\n18,18,7750,1,64,32,43\n19,19,8650,1,66,33,45\n20,20,-1,1,68,34,46\n101,1,100,2,15,30,18\n102,2,150,2,16,32,19\n103,3,250,2,17,34,21\n104,4,400,2,18,36,22\n105,5,600,2,19,38,24\n106,6,850,2,20,40,25\n107,7,1150,2,21,42,27\n108,8,1500,2,22,44,28\n109,9,1900,2,23,46,30\n110,10,2350,2,24,48,31\n111,11,2850,2,25,50,33\n112,12,3400,2,26,52,34\n113,13,4000,2,27,54,36\n114,14,4650,2,28,56,37\n115,15,5350,2,29,58,39\n116,16,6100,2,30,60,40\n117,17,6900,2,31,62,42\n118,18,7750,2,32,64,43\n119,19,8650,2,33,66,45\n120,20,-1,2,34,68,46\n201,1,100,3,18,18,18\n202,2,150,3,19,19,19\n203,3,250,3,21,21,21\n204,4,400,3,22,22,22\n205,5,600,3,24,24,24\n206,6,850,3,25,25,25\n207,7,1150,3,27,27,27\n208,8,1500,3,28,28,28\n209,9,1900,3,30,30,30\n210,10,2350,3,31,31,31\n211,11,2850,3,33,33,33\n212,12,3400,3,34,34,34\n213,13,4000,3,36,36,36\n214,14,4650,3,37,37,37\n215,15,5350,3,39,39,39\n216,16,6100,3,40,40,40\n217,17,6900,3,42,42,42\n218,18,7750,3,43,43,43\n219,19,8650,3,45,45,45\n220,20,-1,3,46,46,46\n",
  "skillData" : "index,name,level,type,property,groupIndex,nextSkillIndex,totalTime,fireTime,coolDown,range,explosionRadius,consumeMP,fireDamage,FrostDamage,ArcaneDamage,isDamageToMana,damageToManaRate,isDamageToSelf,repeatTime,repeatLifeTime,buffToSelf1,buffToSelf2,buffToSelf3,buffToTarget1,buffToTarget2,buffToTarget3,projectileCount,radius,maxSpeed,lifeTime,clientName,effectLastTime\n11,FireBaseSkill1,1,1,1,10,12,1000,600,100,100,50,0,100,0,0,0,0,0,0,0,,,,1,,,0,0,0,0,Fire Strike,150\n12,FireBaseSkill2,2,1,1,10,13,1000,600,100,100,50,0,110,0,0,0,0,0,0,0,,,,1,,,0,0,0,0,Fire Strike,150\n13,FireBaseSkill3,3,1,1,10,14,1000,600,100,100,50,0,120,0,0,0,0,0,0,0,,,,1,,,0,0,0,0,Fire Strike,150\n14,FireBaseSkill4,4,1,1,10,15,1000,600,100,100,50,0,130,0,0,0,0,0,0,0,,,,1,,,0,0,0,0,Fire Strike,150\n15,FireBaseSkill5,5,1,1,10,16,1000,600,100,100,50,0,140,0,0,0,0,0,0,0,,,,1,,,0,0,0,0,Fire Strike,150\n16,FireBaseSkill6,6,1,1,10,17,1000,600,100,100,50,0,150,0,0,0,0,0,0,0,,,,2,,,0,0,0,0,Fire Strike,150\n17,FireBaseSkill7,7,1,1,10,18,1000,600,100,100,50,0,160,0,0,0,0,0,0,0,,,,2,,,0,0,0,0,Fire Strike,150\n18,FireBaseSkill8,8,1,1,10,19,1000,600,100,100,50,0,170,0,0,0,0,0,0,0,,,,2,,,0,0,0,0,Fire Strike,150\n19,FireBaseSkill9,9,1,1,10,20,1000,600,100,100,50,0,180,0,0,0,0,0,0,0,,,,2,,,0,0,0,0,Fire Strike,150\n20,FireBaseSkill10,10,1,1,10,21,1000,600,100,100,50,0,190,0,0,0,0,0,0,0,,,,2,,,0,0,0,0,Fire Strike,150\n21,FireBaseSkill11,11,1,1,10,22,1000,600,100,100,50,0,200,0,0,0,0,0,0,0,,,,3,,,0,0,0,0,Fire Strike,150\n22,FireBaseSkill12,12,1,1,10,23,1000,600,100,100,50,0,210,0,0,0,0,0,0,0,,,,3,,,0,0,0,0,Fire Strike,150\n23,FireBaseSkill13,13,1,1,10,24,1000,600,100,100,50,0,220,0,0,0,0,0,0,0,,,,3,,,0,0,0,0,Fire Strike,150\n24,FireBaseSkill14,14,1,1,10,25,1000,600,100,100,50,0,230,0,0,0,0,0,0,0,,,,3,,,0,0,0,0,Fire Strike,150\n25,FireBaseSkill15,15,1,1,10,26,1000,600,100,100,50,0,240,0,0,0,0,0,0,0,,,,3,,,0,0,0,0,Fire Strike,150\n26,FireBaseSkill16,16,1,1,10,27,1000,600,100,100,50,0,250,0,0,0,0,0,0,0,,,,4,,,0,0,0,0,Fire Strike,150\n27,FireBaseSkill17,17,1,1,10,28,1000,600,100,100,50,0,260,0,0,0,0,0,0,0,,,,4,,,0,0,0,0,Fire Strike,150\n28,FireBaseSkill18,18,1,1,10,29,1000,600,100,100,50,0,270,0,0,0,0,0,0,0,,,,4,,,0,0,0,0,Fire Strike,150\n29,FireBaseSkill19,19,1,1,10,30,1000,600,100,100,50,0,280,0,0,0,0,0,0,0,,,,4,,,0,0,0,0,Fire Strike,150\n30,FireBaseSkill20,20,1,1,10,-1,1000,600,100,100,50,0,290,0,0,0,0,0,0,0,,,,4,,,0,0,0,0,Fire Strike,150\n101,FireProjectileExplosion1,1,3,1,100,102,2000,1600,5000,0,500,100,100,0,0,0,0,0,0,0,,,,1,,,1,30,400,3000,Fire Ball,150\n102,FireProjectileExplosion2,2,3,1,100,103,2000,1600,5000,0,510,105,110,0,0,0,0,0,0,0,,,,1,,,1,31,400,3000,Fire Ball,150\n103,FireProjectileExplosion3,3,3,1,100,104,2000,1600,5000,0,520,110,120,0,0,0,0,0,0,0,,,,1,,,1,32,400,3000,Fire Ball,150\n104,FireProjectileExplosion4,4,3,1,100,105,2000,1600,5000,0,530,115,130,0,0,0,0,0,0,0,,,,1,,,1,33,400,3000,Fire Ball,150\n105,FireProjectileExplosion5,5,3,1,100,106,2000,1600,5000,0,540,120,140,0,0,0,0,0,0,0,,,,1,,,1,34,400,3000,Fire Ball,150\n106,FireProjectileExplosion6,6,3,1,100,107,2000,1600,5000,0,550,125,150,0,0,0,0,0,0,0,,,,2,,,1,35,400,3000,Fire Ball,150\n107,FireProjectileExplosion7,7,3,1,100,108,2000,1600,5000,0,560,130,160,0,0,0,0,0,0,0,,,,2,,,1,36,400,3000,Fire Ball,150\n108,FireProjectileExplosion8,8,3,1,100,109,2000,1600,5000,0,570,135,170,0,0,0,0,0,0,0,,,,2,,,1,37,400,3000,Fire Ball,150\n109,FireProjectileExplosion9,9,3,1,100,110,2000,1600,5000,0,580,140,180,0,0,0,0,0,0,0,,,,2,,,1,38,400,3000,Fire Ball,150\n110,FireProjectileExplosion10,10,3,1,100,111,2000,1600,5000,0,590,145,190,0,0,0,0,0,0,0,,,,2,,,1,39,400,3000,Fire Ball,150\n111,FireProjectileExplosion11,11,3,1,100,112,2000,1600,5000,0,600,150,200,0,0,0,0,0,0,0,,,,3,,,1,40,400,3000,Fire Ball,150\n112,FireProjectileExplosion12,12,3,1,100,113,2000,1600,5000,0,610,155,210,0,0,0,0,0,0,0,,,,3,,,1,41,400,3000,Fire Ball,150\n113,FireProjectileExplosion13,13,3,1,100,114,2000,1600,5000,0,620,160,220,0,0,0,0,0,0,0,,,,3,,,1,42,400,3000,Fire Ball,150\n114,FireProjectileExplosion14,14,3,1,100,115,2000,1600,5000,0,630,165,230,0,0,0,0,0,0,0,,,,3,,,1,43,400,3000,Fire Ball,150\n115,FireProjectileExplosion15,15,3,1,100,116,2000,1600,5000,0,640,170,240,0,0,0,0,0,0,0,,,,3,,,1,44,400,3000,Fire Ball,150\n116,FireProjectileExplosion16,16,3,1,100,117,2000,1600,5000,0,650,175,250,0,0,0,0,0,0,0,,,,4,,,1,45,400,3000,Fire Ball,150\n117,FireProjectileExplosion17,17,3,1,100,118,2000,1600,5000,0,660,180,260,0,0,0,0,0,0,0,,,,4,,,1,46,400,3000,Fire Ball,150\n118,FireProjectileExplosion18,18,3,1,100,119,2000,1600,5000,0,670,185,270,0,0,0,0,0,0,0,,,,4,,,1,47,400,3000,Fire Ball,150\n119,FireProjectileExplosion19,19,3,1,100,120,2000,1600,5000,0,680,190,280,0,0,0,0,0,0,0,,,,4,,,1,48,400,3000,Fire Ball,150\n120,FireProjectileExplosion20,20,3,1,100,-1,2000,1600,5000,0,690,195,290,0,0,0,0,0,0,0,,,,4,,,1,49,400,3000,Fire Ball,150\n",
  "buffData" : "index,name,isPassive,buffLifeTime,buffTickTime,isBuff,buffType,buffEffectType,buffAmount,buffApplyRate\n1,ignite1,0,10000,0,0,5,5,,30\n2,ignite2,0,11000,0,0,5,5,,30\n3,ignite3,0,12000,0,0,5,5,,30\n4,ignite4,0,13000,0,0,5,5,,30\n",
  "chestData" : "index,grade,HP,minExpCount,maxExpCount,minExpAmount,maxExpAmount,minSkillCount,maxSkillCount,SkillIndex1,SkillDropRate1,SkillIndex2,SkillDropRate2,SkillIndex3,SkillDropRate3,SkillIndex4,SkillDropRate4,SkillIndex5,SkillDropRate5,SkillIndex6,SkillDropRate6,SkillIndex7,SkillDropRate7,SkillIndex7,SkillDropRate7,SkillIndex8,SkillDropRate8,SkillIndex9,SkillDropRate9,SkillIndex10,SkillDropRate10,SkillIndex11,SkillDropRate11,SkillIndex12,SkillDropRate12,SkillIndex13,SkillDropRate13,SkillIndex14,SkillDropRate14,SkillIndex15,SkillDropRate15,SkillIndex16,SkillDropRate16,SkillIndex17,SkillDropRate17,SkillIndex18,SkillDropRate18,SkillIndex19,SkillDropRate19,SkillIndex20,SkillDropRate20\n1,1,100,3,5,30,50,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n2,2,200,4,6,50,75,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n3,3,300,5,7,75,100,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n"
}

},{}],7:[function(require,module,exports){
module.exports={
  "INTERVAL" : 60,

  "CANVAS_MAX_SIZE" : {"width" : 3200 , "height" : 3200},
  "CANVAS_MAX_LOCAL_SIZE" : {"width" : 1600, "height" : 1000},

  "DRAW_MODE_NORMAL" : 1,
  "DRAW_MODE_SKILL_RANGE" : 2,

  "OBJECT_STATE_IDLE" : 1,
  "OBJECT_STATE_MOVE" : 2,
  "OBJECT_STATE_ATTACK" : 3,
  "OBJECT_STATE_CAST" : 4,

  "FPS" : 60,

  "GAME_STATE_LOAD" : 1,
  "GAME_STATE_START_SCENE" : 2,
  "GAME_STATE_GAME_START" : 3,
  "GAME_STATE_GAME_ON" : 4,
  "GAME_STATE_GAME_END" : 5,

  "CHAR_TYPE_FIRE" : 1,
  "CHAR_TYPE_FROST" : 2,
  "CHAR_TYPE_ARCANE" : 3,

  "PREFIX_USER" : "USR",
  "PREFIX_SKILL" : "SKL",
  "PREFIX_SKILL_PROJECTILE" : "SKP",
  "PREFIX_CHEST" : "CHT",
  "PREFIX_OBSTACLE_TREE" : "OTT",
  "PREFIX_OBSTACLE_ROCK" : "OTR",
  "PREFIX_OBJECT_EXP" : "OXP",
  "PREFIX_OBJECT_SKILL" : "OSK",
  "PREFIX_OBJECT_GOLD" : "OGD",

  "USER_CONDITION_IMMORTAL" : 1,
  "USER_CONDITION_CHILL" : 2,
  "USER_CONDITION_FREEZE" : 3,
  "USER_CONDITION_SILENCE" : 4,
  "USER_CONDITION_IGNITE" : 5,

  "SKILL_PROPERTY_FIRE" : 1,
  "SKILL_PROPERTY_FROST" : 2,
  "SKILL_PROPERTY_ARCANE" : 3,

  "SKILL_TYPE_BASIC" : 1,
  "SKILL_TYPE_PROJECTILE" : 2,
  "SKILL_TYPE_PROJECTILE_EXPLOSION" : 3,
  "SKILL_TYPE_PROJECTILE_TICK" : 4,
  "SKILL_TYPE_RANGE" : 5,
  "SKILL_TYPE_SELF" : 6,
  "SKILL_TYPE_SELF_EXPLOSION" : 7,
  "SKILL_TYPE_SELF_TRIGGER" : 8,
  "SKILL_TYPE_TELEPORT" : 9,
  "SKILL_TYPE_PASSIVE" : 10,

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
  "GRID_IMG_SIZE" : 59,

  "OBJ_TREE_SRC" : "",
  "OBJ_TREE_SIZE" : 100,

  "OBJ_CHEST_SRC" : "",
  "OBJ_CHEST_SIZE" : 50
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
  else if(this.direction > 0 && this.targetDirection < 0){
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

  if(this.direction >= 180){
    this.direction -= 360;
  }else if(this.direction <= -180){
    this.direction += 360;
  }
};

//must use with bind or call method
exports.move = function(deltaTime){
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
  if(addPos !== undefined){
    this.position.x += addPos.x;
    this.position.y += addPos.y;
  }
  this.position.x += this.speed.x * deltaTime;
  this.position.y += this.speed.y * deltaTime;

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
exports.calculateOffset = function(obj, canvasSize){
  var newOffset = {
    x : obj.position.x + obj.size.width/2 - canvasSize.width/2,
    y : obj.position.y + obj.size.height/2 - canvasSize.height/2
  };
  return newOffset;
};
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
    case gameConfig.SKILL_TYPE_BASIC:
      var addPosX = skillData.range * Math.cos(user.direction * radianFactor);
      var addPosY = skillData.range * Math.sin(user.direction * radianFactor);

      return {
        x : user.center.x + addPosX,
        y : user.center.y + addPosY
      };
    case gameConfig.SKILL_TYPE_INSTANT:
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
    default:
  }
};
exports.calcSkillTargetDirection = function(skillType, targetPosition, user){
  switch (skillType) {
    case gameConfig.SKILL_TYPE_BASIC:
      return user.direction;
    case gameConfig.SKILL_TYPE_INSTANT:
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
  var addPosX = range * Math.cos(direction * Math.PI/180);
  var addPosY = range * Math.sin(direction * Math.PI/180);

  return {x : addPosX, y : addPosY};
};
//find last coincident data
exports.findData = function(table, columnName, value){
  var data = undefined;
  for(var index in table){
    //use ==, because value can be integer
    if(table[index][columnName] == value){
      data = table[index];
    }
  }
  return data;
};
exports.findDataWithTwoColumns = function(table, columnName1, value1, columnName2, value2){
  var datas = [];
  var data = null;
  for(var index in table){
    if(table[index][columnName1] == value1){
      datas.push(table[index]);
    }
  }
  if(datas.length > 0){
    for(var index in datas){
      if(datas[index][columnName2] == value2){
        data = datas[index];
      }
    }
  }else{
    return null;
  }
  return data;
}
exports.findAndSetBuffs = function(skillData, buffTable, columnName, length, actorID){
  var returnVal = [];
  for(var i=0; i<length; i++){
    var buffIndex = skillData[columnName + (i + 1)];
    if(buffIndex === ''){
      return returnVal;
    }else{
      var buffData = exports.findData(buffTable, 'index', buffIndex);
      buffData.actorID = actorID;
      returnVal.push(buffData);
    }
  }
  return returnVal;
}
exports.generateRandomUniqueID = function(uniqueCheckArray, prefix){
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
};
function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

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
var btnType1, btnType2, btnType3, btnType4, btnType5;
var startButton;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/60;
var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

// game var
var Manager;

// resource var
var resources;

var userImage, userHand;
var grid;

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
      gameSate = newState;
      gameSetupFunc = null;
      gameUpdateFunc = stateFuncEnd;
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
function stateFuncStandby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function stateFuncStart(){
  setupSocket();
  var userType = 1;
  if(btnType1.checked){
    userType = gameConfig.CHAR_TYPE_FIRE;
  }else if(btnType2.checked){
    userType = gameConfig.CHAR_TYPE_ICE;
  }else if(btnType3.checked){
    userType = gameConfig.CHAR_TYPE_WIND;
  }else if(btnType4.checked){
    userType = gameConfig.CHAR_TYPE_VISION;
  }else{
    userType = gameConfig.CHAR_TYPE_NATURAL;
  }
  socket.emit('reqStartGame', userType);
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
  changeState(gameConfig.GAME_STATE_START_SCENE);
};

//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  infoScene = document.getElementById('infoScene');
  btnType1 = document.getElementById('type1');
  btnType2 = document.getElementById('type2');
  btnType3 = document.getElementById('type3');
  btnType4 = document.getElementById('type4');
  btnType5 = document.getElementById('type5');
  btnType1.checked = true;

  gameScene = document.getElementById('gameScene');
  standingScene = document.getElementById('standingScene');
  startButton = document.getElementById('startButton');

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

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resources.USER_BODY_SRC;
  userHand.src = resources.USER_HAND_SRC;
  grid.src = resources.GRID_SRC;
};
function onSkillFireHandler(rawSkillData){
  var skillData = Manager.processSkillData(rawSkillData);
  socket.emit('skillFired', skillData);
};
function onProjectileSkillFireHandler(rawProjectileData){
  var projectileData = Manager.processProjectileData(rawProjectileData);
  socket.emit('projectileFired', projectileData);
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

  gameConfig.userOffset = calcOffset();

  drawScreen();
  drawBackground();
  drawGrid();
  drawObstacles();
  drawChests();
  drawObjs();
  drawUsers();
  drawEffect();
  drawProjectile();
  if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawSkillRange();
  }
};

// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('connect', function(){
    console.log('connection to the server');
  });
  socket.on('disconnect', function(){
    console.log('disconnected');
    changeState(gameConfig.GAME_STATE_END);
  });
  socket.on('pong', function(lat){
    latency = lat;
  });

  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    // Manager = new CManager(gameConfig);
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, skillDatas, projectileDatas, objDatas, chestDatas){
    Manager.setUsers(userDatas, skillDatas);
    Manager.setUsersSkills(skillDatas);
    // Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);
    Manager.setChests(chestDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.start();
    console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, INTERVAL_TIMER);
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);
    console.log('user joined ' + data.objectID);
  });
  socket.on('userDataUpdate', function(userData){
    console.log(userData);
    Manager.updateUserData(userData);
  });
  socket.on('userDataUpdateAndUseSkill', function(userData){
    Manager.updateUserData(userData);
    var skillData = util.findData(skillTable, 'index', userData.skillIndex);

    skillData.targetPosition = userData.skillTargetPosition;
    skillData.direction = userData.skillDirection;
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK){
      skillData.projectileID = userData.skillProjectileID;
    }
    Manager.useSkill(userData.objectID, skillData);
  });
  socket.on('deleteProjectile', function(projectileID){
    Manager.deleteProjectile(projectileID);
  });
  socket.on('explodeProjectile', function(projectileID){
    Manager.explodeProjectile(projectileID);
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
  });
  socket.on('changeUserStat', function(userData){
    Manager.changeUserStat(userData);
  });
  socket.on('updateSkillPossessions', function(possessSkills){
    Manager.updateSkillPossessions(gameConfig.userID, possessSkills);
  })
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){
  ctx.fillStyle ="#000000";

  for(var i=0; i<Manager.obstacles.length; i++){
    ctx.beginPath();
    var center = util.worldToLocalPosition(Manager.obstacles[i].center, gameConfig.userOffset);
    ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor,
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
    var pos = util.worldToLocalPosition(Manager.chests[i].position, gameConfig.userOffset);
    ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor,
                  Manager.chests[i].size.width * gameConfig.scaleFactor, Manager.chests[i].size.height * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawObjs(){
  ctx.fillStyle = "#0000ff";
  for(var i=0; i<Manager.objExps.length; i++){
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.objExps[i].position.x + Manager.objExps[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.objExps[i].position.y + Manager.objExps[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objExps[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    // var pos = util.worldToLocalPosition(Manager.objExps[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  };
  ctx.fillStyle = "#ff0000";
  for(var i=0; i<Manager.objSkills.length; i++){
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.objSkills[i].position.x + Manager.objSkills[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.objSkills[i].position.y + Manager.objSkills[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objSkills[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawUsers(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    var centerX = util.worldXCoordToLocalX(Manager.users[index].position.x + Manager.users[index].size.width/2, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.users[index].position.y + Manager.users[index].size.height/2, gameConfig.userOffset.y);

    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);

    ctx.beginPath();
    ctx.fillStyle = "#ffff00";
    ctx.globalAlpha = 0.5;
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, 32 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.users[index].size.width * gameConfig.scaleFactor, Manager.users[index].size.width * gameConfig.scaleFactor);

    ctx.beginPath();
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
    ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
    ctx.rotate(radian);
    ctx.fillStyle = 'yellow';
    ctx.arc(0, 0, 64 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    //draw cast effect
    if(Manager.users[index].skillCastEffectPlay){
      ctx.fillStyle ="#00ff00";
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }
};
function drawEffect(){
  for(var i=0; i<Manager.effects.length; i++){
    ctx.beginPath();
    ctx.fillStyle ="#ff0000";
    var centerX = util.worldXCoordToLocalX(Manager.effects[i].position.x + Manager.effects[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.effects[i].position.y + Manager.effects[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.effects[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
};
function drawProjectile(){
  for(var i=0; i<Manager.projectiles.length; i++){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.projectiles[i].position.x + Manager.projectiles[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.projectiles[i].position.y + Manager.projectiles[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.projectiles[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
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
  ctx.arc(mousePoint.x, mousePoint.y, currentSkillData.explosionRadius * gameConfig.scaleFactor, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1
};
function drawBackground(){
  ctx.fillStyle = "#11ff11";
  var posX = -gameConfig.userOffset.x * gameConfig.scaleFactor;
  var posY = -gameConfig.userOffset.y * gameConfig.scaleFactor;
  var sizeW = gameConfig.CANVAS_MAX_SIZE.width * gameConfig.scaleFactor;
  var sizeH = gameConfig.CANVAS_MAX_SIZE.height * gameConfig.scaleFactor;
  ctx.fillRect(posX, posY, sizeW, sizeH);
};
function drawGrid(){
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#0000ff';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
 // - (gameConfig.CANVAS_MAX_LOCAL_SIZE.width * gameConfig.scaleFactor)/2
 //  - (gameConfig.CANVAS_MAX_LOCAL_SIZE.height * gameConfig.scaleFactor)/2
  for(var x = - gameConfig.userOffset.x; x<gameConfig.canvasSize.width; x += gameConfig.CANVAS_MAX_LOCAL_SIZE.width/32){
    if(util.isXInCanvas(x, gameConfig)){
      ctx.moveTo(x * gameConfig.scaleFactor, 0);
      ctx.lineTo(x * gameConfig.scaleFactor, gameConfig.canvasSize.height);
    }
  };
  for(var y = - gameConfig.userOffset.y; y<gameConfig.canvasSize.height; y += gameConfig.CANVAS_MAX_LOCAL_SIZE.height/20){
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
  userData.latency = latency;
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
  var keyCode = e.keyCode;
  var userPosition = Manager.users[gameConfig.userID].center;

  var skillIndex = 0;
  if(keyCode === 69 || keyCode === 32){
    skillIndex = 11;
    var skillData = util.findData(skillTable, 'index', 11);
  }else if(keyCode === 49){
    skillIndex = 21;
    skillData = util.findData(skillTable, 'index', 21);
  }else if(keyCode === 50){
    skillIndex = 31;
    skillData = util.findData(skillTable, 'index', 31);
  }else if(keyCode === 51){
    skillIndex = 41;
    skillData = util.findData(skillTable, 'index', 41);
  }else if(keyCode === 52){

  }
  //check mp
  if(Manager.user.MP > skillData.consumeMP){
    if(skillIndex){
      if(skillData.type === gameConfig.SKILL_TYPE_INSTANT || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE){
        if(drawMode === gameConfig.DRAW_MODE_NORMAL){
          currentSkillData = skillData;
          changeDrawMode(gameConfig.DRAW_MODE_SKILL_RANGE);
        }
      }else{
        useSkill(skillData, userPosition, Manager.users[gameConfig.userID]);
      }
    }
  }
  //check conditions

};
function changeDrawMode(mode){
  if(mode === gameConfig.DRAW_MODE_NORMAL){
    drawMode = gameConfig.DRAW_MODE_NORMAL;
    currentSkillData = null;
    canvas.removeEventListener('mousemove', mouseMoveHandler);
  }else if(mode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawMode = gameConfig.DRAW_MODE_SKILL_RANGE;
    canvas.addEventListener('mousemove', mouseMoveHandler, false);
  }
};
function mouseMoveHandler(e){
  mousePoint.x = e.clientX/gameConfig.scaleFactor;
  mousePoint.y = e.clientY/gameConfig.scaleFactor;
};
function useSkill(skillData, clickPosition, user){
  skillData.targetPosition = util.calcSkillTargetPosition(skillData, clickPosition, user);
  skillData.direction = util.calcSkillTargetDirection(skillData.type, skillData.targetPosition, user);
  if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
     skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION){
    skillData.projectileID = util.generateRandomUniqueID(Manager.projectiles, gameConfig.PREFIX_SKILL_PROJECTILE);
  }
  Manager.useSkill(gameConfig.userID, skillData);

  var userData = Manager.processUserData();
  userData.skillIndex = skillData.index;
  userData.skillDirection = skillData.direction;
  userData.skillTargetPosition = skillData.targetPosition;

  socket.emit('userUseSkill', userData);
}
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

},{"../../modules/client/CManager.js":1,"../../modules/client/CUser.js":4,"../../modules/public/csvjson.js":5,"../../modules/public/data.json":6,"../../modules/public/gameConfig.json":7,"../../modules/public/resources.json":10,"../../modules/public/util.js":11}]},{},[12]);
