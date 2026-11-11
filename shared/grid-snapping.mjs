// Grid coordinates are metres; a zero step disables snapping.
export class GridSnappingManager {
 constructor(step=0.1){this.setStep(step)}
 setStep(step){
  if(!Number.isFinite(step)||step<0)throw Error('Invalid snapping step');
  this.gridStep=step;
  this.enabled=step>0;
 }
 snap(value){
  if(!Number.isFinite(value))throw Error('Invalid coordinate');
  if(!this.enabled)return value;
  return Math.round((value/this.gridStep)+Number.EPSILON)*this.gridStep;
 }
 snapPosition(position){
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))throw Error('Invalid position');
  position.x=this.snap(position.x);
  position.z=this.snap(position.z);
  return position;
 }
}
