var xhr;
var storeData;
var storeMarkers = [];

const load = () => {
    xhr = new XMLHttpRequest();

    if(!xhr) {
        alert('Unable to create XHR Object');
        return false;
    }


    xhr.onreadystatechange = renderContent;
    xhr.open('GET', '../stores.json');
    xhr.send();

    function renderContent() {
        console.log(xhr.readyState);
        if(xhr.readyState === 4) {
            console.log('Received the data');
            if(xhr.status === 200) {
            storeData = JSON.parse(xhr.responseText).storesFeatures;
            console.log(storeData);
             }
            else {
            console.log('Problem making AJAX request');
            }
        }

    }

}
window.onload = load;

function getStores() {
    if (storeMarkers !== null){
        for(var point of storeMarkers) {
            point.remove();
        }
    }
    if(map.getSource('route')){
        map.removeLayer('route');
        map.removeSource('route');
    }

    document.getElementById('radius').addEventListener('input',plotStores);
    document.getElementById('category').addEventListener('input',plotStores);

    function plotStores() {
        if(storeData) {
            let radius = document.getElementById('radius').value;
            let categoryData = document.getElementById('category').value;
            for (const {name, description, category, coordinatesStore} of storeData) {
                let distance = getDistanceFromLatLonInKm(myPosition[1], myPosition[0], coordinatesStore.lat, coordinatesStore.lng);
                console.log(myPosition[1],myPosition[0]);
                console.log(radius);
                if(distance < radius) {
                    if(categoryData === category){
                    const sl = document.createElement('div');
                    sl.className = 'storeMarker';                    
                    // make a marker for each feature and add it to the map
                    var oneMarker = new mapboxgl.Marker(sl)
                    .setLngLat([coordinatesStore.lng, coordinatesStore.lat])
                    .setPopup(
                        new mapboxgl.Popup({ offset: 25 }) // add popups
                        .setHTML(`<div>
                                    <h3>${name}</h3>
                                    <p>${description}</p>
                                    <button onclick='storeRoute(this.nextElementSibling.innerHTML)'>Find a route</button>
                                    <span style='display: none'>${coordinatesStore.lat}_${coordinatesStore.lng}</span>
                                  </div>`)
                    ).addTo(map);
                    storeMarkers.push(oneMarker);
                    }
                }
            }
        }
    }
}

function storeRoute(coordinatesStore) {
    let coords = coordinatesStore.split("_");
    let storeLat = parseFloat(coords[0]);
    let storeLng = parseFloat(coords[1]);
    let start = [myPosition[0],myPosition[1]];
    let end = [storeLng, storeLat];

    getRoute(end);
    
    // create a function to make a directions request
    async function getRoute(end) {
    // make a directions request using walking profile
    // an arbitrary start will always be the same
    // only the end or destination will change
    const query = await fetch (
      `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
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
    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
      map.addLayer( {
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
          'line-opacity': 0.7
        }
      });
    }
  }
}

