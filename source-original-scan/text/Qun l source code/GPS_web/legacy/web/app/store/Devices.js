

Ext.define('Traccar.store.Devices', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Device',

    proxy: {
        type: 'rest',
        url: 'api/devices',
        writer: {
            writeAllFields: true
        }
    }
});
