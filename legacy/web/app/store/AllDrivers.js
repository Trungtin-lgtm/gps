

Ext.define('Traccar.store.AllDrivers', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Driver',

    proxy: {
        type: 'rest',
        url: 'api/drivers',
        extraParams: {
            all: true
        }
    }
});
