

Ext.define('Traccar.store.TimeUnits', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name', 'factor'],

    data: [{
        key: 's',
        name: Strings.sharedSecondAbbreviation,
        factor: 1
    }, {
        key: 'm',
        name: Strings.sharedMinuteAbbreviation,
        factor: 60
    }, {
        key: 'h',
        name: Strings.sharedHourAbbreviation,
        factor: 3600
    }],

    convertValue: function (value, unit, back) {
        var model;
        if (!unit) {
            unit = 'kn';
        }
        model = this.findRecord('key', unit);
        return back ? value * model.get('factor') : value / model.get('factor');
    }
});
