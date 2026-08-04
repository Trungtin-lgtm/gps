
Ext.define('Traccar.view.edit.GeofencesController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.geofences',

    requires: [
        'Traccar.view.dialog.Geofence',
        'Traccar.model.Geofence'
    ],

    objectModel: 'Traccar.model.Geofence',
    objectDialog: 'Traccar.view.dialog.Geofence',
    removeTitle: Strings.sharedGeofence
});
