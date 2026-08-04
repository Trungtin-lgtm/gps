
Ext.define('Traccar.view.edit.SavedCommandsController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.savedCommands',

    requires: [
        'Traccar.view.dialog.SavedCommand',
        'Traccar.model.Command'
    ],

    objectModel: 'Traccar.model.Command',
    objectDialog: 'Traccar.view.dialog.SavedCommand',
    removeTitle: Strings.sharedSavedCommand
});
