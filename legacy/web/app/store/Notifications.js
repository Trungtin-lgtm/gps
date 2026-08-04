

Ext.define('Traccar.store.Notifications', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Notification',

    proxy: {
        type: 'rest',
        url: 'api/notifications',
        writer: {
            writeAllFields: true
        }
    }
});
