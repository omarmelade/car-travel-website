
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

function calculateTravel()
{
  let cap = document.querySelector("#cap").textContent
  let cons = document.querySelector("#cons").textContent

  if(isNaN(cap) || isNaN(cons))
  { return; }

  console.log("calculation");
}


// Adresses suggestion
function isEmptyOrSpaces(str){
  return str === null || str.match(/^ *$/) !== null;
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}

function fillDropDown(obj, dropdown, id)
{
  let inputT = id == 'sugg-addrS' ? 'travelS' : 'travelE';
  let dropdownID = id == 'sugg-addrS' ? 'dropdownStartTrav' : 'dropdownEndTrav';

  for (const o of obj.features) {
    const a = document.createElement('a');
    a.className = 'dropdown-item';
    a.innerText = o.properties.label;
    a.onclick = function() { document.querySelector("#" + inputT).value = o.properties.label; disableDrpDown(dropdownID);};
    dropdown.appendChild(a);
  }
}

function adressDCall(value, id) {
  if(value == "")
  { return; 
  }

  let d = document.querySelector("#"+id);
  removeAllChildNodes(d);
  socket.emit("fetchAdresses", {value, id});
}

socket.on("getAdresses", (args) => {
  let d = document.querySelector("#" + args['id']);
  fillDropDown(args['val'], d, args['id']);
})

// events 

document.addEventListener('click', function(event) {
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
  center: [2.3522219, 48.856614], // starting position [lng, lat]
  zoom: 5 // starting zoom
});

const start = [5.859076, 45.649392];
// make an initial directions request that
// starts and ends at the same location
map.on('load', () => {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(start);

  // Add starting point to the map
  map.addLayer({
    id: 'point',
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
              coordinates: start
            }
          }
        ]
      }
    },
    paint: {
      'circle-radius': 10,
      'circle-color': '#3887be'
    }
  });
  // this is where the code from the next step will go
});

map.on('click', (event) => {
  const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
  const end = {
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
  if (map.getLayer('end')) {
    map.getSource('end').setData(end);
  } else {
    map.addLayer({
      id: 'end',
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
        'circle-color': '#f30'
      }
    });
  }
  getRoute(coords);

});

// function initMap() {
//   socket.emit("fetchBorns");

//   socket.on("getBorns", (obj) => {
//     putMarks(obj);
//     console.log(obj['records']);

//   })
// }

// on map click event
// map.on('click', (e) => {
//   const coordinates = e.lngLat;
//   addMarkAtCoord(coordinates)
// });

function addMarkAtCoord(coordinates)
{
  const el = document.createElement('div');
  el.className = 'marker-dest';

  new mapboxgl.Marker(el)
    .setLngLat(coordinates)
    .addTo(map);
}


// create a function to make a directions request
async function getRoute(end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
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
  // add turn instructions here at the end
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


