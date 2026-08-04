
Ext.define('Traccar.store.CommandTypes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownCommand',

    proxy: {
        type: 'rest',
        url: 'api/commands/types',
        listeners: {
            'exception': function (proxy, response) {
                Traccar.app.showError(response);
            }
        }
    }
});
