

Ext.define('Traccar.store.Drivers', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Driver',

    proxy: {
        type: 'rest',
        url: 'api/drivers',
        writer: {
            writeAllFields: true
        }
    }
});
