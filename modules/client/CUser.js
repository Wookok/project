var util = require('../public/util.js');
var Skill = require('./CSkill.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

  this.objectID = userData.objectID;

  this.currentState = null;
  this.currentSkill = undefined;

  //use for execute skill only once.
  this.isExecutedSkill = false;
  //Effect around user skill effect, when cast skill. skill onFire set false.
  this.skillEffectPlay = false;

  this.size = userData.size;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.updateFunction = null;

  this.onMoveOffset = new Function();

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };

  this.onMove = new Function();
};

User.prototype = {
  changeState : function(newState){

    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case this.gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = null;
        break;
      case this.gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_ATTACK:
        this.updateFunction = this.attack.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_CAST:
        this.updateFunction = this.rotate.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  rotate : function(){
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
  },
  setTargetDirection : function(){
    util.setTargetDirection.call(this);
  },
  setSpeed : function(){
    util.setSpeed.call(this);
  },
  moveOffset : function(){
    util.moveOffset.call(this);
  },
  attack : function(){
    this.executeSkill();
  },
  addPosAndTargetPos : function(addPosX , addPosY){
    this.position.x += addPosX;
    this.position.y += addPosY;

    this.targetPosition.x += addPosX;
    this.targetPosition.y += addPosY;

    this.setCenter();
  },
  stop : function(){
    console.log('stop');
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
    if(this.currentSkill){
      this.currentSkill.destroy();
      this.currentSkill = undefined;
      this.isExecutedSkill = false;
      this.skillEffectPlay = false;
    }
  },
  setUserEle : function(){
    this.entityTreeEle = {
      x : this.position.x,
      y : this.position.y,
      width : this.size.width,
      height : this.size.height,
      id : this.objectID
    };
  },
  makeSkillInstance : function(skillData){
    var skillInstance = new Skill(skillData, skillData.fireTime - 100);
    skillInstance.onUserAniStart = onCastSkillHandler.bind(this, skillInstance);
    skillInstance.onTimeOver = onTimeOverHandler.bind(this, skillInstance);
    return skillInstance;
  },
  setSkill : function(skillInstance){
    this.currentSkill = skillInstance;
  },
  executeSkill : function(){
    if(!this.isExecutedSkill){
      this.skillEffectPlay = true;
      this.isExecutedSkill = true;
      this.currentSkill.executeSkill();
    }
  }
};
function onTimeOverHandler(skillInstance){
  skillInstance.destroy();
  this.currentSkill = undefined;
  this.isExecutedSkill = false;
  this.skillEffectPlay = false;
  this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
};
function onCastSkillHandler(skillInstance){
  console.log('cast ani start');
};
// var skillData = {
//   timeSpan : Date.now() - skill.startTime,
//   totalTime : skill.totalTime,
//   fireTime : skill.fireTime,
//   radius : skill.radius,
//   targetPosition : skill.targetPosition
// }
module.exports = User;
