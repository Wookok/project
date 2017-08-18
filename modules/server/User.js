var LivingEntity = require('./LivingEntity.js');

var util = require('../public/util.js');
var csvJson = require('../public/csvjson');

var dataJson = require('../public/data.json');
var userStatTable = csvJson.toObject(dataJson.userStatData, {delimiter : ',', quote : '"'});
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});

// var userLevelDataTable = csvJson.toObject(dataJson.userLevelData, {delimiter : ',', quote : '"'});
var gameConfig = require('../public/gameConfig.json');
var serverConfig = require('./serverConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

function User(id, userStat, userBase, Exp){
  LivingEntity.call(this);
  // base setting;
  this.type = userStat.type;

  this.baseMight = userStat.might;
  this.baseIntellect = userStat.intellect;
  this.basePerception = userStat.perception;

  this.Might = 0;
  this.Intellect = 0;
  this.Perception = 0;

  this.baseHP = userBase.baseHP;
  this.baseMP = userBase.baseMP;
  this.baseHPRegen = userBase.baseHPRegen;
  this.baseMPRegen = userBase.baseMPRegen;
  this.baseHPRegenRate = userBase.baseHPRegenRate;
  this.baseMPRegenRate = userBase.baseMPRegenRate;
  this.baseMoveSpeed = userBase.baseMoveSpeed;
  this.baseRotateSpeed = userBase.baseRotateSpeed;
  this.baseCastSpeed = userBase.baseCastSpeed;
  this.baseDamage = userBase.baseDamage;
  this.baseFireDamage = userBase.baseFireDamage;
  this.baseFrostDamage = userBase.baseFrostDamage;
  this.baseArcaneDamage = userBase.baseArcaneDamage;
  this.baseDamageRate = userBase.baseDamageRate;
  this.baseFireDamageRate = userBase.baseFireDamageRate;
  this.baseFrostDamageRate = userBase.baseFrostDamageRate;
  this.baseArcaneDamageRate = userBase.baseArcaneDamageRate;
  this.baseResistAll = userBase.baseResistAll;
  this.baseResistFire = userBase.baseResistFire;
  this.baseResistFrost = userBase.baseResistFrost;
  this.baseResistArcane = userBase.baseResistArcane;
  this.baseReductionAll = userBase.baseReductionAll;
  this.baseReductionFire = userBase.baseReductionFire;
  this.baseReductionFrost = userBase.baseReductionFrost;
  this.baseReductionArcane = userBase.baseReductionArcane;

  this.level = 1;
  this.Exp = Exp;

  this.condition = [];
  this.buffList = [];
  this.debuffList = [];

  //current stat
  this.MaxHP = 0;  this.MaxMP = 0;  this.HP = 0;  this.MP = 0;  this.HPRegen = 0;
  this.MoveSpeed = 0; this.RotateSpeed = 0;
  this.MPRegen = 0;  this.MoveSpeed = 0;  this.RotateSpeed = 0;  this.CastSpeed = 0;
  this.Damage = 0;  this.FireDamage = 0;  this.FrostDamage = 0;  this.ArcaneDamage = 0;
  this.ResistAll = 0;  this.ResistFire = 0;  this.ResistFrost = 0;  this.ResistArcane = 0;
  this.ReductionAll = 0;  this.ReductionFire = 0;  this.ReductionFrost = 0;  this.ReductionArcane = 0;

  this.equipSkills = [];
  this.possessSkills = [];

  this.socketID = id;

  this.currentSkill = undefined;

  this.buffUpdateInterval = false;
  this.regenInterval = false;

  this.onDeath = new Function();

  this.getExp(0);
  this.setUserStatToMaxOfBase();
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = User;

//init user current stat
User.prototype.initStat = function(){
  this.Might = this.baseMight;
  this.Intellect = this.baseIntellect;
  this.Perception = this.basePerception;

  this.MaxHP = this.baseHP + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP * this.Might;
  this.MaxMP = this.baseMP + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP * this.Intellect;
  this.HPRegen = this.baseHPRegen + this.MaxHP * this.baseHPRegenRate/100 + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP_REGEN * this.Might;
  this.MPRegen = this.baseMPRegen + this.MaxMP * this.baseMPRegenRate/100 + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP_REGEN * this.Intellect;
  this.CastSpeed = this.baseCastSpeed;
  this.Damage = this.baseDamage + this.baseDamageRate/100;
  this.FireDamage = this.baseFireDamage + this.baseFireDamageRate/100;
  this.FrostDamage = this.baseFrostDamage + this.baseFrostDamageRate/100;
  this.ArcaneDamage = this.baseArcaneDamage + this.baseArcaneDamageRate/100;
  this.ResistAll = this.baseResistAll;
  this.ResistFire = this.baseResistFire;
  this.ResistFrost = this.baseResistFrost;
  this.ResistArcane = this.baseResistArcane;
  this.ReductionAll = this.baseReductionAll;
  this.ReductionFire = this.baseReductionFire;
  this.ReductionFrost = this.baseReductionFrost;
  this.ReductionArcane = this.baseReductionArcane;

  this.HP = this.maxHP;
  this.MP = this.maxMP;

  this.MoveSpeed = this.baseMoveSpeed;
  this.RotateSpeed = this.baseRotateSpeed;

  this.setMaxSpeed(this.MoveSpeed);
  this.setRotateSpeed(this.RotateSpeed);
};
User.prototype.updateStatAndCondition = function(){
  var additionalMight = 0, additionalIntellect = 0, additionalPerception = 0,
      additionalMaxHP = 0, additionalMaxMp = 0, additionalMaxHPRate = 100, additionalMaxMpRate = 100,
      additionalHPRegen = 0, additionalHPRegenRate = 0, additionalMPRegen = 0, additionalMPregenRate = 0,
      additionalMovespeedRate = 100, additionalRotateSpeedRate = 100, additionalCastSpeedRate = 100,
      additionalDamage = 0, additionalFireDamage = 0, additionalFrostDamage = 0, additionalArcaneDamage = 0,
      additionalDamageRate = 100, additionalFireDamageRate = 100, additionalFrostDamageRate = 100, additionalArcaneDamageRate = 100,
      additionalResistAll = 0, additionalResistFire = 0, additionalResistFrost = 0, additionalResistArcane = 0,
      additionalReductionAll = 0, additionalReductionFire = 0, additionalReductionFrost = 0, additionalReductionArcane = 0;

  var additionalHP = 0; additionalMP = 0;

  var buffIndex = this.buffList.length;
  if(buffIndex > 0){
    while(buffIndex--){
      if(Date.now() - this.buffList[buffIndex].startTime > this.buffList[buffIndex].buffLifeTime){
        this.buffList.splice(buffIndex, 1);
      }else if(Date.now() - this.buffList[buffIndex].tickStartTime > this.buffList[buffIndex].buffTickTime){
        switch (this.buffList.buffType) {
          case expression:

            break;
          default:

        }
        this.buffList[buffIndex].tickStartTime = Date.now();
      }
    }
  }
  var debuffIndex = this.debuffList.length;
  if(debuffIndex < 0){
    while(debuffIndex--){
      if(Date.now() - this.debuffList[debuffIndex].startTime > this.debuffList[debuffIndex].buffLifeTime){
        this.debuffList.splice(debuffIndex, 1);
      }else if(Date.now() - this.debuffList[debuffIndex].tickStartTime > this.debuffList[debuffIndex].buffTickTime){

        this.debuffList[debuffIndex].tickStartTime = Date.now();
      }
    }
  }

  additionalMight = 0, additionalIntellect = 0, additionalPerception = 0,
  additionalMaxHP = 0, additionalMaxMp = 0, additionalMaxHPRate = 100, additionalMaxMpRate = 100,
  additionalHPRegen = 0, additionalHPRegenRate = 0, additionalMPRegen = 0, additionalMPregenRate = 0,
  additionalMovespeedRate = 0, additionalRotateSpeedRate = 0, additionalCastSpeedRate = 0,
  additionalDamage = 0, additionalFireDamage = 0, additionalFrostDamage = 0, additionalArcaneDamage = 0,
  additionalDamageRate = 0, additionalFireDamageRate = 0, additionalFrostDamageRate = 0, additionalArcaneDamageRate = 0,
  additionalResistAll = 0, additionalResistFire = 0, additionalResistFrost = 0, additionalResistArcane = 0,
  additionalReductionAll = 0, additionalReductionFire = 0, additionalReductionFrost = 0, additionalReductionArcane = 0;

  additionalHP = 0; additionalMP = 0;

  this.Might = this.baseMight + additionalMight;
  this.Intellect = this.baseIntellect + additionalIntellect;
  this.Perception = this.basePerception + additionalPerception;

  this.MaxHP = (this.baseHP + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP * this.Might + additionalMaxHP) * additionalMaxHPRate/100;
  this.MaxMP = (this.baseMP + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP * this.Intellect + additionalMaxMp) * additionalMaxMPRate/100;
  var HPRegenRate = this.baseHPRegenRate + additionalHPRegenRate;
  var MPRegenRate = this.baseMPRegenRate + additionalMPRegenRate;
  this.HPRegen = this.baseHPRegen + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP_REGEN * this.Might + additionalHPRegen + this.MaxHP * HPRegenRate/100;
  this.MPRegen = this.baseMPRegen + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP_REGEN * this.Intellect + additionalMPRegen + this.MaxMP * MPRegenRate/100;
  this.CastSpeed = this.baseCastSpeed * additionalCastSpeedRate/100;
  //do
  this.Damage = this.baseDamage + this.baseDamageRate/100;
  this.FireDamage = this.baseFireDamage + this.baseFireDamageRate/100;
  this.FrostDamage = this.baseFrostDamage + this.baseFrostDamageRate/100;
  this.ArcaneDamage = this.baseArcaneDamage + this.baseArcaneDamageRate/100;
  this.ResistAll = this.baseResistAll;
  this.ResistFire = this.baseResistFire;
  this.ResistFrost = this.baseResistFrost;
  this.ResistArcane = this.baseResistArcane;
  this.ReductionAll = this.baseReductionAll;
  this.ReductionFire = this.baseReductionFire;
  this.ReductionFrost = this.baseReductionFrost;
  this.ReductionArcane = this.baseReductionArcane;

  this.MoveSpeed = this.baseMoveSpeed;
  this.RotateSpeed = this.baseRotateSpeed;

  this.HP = this.maxHP;
  this.MP = this.maxMP;

  this.setMaxSpeed(this.MoveSpeed);
  this.setRotateSpeed(this.RotateSpeed);
};
User.prototype.regenHPMP = function(){
  this.healHP(this.regenHP);
  this.healMP(this.regenMP);
};
user.prototype.igniteHP = function(){
  var igniteDamage = this.maxHP * serverConfig.IGNITE_DAMAGE_RATE;
  this.takeDamage(igniteDamage);
};
User.prototype.buffUpdate = function(){
  if(!this.buffUpdateInterval){
    this.buffUpdateInterval = setInterval(buffUpdateHandler.bind(this), INTERVAL_TIMER);
  }
  if(!this.regenInterval){
    this.regenInterval = setInterval(regenIntervalHandler.bind(this). serverConfig.USER_REGEN_TIMER);
  }
};
function buffUpdateHandler(){
  this.updateStatAndCondition();
};
function regenIntervalHandler(){
  this.regenHPMP();
  this.igniteHP();
};
User.prototype.addBuffs = function(buffs){
  //check apply rate with resist
  //set duration and startTime
  //set buffTickTime
};
User.prototype.addDebuffs = function(debuffs){
  //check apply rate with resist
  //set duration and startTime
  //set buffTickTime
};

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
  this.HP -= dmg;
  console.log(this.objectID + ' : ' + this.HP);
  if(this.HP <= 0){
    this.death(attackUserID);
  }
};
User.prototype.healHP = function(amount){
  if(this.MaxHP < this.HP + amount){
    this.HP = this.MaxHP;
  }else{
    this.HP += amount;
  }
};
User.prototype.healMP = function(amount){
  if(this.MaxMP < this.MP + amount){
    this.MP = this.MaxMP;
  }else{
    this.MP += amount;
  }
};
User.prototype.death = function(attackUserID){
  //calculate exp to attacker
  console.log(this.objectID + ' is dead by ' + attackUserID);
  var exp = this.level *  10000;
  this.onDeath(attackUserID, exp, this);
};


User.prototype.getExp = function(exp){
  this.Exp += exp;
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);
  if(userLevelData.needExp === -1){
    console.log('user reach max level');
  }else if(this.Exp >= userLevelData.needExp){
    this.levelUp();
  }
};
User.prototype.levelUp = function(){
  this.level ++;
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);
  console.log('level up to ' + this.level);
  //add levelBonus
  //additional level up check.
  this.updateUserBaseStat();
  this.getExp(0);
};

//execute when level up or down
User.prototype.updateUserBaseStat = function(){
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);

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
