var util = require('../public/util.js');
var gameConfig = require('../public/gameConfig.json');
var skillTable, buffGroupTable;

var startScene, gameScene, standingScene;
var startButton;

// var startSceneHudCenterCenterChar1, startSceneHudCenterCenterChar2, startSceneHudCenterCenterChar3;
var characterType = 1;

var baseSkill = 0;
var baseSkillData = null;
var inherentPassiveSkill = 0;
var inherentPassiveSkillData = null;
var equipSkills = new Array(4);
var equipSkillDatas = new Array(4);
var possessSkills = [];

var hudBaseSkill, hudEquipSkill1, hudEquipSkill2, hudEquipSkill3, hudEquipSkill4, hudPassiveSkill;
var hudBtnSkillChange;
var gameSceneBuffsContainer;
var userHPProgressBar, userMPProgressBar, userExpProgressBar;

var popUpSkillChange, popUpSkillContainer, popUpBackground;
var popUpSkillInfoIcon, popUpSkillInfoDesc, popUpSkillUpgradeBtn;
var popUpEquipBaseSkill, popUpEquipSkill1, popUpEquipSkill2, popUpEquipSkill3, popUpEquipSkill4, popUpEquipPassiveSkill;

var sellectedPanel = null;
var sellectedDiv = null;
var sellectedEquipIndex = null;
var sellectedSkillIndex = null;

var isServerResponse = true;

function UIManager(sTable, bTable){
  skillTable = sTable;
  buffGroupTable = bTable;

  this.serverResponseTimeout = false;

  this.onStartBtnClick = new Function();

  this.onSkillUpgrade = new Function();
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
    startButton.onclick = startBtnClickHandler.bind(this);

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
  initHUD : function(){
    hudBaseSkill = document.getElementById('hudBaseSkill');
    hudEquipSkill1 = document.getElementById('hudEquipSkill1');
    hudEquipSkill2 = document.getElementById('hudEquipSkill2');
    hudEquipSkill3 = document.getElementById('hudEquipSkill3');
    hudEquipSkill4 = document.getElementById('hudEquipSkill4');
    hudPassiveSkill = document.getElementById('hudPassiveSkill');

    hudBtnSkillChange = document.getElementById('hudBtnSkillChange');

    gameSceneBuffsContainer = document.getElementById('gameSceneBuffsContainer');
    userHPProgressBar = document.getElementById('userHPProgressBar');
    userExpProgressBar = document.getElementById('userExpProgressBar');
    userMPProgressBar = document.getElementById('userMPProgressBar');
  },
  drawStartScene : function(){
    startScene.classList.add('enable');
    startScene.classList.remove('disable');
    gameScene.classList.add('disable');
    gameScene.classList.remove('enable');
    standingScene.classList.add('disable');
    standingScene.classList.remove('enable');
  },
  drawGameScene : function(){
    startScene.classList.add('disable');
    startScene.classList.remove('enable');
    gameScene.classList.add('enable');
    gameScene.classList.remove('disable');
    standingScene.classList.add('disable');
    standingScene.classList.remove('enable');
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
  userSkill : function(skillData){

  },
  setHUDSkills : function(){
    while (hudBaseSkill.firstChild) {
      hudBaseSkill.removeChild(hudBaseSkill.firstChild);
    }
    while (hudEquipSkill1.firstChild) {
      hudEquipSkill1.removeChild(hudEquipSkill1.firstChild);
    }
    while (hudEquipSkill2.firstChild) {
      hudEquipSkill2.removeChild(hudEquipSkill2.firstChild);
    }
    while (hudEquipSkill3.firstChild) {
      hudEquipSkill3.removeChild(hudEquipSkill3.firstChild);
    }
    while (hudEquipSkill4.firstChild) {
      hudEquipSkill4.removeChild(hudEquipSkill4.firstChild);
    }
    while (hudPassiveSkill.firstChild) {
      hudPassiveSkill.removeChild(hudPassiveSkill.firstChild);
    }
    hudBaseSkill.innerHtml = '';
    hudEquipSkill1.innerHtml = '';
    hudEquipSkill2.innerHtml = '';
    hudEquipSkill3.innerHtml = '';
    hudEquipSkill4.innerHtml = '';
    hudPassiveSkill.innerHtml = '';

    var baseImg = document.createElement('img');
    baseImg.src = baseSkillData.skillIcon;
    hudBaseSkill.appendChild(baseImg);

    var inherentPassiveSkillImg = document.createElement('img');
    inherentPassiveSkillImg.src = inherentPassiveSkillData.skillIcon;
    hudPassiveSkill.appendChild(inherentPassiveSkillImg);

    if(equipSkillDatas[0]){
      var equipSkills1 = document.createElement('img');
      equipSkills1.src = equipSkillDatas[0].skillIcon;
      hudEquipSkill1.appendChild(equipSkills1);
    }
    if(equipSkillDatas[1]){
      var equipSkills2 = document.createElement('img');
      equipSkills2.src = equipSkillDatas[1].skillIcon;
      hudEquipSkill2.appendChild(equipSkills2);
    }
    if(equipSkillDatas[2]){
      var equipSkills3 = document.createElement('img');
      equipSkills3.src = equipSkillDatas[2].skillIcon;
      hudEquipSkill3.appendChild(equipSkills3);
      }
    if(equipSkillDatas[3]){
      var equipSkills4 = document.createElement('img');
      equipSkills4.src = equipSkillDatas[3].skillIcon;
      hudEquipSkill4.appendChild(equipSkills4);
    }
  },
  setSkillChangeBtn : function(){
    hudBtnSkillChange.onclick = function(){
      popChange(popUpSkillChange);
    }
    popUpBackground.onclick = function(){
      popChange(popUpSkillChange);
    }
  },
  updateBuffIcon : function(passiveList, buffList){
    while(gameSceneBuffsContainer.firstChild){
      gameSceneBuffsContainer.removeChild(gameSceneBuffsContainer.firstChild);
    }
    gameSceneBuffsContainer.innerHtml = '';
    for(var i=0; i<passiveList.length; i++){
      var passiveData = util.findData(buffGroupTable, 'index', passiveList[i]);
      var div = document.createElement('div');
      var img = document.createElement('img');
      img.src = passiveData.buffIcon;
      div.appendChild(img);
      gameSceneBuffsContainer.appendChild(div);
    }
    for(var i=0; i<buffList.length; i++){
      var buffData = util.findData(buffGroupTable, 'index', buffList[i].index);
      var div = document.createElement('div');
      var img = document.createElement('img');
      img.src = buffData.buffIcon;
      div.appendChild(img);
      gameSceneBuffsContainer.appendChild(div);
    }
  },
  initPopUpSkillChanger : function(){
    popUpSkillChange = document.getElementById('popUpSkillChange');
    popUpSkillContainer = document.getElementById('popUpSkillContainer');
    popUpBackground = document.getElementById('popUpBackground');

    popUpSkillInfoIcon = document.getElementById('popUpSkillInfoIcon');
    popUpSkillInfoDesc = document.getElementById('popUpSkillInfoDesc');
    popUpSkillUpgradeBtn = document.getElementById('popUpSkillUpgradeBtn');

    popUpEquipBaseSkill = document.getElementById('popUpEquipBaseSkill');
    popUpEquipSkill1 = document.getElementById('popUpEquipSkill1');
    popUpEquipSkill2 = document.getElementById('popUpEquipSkill2');
    popUpEquipSkill3 = document.getElementById('popUpEquipSkill3');
    popUpEquipSkill4 = document.getElementById('popUpEquipSkill4');
    popUpEquipPassiveSkill = document.getElementById('popUpEquipPassiveSkill');
  },
  upgradeBaseSkill : function(afterSkillIndex, afterSkillData){
    var beforeSkillIndex = baseSkill;
    baseSkill = afterSkillIndex;
    baseSkillData = afterSkillData;
    if(sellectedSkillIndex === beforeSkillIndex){
      this.updateSellectedPanel(afterSkillIndex);
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
    if(sellectedSkillIndex === beforeSkillIndex){
      this.updateSellectedPanel(afterSkillIndex);
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
        var skillData = util.findData(skillTable, 'index', afterSkillIndex);
        equipSkillDatas.splice(index, 1, skillData);
        break;
      }
    }
    if(sellectedSkillIndex === beforeSkillIndex){
      this.updateSellectedPanel(afterSkillIndex);
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
    var afterData = util.findData(skillTable, 'index', afterSkillIndex);
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
        var skillData = util.findData(skillTable, 'index', possessSkills[i]);
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
  updateSellectedPanel : function(skillIndex){
    while(popUpSkillInfoIcon.firstChild){
      popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
    }
    while(popUpSkillInfoDesc.firstChild){
      popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
    }
    sellectedSkillIndex = skillIndex;

    var skillData = util.findData(skillTable, 'index', skillIndex);
    var skillImg = document.createElement('img');
    var skillDesc = document.createElement('p');

    skillImg.src = skillData.skillIcon;
    skillDesc.innerHTML = skillData.clientName;

    popUpSkillInfoIcon.appendChild(skillImg);
    popUpSkillInfoDesc.appendChild(skillDesc);
    // popUpSkillUpgradeBtn.addEventListener('click', skillUpgradeBtnHandler, false);
    popUpSkillUpgradeBtn.onclick = skillUpgradeBtnHandler.bind(this, skillData)
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

function changeEquipSkillHandler(sellectDiv, sellectPanel){
  var sellectEquipIndex = null ;
  if(sellectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP){
    //set sellectedEquipIndex
    if(sellectDiv === popUpEquipBaseSkill){
      sellectEquipIndex = -1;
    }else if(sellectDiv === popUpEquipSkill1){
      sellectEquipIndex = 0;
    }else if(sellectDiv === popUpEquipSkill2){
      sellectEquipIndex = 1;
    }else if(sellectDiv === popUpEquipSkill3){
      sellectEquipIndex = 2;
    }else if(sellectDiv === popUpEquipSkill4){
      sellectEquipIndex = 3;
    }else if(sellectDiv === popUpEquipPassiveSkill){
      sellectEquipIndex = -1;
    }
  }
  var skillIndex = parseInt(sellectDiv.getAttribute('skillIndex'));

  if(sellectedPanel){
    if(sellectedPanel !== sellectPanel){
      //exchange
      if(sellectedPanel === gameConfig.SKILL_CHANGE_PANEL_CONTAINER){
        //find skill in container
        //sellected === equipSkill sellectDiv === container skill
        if(sellectEquipIndex === -1){
          alert('cant change base skill');
        }else{
          var nodeIndex = 0;
          for(var i=0; i<popUpSkillContainer.childNodes.length; i++){
            if(popUpSkillContainer.childNodes[i] === sellectedDiv){
              nodeIndex = i;
              break;
            }
          }
          popUpSkillContainer.removeChild(sellectedDiv);
          if(skillIndex){
            var beforeSkillData = util.findData(skillTable, 'index', skillIndex);
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

          while (sellectDiv.firstChild) {
            sellectDiv.removeChild(sellectDiv.firstChild);
          }

          //data change
          equipSkills.splice(sellectEquipIndex, 1);
          equipSkillDatas.splice(sellectEquipIndex, 1);

          equipSkills.splice(sellectEquipIndex, 0, sellectedSkillIndex);
          var skillData = util.findData(skillTable, 'index', sellectedSkillIndex);
          equipSkillDatas.splice(sellectEquipIndex, 0, skillData);

          var skillImg = document.createElement('img');
          skillImg.src = skillData.skillIcon;
          sellectDiv.setAttribute('skillIndex', skillData.index);
          sellectDiv.appendChild(skillImg);
        }
      }else{
        if(sellectedEquipIndex === -1){
          alert('cant change base skill');
        }else{
          var nodeIndex = 0;
          for(var i=0; i<popUpSkillContainer.childNodes.length; i++){
            if(popUpSkillContainer.childNodes[i] === sellectDiv){
              nodeIndex = i;
              break;
            }
          }
          popUpSkillContainer.removeChild(sellectDiv);
          if(sellectedSkillIndex){
            var beforeSkillData = util.findData(skillTable, 'index', sellectedSkillIndex);
            var skillDiv = document.createElement('div');
            var skillImg = document.createElement('img');

            skillDiv.setAttribute('skillIndex', sellectedSkillIndex);

            skillDiv.classList.add('popUpSkillContainerItem');
            skillImg.src = beforeSkillData.skillIcon;
            skillDiv.appendChild(skillImg);
            popUpSkillContainer.insertBefore(skillDiv, popUpSkillContainer.childNodes[nodeIndex]);
            // popUpSkillContainer.appendChild(skillDiv);

            skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);
          }

          while (sellectedDiv.firstChild) {
            sellectedDiv.removeChild(sellectedDiv.firstChild);
          }

          //data change
          equipSkills.splice(sellectedEquipIndex, 1);
          equipSkillDatas.splice(sellectedEquipIndex, 1);

          equipSkills.splice(sellectedEquipIndex, 0, skillIndex);
          var skillData = util.findData(skillTable, 'index', skillIndex);
          equipSkillDatas.splice(sellectedEquipIndex, 0, skillData);

          var skillImg = document.createElement('img');
          skillImg.src = skillData.skillIcon;
          sellectedDiv.setAttribute('skillIndex', skillData.index);
          sellectedDiv.appendChild(skillImg);
        }
      }
      //set equipSkills
      if(skillData && beforeSkillData){
        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE && beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          console.log(beforeSkillData.index + ' : ' + skillData.index);
          var beforeBuffIndex = util.findData(skillTable, 'index', beforeSkillData.index).buffToSelf;
          var afterBuffIndex = util.findData(skillTable, 'index', skillData.index).buffToSelf;
          this.onExchangePassive(beforeBuffIndex, afterBuffIndex);
        }else if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          var buffIndex = util.findData(skillTable, 'index', skillData.index).buffToSelf;
          this.onEquipPassive(buffIndex);
        }else if(beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = util.findData(skillTable, 'index', beforeSkillData.index).buffToSelf;
          this.onUnequipPassive(buffIndex);
        }
      }else if(skillData){
        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = util.findData(skillTable, 'index', skillData.index).buffToSelf;
          console.log(buffIndex);
          this.onEquipPassive(buffIndex);
        }
      }else if(beforeSkillData){
        if(beforeSkillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          buffIndex = util.findData(skillTable, 'index', beforeSkillData.index).buffToSelf;
          this.onUnequipPassive(buffIndex);
        }
      }

      this.setHUDSkills();

      sellectedSkillIndex = null;
      sellectedPanel = null;
      sellectedDiv = null;
      sellectedEquipIndex = null;

    }else if(skillIndex === sellectedSkillIndex){
      //if click same icon
      if(sellectPanel === gameConfig.SKILL_CHANGE_PANEL_EQUIP && sellectEquipIndex !== -1){
        var skillData = util.findData(skillTable, 'index', sellectedSkillIndex);
        var skillDiv = document.createElement('div');
        var skillImg = document.createElement('img');

        skillDiv.setAttribute('skillIndex', sellectedSkillIndex);

        skillDiv.classList.add('popUpSkillContainerItem');
        skillImg.src = skillData.skillIcon;
        skillDiv.appendChild(skillImg);
        popUpSkillContainer.appendChild(skillDiv);

        skillDiv.onclick = changeEquipSkillHandler.bind(this, skillDiv, gameConfig.SKILL_CHANGE_PANEL_CONTAINER);

        while (sellectedDiv.firstChild) {
          sellectedDiv.removeChild(sellectedDiv.firstChild);
          sellectedDiv.setAttribute('skillIndex', '');
        }

        //data delete
        if(equipSkills[sellectedEquipIndex]){
          equipSkills.splice(sellectedEquipIndex, 1);
          equipSkillDatas.splice(sellectedEquipIndex, 1);
        }
        equipSkills.splice(sellectedEquipIndex, 0, undefined);
        equipSkillDatas.splice(sellectedEquipIndex, 0, undefined);

        if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
          var buffIndex = util.findData(skillTable, 'index', skillData.index).buffToSelf;
          console.log(buffIndex);
          this.onUnequipPassive(buffIndex);
        }
      }


      this.setHUDSkills();

      sellectedSkillIndex = null;
      sellectedPanel = null;
      sellectedDiv = null;
      sellectedEquipIndex = null;
    }else{
      sellectedSkillIndex = skillIndex ? skillIndex : null;
      sellectedPanel = sellectPanel;
      sellectedDiv = sellectDiv;
      sellectedEquipIndex = sellectEquipIndex;
    }
  }else{
    sellectedSkillIndex = skillIndex ? skillIndex : null;
    sellectedPanel = sellectPanel;
    sellectedDiv = sellectDiv;
    sellectedEquipIndex = sellectEquipIndex;
  }

  //set info panel
  while (popUpSkillInfoIcon.firstChild) {
    popUpSkillInfoIcon.removeChild(popUpSkillInfoIcon.firstChild);
  }
  while (popUpSkillInfoDesc.firstChild) {
    popUpSkillInfoDesc.removeChild(popUpSkillInfoDesc.firstChild);
  }
  while (popUpSkillUpgradeBtn.firstChild) {
    popUpSkillUpgradeBtn.removeChild(popUpSkillUpgradeBtn.firstChild);
  }
  if(sellectedSkillIndex){
    var skillData = util.findData(skillTable, 'index', sellectedSkillIndex);
    var skillImg = document.createElement('img');
    var skillDesc = document.createElement('p');

    skillImg.src = skillData.skillIcon;
    skillDesc.innerHTML = skillData.clientName;

    popUpSkillInfoIcon.appendChild(skillImg);
    popUpSkillInfoDesc.appendChild(skillDesc);
    // popUpSkillUpgradeBtn.addEventListener('click', skillUpgradeBtnHandler, false);
    popUpSkillUpgradeBtn.onclick = skillUpgradeBtnHandler.bind(this, skillData)
  }else{
    popUpSkillUpgradeBtn.onclick = new Function();
    // popUpSkillUpgradeBtn.removeEventListener('click', skillUpgradeBtnHandler, false);
  }
  console.log(sellectedSkillIndex);
};
function skillUpgradeBtnHandler(){
  if(isServerResponse){
    this.onSkillUpgrade(sellectedSkillIndex);
    isServerResponse = false;
    this.serverResponseTimeout = setTimeout(function(){
      if(!isServerResponse){
        isServerResponse = true;
      }
    }, gameConfig.MAX_SERVER_RESPONSE_TIME);
  }
};
function startBtnClickHandler(){
  this.onStartBtnClick(characterType);
};
module.exports = UIManager;
