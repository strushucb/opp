//TODO: Interactions - buttons, highlighting

//TODO: Add department markers and labels
//TODO: Create line layer groups (panes) by program / styling


  // copy data local variables
  var cities = citiesCA
  var counties = countiesCA
  // Create map
  var map = L.map('mapid', {
    zoomControl:false, // Options to lock zoom
    //minZoom:10,
    //maxZoom:10
  }).setView([37.7, -122.2], 10);
  var bounds = map.getBounds();
  map.setMaxBounds(bounds); // Option to lock view boundary

  // Create pane for lines and set high z-index
  map.createPane('lines');
  map.getPane('lines').style.zIndex = 650;

  // Get mapbox layers
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map description',
    maxZoom: 10,
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1IjoicGV0ZXJyb3dsYW5kIiwiYSI6ImNqMXJ5ZHoxeTAwOXMycW12cHVrMnh2MTAifQ.JzTXpmB_mNcuiWqUYyXH8Q'
  }).addTo(map);

  // To get layers from cartoDB instead
  // L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
  //   attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'
  // }).addTo(map);

  // Styling for county / city outlines
  function style(feature) {
      return {
          // fillColor: getColor(feature.properties.density),
          weight: 1,
          opacity: 1,
          color: 'white',
          dashArray: '2',
          fillOpacity: 0.3,
          zIndex: 2
      };
  }

  function set_view(view) {
    // Modify map view from links
     if(view=='ncric')
       console.log('ncric');
     if(view=='stingray')
       console.log('stingray');
     if(view=='uasi')
       console.log('uasi');
     }

  function highlight_style(feature) {
    return {
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    };
  }

  // Polyline styling
  var polylineOptions = {
    color: 'blue',
    weight: 2,
    opacity: 1,
    zIndex: 1
  };


  // highlighting on hover listener
  function highlightFeature(e) {
      var layer = e.target;

      // highlight style
      layer.setStyle(
        highlight_style(layer)
      );
      // send layer properties to info control
      info.update(layer.feature.properties);

      // compatibility
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
      }
  }

  // reset highlight listener
  function resetHighlight(e) {
      layer = e.target
      layer.setStyle(
        style(layer)
      );
      info.update(); // reset info control
  }

  // call listener functions on mouse move
  function onEachFeature(feature, layer) {
      layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          //click: zoomToFeature
      });
  }

  // highlight info control
  var info = L.control();

  // returns info div
  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
    this._div.innerHTML = (props ?
      '<h4>' + props.name + '</h4>' :
      'Hover over a city');
  };


  // Polyline variable
  var ncric_lines = [];
  // Load all coordinate values
  Object.keys(coords).forEach(function(key) {
    ncric_lines.push(new L.Polyline([coords[key], coords.ncric], polylineOptions));
  });

  //Load location
  var markers = [];

  Object.keys(cityData).forEach(function(key) {
    lat = cityData[key].coordinates[0];
    lon = cityData[key].coordinates[1];
    text = cityData[key].text;

    var markerLocation = new L.LatLng(lat,lon);
    var marker = new L.Marker(markerLocation);
    marker.bindPopup(text);
    markers.push(marker);
  });

  // Create Layer Groups
  // var ncricLayer = L.layerGroup(ncric_lines);
  var ncricLayer = L.featureGroup(ncric_lines, {
      style: style,
      onEachFeature: onEachFeature,
      pane: 'lines'
  });

  var marker_layer = L.layerGroup(markers);
  ncricLayer.addTo(map);
  map.addLayer(marker_layer);

  // geoJSON layer variable
  var gj_counties;
  gj_counties = L.geoJson(counties, {
      style: style,
      onEachFeature: onEachFeature
  });

  var gj_cities;
  gj_cities = L.geoJson(cities, {
      style: style,
      onEachFeature: onEachFeature
  });

  // Political boundary layer
  map.addLayer(gj_counties);

  // Layer Groups
  var overlayMaps = {
    "lines": ncricLayer,
    "cities": gj_cities,
    "counties": gj_counties
  };

  // Layer toggle control
  L.control.layers(null, overlayMaps).addTo(map);

  // put control onto map
  info.addTo(map);
