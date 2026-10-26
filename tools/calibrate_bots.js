// Banc de calibration des bots : statistiques de population par profil (tables homogènes, noms uniques), mesurées par l'analyseur d'historiques.
// Usage : node tools/calibrate_bots.js [chemin de table.js]
const E=require('../src/engine.js'),H=require('../src/hh.js');
const T=require(process.argv[2] || '../src/table.js');
const out={};
for (const prof of ['reg','station','nit','maniaque']) {
 const tb=new T.Table({random:E.rng(9),lineup:[prof,prof,prof,prof,prof]}); tb.players.forEach((p,i)=>{ if(i) p.name=prof+'_'+i; }); const parts=[];
 for(let h=1;h<=3000;h++){tb.newHand();let k=0;while(!tb.done&&k++<300){tb.runBots();if(!tb.done)tb.autoHero('reg');}if(h%300===0)parts.push(tb.exportHH());}
 const a=H.analyze(parts.join('\n\n')),P=a.pool,f=(x,n)=>n?(100*x/n).toFixed(0)+'%':'-';
 out[prof]={VPIP:f(P.vpip,P.hands),PFR:f(P.pfr,P.hands),'3bet':f(P.three,P.threeOpp),F3:f(P.f3,P.f3Opp),cbet:f(P.cbet,P.cbetOpp),FtC:f(P.ftc,P.ftcOpp),WTSD:f(P.sd,P.sawFlop),rvFold:f(P.rvFold,P.rvFace), heroBB100:(a.me.netBB/a.me.hands*100).toFixed(0)};
}
console.table(out);
