
Ext.define('Traccar.store.Positions', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Position',

    proxy: {
        type: 'rest',
        url: 'api/positions',
        headers: {
            'Accept': 'application/json'
        }
    }
});
