//TODO: Interactions - buttons, highlighting

//TODO: Add department markers and labels
//TODO: Create line layer groups (panes) by program / styling


  // copy data local variables
  var cities = citiesCA
  var counties = countiesCA

  // Create map
  var map = L.map('mapid', {
    //zoomControl:false, // Options to lock zoom
    //minZoom:10,
    //maxZoom:10
  }).setView([37.7, -122.2], 10);
  var bounds = map.getBounds();
  //map.setMaxBounds(bounds); // Option to lock view boundary


  // mapbox url
  // var url = "http://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/14/4823/6160.mvtaccess_token={accessToken}";
  var url = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}"

  // Get mapbox layer
  var mapbox = L.tileLayer(url, {
    attribution: 'Map description',
    maxZoom: 10,
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1IjoicGV0ZXJyb3dsYW5kIiwiYSI6ImNqMXJ5ZHoxeTAwOXMycW12cHVrMnh2MTAifQ.JzTXpmB_mNcuiWqUYyXH8Q'
  }).addTo(map);

  function set_view(view) {
    // Modify map view from links
    if(view=='ncric')
      ncric_view();
    if(view=='stingray')
      stingray_view();
    if(view=='uasi')
      uasi_view();
  }

  function clear_layers() {
    map.eachLayer(function (layer) {
      map.removeLayer(layer);
    });
    // redraws after clearing, hack-y
    mapbox.addTo(map);
  }

  function ncric_view() {
    clear_layers();
    ncricLayer.addTo(map);
    map.fitBounds(ncricLayer.getBounds());
  }

  function stingray_view() {
    clear_layers();
    stingrayLayer.addTo(map);
    map.fitBounds(stingrayLayer.getBounds());
  }

  function uasi_view() {
    clear_layers();
    console.log(uasiLayer);
    uasiLayer.addTo(map);
    map.fitBounds(uasiLayer.getBounds());
  }

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

  function highlight_style(feature) {
    return {
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    };
  }

  // Colors
  var transparent = '#10000000';
  var dashColor = '#3182bd';

  // AntPath Polyline styling
  var antPathOptions = {
    color: transparent,
    pulseColor: dashColor,
    weight: 2,
    opacity: .5,
    delay: 600,
    dashArray: [1, 80],
    zIndex: 1
  };

  // Regular lines
  var polylineOptions = {
    color: dashColor,
    weight: 2,
    opacity: .5,
    zIndex: 1
  };

  var fusionCenterIcon = L.icon({
    iconUrl: './js/leaflet/icons/noun_11065.png',
    iconSize: [38, 38],
    //shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [-100, -100], // point of the icon which will correspond to marker's location
    //shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor

  });

  var policeIcon = L.icon({
    iconUrl: './js/leaflet/icons/noun_850014_cc.png',
    iconSize: [38, 38],
    //shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [15, 25], // point of the icon which will correspond to marker's location
    //shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

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

  //Load location points to create markers
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
  var marker_layer = L.layerGroup(markers);

  // Load Polyline data
  var ncricLines = [];
  // Load all coordinate values
  Object.keys(coords).forEach(function(key) {
    ncricLines.push(new L.Polyline.AntPath([coords[key], coords.ncric], antPathOptions));
  });

  var stingrayLines = []
  var stingrayMarkers = []
  hub = groups.acdaStingray.hub;
  spokes = groups.acdaStingray.spokes;
  hub_latLon = cityData[hub].coordinates;

  spokes.forEach(function(spoke) {
    // get coordinates for each spoke
    spoke_latLon = cityData[spoke].coordinates;
    spoke_lat = cityData[spoke].coordinates[0];
    spoke_lon = cityData[spoke].coordinates[1];
    markerLocation = new L.LatLng(spoke_lat, spoke_lon);
    var marker = new L.Marker(markerLocation, {icon: policeIcon });
    //add lines to array
    line = new L.Polyline([spoke_latLon, hub_latLon], polylineOptions);
    stingrayLines.push(line);
    stingrayMarkers.push(marker);
    stingrayMarkers.push(line);
  });

  // geoJSON layer variable
  var gj_counties;
  gj_counties = L.geoJson(counties).addTo(map);

  // var gj_coplinkWB = L.geoJson(wb_coplink, {
  //     style: style,
  //     onEachFeature: onEachFeature
  // });
  //
  // var gj_cities;
  // gj_cities = L.geoJson(cities, {
  //     style: style,
  //     onEachFeature: onEachFeature
  // });

  var stingrayLayer = L.featureGroup(stingrayMarkers,  {
      style: style,
      onEachFeature: onEachFeature,
  });

  var ncricLayer = L.featureGroup(ncricLines, {
      style: style,
      onEachFeature: onEachFeature,
  });

  var uasiLayer = L.featureGroup(gj_counties, {
    style: style,
    onEachFeature: onEachFeature,
  });



  // Layer Groups
  // var overlayMaps = {
  //   // "lines": ncricLayer,
  //   "cities": gj_cities,
  //   "counties": gj_counties
  // };

  // Add Layers to map
  //map.addLayer(marker_layer);
  //ncricLayer.addTo(map);
  // put description box onto map
  //info.addTo(map);
  // Political boundary layer
  //map.addLayer(gj_counties);

  // Layer toggle control
  // L.control.layers(null, overlayMaps).addTo(map);
