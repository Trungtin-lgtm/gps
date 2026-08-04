
Ext.define('Traccar.view.permissions.Base', {
    extend: 'Traccar.view.GridPanel',

    requires: [
        'Traccar.view.permissions.BaseController'
    ],

    controller: 'base',

    selModel: {
        selType: 'checkboxmodel',
        checkOnly: true,
        showHeaderCheckbox: false
    },

    listeners: {
        beforedeselect: 'onBeforeDeselect',
        beforeselect: 'onBeforeSelect'
    }
});
