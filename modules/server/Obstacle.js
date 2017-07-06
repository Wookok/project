var GameObject = require('./GameObject.js');

function Obstacle(posX, posY, sizeW, sizeH, id){
  GameObject.call(this);

  this.objectID = id;
  this.setSize(sizeW, sizeH);
  this.setPosition(posX, posY);

  this.staticEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};
Obstacle.prototype = Object.create(GameObject.prototype);
Obstacle.prototype.constructor = Obstacle;

module.exports = Obstacle;
