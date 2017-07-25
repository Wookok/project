var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');

var radianFactor = Math.PI/180;

var Skill = function(user, skillData, castSpeed, damage){
  this.startTime = Date.now();

  this.userID = user.objectID;
  this.index = skillData.index;
  this.type = skillData.type;
  this.name = skillData.name;
  this.totalTime = skillData.totalTime/user.castSpeed;
  this.fireTime = skillData.fireTime/user.castSpeed;
  this.range = skillData.range;
  this.explosionRadius = skillData.explosionRadius;
  this.damage = (skillData.damage * user.addDamageRate) + user.addDamageAmount;

  this.radius = skillData.radius;
  this.maxSpeed = skillData.maxSpeed;
  this.lifeTime = skillData.lifeTime;
  //direction when fired
  this.direction;

  this.buffsToSelf = skillData.buffsToSelf;
  this.buffsToTarget = skillData.buffsToTarget;
  this.debuffsToSelf = skillData.debuffsToSelf;
  this.debuffsToTarget = skillData.debuffsToTarget;

  this.targetPosition = {};
  this.colliderEle = {
    id : this.userID,
    x : 0,
    y : 0,
    width : this.explosionRadius * 2,
    height : this.explosionRadius * 2,
    damage : this.damage,
    buffsToTarget : this.buffsToTarget,
    debuffsToTarget : this.debuffsToTarget
  };
  this.fireTimeout = false;
  this.totalTimeout = false;
  //fire skill, established at Manager
  this.onFire = new Function();
  //user state change after skill fire, established at User
  this.onTimeOver = new Function();
}
Skill.prototype = {
  executeSkill : function(){
    this.fireTimeout = setTimeout(fireTimeoutHandler.bind(this), this.fireTime);
    this.totalTimeout = setTimeout(totalTimeoutHandler.bind(this), this.totalTime);
  },
  applyBuff : function(user, keyName, userBuffArrayName){
    var userBuffList = user[userBuffArrayName];
    for(var i=0; i<this[keyName].length; i++){
      var thisBuff = this[keyName][i];
      if(thisBuff.isPermanent){
        userBuffList.push(thisBuff);
      }else{
        var buffTimeout = setTimeout(function(){
          var index = thisBuffList.indexOf(thisBuff);
          if(index !== -1){
            userBuffList.splice(index, 1);
          }
        },this.buffsToSelf[i].timeDuration);
        thisBuff.buffTimeout = buffTimeout;
        userBuffList.push(thisBuff);
      }
    }
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
  makeProjectile : function(user, randomID){
    var projectile = new ProjectileSkill(user, this, randomID);
    return projectile;
  },
  setDirection : function(userCenterPosition, userDirection, clickPosition){
    if(userCenterPosition === clickPosition){
      this.direction = userDirection;
    }else{
      this.direction = util.calcTargetDirection(clickPosition, userCenterPosition);
    }
  },
  setTargetPosition : function(userCenterPosition, userDirection, clickPosition){
    switch (this.type) {
      case gameConfig.SKILL_TYPE_BASIC :
        var addPosX = this.range * Math.cos(userDirection * radianFactor);
        var addPosY = this.range * Math.sin(userDirection * radianFactor);

        this.targetPosition = {
          x : userCenterPosition.x + addPosX,
          y : userCenterPosition.y + addPosY
        }
        this.colliderEle.x = this.targetPosition.x;
        this.colliderEle.y = this.targetPosition.y;
        break;
      case gameConfig.SKILL_TYPE_INSTANT :
        var distSquare = util.distanceSquare(userCenterPosition, clickPosition);
        if(Math.pow(this.range,2) > distSquare){
          this.targetPosition = {
            x : clickPosition.x,
            y : clickPosition.y
          };
          this.colliderEle.x = this.targetPosition.x;
          this.colliderEle.y = this.targetPosition.y;
        }else{
          //if targetPosition is out of range then re calculate targetPosition as max range of targetDirection
          // var direction = util.calcTargetDirection(clickPosition, userCenterPosition);
          var addPos = util.calcTargetPosition(userCenterPosition, this.direction, this.range);

          this.targetPosition = {
            x : userCenterPosition.x + addPos.x,
            y : userCenterPosition.y + addPos.y
          };
          this.colliderEle.x = this.targetPosition.x;
          this.colliderEle.y = this.targetPosition.y;
        }
        break;
      default:
        //useless but for error prevent
        this.targetPosition = {
          x : clickPosition.x,
          y : clickPosition.y
        };
        break;
    }
  }
};

module.exports = Skill;

function fireTimeoutHandler(){
  console.log('fireSkill');
  this.onFire();
};
function totalTimeoutHandler(){
  this.onTimeOver();
};

var ProjectileSkill = function(user, skillInstance, randomID){
  this.startTime = Date.now();

  this.index = skillInstance.index;
  this.userID = skillInstance.userID;
  this.objectID = randomID;
  this.damage = skillInstance.damage;
  this.buffsToTarget = skillInstance.buffsToTarget;
  this.debuffsToTarget = skillInstance.debuffsToTarget;

  this.explosionRadius = skillInstance.explosionRadius;

  this.radius = skillInstance.radius;
  this.lifeTime = skillInstance.lifeTime;

  this.direction = skillInstance.direction;
  this.position = {x : user.position.x, y : user.position.y};
  this.speed = {
    x : skillInstance.maxSpeed * Math.cos(this.direction * Math.PI/180),
    y : skillInstance.maxSpeed * Math.sin(this.direction * Math.PI/180)
  };

  this.colliderEle = {
    id : this.userID,
    x : this.position.x,
    y : this.position.y,
    width : this.radius * 2,
    height : this.radius * 2,

    objectID : this.objectID,
    damage : this.damage,
    buffsToTarget : this.buffsToTarget,
    debuffsToTarget : this.debuffsToTarget,

    isCollide : false
  }
  //inform client to explode
  this.onExplosion = new Function();
};

ProjectileSkill.prototype = {
  explode : function(){
    this.colliderEle.width = this.explosionRadius * 2;
    this.colliderEle.height = this.explosionRadius * 2;
    this.colliderEle.isCollide = true;
    this.speed.x = 0;
    this.speed.y = 0;
    this.onExplosion(this);
  },
  move : function(){
    this.position.x += this.speed.x;
    this.position.y += this.speed.y;

    this.colliderEle.x = this.position.x;
    this.colliderEle.y = this.position.y;
  },
  isExpired : function(){
    if(this.lifeTime > Date.now() - this.startTime){
      return false;
    }else{
      this.explode();
      return true;
    }
  }
}
