

Ext.define('Traccar.view.dialog.Register', {
    extend: 'Traccar.view.dialog.Base',

    requires: [
        'Traccar.view.dialog.RegisterController'
    ],

    controller: 'register',

    title: Strings.loginRegister,

    items: {
        xtype: 'form',
        reference: 'form',
        jsonSubmit: true,

        items: [{
            xtype: 'textfield',
            name: 'name',
            fieldLabel: Strings.sharedName,
            allowBlank: false
        }, {
            xtype: 'textfield',
            name: 'email',
            fieldLabel: Strings.userEmail,
            validator: function (val) {
                if (/(.+)@(.+)\.(.{2,})/.test(val)) {
                    return true;
                } else {
                    return Ext.form.field.VTypes.emailText;
                }
            },
            allowBlank: false
        }, {
            xtype: 'textfield',
            name: 'password',
            fieldLabel: Strings.userPassword,
            inputType: 'password',
            allowBlank: false
        }]
    },

    buttons: [{
        text: Strings.sharedSave,
        handler: 'onCreateClick'
    }, {
        text: Strings.sharedCancel,
        handler: 'closeView'
    }]
});
