var Projectile = function(){
  this.objectID = ;
  this.userID = ;

  this.position = {};
  this.size = {};
  this.speed = {};
  this.damage = ;
  this.buffsToTarget = [];
  this.debuffsToTarget = [];

  this.timer = Date.now();

  this.startTime = ;
  this.lifeTime = ;

  this.colliderEle = {
    id : ,
    objectID : ,
    x : ,
    y : , 
    width : ,
    height : ,

  }
};
Projectile.prototype = {
  move : function(){

  },
  isExpired : function(){

  },
  explode : function(){

  }
}


module.exports.Projectile = Projectile
