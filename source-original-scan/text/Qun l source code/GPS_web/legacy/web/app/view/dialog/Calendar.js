
Ext.define('Traccar.view.dialog.Calendar', {
    extend: 'Traccar.view.dialog.BaseEdit',

    requires: [
        'Traccar.view.dialog.CalendarController',
        'Traccar.view.UnescapedTextField'
    ],

    controller: 'calendar',
    title: Strings.sharedCalendar,

    items: {
        xtype: 'form',
        items: [{
            xtype: 'fieldset',
            title: Strings.sharedRequired,
            items: [{
                xtype: 'unescapedTextField',
                name: 'name',
                fieldLabel: Strings.sharedName,
                allowBlank: false
            }, {
                xtype: 'filefield',
                name: 'file',
                fieldLabel: Strings.sharedFile,
                allowBlank: false,
                buttonConfig: {
                    glyph: 'xf093@FontAwesome',
                    text: '',
                    tooltip: Strings.sharedSelectFile,
                    tooltipType: 'title',
                    minWidth: 0
                },
                listeners: {
                    change: 'onFileChange'
                }
            }]
        }, {
            xtype: 'hiddenfield',
            name: 'data',
            allowBlank: false,
            reference: 'dataField'
        }]
    }
});
