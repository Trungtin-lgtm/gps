

Ext.define('Traccar.store.EventPositions', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Position',

    trackRemoved: false,

    proxy: {
        type: 'rest',
        url: 'api/positions',
        headers: {
            'Accept': 'application/json'
        }
    }
});
