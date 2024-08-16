var VisioUtils = {
    maxLevel: 0,
    remoteMaxLevel: 0,
    audioContext: null,
    remoteAudioContext: null,

    handleAudio: function () {
        VisioUtils.audioContext = new AudioContext();

        try {
            var microphone = VisioUtils.audioContext.createMediaStreamSource(
                MovimVisio.localAudio.srcObject
            );
        } catch (error) {
            logError(error);
            return;
        }

        var javascriptNode = VisioUtils.audioContext.createScriptProcessor(2048, 1, 1);
        var icon = document.querySelector('#toggle_audio i');
        var mainButton = document.getElementById('main');
        icon.innerText = 'mic';
        let isMuteStep = 0;
        var noMicSound = document.querySelector('#no_mic_sound');

        microphone.connect(javascriptNode);
        javascriptNode.connect(VisioUtils.audioContext.destination);
        javascriptNode.onaudioprocess = function (event) {
            var inpt = event.inputBuffer.getChannelData(0);
            var instant = 0.0;
            var sum = 0.0;

            for (var i = 0; i < inpt.length; ++i) {
                sum += inpt[i] * inpt[i];
            }

            instant = Math.sqrt(sum / inpt.length);
            VisioUtils.maxLevel = Math.max(VisioUtils.maxLevel, instant);

            var base = (instant / VisioUtils.maxLevel);
            var level = (base > 0.01) ? base ** .3 : 0;

            if (level == 0) {
                isMuteStep++;
            } else {
                isMuteStep = 0;
            }

            if (isMuteStep > 250) {
                noMicSound.classList.remove('disabled');
            } else {
                noMicSound.classList.add('disabled');
            }

            mainButton.style.outlineColor = 'rgba(255, 255, 255, ' + level + ')';
        }
    },

    handleRemoteAudio: function () {
        VisioUtils.remoteAudioContext = new AudioContext();

        try {
            var remoteMicrophone = VisioUtils.remoteAudioContext.createMediaStreamSource(
                MovimVisio.remoteAudio.srcObject
            );
        } catch (error) {
            logError(error);
            return;
        }

        var remoteJavascriptNode = VisioUtils.remoteAudioContext.createScriptProcessor(2048, 1, 1);
        var remoteMeter = document.querySelector('#visio #remote_level');
        let isMuteStep = 0;

        remoteMicrophone.connect(remoteJavascriptNode);
        remoteJavascriptNode.connect(VisioUtils.remoteAudioContext.destination);
        remoteJavascriptNode.onaudioprocess = function (event) {
            var inpt = event.inputBuffer.getChannelData(0);
            var instant = 0.0;
            var sum = 0.0;

            for (var i = 0; i < inpt.length; ++i) {
                sum += inpt[i] * inpt[i];
            }

            instant = Math.sqrt(sum / inpt.length);
            VisioUtils.remoteMaxLevel = Math.max(VisioUtils.remoteMaxLevel, instant);

            var base = (instant / VisioUtils.remoteMaxLevel);
            var level = (base > 0.01) ? base ** .3 : 0;

            // Fallback in case we don't have the proper signalisation
            if (level == 0) {
                isMuteStep++;
            } else {
                isMuteStep = 0;
            }

            VisioUtils.setRemoteAudioState(isMuteStep > 250 ? 'mic_off' : 'mic');

            remoteMeter.style.borderColor = 'rgba(255, 255, 255, ' + level + ')';
        }
    },

    toggleFullScreen: function () {
        var button = document.querySelector('#toggle_fullscreen i');

        if (!document.fullscreenElement) {
            if (document.querySelector('#visio').requestFullscreen) {
                document.querySelector('#visio').requestFullscreen();
            }

            button.innerText = 'fullscreen_exit';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }

            button.innerText = 'fullscreen';
        }
    },

    toggleAudio: function () {
        var button = document.querySelector('#toggle_audio i');
        var rtc = MovimVisio.pc.getSenders().find(rtc => rtc.track && rtc.track.kind == 'audio');
        var mid = MovimVisio.pc.getTransceivers().filter(t => t.sender.track.id == rtc.track.id)[0].mid;

        if (rtc && rtc.track.enabled == 1) {
            rtc.track.enabled = 0;
            button.innerText = 'mic_off';
            Visio_ajaxUnmute(MovimVisio.from, MovimVisio.id, 'mid' + mid);
        } else if (rtc) {
            rtc.track.enabled = 1;
            button.innerText = 'mic';
            Visio_ajaxMute(MovimVisio.from, MovimVisio.id, 'mid' + mid);
        }
    },

    switchChat: function () {
        var from = document.querySelector('#visio').dataset.from;

        if (from) {
            Search.chat(from);
        }
    },

    toggleDtmf: function () {
        document.querySelector('#visio #dtmf').classList.toggle('hide');
    },

    insertDtmf: function (s) {
        VisioDTMF.pressButton(s);
        setTimeout(() => VisioDTMF.stop(), 100);

        var insert = (s == '*') ? '🞳' : s;
        document.querySelector('#dtmf p.dtmf').innerHTML += insert;

        if (!MovimVisio.pc) return;

        var rtc = MovimVisio.pc.getSenders().find(rtc => rtc.track && rtc.track.kind == 'audio');
        if (!rtc) return;
        rtc.dtmf.insertDTMF(s);
    },

    clearDtMf: function () {
        document.querySelector('#dtmf p.dtmf').innerHTML = '';
    },

    toggleVideo: function () {
        var button = document.querySelector('#toggle_video i');
        var rtc = MovimVisio.pc.getSenders().find(rtc => rtc.track && rtc.track.kind == 'video');
        var mid = MovimVisio.pc.getTransceivers().filter(t => t.sender.track.id == rtc.track.id)[0].mid;

        if (rtc) {
            if (rtc.track.enabled == 1) {
                rtc.track.enabled = 0;
                button.innerText = 'videocam_off';
                document.querySelector('#video').classList.add('muted');
                Visio_ajaxUnmute(MovimVisio.from, MovimVisio.id, 'mid' + mid);
            } else {
                rtc.track.enabled = 1;
                button.innerText = 'videocam';
                document.querySelector('#video').classList.remove('muted');
                Visio_ajaxMute(MovimVisio.from, MovimVisio.id, 'mid' + mid);
            }
        }
    },

    setRemoteAudioState: function (icon) {
        var voice = document.querySelector('#remote_state i.voice');
        voice.innerHTML = icon;
    },

    setRemoteVideoState: function (icon) {
        var webcam = document.querySelector('#remote_state i.webcam');
        webcam.innerHTML = icon;
    },

    toggleMainButton: function () {
        button = document.getElementById('main');
        state = document.querySelector('p.state');

        i = button.querySelector('i');

        button.classList.remove('red', 'green', 'gray', 'orange', 'ring', 'blue');
        button.classList.add('disabled');

        if (MovimVisio.pc) {
            let length = MovimVisio.pc.getSenders().length;

            if (MovimVisio.pc.iceConnectionState != 'closed'
                && length > 0) {
                button.classList.remove('disabled');
            }

            button.onclick = function () { };

            if (length == 0) {
                button.classList.add('gray');
                i.innerText = 'more_horiz';
            } else if (MovimVisio.pc.iceConnectionState == 'new') {
                //if (MovimVisio.pc.iceGatheringState == 'gathering'
                //|| MovimVisio.pc.iceGatheringState == 'complete') {
                if (Visio.calling) {
                    button.classList.add('orange');
                    i.className = 'material-symbols ring';
                    i.innerText = 'call';
                    state.innerText = Visio.states.ringing;

                    button.onclick = function () { Visio.goodbye('cancel'); };
                } else {
                    button.classList.add('green');
                    button.classList.add('disabled');
                    i.innerText = 'call';
                }
            } else if (MovimVisio.pc.iceConnectionState == 'checking') {
                button.classList.add('blue');
                i.className = 'material-symbols disabled';
                i.innerText = 'more_horiz';
                state.innerText = Visio.states.connecting;
            } else if (MovimVisio.pc.iceConnectionState == 'closed') {
                button.classList.add('gray');
                button.classList.remove('disabled');
                i.innerText = 'call_end';

                button.onclick = function () { Visio.goodbye(); };
            } else if (MovimVisio.pc.iceConnectionState == 'connected'
                || MovimVisio.pc.iceConnectionState == 'complete'
                || MovimVisio.pc.iceConnectionState == 'failed') {
                button.classList.add('red');
                i.className = 'material-symbols';
                i.innerText = 'call_end';

                if (MovimVisio.pc.iceConnectionState == 'failed') {
                    state.innerText = Visio.states.failed;
                } else {
                    state.innerText = Visio.states.in_call;
                }

                button.onclick = () => Visio.goodbye();
            }
        }
    },

    enableScreenSharingButton: function () {
        document.querySelector('#screen_sharing').classList.add('enabled');
    },

    toggleScreenSharing: async function () {
        Visio.switchCamera = document.querySelector("#visio #switch_camera");

        var button = document.querySelector('#screen_sharing i');
        if (MovimVisio.screenSharing.srcObject == null) {
            try {
                MovimVisio.screenSharing.srcObject = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: "always"
                    },
                    audio: false
                });

                MovimVisio.screenSharing.classList.add('sharing');
                Visio.switchCamera.classList.add('disabled');
                button.innerText = 'stop_screen_share';

                Visio.gotScreen();
            } catch (err) {
                console.error("Error: " + err);
            }
        } else {
            MovimVisio.screenSharing.srcObject.getTracks().forEach(track => track.stop());
            MovimVisio.screenSharing.srcObject = null;
            MovimVisio.screenSharing.classList.remove('sharing');
            Visio.switchCamera.classList.remove('disabled');

            button.innerText = 'screen_share';

            Visio.gotQuickStream();
        }
    },

    switchCameraSetup: function () {
        Visio.videoSelect = document.querySelector('#visio select#visio_source');
        navigator.mediaDevices.enumerateDevices().then(devices => VisioUtils.gotDevices(devices));

        Visio.switchCamera = document.querySelector("#visio #switch_camera");
        Visio.switchCamera.onclick = () => {
            Visio.videoSelect.selectedIndex++;

            // No empty selection
            if (Visio.videoSelect.selectedIndex == -1) {
                Visio.videoSelect.selectedIndex++;
            }

            Toast.send(Visio.videoSelect.options[Visio.videoSelect.selectedIndex].label);
            Visio.getStream();
        };
    },

    pcReplaceTrack: function (stream) {
        let videoTrack = stream.getVideoTracks()[0];
        var sender = MovimVisio.pc.getSenders().find(s => s.track && s.track.kind == videoTrack.kind);

        if (sender) {
            sender.replaceTrack(videoTrack);
        }
    },

    gotDevices: function (deviceInfos) {
        Visio.videoSelect.innerText = '';

        for (const deviceInfo of deviceInfos) {
            if (deviceInfo.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                option.text = deviceInfo.label || 'Camera ' + Visio.videoSelect.length + 1;

                Visio.videoSelect.appendChild(option);
            }
        }

        if (Visio.videoSelect.options.length >= 2) {
            document.querySelector("#visio #switch_camera").classList.add('enabled');
        }
    }
}
