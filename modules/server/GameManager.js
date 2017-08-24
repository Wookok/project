var Obstacle = require('./Obstacle.js');
var config = require('../../config.json');
var gameConfig = require('../public/gameConfig.json');
var serverConfig = require('./serverConfig.json');
var util = require('../public/util.js');
var SUtil = require('./ServerUtil.js');

var SkillColliders = require('./SkillColliders.js');
var SkillCollider = SkillColliders.SkillCollider;
var ProjectileCollider = SkillColliders.ProjectileCollider;

var csvJson = require('../public/csvjson.js');

var dataJson = require('../public/data.json');

var chestTable = csvJson.toObject(dataJson.chestData, {delimiter : ',', quote : '"'});
var resources = require('../public/resources.json');
var map = require('../public/map.json');

var OBJs = require('./OBJs.js');
var OBJExp = OBJs.OBJExp;
var OBJSkill = OBJs.OBJSkill;
var OBJChest = OBJs.OBJChest;

var QuadTree = require('quadtree-lib');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

//quadTree var
//user and chest
var entityTree;
var entityBefore150msTree;
var entityBefore300msTree;

var userEles = [];
var userBefore150msEles = [];
var userBefore300msEles = [];

var chestEles = [];
//skill
var colliderEles = [];

// for collection exp, gold, skill objs
var collectionTree;
var collectionEles = [];

var deleteCollectionEle = [];
var addCollectionEle = [];
//obstacles...like tree, rock
var staticTree;
var staticEles = [];
var affectedEles = [];

function GameManager(){
  this.users = [];
  this.obstacles = [];
  this.chestLocations = [];
  this.chests = [];
  this.skills = [];
  this.projectiles = [];

  this.objExps = [];
  this.addedObjExps = [];
  this.objSkills = [];
  this.addedObjSkills = [];
  this.objExpsCount = serverConfig.OBJ_EXP_MIN_COUNT;
  this.objSkillsCount = serverConfig.OBJ_SKILL_MIN_COUNT;

  this.chestInterval = false;
  this.updateInteval = false;
  this.staticInterval = false;
  this.affectInterval = false;


  this.onNeedInformUserChangeStat = new Function();

  this.onNeedInformCreateObjs = new Function();
  this.onNeedInformDeleteObj = new Function();
  this.onNeedInformCreateChest = new Function();

  this.onNeedInformSkillData = new Function();
  this.onNeedInformProjectileDelete = new Function();
  this.onNeedInformProjectileExplode = new Function();
};

GameManager.prototype.start = function(){

  entityTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });
  entityBefore150msTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });
  entityBefore300msTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });

  collectionTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });
  staticTree = new QuadTree({
    width : gameConfig.CANVAS_MAX_SIZE.width,
    height : gameConfig.CANVAS_MAX_SIZE.height,
    maxElements : 5
  });

  this.mapSetting();
  this.updateGame();
};
GameManager.prototype.mapSetting = function(){
  this.setObstacles();
  this.setChestsLocation();
  this.setStaticTreeEle();
  this.setOBJExps();
  this.setOBJSkills();
};
GameManager.prototype.updateGame = function(){
  if(this.chestInterval === false){
    this.chestInterval = setInterval(chestIntervalHandler.bind(this), 10000);
  }
  if(this.updateInteval === false){
    this.updateInteval = setInterval(updateIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.staticInterval === false){
    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.affectInterval === false){
    var thisManager = this;
    setTimeout(function(){
      thisManager.affectInterval = setInterval(affectIntervalHandler.bind(thisManager), INTERVAL_TIMER);
    }, INTERVAL_TIMER/3);
  }
};

//create obstacles and static tree setup
GameManager.prototype.setObstacles = function(){
  for(var index in map.Trees){
    var tempObstacle = new Obstacle(map.Trees[index].posX, map.Trees[index].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id);

    this.obstacles.push(tempObstacle);
    staticEles.push(tempObstacle.staticEle);
  }
};
GameManager.prototype.setChestsLocation = function(){
  for(var i=0; i<map.Chests.length; i++){
    var tempObj = new Obstacle(map.Chests[i].posX, map.Chests[i].posY,
      resources.OBJ_CHEST_SIZE, resources.OBJ_CHEST_SIZE, map.Chests[i].id);

    this.chestLocations.push(tempObj);
    staticEles.push(tempObj.staticEle);
  }
};
GameManager.prototype.setStaticTreeEle = function(){
  staticTree.pushAll(staticEles);
};
GameManager.prototype.setOBJExps = function(){
  for(var i=0; i<this.objExpsCount; i++){
    var randomID = SUtil.generateRandomUniqueID(this.objExps, gameConfig.PREFIX_OBJECT_EXP);
    var objExp = new OBJExp(randomID);
    var expAmount = SUtil.getRandomNum(serverConfig.OBJ_EXP_MIN_EXP_AMOUNT, serverConfig.OBJ_EXP_MAX_EXP_AMOUNT);
    var radius = SUtil.expToRadius(expAmount);
    var randomPos = SUtil.generateRandomPos(collectionTree, 0, 0, gameConfig.CANVAS_MAX_SIZE.width - radius, gameConfig.CANVAS_MAX_SIZE.height - radius,
                                      radius, serverConfig.OBJ_EXP_RANGE_WITH_OTHERS, randomID, staticTree);

    objExp.initOBJExp(randomPos, radius, expAmount);
    objExp.setCollectionEle();
    // this.staticTree.push(food.staticEle);
    this.objExps.push(objExp);
    collectionEles.push(objExp.collectionEle);
    collectionTree.push(objExp.collectionEle);
  }
};
GameManager.prototype.setOBJSkills = function(){
  for(var i=0; i<this.objSkillsCount; i++){
    var randomID = SUtil.generateRandomUniqueID(this.objSkills, gameConfig.PREFIX_OBJECT_SKILL);
    var objSkill = new OBJSkill(randomID);
    var skillIndex = 21;
    var radius = gameConfig.OBJ_SKILL_RADIUS;
    var randomPos = SUtil.generateRandomPos(collectionTree, 0, 0, gameConfig.CANVAS_MAX_SIZE.width - radius, gameConfig.CANVAS_MAX_SIZE.height - radius,
                                      radius, serverConfig.OBJ_SKILL_RANGE_WITH_OTHERS, randomID, staticTree);

    objSkill.initOBJSkill(randomPos, radius, skillIndex);
    objSkill.setCollectionEle();
    // this.staticTree.push(food.staticEle);
    this.objSkills.push(objSkill);
    collectionEles.push(objSkill.collectionEle);
    collectionTree.push(objSkill.collectionEle);
  }
};
GameManager.prototype.createChest = function(chestLocationID){
  //find chest data
  for(var i=0; i<Object.keys(map.Chests).length; i++){
    if(map.Chests[i].id === chestLocationID){
      var chestResourceData = map.Chests[i]
    }
  }
  //set grade of Chest
  if(chestResourceData){
    var chestGrade = Math.floor(Math.random() * (chestResourceData.gradeMax - chestResourceData.gradeMin + 1) + chestResourceData.gradeMin);
    console.log('chest grade : ' + chestGrade);
    var chestData = util.findData(chestTable, 'grade', chestGrade);
    var position = {x : chestResourceData.posX, y : chestResourceData.posY};
    var chestID = SUtil.generateRandomUniqueID(this.chests, gameConfig.PREFIX_CHEST);
    var radius = resources.OBJ_CHEST_SIZE;

    var chest = new OBJChest(chestID, chestLocationID);
    chest.initOBJChest(position, radius, chestData);
    chest.setEntityEle();
    this.chests.push(chest);
    this.onNeedInformCreateChest(chest);

    chest.onDestroy = onChestDestroyHandler.bind(this);
  }
};
var onChestDestroyHandler = function(cht){
  var createdObjs = [];
  for(var i=0; i<cht.exps.length; i++){
    var objExp = this.createOBJs(1, gameConfig.PREFIX_OBJECT_EXP, cht.exps[i], cht.position);
    createdObjs.push(objExp[0]);
  }
  for(var i=0; i<cht.skills.length; i++){
    var objSkill = this.createOBJs(1, gameConfig.PREFIX_OBJECT_SKILL, cht.skills[i], cht.position);
    createdObjs.push(objSkill[0]);
  }
  for(var i=0; i<this.chests.length; i++){
    if(this.chests[i].objectID === cht.objectID){
      this.chests.splice(i, 1);
    }
  }
  this.onNeedInformCreateObjs(createdObjs);
}
GameManager.prototype.createOBJs = function(count, type, expOrSkill, nearPosition){
  var createdObjs =[];
  if(type === gameConfig.PREFIX_OBJECT_EXP){
    for(var i=0; i<count; i++){
      var randomID = SUtil.generateRandomUniqueID(this.objExps, gameConfig.PREFIX_OBJECT_EXP);
      var objExp = new OBJExp(randomID);
      if(expOrSkill){
        var expAmount = expOrSkill;
      }else{
        var expAmount = SUtil.getRandomNum(serverConfig.OBJ_EXP_MIN_EXP_AMOUNT, serverConfig.OBJ_EXP_MAX_EXP_AMOUNT);
      }
      var radius = SUtil.expToRadius(expAmount);
      if(nearPosition){
        var randomPos = SUtil.generateNearPos(nearPosition, serverConfig.CHEST_NEAR_RANGE);
      }else{
        var randomPos = SUtil.generateRandomPos(collectionTree, 0, 0, gameConfig.CANVAS_MAX_SIZE.width - radius, gameConfig.CANVAS_MAX_SIZE.height - radius,
                                          radius, serverConfig.OBJ_EXP_RANGE_WITH_OTHERS, randomID, staticTree);
      }

      objExp.initOBJExp(randomPos, radius, expAmount);
      objExp.setCollectionEle();
      this.objExps.push(objExp);
      this.addedObjExps.push(objExp);
      createdObjs.push(objExp);
    }
  }else if(type === gameConfig.PREFIX_OBJECT_SKILL){
    for(var i=0; i<count; i++){
      var randomID = SUtil.generateRandomUniqueID(this.objSkills, gameConfig.PREFIX_OBJECT_SKILL);
      var objSkill = new OBJSkill(randomID);
      if(expOrSkill){
        var skillIndex = expOrSkill;
      }else{
        skillIndex = 21;
      }
      var radius = gameConfig.OBJ_SKILL_RADIUS;
      if(nearPosition){
        var randomPos = SUtil.generateNearPos(nearPosition, serverConfig.CHEST_NEAR_RANGE);
      }else{
        randomPos = SUtil.generateRandomPos(collectionTree, 0, 0, gameConfig.CANVAS_MAX_SIZE.width - radius, gameConfig.CANVAS_MAX_SIZE.height - radius,
                                          radius, serverConfig.OBJ_SKILL_RANGE_WITH_OTHERS, randomID, staticTree);
      }

      objSkill.initOBJSkill(randomPos, radius, skillIndex);
      objSkill.setCollectionEle();
      // this.staticTree.push(food.staticEle);
      this.objSkills.push(objSkill);
      this.addedObjSkills.push(objSkill);
      createdObjs.push(objSkill);
    }
  }
  return createdObjs;
};
GameManager.prototype.getObj = function(objID, affectNum, userID){
  if(objID.substr(0, 3) === gameConfig.PREFIX_OBJECT_EXP){
    for(var i=0; i<this.objExps.length; i++){
      if(this.objExps[i].objectID === objID){
        if(userID in this.users){
          this.users[userID].getExp(affectNum);

          this.objExps.splice(i, 1);
          this.onNeedInformDeleteObj(objID);
        }
        return;
      }
    }
  }else if(objID.substr(0, 3) === gameConfig.PREFIX_OBJECT_SKILL){
    for(var i=0; i<this.objSkills.length; i++){
      if(this.objSkills[i].objectID === objID){
        if(userID in this.users){
          var possessSkills = this.users[userID].getSkill(affectNum);
          this.onNeedInformSkillData(this.users[userID].socketID, possessSkills);

          this.objSkills.splice(i, 1);
          this.onNeedInformDeleteObj(objID);
        }
        return;
      }
    }
  }else if(objID.substr(0, 3) === gameConfig.PREFIX_OBJECT_GOLD){

  }
};
// GameManager.prototype.getObj = function(work){
//   if(work.type === 'getExpObj'){
//     for(var i=0; i<Object.keys(this.objExps).length; i++){
//       if(this.objExps[i].objectID === work.colObj){
//         this.objExps.splice(i, 1);
//         if(work.user in this.users){
//           this.users[work.user].getExp(work.addExp);
//         }
//         this.onNeedInformDeleteObj(work.colObj);
//         return;
//       }
//     }
//   }else if(work.type === 'getSkillObj'){
//     for(var i=0; i<Object.keys(this.objSkills).length; i++){
//       if(this.objSkills[i].objectID === work.colObj){
//         this.objSkills.splice(i, 1);
//         if(work.user in this.users){
//           var possessSkills = this.users[work.user].getSkill(work.skillIndex);
//           if(possessSkills){
//             this.onNeedInformSkillData(this.users[work.user].socketID, possessSkills);
//           }
//         }
//         this.onNeedInformDeleteObj(work.colObj);
//         return;
//       }
//     }
//   }
// };
GameManager.prototype.deleteObj = function(objID){
  if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_EXP){
    for(var i=0; i<this.objExps.length; i++){
      if(this.objExps[i].objectID === objID){
        this.objExps.splice(i, 1);

        this.onNeedInformDeleteObj(objID);
        return;
      }
    }
  }else if(objID.substr(0,3) === gameConfig.PREFIX_OBJECT_SKILL){
    for(var i=0; i<this.objSkills.length; i++){
      if(this.objSkills[i].objectID === objID){
        this.objSkills.splice(i, 1);
        this.onNeedInformDeleteObj(objID);
        return;
      }
    }
  }
};

// user join, kick, update
GameManager.prototype.joinUser = function(user){
  this.users[user.objectID] = user;
  this.users[user.objectID].onMove = onMoveCalcCompelPos.bind(this);
  this.users[user.objectID].onChangeStat = SUtil.onUserChangeStat.bind(this);
  this.users[user.objectID].onDeath = SUtil.onUserDeath.bind(this);
  this.objExpsCount += serverConfig.OBJ_EXP_ADD_PER_USER;
  console.log(this.users);
  console.log(user.objectID + ' join in GameManager');
};
GameManager.prototype.kickUser = function(user){
  if(!(user.objectID in this.users)){
    console.log("can`t find user`s ID. user already out of game");
  }else{
    delete this.users[user.objectID];
    this.objExpsCount -= serverConfig.OBJ_EXP_ADD_PER_USER;
  }
};
GameManager.prototype.stopUser = function(user){
  user.stop();
};
//user initialize
GameManager.prototype.initializeUser = function(user, baseSkill, equipSkills, possessSkills){
  // check ID is unique
  var randomID = SUtil.generateRandomUniqueID(this.users, gameConfig.PREFIX_USER);
  //initialize variables;
  user.assignID(randomID);

  user.setSize(resources.USER_BODY_SIZE,resources.USER_BODY_SIZE);
  user.setPosition(10, 10);

  user.setSkills(baseSkill, equipSkills, possessSkills);

  user.initEntityEle();
  user.buffUpdate();
};
GameManager.prototype.applySkill = function(userID, skillData){
  if(userID in this.users){
    this.users[userID].consumeMP(skillData.consumeMP);
    this.users[userID].addBuffs(skillData.buffsToSelf);

    //doDamageToSelf
    if(skillData.doDamageToSelf){
      var fireDamage = skillData.fireDamage * skillData.damageToSelfRate/100;
      var frostDamage = skillData.frostDamage * skillData.damageToSelfRate/100;
      var arcaneDamage = skillData.arcaneDamage * skillData.damageToSelfRate/100;
      var damageToMP = 0;
      this.users[userID].takeDamage(userID, fireDamage, frostDamage, arcaneDamage, damageToMP);
      this.users[userID].addBuffs(skillData.buffsToTarget);
    }
    //healHP, MP
    var healHPAmount = (!isNaN(skillData.healHP) ? skillData.healHP : 0) + this.users[userID].maxHP * (!isNaN(skillData.healHPRate) ? skillData.healHPRate : 0) / 100;
    var healMPAmount = (!isNaN(skillData.healMP) ? skillData.healMP : 0) + this.users[userID].maxMP * (!isNaN(skillData.healMPRate) ? skillData.healMPRate : 0) / 100;
    if(healHPAmount > 0 || healMPAmount > 0){
      this.users[userID].healHPMP(healHPAmount, healMPAmount);
    }
    var skillCollider = new SkillCollider(this.users[userID], skillData);
    this.skills.push(skillCollider);
    // this.skills.push({
    //   id : userID,
    //   x : skillData.targetPosition.x,
    //   y : skillData.targetPosition.y,
    //   width : skillData.explosionRadius * 2,
    //   height : skillData.explosionRadius * 2,
    //   damage : skillData.damage,
    //   buffsToTarget : skillData.buffsToTarget,
    //
    //   latency : this.users[userID].latency || 100
    // });
  }else{
    console.log('cant find user data');
  }
};
GameManager.prototype.applyProjectile = function(userID, projectileData){
  if(userID in this.users){
    this.users[userID].consumeMP(skillData.consumeMP);
    this.users[userID].addBuffs(projectileData.buffsToSelf);
    //doDamageToSelf
    if(projectileData.doDamageToSelf){
      var fireDamage = projectileData.fireDamage * projectileData.damageToSelfRate/100;
      var frostDamage = projectileData.frostDamage * projectileData.damageToSelfRate/100;
      var arcaneDamage = projectileData.arcaneDamage * projectileData.damageToSelfRate/100;
      var damageToMP = 0;
      this.users[userID].takeDamage(userID, fireDamage, frostDamage, arcaneDamage, damageToMP);
      this.users[userID].addBuffs(projectileData.buffsToTarget);
    }
    //healHP, MP
    var healHPAmount = (!isNaN(projectileData.healHP) ? projectileData.healHP : 0) + this.users[userID].maxHP * (!isNaN(projectileData.healHPRate) ? projectileData.healHPRate : 0) / 100;
    var healMPAmount = (!isNaN(projectileData.healMP) ? projectileData.healMP : 0) + this.users[userID].maxMP * (!isNaN(projectileData.healMPRate) ? projectileData.healMPRate : 0) / 100;
    if(healHPAmount > 0 || healMPAmount > 0){
      this.users[userID].healHPMP(healHPAmount, healMPAmount);
    }

    var projectileCollider = new ProjectileCollider(this.users[userID], projectileData);

    this.projectiles.push(projectileCollider);
    // this.projectiles.push({
    //   id : userID,
    //   objectID : projectileData.objectID,
    //   x : projectileData.position.x,
    //   y : projectileData.position.y,
    //   width : projectileData.radius * 2,
    //   height : projectileData.radius * 2,
    //   damage : projectileData.damage,
    //   buffsToTarget : projectileData.buffsToTarget,
    //
    //   startTime : projectileData.startTime,
    //   lifeTime : projectileData.lifeTime,
    //   explosionRadius : projectileData.explosionRadius,
    //   isExplosive : true,
    //   isCollide : false,
    //
    //   timer : Date.now(),
    //
    //   latency : this.users[userID].latency || 100,
    //
    //   move : function(){
    //     var deltaTime = (Date.now() - this.timer)/1000;
    //     this.x += projectileData.speed.x * deltaTime;
    //     this.y += projectileData.speed.y * deltaTime;
    //     this.timer = Date.now();
    //   },
    //   isExpired : function(){
    //     if(Date.now() - this.startTime > this.lifeTime){
    //       return true;
    //     }
    //     return false;
    //   },
    //   explode : function(){
    //     this.width = this.explosionRadius * 2;
    //     this.height = this.explosionRadius * 2;
    //     this.isCollide = true;
    //     console.log('projectile is explode');
    //   }
    // });
  }else{
    console.log('cant find user data');
  }
};
GameManager.prototype.checkCheat = function(userData){
  var lastPositionIndex = this.users[userData.objectID].beforePositions.length;
  if(lastPositionIndex > 0){
    var lastPosition = this.users[userData.objectID].beforePositions[lastPositionIndex - 1];
    var timeSpan = (userData.time - lastPosition.time)/1000;
    var distX = Math.abs(userData.position.x - lastPosition.x);
    var distY = Math.abs(userData.position.y - lastPosition.y);
    var dist = Math.sqrt(Math.pow(distX,2) + Math.pow(distY,2));
    if(dist > this.users[userData.objectID].maxSpeed * timeSpan * serverConfig.TOLERANCE_LIMIT_RATE){
      return false;
    }
  }
  return true;
};
GameManager.prototype.updateUserData = function(userData){
  if(userData.objectID in this.users){
    if(userData.time){
      this.users[userData.objectID].beforePositions.push({
        x : this.users[userData.objectID].position.x,
        y : this.users[userData.objectID].position.y,
        time : this.users[userData.objectID].time
      });
      if(this.users[userData.objectID].beforePositions.length > 15){
        while(this.users[userData.objectID].beforePositions.length > 15){
          this.users[userData.objectID].beforePositions.splice(0, 1);
        }
      }
      for(var i=0; i<this.users[userData.objectID].beforePositions.length; i++){
        if(Date.now() - this.users[userData.objectID].beforePositions[i].time > 300){
          this.users[userData.objectID].before300msPos = {
            x : this.users[userData.objectID].beforePositions[i].x,
            y : this.users[userData.objectID].beforePositions[i].y
          }
        }else if(Date.now() - this.users[userData.objectID].beforePositions[i].time > 150){
          this.users[userData.objectID].before150msPos = {
            x : this.users[userData.objectID].beforePositions[i].x,
            y : this.users[userData.objectID].beforePositions[i].y
          }
        }
      }
      this.users[userData.objectID].time = userData.time;
    }
    this.users[userData.objectID].currentState = userData.currentState;
    this.users[userData.objectID].position = userData.position;
    this.users[userData.objectID].direction = userData.direction;
    if(userData.latency){
      this.users[userData.objectID].latency = userData.latency;
    }
    if(userData.targetPosition){
      this.users[userData.objectID].targetPosition = userData.targetPosition;
    }
    if(userData.skillIndex){
      this.users[userData.objectID].currentSkill = userData.skillIndex;
    }
  }else{
    console.log('cant find user data');
  }
};
GameManager.prototype.processUserDataSetting = function(user){
  return {
    objectID : user.objectID,
    currentState : user.currentState,
    position : user.position,
    targetPosition : user.targetPosition,
    maxSpeed : user.maxSpeed,
    direction : user.direction,
    rotateSpeed : user.rotateSpeed,
    size : user.size,

    maxHP : user.maxHP,
    maxMP : user.maxMP,
    HP : user.HP,
    MP : user.MP,
    castSpeed : user.castSpeed,

    conditions : user.conditions
  };
};
// data setting for send to client
GameManager.prototype.processUserDataSettings = function(){
  var userData = [];

  for(var index in this.users){
    userData.push({
      objectID : index,

      currentState : this.users[index].currentState,
      position : this.users[index].position,
      targetPosition : this.users[index].targetPosition,

      maxSpeed : this.users[index].maxSpeed,
      direction : this.users[index].direction,
      rotateSpeed :  this.users[index].rotateSpeed,
      size : this.users[index].size,

      maxHP : this.users[index].maxHP,
      maxMP : this.users[index].maxMP,
      HP : this.users[index].HP,
      MP : this.users[index].MP,
      castSpeed : this.users[index].castSpeed,

      conditions : this.users[index].conditions
    });
  };

  return userData;
};
GameManager.prototype.processChangedUserStat = function(user){
  return {
    objectID : user.objectID,
    maxHP : user.maxHP,
    maxMP : user.maxMP,
    HP : user.HP,
    MP : user.MP,
    castSpeed : user.castSpeed,
    maxSpeed : user.maxSpeed,
    rotateSpeed : user.rotateSpeed,

    conditions : this.conditions
  };
};
GameManager.prototype.addSkillData = function(userData){
  if(userData.objectID in this.users){
    userData.baseSkill = this.users[userData.objectID].baseSkill;
    userData.equipSkills = this.users[userData.objectID].equipSkills;
    userData.possessSkills = this.users[userData.objectID].possessSkills;
  }
};
GameManager.prototype.processSkillsDataSettings = function(){
  var skillDatas = [];
  for(var index in this.users){
    if(this.users[index].currentState === gameConfig.OBJECT_STATE_CAST){
      var skillData = {
        userID : this.users[index].objectID,
        index : this.users[index].currentSkill.index,
        targetPosition : this.users[index].currentSkill.targetPosition,
        direction : this.users[index].currentSkill.direction,
        totalTime : this.users[index].currentSkill.totalTime - (Date.now() - this.users[index].currentSkill.startTime),
        fireTime : this.users[index].currentSkill.fireTime - (Date.now() - this.users[index].currentSkill.startTime)
      }
    }
  }
  return skillDatas;
};
GameManager.prototype.processProjectilesDataSettings = function(){
  var projectileDatas = [];
  for(var i=0; i<this.projectiles; i++){
    var projectile = {
      index : this.projectiles[i].index,
      objectID : this.projectiles[i].objectID,
      position : this.projectiles[i].position,
      speed : this.projectiles[i].speed,
      radius : this.projectiles[i].radius,
      lifeTime : this.projectiles[i].lifeTime - (Date.now() - this.projectiles[i].startTime),
      explosionRadius : this.projectiles[i].explosionRadius,
      explode : this.projectiles[i].colliderEle.isCollide,
    }
    projectileDatas.push(projectile);
  }
  return projectileDatas;
};
GameManager.prototype.processOBJDataSetting = function(data){
  return {
    objectID : data.objectID,
    position : data.position,
    radius : data.size.width/2
  };
};
GameManager.prototype.processOBJDataSettings = function(){
  var objDatas = [];
  for(var i=0; i<this.objExps.length; i++){
    var objExp = {
      objectID : this.objExps[i].objectID,
      position : this.objExps[i].position,
      radius : this.objExps[i].size.width/2
    }
    objDatas.push(objExp);
  }
  for(var i=0; i<this.objSkills.length; i++){
    var objSkill = {
      objectID : this.objSkills[i].objectID,
      position : this.objSkills[i].position,
      radius : this.objSkills[i].size.width/2
    }
    objDatas.push(objSkill);
  }
  return objDatas;
};
GameManager.prototype.processChestDataSetting = function(data){
  return {
    objectID : data.objectID,
    locationID : data.locationID,
    grade : data.grade
  };
};
GameManager.prototype.processChestDataSettings = function(){
  var chestDatas = [];
  for(var i=0; i<this.chests.length; i++){
    chestDatas.push({
      objectID : this.chests[i].objectID,
      locationID : this.chests[i].locationID,
      grade : this.chests[i].grade,

      maxHP : this.chests[i].maxHP,
      HP : this.chests[i].HP
    });
  }
  return chestDatas;
};
GameManager.prototype.isCreateChest = function(){
  if(this.chests.length === 0){
    return true;
  }else{
    return false;
  }
};
function chestIntervalHandler(){
  if(this.isCreateChest()){
    this.createChest('CH1');
  }
};
function updateIntervalHandler(){
  //check collision user with skill
  //colliderEle : skill, collisionObj : user, chest
  for(var i=0; i<colliderEles.length; i++){
    //tempCollider == skill and projectile
    var tempCollider = colliderEles[i];
    //collision with user or chest
    if(tempCollider.latency >= 225){
      var collisionObjs = util.checkCircleCollision(entityBefore300msTree, tempCollider.x, tempCollider.y, tempCollider.width/2, tempCollider.id);
      console.log('check collision to entityBefore300msTree');
    }else if(tempCollider.latency >= 75){
      collisionObjs = util.checkCircleCollision(entityBefore150msTree, tempCollider.x, tempCollider.y, tempCollider.width/2, tempCollider.id);
      console.log('check collision to entityBefore150msTree');
    }else {
      collisionObjs = util.checkCircleCollision(entityTree, tempCollider.x, tempCollider.y, tempCollider.width/2, tempCollider.id);
    }
    if(collisionObjs.length > 0){
      for(var j = 0; j<collisionObjs.length; j++){
        if(tempCollider.type === gameConfig.SKILL_TYPE_PROJECTILE){
          if(!tempCollider.isCollide){
            tempCollider.isCollide = true;
            if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_USER){
              affectedEles.push(SUtil.setAffectedEleColSkillWithEntity(tempCollider, collisionObjs[j].id, serverConfig.COLLISION_SKILL_WITH_USER));
            }else if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_CHEST){
              affectedEles.push(SUtil.setAffectedEleColSkillWithEntity(tempCollider, collisionObjs[j].id, serverConfig.COLLISION_SKILL_WITH_CHEST));
            }else{
              console.log('check id' + collisionObjs[j].id);
            }
          }
        }else if(tempCollider.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION){
          if(!tempCollider.isCollide){
            tempCollider.isCollide = true;
          }
        }else if(tempCollider.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK && !tempCollider.isCollide){
          if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_USER){
            affectedEles.push(SUtil.setAffectedEleColSkillWithEntity(tempCollider, collisionObjs[j].id, serverConfig.COLLISION_SKILL_WITH_USER));
          }else if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_CHEST){
            affectedEles.push(SUtil.setAffectedEleColSkillWithEntity(tempCollider, collisionObjs[j].id, serverConfig.COLLISION_SKILL_WITH_CHEST));
          }else{
            console.log('check id' + collisionObjs[j].id);
          }
          if(collisionObjs.length - 1 === j){
            tempCollider.isCollide = true;
          }
        }else{
          if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_USER){
            affectedEles.push(SUtil.setAffectedEleColSkillWithEntity(tempCollider, collisionObjs[j].id, serverConfig.COLLISION_SKILL_WITH_USER));
          }else if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_CHEST){
            affectedEles.push(SUtil.setAffectedEleColSkillWithEntity(tempCollider, collisionObjs[j].id, serverConfig.COLLISION_SKILL_WITH_CHEST));
          }else{
            console.log('check id' + collisionObjs[j].id);
          }
        }
        // //case projectile explosive skill
        // if(tempCollider.objectID && tempCollider.isExplosive){
        //   if(tempCollider.isCollide){
        //     affectedEles.push({type : 'hitObj', objectID : tempCollider.objectID, attackUser : tempCollider.id, hitObj : collisionObjs[j].id, damage : tempCollider.damage,
        //                       buffsToTarget : tempCollider.buffsToTarget});
        //   }else{
        //     var index = this.projectiles.indexOf(tempCollider);
        //     console.log('projectile collision with user or chest');
        //     if(index !== -1){
        //       this.projectiles[index].explode();
        //     }
        //   }
        // }else{
        //   affectedEles.push({type : 'hitObj', attackUser : tempCollider.id, hitObj : collisionObjs[j].id, damage : tempCollider.damage,
        //                     buffsToTarget : tempCollider.buffsToTarget});
        // }
      }
    }
  }
  //check collision user with object(exp, skill, etc)
  //userEle : user, collisionObj : objExp, objSkill
  var removeOBJs = [];
  for(var i=0; i<userEles.length; i++){
    var tempUser = userEles[i];
    //collisionObj : exp or skill object
    var collisionObjs = util.checkCircleCollision(collectionTree, tempUser.x, tempUser.y, tempUser.width/2, tempUser.id);
    for(var j=0; j<collisionObjs.length;j++){
      if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_OBJECT_EXP){
        //case objExp
        affectedEles.push(SUtil.setAffectedEleColUserWithCollection(tempUser.id, collisionObjs[j], serverConfig.COLLISION_USER_WITH_COLLECTION_EXP));
        // affectedEles.push({type : 'getExpObj',user : tempUser.id, colObj : collisionObjs[j].id, addExp : collisionObjs[j].exp});
      }else if(collisionObjs[j].id.substr(0,3) === gameConfig.PREFIX_OBJECT_SKILL){
        //case objSkill
        affectedEles.push(SUtil.setAffectedEleColUserWithCollection(tempUser.id, collisionObjs[j], serverConfig.COLLISION_USER_WITH_COLLECTION_SKILL));
        // affectedEles.push({type : 'getSkillObj',user : tempUser.id, colObj : collisionObjs[j].id, skillIndex : collisionObjs[j].skillIndex});
      }else{
        console.log('check id' + collisionObjs[j].id);
      }
      removeOBJs.push(collisionObjs[j]);
    }
  }

  //clear tree and treeArray
  for(var i=0; i<userEles.length; i++){
    entityTree.remove(userEles[i]);
  }
  for(var i=0; i<userBefore150msEles.length; i++){
    entityBefore150msTree.remove(userBefore150msEles[i]);
  }
  for(var i=0; i<userBefore300msEles.length; i++){
    entityBefore300msTree.remove(userBefore300msEles[i]);
  }
  for(var i=0; i<chestEles.length; i++){
    entityTree.remove(chestEles[i]);
    entityBefore150msTree.remove(chestEles[i]);
    entityBefore300msTree.remove(chestEles[i]);
  }

  for(var i=0; i<removeOBJs.length; i++){
    collectionTree.remove(removeOBJs[i]);
    var index = collectionEles.indexOf(removeOBJs[i]);
    if(index >= 0){
      collectionEles.splice(index, 1);
    }
  }

  userEles = [];
  userBefore150msEles = [];
  userBefore300msEles = [];
  chestEles = [];
  colliderEles = [];
  // collectionEles = [];

  //updateUserArray
  for(var index in this.users){
    this.users[index].setEntityEle();
    userEles.push(this.users[index].entityTreeEle);
    this.users[index].setBefore150msEntitiyEle();
    userBefore150msEles.push(this.users[index].entityBefore150msTreeEle);

    this.users[index].setBefore300msEntityEle();
    userBefore300msEles.push(this.users[index].entityBefore300msTreeEle);
  }
  for(var i=0; i<this.chests.length; i++){
    chestEles.push(this.chests[i].entityTreeEle);
  }
  //update collectable objects array
  var addExpCounts = this.objExpsCount -this.objExps.length;
  var addSkillCounts = this.objSkillsCount - this.objSkills.length;
  if(addExpCounts > 0){
    var createdObjs = this.createOBJs(addExpCounts, gameConfig.PREFIX_OBJECT_EXP);
    this.onNeedInformCreateObjs(createdObjs);
  }
  if(addSkillCounts > 0){
    var createdObjs = this.createOBJs(addSkillCounts, gameConfig.PREFIX_OBJECT_SKILL);
    this.onNeedInformCreateObjs(createdObjs);
  }

  var addedObjEles = [];
  for(var i=0; i<this.addedObjExps.length; i++){
    addedObjEles.push(this.addedObjExps[i].collectionEle);
  }
  for(var i=0; i<this.addedObjSkills.length; i++){
    addedObjEles.push(this.addedObjSkills[i].collectionEle);
  }
  this.addedObjExps = [];
  this.addedObjSkills = [];
  for(var i=0; i<addedObjEles.length; i++){
    collectionEles.push(addedObjEles[i]);
  }

  //update projectiles array
  var i = this.projectiles.length;
  if(i > 0){
    while(i--){
      if(this.projectiles[i].type === gameConfig.SKILL_TYPE_PROJECTILE){
        if(this.projectiles[i].isExpired() || this.projectiles[i].isCollide){
          this.onNeedInformProjectileDelete(this.projectiles[i]);
          this.projectiles.splice(i, 1);
        }
      }else if(this.projectiles[i].type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION){
        if(this.projectiles[i].isExpired() || this.projectiles[i].isCollide){
          this.projectiles[i].explode();
          this.onNeedInformProjectileExplode(this.projectiles[i]);
          this.projectiles.splice(i, 1);
          this.skills.push(this.projectiles[i]);
        }
      }else if(this.projectiles[i].type === gameConfig.SKILL_TYPE_PROJECTILE_TICK){
        if(this.projectiles[i].isExpired()){
          this.onNeedInformProjectileDelete(this.projectiles[i]);
          this.projectiles.splice(i, 1);
        }
      }
      // if(this.projectiles[i].isExpired() || this.projectiles[i].isCollide){
      //   if(this.projectiles[i].isExplosive){
      //     this.projectiles[i].explode();
      //     this.onNeedInformProjectileExplode(this.projectiles[i]);
      //     this.skills.push(this.projectiles[i]);
      //   }
      //   this.projectiles.splice(i, 1);
      // }else{
      //   this.projectiles[i].move();
      //   colliderEles.push(this.projectiles[i]);
      // }
    }
  }
  //update skills array
  var skillsIndex = this.skills.length;
  if(skillsIndex > 0){
    while(skillsIndex--){
      colliderEles.push(this.skills[skillsIndex]);
      this.skills.splice(skillsIndex, 1);
    }
  }
  //put users data to tree
  entityTree.pushAll(userEles);
  entityTree.pushAll(chestEles);

  entityBefore150msTree.pushAll(userBefore150msEles);
  entityBefore150msTree.pushAll(chestEles);

  entityBefore300msTree.pushAll(userBefore300msEles);
  entityBefore300msTree.pushAll(chestEles);

  // collectionTree.pushAll(collectionEles);
  collectionTree.pushAll(addedObjEles);
};
function staticIntervalHandler(){
  //explode when projectile collide with obstacle
  for(var i=0; i<this.projectiles.length; i++){
    var projectileCollider = this.projectiles[i];
    var collisionObjs = util.checkCircleCollision(staticTree, projectileCollider.x, projectileCollider.y, projectileCollider.width/2, projectileCollider.id);
    if(collisionObjs.length > 0 ){
      if(tempCollider.type === gameConfig.SKILL_TYPE_PROJECTILE || tempCollider.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION){
        if(!tempCollider.isCollide){
          tempCollider.isCollide = true;
        }
      }
    }
  }
};

function affectIntervalHandler(){
  var i = affectedEles.length;
  // console.log('affectedEles.length');
  // console.log(affectedEles.length);
  if(i > 0){
    while(i--){
      if(affectedEles[i].collisionType === serverConfig.COLLISION_SKILL_WITH_USER){
        if(affectedEles[i].affectedID in this.users){
          this.users[affectedEles[i].affectedID].takeDamage(affectedEles[i].actorID, affectedEles[i].fireDamage, affectedEles[i].frostDamage,
                                                  affectedEles[i].arcaneDamage, affectedEles[i].damageToMP);
          this.users[affectedEles[i].affectedID].addBuffs(affectedEles[i].buffsToTarget);
        }
      }else if(affectedEles[i].collisionType === serverConfig.COLLISION_SKILL_WITH_CHEST){
        for(var i=0; i<this.chests.length; i++){
          if(this.chests[i].objectID === affectedEles[i].affectedID){
            var dmg = 0;
            if(affectedEles[i].fireDamage){
              dmg += affectedEles[i].fireDamage;
            }
            if(affectedEles[i].frostDamage){
              dmg += affectedEles[i].frostDamage;
            }
            if(affectedEles[i].arcaneDamage){
              dmg += affectedEles[i].arcaneDamage;
            }
            this.chests[i].takeDamage(affectedEles[i].actorID, dmg);
            break;
          }
        }
      }else if(affectedEles[i].collisionType === serverConfig.COLLISION_USER_WITH_COLLECTION_EXP){
        this.getObj(affectedEles[i].affectedID, affectedEles[i].expAmount, affectedEles[i].actorID);
      }else if(affectedEles[i].collisionType === serverConfig.COLLISION_USER_WITH_COLLECTION_SKILL){
        this.getObj(affectedEles[i].affectedID, affectedEles[i].skillIndex, affectedEles[i].actorID);
      }else if(affectedEles[i].collisionType === serverConfig.COLLISION_USER_WITH_COLLECTION_GOLD){
        this.getObj(affectedEles[i].affectedID, affectedEles[i].goldAmount, affectedEles[i].actorID);
      }else{
        console.log('affectedEle is not specified');
        console.log(affectedEles[i]);
      }
      // if(affectedEles[i].type === 'hitObj'){
      //   if(affectedEles[i].hitObj.substr(0, 3) === gameConfig.PREFIX_USER){
      //     if(affectedEles[i].hitObj in this.users){
      //       //case hit user
      //       this.users[affectedEles[i].hitObj].takeDamage(affectedEles[i].attackUser, affectedEles[i].damage);
      //       //buff and debuff apply
      //       this.users[affectedEles[i].hitObj].addBuffs(affectedEles[i].buffsToTarget);
      //     }
      //   }else if(affectedEles[i].hitObj.substr(0, 3) === gameConfig.PREFIX_CHEST){
      //     //case hit chest
      //     for(var i=0; i<this.chests.length; i++){
      //       if(this.chests[i].objectID === affectedEles[i].hitObj){
      //         SUtil.handlingAffectedEleColSkillWithChest();
      //         this.chests[i].takeDamage(affectedEles[i].attackUser, affectedEles[i].damage);
      //         break;
      //       }
      //     }
      //   }
      // }else{
      //   this.getObj(affectedEles[i]);
      // }
      affectedEles.splice(i, 1);
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

module.exports = GameManager;
