
Ext.define('Traccar.view.ClearableComboBox', {
    extend: 'Ext.form.field.ComboBox',
    xtype: 'clearableComboBox',

    editable: false,
    triggers: {
        clear: {
            cls: 'iconCls: x-fa fa-times',
            handler: function (button) {
                button.clearValue();
            }
        }
    }
});
