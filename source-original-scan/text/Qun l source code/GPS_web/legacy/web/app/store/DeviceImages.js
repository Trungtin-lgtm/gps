
Ext.define('Traccar.store.DeviceImages', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name', 'svg', 'fillId', 'rotateId', 'scaleId'],

    data: (function () {
        var i, key, data = [];
        for (i = 0; i < window.Images.length; i++) {
            key = window.Images[i];
            data.push({
                key: key,
                name: Strings['category' + key.charAt(0).toUpperCase() + key.slice(1)],
                svg: document.getElementById(key + 'Svg').contentDocument,
                fillId: key === 'arrow' ? 'arrow' : 'background',
                rotateId: key === 'arrow' ? 'arrow' : 'background',
                scaleId: key === 'arrow' ? 'arrow' : 'layer1'
            });
        }
        return data;
    })()
});
