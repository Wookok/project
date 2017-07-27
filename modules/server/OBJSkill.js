var GameObject = require('./GameObject.js');

function OBJSkill(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.skillIndex;

  this.colliderEle = {};
};
OBJSkill.prototype = Object.create(GameObject.prototype);
OBJSkill.prototype.constructor = OBJSkill;

OBJSkill.prototype.initOBJSkill = function(position, radius, skillIndex){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.skillIndex = skillIndex;
};
OBJSkill.prototype.setColliderEle = function(){
  this.colliderEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    skillIndex : this.skillIndex,
  }
};

module.exports = OBJSkill;
