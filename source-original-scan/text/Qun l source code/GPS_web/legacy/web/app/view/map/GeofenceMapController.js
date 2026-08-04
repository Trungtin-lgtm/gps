
Ext.define('Traccar.view.map.GeofenceMapController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.geofenceMap',

    requires: [
        'Traccar.GeofenceConverter'
    ],

    config: {
        listen: {
            controller: {
                '*': {
                    mapstate: 'setMapState'
                }
            }
        }
    },

    onFileChange: function (fileField) {
        var reader, view = this.getView();
        if (fileField.fileInputEl.dom.files.length > 0) {
            reader = new FileReader();
            reader.onload = function () {
                var parser, xml, segment, projection, points = [];
                parser = new DOMParser();
                xml = parser.parseFromString(reader.result, 'text/xml');
                segment = xml.getElementsByTagName('trkseg')[0];
                projection = view.mapView.getProjection();
                Array.from(segment.getElementsByTagName('trkpt')).forEach(function (point) {
                    var lat, lon;
                    lat = Number(point.getAttribute('lat'));
                    lon = Number(point.getAttribute('lon'));
                    points.push(ol.proj.transform([lon, lat], 'EPSG:4326', projection));
                });
                view.getFeatures().clear();
                view.getFeatures().push(new ol.Feature(new ol.geom.LineString(points)));
            };
            reader.onerror = function (event) {
                Traccar.app.showError(event.target.error);
            };
            reader.readAsText(fileField.fileInputEl.dom.files[0]);
        }
    },

    onSaveClick: function (button) {
        var geometry, projection;
        if (this.getView().getFeatures().getLength() > 0) {
            geometry = this.getView().getFeatures().pop().getGeometry();
            projection = this.getView().getMapView().getProjection();
            this.fireEvent('savearea', Traccar.GeofenceConverter.geometryToWkt(projection, geometry));
            button.up('window').close();
        }
    },

    onCancelClick: function (button) {
        button.up('window').close();
    },

    onTypeSelect: function (combo) {
        this.getView().removeInteraction();
        this.getView().addInteraction(combo.getValue());
    },

    setMapState: function (lat, lon, zoom) {
        this.getView().getMapView().setCenter(ol.proj.fromLonLat([lon, lat]));
        this.getView().getMapView().setZoom(zoom);
    }
});
