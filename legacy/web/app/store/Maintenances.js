

Ext.define('Traccar.store.Maintenances', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Maintenance',

    proxy: {
        type: 'rest',
        url: 'api/maintenance',
        writer: {
            writeAllFields: true
        }
    }
});
