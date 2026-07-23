export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.facingMode = 'user'; // 'user' for front, 'environment' for back
  }

  async init() {
    return this.startStream();
  }

  async startStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // Toggle mirror class based on camera facing mode
      if (this.facingMode === 'user') {
        this.video.classList.remove('no-mirror');
      } else {
        this.video.classList.add('no-mirror');
      }

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve(this.video);
        };
      });
    } catch (err) {
      console.error("Camera access failed:", err);
      throw err;
    }
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    return this.startStream();
  }

  isMirrored() {
    return this.facingMode === 'user';
  }
}
