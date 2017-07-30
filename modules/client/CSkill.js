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
