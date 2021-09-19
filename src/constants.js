/**********************************************************************************************************************
 * This module contains constants that are meant to be used throughout the entire application.
 **********************************************************************************************************************/

// Strings
const APPLICATION_NAME = 'Voice Desktop';

// Images
const APPLICATION_ICON_LARGE                = '1024px-Google_Voice_icon_(2020).png';
const APPLICATION_ICON_MEDIUM               = '64px-Google_Voice_icon_(2020).png';
const APPLICATION_ICON_SMALL                = 'tray-Google_Voice_icon_(2020).png';
const APPLICATION_ICON_SMALL_WITH_INDICATOR = 'tray-dirty-Google_Voice_icon_(2020).png';

module.exports = {
    // Strings
    APPLICATION_NAME, // Application name (displayed in various places)

    // Images
    APPLICATION_ICON_LARGE,               // Main application icon (large)  --sufficient size for MacOS Doc
    APPLICATION_ICON_MEDIUM,              // Main application icon (medium) --sufficient size for Windows Taskbar
    APPLICATION_ICON_SMALL,               // Main application icon (small)  --sufficient size for system notification area
    APPLICATION_ICON_SMALL_WITH_INDICATOR // Main application icon (small, with "notifications" indicator)
};