var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');
var skillTable, buffGroupTable;

var startScene, gameScene, standingScene;
var startButton, restartButton;

// var startSceneHudCenterCenterChar1, startSceneHudCenterCenterChar2, startSceneHudCenterCenterChar3;
var characterType = 1;

var baseSkill = 0;
var baseSkillData = null;
var inherentPassiveSkill = 0;
var inherentPassiveSkillData = null;
var equipSkills = new Array(4);
var equipSkillDatas = new Array(4);
var possessSkills = [];

var statPower = 0, statMagic = 0, statSpeed = 0;
var cooldownReduceRate = 0;

var hudBaseSkillImg, hudEquipSkill1Img, hudEquipSkill2Img, hudEquipSkill3Img, hudEquipSkill4Img, hudPassiveSkillImg;
var hudBtnSkillChange;
var gameSceneBuffsContainer;
var userHPProgressBar, userMPProgressBar, userExpProgressBar;

var isUseableBaseSkill = true, isUseableEquipSkill1 = true, isUseableEquipSkill2 = true, isUseableEquipSkill3 = true, isUseableEquipSkill4 = true;
var hudBaseSkillMask, hudEquipSkill1Mask, hudEquipSkill2Mask, hudEquipSkill3Mask, hudEquipSkill4Mask;
var hudBaseSkillBlockMask, hudEquipSkill1BlockMask, hudEquipSkill2BlockMask, hudEquipSkill3BlockMask, hudEquipSkill4BlockMask, hudPassiveSkillBlockMask;
var userStatPowerContainer, userStatMagicContainer, userStatSpeedContainer;
var gameSceneHudTopCenter, selectSkillIcon, selectSkillInfo, btnSelectSkillCancel;
var goldContainer, jewelContainer, gameSceneHudTopRight;
var gameSceneDeadScene, deadSceneText;
var DivFlashMessageContainer, flashMessageContainer;

var popUpSkillChange, popUpSkillContainer, popUpBackground;
var popUpSkillInfoIcon, popUpSkillInfoDesc, popUpSkillUpgradeCostGold, popUpSkillUpgradeCostJewel, popUpSkillUpgradeBtn;
var popUpEquipBaseSkill, popUpEquipSkill1, popUpEquipSkill2, popUpEquipSkill3, popUpEquipSkill4, popUpEquipPassiveSkill;

var miniMapUser, miniMapChest1, miniMapChest2, miniMapChest3, miniMapChest4, miniMapChest5, miniMapChest6, miniMapChest7, miniMapChest8, miniMapChest9;
var blankImg = '../css/blankFrame.png';

var selectedPanel = null;
var selectedDiv = null;
var selectedEquipIndex = null;
var selectedSkillIndex = null;

var isServerResponse = true;

function UIManager(sTable, bTable){
  skillTable = sTable;
  buffGroupTable = bTable;

  this.serverResponseTimeout = false;

  this.onStartBtnClick = new Function();

  this.onSelectSkillCancelBtnClick = new Function();
  this.onSkillIconClick = new Function();
  this.onSkillUpgrade = new Function();
  this.onExchangeSkill = new Function();
  this.onExchangePassive = new Function();
  this.onEquipPassive = new Function();
  this.onUnequipPassive = new Function();
};
UIManager.prototype = {
  initStartScene : function(){
    startScene = document.getElementById('startScene');
    gameScene = document.getElementById('gameScene');
    standingScene = document.getElementById('standingScene');
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    // startButton.addEventListener('click', startBtnClickHandler.bind(this, startButton), false);
    startButton.onclick = startBtnClickHandler.bind(this, startButton);

    var children = document.getElementById('startSceneHudCenterCenterCharSelect').children;
    for(var i=0; i<children.length; i++){
      children[i].onclick = function(){
        var type = parseInt(this.getAttribute('type'));
        characterType = type;
        for(var j=0; j<children.length; j++){
          children[j].classList.remove('select');
        }
        this.classList.add('select');
      };
    }
  },
  disableStartScene : function(){
    startScene.classList.add('disable');
    startScene.classList.remove('enable');

    gameScene.classList.add('enable');
    gameScene.classList.remove('disable');

    startButton.onclick = '';
    // startButton.removeEventListener('click', startBtnClickHandler);
  },
  initStandingScene : function(){
    // restartButton.addEventListener('click', startBtnClickHandler.bind(this, restartButton), false);
    restartButton.onclick = startBtnClickHandler.bind(this, restartButton);

    var children = document.getElementById('standingSceneHudCenterCenterCharSelect').children;
    for(var i=0; i<children.length; i++){
      children[i].onclick = function(){
        var type = parseInt(this.getAttribute('type'));
        characterType = type;
        for(var j=0; j<children.length; j++){
          children[j].classList.remove('select');
        }
        this.classList.add('select');
      };
    }
  },
  disableStandingScene : function(){
    standingScene.classList.add('disable');
    standingScene.classList.remove('enable');

    gameScene.classList.add('enable');
    gameScene.classList.remove('disable');

    restartButton.onclick = '';
    // restartButton.removeEventListener('click', startBtnClickHandler);
  },
  initHUD : function(){
    hudBaseSkillImg = document.getElementById('hudBaseSkillImg');
    hudEquipSkill1Img = document.getElementById('hudEquipSkill1Img');
    hudEquipSkill2Img = document.getElementById('hudEquipSkill2Img');
    hudEquipSkill3Img = document.getElementById('hudEquipSkill3Img');
    hudEquipSkill4Img = document.getElementById('hudEquipSkill4Img');
    hudPassiveSkillImg = document.getElementById('hudPassiveSkillImg');

    hudBaseSkillImg.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudBaseSkillImg, gameConfig.SKILL_BASIC_INDEX), false);
    hudEquipSkill1Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill1Img, gameConfig.SKILL_EQUIP1_INDEX), false);
    hudEquipSkill2Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill2Img, gameConfig.SKILL_EQUIP2_INDEX), false);
    hudEquipSkill3Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill3Img, gameConfig.SKILL_EQUIP3_INDEX), false);
    hudEquipSkill4Img.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudEquipSkill4Img, gameConfig.SKILL_EQUIP4_INDEX), false);
    hudPassiveSkillImg.addEventListener('mouseover', bottomSkillTooltipOnHandler.bind(hudPassiveSkillImg, gameConfig.SKILL_PASSIVE_INDEX), false);

    hudBaseSkillImg.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudBaseSkillImg), false);
    hudEquipSkill1Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill1Img), false);
    hudEquipSkill2Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill2Img), false);
    hudEquipSkill3Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill3Img), false);
    hudEquipSkill4Img.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudEquipSkill4Img), false);
    hudPassiveSkillImg.addEventListener('mouseout', bottomSkillTooltipOffHandler.bind(hudPassiveSkillImg), false);

    hudBaseSkillImg.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_BASIC_INDEX);
    hudEquipSkill1Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP1_INDEX);
    hudEquipSkill2Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP2_INDEX);
    hudEquipSkill3Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP3_INDEX);
    hudEquipSkill4Img.onclick = onSkillIconClickHandler.bind(this, gameConfig.SKILL_EQUIP4_INDEX);

    hudBtnSkillChange = document.getElementById('hudBtnSkillChange');

    gameSceneBuffsContainer = document.getElementById('gameSceneBuffsContainer');
    userHPProgressBar = document.getElementById('userHPProgressBar');
    userExpProgressBar = document.getElementById('userExpProgressBar');
    userMPProgressBar = document.getElementById('userMPProgressBar');

    hudBaseSkillMask = document.getElementById('hudBaseSkillMask');
    hudEquipSkill1Mask = document.getElementById('hudEquipSkill1Mask');
    hudEquipSkill2Mask = document.getElementById('hudEquipSkill2Mask');
    hudEquipSkill3Mask = document.getElementById('hudEquipSkill3Mask');
    hudEquipSkill4Mask = document.getElementById('hudEquipSkill4Mask');

    hudBaseSkillMask.addEventListener('animationend', cooldownListener.bind(hudBaseSkillMask, gameConfig.SKILL_BASIC_INDEX), false);
    hudEquipSkill1Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill1Mask, gameConfig.SKILL_EQUIP1_INDEX), false);
    hudEquipSkill2Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill2Mask, gameConfig.SKILL_EQUIP2_INDEX), false);
    hudEquipSkill3Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill3Mask, gameConfig.SKILL_EQUIP3_INDEX), false);
    hudEquipSkill4Mask.addEventListener('animationend', cooldownListener.bind(hudEquipSkill4Mask, gameConfig.SKILL_EQUIP4_INDEX), false);

    hudBaseSkillBlockMask = document.getElementById('hudBaseSkillBlockMask');
    hudEquipSkill1BlockMask = document.getElementById('hudEquipSkill1BlockMask');
    hudEquipSkill2BlockMask = document.getElementById('hudEquipSkill2BlockMask');
    hudEquipSkill3BlockMask = document.getElementById('hudEquipSkill3BlockMask');
    hudEquipSkill4BlockMask = document.getElementById('hudEquipSkill4BlockMask');
    hudPassiveSkillBlockMask = document.getElementById('hudPassiveSkillBlockMask');

    userStatPowerContainer = document.getElementById('userStatPowerContainer');
    userStatMagicContainer = document.getElementById('userStatMagicContainer');
    userStatSpeedContainer = document.getElementById('userStatSpeedContainer');

    userStatPowerContainer.addEventListener('mouseover', bottomTooltipOnHandler.bind(userStatPowerContainer, gameConfig.STAT_POWER_INDEX), false);
    userStatMagicContainer.addEventListener('mouseover', bottomTooltipOnHandler.bind(userStatMagicContainer, gameConfig.STAT_MAGIC_INDEX), false);
    userStatSpeedContainer.addEventListener('mouseover', bottomTooltipOnHandler.bind(userStatSpeedContainer, gameConfig.STAT_SPEED_INDEX), false);

    userStatPowerContainer.addEventListener('mouseout', bottomTooltipOffHandler.bind(userStatPowerContainer), false);
    userStatMagicContainer.addEventListener('mouseout', bottomTooltipOffHandler.bind(userStatMagicContainer), false);
    userStatSpeedContainer.addEventListener('mouseout', bottomTooltipOffHandler.bind(userStatSpeedContainer), false);

    miniMapUser = document.getElementById('miniMapUser');
    miniMapChest1 = document.getElementById('miniMapChest1');
    miniMapChest2 = document.getElementById('miniMapChest2');
    miniMapChest3 = document.getElementById('miniMapChest3');
    miniMapChest4 = document.getElementById('miniMapChest4');
    miniMapChest5 = document.getElementById('miniMapChest5');
    miniMapChest6 = document.getElementById('miniMapChest6');
    miniMapChest7 = document.getElementById('miniMapChest7');
    miniMapChest8 = document.getElementById('miniMapChest8');
    miniMapChest9 = document.getElementById('miniMapChest9');

    gameSceneHudTopCenter = document.getElementById('gameSceneHudTopCenter');
    selectSkillIcon = document.getElementById('selectSkillIcon');
    selectSkillInfo = document.getElementById('selectSkillInfo');
    btnSelectSkillCancel = document.getElementById('btnSelectSkillCancel');
    btnSelectSkillCancel.onclick = onSelectSkillCancelBtnClickHandler.bind(this);
    goldContainer = document.getElementById('goldContainer');
    jewelContainer = document.getElementById('jewelContainer');
    gameSceneHudTopRight = document.getElementById('gameSceneHudTopRight');

    gameSceneDeadScene = document.getElementById('gameSceneDeadScene');
    deadSceneText = document.getElementById('deadSceneText');

    DivFlashMessageContainer = document.getElementById('DivFlashMessageContainer');
    flashMessageContainer = document.getElementById('flashMessageContainer');
  },
  drawStartScene : function(){
    // startScene.classList.add('enable');
    // startScene.classList.remove('disable');
    // gameScene.classList.add('disable');
    // gameScene.classList.remove('enable');
    // standingScene.classList.add('disable');
    // standingScene.classList.remove('enable');
  },
  drawGameScene : function(){

  },
  drawRestartScene : function(){
    // startScene.classList.add('disable');
    // startScene.classList.remove('enable');
    gameScene.classList.add('disable');
    gameScene.classList.remove('enable');
    standingScene.classList.add('enable');
    standingScene.classList.remove('disable');
  },
  enableSelectSkillInfo : function(skillData){
    selectSkillIcon.src = skillData.skillIcon;
    selectSkillInfo.innerHTML = skillData.name;

    gameSceneHudTopCenter.classList.add('enable');
    gameSceneHudTopCenter.classList.remove('disable');

    switch (skillData.index) {
      case baseSkill:
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[0]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[1]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[2]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill4BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      case equipSkills[3]:
        hudBaseSkillBlockMask.classList.remove('disable');
        hudEquipSkill1BlockMask.classList.remove('disable');
        hudEquipSkill2BlockMask.classList.remove('disable');
        hudEquipSkill3BlockMask.classList.remove('disable');
        hudPassiveSkillBlockMask.classList.remove('disable');
        break;
      default:
    }
  },
  disableSelectSkillInfo : function(){
    selectSkillIcon.src = "";
    selectSkillInfo.innerHTML = "";

    gameSceneHudTopCenter.classList.add('disable');
    gameSceneHudTopCenter.classList.remove('enable');

    hudBaseSkillBlockMask.classList.add('disable');
    hudEquipSkill1BlockMask.classList.add('disable');
    hudEquipSkill2BlockMask.classList.add('disable');
    hudEquipSkill3BlockMask.classList.add('disable');
    hudEquipSkill4BlockMask.classList.add('disable');
    hudPassiveSkillBlockMask.classList.add('disable');
  },
  syncSkills : function(bSkill, bSkillData, eSkills, eSkillDatas, pSkills, iSkill, iSkillData){
    baseSkill = bSkill;
    baseSkillData = bSkillData;
    equipSkills = eSkills;
    equipSkillDatas = eSkillDatas;
    possessSkills = pSkills;
    inherentPassiveSkill = iSkill;
    inherentPassiveSkillData = iSkillData;
  },
  updatePossessionSkills : function(pSkills){
    possessSkills = pSkills;
  },
  updateHP : function(userData){
    var percent = userData.HP/userData.maxHP * 100;
    if(percent > 100){
      percent = 100;
    }
    userHPProgressBar.style.height = percent + "%";
  },
  updateMP : function(userData){
    var percent = userData.MP/userData.maxMP * 100;
    if(percent > 100){
      percent = 100;
    }
    userMPProgressBar.style.height = percent + "%";
  },
  updateExp : function(userData, needExp){
    var percent = userData.exp / needExp * 100;
    if(percent > 100){
      percent = 100;
    }
    userExpProgressBar.style.width = percent + "%";
  },
  applySkill : function(skillIndex){
    //check skill slot
    var slotMask = null;
    if(baseSkill === skillIndex){
      slotMask = hudBaseSkillMask;
      isUseableBaseSkill = false;
    }else if(equipSkills[0] === skillIndex){
      slotMask = hudEquipSkill1Mask;
      isUseableEquipSkill1 = false;
    }else if(equipSkills[1] === skillIndex){
      slotMask = hudEquipSkill2Mask;
      isUseableEquipSkill2 = false;
    }else if(equipSkills[2] === skillIndex){
      slotMask = hudEquipSkill3Mask;
      isUseableEquipSkill3 = false;
    }else if(equipSkills[3] === skillIndex){
      slotMask = hudEquipSkill4Mask;
      isUseableEquipSkill4 = false;
    }else{
      console.log('cant find skill slot');
    }
    //cooldown start
    if(slotMask){
      var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
      var cooldown = skillData.cooldown * (100 - cooldownReduceRate) / 100000;
      slotMask.style.animationDuration = (cooldown) + 's';
      slotMask.classList.add("cooldownMaskAni");
    }
  },
  checkCooltime : function(skillSlot){
    switch (skillSlot) {
      case gameConfig.SKILL_BASIC_INDEX:
        return isUseableBaseSkill;
      case gameConfig.SKILL_EQUIP1_INDEX:
        return isUseableEquipSkill1;
      case gameConfig.SKILL_EQUIP2_INDEX:
        return isUseableEquipSkill2;
      case gameConfig.SKILL_EQUIP3_INDEX:
        return isUseableEquipSkill3;
      case gameConfig.SKILL_EQUIP4_INDEX:
        return isUseableEquipSkill4;
      default:
        return false;
    }
  },
  setHUDSkills : function(){
    hudBaseSkillImg.src = baseSkillData ? baseSkillData.skillIcon : blankImg;
    hudEquipSkill1Img.src = equipSkillDatas[0] ? equipSkillDatas[0].skillIcon : blankImg;
    hudEquipSkill2Img.src = equipSkillDatas[1] ? equipSkillDatas[1].skillIcon : blankImg;
    hudEquipSkill3Img.src = equipSkillDatas[2] ? equipSkillDatas[2].skillIcon : blankImg;
    hudEquipSkill4Img.src = equipSkillDatas[3] ? equipSkillDatas[3].skillIcon : blankImg;
    hudPassiveSkillImg.src = inherentPassiveSkillData ? inherentPassiveSkillData.skillIcon : blankImg;
  },
  setHUDStats : function(power, magic, speed){
    userStatPowerContainer.children[1].innerHTML = statPower = power;
    userStatMagicContainer.children[1].innerHTML = statMagic = magic;
    userStatSpeedContainer.children[1].innerHTML = statSpeed = speed;
  },
  setCooldownReduceRate : function(reduceRate){
    cooldownReduceRate = reduceRate;
  },
  setSkillChangeBtn : function(){
    hudBtnSkillChange.onclick = function(){
      clearSelectedPanel();
      clearPopSkillChangeClass();
      popChange(popUpSkillChange);
    }
    popUpBackground.onclick = function(){
      clearSelectedPanel();
      clearPopSkillChangeClass();
      popChange(popUpSkillChange);
    }
  },
  setResource : function(resourceData){
    goldContainer.innerHTML = resourceData.gold;
    jewelContainer.innerHTML = resourceData.jewel;
  },
  addResource : function(gold, jewel){
    var goldAmount = parseInt(goldContainer.innerHTML);
    var jewelAmount = parseInt(jewelContainer.innerHTML);
    if(util.isNumeric(gold) && util.isNumeric(goldAmount)){
      goldContainer.innerHTML = goldAmount + gold;
    }
    if(util.isNumeric(jewel) && util.isNumeric(jewelAmount)){
      jewelContainer.innerHTML = jewelAmount + jewel;
    }
  },
  makeDivFlashMessage : function(skillData){

  },
  updateBuffIcon : function(passiveList, buffList){
    while(gameSceneBuffsContainer.firstChild){
      gameSceneBuffsContainer.removeChild(gameSceneBuffsContainer.firstChild);
    }
    gameSceneBuffsContainer.innerHtml = '';
    if(inherentPassiveSkillData){
      var buffGroupData = Object.assign({}, util.findData(buffGroupTable, 'index', inherentPassiveSkillData.buffToSelf));
      var div = document.createElement('div');
      div.setAttribute('buffGroupIndex', inherentPassiveSkillData.buffToSelf);
      var img = document.createElement('img');
      img.src = buffGroupData.buffIcon;
      div.appendChild(img);
      gameSceneBuffsContainer.appendChild(div);
      div.addEventListener('mouseover', bottomTooltipOnHandler.bind(div, gameConfig.BUFF_ICON_INDEX));
      div.addEventListener('mouseout', bottomTooltipOffHandler.bind(div), false);
    }
    if(passiveList){
      for(var i=0; i<passiveList.length; i++){
        var passiveData = Object.assign({}, util.findData(buffGroupTable, 'index', passiveList[i]));
        var div = document.createElement('div');
        div.setAttribute('buffGroupIndex', passiveData.index);
        var img = document.createElement('img');
        img.src = passiveData.buffIcon;
        div.appendChild(img);
        gameSceneBuffsContainer.appendChild(div);
        div.addEventListener('mouseover', bottomTooltipOnHandler.bind(div, gameConfig.BUFF_ICON_INDEX));
        div.addEventListener('mouseout', bottomTooltipOffHandler.bind(div), false);
      }
    }
    if(buffList){
      for(var i=0; i<buffList.length; i++){
        var buffData = Object.assign({}, util.findData(buffGroupTable, 'index', buffList[i].index));
        var lifeTime = buffData.buffLifeTime;
        var pastTime = Date.now() - buffList[i].startTime;
        var buffListItem = buffList[i];

        var div = document.createElement('div');
        div.setAttribute('buffGroupIndex', buffData.index);
        var img = document.createElement('img');
        img.src = buffData.buffIcon;
        div.appendChild(img);
        gameSceneBuffsContainer.appendChild(div);
        div.addEventListener('mouseover', bottomTooltipOnHandler.bind(div, gameConfig.BUFF_ICON_INDEX));
        div.addEventListener('mouseout', bottomTooltipOffHandler.bind(div), false);

        var checkBuffLifeTimeHandler = function(){
          pastTime = Date.now() - buffListItem.startTime;
          if(lifeTime - pastTime <= 5000){
            div.classList.add('buffBeforeEndAni');
          }else{
            setTimeout(checkBuffLifeTimeHandler, 100);
          }
        }
        setTimeout(checkBuffLifeTimeHandler, 100);
      }
    }
  },
  initPopUpSkillChanger : function(){
    popUpSkillChange = document.getElementById('popUpSkillChange');
    popUpSkillContainer = document.getElementById('popUpSkillContainer');
    popUpBackground = document.getElementById('popUpBackground');

    popUpSkillInfoIcon = document.getElementById('popUpSkillInfoIcon');
    popUpSkillInfoDesc = document.getElementById('popUpSkillInfoDesc');
    popUpSkillUpgradeCostGold = document.getElementById('popUpSkillUpgradeCostGold');
    popUpSkillUpgradeCostJewel = document.getElementById('popUpSkillUpgradeCostJewel');
    popUpSkillUpgradeBtn = document.getElementById('popUpSkillUpgradeBtn');

    popUpEquipBaseSkill = document.getElementById('popUpEquipBaseSkill');
    popUpEquipSkill1 = document.getElementById('popUpEquipSkill1');
    popUpEquipSkill2 = document.getElementById('popUpEquipSkill2');
    popUpEquipSkill3 = document.getElementById('popUpEquipSkill3');
    popUpEquipSkill4 = document.getElementById('popUpEquipSkill4');
    popUpEquipPassiveSkill = document.getElementById('popUpEquipPassiveSkill');
  },
  checkPopUpSkillChange : function(){
    var needRefresh = false;

    var equipSkillIndex1 = parseInt(popUpEquipSkill1.getAttribute('skillIndex'));
    var equipSkillIndex2 = parseInt(popUpEquipSkill2.getAttribute('skillIndex'));
    var equipSkillIndex3 = parseInt(popUpEquipSkill3.getAttribute('skillIndex'));
    var equipSkillIndex4 = parseInt(popUpEquipSkill4.getAttribute('skillIndex'));
    if(equipSkillIndex1 && equipSkillIndex1 !== equipSkills[0]){
      needRefresh = true;
    }
    if(equipSkillIndex2 && equipSkillIndex2 !== equipSkills[1]){
      needRefresh = true;
    }
    if(equipSkillIndex3 && equipSkillIndex3 !== equipSkills[2]){
      needRefresh = true;
    }
    if(equipSkillIndex4 && equipSkillIndex4 !== equipSkills[3]){
      needRefresh = true;
    }

    var containerItems = popUpSkillContainer.children;
    for(var i=0; i<containerItems.length; i++){
      var isExist = false;
      var skillIndex = parseInt(containerItems[i].getAttribute('skillIndex'));
      for(var j=0; j<possessSkills.length; j++){
        if(skillIndex === possessSkills[j]){
          isExist = true;
          break;
        }
      }
      if(!isExist){
        needRefresh = true;
      }
    }
    return needRefresh;
  },
  upgradeBaseSkill : function(afterSkillIndex, afterSkillData){
    var beforeSkillIndex = baseSkill;
    baseSkill = afterSkillIndex;
    baseSkillData = afterSkillData;
    if(selectedSkillIndex === beforeSkillIndex){
      this.updateSelectedPanel(afterSkillIndex);
    }
    this.updateSkillImageAndIndex(beforeSkillIndex, afterSkillIndex);
    isServerResponse = true;
    if(this.serverResponseTimeout){
      clearTimeout(this.serverResponseTimeout);
      this.serverResponseTimeout = false;
    }
  },
  upgradeInherentSkill : function(afterSkillIndex, afterSkillData){
    var beforeSkillIndex = inherentPassiveSkill;
    inherentPassiveSkill = afterSkillIndex;
    inherentPassiveSkillData = afterSkillData;
    if(selectedSkillIndex === beforeSkillIndex){
      this.updateSelectedPanel(afterSkillIndex);
    }
    this.updateSkillImageAndIndex(beforeSkillIndex, afterSkillIndex);
    isServerResponse = true;
    if(this.serverResponseTimeout){
      clearTimeout(this.serverResponseTimeout);
      this.serverResponseTimeout = false;
    }
  },
  upgradePossessionSkill : function(beforeSkillIndex, afterSkillIndex){
    for(var i=0; i<possessSkills.length; i++){
      if(possessSkills[i] === beforeSkillIndex){
        var index = possessSkills.indexOf(beforeSkillIndex);
        possessSkills.splice(index, 1, afterSkillIndex);
        break;
      }
    }
    for(var i=0; i<equipSkills.length; i++){
      if(equipSkills[i] === beforeSkillIndex){
        var index = equipSkills.indexOf(beforeSkillIndex);
        equipSkills.splice(index, 1, afterSkillIndex);
        var skillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
        equipSkillDatas.splice(index, 1, skillData);
        break;
      }
    }
    if(selectedSkillIndex === beforeSkillIndex){
      this.updateSelectedPanel(afterSkillIndex);
    }
    this.updateSkillImageAndIndex(beforeSkillIndex, afterSkillIndex);
    isServerResponse = true;
    if(this.serverResponseTimeout){
      clearTimeout(this.serverResponseTimeout);
      this.serverResponseTimeout = false;
    }
  },
  updateSkillImageAndIndex : function(beforeSkillIndex, afterSkillIndex){
    var divs = document.querySelectorAll('[skillIndex="' + beforeSkillIndex + '"]');
    var afterData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
    for(var i=0; i<divs.length; i++){
      divs[i].setAttribute('skillIndex', afterSkillIndex);
      divs[i].getElementsByTagName('img')[0].src = afterData.skillIcon;
    }
    this.setHUDSkills()
  },
  setPopUpSkillChange : function(){
    while (popUpSkillContainer.firstChild) {
      popUpSkillContainer.removeChild(popUpSkillContainer.firstChild);
    }
    while(popUpEquipBaseSkill.firstChild){
      popUpEquipBaseSkill.removeChild(popUpEquipBaseSkill.firstChild);
    }
    while(popUpEquipSkill1.firstChild){
      popUpEquipSkill1.removeChild(popUpEquipSkill1.firstChild);
    }
    while(popUpEquipSkill2.firstChild){
      popUpEquipSkill2.removeChild(popUpEquipSkill2.firstChild);
    }
    while(popUpEquipSkill3.firstChild){
      popUpEquipSkill3.removeChild(popUpEquipSkill3.firstChild);
    }
    while(popUpEquipSkill4.firstChild){
      popUpEquipSkill4.removeChild(popUpEquipSkill4.firstChild);
    }
    while(popUpEquipPassiveSkill.firstChild){
      popUpEquipPassiveSkill.removeChild(popUpEquipPassiveSkill.firstChild);
    }

    var baseImg = document.createElement('img');
    baseImg.src = baseSkillData.skillIcon;
    popUpEquipBaseSkill.setAttribute('skillIndex', baseSkill);
    popUpEquipBaseSkill.appendChild(baseImg);
    popUpEquipBaseSkill.onclick = changeEquipSkillHandler.bind(this, popUpEquipBaseSkill, gameConfig.SKILL_CHANGE_PANEL_EQUIP);

    var inherentPassiveSkillImg = document.createElement('img');
    inherentPassiveSkillImg.src = inherentPassiveSkillData.skillIcon;
    popUpEquipPassiveSkill.setAttribute('skillIndex', inherentPassiveSkill);
    popUpEquipPassiveSkill.appendChild(inherentPassiveSkillImg);
    popUpEquipPassiveSkill.onclick = changeEquipSkillHandler.bind(this, popUpEquipPassiveSkill, gameConfig.SKILL_CHANGE_PANEL_EQUIP);

    if(equipSkillDatas[0]){
      var equipSkills1 = document.createElement('img');
      equipSkills1.src = equipSkillDatas[0].skillIcon;
      popUpEquipSkill1.setAttribute('skillIndex', equipSkillDatas[0].index);
      popUpEquipSkill1.appendChild(equipSkills1);
    }
    if(equipSkillDatas[1]){
      var equipSkills2 = document.createElement('img');
      equipSkills2.src = equipSkillDatas[1].skillIcon;
      popUpEquipSkill2.appendChild(equipSkills2);
    }
    if(equipSkillDatas[2]){
      var equipSkills3 = document.createElement('img');
      equipSkills3.src = equipSkillDatas[2].skillIcon;
      popUpEquipSkill3.appendChild(equipSkills3);
      }
    if(equipSkillDatas[3]){
      var equipSkills4 = document.createElement('img');
      equipSkills4.src = equipSkillDatas[3].skillIcon;
      popUpEquipSkill4.appendChild(equipSkills4);
    }
    popUpEquipSkill1.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill1, gameConfig.SKILL_CHANGE_PANEL_EQUIP);
    popUpEquipSkill2.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill2, gameConfig.SKILL_CHANGE_PANEL_EQUIP);
    popUpEquipSkill3.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill3, gameConfig.SKILL_CHANGE_PANEL_EQUIP);
    popUpEquipSkill4.onclick = changeEquipSkillHandler.bind(this, popUpEquipSkill4, gameConfig.SKILL_CHANGE_PANEL_EQUIP);

    var equipSkillIndexes = [];
    equipSkillIndexes.push(baseSkill);
    for(var i=0; i<equipSkills.length; i++){
      equipSkillIndexes.push(equipSkills[i]);
    }

    for(var i=0; i<possessSkills.length; i++){
      var isEquipSkill = false;
      for(var j=0; j<equipSkillIndexes.length; j++){
        if(equipSkillIndexes[j] === possessSkills[i]){
          isEquipSkill = true;
        }
      }
      if(!isEquipSkill){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', possessSkills[i]));
        var skillDiv = document.createElement('div');
        var skillImg = document.createElement('img');

        skillDiv.setAttribute('skillIndex', possessSkills[i]);

        skillDiv.classList.add('popUpSkillContainerItem');
        skillImg.src = skillData.skillIcon;
        skillDiv.appendChild(skillImg);
        popUpSkillContainer.appendChild(skillDiv);

        skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
      }
    }
  },
  updateSelectedPanel : function(skillIndex){
    while(popUpSkillInfoIcon.firstChild){
      popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
    }
    while(popUpSkillInfoDesc.firstChild){
      popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
    }
    popUpSkillUpgradeCostGold.innerHTML = 0;
    popUpSkillUpgradeCostJewel.innerHTML = 0;

    if(skillIndex){
      selectedSkillIndex = skillIndex;

      var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
      var skillImg = document.createElement('img');
      var skillDesc = document.createElement('p');

      skillImg.src = skillData.skillIcon;
      skillDesc.innerHTML = skillData.clientName;
      popUpSkillUpgradeCostGold.innerHTML = skillData.upgradeGoldAmount;
      popUpSkillUpgradeCostJewel.innerHTML = skillData.upgradeJewelAmount;

      popUpSkillInfoIcon.appendChild(skillImg);
      popUpSkillInfoDesc.appendChild(skillDesc);
      // popUpSkillUpgradeBtn.addEventListener('click', skillUpgradeBtnHandler, false);
      popUpSkillUpgradeBtn.onclick = skillUpgradeBtnHandler.bind(this, skillData);
    }else{
      popUpSkillUpgradeBtn.onclick = new Function();
    }
  },
  setBoard : function(userDatas, userID){
    var rank = [];
    var userRank = 0;
    userDatas.sort(function(a, b){
      return b.killScore - a.killScore;
    });
    for(var i=0; i<userDatas.length; i++){
      if(userID === userDatas[i].objectID){
        userRank = i + 1;
      }
      rank.push({rank : i + 1, name : userDatas[i].objectID, kill : userDatas[i].killScore });
    }
    var output = "";
    var length = rank.length > 10 ? 10 : rank.length;
    for(var i=0; i<length; i++){
      output += rank[i].rank + ' : ' + rank[i].name + ' : ' + rank[i].kill + '<br>';
    }
    if(userRank > 10){
      output += rank[i].rank + ' : ' + rank[i].name + ' : ' + rank[i].kill;
    }
    gameSceneHudTopRight.innerHTML = "";
    gameSceneHudTopRight.innerHTML = output;
  },
  updateBoard : function(userDatas, userID){
    this.setBoard(userDatas, userID);
  },
  setMiniMapChests : function(chestDatas, chestLocationDatas){
    miniMapChest1.setAttribute('locationID', chestLocationDatas[0].id);
    miniMapChest1.style.left = Math.floor(chestLocationDatas[0].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest1.style.top = Math.floor(chestLocationDatas[0].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest2.setAttribute('locationID', chestLocationDatas[1].id);
    miniMapChest2.style.left = Math.floor(chestLocationDatas[1].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest2.style.top = Math.floor(chestLocationDatas[1].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest3.setAttribute('locationID', chestLocationDatas[2].id);
    miniMapChest3.style.left = Math.floor(chestLocationDatas[2].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest3.style.top = Math.floor(chestLocationDatas[2].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest4.setAttribute('locationID', chestLocationDatas[3].id);
    miniMapChest4.style.left = Math.floor(chestLocationDatas[3].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest4.style.top = Math.floor(chestLocationDatas[3].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest5.setAttribute('locationID', chestLocationDatas[4].id);
    miniMapChest5.style.left = Math.floor(chestLocationDatas[4].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest5.style.top = Math.floor(chestLocationDatas[4].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest6.setAttribute('locationID', chestLocationDatas[5].id);
    miniMapChest6.style.left = Math.floor(chestLocationDatas[5].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest6.style.top = Math.floor(chestLocationDatas[5].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest7.setAttribute('locationID', chestLocationDatas[6].id);
    miniMapChest7.style.left = Math.floor(chestLocationDatas[6].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest7.style.top = Math.floor(chestLocationDatas[6].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest8.setAttribute('locationID', chestLocationDatas[7].id);
    miniMapChest8.style.left = Math.floor(chestLocationDatas[7].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest8.style.top = Math.floor(chestLocationDatas[7].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
    miniMapChest9.setAttribute('locationID', chestLocationDatas[8].id);
    miniMapChest9.style.left = Math.floor(chestLocationDatas[8].posX * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapChest9.style.top = Math.floor(chestLocationDatas[8].posY * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';

    // var parentDiv = miniMapChest1.parentNode;
    var childDivs = miniMapChest1.parentNode.getElementsByTagName('div');
    for(var i=1; i<childDivs.length; i++){
      childDivs[i].classList.add('chestOff');
    }
    for(var i=0; i<chestDatas.length; i++){
      for(var j=1; j<childDivs.length; j++){
        var locationID = childDivs[j].getAttribute('locationID');
        if(chestDatas[i].locationID === locationID){
          childDivs[j].classList.remove('chestOff');
          childDivs[j].classList.add('chestOn');
          break;
        }
      }
    }
  },
  createChest : function(locationID){
    var childDivs = miniMapChest1.parentNode.getElementsByTagName('div');
    for(var i=0; i<childDivs.length; i++){
      if(locationID === childDivs[i].getAttribute('locationID')){
        childDivs[i].classList.remove('chestOff');
        childDivs[i].classList.add('chestOn');
        childDivs[i].classList.add('chestAni');
        var div = childDivs[i];
        setTimeout(function(){
          div.classList.remove('chestAni');
        }, gameConfig.CHEST_ANI_PLAY_TIME);
      }
    }
  },
  deleteChest : function(locationID){
    var childDivs = miniMapChest1.parentNode.getElementsByTagName('div');
    for(var i=0; i<childDivs.length; i++){
      if(locationID === childDivs[i].getAttribute('locationID')){
        childDivs[i].classList.add('chestOff');
        childDivs[i].classList.remove('chestOn');
      }
    }
  },
  setUserPosition : function(position){
    miniMapUser.style.left = Math.floor(position.x * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapUser.style.top = Math.floor(position.y * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
  },
  updateUserPosition : function(position){
    miniMapUser.style.left = Math.floor(position.x * 100 / gameConfig.CANVAS_MAX_SIZE.width) + '%';
    miniMapUser.style.top = Math.floor(position.y * 100 / gameConfig.CANVAS_MAX_SIZE.height) + '%';
  },
  playDeadScene : function(killUser){
    if(killUser){
      var text = "You are dead by " + killUser;
    }else{
      text = "You are dead"
    }
    deadSceneText.innerHTML = text;
    gameSceneDeadScene.style.display = 'block';
    gameSceneDeadScene.classList.add('deadSceneAni');
  },
  disableDeadScene : function(){
    deadSceneText.innerHTML = '';
    gameSceneDeadScene.classList.remove('deadSceneAni');
    gameSceneDeadScene.style.display = 'none';
  },
  getUserGold : function(){
    return parseInt(goldContainer.innerHTML);
  },
  getUserJewel : function(){
    return parseInt(jewelContainer.innerHTML);
  }
};
function popChange(popWindow){
  if(popWindow.classList.contains('disable')){
    popWindow.classList.add('enable');
    popWindow.classList.remove('disable');
    popUpBackground.classList.add('enable');
    popUpBackground.classList.remove('disable');
  }else if(popWindow.classList.contains('enable')){
    popWindow.classList.add('disable');
    popWindow.classList.remove('enable');
    popUpBackground.classList.add('disable')
    popUpBackground.classList.remove('enable');
  }
};
function changeEquipSkillHandler(selectDiv, selectPanel){
  //clear selected and equipable class
  // if(selectedDiv){
  //   selectedDiv.classList.remove('selected');
  // }
  // popUpEquipSkill1.classList.remove('equipable');
  // popUpEquipSkill2.classList.remove('equipable');
  // popUpEquipSkill3.classList.remove('equipable');
  // popUpEquipSkill4.classList.remove('equipable');
  //
  // for(var i=0; i<popUpSkillContainer.children.length; i++){
  //   popUpSkillContainer.children[i].classList.remove('equipable');
  // }
  clearPopSkillChangeClass();
  var selectEquipIndex = null ;
  if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
    //set selectedEquipIndex
    if(selectDiv === popUpEquipBaseSkill){
      selectEquipIndex = -1;
    }else if(selectDiv === popUpEquipSkill1){
      selectEquipIndex = 0;
    }else if(selectDiv === popUpEquipSkill2){
      selectEquipIndex = 1;
    }else if(selectDiv === popUpEquipSkill3){
      selectEquipIndex = 2;
    }else if(selectDiv === popUpEquipSkill4){
      selectEquipIndex = 3;
    }else if(selectDiv === popUpEquipPassiveSkill){
      selectEquipIndex = -1;
    }
  }
  var skillIndex = parseInt(selectDiv.getAttribute('skillIndex'));

  if(selectedPanel){
    if(selectedPanel !== selectPanel){
      //exchange
      if(selectedPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
        //find skill in container
        //selected === equipSkill selectDiv === container skill
        if(selectEquipIndex === -1){
          makeFlashMessage('cant change base skill');
          // alert('cant change base skill');
        }else{
          var nodeIndex = 0;
          for(var i=0; i<popUpSkillContainer.childNodes.length; i++){
            if(popUpSkillContainer.childNodes[i] === selectedDiv){
              nodeIndex = i;
              break;
            }
          }
          popUpSkillContainer.removeChild(selectedDiv);
          if(skillIndex){
            var beforeSkillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
            var skillDiv = document.createElement('div');
            var skillImg = document.createElement('img');
            skillDiv.setAttribute('skillIndex', skillIndex);

            skillDiv.classList.add('popUpSkillContainerItem');
            skillImg.src = beforeSkillData.skillIcon;
            skillDiv.appendChild(skillImg);

            popUpSkillContainer.insertBefore(skillDiv, popUpSkillContainer.childNodes[nodeIndex]);
            // popUpSkillContainer.appendChild(skillDiv);

            skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
          }

          while (selectDiv.firstChild) {
            selectDiv.removeChild(selectDiv.firstChild);
          }

          //data change
          equipSkills.splice(selectEquipIndex, 1);
          equipSkillDatas.splice(selectEquipIndex, 1);

          equipSkills.splice(selectEquipIndex, 0, selectedSkillIndex);
          var skillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
          equipSkillDatas.splice(selectEquipIndex, 0, skillData);

          var skillImg = document.createElement('img');
          skillImg.src = skillData.skillIcon;
          selectDiv.setAttribute('skillIndex', skillData.index);
          selectDiv.appendChild(skillImg);
        }
      }else{
        if(selectedEquipIndex === -1){
          makeFlashMessage('cant change base skill');
          // alert('cant change base skill');
        }else{
          var nodeIndex = 0;
          for(var i=0; i<popUpSkillContainer.childNodes.length; i++){
            if(popUpSkillContainer.childNodes[i] === selectDiv){
              nodeIndex = i;
              break;
            }
          }
          popUpSkillContainer.removeChild(selectDiv);
          if(selectedSkillIndex){
            var beforeSkillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
            var skillDiv = document.createElement('div');
            var skillImg = document.createElement('img');

            skillDiv.setAttribute('skillIndex', selectedSkillIndex);

            skillDiv.classList.add('popUpSkillContainerItem');
            skillImg.src = beforeSkillData.skillIcon;
            skillDiv.appendChild(skillImg);
            popUpSkillContainer.insertBefore(skillDiv, popUpSkillContainer.childNodes[nodeIndex]);
            // popUpSkillContainer.appendChild(skillDiv);

            skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
          }

          while (selectedDiv.firstChild) {
            selectedDiv.removeChild(selectedDiv.firstChild);
          }

          //data change
          equipSkills.splice(selectedEquipIndex, 1);
          equipSkillDatas.splice(selectedEquipIndex, 1);

          equipSkills.splice(selectedEquipIndex, 0, skillIndex);
          var skillData = Object.assign({}, util.findData(skillTable, 'index', skillIndex));
          equipSkillDatas.splice(selectedEquipIndex, 0, skillData);

          var skillImg = document.createElement('img');
          skillImg.src = skillData.skillIcon;
          selectedDiv.setAttribute('skillIndex', skillData.index);
          selectedDiv.appendChild(skillImg);
        }
      }
      this.onExchangeSkill();
      //set equipSkills
      if(skillData && beforeSkillData){
        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE && beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          console.log(beforeSkillData.index + ' : ' + skillData.index);
          var beforeBuffIndex = Object.assign({}, util.findData(skillTable, 'index', beforeSkillData.index)).buffToSelf;
          var afterBuffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          this.onExchangePassive(beforeBuffIndex, afterBuffIndex);
        }else if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          var buffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          this.onEquipPassive(buffIndex);
        }else if(beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = Object.assign({}, util.findData(skillTable, 'index', beforeSkillData.index)).buffToSelf;
          this.onUnequipPassive(buffIndex);
        }
      }else if(skillData){
        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          this.onEquipPassive(buffIndex);
        }
      }else if(beforeSkillData){
        if(beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = Object.assign({}, util.findData(skillTable, 'index', beforeSkillData.index)).buffToSelf;
          this.onUnequipPassive(buffIndex);
        }
      }

      this.setHUDSkills();

      selectedSkillIndex = null;
      selectedPanel = null;
      selectedDiv = null;
      selectedEquipIndex = null;

    }else if(skillIndex === selectedSkillIndex){
      //if click same icon
      if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP && selectEquipIndex !== -1){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
        var skillDiv = document.createElement('div');
        var skillImg = document.createElement('img');

        skillDiv.setAttribute('skillIndex', selectedSkillIndex);

        skillDiv.classList.add('popUpSkillContainerItem');
        skillImg.src = skillData.skillIcon;
        skillDiv.appendChild(skillImg);
        popUpSkillContainer.appendChild(skillDiv);

        skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);

        while (selectedDiv.firstChild) {
          selectedDiv.removeChild(selectedDiv.firstChild);
          selectedDiv.setAttribute('skillIndex', '');
        }

        //data delete
        if(equipSkills[selectedEquipIndex]){
          equipSkills.splice(selectedEquipIndex, 1);
          equipSkillDatas.splice(selectedEquipIndex, 1);
        }
        equipSkills.splice(selectedEquipIndex, 0, undefined);
        equipSkillDatas.splice(selectedEquipIndex, 0, undefined);

        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          var buffIndex = Object.assign({}, util.findData(skillTable, 'index', skillData.index)).buffToSelf;
          console.log(buffIndex);
          this.onUnequipPassive(buffIndex);
        }
      }

      this.setHUDSkills();

      selectedSkillIndex = null;
      selectedPanel = null;
      selectedDiv = null;
      selectedEquipIndex = null;
    }else{
      selectedSkillIndex = skillIndex ? skillIndex : null;
      selectedPanel = selectPanel;
      selectedDiv = selectDiv;
      selectedEquipIndex = selectEquipIndex;

      selectDiv.classList.add('selected');
      if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
        popUpEquipSkill1.classList.add('equipable');
        popUpEquipSkill2.classList.add('equipable');
        popUpEquipSkill3.classList.add('equipable');
        popUpEquipSkill4.classList.add('equipable');
      }else if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
        switch (selectEquipIndex) {
          case -1:
            //case base or inherentPassiveSkill
            break;
          default:
            for(var i=0; i<popUpSkillContainer.children.length; i++){
              popUpSkillContainer.children[i].classList.add('equipable');
            }
        }
      }
    }
  }else{
    selectedSkillIndex = skillIndex ? skillIndex : null;
    selectedPanel = selectPanel;
    selectedDiv = selectDiv;
    selectedEquipIndex = selectEquipIndex;

    selectDiv.classList.add('selected');
    if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
      popUpEquipSkill1.classList.add('equipable');
      popUpEquipSkill2.classList.add('equipable');
      popUpEquipSkill3.classList.add('equipable');
      popUpEquipSkill4.classList.add('equipable');
    }else if(selectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
      switch (selectEquipIndex) {
        case -1:
          //case base or inherentPassiveSkill
          break;
        default:
          for(var i=0; i<popUpSkillContainer.children.length; i++){
            popUpSkillContainer.children[i].classList.add('equipable');
          }
      }
    }
  }
  if(this.checkPopUpSkillChange()){
    this.setPopUpSkillChange();
    selectedSkillIndex = null;
    selectedPanel = null;
    selectedDiv = null;
    selectedEquipIndex = null;
    clearPopSkillChangeClass();
    this.updateSelectedPanel();
  }else{
    this.updateSelectedPanel(selectedSkillIndex);
  }
  // //set info panel
  // while (popUpSkillInfoIcon.firstChild) {
  //   popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
  // }
  // while (popUpSkillInfoDesc.firstChild) {
  //   popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
  // }
  // if(selectedSkillIndex){
  //   var skillData = Object.assign({}, util.findData(skillTable, 'index', selectedSkillIndex));
  //   var skillImg = document.createElement('img');
  //   var skillDesc = document.createElement('p');
  //
  //   skillImg.src = skillData.skillIcon;
  //   skillDesc.innerHTML = skillData.clientName;
  //   popUpSkillUpgradeCostGold.innerHTML = skillData.upgradeGoldAmount;
  //   popUpSkillUpgradeCostJewel.innerHTML = skillData.upgradeJewelAmount;
  //
  //   popUpSkillInfoIcon.appendChild(skillImg);
  //   popUpSkillInfoDesc.appendChild(skillDesc);
  //   // popUpSkillUpgradeBtn.addEventListener('click', skillUpgradeBtnHandler, false);
  //   popUpSkillUpgradeBtn.onclick = skillUpgradeBtnHandler.bind(this)
  // }else{
  //   popUpSkillUpgradeBtn.onclick = new Function();
  //   // popUpSkillUpgradeBtn.removeEventListener('click', skillUpgradeBtnHandler, false);
  // }
  // console.log(selectedSkillIndex);
};
function skillUpgradeBtnHandler(skillData){
  if(isServerResponse){
    if(selectedSkillIndex){
      //check resource
      var goldAmount = parseInt(goldContainer.innerHTML);
      var jewelAmount = parseInt(jewelContainer.innerHTML);
      if(goldAmount >= skillData.upgradeGoldAmount && jewelAmount >= skillData.upgradeJewelAmount){
        this.onSkillUpgrade(selectedSkillIndex);
        isServerResponse = false;
        this.serverResponseTimeout = setTimeout(function(){
          if(!isServerResponse){
            isServerResponse = true;
          }
        }, gameConfig.MAX_SERVER_RESPONSE_TIME);
      }else{
        makeFlashMessage('need more resource');
        // alert('need more resource');
      }
    }
  }
};
function startBtnClickHandler(button){
  if(button === startButton){
    var clickButton = gameConfig.START_BUTTON;
  }else if(button === restartButton){
    clickButton = gameConfig.RESTART_BUTTON;
  }
  this.onStartBtnClick(characterType, clickButton);
};
function cooldownListener(slot, e){
  this.classList.remove("cooldownMaskAni");
  this.style.opacity = 0;
  switch (slot) {
    case gameConfig.SKILL_BASIC_INDEX:
      isUseableBaseSkill = true;
      break;
    case gameConfig.SKILL_EQUIP1_INDEX:
      isUseableEquipSkill1 = true;
      break;
    case gameConfig.SKILL_EQUIP2_INDEX:
      isUseableEquipSkill2 = true;
      break;
    case gameConfig.SKILL_EQUIP3_INDEX:
      isUseableEquipSkill3 = true;
      break;
    case gameConfig.SKILL_EQUIP4_INDEX:
      isUseableEquipSkill4 = true;
      break;
    default:
  }
};
function bottomSkillTooltipOnHandler(slot){
  switch (slot) {
    case gameConfig.SKILL_BASIC_INDEX:
      if(baseSkillData){
        var skillData = baseSkillData;
      }
      break;
    case gameConfig.SKILL_EQUIP1_INDEX:
      if(equipSkillDatas[0]){
        skillData = equipSkillDatas[0];
      }
      break;
    case gameConfig.SKILL_EQUIP2_INDEX:
      if(equipSkillDatas[1]){
        skillData = equipSkillDatas[1];
      }
      break;
    case gameConfig.SKILL_EQUIP3_INDEX:
      if(equipSkillDatas[2]){
        skillData = equipSkillDatas[2];
      }
      break;
    case gameConfig.SKILL_EQUIP4_INDEX:
      if(equipSkillDatas[3]){
        skillData = equipSkillDatas[3];
      }
      break;
    case gameConfig.SKILL_PASSIVE_INDEX:
      if(inherentPassiveSkillData){
        skillData = inherentPassiveSkillData;
      }
      break;
    default:
  }
  if(skillData){
    var tooltipDiv = document.createElement('div');
    tooltipDiv.innerHTML = skillData.name;
    tooltipDiv.classList.add('bottomTooltip');

    var parentDiv = this.parentNode;
    parentDiv.appendChild(tooltipDiv);
  }
};
function bottomSkillTooltipOffHandler(){
  var parentDiv = this.parentNode;
  var tooltipDivs = parentDiv.getElementsByTagName('div');
  for(var i=0; tooltipDivs.length; i++){
    parentDiv.removeChild(tooltipDivs[i]);
  }
};
function bottomTooltipOnHandler(type){
  var tooltipDiv = document.createElement('div');
  switch (type) {
    case gameConfig.STAT_POWER_INDEX:
      tooltipDiv.innerHTML = statPower;
      break;
    case gameConfig.STAT_MAGIC_INDEX:
      tooltipDiv.innerHTML = statMagic;
      break;
    case gameConfig.STAT_SPEED_INDEX:
      tooltipDiv.innerHTML = statSpeed;
      break;
    case gameConfig.BUFF_ICON_INDEX:
      var buffGroupIndex = parseInt(this.getAttribute('buffGroupIndex'));
      var buffGroupData = Object.assign({}, util.findData(buffGroupTable, 'index', buffGroupIndex));
      tooltipDiv.innerHTML = buffGroupData.name;
      break;
    default:
  }
  tooltipDiv.classList.add('bottomTooltip');
  this.appendChild(tooltipDiv);
};
function clearSelectedPanel(){
  while(popUpSkillInfoIcon.firstChild){
    popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
  }
  while(popUpSkillInfoDesc.firstChild){
    popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
  }
  selectedSkillIndex = null;
  popUpSkillUpgradeBtn.onclick = new Function();

  selectedPanel = null;
  selectedDiv = null;
  selectedEquipIndex = null;
};
function clearPopSkillChangeClass(){
  popUpEquipBaseSkill.classList.remove('selected');
  popUpEquipPassiveSkill.classList.remove('selected');
  popUpEquipSkill1.classList.remove('selected');
  popUpEquipSkill2.classList.remove('selected');
  popUpEquipSkill3.classList.remove('selected');
  popUpEquipSkill4.classList.remove('selected');

  popUpEquipSkill1.classList.remove('equipable');
  popUpEquipSkill2.classList.remove('equipable');
  popUpEquipSkill3.classList.remove('equipable');
  popUpEquipSkill4.classList.remove('equipable');

  for(var i=0; i<popUpSkillContainer.children.length; i++){
    popUpSkillContainer.children[i].classList.remove('equipable');
    popUpSkillContainer.children[i].classList.remove('selected');
  }
};
function bottomTooltipOffHandler(){
  var tooltipDivs = util.getElementsByClassName(this, 'bottomTooltip');
  for(var i=0; i<tooltipDivs.length; i++){
    this.removeChild(tooltipDivs[i]);
  }
};
function onSkillIconClickHandler(skillSlot){
  this.onSkillIconClick(skillSlot);
};
function onSelectSkillCancelBtnClickHandler(){
  this.onSelectSkillCancelBtnClick();
};
function makeFlashMessage(msg){
  var message = document.createElement('p');
  message.innerHTML = msg;
  message.classList.add('flashMessage');
  flashMessageContainer.appendChild(message);
  // centerMessageContainer.insertBefore(messageDiv, centerMessageContainer.childNodes[0]);
  setTimeout(function(){
    flashMessageContainer.removeChild(message);
  }, 5000);
};
module.exports = UIManager;
