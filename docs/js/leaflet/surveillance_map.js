
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
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoicGV0ZXJyb3dsYW5kIiwiYSI6ImNqMXJ5ZHoxeTAwOXMycW12cHVrMnh2MTAifQ.JzTXpmB_mNcuiWqUYyXH8Q'
  }).addTo(map);


  var geojson = L.geoJSON(counties, {
      style: function(feature) {
        switch (feature.properties.uasi) {
          case 'ARIES' : return {color: "#2AAD93"};
          case 'West Bay COPLINK' : return {color: "#EF662F"};
          case 'South Bay COPLINK' : return {color: "#FAAF4C"};
          default : return {color: "transparent"};
        }
      },
      onEachFeature: onEachFeature
  });

  function set_view(view) {
    // Modify map view from links
    if(view=='ncric')
      ncric_view();
    if(view=='shotspotter')
      shotspotter_view();
    if(view=='uasi')
      uasi_view();
  }

  var ncricText = "15 Bay Area law enforcement agencies have signed Memorandoms of Understanding with NCRIC to provide " +
                  "ALPR data into their central repository.</n> " +
                  "<a href='https://www.cehrp.org/license-plate-reader-data-sharing-at-northern-california-regional-intelligence-center/'>(source)</a><br><img src='img/tech/alpr_legend.png'>";
  var shotspotterText = "Several Bay Area cities contract with SST Technologies for gunshot detection using the ShotSpotter system. SST manages and owns all the data collected by their network of audio sensors.</n> " +
                  "<a href='http://www.mercurynews.com/2013/11/11/shotspotter-has-long-history-with-bay-area-police/'>(source)</a><br><img src='img/tech/shotspotter_legend.png'>";

  var uasiText =  "Bay Area counties participate in three regional intelligence sharing programs ARIES, West Bay COPLINK, and South Bay COPLINK." +
                  " The scope of the data shared between these programs and with Federal agencies is <b>currently unknown.</b></n> " +
                  "<a href='http://www.bayareauasi.org/sites/default/files/resources/010815%20Agenda%20Item%208%20Appendix%20A%20Public%20Safety%20Information%20Sharing%20Update.pdf'>(source)</a><br><br>" +
                  "<span style='background-color:#2AAD93'><b>ARIES</b></span> <br>" +
                  "<span style='background-color:#EF662F'><b>West Bay COPLINK</b></span> <br>" +
                  "<span style='background-color:#FAAF4C'><b>South Bay COPLINK</b></span> <br>";


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
    ncricMarkerLayer.addTo(map);
    $('#mapDescription').html(ncricText);
    map.fitBounds(ncricLayer.getBounds());
  }

  function shotspotter_view() {
    $('#mapDescription').html("");
    clear_layers();
    console.log(stingrayLayer);
    shotspotterLayer.addTo(map);
    shotspotterMarkerLayer.addTo(map);
    $('#mapDescription').html(shotspotterText);
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
  var alprBlue = '#2A3B8E';
  var shotOrange = '#EF662F'

  // AntPath Polyline styling
  var antPathOptions = {
    color: "white",
    pulseColor: alprBlue, //dashColor, //darkBlue,
    weight: 2,
    opacity: .7,
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
    popupAnchor:  [-3, -30] // point from which the popup should open relative to the iconAnchor

  });

  var policeIcon = L.icon({
    iconUrl: 'js/leaflet/icons/police_icon.png',
    iconSize: [35, 30],
    //shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [18, 30], // point of the icon which will correspond to marker's location
    //shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -30] // point from which the popup should open relative to the iconAnchor
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
  hub_marker.bindPopup(cityData[hub].name);
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

  var stingrayMarkers = []
  var stingrayLines = []
  hub = groups.acdaStingray.hub;
  spokes = groups.acdaStingray.spokes;
  hub_latLon = cityData[hub].coordinates;
  hub_marker = new L.Marker(hub_latLon);
  spokes.forEach(function(spoke) {
    // get coordinates for each spoke
    spoke_latLon = cityData[spoke].coordinates;
    spoke_marker = new L.Marker(spoke_latLon, {icon: policeIcon});
    spoke_marker.bindPopup(cityData[spoke].name);

    //add lines to array
    line = new L.Polyline.AntPath([hub_latLon, spoke_latLon], antPathOptions);
    stingrayLines.push(line);
    stingrayMarkers.push(spoke_marker);
  });

  var shotspotterMarkers = []
  var shotspotterLines = []
  hub = groups.shot_spotter.hub;
  spokes = groups.shot_spotter.spokes;
  hub_latLon = cityData[hub].coordinates;
  hub_marker = new L.Marker(hub_latLon, {icon: fusionCenterIcon});
  hub_marker.bindPopup(cityData[hub].name);
  shotspotterMarkers.push(hub_marker);

  antPathOptions.pulseColor = shotOrange;
  spokes.forEach(function(spoke) {
    // get coordinates for each spoke
    spoke_latLon = cityData[spoke].coordinates;
    spoke_marker = new L.Marker(spoke_latLon, {icon: policeIcon});
    spoke_marker.bindPopup(cityData[spoke].name);

    //add lines to array
    line = new L.Polyline.AntPath([spoke_latLon, hub_latLon], antPathOptions);
    shotspotterLines.push(line);
    shotspotterMarkers.push(spoke_marker);
  });

  var stingrayLayer = L.featureGroup(stingrayLines, {
      style: style,
      onEachFeature: onEachFeature,
      pane: 'lines'
  });

  var stingrayMarkerLayer = L.featureGroup(stingrayMarkers);

  var ncricLayer = L.featureGroup(ncricLines, {
      style: style,
      onEachFeature: onEachFeature,
      pane: 'lines'
  });

  var ncricMarkerLayer = L.featureGroup(ncricMarkers);

  var shotspotterLayer = L.featureGroup(shotspotterLines, {
      style: style,
      onEachFeature: onEachFeature,
      pane: 'lines'
  });

  var shotspotterMarkerLayer = L.featureGroup(shotspotterMarkers);


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
