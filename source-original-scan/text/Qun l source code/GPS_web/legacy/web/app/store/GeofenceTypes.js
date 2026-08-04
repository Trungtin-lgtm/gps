

Ext.define('Traccar.store.GeofenceTypes', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name'],

    data: [{
        key: 'Polygon',
        name: Strings.mapShapePolygon
    }, {
        key: 'Circle',
        name: Strings.mapShapeCircle
    }, {
        key: 'LineString',
        name: Strings.mapShapePolyline
    }]
});
