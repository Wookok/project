var util = require('./util.js');

var User = function(userData){
  this.objectID = userData.objectID;
  this.position = userData.position;
  this.targetPosition = userData.targetPosition;
  this.speed = userData.speed;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;
  this.targetDirection = userData.targetDirection;

  this.moveInterval = false;
  this.rotateInterval = false;
};

User.prototype = {
  rotate : function(){
    if(this.rotateInterval){
      clearInterval(this.rotateInterval);
      this.rotateInterval = false;
    }
    this.rotateInterval = setInterval(util.rotate.bind(this), 1000);
  },
  move : function(){
    if(this.moveInterval){
      clearInterval(this.moveInterval);
      this.moveInterval = false;
    }
    console.log('move' + this.speed.x + ' : ' + this.speed.y);
    this.moveInterval = setInterval(util.move.bind(this), 1000);
  },
  stop : function(){
    if(this.moveInterval){
      clearInterval(this.moveInterval);
      this.moveInterval = false;
    }
    if(this.rotateInterval){
      clearInterval(this.rotateInterval);
      this.rotateInterval = false;
    }
  }
};

module.exports = User;
