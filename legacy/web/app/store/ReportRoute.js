

Ext.define('Traccar.store.ReportRoute', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Position',

    proxy: {
        type: 'rest',
        url: 'api/reports/route',
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
