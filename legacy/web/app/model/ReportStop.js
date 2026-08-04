

Ext.define('Traccar.model.ReportStop', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'deviceId',
        type: 'int'
    }, {
        name: 'deviceName',
        type: 'string'
    }, {
        name: 'duration',
        type: 'int'
    }, {
        name: 'startTime',
        type: 'date',
        dateFormat: 'c'
    }, {
        name: 'startOdometer',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('distance')
    }, {
        name: 'address',
        type: 'string'
    }, {
        name: 'endTime',
        type: 'date',
        dateFormat: 'c'
    }, {
        name: 'engineHours',
        type: 'int'
    }, {
        name: 'positionId',
        type: 'int'
    }, {
        name: 'spentFuel',
        type: 'float',
        convert: Traccar.AttributeFormatter.getConverter('spentFuel')
    }]
});
