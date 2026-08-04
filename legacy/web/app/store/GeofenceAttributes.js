
Ext.define('Traccar.store.GeofenceAttributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.KnownAttribute',
    proxy: 'memory',

    data: [{
        key: 'color',
        name: Strings.attributeColor,
        valueType: 'color'
    }, {
        key: 'speedLimit',
        name: Strings.attributeSpeedLimit,
        valueType: 'number',
        dataType: 'speed'
    }, {
        key: 'polylineDistance',
        name: Strings.attributePolylineDistance,
        valueType: 'number',
        dataType: 'distance'
    }]
});
