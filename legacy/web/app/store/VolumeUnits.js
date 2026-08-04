
Ext.define('Traccar.store.VolumeUnits', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name', 'fullName', 'factor'],

    data: [{
        key: 'ltr',
        name: Strings.sharedLiterAbbreviation,
        fullName: Strings.sharedLiter,
        factor: 1
    }, {
        key: 'impGal',
        name: Strings.sharedGallonAbbreviation,
        fullName: Strings.sharedImpGallon,
        factor: 4.546
    }, {
        key: 'usGal',
        name: Strings.sharedGallonAbbreviation,
        fullName: Strings.sharedUsGallon,
        factor: 3.785
    }],

    convertValue: function (value, unit, back) {
        var model;
        if (!unit) {
            unit = 'ltr';
        }
        model = this.findRecord('key', unit);
        return back ? value * model.get('factor') : value / model.get('factor');
    },

    formatValue: function (value, unit, convert) {
        var model;
        if (!unit) {
            unit = 'ltr';
        }
        model = this.findRecord('key', unit);
        return (convert ? this.convertValue(value, unit) : value).toFixed(1) + ' ' + model.get('name');
    }
});
