var gameConfig = require('../public/gameConfig.json');
var serverConfig = require('./serverConfig.json');

var SkillCollider = function(user, skillData){
  this.id = user.objectID;
  this.x = skillData.targetPosition.x;
  this.y = skillData.targetPosition.y;
  this.width = skillData.explosionRadius * 2;
  this.height = skillData.explosionRadius * 2;

  this.type = skillData.type;

  this.fireDamage = 0;
  this.frostDamage = 0;
  this.arcaneDamage = 0;
  this.damageToMP = 0;
  setDamage.call(this, user, skillData);

  this.buffsToTarget = skillData.buffsToTarget;

  this.latency = user.latency;
};

var ProjectileCollider = function(user, projectileData){
  this.id = userID;
  this.objectID = projectileData.objectID;
  this.x = projectileData.position.x;
  this.y = projectileData.position.y;
  this.width = projectileData.radius * 2;
  this.height = projectileData.radius * 2;

  this.type = projectileData.type;

  this.fireDamage = 0;
  this.frostDamage = 0;
  this.arcaneDamage = 0;
  this.damageToMP = 0;
  setDamage.call(this, user, projectileData);

  this.buffsToTarget = projectileData.buffsToTarget;

  this.startTime = projectileData.startTime;
  this.lifeTime = projectileData.lifeTime;
  this.tickTime = projectileData.tickTime;
  this.explosionRadius = projectileData.explosionRadius;

  // this.isExplosive = true;
  this.isCollide = false;

  this.timer = Date.now();
  this.tickStartTime = Date.now();

  this.latency = user.latency;
};

ProjectileCollider.prototype = {
  move : function(){
    var deltaTime = (Date.now() - this.timer)/1000;
    this.x += projectileData.speed.x * deltaTime;
    this.y += projectileData.speed.y * deltaTime;
    this.timer = Date.now();
    if(this.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK){
      if(this.tickStartTime > this.tickTime){
        this.isCollide = false;
        this.tickStartTime = Date.now();
      }
    }
  },
  isExpired : function(){
    if(Date.now() - this.startTime > this.lifeTime){
      return true;
    }
    return false;
  },
  explode : function(){
    this.width = this.explosionRadius * 2;
    this.height = this.explosionRadius * 2;
    this.isCollide = true;
    console.log('projectile is explode');
  }
}

function setDamage(user, skillData){
  if(skillData.property === gameConfig.SKILL_PROPERTY_FIRE){
    this.fireDamage = (skillData.fireDamage + user.fireDamage) * user.fireDamageRate/100;
  }else if(skillData.property === gameConfig.SKILL_PROPERTY_FROST){
    this.frostDamage = (skillData.frostDamage + user.frostDamage) * user.frostDamageRate/100;
  }else if(skillData.property === gameConfig.SKILL_PROPERTY_ARCANE){
    this.arcaneDamage = (skillData.arcaneDamage + user.arcaneDamage) * user.arcaneDamageRate/100;
    if(skillData.doDamageToMP){
      this.damageToMP = this.arcaneDamage * skillData.damageToMPRate/100;
    }
  }else{
    console.log('check skill property');
  }
};

module.exports.SkillCollider = SkillCollider;
module.exports.ProjectileCollider = ProjectileCollider;
