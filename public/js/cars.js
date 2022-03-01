function changeCar(i) {

  if (i != "") {

    socket.emit("fetchCarData", i);

    socket.on("getCarData", (car) => {

      let labelCap = document.getElementById("cap");
      let labelCons = document.getElementById("cons");
      let model = document.getElementById("modelName");

      labelCap.innerHTML = car.capacity;
      labelCons.innerHTML = car.consommationPer100;
      model.innerText = car.model;

    })
  }
}

function getCurrentCarData()
{
  let model = document.getElementById("modelName").textContent;
  let cap = document.querySelector("#cap").textContent
  let cons = document.querySelector("#cons").textContent
  if(cap == "" || cons == ""){ return;}

  return {model: {model, cap, cons}}
}



function calcTravelTime() {
  let nbkm = document.querySelector("#distance").value
  let v = document.querySelector("#vitesse").value
  let cap = document.querySelector("#cap").textContent
  let cons = document.querySelector("#cons").textContent

  if (isNaN(nbkm) || isNaN(v) || isNaN(cap) || isNaN(cons) ||
    nbkm == "" || v == "" || cap == "" || cons == "") {
    return;
  }

  socket.emit("fetchTravelTime", { nbkm, v, cap, cons });

  socket.on("getTravelTime", (obj) => {
    console.log(obj)
  })
}

function calcTravel(nbkm, v, cap, cons) {
  socket.emit("fetchTravelTime", { nbkm, v, cap, cons });
}


socket.on("getCarsData", (arr) => {
  var nsel = document.querySelector('#selector-opt');
  arr.forEach((element, i) => {

    var opt = document.createElement("option");
    opt.value = element.id
    opt.text = element.model;
    nsel.appendChild(opt);
  });
});