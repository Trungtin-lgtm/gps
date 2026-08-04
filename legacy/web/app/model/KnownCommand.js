
Ext.define('Traccar.model.KnownCommand', {
    extend: 'Ext.data.Model',
    idProperty: 'type',

    fields: [{
        name: 'type',
        type: 'string'
    }, {
        name: 'name',
        convert: function (v, rec) {
            return Traccar.AttributeFormatter.getFormatter('commandType')(rec.get('type'));
        },
        depends: ['type']
    }, {
        name: 'parameters'
    }]
});
