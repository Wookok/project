function CEffect(totalTime, fireTime, userData, targetPosition, radius, direction){
  this.totalTime = totalTime;
  this.fireTime = fireTime;

  this.startTime = Date.now();
  this.timeSpan = 0;

  this.userData = userData;
  this.targetPosition = targetPosition;
  this.direction = direction;
  this.radius = radius;
};

CEffect.prototype = {
};

module.exports = CEffect;
