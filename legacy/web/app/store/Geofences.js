

Ext.define('Traccar.store.Geofences', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Geofence',

    proxy: {
        type: 'rest',
        url: 'api/geofences',
        writer: {
            writeAllFields: true
        }
    }
});
