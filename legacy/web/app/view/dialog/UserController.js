
Ext.define('Traccar.view.dialog.UserController', {
    extend: 'Traccar.view.dialog.MapPickerController',
    alias: 'controller.user',

    init: function () {
        if (Traccar.app.getUser().get('administrator')) {
            this.lookupReference('adminField').setDisabled(false);
            this.lookupReference('deviceLimitField').setDisabled(false);
            this.lookupReference('userLimitField').setDisabled(false);
        }
        if (Traccar.app.getUser().get('administrator') || !this.getView().selfEdit) {
            this.lookupReference('readonlyField').setDisabled(false);
            this.lookupReference('disabledField').setDisabled(false);
            this.lookupReference('expirationTimeField').setDisabled(false);
            this.lookupReference('deviceReadonlyField').setDisabled(false);
            this.lookupReference('limitCommandsField').setDisabled(false);
            this.lookupReference('disableReportsField').setDisabled(false);
        }
    },

    testNotification: function () {
        Ext.Ajax.request({
            url: 'api/notifications/test',
            method: 'POST',
            failure: function (response) {
                Traccar.app.showError(response);
            }
        });
    },

    onSaveClick: function (button) {
        var dialog, record, store;
        dialog = button.up('window').down('form');
        dialog.updateRecord();
        record = dialog.getRecord();
        if (record === Traccar.app.getUser()) {
            record.save();
        } else {
            store = Ext.getStore('Users');
            if (record.phantom) {
                store.add(record);
            }
            store.sync({
                failure: function (batch) {
                    store.rejectChanges();
                    Traccar.app.showError(batch.exceptions[0].getError().response);
                }
            });
        }
        button.up('window').close();
    }
});
