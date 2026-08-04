
Ext.define('Traccar.store.AllCalendars', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Calendar',

    proxy: {
        type: 'rest',
        url: 'api/calendars',
        extraParams: {
            all: true
        }
    }
});
