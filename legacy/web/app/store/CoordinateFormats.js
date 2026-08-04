

Ext.define('Traccar.store.CoordinateFormats', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name'],

    data: [{
        key: 'dd',
        name: Strings.sharedDecimalDegrees
    }, {
        key: 'ddm',
        name: Strings.sharedDegreesDecimalMinutes
    }, {
        key: 'dms',
        name: Strings.sharedDegreesMinutesSeconds
    }],

    formatValue: function (key, value, unit) {
        var hemisphere, degrees, minutes, seconds;
        if (key === 'latitude') {
            hemisphere = value >= 0 ? 'N' : 'S';
        } else {
            hemisphere = value >= 0 ? 'E' : 'W';
        }
        switch (unit) {
            case 'ddm':
                value = Math.abs(value);
                degrees = Math.floor(value);
                minutes = (value - degrees) * 60;
                return degrees + '° ' + minutes.toFixed(Traccar.Style.coordinatePrecision) + '\' ' + hemisphere;
            case 'dms':
                value = Math.abs(value);
                degrees = Math.floor(value);
                minutes = Math.floor((value - degrees) * 60);
                seconds = Math.round((value - degrees - minutes / 60) * 3600);
                return degrees + '° ' + minutes + '\' ' + seconds + '" ' + hemisphere;
            default:
                return value.toFixed(Traccar.Style.coordinatePrecision) + '°';
        }
    }
});
