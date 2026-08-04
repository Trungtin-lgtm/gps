
Ext.define('Traccar.view.UnescapedTextField', {
    extend: 'Ext.form.field.Text',
    xtype: 'unescapedTextField',

    initComponent: function () {
        this.callParent();
        this.on('change', this.onValueChange);
    },

    onValueChange: function (field, newValue) {
        field.setValue(Ext.String.htmlDecode(newValue));
    }
});
