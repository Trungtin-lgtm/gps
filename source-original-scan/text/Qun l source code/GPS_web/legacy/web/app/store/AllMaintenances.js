

Ext.define('Traccar.store.AllMaintenances', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Maintenance',

    proxy: {
        type: 'rest',
        url: 'api/maintenance',
        extraParams: {
            all: true
        }
    }
});
