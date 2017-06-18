var GameObject = require('./GameObject.js');

function LivingEntity(){
  GameObject.call(this);
  this.targetPosition = {
    x : this.position.x, y : this.position.y
  };
};
LivingEntity.prototype = Object.create(GameObject.prototype);
LivingEntity.prototype.constructor = LivingEntity;



module.exports = LivingEntity;
