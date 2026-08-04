
Ext.define('Traccar.view.ColorPicker', {
    extend: 'Ext.form.field.Picker',
    xtype: 'customcolorpicker',

    config: {
        value: '#008000'
    },

    editable: false,

    createPicker: function () {
        return Ext.create('Ext.picker.Color', {
            floating: true,
            picker: this,
            select: function (selColor) {
                this.picker.setValue('#' + selColor);
                this.picker.collapse();
            }
        });
    },

    setValue: function (color) {
        this.callParent([color]);
        this.setFieldStyle('background-color:' + color);
    }
});
