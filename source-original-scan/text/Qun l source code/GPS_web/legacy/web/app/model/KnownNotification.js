
Ext.define('Traccar.model.KnownNotification', {
    extend: 'Ext.data.Model',
    idProperty: 'type',

    fields: [{
        name: 'type',
        type: 'string'
    }, {
        name: 'name',
        convert: function (v, rec) {
            return Traccar.app.getEventString(rec.get('type'));
        },
        depends: ['type']
    }]
});
