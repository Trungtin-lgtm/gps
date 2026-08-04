

Ext.define('Traccar.view.CustomTimeField', {
    extend: 'Ext.form.field.Time',
    xtype: 'customTimeField',

    constructor: function (config) {
        config.format = Traccar.Style.timeFormat24;
        this.callParent(arguments);
    }
});
