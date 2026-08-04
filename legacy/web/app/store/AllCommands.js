

Ext.define('Traccar.store.AllCommands', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Command',

    proxy: {
        type: 'rest',
        url: 'api/commands',
        extraParams: {
            all: true
        }
    }
});
