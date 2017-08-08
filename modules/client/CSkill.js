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

  this.onExplosion = new Function();
};

ProjectileSkill.prototype = {
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
    this.onExplosion();
    console.log('explode!!!!!!');
  }
};


module.exports = CSkill;
