
Ext.define('Traccar.view.dialog.DeviceController', {
    extend: 'Traccar.view.dialog.BaseEditController',
    alias: 'controller.device',

    init: function () {
        if (Traccar.app.getUser().get('administrator')) {
            this.lookupReference('disabledField').setHidden(false);
        }
    }

});
