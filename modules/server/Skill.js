var SkillBase = function(id, totalTime, fireTime){
  this.objectID = id;
  this.totalTime = totalTime;
  this.fireTime = fireTime;
  // this.ManaCost = cost;

  this.fireTimeout = false;
  this.totalTimeout = false;

  //fire skill, established at Manager
  this.onFire = new Function();

  //user state change after skill fire, established at User
  this.onTimeOver = new Function();
};
SkillBase.prototype = {
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
  // onDestroy : function(){
  //   this.destroy();
  // }
};

function fireTimeoutHandler(){
  this.onFire();
};
function totalTimeoutHandler(){
  this.onTimeOver();
}

var BaseAttack = function(id, totalTime, fireTime, range, radius){
    SkillBase.call(this, id, totalTime, fireTime);
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
  var addPosX = this.range * Math.cos(userDirection);
  var addPosY = this.range * Math.sin(userDirection);

  this.targetPosition = {
    x : userPosition.x + addPosX,
    y : userPosition.y + addPosY
  }
  this.colliderEle.x = this.targetPosition.x;
  this.colliderEle.y = this.targetPosition.y;
};
module.exports.BaseAttack = BaseAttack;
