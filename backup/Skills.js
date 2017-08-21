var Projectile = function(){
  this.objectID = ;
  this.userID = ;

  this.position = {};
  this.size = {};
  this.speed = {};
  this.damage = ;
  this.buffsToTarget = [];
  this.debuffsToTarget = [];

  this.timer = Date.now();

  this.startTime = ;
  this.lifeTime = ;

  this.colliderEle = {
    id : ,
    objectID : ,
    x : ,
    y : ,
    width : ,
    height : ,

  }
};
Projectile.prototype = {
  move : function(){

  },
  isExpired : function(){

  },
  explode : function(){

  }
}


module.exports.Projectile = Projectile

"PLUS_SIZE_WIDTH" : 500,
"PLUS_SIZE_HEIGHT" : 500,

알릴 내역
maxHP, maxMP, HP, MP 변경
castSpeed
speed(move, rotate)
상태 변경


스킬 관련 작업
충돌 시 affectedEles 처리
유저 takeDamage 함수 변경
chest takeDamage 함수 변경
스킬 사용 시 힐 추가
obj 충돌 시 처리 변경(getObj, deleteOBJ 함수 변경)
유저 레벨 업그레이드 시 hp, mp 추가 회복
클라이언트 캐스트 속도 처리
user stat 변경 시 알림 처리
클라이언트에 알림(폭발, 삭제)

유저 마나 부족 시 캐스팅 취소 추가.

지속 데미지로 죽을 경우 actorID 처리
스킬 이펙트 출력 위치 재조정
유저 상태에 따른 스킬 영향 추가
deleteObj function 삭제
자신에게 죽을 수 있음.
버프 추가 확인
시작 타입 변경
projectiel 화살표 이미지로 변경

테스트(스킬 버프, startTime 중복)
css 중앙 정렬
메인 화면 기획
일러스트 애니메이션
스킬 데이터 추가
