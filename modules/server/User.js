var LivingEntity = require('./LivingEntity.js');

var util = require('../public/util.js');
var csvJson = require('../public/csvjson');

var dataJson = require('../public/data.json');
var userBaseTable = csvJson.toObject(dataJson.userBaseData, {delimiter : ',', quote : '"'});
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});

// var userLevelDataTable = csvJson.toObject(dataJson.userLevelData, {delimiter : ',', quote : '"'});
var gameConfig = require('../public/gameConfig.json');
var serverConfig = require('./serverConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

function User(id, userBaseData, Exp){
  LivingEntity.call(this);
  // base setting;
  this.baseHP = userBaseData.baseHP;
  this.baseMP = userBaseData.baseMP;
  this.baseMaxSpeed = userBaseData.baseMaxSpeed;
  this.baseRotateSpeed = userBaseData.baseRotateSpeed;
  this.baseHPRegen = userBaseData.baseHPRegen;
  this.baseMPRegen = userBaseData.baseMPRegen;
  this.baseCastSpeed = userBaseData.baseCastSpeed;
  this.baseDamage = userBaseData.baseDamage;
  this.baseDamageRate = userBaseData.baseDamageRate;

  this.level = 1;
  this.Exp = Exp;

  this.condition = [];
  this.buffList = [];
  this.debuffList = [];

  //current stat
  this.maxHP;
  this.currentHP;
  this.maxMP;
  this.currentMP;
  // this.maxSpeed;
  // this.rotateSpeed;
  this.HPRegen;
  this.MPRegen;
  this.attackSpeed;
  this.castSpeed;
  this.addDamageAmount;
  this.addDamageRate;

  this.equipSkills = [];
  this.possessSkills = [];

  this.socketID = id;

  this.currentSkill = undefined;

  this.buffUpdateInterval = false;

  this.onDeath = new Function();

  this.getExp(0);
  this.setUserStatToMaxOfBase();
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = User;

//Instantiate base attack
User.prototype.initEquipSkills = function(skillIndexList){
  if(skillIndexList){
    this.equipSkills = skillIndexList;
  }else {
    this.equipSkills = serverConfig.INITSKILLLIST;
  }
};
User.prototype.changeEquipSkills = function(newSkillList){
  var skillList = [];
  //validate skill
  for(var i=0; i<newSkillList.length; i++){
    for(var j=0; j<possessSkills.length; j++){
      if(newSkillList[i] === possessSkills[j]){
        skillList.push(newSkillList[i]);
      }
    }
  }
  this.equipSkills = skillList;
};
User.prototype.getSkill = function(index){
  //check skill possession
  var skillData = util.findData(skillTable, 'index', index);
  var possessSkill = false;
  for(var i=0; i<this.possessSkills.length; i++){
    var tempSkillData = util.findData(skillTable, 'index', this.possessSkills[i]);
    if(skillData.groupIndex === tempSkillData.groupIndex){
      possessSkill = tempSkillData;
      break;
    }
  }
  //check possible levelup
  if(!possessSkill){
    this.possessSkills.push(skillData.index);
    return this.possessSkills;
  }else{
    if(possessSkill.nextSkillIndex !== -1){
      var changeSkillIndex = this.possessSkills.indexOf(possessSkill.index);
      if(changeSkillIndex === -1){
        console.log('cant find skill index at possess skill array');
        return this.possessSkills;
      }else{
        this.possessSkills[changeSkillIndex] = possessSkill.nextSkillIndex;
        console.log('level up skill' + possessSkill.index);
        console.log('currentPossessSkills');
        console.log(this.possessSkills);
        return this.possessSkills;
      }
    }else{
      //do nothing
      console.log('skill reach max level');
    }
  }
};
User.prototype.stop = function(){
  if(this.updateInterval){
    clearInterval(this.updateInterval);
    this.updateInterval = false;
  }
  if(this.currentSkill){
    this.currentSkill = undefined;
  }
};
User.prototype.takeDamage = function(attackUserID, dmg){
  this.currentHP -= dmg;
  console.log(this.objectID + ' : ' + this.currentHP);
  if(this.currentHP <= 0){
    this.death(attackUserID);
  }
};
User.prototype.death = function(attackUserID){
  //calculate exp to attacker
  console.log(this.objectID + ' is dead by ' + attackUserID);
  var exp = this.level *  10000;
  this.onDeath(attackUserID, exp, this);
};
User.prototype.buffUpdate = function(){
  if(!this.buffUpdateInterval){
    this.buffUpdateInterval = setInterval(buffUpdateHandler.bind(this), INTERVAL_TIMER);
  }
};
function buffUpdateHandler(){
  this.updateUserStat();
};
User.prototype.addBuff = function(buff){

};
User.prototype.addBuffs = function(buffs){
  for(var i=0; i<buffs.length; i++){

  }
};
User.prototype.addDebuff = function(debuff){

};
User.prototype.addDebuffs = function(debuffs){
  for(var i=0; i<debuffs.length; i++){

  }
};
User.prototype.getExp = function(exp){
  this.Exp += exp;
  var userLevelData = util.findData(userBaseTable, 'level', this.level);
  if(userLevelData.needExp === -1){
    console.log('user reach max level');
  }else if(this.Exp >= userLevelData.needExp){
    this.levelUp();
  }
};
User.prototype.levelUp = function(){
  this.level ++;
  var userLevelData = util.findData(userBaseTable, 'level', this.level);
  console.log('level up to ' + this.level);
  //add levelBonus
  //additional level up check.
  this.updateUserBaseStat();
  this.getExp(0);
};

//execute when level up or down
User.prototype.updateUserBaseStat = function(){
  var userLevelData = util.findData(userBaseTable, 'level', this.level);

  this.baseHP = userLevelData.baseHP;
  this.baseMP = userLevelData.baseMP;
  this.baseHPRegen = userLevelData.baseHPRegen;
  this.baseMPRegen = userLevelData.baseMPRegen;
  this.baseMaxSpeed = userLevelData.baseMaxSpeed;
  this.baseRotateSpeed = userLevelData.baseRotateSpeed;
  this.baseCastSpeed = userLevelData.baseCastSpeed;
  this.baseDamage = userLevelData.baseDamage;
  this.baseDamageRate = userLevelData.baseDamageRate;

  this.setUserStatToMaxOfBase();
};
User.prototype.setUserStatToMaxOfBase = function(){
  this.currentHp    = this.maxHP            ;
  this.currentMP    = this.maxMP            ;
  this.HPRegen      = this.baseHPRegen      ;
  this.MPRegen      = this.baseMPRegen      ;
  this.maxHP        = this.baseHP           ;
  this.maxMP        = this.baseMP           ;
  this.maxSpeed     = this.baseMaxSpeed     ;
  this.rotateSpeed  = this.baseRotateSpeed  ;
  this.castSpeed    = this.baseCastSpeed    ;
  this.addDamageAmount = this.baseDamage    ;
  this.addDamageRate = this.baseDamageRate  ;
};
//execute every frame?
User.prototype.updateUserStat = function(){

  this.condition = [];

  var addStat = {
    additionalHP                  : 0,
    additionalMP                  : 0,
    additionalHPRegenAmount       : 0,
    additionalHPRegenRate         : 1,
    additionalMaxHpAmount         : 0,
    additionalMaxHpRate           : 1,
    additionalMaxMPAmount         : 0,
    additionalMaxMpRate           : 1,
    additionalMPRegenAmount       : 0,
    additionalMPRegenRate         : 1,
    additionalMoveSpeedAmount     : 0,
    additionalMoveSpeedRate       : 1,
    additionalRotateSpeedAmount   : 0,
    additionalRotateSpeedRate     : 1,
    additionalCastSpeedAmount     : 0,
    additionalCastSpeedRate       : 1,
    additionalDamageAmount        : 0,
    additionalDamageRate          : 1
  }

  for(var i=0; i<this.buffList.length; i++){
    if(this.buffList[i].buffTickTime){
      //case tick damage or heal
      if(!this.buffList[i].startTickTime){
        this.buffList[i].startTickTime = Date.now();
      }else{
        var timeSpan = Date.now() - this.buffList[i].startTickTime;
        if(timeSpan >= this.buffList[i].buffTickTime){
          //apply buff
          applyBuff(this.buffList, i, this.condition, addStat, true);
          //reset startTickTime
          this.buffList[i].startTickTime = Date.now();
        }
      }
    }else{
      applyBuff(this.buffList, i, this.condition, addStat, true);
      //apply buff
    }
  }
  for(var i=0; i<this.debuffList.length; i++){
    if(this.debuffList[i].buffTickTime){
      if(!this.debuffList[i].startTickTime){
        this.debuffList[i].startTickTime = Date.now();
      }else{
        var timeSpan = Date.now() = this.debuffList[i].startTickTime;
        if(timeSpan >= this.debuffList[i].buffTickTime){
          //apply debuff
          applyBuff(this.debuffList, i, this.condition, addStat, false);
          //reset startTickTime
          this.debuffList[i].startTickTime = Date.now();
        }
      }
    }else{
      //apply buff
      applyBuff(this.debuffList, i, this.condition, addStat, false);
    }
  }

  this.HPRegen = (this.baseHPRegen * addStat.additionalHPRegenRate) + addStat.additionalHPRegenAmount;
  this.MPRegen = (this.baseMPRegen * addStat.additionalMPRegenRate) + addStat.additionalMPRegenAmount;
  this.maxHP = (this.baseHP * addStat.additionalMaxHpRate) + addStat.additionalMaxHpAmount;
  this.maxMP = (this.baseMP * addStat.additionalMaxMpRate) + addStat.additionalMaxMPAmount;
  this.castSpeed = (this.baseCastSpeed * addStat.additionalCastSpeedRate) + addStat.additionalCastSpeedAmount;
  this.maxSpeed = (this.baseMaxSpeed * addStat.additionalMoveSpeedRate) + addStat.additionalMoveSpeedAmount;
  this.rotateSpeed = (this.baseRotateSpeed * addStat.additionalRotateSpeedRate) + addStat.additionalRotateSpeedAmount;
  this.addDamageAmount = addStat.additionalDamageAmount;
  this.addDamageRate = addStat.additionalDamageRate;

  this.currentHP += addStat.additionalHP;
  this.currentMP += addStat.additionalMP;
  this.currentHP += this.HPRegen;
  this.currentMP += this.MPRegen;

  if(this.currentHP <= 0){

  }else if(this.currentHP >= this.maxHP){
    this.currentHP = this.maxHP;
  }
  if(this.currentMP <= 0){

  }else if(this.currentMP >= this.maxMP){
    this.currentMP = this.maxMP;
  }
};
function applyBuff(buffList, index, condition, addStat, isBuff){
  switch (buffList[index].buffType) {
    case '':
      //special effect apply
      //user condition exchange
      break;
    default:
      //stat apply. table column name and variable name must same
      if(isBuff){
        addStat[buffList[index].buffType] += buffList[index].buffAmount;
      }else{
        addStat[buffList[index].buffType] -= buffList[index].buffAmount;
      }
      break;
  }
};
module.exports = User;
