

Ext.define('Traccar.store.AllNotificationTypes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownNotification',

    proxy: {
        type: 'rest',
        url: 'api/notifications/types',
        listeners: {
            exception: function (proxy, response) {
                Traccar.app.showError(response);
            }
        }
    }
});
