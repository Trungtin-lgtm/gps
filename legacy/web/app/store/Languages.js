

Ext.define('Traccar.store.Languages', {
    extend: 'Ext.data.Store',
    fields: ['code', 'name'],

    data: (function () {
        var code, data = [];
        for (code in Locale.languages) {
            if (Locale.languages.hasOwnProperty(code)) {
                data.push({
                    code: code,
                    name: Locale.languages[code].name
                });
            }
        }
        return data;
    })()
});
