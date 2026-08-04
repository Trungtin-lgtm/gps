
Ext.define('Traccar.store.Groups', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Group',

    proxy: {
        type: 'rest',
        url: 'api/groups',
        writer: {
            writeAllFields: true
        }
    }
});
