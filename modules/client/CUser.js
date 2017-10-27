var util = require('../public/util.js');
var Skill = require('./CSkill.js');
var resources = require('../public/resources.json');
var gameConfig = require('../public/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

var User = function(userData){
  this.objectID = userData.objectID;

  this.type = userData.type
  this.imgData = userData.imgData;

  this.buffImgDataList = [];

  this.imgHandIndex = 0;

  this.level = userData.level;
  this.exp = userData.exp;

  this.maxHP = userData.maxHP;
  this.maxMP = userData.maxMP;
  this.HP = userData.HP;
  this.MP = userData.MP;
  this.castSpeed = userData.castSpeed;
  this.conditions = userData.conditions;

  this.currentState = null;
  this.currentSkill = undefined;
  //use for execute skill only once.
  this.isExecutedSkill = false;
  //Effect around user skill effect, when cast skill. skill onFire set false.
  this.skillCastEffectPlay = false;
  this.castEffectFactor = 1;

  this.effectTimer = Date.now();
  this.effectRotateDegree = 0;
  this.effectIndex = 0;

  this.size = userData.size;

  this.position = userData.position;
  this.targetPosition = userData.targetPosition;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.timer = Date.now();

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.imgHandTimeout = false;
  this.updateFunction = null;

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };

  this.onMove = new Function();
  this.onMainUserMove = new Function();
};

User.prototype = {
  changeState : function(newState){
    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = this.idle.bind(this);
        break;
      case gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      // case gameConfig.OBJECT_STATE_MOVE_OFFSET:
        // this.updateFunction = this.rotate.bind(this);
        // break;
      case gameConfig.OBJECT_STATE_ATTACK:
        this.updateFunction = this.attack.bind(this);
        break;
      case gameConfig.OBJECT_STATE_CAST:
        this.updateFunction = this.rotate.bind(this);
        break;
      case gameConfig.OBJECT_STATE_DEATH:
        this.updateFunction = this.idle.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  idle : function(){
    this.doEveryTick();
  },
  rotate : function(){
    var deltaTime = (Date.now() - this.timer)/1000;
    util.rotate.call(this, deltaTime);
    this.doEveryTick();
  },
  move : function(deltaTime, isMoveSlight){
    if(isMoveSlight){
      util.move.call(this, deltaTime, isMoveSlight)
    }else{
      util.move.call(this, deltaTime);
    }
    this.onMainUserMove();
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
    this.doEveryTick();
  },
  doEveryTick : function(){
    this.timer = Date.now();
    if(Date.now() - this.effectTimer >= gameConfig.USER_EFFECT_CHANGE_TIME){
      this.effectTimer = Date.now();
      this.effectRotateDegree += 10;
      if(this.effectIndex > 100){
        this.effectIndex = 0;
      }else{
        this.effectIndex += 1;
      }
    }
  },
  updateBuffImgData : function(buffImgDataList){
    this.buffImgDataList = [];
    for(var i=0; i<buffImgDataList.length; i++){
      this.buffImgDataList.push(buffImgDataList[i]);
    }
  },
  addPosAndTargetPos : function(addPosX , addPosY){
    this.position.x += addPosX;
    this.position.y += addPosY;

    this.targetPosition.x += addPosX;
    this.targetPosition.y += addPosY;

    this.setCenter();
  },
  stop : function(){
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
    if(this.currentSkill){
      this.currentSkill.destroy();
      this.currentSkill = undefined;
      this.isExecutedSkill = false;
      this.skillCastEffectPlay = false;
    }
    if(this.imgHandTimeout){
      clearTimeout(this.imgHandTimeout);
      this.imgHandTimeout = false;
    }
    this.imgHandIndex = 0;
  },
  setEntityEle : function(){
    this.entityTreeEle = {
      x : this.position.x,
      y : this.position.y,
      width : this.size.width,
      height : this.size.height,
      id : this.objectID
    };
  },
  makeSkillInstance : function(skillData){
    var userAniTime = Math.floor(gameConfig.USER_ANI_TIME * (100 / this.castSpeed));
    var skillInstance = new Skill(skillData, skillData.fireTime - userAniTime);
    skillInstance.onUserAniStart = onCastSkillHandler.bind(this, skillInstance, userAniTime);
    skillInstance.onTimeOver = onTimeOverHandler.bind(this, skillInstance);
    return skillInstance;
  },
  setSkill : function(skillInstance){
    this.currentSkill = skillInstance;
  },
  executeSkill : function(){
    if(!this.isExecutedSkill){
      this.skillCastEffectPlay = true;
      this.skillCastEffectStartTime = Date.now();
      this.isExecutedSkill = true;
      this.currentSkill.executeSkill();
    }
    this.setCastEffectFactor();
  },
  setCastEffectFactor : function(){
    var timeDiff = Date.now() - this.skillCastEffectStartTime;
    this.castEffectFactor = util.interpolationSine(timeDiff);
  },
  updateSkillPossessions : function(possessSkills){
    this.possessSkills = possessSkills;
    console.log('updateSkillPossessions');
    console.log(this.possessSkills);
  },
  makeProjectile : function(projectileID, skillInstance, direction){
    var projectile = skillInstance.makeProjectile(this.center, projectileID, direction);
    return projectile;
  }
};

function onTimeOverHandler(skillInstance){
  skillInstance.destroy();
  this.currentSkill = undefined;
  this.isExecutedSkill = false;
  this.skillCastEffectPlay = false;
  this.changeState(gameConfig.OBJECT_STATE_IDLE);
};
function onCastSkillHandler(skillInstance, userAniTime){
  var tickTime = userAniTime/5;
  this.imgHandTimeout = setTimeout(imgHandTimeoutHandler.bind(this, tickTime), tickTime);
  console.log('cast ani start');
};
function imgHandTimeoutHandler(tickTime){
  if(this.imgHandIndex < 4){
    this.imgHandIndex++;
    this.imgHandTimeout = setTimeout(imgHandTimeoutHandler.bind(this, tickTime), tickTime);
  }else{
    this.imgHandIndex = 0;
  }
};
module.exports = User;
