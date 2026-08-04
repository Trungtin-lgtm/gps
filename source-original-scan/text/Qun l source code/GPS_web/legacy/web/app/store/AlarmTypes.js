
Ext.define('Traccar.store.AlarmTypes', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name'],

    data: (function () {
        var key, items = [];
        for (key in Strings) {
            if (Strings.hasOwnProperty(key) && key.lastIndexOf('alarm', 0) === 0) {
                items.push({
                    key: key.charAt(5).toLowerCase() + key.slice(6),
                    name: Strings[key]
                });
            }
        }
        return items;
    })()
});
