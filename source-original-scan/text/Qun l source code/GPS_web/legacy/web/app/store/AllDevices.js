

Ext.define('Traccar.store.AllDevices', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Device',

    proxy: {
        type: 'rest',
        url: 'api/devices',
        extraParams: {
            all: true
        }
    }
});
