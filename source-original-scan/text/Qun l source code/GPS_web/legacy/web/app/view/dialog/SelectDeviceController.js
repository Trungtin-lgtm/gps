

Ext.define('Traccar.view.dialog.SelectDeviceController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.selectDevice',

    onSaveClick: function (button) {
        var deviceId, record;
        deviceId = this.lookupReference('deviceField').getValue();
        record = this.getView().record.data;
        Ext.Ajax.request({
            url: 'api/attributes/computed/test?deviceId=' + deviceId,
            method: 'POST',
            jsonData: Ext.util.JSON.encode(record),
            callback: function (options, success, response) {
                if (success) {
                    Ext.Msg.alert(Strings.sharedInfoTitle, response.responseText || response.statusText);
                } else {
                    Traccar.app.showError(response);
                }
            }
        });
        button.up('window').close();
    },

    onDeviceChange: function (combobox, newValue) {
        this.lookupReference('saveButton').setDisabled(newValue === null);
    }
});
