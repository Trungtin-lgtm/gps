
Ext.define('Traccar.view.GridPanel', {
    extend: 'Ext.grid.Panel',
    xtype: 'customGridPanel',

    requires: [
        'Ext.grid.filters.Filters'
    ],

    plugins: 'gridfilters',

    viewConfig: {
        enableTextSelection: true,
        getRowClass: function () {
            return this.enableTextSelection ? 'x-selectable' : '';
        }
    }
});
