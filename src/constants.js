/**********************************************************************************************************************
 * This module contains constants that are meant to be used throughout the entire application.  Each constant is
 * defined using the define() function which ensures that it remains read-only when this module is consumed.
 **********************************************************************************************************************/

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// Strings
define('APPLICATION_NAME', 'Voice Desktop'); // Application name

// Images
define('APPLICATION_ICON_Large',              '1024px-Google_Voice_icon_(2020).png');     // Application icon (large)  --sufficient size for MacOS Doc
define('APPLICATION_ICON_Medium',             '64px-Google_Voice_icon_(2020).png');       // Application icon (medium) --sufficient size for Windows Taskbar
define('APPLICATION_ICON_Small',              'tray-Google_Voice_icon_(2020).png');       // Application icon (small)  --sufficient size for system notification area
define('APPLICATION_ICON_SmallWithIndicator', 'tray-dirty-Google_Voice_icon_(2020).png'); // Application icon (small, with "notifications" indicator)