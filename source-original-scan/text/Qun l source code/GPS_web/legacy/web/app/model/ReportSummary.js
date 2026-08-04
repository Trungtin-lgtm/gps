
Ext.define('Traccar.model.ReportSummary', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'deviceId',
        type: 'int'
    }, {
        name: 'deviceName',
        type: 'string'
    }, {
        name: 'startTime',
        type: 'date',
        dateFormat: 'c'
    }, {
        name: 'maxSpeed',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('speed')
    }, {
        name: 'averageSpeed',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('speed')
    }, {
        name: 'distance',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('distance')
    }, {
        name: 'startOdometer',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('distance')
    }, {
        name: 'endOdometer',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('distance')
    }, {
        name: 'engineHours',
        type: 'int'
    }, {
        name: 'spentFuel',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('spentFuel')
    }]
});
