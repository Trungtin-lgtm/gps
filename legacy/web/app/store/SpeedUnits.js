

Ext.define('Traccar.store.SpeedUnits', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name', 'factor'],

    data: [{
        key: 'kn',
        name: Strings.sharedKn,
        factor: 1
    }, {
        key: 'kmh',
        name: Strings.sharedKmh,
        factor: 1.852
    }, {
        key: 'mph',
        name: Strings.sharedMph,
        factor: 1.15078
    }],

    convertValue: function (value, unit, back) {
        var model;
        if (!unit) {
            unit = 'kn';
        }
        model = this.findRecord('key', unit);
        return back ? value / model.get('factor') : value * model.get('factor');
    },

    formatValue: function (value, unit, convert) {
        var model;
        if (!unit) {
            unit = 'kn';
        }
        model = this.findRecord('key', unit);
        return (convert ? this.convertValue(value, unit) : value).toFixed(1) + ' ' + model.get('name');
    }
});
