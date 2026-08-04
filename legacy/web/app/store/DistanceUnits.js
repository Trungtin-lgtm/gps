
Ext.define('Traccar.store.DistanceUnits', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name', 'factor'],

    data: [{
        key: 'km',
        name: Strings.sharedKm,
        factor: 0.001
    }, {
        key: 'mi',
        name: Strings.sharedMi,
        factor: 0.000621371
    }, {
        key: 'nmi',
        name: Strings.sharedNmi,
        factor: 0.000539957
    }],

    convertValue: function (value, unit, back) {
        var model;
        if (!unit) {
            unit = 'km';
        }
        model = this.findRecord('key', unit);
        return back ? value / model.get('factor') : value * model.get('factor');
    },

    formatValue: function (value, unit, convert) {
        var model;
        if (!unit) {
            unit = 'km';
        }
        model = this.findRecord('key', unit);
        return (convert ? this.convertValue(value, unit) : value).toFixed(2) + ' ' + model.get('name');
    }
});
