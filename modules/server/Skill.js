var util = require('../public/util.js');

var SkillBase = function(id, totalCastTime, fireTime){
  this.objectID = id;
  this.totalCastTime = totalCastTime;
  this.fireTime = fireTime;
  // this.ManaCost = cost;

  this.fireTimeout = false;
  this.totalCastTimeout = false;

  //fire skill, established at Manager
  this.onFire = new Function();

  //user state change after skill fire, established at User
  this.onTimeOver = new Function();
};
SkillBase.prototype = {
  executeSkill : function(){
    this.fireTimeout = setTimeout(fireTimeoutHandler.bind(this), this.fireTime);
    this.totalCastTimeout = setTimeout(totalCastTimeoutHandler.bind(this), this.totalCastTime);
  },
  destroy : function(){
    if(this.fireTimeout){
      console.log('clearTimeout');
      clearTimeout(this.fireTimeout);
    }
    if(this.totalCastTimeout){
      clearTimeout(this.totalCastTimeout);
    }
  },
  // onDestroy : function(){
  //   this.destroy();
  // }
};

function fireTimeoutHandler(){
  this.onFire();
};
function totalCastTimeoutHandler(){
  this.onTimeOver();
}

var BaseAttack = function(id, totalCastTime, fireTime, range, radius){
    SkillBase.call(this, id, totalCastTime, fireTime);
    this.targetPosition;
    this.range = range;
    this.size = {width : radius, height : radius};

    this.colliderEle = {
      id : this.objectID,
      type : 'baseAttack',
      damage : '1',
      x : 0,
      y : 0,
      width : this.size.width,
      height : this.size.height
    }
};
BaseAttack.prototype = Object.create(SkillBase.prototype);
BaseAttack.prototype.constructor = BaseAttack;

BaseAttack.prototype.setTargetPosition = function(userPosition, userDirection){
  var addPosX = this.range * Math.cos(userDirection * Math.PI/180);
  var addPosY = this.range * Math.sin(userDirection * Math.PI/180);

  this.targetPosition = {
    x : userPosition.x + addPosX,
    y : userPosition.y + addPosY
  }
  this.colliderEle.x = this.targetPosition.x;
  this.colliderEle.y = this.targetPosition.y;
};
module.exports.BaseAttack = BaseAttack;

var InstantRangeSkill = function(id, totalCastTime, fireTime, range, radius){
  SkillBase.call(this, id, totalCastTime, fireTime);
  this.targetPosition;
  this.range = range;
  this.size = {width : raidus, height : radius};

  this.colliderEle = {
    id : this.objectID,
    type : 'InstantRangeSkill',
    damage : '3',
    x : 0,
    y : 0,
    width : this.size.widht,
    height : this.size.height
  }
};
InstantRangeSkill.prototype = Object.create(SkillBase.prototype);
InstantRangeSkill.prototype.constructor = InstantRangeSkill;

InstantRangeSkill.prototype.setTargetDirection = function(userCenterPosition, targetPosition){
  //check targetPosition is in range
  var distSqure = util.distanceSquare(userCenterPosition, targetPosition);
  if(Math.pow(this.range,2) > distSquare){
    this.targetPosition = {
      x : targetPosition.x,
      y : targetPosition.y
    }
    this.colliderEle.x = this.targetPosition.x;
    this.colliderEle.y = this.targetPosition.y;
  }else{
    //if targetPosition is out of range then re calculate targetPosition as max range of targetDirection
    var direction = util.calcTargetDirection(targetPosition, userCenterPosition);
    var addPos = util.calcTargetPosition(userCenterPosition, direction, this.range);

    this.targetPosition = {
      x : userCenterPosition.x + addPos.x,
      y : userCenterPosition.y + addPosY.y
    }
    this.colliderEle.x = this.targetPosition.x;
    this.colliderEle.y = this.targetPosition.y;
  }
};
module.exports.InstantRangeSkill = InstantRangeSkill;

var ProjectileSkill = function(id, totalCastTime, fireTime, direction, radius, maxSpeed, projectileLifeTime){
  SkillBase.call(this, id, totalCastTime, fireTime);
  this.lifeTime = projectileLifeTime;
  this.size = {width : radius, height : radius};
  this.direction = direction;
  this.maxSpeed = maxSpeed;
  this.speed = {x : this.maxSpeed * Math.cos(this.direction * Math.PI/180) , y : this.maxSpeed * Math.sin(this.direction * Math.PI/180)};
};
ProjectileSkill.prototype = Object.create(SkillBase.prototype);
ProjectileSkill.prototype.constructor = ProjectileSkill;

var ProjectileSkillColliderEle = function(objectID, damage, x, y, radius, speed, lifeTime){
  this.id = objectID
  this.type = "ProjectileSkill";
  this.width = radius;
  this.height = radius;
  this.speed = speed;
  this.lifeTime = lifeTime;
  this.damage =5;
  this.x = x;
  this.y = y;
};

// ProjectileSkill.prototype.setSpeed = function(){
//   this.speed.x = this.maxSpeed * Math.cos(this.direction * Math.PI/180);
//   this.speed.y = this.maxSpeed * Math.sin(this.direction * Math.PI/180);
// };
module.exports.ProjectileSkill = ProjectileSkill;

var SelfSkill = function(id, totalCastTime, fireTime, lifeTime){
  SkillBase.call(this, id, totalCastTime, fireTime);
  this.lifeTime = lifeTime;
}
module.exports.SelfSkil = SelfSkill;
