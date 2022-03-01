// MAP BOX
mapboxgl.accessToken = 'pk.eyJ1Ijoib21hcm1lbGFkZSIsImEiOiJjbDA1Y2VwcGgwbTZqM2lvZ29hb2Z5bnQyIn0.7xgDshu34UXqWHyso-VBmw';

const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
  center: [5.859076, 45.649392], // starting position [lng, lat]
  zoom: 12 // starting zoom
});

function initMap() {
  socket.emit("fetchBorns");

  socket.on("getBorns", (obj) => {
    putMarks(obj);
    console.log(obj['records']);

  })
}

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

  socket.emit("fetchLatLon", { 'lon': coords[0], 'lat': coords[1], 'isStart': !endBool });

  getRoute(coords);
  endBool = !endBool;
});

socket.on('getLatLon', (args) => {
  let id = args['isStart'] ? '#travelS' : '#travelE'
  if (args['val'].features.length != 0) {
    document.querySelector(id).value = args['val'].features[0].properties.label;
  }
})


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


  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );

  const json = await query.json();
  const data = json.routes[0];
  const route = data.geometry.coordinates;
  console.log(data);
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };

  let features = [];
  let cpt = 0;
  for (let index = 0; index < data.geometry.coordinates.length; index++) {
    if(cpt == 5)
    {
      features.push(data.geometry.coordinates[index])
      cpt = 0;
    }
    cpt++;
  }



  
  
  let car = getCurrentCarData();
  if (car == undefined) { return; }
  let autonomous = Math.floor(((car['model'].cap / car['model'].cons) * 100.0));

  fillResultsData(data);

  if (autonomous > data.distance / 1000) {
    console.log("osef");
  }


  let bornesMark = [];
  let s = start;
  for (const f of features) {

    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${s[0]},${s[1]};${f[0]},${f[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
  
    const json = await query.json();
    let dist = json.routes[0].distance / 1000;

    if(dist > autonomous - 10)
    {
      console.log(dist);
      const q = await fetch(
        `https://opendata.reseaux-energies.fr/api/records/1.0/search/?dataset=bornes-irve&q=&sort=-dist&facet=region&geofilter.distance=${f[1]}%2C+${f[0]}%2C+20000&rows=5`,
        { method: 'GET' }
      );
      const bornes = await q.json();
      console.log(bornes);
      bornesMark.push([bornes.records[0].fields.geo_point_borne[1], bornes.records[0].fields.geo_point_borne[0]]);
      s = f;
    }
  }

  const markjson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: bornesMark
    }
  };

  if (map.getSource('markers')) {
    map.getSource('markers').setData(markjson);
  }
  else{
    map.addLayer({
      id: 'markers',
      type: 'circle',
      source: {
        type: 'geojson',
        data: markjson
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#50c878'
      }
    })
  }


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

function newMark(coords)
{
  const el = document.createElement('div');
  el.className = 'marker';

  new mapboxgl.Marker(el)
  .setLngLat(coords)
  .addTo(map);
}
