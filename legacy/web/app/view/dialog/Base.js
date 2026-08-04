

Ext.define('Traccar.view.dialog.Base', {
    extend: 'Ext.window.Window',

    bodyPadding: Traccar.Style.normalPadding,
    resizable: false,
    scrollable: true,
    constrain: true,

    initComponent: function () {
        if (window.innerHeight) {
            this.maxHeight = window.innerHeight - Traccar.Style.normalPadding * 2;
        }
        this.callParent();
    }
});
