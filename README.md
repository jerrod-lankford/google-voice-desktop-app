## Why
We are annoyed at the lack of desktop app for voice, like hangouts had.

## What does it do
It just lets you keep voice open without a chrome browser. It will also check the dom for notifications and display a badge in the task bar and closing the app will send it to a tray instead of closing.

## Supported Operating Systems
This is a fork of the original repo. This fork is currently maintained for Windows only and still accepts PRs and is being updated. 

The [Original Repo](https://github.com/Jerrkawz/google-voice-desktop-app/) supports both OSX, Windows 10 & Linux.

Questions? Ideas? Join us in discord https://discord.gg/3SSS6vkKET

## Installation
[Releases Page](https://github.com/latin-programmer/google-voice-desktop-app/releases)

For Mac and Linux support, you can use an older version of the app (the original) at: [Releases Page](https://github.com/Jerrkawz/google-voice-desktop-app/releases) and download the release for your OS. In the original version, simply uzip and drag into the applications folder (mac) or run the executable (windows) or run the app image (ubuntu)

**Mac Note: The mac version is unsigned, so you will have to click "Open Anyway" after running, or go to Settings > Security & Privacy > General > Open Anyway. The original author did not want to pay for a dev license just for this**

**Linux Note: You will have to make the AppImage executable in order to run it. Right Click > Properties > Permissions > Allow Executing file as a program**

## Customize
You can change settings, apply themes and other things in the customization page. Go to `Electron > Settings` on Mac in the global menu bar, or `File > Settings` on windows. If you've hidden the menu bar you can also access the settings from the system tray.

**Windows Settings**

![Windows Settings](/screenshots/windowsSettings.png?raw=true)

**Mac Settings**

![Mac Settings](/screenshots/macSettings.png?raw=true)

**System Tray Settings**

![System Tray Settings](/screenshots/systemTraySettings.png?raw=true)

## Themes
The latest version now supports custom themes, which can be set in the Settings dialog.

Not only themes but also a system for themeing! If you want to create your own theme and contribute back to the project you can do that [here](THEMES.md).

## Run From Source
`git clone git@github.com:latin-programmer/google-voice-desktop-app.git`

`npm install -g yarn`

`yarn install`

`yarn start`

To build yourself you can run
`yarn run build:windows` or `yarn run build:mac` or `yarn run build:linux`

Note: for the current maintainer is only able to do windows builds. If you would like, you can review what is needed for the mac and linux versions and help out with those (basically, for mac you need a Mac, and for Linux you need a Linux VM).

## Screenshots

**Main window:**

![Windows](/screenshots/windows.png?raw=true)

**Dracula theme:**

![Dracula](/screenshots/dracula.png?raw=true)

**Solar theme:**

![Solar](/screenshots/solar.png?raw=true)

**Minty theme:**

![Minty](/screenshots/minty.png?raw=true)

**Cerulean theme:**

![Cerulean](/screenshots/cerulean.png?raw=true)

## Attributions
- Jerrkawz, who did almost 100% of the work for the original app: https://github.com/Jerrkawz/google-voice-desktop-app/
- Dracula: https://github.com/dracula/dracula-theme
- Solar / Minty / Cerulean: https://bootswatch.com/
