var GameObject = require('./GameObject.js');

function OBJExp(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.exp;

  this.colliderEle = {};
};
OBJExp.prototype = Object.create(GameObject.prototype);
OBJExp.prototype.constructor = OBJExp;

OBJExp.prototype.initOBJExp = function(position, radius, exp){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.exp = exp;
};
OBJExp.prototype.setColliderEle = function(){
  this.colliderEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    exp : this.exp
  }
};

module.exports = OBJExp;
