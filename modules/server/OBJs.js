var GameObject = require('./GameObject.js');

function OBJSkill(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.skillIndex = 11;

  this.collectionEle = {};
};
OBJSkill.prototype = Object.create(GameObject.prototype);
OBJSkill.prototype.constructor = OBJSkill;

OBJSkill.prototype.initOBJSkill = function(position, radius, skillIndex){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.skillIndex = skillIndex;
};
OBJSkill.prototype.setCollectionEle = function(){
  this.collectionEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    skillIndex : this.skillIndex,
  }
};

module.exports.OBJSkill = OBJSkill;

var GameObject = require('./GameObject.js');

function OBJExp(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.exp;

  this.collectionEle = {};
};
OBJExp.prototype = Object.create(GameObject.prototype);
OBJExp.prototype.constructor = OBJExp;

OBJExp.prototype.initOBJExp = function(position, radius, exp){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.exp = exp;
};
OBJExp.prototype.setCollectionEle = function(){
  this.collectionEle = {
    id : this.objectID,
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    exp : this.exp
  };
};

module.exports.OBJExp = OBJExp;

function OBJChest(objectID){
  GameObject.call(this);
  this.objectID = objectID;

  this.HP = 0;

  this.grade = 0;
  this.exps = [];
  this.skills = [];

  this.entityTreeEle = {}
  this.staticEle = {};

  this.onCreateExp = new Function();
  this.onCreateSkill = new Function();
};
OBJChest.prototype.initOBJChest = function(position, radius, chestData){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.HP = chestData.HP;
  this.grade = chestData.grade;
  this.setExps(chestData);
  this.setSkills(chestData);
};
OBJChest.prototype.setExps = function(chestData){
  var expCount = Math.floor(Math.random() * (chestData.maxExpCount - chestData.minExpCount) + chestData.minExpCount + 1);
  for(var i=0; i<expCount; i++){
    var expAmount = Math.floor(Math.random() * (chestData.maxExpAmount - chestData.minExpAmount) + chestData.minExpAmount + 1);
    this.exps.push(expAmount);
  }
};
OBJChest.prototype.setSkills = function(chestData){
  for(var i=0; i<20; i++){
    var totalRate = cheatData[skillDropRate + (i + 1)];
  }
  var skillCount = Math.floor(Math.random() * (chestData.maxSkillCount - chestData.minSkillCount) + chestData.minSkillCount + 1);
  for(var i=0; i<skillCount; i++){
    var randVal = Math.floor(Math.random() * totalRate + 1);
    var sumOfRate = 0;
    for(var i=0; i<20; i++){
      sumOfRate += cheatData[skillDropRate + (i + 1)];
      if(sumOfRate < randVal){
        var skillIndex = cheatData[skillIndex + (i + 1)];
        break;
      }
    }
    this.skills.push(skillIndex);
  }
  console.log(this.skills);
};
OBJChest.prototype.setStaticEle = function(){
  this.staticEle = {

  };
};
OBJChest.prototype.setEntityEle = function(){
  this.entityTreeEle = {

  };
};
