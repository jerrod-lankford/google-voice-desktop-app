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

// URLs
const URL_GOOGLE_VOICE           = 'https://voice.google.com'
const URL_GITHUB_README          = 'https://github.com/jerrod-lankford/google-voice-desktop-app/blob/master/README.md'
const URL_GITHUB_SECURITY_POLICY = 'https://github.com/jerrod-lankford/google-voice-desktop-app/blob/master/SECURITY.md'
const URL_GITHUB_VIEW_ISSUES     = 'https://github.com/jerrod-lankford/google-voice-desktop-app/issues';
const URL_GITHUB_REPORT_BUG      = 'https://github.com/jerrod-lankford/google-voice-desktop-app/issues/new?labels=bug';
const URL_GITHUB_FEATURE_REQUEST = 'https://github.com/jerrod-lankford/google-voice-desktop-app/issues/new?labels=enhancement';
const URL_GITHUB_ASK_QUESTION    = 'https://github.com/jerrod-lankford/google-voice-desktop-app/issues/new?labels=question';
const URL_GITHUB_RELEASES        = 'https://github.com/jerrod-lankford/google-voice-desktop-app/releases';

// Default Settings
const DEFAULT_SETTING_SHOW_MENU_BAR   = true;
const DEFAULT_SETTING_THEME           = 'default';
const DEFAULT_SETTING_START_MINIMIZED = false;
const DEFAULT_SETTING_EXIT_ON_CLOSE   = false;

module.exports = {
    // Strings
    APPLICATION_NAME, // Application name (displayed in various places)

    // Images
    APPLICATION_ICON_LARGE,                // Main application icon (large)  --sufficient size for MacOS Doc
    APPLICATION_ICON_MEDIUM,               // Main application icon (medium) --sufficient size for Windows Taskbar
    APPLICATION_ICON_SMALL,                // Main application icon (small)  --sufficient size for system notification area
    APPLICATION_ICON_SMALL_WITH_INDICATOR, // Main application icon (small, with "notifications" indicator)
 
    // URLs
    URL_GOOGLE_VOICE,           // Google Voice homepage
    URL_GITHUB_README,          // The "README.md" file on GitHub
    URL_GITHUB_SECURITY_POLICY, // The "SECURITY.md" file on GitHub
    URL_GITHUB_VIEW_ISSUES,     // List of currently logged issues on GitHub
    URL_GITHUB_REPORT_BUG,      // Link to open a new bug on GitHub
    URL_GITHUB_FEATURE_REQUEST, // Link to request a feature on GitHub
    URL_GITHUB_ASK_QUESTION,    // Link to ask a question on GitHub
    URL_GITHUB_RELEASES,        // Link to published releases on GitHub

    // Default Settings
    DEFAULT_SETTING_SHOW_MENU_BAR,   // Whether the MenuBar of the main application window should be visible
    DEFAULT_SETTING_THEME,           // Default theme to apply
    DEFAULT_SETTING_START_MINIMIZED, // Whether the application should start minimized to the system notification area
    DEFAULT_SETTING_EXIT_ON_CLOSE    // Whether the application should terminate when the user closes the main application window
};