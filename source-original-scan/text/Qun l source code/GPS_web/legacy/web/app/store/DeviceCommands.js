

Ext.define('Traccar.store.DeviceCommands', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Command',

    proxy: {
        type: 'rest',
        url: 'api/commands/send',
        listeners: {
            'exception': function (proxy, response) {
                Traccar.app.showError(response);
            }
        }
    }
});
