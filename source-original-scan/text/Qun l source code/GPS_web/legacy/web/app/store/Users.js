

Ext.define('Traccar.store.Users', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.User',

    proxy: {
        type: 'rest',
        url: 'api/users',
        writer: {
            writeAllFields: true
        }
    }
});
