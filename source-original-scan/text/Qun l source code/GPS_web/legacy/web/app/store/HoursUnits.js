
Ext.define('Traccar.store.HoursUnits', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name', 'fullName'],

    data: [{
        key: 'h',
        name: Strings.sharedHourAbbreviation,
        fullName: Strings.sharedHour
    }],

    convertValue: function (value, unit, back) {
        return back ? value * 3600000 : value / 3600000;
    },

    formatValue: function (value, unit, convert) {
        var hours, minutes;
        if (convert) {
            hours = Math.floor(value / 3600000);
            minutes = Math.floor(value % 3600000 / 60000);
        } else {
            hours = Math.floor(value);
            minutes = Math.floor(value % 1 * 60);
        }
        return hours + ' ' + Strings.sharedHourAbbreviation + ' ' + minutes + ' ' + Strings.sharedMinuteAbbreviation;
    }
});
