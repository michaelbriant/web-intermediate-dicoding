import StoryApi from '../data/api.js';
import * as L from 'leaflet';
import StoryDb from '../utils/indexeddb-helper.js';
import { registerBackgroundSync } from '../utils/sw-register.js';

class AddStoryPage extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.marker = null;
    this.stream = null;
    this.photoBlob = null;
  }

  connectedCallback() {
    this.render();
    this._initMapPicker();
    this._setupFormListener();
    this._setupCameraListeners();
    this._setupInputListeners();
  }

  disconnectedCallback() {
    this._closeCameraStream();
  }

  render() {
    this.innerHTML = `
      <h2>Halaman Tambah Story</h2>
      
      <form id="add-story-form">
        <div class="form-group">
          <label for="photo">Upload Foto:</label>
          <input type="file" id="photo" name="photo" accept="image/*">
          <button type="button" id="clear-file-button" style="display:none; background-color: #e74c3c; margin-top: 5px;">Hapus Foto</button>
        </div>
        
        <div class="camera-controls">
          <p>Atau ambil dari kamera:</p>
          <button type="button" id="use-camera-button">Gunakan Kamera</button>
          <div id="video-container" class="video-wrapper" style="display:none;">
            <video id="video-preview" autoplay></video>
            <button type="button" id="snap-photo-button">Ambil Foto</button>
            <button type="button" id="cancel-camera-button" style="background-color: #e74c3c;">Batal</button>
          </div>
          <canvas id="photo-canvas" style="display:none;"></canvas>
          <img id="photo-preview" class="photo-preview-img" style="display:none;" alt="Pratinjau foto yang akan diunggah">
        </div>

        <div class="form-group">
          <label for="description">Deskripsi:</label>
          <textarea id="description" name="description" rows="5" required></textarea>
        </div>
        
        <div class="form-group">
          <label>Pilih Lokasi di Peta:</label>
          <div id="map-picker"></div>
          <input type="hidden" id="lat" name="lat">
          <input type="hidden" id="lon" name="lon">
        </div>
        
        <button type="submit" id="submit-story-button">Upload Story</button>
      </form>
    `;
    
    this._addStyles();
  }

  _addStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      #add-story-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 600px;
        margin: auto;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      #map-picker {
        height: 300px;
        width: 100%;
        border-radius: 8px;
        z-index: 10;
      }
      .camera-controls {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .video-wrapper {
        position: relative;
        width: 100%;
      }
      #video-preview {
        width: 100%;
        border-radius: 4px;
      }
      #snap-photo-button {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 11;
      }
      #cancel-camera-button {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 11;
      }
      .photo-preview-img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        margin-top: 0.5rem;
      }
    `;
    this.appendChild(style);
  }

  _initMapPicker() {
    this.map = L.map('map-picker').setView([-6.200000, 106.816666], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.querySelector('#lat').value = lat;
      this.querySelector('#lon').value = lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }
      this.marker.bindPopup('Lokasi dipilih').openPopup();
    });
  }

  _setupCameraListeners() {
    const useCameraButton = this.querySelector('#use-camera-button');
    const snapPhotoButton = this.querySelector('#snap-photo-button');
    const cancelCameraButton = this.querySelector('#cancel-camera-button');
    
    useCameraButton.addEventListener('click', this._openCameraStream.bind(this));
    snapPhotoButton.addEventListener('click', this._snapPhoto.bind(this));
    cancelCameraButton.addEventListener('click', this._closeCameraStream.bind(this));
  }
  
  _setupInputListeners() {
    const photoInput = this.querySelector('#photo');
    const clearFileButton = this.querySelector('#clear-file-button');
    const useCameraButton = this.querySelector('#use-camera-button');

    photoInput.addEventListener('change', () => {
      if (photoInput.files.length > 0) {
        useCameraButton.disabled = true;
        clearFileButton.style.display = 'block';
        this._closeCameraStream();
        this.photoBlob = null;
        this.querySelector('#photo-preview').style.display = 'none';
      }
    });

    clearFileButton.addEventListener('click', () => {
      photoInput.value = '';
      useCameraButton.disabled = false;
      clearFileButton.style.display = 'none';
    });
  }

  async _openCameraStream() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = this.querySelector('#video-preview');
      const videoContainer = this.querySelector('#video-container');
      const photoInput = this.querySelector('#photo');
      const clearFileButton = this.querySelector('#clear-file-button');
      
      video.srcObject = this.stream;
      videoContainer.style.display = 'block';
      this.querySelector('#use-camera-button').style.display = 'none';
      this.querySelector('#photo-preview').style.display = 'none';
      
      photoInput.disabled = true;
      photoInput.value = '';
      clearFileButton.style.display = 'none';
      this.photoBlob = null;

    } catch (error) {
      alert('Gagal mengakses kamera. Pastikan Anda memberi izin.');
    }
  }

  _snapPhoto() {
    const video = this.querySelector('#video-preview');
    const canvas = this.querySelector('#photo-canvas');
    const preview = this.querySelector('#photo-preview');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      this.photoBlob = blob;
      preview.src = URL.createObjectURL(blob);
      preview.style.display = 'block';
    }, 'image/jpeg');

    this._closeCameraStream();
  }

  _closeCameraStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    const photoInput = this.querySelector('#photo');
    if (photoInput) photoInput.disabled = false;

    const videoContainer = this.querySelector('#video-container');
    if (videoContainer) videoContainer.style.display = 'none';

    const useCameraButton = this.querySelector('#use-camera-button');
    if (useCameraButton) useCameraButton.style.display = 'block';
  }

  _setupFormListener() {
    const form = this.querySelector('#add-story-form');
    form.addEventListener('submit', this._handleSubmit.bind(this));
  }

  async _handleSubmit(event) {
    event.preventDefault();
    const submitButton = this.querySelector('#submit-story-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Mengunggah...';

    const photoInput = this.querySelector('#photo');
    const description = this.querySelector('#description').value;
    const lat = this.querySelector('#lat').value;
    const lon = this.querySelector('#lon').value;

    let photoFile;
    if (this.photoBlob) {
      photoFile = new File([this.photoBlob], "camera.jpg", { type: "image/jpeg" });
    } else {
      photoFile = photoInput.files[0];
    }

    try {
      if (!lat || !lon) {
        throw new Error('Harap pilih lokasi di peta terlebih dahulu.');
      }
      if (!photoFile) {
        throw new Error('Harap pilih foto untuk diunggah (dari file atau kamera).');
      }
      if (photoFile.size > 1000000) {
        throw new Error('Ukuran foto tidak boleh lebih dari 1MB.');
      }
      
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('description', description);
      formData.append('lat', lat);
      formData.append('lon', lon);

      await StoryApi.addNewStory(formData);
      
      this._closeCameraStream();
      alert('Story berhasil diunggah!');
      window.location.hash = '#/';

    } catch (error) {
      if (error.message.includes('fetch')) {
        alert('Anda sedang offline. Postingan akan diunggah otomatis saat kembali online.');
        
        const storyData = {
          photo: photoFile,
          description: description,
          lat: lat,
          lon: lon,
          token: localStorage.getItem('authToken'),
        };
        
        await StoryDb.addStoryToOutbox(storyData);
        await registerBackgroundSync();
        window.location.hash = '#/';
        
      } else {
        alert(`Gagal: ${error.message}`);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Upload Story';
    }
  }
}

customElements.define('add-story-page', AddStoryPage);
export default AddStoryPage;