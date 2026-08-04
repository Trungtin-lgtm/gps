

Ext.define('Traccar.view.dialog.MaintenanceController', {
    extend: 'Traccar.view.dialog.BaseEditController',
    alias: 'controller.maintenance',

    init: function () {
        this.startConfig = Ext.clone(this.lookupReference('startField').initialConfig);
        this.startConfig.value = 0;
        this.periodConfig = Ext.clone(this.lookupReference('periodField').initialConfig);
        this.periodConfig.value = 0;
        this.lookupReference('saveButton').setDisabled(true);
    },

    onValidityChange: function (form, valid) {
        this.lookupReference('saveButton').setDisabled(!valid);
    },

    updateFieldConfig: function (fieldReference, initialConfig, newConfig) {
        var field = this.lookupReference(fieldReference);
        if (field.dataType !== newConfig.dataType) {
            this.getView().down('fieldset').insert(this.getView().down('fieldset').items.indexOf(field),
                Ext.merge({}, initialConfig, newConfig));
            this.getView().down('fieldset').remove(field);
            this.lookupReference(fieldReference).validate();
        } else {
            field.setConfig(newConfig);
            field.validate();
        }
    },

    onNameChange: function (combobox, newValue) {
        var attribute, config = {};
        attribute = combobox.getStore().getById(newValue);
        if (attribute) {
            if (attribute.get('allowDecimals') !== undefined) {
                config.allowDecimals = attribute.get('allowDecimals');
            } else {
                config.allowDecimals = true;
            }
            config.dataType = attribute.get('dataType');
            config.maxValue = attribute.get('maxValue');
            config.minValue = attribute.get('minValue');
        }

        this.updateFieldConfig('startField', this.startConfig, config);
        this.updateFieldConfig('periodField', this.periodConfig, config);
    }
});
