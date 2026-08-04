

Ext.define('Traccar.store.ReportTrips', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.ReportTrip',

    proxy: {
        type: 'rest',
        url: 'api/reports/trips',
        timeout: Traccar.Style.reportTimeout,
        headers: {
            'Accept': 'application/json'
        },
        listeners: {
            exception: function (proxy, exception) {
                Traccar.app.showError(exception);
            }
        }
    }
});
