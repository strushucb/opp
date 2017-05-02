
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
  // map.setMaxBounds(bounds); // Option to lock view boundary

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


  var geojson = L.geoJSON(counties, {
      style: function(feature) {
        switch (feature.properties.uasi) {
          case 'ARIES' : return {color: "#ff0000"};
          case 'West Bay COPLINK' : return {color: "#0000ff"};
          case 'South Bay COPLINK' : return {color: "#b2df8a"};
          default : return {color: "transparent"};
        }
      },
      onEachFeature: onEachFeature
  });

  function set_view(view) {
    // Modify map view from links
    if(view=='ncric')
      ncric_view();
    if(view=='stingray')
      stingray_view();
    if(view=='uasi')
      uasi_view();
  }

  var ncricText = "https://www.cehrp.org/license-plate-reader-data-sharing-at-northern-california-regional-intelligence-center/"
  var stingrayText = "Stingray";
  var uasiText = "http://www.bayareauasi.org/sites/default/files/resources/010815%20Agenda%20Item%208%20Appendix%20A%20Public%20Safety%20Information%20Sharing%20Update.pdf";

  function clear_layers() {
    map.eachLayer(function (layer) {
      map.removeLayer(layer);
    });
    // redraws after clearing, hack-y
    mapbox.addTo(map);
  }

  function ncric_view() {
    clear_layers();
    $('#mapDescription').html("");
    ncricLayer.addTo(map);
    marker_layer.addTo(map);
    $('#mapDescription').html(ncricText);
    map.fitBounds(ncricLayer.getBounds());
  }

  function stingray_view() {
    $('#mapDescription').html("");
    clear_layers();
    console.log(stingrayLayer);
    stingrayLayer.addTo(map);
    $('#mapDescription').html(stingrayText);
    map.fitBounds(stingrayLayer.getBounds());
  }

  function uasi_view() {
    $('#mapDescription').html("");
    clear_layers();
    geojson.addTo(map);
    $('#mapDescription').html(uasiText);
    map.fitBounds(geojson.getBounds());
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
  var lightBlue = '#a6cee3';
  var darkBlue = '#1f78b4';
  var green = '#b2df8a';

  // AntPath Polyline styling
  var antPathOptions = {
    color: "white",
    pulseColor: darkBlue,
    weight: 2,
    opacity: .5,
    delay:600,
    dashArray: [10, 80],
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
    iconUrl: 'js/leaflet/icons/noun_11065.png',
    iconSize: [40, 40],
    //shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [18, 30], // point of the icon which will correspond to marker's location
    //shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor

  });

  var policeIcon = L.icon({
    iconUrl: 'js/leaflet/icons/police_icon.png',
    iconSize: [35, 30],
    //shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [18, 30], // point of the icon which will correspond to marker's location
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
    geojson.resetStyle(e.target);
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

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
  };

  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
      this._div.innerHTML =  (props ?
          '<b>' + props.name + '</b><br />' + props.uasi + ''
          : '');
  };

  info.addTo(map);
  //Load location points to create markers

  var ncricMarkers = [];
  var ncricLines = [];
  hub = groups.ncric_alpr.hub;
  spokes = groups.ncric_alpr.spokes;
  hub_latLon = cityData[hub].coordinates;
  hub_marker = new L.Marker(hub_latLon, {icon: fusionCenterIcon});
  hub_marker.bindPopup(cityData[hub].name)
  ncricMarkers.push(hub_marker);

  spokes.forEach(function(spoke) {
    // get coordinates for each spoke
    spoke_latLon = cityData[spoke].coordinates;
    spoke_marker = new L.Marker(spoke_latLon, {icon: policeIcon});
    spoke_marker.bindPopup(cityData[spoke].name + "<br><a href=" + cityData[spoke].text + ">MoU</a>")

    //add lines to array
    line = new L.Polyline.AntPath([spoke_latLon, hub_latLon], antPathOptions);
    ncricLines.push(line);
    ncricMarkers.push(spoke_marker);
  });

  // Object.keys(cityData).forEach(function(key) {
  //   lat = cityData[key].coordinates[0];
  //   lon = cityData[key].coordinates[1];
  //   text = cityData[key].name;
  //   icon = cityData[key].icon;
  //
  //   var markerLocation = new L.LatLng(lat,lon);
  //   marker = new L.Marker(markerLocation, {icon: policeIcon});
  //   marker.bindPopup(text);
  //   markers.push(marker);
  // });

  var marker_layer = L.layerGroup(ncricMarkers);

  var stingrayLines = []
  hub = groups.acdaStingray.hub;
  spokes = groups.acdaStingray.spokes;
  hub_latLon = cityData[hub].coordinates;
  spokes.forEach(function(spoke) {
    // get coordinates for each spoke
    spoke_latLon = cityData[spoke].coordinates;

    //add lines to array
    line = new L.Polyline.AntPath([hub_latLon, spoke_latLon], antPathOptions);
    stingrayLines.push(line);
  });

  var stingrayLayer = L.featureGroup(stingrayLines, {
      style: style,
      onEachFeature: onEachFeature,
      pane: 'lines'
  });

  var ncricLayer = L.featureGroup(ncricLines, {
      style: style,
      onEachFeature: onEachFeature,
      pane: 'lines'
  });

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

  // Layer Groups
  var overlayMaps = {
    "lines": ncricLayer,
    "cities": gj_cities,
    "counties": gj_counties
  };

  info.addTo(map);
