/** 
 * These mappings may seem ridiculous and non-sensesical, and they are... but they are for a reason
 * I tried to pick identifiers in google voice's cryptic ass css classes that are not likely to change
 * They roughly correlate to components on the page. See THEMES.md for more details on these components
 */
module.exports = {
    "navbar": [
        "header"
    ],
    "navbar-title": [
        "header [title='Google Voice'] > span"
    ],
    "navbar-search": [
        "header form[role='search']"
    ],
    "side-nav": [
        "gv-side-nav"
    ],
    "side-nav-item": [
        "gmat-nav-list .navListItem"
    ],
    "side-nav-item-active": [
        "gv-side-nav a.navListItem.gmat-list-item-active"
    ],
    "conversation": [
        "gv-message-list",
        "gv-voicemail-player md-content",
        "gv-inbox-summary-ng2"
    ],
    "conversation-header": [
        "gv-message-list-header > div"
    ],
    "conversation-title": [
        "gv-message-list-header [gv-test-id='conversation-title']",
        "gv-message-list-header [gv-test-id='conversation-subtitle']",
        "[aria-label='Group message']"
    ],
    "conversation-summary": [
        "gv-inbox-summary-ng2 .gv-inbox-summary .greeting",
        "gv-inbox-summary-ng2 .gv-inbox-summary .status"
    ],
    "conversation-footer": [
        "gv-message-entry > div"
    ],
    "conversation-recieved": [
        "gv-message-item [layout-align='start start'] [gv-test-id='bubble']",
    ],
    "conversation-sent": [
        "gv-message-item [layout-align='start end'] [gv-test-id='bubble']"
    ],
    "conversation-timestamp": [
        "[gv-test-id='sms-sender-time-stamp'] > span"
    ],
    "conversation-link": [
        "gv-message-item gv-annotation a"
    ],
    "list": [
        "gv-conversation-list",
        "#contact-list",
        "body [role='listbox']"

    ],
    "list-item": [
        "gv-thread-item .layout-row.md-ink-ripple",
        "[gv-test-id='send-new-message']", // send new message button
        "gv-recipient-picker md-content", // Recipient picker wrapper
        "gv-recipient-picker > div", // Select recipient picker on new call screen
        "gv-call-as-banner", // Call as banner on phone number right panel
        "gv-make-call-panel .layout-align-start-center", // Enter a name or number box
        "gv-frequent-contact-card",
        "gv-contact-item"
    ],
    "list-item-active": [
        "gv-thread-item > div.layout-row[aria-selected='true']"
    ], 
    "list-item-heading": [
        "gv-thread-item div.layout-row gv-annotation[gv-test-id='item-contact']",
        "gv-frequent-contact-card [layout-align='start start'] > div",
        "gv-frequent-contact-card [layout-align='start center'] > span",
        "gv-contact-item div.layout-row :first-child",
        "gv-contact-list .gmat-overline",
        ".gmat-subhead-2", // send new message text
        "gv-recipient-picker md-content", // recipient picker wrapper
        "gv-recipient-picker md-content md-input-container label", // recipient picker placeholder label
        "gv-call-as-banner .phone-number-details .phone-number-name", // Call as banner phone number name
        "gv-call-as-banner .phone-number-details .phone-number", // Call as banner phone number
        "gv-make-call-panel .layout-align-start-center md-input-container"
    ],
    "dial-pad": [
        "gv-dialpad > div"
    ],
    "dial-pad-button": [
        "gv-dialpad [role='gridcell'] > div",
        "gv-dialpad [role='gridcell'] .gmat-caption"
    ],
    "dial-pad-toggle" : [
        "gv-dialpad-toggle button"
    ]
}

