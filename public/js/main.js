
// SOCKET IO --- client code here
const socket = io("http://localhost:3000");

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

function calculateTravel() {
  let cap = document.querySelector("#cap").textContent
  let cons = document.querySelector("#cons").textContent

  if (isNaN(cap) || isNaN(cons)) { return; }

  console.log("calculation");
}


// Adresses suggestion
function isEmptyOrSpaces(str) {
  return str === null || str.match(/^ *$/) !== null;
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function fillDropDown(obj, dropdown, id) {
  let isStart = id == 'sugg-addrS' ? true : false;
  let inputT = isStart ? 'travelS' : 'travelE';
  let dropdownID = isStart ? 'dropdownStartTrav' : 'dropdownEndTrav';

  for (const o of obj.features) {
    console.log(o);
    const a = document.createElement('a');
    a.className = 'dropdown-item';
    a.innerText = o.properties.label;
    a.onclick = function () { document.querySelector("#" + inputT).value = o.properties.label; disableDrpDown(dropdownID); setPoint(isStart, o.geometry.coordinates) };
    dropdown.appendChild(a);
  }
}

function adressDCall(value, id) {
  if (value == "") {
    return;
  }

  let d = document.querySelector("#" + id);
  removeAllChildNodes(d);
  socket.emit("fetchAdresses", { value, id });
}

socket.on("getAdresses", (args) => {
  let d = document.querySelector("#" + args['id']);
  fillDropDown(args['val'], d, args['id']);
})

// events 

document.addEventListener('click', function (event) {
  let d = document.querySelector("#dropdownStartTrav");
  let d2 = document.querySelector("#dropdownEndTrav");

  event.preventDefault();
  if (d.contains(event.target) == false) {
    disableDrpDown("dropdownStartTrav")
  }

  event.preventDefault();
  if (d2.contains(event.target) == false) {
    disableDrpDown("dropdownEndTrav")
  }
});

function activateDrpDown(id) {
  let drpdwn = document.querySelector("#" + id);
  drpdwn.className = "dropdown is-active";
}

function disableDrpDown(id) {
  let drpdwn = document.querySelector("#" + id);
  drpdwn.className = "dropdown"
}


// MAP BOX
mapboxgl.accessToken = 'pk.eyJ1Ijoib21hcm1lbGFkZSIsImEiOiJjbDA1Y2VwcGgwbTZqM2lvZ29hb2Z5bnQyIn0.7xgDshu34UXqWHyso-VBmw';

const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
  center: [5.859076, 45.649392], // starting position [lng, lat]
  zoom: 12 // starting zoom
});

let start = null;
let end = null;
let endBool = false;

function setPoint(isStart, coords) {
  if (isStart) {
    start = coords;
    addPointToMap('start', start, false)
  } else {
    end = coords;
    addPointToMap('end', end, true)
  }
  if (end != null && start != null) {
    getRoute(end);
  }
}


map.on('click', (event) => {

  const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
  let layer = 'start';
  if (endBool) {
    layer = 'end';
  }

  if (!endBool) {
    start = coords;
  }

  addPointToMap(layer, coords, endBool);
  console.log({ 'lon':coords[0], 'lat':coords[0], endBool });
  socket.emit("fetchLatLon", { 'lon':coords[0], 'lat':coords[1], 'isStart':!endBool });

  getRoute(coords);
  endBool = !endBool;
});

socket.on('getLatLon', (args) => {
  let id = args['isStart'] ? '#travelS' : '#travelE'
  console.log(args);
  document.querySelector(id).value = args['val'].features[0].properties.label;
})

// function initMap() {
//   socket.emit("fetchBorns");

//   socket.on("getBorns", (obj) => {
//     putMarks(obj);
//     console.log(obj['records']);

//   })
// }


function addPointToMap(layer, coords, endBool) {

  const point = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: coords
        }
      }
    ]
  };

  if (map.getLayer(layer)) {
    map.getSource(layer).setData(point);
  } else {
    map.addLayer({
      id: layer,
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: coords
              }
            }
          ]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': endBool ? '#f30' : '#09f'
      }
    });
  }
}


// create a function to make a directions request
async function getRoute(end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );

  const json = await query.json();
  const data = json.routes[0];
  const route = data.geometry.coordinates;
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };
  console.log(data);
  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(geojson);
  }
  // otherwise, we'll make a new request
  else {
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
  }
}


function putMarks(objs) {
  for (const f of objs['records']) {
    const el = document.createElement('div');
    el.className = 'marker';

    if (f.geometry != undefined) {
      // make a marker for each feature and add to the map
      new mapboxgl.Marker(el)
        .setLngLat(f.geometry.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }) // add popups
            .setHTML(
              `<h3><b>${f.fields.n_station}</b></h3><p><b>Accès </b>: ${f.fields.acces_recharge}</p>`
            )
        )
        .addTo(map);
    }
  }
}


// JQuery 
$(document).ready(function () {
  var sel = $('#selector-opt');

  socket.on("getCarsData", (arr) => {
    var nsel = sel['0'];
    arr.forEach((element, i) => {

      var opt = document.createElement("option");
      opt.value = element.id
      opt.text = element.model;
      nsel.add(opt);
    });
  });

  initMap();

});

function car_selected(value) {
  $('#autonomie').html(value);
}


