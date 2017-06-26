var LivingEntity = require('./LivingEntity.js');

function User(id){
  LivingEntity.call(this);

  this.socketID = id;
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = LivingEntity;

// User.prototype.initialize = function(){
//   this.assignID("U");
//   this.setPosition(10, 10);
//   this.setSize(64, 64);
//   this.setRotateSpeed(10);
//   this.setMaxSpeed(10);
// };

module.exports = User;
