var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');

function CSkill(skillData, userAniStartTime){
  this.startTime = Date.now();

  this.index = skillData.index;
  this.type = skillData.type;

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
  makeProjectile : function(currentPosition, projectileID, direction){
    var projectile = new ProjectileSkill(this, currentPosition, projectileID, direction)
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
