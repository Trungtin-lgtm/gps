
Ext.define('Traccar.store.CommonDeviceAttributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownAttribute',

    data: [{
        key: 'speedLimit',
        name: Strings.attributeSpeedLimit,
        valueType: 'number',
        dataType: 'speed'
    }, {
        key: 'report.ignoreOdometer',
        name: Strings.attributeReportIgnoreOdometer,
        valueType: 'boolean'
    }]
});
