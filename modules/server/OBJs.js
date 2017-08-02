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

function OBJChest(objectID, locationID){
  GameObject.call(this);
  this.objectID = objectID;
  this.locationID = locationID;

  this.HP = 0;
  this.currentHP = 0;

  this.grade = 0;
  this.exps = [];
  this.skills = [];

  this.entityTreeEle = {}

  this.onDestroy = new Function();
  this.onCreateExp = new Function();
  this.onCreateSkill = new Function();
};
OBJChest.prototype = Object.create(GameObject.prototype);
OBJChest.prototype.constructor = OBJChest;

OBJChest.prototype.takeDamage = function(attackUser, damage){
  console.log(this.objectID + ' is hit by ' + attackUser);
  this.currentHP -= damage;
  console.log(this.currentHP);
  this.onDestroy(this);
  if(this.currentHP <= 0){
    this.destroy();
  }
};
OBJChest.prototype.destroy = function(){
  this.onDestroy(this);
};
OBJChest.prototype.initOBJChest = function(position, radius, chestData){
  this.setSize(radius * 2, radius * 2);
  this.setPosition(position.x, position.y);
  this.HP = chestData.HP;
  this.currentHP = this.HP;
  this.grade = chestData.grade;
  this.setExps(chestData);
  this.setSkills(chestData);
};
OBJChest.prototype.setExps = function(chestData){
  var expCount = Math.floor(Math.random() * (chestData.maxExpCount - chestData.minExpCount + 1) + chestData.minExpCount);
  for(var i=0; i<expCount; i++){
    var expAmount = Math.floor(Math.random() * (chestData.maxExpAmount - chestData.minExpAmount + 1) + chestData.minExpAmount);
    this.exps.push(expAmount);
  }
  console.log(this.exps);
};
OBJChest.prototype.setSkills = function(chestData){
  var totalRate = 0;
  for(var i=0; i<20; i++){
    totalRate += chestData['SkillDropRate' + (i + 1)];
  }
  var skillCount = Math.floor(Math.random() * (chestData.maxSkillCount - chestData.minSkillCount + 1) + chestData.minSkillCount);
  for(var i=0; i<skillCount; i++){
    var randVal = Math.floor(Math.random() * totalRate);
    var sumOfRate = 0;
    for(var i=0; i<20; i++){
      sumOfRate += chestData['SkillDropRate' + (i + 1)];
      if(sumOfRate > randVal){
        var skillIndex = chestData['SkillIndex' + (i + 1)];
        break;
      }
    }
    this.skills.push(skillIndex);
  }
  console.log(this.skills);
};
OBJChest.prototype.setEntityEle = function(){
  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };
};
module.exports.OBJChest = OBJChest;
