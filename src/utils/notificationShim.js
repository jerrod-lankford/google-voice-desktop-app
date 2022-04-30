/**********************************************************************************************************************
 * This module's main purpose is to automatically attach a "click" handler onto all Notifications that get
 * created using JavaScript's "Notification" class.  When the attached handler is invoked (i.e. when any
 * Notification gets clicked by the user), a "notification-clicked" event gets sent to the main application
 * process, letting it know that the user has activated a notification.  Secondary to that, Notifications
 * that don't have an icon assigned to them are also modified to display this application's icon.
 **********************************************************************************************************************/

const { ipcRenderer } = require('electron');
const constants = require('../constants.js');
const path = require('path');

module.exports.notificationShim = function(appPath) {
    const OldNotification = Notification;
    Notification = function (title, options) {
        // If the specified options don't include an icon for the notification, set the icon to our application icon.
        if (!options)      { options = {}; }
        if (!options.icon) { options.icon = path.join(appPath, 'images', constants.APPLICATION_ICON_MEDIUM); }
                
        // Create a normal Notification instance using the specified parameters.
        const oldNotification = new OldNotification(title, options);
                
        // Automatically add a click handler, which notifies the main process when a click occurs.
        oldNotification.addEventListener('click', () => {
            ipcRenderer.send('notification-clicked', {});
        });

        return oldNotification;
    };

    Notification.prototype = OldNotification.prototype;
    Notification.permission = OldNotification.permission;
    Notification.requestPermission = OldNotification.requestPermission;
};

