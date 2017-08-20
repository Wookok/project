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

function User(socketID, userStat, userBase, exp){
  LivingEntity.call(this);
  // base setting;
  this.type = userStat.type;

  this.baseMight = userStat.might;
  this.baseIntellect = userStat.intellect;
  this.basePerception = userStat.perception;

  this.might = 0;
  this.intellect = 0;
  this.perception = 0;

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
  this.exp = exp;

  this.conditions = {};
  this.conditions[gameConfig.USER_CONDITION_IMMORTAL] = false;
  this.conditions[gameConfig.USER_CONDITION_CHILL] = false;
  this.conditions[gameConfig.USER_CONDITION_FREEZE] = false;
  this.conditions[gameConfig.USER_CONDITION_SILENCE] = false;
  this.conditions[gameConfig.USER_CONDITION_IGNITE] = false;

  this.buffList = [];

  //current stat
  this.maxHP = 0;  this.maxMP = 0;  this.HP = 0;  this.MP = 0;  this.HPRegen = 0;
  this.moveSpeed = 0; this.rotateSpeed = 0;
  this.MPRegen = 0;  this.moveSpeed = 0;  this.rotateSpeed = 0;  this.castSpeed = 0;
  this.damage = 0;  this.fireDamage = 0;  this.frostDamage = 0;  this.arcaneDamage = 0;
  this.damageRate = 0; this.fireDamageRate = 0; this.frostDamageRate = 0; this.arcaneDamageRate = 0;
  this.resistAll = 0;  this.resistFire = 0;  this.resistFrost = 0;  this.resistArcane = 0;
  this.reductionAll = 0;  this.reductionFire = 0;  this.reductionFrost = 0;  this.reductionArcane = 0;

  this.equipSkills = [];
  this.possessSkills = [];

  this.socketID = socketID;

  this.currentSkill = undefined;

  this.buffUpdateInterval = false;
  this.regenInterval = false;

  this.onDeath = new Function();

  this.getExp(0);
  this.initStat();
};
User.prototype = Object.create(LivingEntity.prototype);
User.prototype.constructor = User;

//init user current stat
User.prototype.initStat = function(){
  this.Might = this.baseMight;
  this.Intellect = this.baseIntellect;
  this.Perception = this.basePerception;

  this.maxHP = this.baseHP + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP * this.Might;
  this.maxMP = this.baseMP + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP * this.Intellect;
  this.HPRegen = this.baseHPRegen + this.maxHP * this.baseHPRegenRate/100 + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP_REGEN * this.Might;
  this.MPRegen = this.baseMPRegen + this.maxMP * this.baseMPRegenRate/100 + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP_REGEN * this.Intellect;
  this.castSpeed = this.baseCastSpeed;
  this.damage = this.baseDamage;
  this.fireDamage = this.baseFireDamage;
  this.frostDamage = this.baseFrostDamage;
  this.arcaneDamage = this.baseArcaneDamage;
  this.damageRate = this.baseDamageRate;
  this.fireDamageRate = this.baseFireDamageRate;
  this.frostDamageRate = this.baseFrostDamageRate;
  this.arcaneDamageRate = this.baseArcaneDamageRate;
  this.resistAll = this.baseResistAll;
  this.resistFire = this.baseResistFire;
  this.resistFrost = this.baseResistFrost;
  this.resistArcane = this.baseResistArcane;
  this.reductionAll = this.baseReductionAll;
  this.reductionFire = this.baseReductionFire;
  this.reductionFrost = this.baseReductionFrost;
  this.reductionArcane = this.baseReductionArcane;

  this.HP = this.maxHP;
  this.MP = this.maxMP;

  this.moveSpeed = this.baseMoveSpeed;
  this.rotateSpeed = this.baseRotateSpeed;

  this.setMaxSpeed(this.moveSpeed);
  this.setRotateSpeed(this.rotateSpeed);
};
User.prototype.updateStatAndCondition = function(){
  var additionalMight = 0, additionalIntellect = 0, additionalPerception = 0,
      additionalMaxHP = 0, additionalMaxMP = 0, additionalMaxHPRate = 100, additionalMaxMPRate = 100,
      additionalHPRegen = 0, additionalHPRegenRate = 0, additionalMPRegen = 0, additionalMPRegenRate = 0,
      additionalMoveSpeedRate = 100, additionalRotateSpeedRate = 100, additionalCastSpeedRate = 0,
      additionalDamage = 0, additionalFireDamage = 0, additionalFrostDamage = 0, additionalArcaneDamage = 0,
      additionalDamageRate = 100, additionalFireDamageRate = 100, additionalFrostDamageRate = 100, additionalArcaneDamageRate = 100,
      additionalResistAll = 0, additionalResistFire = 0, additionalResistFrost = 0, additionalResistArcane = 0,
      additionalReductionAll = 0, additionalReductionFire = 0, additionalReductionFrost = 0, additionalReductionArcane = 0;

  var additionalHP = 0; additionalMP = 0;

  var disperBuffCount = 0;
  var disperDebuffCount = 0;

  this.conditions[gameConfig.USER_CONDITION_IMMORTAL] = false;
  this.conditions[gameConfig.USER_CONDITION_CHILL] = false;
  this.conditions[gameConfig.USER_CONDITION_FREEZE] = false;
  this.conditions[gameConfig.USER_CONDITION_SILENCE] = false;
  this.conditions[gameConfig.USER_CONDITION_IGNITE] = false;

  var buffIndex = this.buffList.length;
  if(buffIndex > 0){
    while(buffIndex--){
      if(Date.now() - this.buffList[buffIndex].startTime > this.buffList[buffIndex].buffLifeTime){
        this.buffList.splice(buffIndex, 1);
      }else if(Date.now() - this.buffList[buffIndex].tickStartTime > this.buffList[buffIndex].buffTickTime){
        switch (this.buffList[buffIndex].buffType) {
          case serverConfig.BUFF_TYPE_ADD_STAT:
            if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_STAT_MIGHT){
              additionalMight += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_STAT_INTELLECT){
              additionalIntellect += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_STAT_PERCEPTION){
              additionalPerception += this.buffList[buffIndex].buffAmount;
            }else{
              console.log('check buff index : ' + this.buffList[buffIndex]);
            }
            break;
          case serverConfig.BUFF_TYPE_ADD_SECONDARY_STAT:
            if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_HP){
              additionalMaxHP += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_MP){
              additionalMaxMP += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_HP_RATE){
              additionalMaxHPRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MAX_MP_RATE){
              additionalMaxMPRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_HP_REGEN){
              additionalHPRegen += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_HP_REGEN_RATE){
              additionalHPRegenRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MP_REGEN){
              additionalMPRegen += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MP_REGEN_RATE){
              additionalMPRegenRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_MOVE_SPEED_RATE){
              //add MoveSpeed and RotateSpeed
              additionalMoveSpeedRate += this.buffList[buffIndex].buffAmount;
              additionalRotateSpeedRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_CAST_SPEED_RATE){
              additionalCastSpeedRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE){
              additionalDamage += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FIRE_DAMAGE){
              additionalFireDamage += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FROST_DAMAGE){
              additionalFrostDamage += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_ARCANE_DAMAGE){
              additionalArcaneDamage += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_DAMAGE_RATE){
              additionalDamageRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FIRE_DAMAGE_RATE){
              additionalFireDamageRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_FROST_DAMAGE_RATE){
              additionalFrostDamageRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_ARCANE_DAMAGE_RATE){
              additionalArcaneDamageRate += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_ALL){
              additionalResistAll += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_FIRE){
              additionalResistFire += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_FROST){
              additionalResistFrost += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_RESIST_ARCANE){
              additionalResistArcane += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_ALL){
              additionalReductionAll += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_FIRE){
              additionalReductionFire += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_FROST){
              additionalReductionFrost += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_ADD_SECONDARY_STAT_REDUCTION_ARCANE){
              additionalReductionArcane += this.buffList[buffIndex].buffAmount;
            }else{
              console.log('check buff index : ' + this.buffList[buffIndex]);
            }
            break;
          case serverConfig.BUFF_TYPE_HEAL:
            if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_HP){
              additionalHP += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_HP_RATE){
              additionalHP += this.maxHP * this.buffList[buffIndex].buffAmount/100;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_MP){
              additionalMP += this.buffList[buffIndex].buffAmount/100;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_HEAL_MP_RATE){
              additionalMP += this.maxMP * this.buffList[buffIndex].buffAmount/100;
            }else{
              console.log('check buff index : ' + this.buffList[buffIndex]);
            }
            break;
          case serverConfig.BUFF_TYPE_DISPEL:
            if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_DISPEL_BUFF){
              disperBuffCount += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_DISPEL_DEBUFF){
              disperDebuffCount += this.buffList[buffIndex].buffAmount;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_DISPEL_ALL){
              disperBuffCount += this.buffList[buffIndex].buffAmount;
              disperDebuffCount += this.buffList[buffIndex].buffAmount;
            }else{
              console.log('check buff index : ' + this.buffList[buffIndex]);
            }
            break;
          case serverConfig.BUFF_TYPE_SET_CONDITION:
            if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_IMMORTAL){
              this.conditions[gameConfig.USER_CONDITION_IMMORTAL] = this.buffList[buffIndex].actorID;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_CHILL){
              this.conditions[gameConfig.USER_CONDITION_CHILL] = this.buffList[buffIndex].actorID;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_FREEZE){
              this.conditions[gameConfig.USER_CONDITION_FREEZE] = this.buffList[buffIndex].actorID;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_SILENCE){
              this.conditions[gameConfig.USER_CONDITION_SILENCE] = this.buffList[buffIndex].actorID;
            }else if(this.buffList[buffIndex].buffEffectType === serverConfig.BUFF_EFFECT_TYPE_SET_CONDITION_IGNITE){
              this.conditions[gameConfig.USER_CONDITION_IGNITE] = this.buffList[buffIndex].actorID;
            }else{
              console.log('check buff index : ' + this.buffList[buffIndex]);
            }
            break;
          default:
            console.log('check buff index : ' + this.buffList[buffIndex]);
            break;
        }
        this.buffList[buffIndex].tickStartTime = Date.now();
      }
    }
  }

  //disper apply
  for(var i=0; i<disperBuffCount; i++){
    for(var j=0; j<buffList.length; j++){
      if(buffList[j].isBuff){
        buffList.splice(j, 1);
        break;
      }
    }
  }
  for(var i=0; i<disperDebuffCount; i++){
    for(var j=0; j<buffList.length; j++){
      if(!buffList[j].isBuff){
        buffList.splice(j, 1);
        break;
      }
    }
  }

  this.might = this.baseMight + additionalMight;
  this.intellect = this.baseIntellect + additionalIntellect;
  this.perception = this.basePerception + additionalPerception;

  this.maxHP = (this.baseHP + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP * this.might + additionalMaxHP) * additionalMaxHPRate/100;
  this.maxMP = (this.baseMP + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP * this.intellect + additionalMaxMP) * additionalMaxMPRate/100;
  var HPRegenRate = this.baseHPRegenRate + additionalHPRegenRate;
  var MPRegenRate = this.baseMPRegenRate + additionalMPRegenRate;
  this.HPRegen = this.baseHPRegen + serverConfig.STAT_CALC_FACTOR_MIGHT_TO_HP_REGEN * this.might + additionalHPRegen + this.maxHP * HPRegenRate/100;
  this.MPRegen = this.baseMPRegen + serverConfig.STAT_CALC_FACTOR_INTELLECT_TO_MP_REGEN * this.intellect + additionalMPRegen + this.maxMP * MPRegenRate/100;
  this.castSpeed = this.baseCastSpeed + additionalCastSpeedRate;
  this.damage = this.baseDamage + additionalDamage;
  this.fireDamage = this.baseFireDamage + additionalFireDamage;
  this.frostDamage = this.baseFrostDamage + additionalFrostDamage;
  this.arcaneDamage = this.baseArcaneDamage + additionalArcaneDamage;
  this.damageRate = this.baseDamageRate + additionalDamageRate;
  this.fireDamageRate = this.baseFireDamageRate + additionalFireDamageRate;
  this.frostDamageRate = this.baseFrostDamageRate + additionalFrostDamageRate;
  this.arcaneDamageRate = this.baseArcaneDamageRate + additionalArcaneDamageRate;
  this.resistAll = this.baseResistAll + additionalResistAll;
  this.resistFire = this.baseResistFire + additionalResistFire;
  this.resistFrost = this.baseResistFrost + additionalResistFrost;
  this.resistArcane = this.baseResistArcane + additionalResistArcane;
  this.reductionAll = this.baseReductionAll + additionalReductionAll;
  this.reductionFire = this.baseReductionFire + additionalReductionFire;
  this.reductionFrost = this.baseReductionFrost + additionalReductionFrost;
  this.reductionArcane = this.baseReductionArcane + additionalReductionArcane;

  this.moveSpeed = this.baseMoveSpeed * additionalMoveSpeedRate/100;
  this.rotateSpeed = this.baseRotateSpeed * additionalRotateSpeedRate/100;

  if(additionalHP){
    this.healHP(additionalHP);
  }
  if(additionalMP){
    this.healMP(additionalMP);
  }

  this.setMaxSpeed(this.moveSpeed);
  this.setRotateSpeed(this.rotateSpeed);
};
User.prototype.regenHPMP = function(){
  this.healHP(this.HPRegen);
  this.healMP(this.MPRegen);
};
User.prototype.igniteHP = function(){
  var igniteDamage = this.maxHP * serverConfig.IGNITE_DAMAGE_RATE;
  console.log('ignite ' + this.objectID + ' : ' + igniteDamage);
  // this.takeDamage(igniteDamage);
};
User.prototype.buffUpdate = function(){
  if(!this.buffUpdateInterval){
    this.buffUpdateInterval = setInterval(buffUpdateHandler.bind(this), INTERVAL_TIMER);
  }
  if(!this.regenInterval){
    this.regenInterval = setInterval(regenIntervalHandler.bind(this), serverConfig.USER_REGEN_TIMER);
  }
};
function buffUpdateHandler(){
  this.updateStatAndCondition();
};
function regenIntervalHandler(){
  this.regenHPMP();
  if(this.conditions[serverConfig.USER_CONDITION_IGNITE]){
    this.igniteHP();
  }
};
User.prototype.addBuffs = function(buffs){
  //check apply rate with resist
  var applyBuffs = [];
  for(var i=0; i<buffs.length; i++){
    var rate = Math.floor(Math.random() * 101);
    if(buffs[i].buffApplyRate > rate){
      applyBuffs.push(buffs[i]);
    }
  }
  //set duration and startTime
  //if duplicate condition, set as later condition buff. delete before buff and debuff
  //set buffTickTime
  for(var i=0; i<applyBuffs.length; i++){
    applyBuffs[i].startTime = Date.now();
    applyBuffs[i].buffTickTime = Date.now();
    if(applyBuffs[i].buffType === serverConfig.BUFF_TYPE_SET_CONDITION){
      //if same set condition delete before buff
      for(var j=0; j<this.buffList.length; j++){
        if(this.buffList[j].buffType === serverConfig.BUFF_TYPE_SET_CONDITION &&
           this.buffList[j].buffEffectType === applyBuffs[i].buffEffectType){
             this.buffList.splice(j, 1);
           }
      }
    }
    this.buffList.push(applyBuffs[i]);
  }
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
  console.log(this);
  this.HP -= dmg;
  console.log(this.objectID + ' : ' + this.HP);
  if(this.HP <= 0){
    this.death(attackUserID);
  }
};
User.prototype.takeDamageToMana = function(){

};
User.prototype.healHP = function(amount){
  if(this.maxHP < this.HP + amount){
    this.HP = this.maxHP;
  }else{
    this.HP += amount;
  }
};
User.prototype.healMP = function(amount){
  if(this.maxMP < this.MP + amount){
    this.MP = this.maxMP;
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
  this.exp += exp;
  var userLevelData = util.findDataWithTwoColumns(userStatTable, 'type', this.type, 'level', this.level);
  if(userLevelData.needExp === -1){
    console.log('user reach max level');
  }else if(this.exp >= userLevelData.needExp){
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

  this.baseMight = userLevelData.might;
  this.baseIntellect = userLevelData.intellect;
  this.basePerception = userLevelData.perception;
};

module.exports = User;
