function fillResultsData(data) 
{
  let tps = document.querySelector("#tpsTravel")
  let nbKm = document.querySelector("#nbKms")
  if(data.distance == 0 || data.duration == 0) { return; }

  let time = new Date(data.duration * 1000).toISOString().substr(11, 8);
  let tabTime = time.split(':');
  let h = tabTime[0] != "00" ? parseInt(tabTime[0]) + " heures" : "";
  let m = " " + parseInt(tabTime[1]) + " minutes"
  tps.textContent = h +  m;
  
  let nbkm = Number.parseFloat(data.distance / 1000, 3).toFixed(2);
  nbKm.textContent = nbkm + " Km";

  let carData = getCurrentCarData();
  if(carData == undefined){return;}

  calcTravel(nbkm, 80, carData['model'].cap, carData['model'].cons)

}

function calculateTravel() {
  let cap = document.querySelector("#cap").textContent
  let cons = document.querySelector("#cons").textContent

  if (isNaN(cap) || cap == "" || isNaN(cons) || cons == "") { return; }

  console.log("calculation");
}



// initMap();
