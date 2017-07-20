var GameObject = require('./GameObject.js');
var util = require('../public/util.js');
var Skill = require('./Skill.js');

var gameConfig = require('../public/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

function LivingEntity(){
  GameObject.call(this);
  this.objectID = null;


  this.currentState = gameConfig.OBJECT_STATE_IDLE;
  this.currentSkill = undefined;
  this.isExecutedSkill = false;

  this.speed = {x: 0, y:0};
  this.direction = 0;

  this.targetPosition = {
    x : this.position.x, y : this.position.y
  };
  this.targetDirection = 0;

  this.updateInterval = false;
  this.updateFunction = new Function();

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
  this.onMove = new Function();
};
LivingEntity.prototype = Object.create(GameObject.prototype);
LivingEntity.prototype.constructor = LivingEntity;

//state changer. change update listener
LivingEntity.prototype.changeState = function(newState){
  this.currentState = newState;

  this.stop();
  switch(this.currentState){
    case gameConfig.OBJECT_STATE_IDLE :
      this.updateFunction = this.idle;
      break;
    case gameConfig.OBJECT_STATE_MOVE :
      this.updateFunction = this.rotate.bind(this);
      break;
    case gameConfig.OBJECT_STATE_ATTACK :
      this.updateFunction = this.attack.bind(this);
      break;
    case gameConfig.OBJECT_STATE_CAST :
      this.updateFunction = this.rotate.bind(this);
      break;
    }
  this.update();
};
LivingEntity.prototype.update = function(){
  this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
};

//Instantiate base attack
LivingEntity.prototype.makeSkillInstance = function(skillData, clickPosition){
  var skillInstance = new Skill(this.objectID, skillData);
  skillInstance.setDirection(this.center, this.direction, clickPosition);
  skillInstance.setTargetPosition(this.center, this.direction, clickPosition);
  skillInstance.onTimeOver = onTimeOverHandler.bind(this, skillInstance);
  return skillInstance;
};
function onTimeOverHandler(skillInstance){
  skillInstance.destroy();
  this.currentSkill = undefined;
  this.isExecutedSkill = false;
  this.changeState(gameConfig.OBJECT_STATE_IDLE);
};
LivingEntity.prototype.setSkill = function(skillInstance){
  this.currentSkill = skillInstance;
};
//excute skill
LivingEntity.prototype.executeSkill = function(){
  if(!this.isExecutedSkill){
    this.isExecutedSkill = true;
    this.currentSkill.executeSkill();
  }
};

//rotate before move or fire skill etc..
LivingEntity.prototype.rotate = function(){
  util.rotate.call(this);
};
//move after rotate
LivingEntity.prototype.move = function(){
  util.move.call(this);
};
LivingEntity.prototype.idle = function(){
  //do nothing or send current stat to client;
};
LivingEntity.prototype.attack = function(){
  if(!this.isExecutedSkill && this.currentSkill !== undefined){
    this.isExecutedSkill = true;
    this.currentSkill.executeSkill();
  }
};
//interval clear
LivingEntity.prototype.stop = function(){
  if(this.updateInterval){
    clearInterval(this.updateInterval);
    this.updateInterval = false;
  }
  if(this.currentSkill){
    this.currentSkill.destroy();
    this.currentSkill = undefined;
    this.isExecutedSkill = false;
  }
};

// setup when click canvas for move
LivingEntity.prototype.setTargetPosition = function(newPosition){
  if(newPosition.x <= 0){
    this.targetPosition.x = 0;
  }else if(newPosition.x >= gameConfig.CANVAS_MAX_SIZE.width - this.size.width){
    this.targetPosition.x = gameConfig.CANVAS_MAX_SIZE.width - this.size.width;
  }else{
    this.targetPosition.x = newPosition.x;
  }

  if(newPosition.y <=0){
    this.targetPosition.y = 0;
  }else if(newPosition.y >= gameConfig.CANVAS_MAX_SIZE.height - this.size.height){
    this.targetPosition.y = gameConfig.CANVAS_MAX_SIZE.height - this.size.height;
  }else{
    this.targetPosition.y = newPosition.y;
  }
};
LivingEntity.prototype.setSpeed = function(){
  util.setSpeed.call(this);
};
LivingEntity.prototype.setTargetDirection = function(){
  util.setTargetDirection.call(this);
};

// initialize method
LivingEntity.prototype.setRotateSpeed = function(x){
  this.rotateSpeed = x;
};
LivingEntity.prototype.setMaxSpeed = function(x){
  this.maxSpeed = x;
};
LivingEntity.prototype.assignID = function(x){
  this.objectID = x;
};

// initialize and update for entityTreeEle
LivingEntity.prototype.setEntityEle = function(){
  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};

module.exports = LivingEntity;
