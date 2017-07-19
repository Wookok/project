function CSkill(skillData, userAniStartTime){
  this.type = skillData.type;

  this.startTime = Date.now();
  this.timeSpan = skillData.timeSpan;
  this.totalTime = skillData.totalTime;
  this.fireTime = skillData.fireTime;
  this.radius = skillData.radius;
  this.targetPosition = skillData.targetPosition;
  this.direction;
  this.maxSpeed = skillData.maxSpeed;

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
    if(this.fireTimeout){
      console.log('clearTimeout');
      clearTimeout(this.fireTimeout);
    }
    if(this.totalTimeout){
      clearTimeout(this.totalTimeout);
    }
  },
  makeProjectile : function(user){
    var projectile = new ProjectileSkill(user, this);
    return projectile;
  },
  skillAniIsExpired : function(){
    return this.aniTime + this.fireTime > Date.now() - this.startTime
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

var ProjectileSkill = function(user, skillInstance){
  this.startTime = Date.now();

  this.explosionRadius = skillInstance.explosionRadius;
  this.lifeTime = skillInstance.lifeTime;
  this.radius = skillInstance.radius;
  this.position = {x : user.position.x, y : user.position.y};
  this.speed = {x : this.maxSpeed * Math.cos(this.direction * Math.PI/180) , y : this.maxSpeed * Math.sin(this.direction * Math.PI/180)};
};

ProjectileSkill.prototype = {
  move : function(){
    this.position.x += this.speed.x;
    this.position.y += this.speed.y;
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
