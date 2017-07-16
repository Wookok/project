var Obstacle = require('./Obstacle.js');
var config = require('../../config.json');
var gameConfig = require('../public/gameConfig.json');
var util = require('../public/util.js');

var resources = require('../public/resource.json');
var map = require('../public/map.json');

var Skill = require('./Skill.js');
var skills = require('../public/skill.json');

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
    // var tempObstacle = new Obstacle(util.worldXCoordToLocalX(map.Trees[index].posX, this.gameConfig.userOffset.x),
    // 																util.worldYCoordToLocalY(map.Trees[index].posY, this.gameConfig.userOffset.y),
    // 																resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE, map.Trees[index].id);
    this.obstacles.push(tempObstacle);
    staticEles.push(tempObstacle.staticEle);
  }
  staticTree.pushAll(staticEles);
  // var obstacle1 = new Obstacle(200, 200, 100, 100, generateRandomID("OR"));
  // var obstacle2 = new Obstacle(500, 500, 100, 100, generateRandomID("OR"));
  //
  // staticEles.push(obstacle1.staticEle);
  // staticEles.push(obstacle2.staticEle);
  //
  // staticTree.pushAll(staticEles);
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
GameManager.prototype.doBaseAttack = function(user){
  var baseAttack = user.makeBaseAttackInstance();
  baseAttack.onFire = function(){
    colliderEles.push(baseAttack.colliderEle);
  }
  //changeState must execute before doBaseAttack
  user.changeState(gameConfig.OBJECT_STATE_ATTACK);
  user.executeSkill(baseAttack);
  return baseAttack;
};
GameManager.prototype.doInstantRangeSkill = function(user, targetPosition){
  var instantRangeSkill = user.makeInstantRangeSkill(targetPosition);
  instantRangeSkill.onFire = function(){
    colliderEles.push(instantRangeSkill.colliderEle);
  }
  user.targetDirection = util.calcTargetDirection(targetPosition, user.center);
  user.changeState(gameConfig.OBJECT_STATE_CAST);
  user.executeSkill(instantRangeSkill);
  return instantRangeSkill;
};
GameManager.prototype.doProjectileSkill = function(user, direction){
  var projectileSkill = user.makeProjectileSkill(direction);
  projectileSkill.onFire = function(){
    var projectileSkillColliderEle = new Skill.ProjectileSkillColliderEle(projectileSkill.objectID, 6,
                                         user.center.x, user.center.y, projectileSkill.size.width, projectileSkill.speed, projectileSkill.lifeTime);
    this.projectiles.push(projectileSkillColliderEle);
    colliderEles.push(projectileSkill);
  }
  user.targetDirection = util.calcTargetDirection(targetPosition, user.center);
  user.changeState(gameConfig.OBJECT_STATE_CAST);
  user.executeSkill(projectileSkill);
  return projectileSkill;
};
GameManager.prototype.doSelfSkill = function(user){
  var selfSkill = user.makeSelfSkill();
  selfSkill.onFire = function(){

  }
  user.changeState(gameConfig.OBJECT_STATE_CAST);
  user.executeSkill(selfSkill);
  return selfSkill;
}
// user join, kick, update
GameManager.prototype.joinUser = function(user){
  this.users[user.objectID] = user;
  this.users[user.objectID].onMove = onMoveCalcCompelPos.bind(this);
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
  var IDisUnique = false;
  while(!IDisUnique){
    var randomID = generateRandomID('U');
    IDisUnique = true;
    for(var index in this.users){
      if(randomID == this.users[index].objectID){
        IDisUnique = false;
      }
    }
  }
  //initialize variables;
  user.assignID(randomID);

  user.setSize(64,64);
  user.setPosition(10, 10);

  user.setRotateSpeed(20);
  user.setMaxSpeed(5);
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
    totalCastTime : skill.totalCastTime,
    fireTime : skill.fireTime,
    radius : skill.size.width,
    targetPosition : skill.targetPosition
  }
  return skillData;
}
GameManager.prototype.checkStateIsAttack = function(user){
  if(user.currentState === gameConfig.OBJECT_STATE_ATTACK){
    return true;
  }else{
    return false;
  }
};

function updateIntervalHandler(){
  for(var i=0; i<colliderEles.length; i++){
    var tempCollider = colliderEles[i];
    var collisionObjs = util.checkCircleCollision(entityTree, tempCollider.x, tempCollider.y, tempCollider.width, tempCollider.id);
    if(collisionObjs.length > 0){
      switch (tempCollider.type) {
        case 'baseAttack':
          for(var index in collisionObjs){
            affectedEles.push({func : 'damageToUser', attackUser : tempCollider.id, hitUser : collisionObjs[index].id, damage : tempCollider.damage });
          }
          break;
        default:
          break;
      }
    }
    // entityTree.onCollision(tempCollider, function(item){
    //   if(tempCollider.id !== item.id){
    //     var colCenterX = tempCollider.x + tempCollider.width/2;
    //     var colCenterY = tempCollider.y + tempCollider.height/2;
    //
    //     var itemCenterX = item.x + item.width/2;
    //     var itemCenterY = item.y + item.height/2;
    //
    //     var distSquare = Math.pow(itemCenterX - colCenterX,2) + Math.pow(itemCenterY - colCenterY ,2);
    //     if(distSquare < Math.pow(tempCollider.width/2 + item.width/2, 2)){
    //       console.log('collision is occured');
    //       switch (tempCollider.type) {
    //         case 'baseAttack':
    //           affectedEles.push({func : 'damageToUser', attackUser : tempCollider.id, hitUser : item.id, damage : tempCollider.damage });
    //           break;
    //         default:
    //           break;
    //       }
    //     }
    //   }
    // });
  }
  //clear tree and treeArray
  for(var index in userEles){
    entityTree.remove(userEles[index]);
  }
  userEles = [];
  colliderEles = [];

  //updateUserArray
  for(var index in this.users){
    this.users[index].setUserEle();
    userEles.push(this.users[index].entityTreeEle);
  }
  //update projectiles array
  var i = this.projectiles.length;
  while(i--){
    if(this.projectiles[i].isExpired()){
      this.projectiles.splice(i, 1);
    }else{
      this.projectiles[i].move();
      colliderEles.push(this.projectiles[i]);
    }
  }
  //test
  // for(var index in this.users){
  //   colliderEles.push(this.users[index].entityTreeEle);
  // }
  //put users data to tree
  entityTree.pushAll(userEles);
};
function staticIntervalHandler(){
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
  var i = affectedEles.length;
  while(i--){
    if(affectedEles[i].func === 'damageToUser'){
      this.onNeedInformToAll(affectedEles[i].hitUser);
      console.log(affectedEles[i])
    }
    affectedEles.splice(i, 1);
  }
};
// ({func : 'damageToUser', attackUser : tempCollider.id, hitUser : item.id, damage : tempCollider.damage })

var onMoveCalcCompelPos = function(user){
  var collisionObjs = util.checkCircleCollision(staticTree, user.entityTreeEle.x, user.entityTreeEle.y, user.entityTreeEle.width, user.entityTreeEle.id);
  if(collisionObjs.length > 0 ){
    var addPos = util.calcCompelPos(user.entityTreeEle, collisionObjs);
  }
  return addPos;
};

function generateRandomID(prefix){
  var output = prefix;
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
};

module.exports = GameManager;
