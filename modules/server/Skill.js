var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');

var radianFactor = Math.PI/180;

var Skill = function(userID, type, totalTime, fireTime, range, explosionRadius, lifeTime, radius, maxSpeed){
  this.startTime = Date.now();

  this.userID = userID || null;
  this.type = type || null;
  this.totalTime = totalTime || null;
  this.fireTime = fireTime || null;
  this.range = range || null;
  this.explosionRadius = explosionRadius || null;
  this.lifeTime = lifeTime || null;
  this.radius = radius || null;
  this.maxSpeed = maxSpeed || null;

  this.targetPosition = {};
  this.colliderEle = {
    id : this.userID || 0,
    x : 0,
    y : 0,
    width : this.radius || 0,
    height : this.radius || 0,
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
  destroy : function(){
    if(this.fireTimeout){
      console.log('clearTimeout');
      clearTimeout(this.fireTimeout);
    }
    if(this.totalTimeout){
      clearTimeout(this.totalTimeout);
    }
  },
  makeProjectile : function(){
    var projectile = new ProjectileSkill(this);
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
        break;
      default:
        console.log('Do not need set target position or mistake with set skill type');
        break;
    }
  }
}

module.exports = Skill;

function fireTimeoutHandler(){
  console.log('fireSkill');
  this.onFire();
};
function totalTimeoutHandler(){
  this.onTimeOver();
}


var ProjectileSkill = function(user, skillInstance){
  this.startTime = Date.now();

  this.userID = skillInstance.userID || null;
  this.type = skillInstance.type;
  this.explosionRadius = skillInstance.explosionRadius;
  this.lifeTime = skillInstance.lifeTime;
  this.radius = skillInstance.radius;
  this.position = {x : user.positon.x, y : user.position.y};
  this.maxSpeed = skillInstance.maxSpeed;
  this.speed = {x : this.maxSpeed * Math.cos(this.direction * Math.PI/180) , y : this.maxSpeed * Math.sin(this.direction * Math.PI/180)};

  this.colliderEle = {
    id : this.userID,
    x : this.position.x,
    y : this.position.y,
    width : this.radius,
    height : this.radius,
    explosionRadius : this.explosionRadius
  }
};
ProjectileSkill.prototype = {
  move : function(){
    this.position.x += this.speed.x;
    this.position.y += this.speed.y;

    this.colliderEle.x = this.position.x;
    this.colliderEle.y = this.position.y;
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
}
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
  this.startTime = Date.now();
};


//
// var SkillBase = function(id, totalTime, fireTime){
//   this.objectID = id;
//   this.totalTime = totalTime;
//   this.fireTime = fireTime;
//   // this.ManaCost = cost;
//
//   this.fireTimeout = false;
//   this.totalTimeout = false;
//
//   //fire skill, established at Manager
//   this.onFire = new Function();
//
//   //user state change after skill fire, established at User
//   this.onTimeOver = new Function();
// };
// SkillBase.prototype = {
//   executeSkill : function(){
//     this.fireTimeout = setTimeout(fireTimeoutHandler.bind(this), this.fireTime);
//     this.totalTimeout = setTimeout(totalTimeoutHandler.bind(this), this.totalTime);
//   },
//   destroy : function(){
//     if(this.fireTimeout){
//       console.log('clearTimeout');
//       clearTimeout(this.fireTimeout);
//     }
//     if(this.totalTimeout){
//       clearTimeout(this.totalTimeout);
//     }
//   },
//   // onDestroy : function(){
//   //   this.destroy();
//   // }
// };
//
// function fireTimeoutHandler(){
//   this.onFire();
// };
// function totalTimeoutHandler(){
//   this.onTimeOver();
// };
//
// var BaseAttack = function(id, totalTime, fireTime, range, radius){
//     SkillBase.call(this, id, totalTime, fireTime);
//     this.targetPosition;
//     this.range = range;
//     this.size = {width : radius, height : radius};
//
//     this.colliderEle = {
//       id : this.objectID,
//       type : 'baseAttack',
//       damage : '1',
//       x : 0,
//       y : 0,
//       width : this.size.width,
//       height : this.size.height
//     }
// };
// BaseAttack.prototype = Object.create(SkillBase.prototype);
// BaseAttack.prototype.constructor = BaseAttack;
//
// BaseAttack.prototype.setTargetPosition = function(userPosition, userDirection){
//   var addPosX = this.range * Math.cos(userDirection * Math.PI/180);
//   var addPosY = this.range * Math.sin(userDirection * Math.PI/180);
//
//   this.targetPosition = {
//     x : userPosition.x + addPosX,
//     y : userPosition.y + addPosY
//   }
//   this.colliderEle.x = this.targetPosition.x;
//   this.colliderEle.y = this.targetPosition.y;
// };
// module.exports.BaseAttack = BaseAttack;
//
// var InstantRangeSkill = function(id, totalTime, fireTime, range, radius){
//   SkillBase.call(this, id, totalTime, fireTime);
//   this.targetPosition;
//   this.range = range;
//   this.size = {width : raidus, height : radius};
//
//   this.colliderEle = {
//     id : this.objectID,
//     type : 'InstantRangeSkill',
//     damage : '3',
//     x : 0,
//     y : 0,
//     width : this.size.widht,
//     height : this.size.height
//   }
// };
// InstantRangeSkill.prototype = Object.create(SkillBase.prototype);
// InstantRangeSkill.prototype.constructor = InstantRangeSkill;
//
// InstantRangeSkill.prototype.setTargetDirection = function(userCenterPosition, targetPosition){
//   //check targetPosition is in range
//   var distSqure = util.distanceSquare(userCenterPosition, targetPosition);
//   if(Math.pow(this.range,2) > distSquare){
//     this.targetPosition = {
//       x : targetPosition.x,
//       y : targetPosition.y
//     }
//     this.colliderEle.x = this.targetPosition.x;
//     this.colliderEle.y = this.targetPosition.y;
//   }else{
//     //if targetPosition is out of range then re calculate targetPosition as max range of targetDirection
//     var direction = util.calcTargetDirection(targetPosition, userCenterPosition);
//     var addPos = util.calcTargetPosition(userCenterPosition, direction, this.range);
//
//     this.targetPosition = {
//       x : userCenterPosition.x + addPos.x,
//       y : userCenterPosition.y + addPosY.y
//     }
//     this.colliderEle.x = this.targetPosition.x;
//     this.colliderEle.y = this.targetPosition.y;
//   }
// };
// module.exports.InstantRangeSkill = InstantRangeSkill;
//
// var ProjectileSkill = function(id, totalTime, fireTime, direction, radius, maxSpeed, projectileLifeTime){
//   SkillBase.call(this, id, totalTime, fireTime);
//   this.lifeTime = projectileLifeTime;
//   this.size = {width : radius, height : radius};
//   this.direction = direction;
//   this.maxSpeed = maxSpeed;
//   this.speed = {x : this.maxSpeed * Math.cos(this.direction * Math.PI/180) , y : this.maxSpeed * Math.sin(this.direction * Math.PI/180)};
// };
// ProjectileSkill.prototype = Object.create(SkillBase.prototype);
// ProjectileSkill.prototype.constructor = ProjectileSkill;
//
// module.exports.ProjectileSkill = ProjectileSkill;
//
// var ProjectileSkillColliderEle = function(objectID, damage, x, y, radius, speed, lifeTime){
//   this.id = objectID
//   this.type = "ProjectileSkill";
//   this.width = radius;
//   this.height = radius;
//   this.speed = speed;
//   this.lifeTime = lifeTime;
//   this.damage =5;
//   this.x = x;
//   this.y = y;
//   this.startTime = Date.now();
// };
// ProjectileSkillColliderEle.prototype.move = function(){
//   this.x += this.speed.x;
//   this.y += this.speed.y;
// };
// ProjectileSkillColliderEle.prototype.hit = function(user){
// };
// ProjectileSkillColliderEle.prototype.isExpired = function(){
//   if(this.lifeTime > Date.now() - this.startTime){
//     return false;
//   }else{
//     return true;
//   }
// };
//
// module.exports.ProjectileSkillColliderEle = ProjectileSkillColliderEle;
//
// // ProjectileSkill.prototype.setSpeed = function(){
// //   this.speed.x = this.maxSpeed * Math.cos(this.direction * Math.PI/180);
// //   this.speed.y = this.maxSpeed * Math.sin(this.direction * Math.PI/180);
// // };
//
// var SelfSkill = function(id, totalTime, fireTime, lifeTime){
//   SkillBase.call(this, id, totalTime, fireTime);
//   this.lifeTime = lifeTime;
// }
// module.exports.SelfSkil = SelfSkill;
