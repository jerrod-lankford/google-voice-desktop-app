const audioElement = document.getElementById('audio-element');

window.electronAPI.playSound((event, value) => {
    audioElement.src = value;
    audioElement.play();
    event.sender.send('sound-complete', value);
})

