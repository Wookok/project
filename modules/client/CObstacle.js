function CObstacle(posX, posY, sizeW, sizeH, id, src){
  this.objectID = id;
  this.src = src;
  this.position = {
    x : posX, y : posY
  };
  // user when draw obstacle
  this.localPosition = {
    x : posX, y : posY
  };
  this.size = {
    width : sizeW, height : sizeH
  };
  this.center = {
    x : this.position.x + this.size.width/2,
    y : this.position.y + this.size.height/2
  }

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

CObstacle.prototype = {
  setPosition : function(x, y){
    this.position.x = x;
    this.position.y = y;
    this.setCenter();
  },
  setSize : function(w, h){
    this.size.width = w;
    this.size.height = h;
  },
  setCenter : function(){
    if(this.size.width == 0 || this.size.height == 0){
      console.log('setSize before setCenter');
    }
    this.center.x = this.position.x + this.size.width/2;
    this.center.y = this.position.y + this.size.height/2;
  },
};
module.exports = CObstacle;
