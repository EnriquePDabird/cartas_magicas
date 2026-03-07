class GlobalAudioPlayer {
    constructor() {
        this.audio = new Audio();
        // Calculate relative path to audio based on current URL depth
        const depth = window.location.pathname.split('/').filter(p => p.length > 0).length - 1;
        // In this project, index is at root, games are 2 levels deep (juegos/poker/poker.html)
        const isGame = window.location.pathname.includes('/juegos/');
        const isLeaderboard = window.location.pathname.includes('leaderboard');

        const trackName = isLeaderboard ? 'leaderboard.webm' : 'background.webm';
        this.audioSrc = isGame ? `../../core/assets/audio/${trackName}` : `core/assets/audio/${trackName}`;
        this.timeStorageKey = isLeaderboard ? 'leaderboardMusicTime' : 'bgMusicTime';

        this.audio.src = this.audioSrc;
        this.audio.loop = true;
        this.audio.volume = 0.3; // Default low volume

        const savedPlaying = localStorage.getItem('bgMusicPlaying');
        this.isPlaying = savedPlaying === null ? true : savedPlaying === 'true';
        this.savedTime = parseFloat(localStorage.getItem(this.timeStorageKey)) || 0;
        this.savedVolume = parseFloat(localStorage.getItem('bgMusicVolume')) || 0.3;
        this.audio.volume = this.savedVolume;

        this.setupUI();
        this.setupListeners();

        if (this.isPlaying) {
            this.audio.currentTime = this.savedTime;
            // Attempt to autoplay (might be blocked by browser)
            this.audio.play().catch(e => {
                console.log("Autoplay blocked by browser. User interaction required.");
                this.isPlaying = false;
                this.updateUI();
            });
        }
    }

    setupUI() {
        // Container
        this.container = document.createElement('div');
        this.container.className = 'audio-player-container';

        // Volume Slider Container
        this.sliderContainer = document.createElement('div');
        this.sliderContainer.className = 'volume-slider-container';

        // The actual slider
        this.volumeSlider = document.createElement('input');
        this.volumeSlider.type = 'range';
        this.volumeSlider.min = '0';
        this.volumeSlider.max = '1';
        this.volumeSlider.step = '0.01';
        this.volumeSlider.value = this.savedVolume;
        this.volumeSlider.orient = 'vertical'; // For firefox basically

        // The play/pause button
        this.btn = document.createElement('button');
        this.btn.id = 'floating-audio-btn';
        this.btn.innerHTML = this.isPlaying ? '🔊' : '🔇';
        this.btn.title = "Toggle Background Music";

        this.sliderContainer.appendChild(this.volumeSlider);
        this.container.appendChild(this.sliderContainer);
        this.container.appendChild(this.btn);

        document.body.appendChild(this.container);
    }

    setupListeners() {
        this.btn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
                // Ensure volume isn't 0 if they hit play
                if (this.audio.volume === 0) {
                    this.setVolume(0.3);
                    this.volumeSlider.value = 0.3;
                }
            }
        });

        this.volumeSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            this.setVolume(vol);

            // Auto play/pause based on volume
            if (vol === 0 && this.isPlaying) {
                this.pause();
            } else if (vol > 0 && !this.isPlaying) {
                this.play();
            }
        });

        // Save progress periodically so it resumes on next page
        setInterval(() => {
            if (this.isPlaying) {
                localStorage.setItem(this.timeStorageKey, this.audio.currentTime);
            }
        }, 1000);

        // Save state before unloading
        window.addEventListener('beforeunload', () => {
            localStorage.setItem(this.timeStorageKey, this.audio.currentTime);
        });
    }

    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            localStorage.setItem('bgMusicPlaying', 'true');
            this.updateUI();
        }).catch(err => console.error("Error playing audio", err));
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        localStorage.setItem('bgMusicPlaying', 'false');
        this.updateUI();
    }

    setVolume(vol) {
        this.audio.volume = vol;
        this.savedVolume = vol;
        localStorage.setItem('bgMusicVolume', vol);
        this.updateUI();
    }

    updateUI() {
        if (this.audio.volume === 0 || !this.isPlaying) {
            this.btn.innerHTML = '🔇';
        } else {
            this.btn.innerHTML = '🔊';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.globalAudioPlayer = new GlobalAudioPlayer();
});
