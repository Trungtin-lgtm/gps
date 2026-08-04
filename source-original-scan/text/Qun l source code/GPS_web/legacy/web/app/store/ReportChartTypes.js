

Ext.define('Traccar.store.ReportChartTypes', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name'],

    data: [{
        key: 'speed',
        name: Strings.positionSpeed
    }, {
        key: 'accuracy',
        name: Strings.positionAccuracy
    }, {
        key: 'altitude',
        name: Strings.positionAltitude
    }]
});
