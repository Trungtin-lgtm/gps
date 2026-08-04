
Ext.define('Traccar.store.GroupAttributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownAttribute',

    data: [{
        key: 'processing.copyAttributes',
        name: Strings.attributeProcessingCopyAttributes,
        valueType: 'string'
    }, {
        key: 'decoder.timezone',
        name: Strings.sharedTimezone,
        valueType: 'string',
        dataType: 'timezone'
    }]
});
