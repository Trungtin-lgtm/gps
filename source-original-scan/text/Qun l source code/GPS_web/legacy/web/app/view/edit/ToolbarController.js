
Ext.define('Traccar.view.edit.ToolbarController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.toolbarController',

    onAddClick: function () {
        var dialog, objectInstance = Ext.create(this.objectModel);
        objectInstance.store = this.getView().getStore();
        if (objectInstance.store instanceof Ext.data.ChainedStore) {
            objectInstance.store = objectInstance.store.getSource();
        }
        dialog = Ext.create(this.objectDialog);
        dialog.down('form').loadRecord(objectInstance);
        dialog.show();
    },

    onEditClick: function () {
        var dialog, objectInstance = this.getView().getSelectionModel().getSelection()[0];
        dialog = Ext.create(this.objectDialog);
        dialog.down('form').loadRecord(objectInstance);
        dialog.show();
    },

    onRemoveClick: function () {
        var objectInstance = this.getView().getSelectionModel().getSelection()[0];
        Ext.Msg.show({
            title: this.removeTitle,
            message: Strings.sharedRemoveConfirm,
            buttons: Ext.Msg.YESNO,
            buttonText: {
                yes: Strings.sharedRemove,
                no: Strings.sharedCancel
            },
            fn: function (btn) {
                var store = objectInstance.store;
                if (btn === 'yes') {
                    store.remove(objectInstance);
                    store.sync({
                        failure: function (batch) {
                            store.rejectChanges();
                            Traccar.app.showError(batch.exceptions[0].getError().response);
                        }
                    });
                }
            }
        });
    },

    onSelectionChange: function (selection, selected) {
        var disabled = selected.length === 0;
        this.lookupReference('toolbarEditButton').setDisabled(disabled);
        this.lookupReference('toolbarRemoveButton').setDisabled(disabled);
    }
});
