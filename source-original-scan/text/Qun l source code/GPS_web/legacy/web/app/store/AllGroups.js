
Ext.define('Traccar.store.AllGroups', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Group',

    proxy: {
        type: 'rest',
        url: 'api/groups',
        extraParams: {
            all: true
        }
    }
});
