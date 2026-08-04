
Ext.define('Traccar.view.BaseWindow', {
    extend: 'Ext.window.Window',

    width: Traccar.Style.windowWidth,
    height: Traccar.Style.windowHeight,
    layout: 'fit',

    initComponent: function () {
        if (window.innerWidth < Traccar.Style.windowWidth || window.innerHeight < Traccar.Style.windowHeight) {
            this.maximized = true;
            this.style = 'border-width: 0';
        }
        this.callParent();
    }
});
