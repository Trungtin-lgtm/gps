
Ext.define('Traccar.store.AllNotifications', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Notification',

    proxy: {
        type: 'rest',
        url: 'api/notifications',
        extraParams: {
            all: true
        }
    }
});
