var Obstacle = require('./Obstacle.js');
var config = require('../../config.json');
var gameConfig = require('../public/gameConfig.json');
var util = require('../public/util.js');

var resources = require('../public/resource.json');
var map = require('../public/map.json');

var Skill = require('./Skill.js');

var QuadTree = require('quadtree-lib');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

//quadTree var
var entityTree;
var userEles = [];
var colliderEles = [];

var staticTree;
var staticEles = [];
var affectedEles = [];

function GameManager(){
  this.users = [];
  this.obstacles = [];
  this.projectiles = [];

  this.updateInteval = false;
  this.staticInterval = false;
  this.affectInterval = false;

  this.onNeedInform = new Function();
  this.onNeedInformToAll = new Function();
  this.onNeedProjectileSkillInformToAll = new Function();
};

GameManager.prototype.start = function(){
  entityTree = new QuadTree({
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
  this.createObstacles();
};
GameManager.prototype.updateGame = function(){
  if(this.updateInteval === false){
    this.updateInteval = setInterval(updateIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.staticInterval === false){
    this.staticInterval = setInterval(staticIntervalHandler.bind(this), INTERVAL_TIMER);
  }
  if(this.affectInterval === false){
    this.affectInterval = setInterval(affectIntervalHandler.bind(this), INTERVAL_TIMER);
  }
};

//create obstacles and static tree setup
GameManager.prototype.createObstacles = function(){
  for(var index in map.Trees){
    var tempObstacle = new Obstacle(map.Trees[index].posX, map.Trees[index].posY,	resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id, resources.OBJ_TREE_SRC);

    this.obstacles.push(tempObstacle);
    staticEles.push(tempObstacle.staticEle);
  }
  staticTree.pushAll(staticEles);
};

//setting User for moving and move user;
GameManager.prototype.setUserTargetAndMove = function(user, targetPosition){
  var collisionObjs = util.checkCircleCollision(staticTree, targetPosition.x - user.size.width/2, targetPosition.y - user.size.width/2, user.size.width, user.objectID);
  //if click in obstacle calculate new target position
  if(collisionObjs.length > 0){
    var curPosX = user.position.x + user.size.width/2;
    var curPosY = user.position.y + user.size.width/2;

    var addPosX = collisionObjs[0].x + collisionObjs[0].width/2 - curPosX;
    var addPosY = collisionObjs[0].y + collisionObjs[0].width/2 - curPosY;

    var vecSize = Math.sqrt(Math.pow(addPosX,2) + Math.pow(addPosY,2));

    var unitVecX = addPosX/vecSize;
    var unitVecY = addPosY/vecSize;

    var radiusDist = collisionObjs[0].width/2 + user.size.width/2

    var newAddPosX = unitVecX * (vecSize - radiusDist);
    var newAddPosY = unitVecY * (vecSize - radiusDist);

    var newTargetPosX = curPosX + newAddPosX;
    var newTargetPosY = curPosY + newAddPosY;

    targetPosition.x = newTargetPosX;
    targetPosition.y = newTargetPosY;
  }
  user.setTargetPosition(targetPosition);
  user.setTargetDirection();
  user.setSpeed();

  user.changeState(gameConfig.OBJECT_STATE_MOVE);
};

GameManager.prototype.useSkill = function(user, skillData, clickPosition){
  var skillInstance = user.makeSkillInstance(skillData, clickPosition);
  switch (parseInt(skillData.type)) {
    case gameConfig.SKILL_TYPE_BASIC:
        skillInstance.onFire = function(){
          //buff and debuff apply to self;
          user.addBuffs(skillInstance.buffsToSelf);
          user.addDebuffs(skillInstance.debuffsToSelf);
          // skillInstance.applyBuff(user, 'buffsToSelf', 'buffList');
          // skillInstance.applyBuff(user, 'debuffsToSelf', 'buffList');
          setTimeout(function(){
            colliderEles.push(skillInstance.colliderEle);
          }, skillData.effectLastTime/2);
        };
      user.changeState(gameConfig.OBJECT_STATE_ATTACK);
      break;
    case gameConfig.SKILL_TYPE_INSTANT:
      skillInstance.onFire = function(){
        //buff and debuff apply to self;
        user.addBuffs(skillInstance.buffsToSelf);
        user.addDebuffs(skillInstance.debuffsToSelf);
        setTimeout(function(){
          colliderEles.push(skillInstance.colliderEle);
        }, skillData.effectLastTime/2);
      };
      user.targetDirection = util.calcTargetDirection(clickPosition, user.center);
      user.changeState(gameConfig.OBJECT_STATE_CAST);
      break;
    case gameConfig.SKILL_TYPE_PROJECTILE:
      var projectiles = this.projectiles;
      var onProjectileFireOrExplode = this.onNeedProjectileSkillInformToAll;
      skillInstance.onFire = function(){
        //buff and debuff apply to self;
        user.addBuffs(skillInstance.buffsToSelf);
        user.addDebuffs(skillInstance.debuffsToSelf);
        //create projectile object and push to projectiles
        var randomID = generateRandomUniqueID(this.projectiles, 'P');
        var projectile = skillInstance.makeProjectile(user, randomID, true);
        projectile.onExplosion = onProjectileFireOrExplode;
        projectiles.push(projectile);
        colliderEles.push(projectile.colliderEle);
        onProjectileFireOrExplode(projectile);
      };
      user.targetDirection = util.calcTargetDirection(clickPosition, user.center);
      user.changeState(gameConfig.OBJECT_STATE_CAST);
      break;
    case gameConfig.SKILL_TYPE_SELF:
      skillInstance.onFire = function(){
        //buff and debuff apply to self;
        user.addBuffs(skillInstance.buffsToSelf);
        user.addDebuffs(skillInstance.debuffsToSelf);
      };
      user.changeState(gameConfig.OBJECT_STATE_CAST);
      break;
    case gameConfig.SKILL_TYPE_SELF_EXPLOSION:
      skillInstance.onFire = function(){
        user.addBuffs(skillInstance.buffsToSelf);
        user.addDebuffs(skillInstance.debuffsToSelf);
        setTimeout(function(){
          colliderEles.push(skillInstance.colliderEle);
        }, skillData.effectLastTime/2);
      };
      user.changeState(gameConfig.OBJECT_STATE_CAST);
      break;
    case gameConfig.SKILL_TYPE_TELEPORT:
      skillInstance.onFire = function(){
        user.addBuffs(skillInstance.buffsToSelf);
        user.addDebuffs(skillInstance.debuffsToSelf);
        setTimeout(function(){
          user.moveDirect(clickPosition);
        }, skillData.effectLastTime/2);
      };
      break;
    case gameConfig.SKILL_TYPE_PROJECTILE_TICK:
      var projectiles = this.projectiles;
      var onProjectileFireOrExplode = this.onNeedProjectileSkillInformToAll;
      skillInstance.onFire = function(){
        //buff and debuff apply to self;
        user.addBuffs(skillInstance.buffsToSelf);
        user.addDebuffs(skillInstance.debuffsToSelf);
        //create projectile object and push to projectiles
        var randomID = generateRandomUniqueID(this.projectiles, 'P');
        var projectile = skillInstance.makeProjectile(user, randomID, false);
        projectile.onExplosion = onProjectileFireOrExplode;
        projectiles.push(projectile);
        colliderEles.push(projectile.colliderEle);
        onProjectileFireOrExplode(projectile);
      };
      user.targetDirection = util.calcTargetDirection(clickPosition, user.center);
      user.changeState(gameConfig.OBJECT_STATE_CAST);
      break;
    default:
      console.log('skill type error!!!');
      break;
  }
  user.setSkill(skillInstance);
  return skillInstance;
};

// user join, kick, update
GameManager.prototype.joinUser = function(user){
  this.users[user.objectID] = user;
  this.users[user.objectID].onMove = onMoveCalcCompelPos.bind(this);
  this.users[user.objectID].onDeath = onUserDeath.bind(this);
  console.log(this.users);
  console.log(user.objectID + ' join in GameManager');
};
GameManager.prototype.kickUser = function(user){
  if(!(user.objectID in this.users)){
    console.log("can`t find user`s ID. something is wrong");
  }else{
    delete this.users[user.objectID];
  }
};
GameManager.prototype.updateUser = function(user){
  if(!(user.objectID in this.users)){
    console.log("can`t find user`s ID. something is wrong");
  }else{
    this.users[user.objectID] = user;
  }
};

//user initialize
GameManager.prototype.initializeUser = function(user){
  // check ID is unique
  var randomID = generateRandomUniqueID(this.users, 'U');
  //initialize variables;
  user.assignID(randomID);

  user.setSize(64,64);
  user.setPosition(10, 10);

  user.buffUpdate();
  // user.setRotateSpeed(20);
  // user.setMaxSpeed(5);
};

GameManager.prototype.stopUser = function(user){
  user.stop();
};

// data setting for send to client
GameManager.prototype.updateDataSettings = function(){
  var userData = [];

  for(var index in this.users){
    var tempUser = {
      objectID : index,

      currentState : this.users[index].currentState,
      position : this.users[index].position,
      targetPosition : this.users[index].targetPosition,

      // speed : this.users[index].speed,
      maxSpeed : this.users[index].maxSpeed,

      direction : this.users[index].direction,

      rotateSpeed :  this.users[index].rotateSpeed,
      // targetDirection : this.users[index].targetDirection,

      size : this.users[index].size
    };
    userData.push(tempUser);
  };

  return userData;
};
GameManager.prototype.updateDataSetting = function(user){
  var userData = {
    objectID : user.objectID,

    currentState : user.currentState,
    position : user.position,
    targetPosition : user.targetPosition,

    // speed : user.speed,
    maxSpeed : user.maxSpeed,
    direction : user.direction,

    rotateSpeed : user.rotateSpeed,
    // targetDirection : user.targetDirection,

    size : user.size
  };
  return userData;
};
GameManager.prototype.updateSkillDataSetting = function(skill){
  var skillData = {
    index : skill.index,
    targetPosition : skill.targetPosition,
    direction : skill.direction,
    totalTime : skill.totalTime,
    fireTime : skill.fireTime
    // type : skill.type,
    // timeSpan : Date.now() - skill.startTime,
    // totalTime : skill.totalTime,
    // fireTime : skill.fireTime,
    // explosionRadius : skill.explosionRadius,
    // radius : skill.radius,
    // targetPosition : skill.targetPosition,
    // maxSpeed : skill.maxSpeed
  }
  return skillData;
};
GameManager.prototype.updateSkillsDataSettings = function(){
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
GameManager.prototype.updateProjectileDataSetting = function(projectile){
  var projectileData = {
    index : projectile.index,
    objectID : projectile.objectID,
    position : projectile.position,
    speed : projectile.speed,
    radius : projectile.radius,
    lifeTime : projectile.lifeTime,
    explosionRadius : projectile.explosionRadius,
    explode : projectile.colliderEle.isCollide
  }
  return projectileData;
};
GameManager.prototype.updateProjectilesDataSettings = function(){
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
GameManager.prototype.checkStateIsAttack = function(user){
  if(user.currentState === gameConfig.OBJECT_STATE_ATTACK){
    return true;
  }else{
    return false;
  }
};

function updateIntervalHandler(){
  //colliderEle : skill, collisionObj : userTree
  for(var i=0; i<colliderEles.length; i++){
    //tempCollider == skill
    var tempCollider = colliderEles[i];
    //collision with user
    var collisionObjs = util.checkCircleCollision(entityTree, tempCollider.x, tempCollider.y, tempCollider.width, tempCollider.id);
    if(collisionObjs.length > 0){
      for(var j = 0; j<collisionObjs.length; j++){
        //case projectile explosive skill
        if(tempCollider.objectID && tempCollider.isExplosive){
          if(tempCollider.isCollide){
            affectedEles.push({objectID : tempCollider.objectID, attackUser : tempCollider.id, hitUser : collisionObjs[j].id, damage : tempCollider.damage,
                              buffsToTarget : tempCollider.buffsToTarget, debuffsToTarget : tempCollider.debuffsToTarget});
          }else{
            for(var k=0; j<this.projectiles; k++){
              if(this.projectiles[k].objectID === tempCollider.objectID){
                this.projectiles[k].explode();
                break;
              }
            }
          }
        }else{
          affectedEles.push({attackUser : tempCollider.id, hitUser : collisionObjs[j].id, damage : tempCollider.damage,
                            buffsToTarget : tempCollider.buffsToTarget, debuffsToTarget : tempCollider.debuffsToTarget});
        }
      }
    }
  }
  //clear tree and treeArray
  for(var index in userEles){
    entityTree.remove(userEles[index]);
  }
  userEles = [];
  colliderEles = [];

  //updateUserArray
  for(var index in this.users){
    this.users[index].setEntityEle();
    userEles.push(this.users[index].entityTreeEle);
  }
  //update projectiles array
  var i = this.projectiles.length;
  while(i--){
    if(this.projectiles[i].isExpired() || this.projectiles[i].colliderEle.isCollide){
      if(this.projectiles[i].colliderEle.isExplosive){
        this.projectiles[i].explode();
      }
      this.projectiles.splice(i, 1);
    }else{
      this.projectiles[i].move();
      colliderEles.push(this.projectiles[i].colliderEle);
    }
  }

  //put users data to tree
  entityTree.pushAll(userEles);
};
function staticIntervalHandler(){
  for(var i=0; i<this.projectiles; i++){
    var projectileCollider = this.projectiles[i].colliderEle;
    var collisionObjs = util.checkCircleCollision(staticTree, projectileCollider.x, projectileCollider.y, projectileCollider.width/2, projectileCollider.id);
    if(collisionObjs.length > 0 ){
      for(var j = 0; j<collisionObjs.length; j++){
        if(!projectileCollider.isCollide){
          for(var k=0; k<this.projectiles; k++){
            if(this.projectiles[k].objectID === tempCollider.objectID){
              this.projectiles[k].explode();
            }
          }
        }
      }
    }
  }
};

function affectIntervalHandler(){
  var i = affectedEles.length;
  while(i--){
    if(affectedEles[i].hitUser in this.users){
      this.users[affectedEles[i].hitUser].takeDamage(affectedEles[i].attackUser, affectedEles[i].damage);
      //buff and debuff apply
      for(var j=0; j<affectedEles[i].buffsToTarget.length; j++){
        this.users.addBuff(affectedEles[i].buffsToTarget[j]);
        // this.users.buffList.push(affectedEles[i].buffsToTarget[j]);
      }
      for(var j=0; j<affectedEles[i].debuffsToTarget.length; j++){
        this.users.addDebuff(affectedEles[i].debuffsToTarget[j]);
        // this.users.debuffList.push(affectedEles[i].debuffsToTarget[j]);
      }
    }
    //projectiles
    // {attackUser : tempCollider.id, hitUser : collisionObjs[index].id,
    // damage : tempCollider.damage, buffsToTarget : tempCollider.buffsToTarget,
    // debuffsToTarget : tempCollider.debuffsToTarget}
    console.log(affectedEles[i]);
    //explode projectile;
    affectedEles.splice(i, 1);
  }
};
// ({func : 'damageToUser', attackUser : tempCollider.id, hitUser : item.id, damage : tempCollider.damage })

var onMoveCalcCompelPos = function(user){
  var collisionObjs = util.checkCircleCollision(staticTree, user.entityTreeEle.x, user.entityTreeEle.y, user.entityTreeEle.width/2, user.entityTreeEle.id);
  if(collisionObjs.length > 0 ){
    var addPos = util.calcCompelPos(user.entityTreeEle, collisionObjs);
  }
  return addPos;
};
var onUserDeath = function(attackUserID, exp, deadUser){
  if(attackUserID in this.users){
    this.users[attackUserID].getExp(exp);
  }else{
    console.log(attackUserID + ' is not exists');
  }
};
function generateRandomUniqueID(uniqueCheckArray, prefix){
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

module.exports = GameManager;
