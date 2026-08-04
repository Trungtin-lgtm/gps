

Ext.define('Traccar.view.map.Map', {
    extend: 'Traccar.view.map.BaseMap',
    xtype: 'mapView',

    requires: [
        'Traccar.view.map.MapController',
        'Traccar.view.SettingsMenu'
    ],

    controller: 'map',

    title: Strings.mapTitle,
    tbar: {
        componentCls: 'toolbar-header-style',
        defaults: {
            xtype: 'button',
            tooltipType: 'title',
            stateEvents: ['toggle'],
            enableToggle: true,
            stateful: {
                pressed: true
            }
        },
        items: [{
            xtype: 'tbtext',
            html: Strings.mapTitle,
            baseCls: 'x-panel-header-title-default'
        }, {
            xtype: 'tbfill'
        }, {
            handler: 'showReports',
            reference: 'showReportsButton',
            glyph: 'xf0f6@FontAwesome',
            stateful: false,
            enableToggle: false,
            tooltip: Strings.reportTitle
        }, {
            handler: 'showEvents',
            reference: 'showEventsButton',
            glyph: 'xf27b@FontAwesome',
            stateful: false,
            enableToggle: false,
            tooltip: Strings.reportEvents
        }, {
            handler: 'updateGeofences',
            reference: 'showGeofencesButton',
            glyph: 'xf21d@FontAwesome',
            pressed: true,
            stateId: 'show-geofences-button',
            tooltip: Strings.sharedGeofences
        }, {
            handler: 'showAccuracy',
            reference: 'showAccuracyButton',
            glyph: 'xf140@FontAwesome',
            pressed: true,
            stateId: 'show-accuracy-button',
            tooltip: Strings.positionAccuracy
        }, {
            handler: 'showCurrentLocation',
            glyph: 'xf124@FontAwesome',
            tooltip: Strings.mapCurrentLocation
        }, {
            handler: 'showLiveRoutes',
            reference: 'showLiveRoutes',
            glyph: 'xf1b0@FontAwesome',
            stateId: 'show-live-routes-button',
            tooltip: Strings.mapLiveRoutes
        }, {
            reference: 'deviceFollowButton',
            glyph: 'xf05b@FontAwesome',
            tooltip: Strings.deviceFollow,
            stateId: 'device-follow-button',
            toggleHandler: 'onFollowClick'
        }, {
            xtype: 'settingsMenu',
            enableToggle: false
        }]
    },

    getMarkersSource: function () {
        return this.markersSource;
    },

    getAccuracySource: function () {
        return this.accuracySource;
    },

    getAccuracyLayer: function () {
        return this.accuracyLayer;
    },

    getRouteSource: function () {
        return this.routeSource;
    },

    getGeofencesSource: function () {
        return this.geofencesSource;
    },

    getLiveRouteSource: function () {
        return this.liveRouteSource;
    },

    getLiveRouteLayer: function () {
        return this.liveRouteLayer;
    },

    initMap: function () {
        this.callParent();

        this.geofencesSource = new ol.source.Vector({});
        this.map.addLayer(new ol.layer.Vector({
            name: 'geofencesLayer',
            source: this.geofencesSource
        }));

        this.liveRouteSource = new ol.source.Vector({});
        this.liveRouteLayer = new ol.layer.Vector({
            source: this.liveRouteSource,
            visible: this.lookupReference('showLiveRoutes').pressed
        });
        this.map.addLayer(this.liveRouteLayer);

        this.routeSource = new ol.source.Vector({});
        this.map.addLayer(new ol.layer.Vector({
            source: this.routeSource
        }));

        this.accuracySource = new ol.source.Vector({});
        this.accuracyLayer = new ol.layer.Vector({
            name: 'accuracyLayer',
            source: this.accuracySource
        });
        this.map.addLayer(this.accuracyLayer);

        this.markersSource = new ol.source.Vector({});
        this.map.addLayer(new ol.layer.Vector({
            source: this.markersSource
        }));
    }
});
