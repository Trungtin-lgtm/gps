
Ext.define('Traccar.view.edit.ComputedAttributesController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.computedAttributes',

    requires: [
        'Traccar.view.dialog.ComputedAttribute',
        'Traccar.model.ComputedAttribute'
    ],

    objectModel: 'Traccar.model.ComputedAttribute',
    objectDialog: 'Traccar.view.dialog.ComputedAttribute',
    removeTitle: Strings.sharedComputedAttribute
});
