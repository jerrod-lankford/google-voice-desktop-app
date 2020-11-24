## Why
I'm annoyed at the lack of desktop app for voice, like hangouts had.

## What does it do
It just lets you keep voice open without a chrome browser. It will also check the dom for notifications and display a badge in the task bar and closing the app will send it to a tray instead of closing.

## Support
Currently supports both OSX, Windows 10 & Ubuntu

Questions? Ideas? Join us in discord https://discord.gg/htpzmxz9

## Install
Go to the [Releases Page](https://github.com/Jerrkawz/google-voice-desktop-app/releases) and download the release for your OS.

Simply uzip and drag into the applications folder (mac) or run the executable (windows) or run the app image (ubuntu)

**Mac Note: The mac version is unsigned, so you will have to click "Open Anyway" after running, or go to Settings > Security & Privacy > General > Open Anyway. Sorry not paying for a dev license just for this**


**Ubuntu Note: You will have to make the AppImage executable in order to run it. Right Click > Properties > Permissions > Allow Executing file as a program**

## Run From Source
`git clone git@github.com:Jerrkawz/google-voice-desktop-app.git`

`npm install`

`npm start`

To build yourself you can run
`npm run build:windows` or `npm run build:mac` or `npm run build:linux`

## Screenshots
![Windows](/images/windows.png?raw=true")
