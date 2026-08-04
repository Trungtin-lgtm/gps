

Ext.define('Traccar.store.AllNotificators', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownNotificator',

    proxy: {
        type: 'rest',
        url: 'api/notifications/notificators',
        listeners: {
            exception: function (proxy, response) {
                Traccar.app.showError(response);
            }
        }
    }
});
