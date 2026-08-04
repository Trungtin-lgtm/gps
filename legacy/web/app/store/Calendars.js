
Ext.define('Traccar.store.Calendars', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Calendar',

    proxy: {
        type: 'rest',
        url: 'api/calendars',
        writer: {
            writeAllFields: true
        }
    }
});
