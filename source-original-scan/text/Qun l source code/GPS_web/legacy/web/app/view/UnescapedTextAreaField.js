
Ext.define('Traccar.view.UnescapedTextAreaField', {
    extend: 'Ext.form.field.TextArea',
    xtype: 'unescapedTextAreaField',

    initComponent: function () {
        this.callParent();
        this.on('change', this.onValueChange);
    },

    onValueChange: function (field, newValue) {
        field.setValue(Ext.String.htmlDecode(newValue));
    }
});
