

//URL Geoserver
var url_geoserver = "http://localhost:8080/geoserver/wms";

//noms des couches
var name_layer_Abidjan_HR = "formation_gs:Abidjan_HR_ext";

var name_civ_adm1 = "formation_gs:civ_adm1";
var name_civ_adm2 = "formation_gs:civ_adm2";
var name_civ_adm3 = "formation_gs:civ_adm3";

var lyr_osm = new ol.layer.Tile({
    title: 'OSM',
    type: 'base',
    visible: true,
    source: new ol.source.OSM()
});

//déclaration des couches openlayers

var lyr_adm1 = new ol.layer.Tile({
    source: new ol.source.TileWMS(({
        url: url_geoserver,
        params: { "LAYERS": name_civ_adm1, "TILED": "true" }
    })),
    title: "Districts"
});

var lyr_adm2 = new ol.layer.Tile({
    source: new ol.source.TileWMS(({
        url: url_geoserver,
        params: { "LAYERS": name_civ_adm2, "TILED": "true" }
    })),
    title: "Regions"
});

var lyr_adm3 = new ol.layer.Tile({
    source: new ol.source.TileWMS(({
        url: url_geoserver,
        params: { "LAYERS": name_civ_adm3, "TILED": "true" }
    })),
    title: "Departments"
});

var abidjan_HR = new ol.layer.Tile({
    source: new ol.source.TileWMS(({
        url: url_geoserver,
        params: { "LAYERS": name_layer_Abidjan_HR, "TILED": "true" }
    })),
    title: "Image HR"
});

//visibilité par défaut des couches au chargement de la carte

abidjan_HR.setVisible(true);


lyr_adm1.setVisible(true);
lyr_adm2.setVisible(true);
lyr_adm3.setVisible(true);

//déclaration de la liste des couches à afficher dans un ordre précis
var layersList = [lyr_osm, lyr_adm1, lyr_adm2, lyr_adm3, abidjan_HR];
var mapView = new ol.View({
    projection: 'EPSG:4326',
    center: [-5.690183, 7.786829],
    zoom: 7
});
var mapView = new ol.View({
    center: ol.proj.transform([0, 0], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
});

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
closer.onclick = function () {
    container.style.display = 'none';
    closer.blur();
    return false;
};







var overlayPopup = new ol.Overlay({
    element: container
});


var map = new ol.Map({
    target: 'map',
    overlays: [overlayPopup],
    layers: layersList,
    view: mapView
});

// choice of the layers visibility
var layerSwitcher = new ol.control.LayerSwitcher({
    tipLabel: 'Légende'
});
map.addControl(layerSwitcher);



// Mouse position
var MousePosition = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326'
});

// Coordiantes calculation in diffrent coordianes systems
map.on('pointermove', function (event) {
    var coord3857 = event.coordinate;
    var coord4326 = ol.proj.transform(coord3857, 'EPSG:3857', 'EPSG:4326');
    $('#mouse3857').text(ol.coordinate.toStringXY(coord3857, 2));
    $('#mouse4326').text(ol.coordinate.toStringXY(coord4326, 5));
});

// Action onclick
map.on('singleclick', function (evt) {
    onSingleClick(evt);
});


// On click just display the coordinates
// var onSingleClick = function (evt) {
//     var coord = evt.coordinate;
//     var other_coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
//     console.log('EPSG:3857 ', coord, 'EPSG:4326 ', other_coord);
// }







// On popup 
// var onSingleClick = function(evt) {
//     var coord = evt.coordinate;
//     console.log(coord);
//     var coord_wgs84 = ol.proj.toLonLat(coord);
//     var str = ol.coordinate.toStringXY(coord_wgs84,6);
//     if(str) {
//     str = '<p>' + str + '</p>';
//     overlayPopup.setPosition(coord);
//     content.innerHTML = str;
//     container.style.display = 'block';
//     }
//     else{
//     container.style.display = '';
//     closer.blur();
//     }
//    }

// Display on the popup 
var clicked_coord;
var onSingleClick = function (evt) {
    var coord = evt.coordinate;
    // console.log(coord);

    var source1 = name_civ_adm1;
    var source2 = name_civ_adm2;
    var source3 = name_civ_adm3;
    var layers_list = source3 + ',' + source2 + ',' + source1;
    var wmslyr_adm1 = new ol.source.TileWMS({
        url: url_geoserver,
        params: { 'LAYERS': name_civ_adm1, 'TILED': true },
        serverType: 'geoserver',
        crossOrigin: 'anonymous'
    });
    var view = map.getView();
    var viewResolution = view.getResolution();
    var url = wmslyr_adm1.getFeatureInfoUrl(
        evt.coordinate, viewResolution, view.getProjection(),
        {
            'INFO_FORMAT': 'application/json',
            'FEATURE_COUNT': 20,
            'LAYERS': layers_list,
            'QUERY_LAYERS': layers_list
        });
    // console.log(url);
    if (url) { //call parseResponse(data)
        clicked_coord = coord;
        $.ajax(url,
            { dataType: 'json' }
        ).done(function (data) {
            // console.log(data)
            parseResponse(data)
        });
    }
}

function parseResponse(data) {
    var vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(data)
    });
    // console.log((new ol.format.GeoJSON()).readFeatures(data));
    var features = vectorSource.getFeatures();
    var str = "";
    var district = "";
    var region = "";
    var departement = "";
    for (x in features) {
        var id = features[x].getId();
        // console.log(id);
        var props = features[x].getProperties();
        if (id.indexOf("adm1") > -1) district = props["ADM1_FR"];
        if (id.indexOf("adm2") > -1) region = props["ADM2_FR"];
        if (id.indexOf("adm3") > -1) departement = props["ADM3_FR"];
    }
    str = str + "District: " + district + '<br/>';
    str = str + "Région: " + region + '<br/>';
    str = str + "Département: " + departement + '<br/>';
    if (str) {
        str = '<p>' + str + '</p>';
        overlayPopup.setPosition(clicked_coord);
        content.innerHTML = str;
        container.style.display = 'block';
    }
    else {
        container.style.display = 'none';
        closer.blur();
    }
}




// Define Geometries
var point = new ol.geom.Point(
    ol.proj.transform([-5.690183, 7.786829], 'EPSG:4326', 'EPSG:3857')
);
var circle = new ol.geom.Circle(
    ol.proj.transform([-5.690183, 7.786829], 'EPSG:4326', 'EPSG:3857'),
    450000
);
// Features
var pointFeature = new ol.Feature(point);
var circleFeature = new ol.Feature(circle);
// Source
var vectorSource = new ol.source.Vector({
    projection: 'EPSG:4326'
});
vectorSource.addFeatures([pointFeature, circleFeature]);

//add layer to the map


var style = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(255, 100, 50, 0.3)'
    }),
    stroke: new ol.style.Stroke({
        width: 2,
        color: 'rgba(255, 100, 50, 0.8)'
    }),
    image: new ol.style.Circle({
        fill: new ol.style.Fill({
            color: 'rgba(55, 200, 150, 0.5)'
        }),
        stroke: new ol.style.Stroke({
            width: 1,
            color: 'rgba(55, 200, 150, 0.8)'
        }),
        radius: 7
    }),
});
// vector layer with the style
var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: style
});
map.addLayer(vectorLayer);


var saveVectorSource = new ol.source.Vector({
    projection: 'EPSG:4326'
});
// vector layer
var saveVectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: style
});
//add layer to the map
map.addLayer(saveVectorLayer);


// var import_id;
// $.ajax("http://127.0.0.1:5000/",
//     { dataType: 'json' }
// ).done(function (data) {

//     console.log(data);
//     import_id = data._id;
//     console.log("-----------------id---------------------------");
//     console.log(import_id);
//     console.log("-----------------id---------------------------");

   
//     _geojson_vectorSource = new ol.source.Vector({
//         features: (new ol.format.GeoJSON()).readFeatures(data, { featureProjection: 'EPSG:3857' })
//       });
      
//       _geojson_vectorLayer = new ol.layer.Vector({
//         source: _geojson_vectorSource,
//         style: style
//       });
      
//       map.addLayer(_geojson_vectorLayer);

// });


var import_id;

var button = $('#pan').button('toggle');
var interaction;
$('div.btn-group button').on('click', function (event) {
    var id = event.target.id;
    // Toggle buttons
    button.button('toggle');
    button = $('#' + id).button('toggle');
    // Remove previous interaction
    map.removeInteraction(interaction);
    // Update active interaction
    switch (event.target.id) {
        case "select":
            interaction = new ol.interaction.Select();
            map.addInteraction(interaction);
            break;
        case "point":
            interaction = new ol.interaction.Draw({
                type: 'Point',
                source: saveVectorLayer.getSource()
            });
            map.addInteraction(interaction);        
            break;
        case "line":
            interaction = new ol.interaction.Draw({
                type: 'LineString',
                source: saveVectorLayer.getSource(),
            });
            map.addInteraction(interaction);
            
            break;
        case "polygon":
            interaction = new ol.interaction.Draw({
                type: 'Polygon',
                source: saveVectorLayer.getSource()
            });
            map.addInteraction(interaction);
            interaction.on('drawend', function(evt) { 
                // console.log(evt);
                // console.log("-----------------add---------------------------");
                // console.log(evt.feature.getGeometry().getCoordinates());
                var format = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
                var feature = evt.feature;
                var features = saveVectorLayer.getSource().getFeatures();
                features = features.concat(feature);
                var json = format.writeFeatures(features);

                // console.log("----------------------json-------------------------------");
                // console.log(saveVectorLayer.getSource().getFeatures());
                // console.log("----------------------json-------------------------------");
                

              });
            break;
        case "modify":
            interaction = new ol.interaction.Modify({
                features: new ol.Collection(saveVectorLayer.getSource().getFeatures())
            });
            map.addInteraction(interaction);
            interaction.on('modifyend', function(evt) { 
                // console.log("------------------------modify---------------------------");
                // console.log(evt.features.item(0).getGeometry().getCoordinates());
                // console.log("------------------------------------------------------------");

              });
            break;
        case "display":
            $.ajax("http://127.0.0.1:5000/",
                { dataType: 'json' }
            ).done(function (data) {

                // console.log(data);
                import_id = data._id;
                // console.log("-----------------id---------------------------");
                // console.log(import_id);
                // console.log("-----------------id---------------------------");

            
                _geojson_vectorSource = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(data, { featureProjection: 'EPSG:3857' })
                });
                
                _geojson_vectorLayer = new ol.layer.Vector({
                    source: _geojson_vectorSource,
                    style: style
                });
                
                map.addLayer(_geojson_vectorLayer);

            });
            break;
        case "modify-import":
            interaction = new ol.interaction.Modify({
                features: new ol.Collection(_geojson_vectorLayer.getSource().getFeatures())
            });
            map.addInteraction(interaction);
            break;
        
        case "save":
            // console.log("save");
            var format = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
            feats = saveVectorLayer.getSource().getFeatures();
            _geojson_vectorLayer.getSource().addFeatures(feats);
            var features = _geojson_vectorLayer.getSource().getFeatures();
            var json = JSON.parse(format.writeFeatures(features));
            json._id = import_id
            // console.log("------------------------------***********-------------------------");
            // console.log(json);
            // console.log("------------------------------***********-------------------------");

            $.ajax({
                url: 'http://127.0.0.1:5000/update',
                type: 'PUT',
                contentType: 'application/json',
                data : JSON.stringify(json)
            }).done(function (data) {console.log(data)});
            break;
        case "delete":
            delete_layer = new ol.interaction.Select();
            // map.addInteraction(delete_layer);

            delete_layer.getFeatures().on('add', function(feature){
            //source is layer.getSource()
            _geojson_vectorLayer.getSource().removeFeature(feature.element);
            feature.target.remove(feature.element);
            });
            map.addInteraction(delete_layer);
            break;
        default:
            break;
    }
});

// console.log("---------------------------Final---------------------------------");
var format = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' });
var features = saveVectorLayer.getSource().getFeatures();
var json = format.writeFeatures(features);
// console.log(json);
// console.log("----------------------------Final--------------------------------");



function displayGeoJson() {
    var features = saveVectorLayer.getSource().getFeatures();
    var json = format.writeFeatures(features);
    // console.log(json);
}




interaction = new ol.interaction.Draw({
    type: 'Point',
    source: vectorLayer.getSource()
});



//Geolocation
var geolocation = new ol.Geolocation({
    projection: map.getView().getProjection(),
    tracking: true
});
var marker = new ol.Overlay({
    element: document.getElementById('location'),
    positioning: 'center-center'
});
map.addOverlay(marker);
geolocation.on('change:position', function () { //real time tracking
    // map.getView().setCenter(geolocation.getPosition());
    // map.getView().setZoom(15);
    marker.setPosition(geolocation.getPosition());
});

function zoomToMyPosition() {
    // console.log("heyooooo");

   
    map.getView().setCenter(geolocation.getPosition());
        map.getView().setZoom(15);

}

function goToFullExtent() {

    map.getView().setCenter([0, 0]);
    map.getView().setZoom(0);

}




// //Geolocation
// var geolocation = new ol.Geolocation({
//     projection: map.getView().getProjection(),
//     tracking: true
// });
// var marker = new ol.Overlay({
//     element: document.getElementById('location'),
//     positioning: 'center-center'
// });
// map.addOverlay(marker);
// geolocation.on('change:position', function () { //real time tracking
//     map.getView().setCenter(geolocation.getPosition());
//     map.getView().setZoom(15);
//     marker.setPosition(geolocation.getPosition());
// });

// import { Client } from 'pg';
// const Client = require('pg');
// const conString = "postgres://postgres:geoserver@127.0.0.1:5432/tun_gs";
// const client = new Client(conString);
// client.connect();
// const query = `SELECT * FROM clients_utm`;

// let labelsFromDb = [];

// client.query(query, (err, res) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
//     for (let row of res.rows) {
//         labelsFromDb.push(row);
//     }
//     for (let row of labelsFromDb) {
//         console.log(row);
//     }
//     client.end();
// });