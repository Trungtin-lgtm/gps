
Ext.define('Traccar.store.DeviceAttributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownAttribute',

    data: [{
        key: 'web.reportColor',
        name: Strings.attributeWebReportColor,
        valueType: 'color'
    }, {
        key: 'devicePassword',
        name: Strings.attributeDevicePassword,
        valueType: 'string'
    }, {
        key: 'processing.copyAttributes',
        name: Strings.attributeProcessingCopyAttributes,
        valueType: 'string'
    }, {
        key: 'decoder.timezone',
        name: Strings.sharedTimezone,
        valueType: 'string',
        dataType: 'timezone'
    }, {
        key: 'deviceInactivityStart',
        name: Strings.attributeDeviceInactivityStart,
        valueType: 'number',
        allowDecimals: false,
        minValue: 1
    }, {
        key: 'deviceInactivityPeriod',
        name: Strings.attributeDeviceInactivityPeriod,
        valueType: 'number',
        allowDecimals: false,
        minValue: 1
    }]
});
