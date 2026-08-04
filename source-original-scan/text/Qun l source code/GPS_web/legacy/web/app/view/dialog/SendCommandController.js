
Ext.define('Traccar.view.dialog.SendCommandController', {
    extend: 'Traccar.view.dialog.SavedCommandController',
    alias: 'controller.sendCommand',

    requires: [
        'Traccar.view.permissions.SavedCommands'
    ],

    onSendClick: function (button) {
        var record;
        this.fillAttributes(button);
        record = button.up('window').down('form').getRecord();

        Ext.Ajax.request({
            scope: this,
            url: 'api/commands/send',
            jsonData: record.getData(),
            callback: this.onSendResult
        });
    },

    onValidityChange: function (form, valid) {
        this.lookupReference('sendButton').setDisabled(!valid ||
                this.lookupReference('commandsComboBox').getValue() === null);
    },

    onTextChannelChange: function (checkbox, newValue) {
        var typesStore = this.lookupReference('commandType').getStore();
        typesStore.getProxy().setExtraParam('textChannel', newValue);
        typesStore.reload();
    },

    onCommandSelect: function (selected) {
        var record, form, command = selected.getStore().getById(selected.getValue());
        command.set('deviceId', this.getView().deviceId);
        form = selected.up('window').down('form');
        record = form.getRecord();
        form.loadRecord(command);
        if (record && command.get('type') === record.get('type')) {
            this.onTypeChange(this.lookupReference('commandType'), command.get('type'));
        }

        this.lookupReference('newCommandFields').setDisabled(command.getId() !== 0);
        this.lookupReference('sendButton').setDisabled(command.getId() === 0);
    },

    onSendResult: function (options, success, response) {
        if (success) {
            this.closeView();
            Traccar.app.showToast(response.status === 202 ? Strings.commandQueued : Strings.commandSent);
        } else {
            Traccar.app.showError(response);
        }
    },

    closeView: function () {
        this.lookupReference('commandsComboBox').getStore().removeAll();
        this.callParent(arguments);
    }
});
