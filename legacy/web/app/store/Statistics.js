

Ext.define('Traccar.store.Statistics', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Statistics',

    proxy: {
        type: 'rest',
        url: 'api/statistics'
    }
});
