function GameObject(){
  this.position = {
    x : 0 , y : 0
  };
  this.localPosition = {
    x : 0, y : 0
  }
  this.size = {
    width : 0, height : 0
  }
};

GameObject.prototype.setPosition = function(x, y){
  this.position.x = x;
  this.position.y = y;
  this.localPosition.x = x;
  this.localPosition.y = y;
};

GameObject.prototype.setSize = function(w, h){
  this.size.width = w;
  this.size.height = h;
}

module.exports = GameObject;
