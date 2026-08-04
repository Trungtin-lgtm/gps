

Ext.define('Traccar.store.AllGeofences', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Geofence',

    proxy: {
        type: 'rest',
        url: 'api/geofences',
        extraParams: {
            all: true
        }
    }
});
