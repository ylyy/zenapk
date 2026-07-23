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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("当前环境不支持摄像头访问！\n【关键原因】：移动端浏览器出于安全策略，仅允许在 HTTPS 协议（如 https://192.168.x.x:5173）或 localhost 下开启摄像头。\n若使用 http:// 访问，系统将自动屏蔽摄像头权限。请确保在网址最前面加上 https:// 进行访问。");
    }

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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error("摄像头权限被拒绝。请在手机浏览器地址栏左侧点击锁状图标，允许本页面的摄像头使用权限。");
      }
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
