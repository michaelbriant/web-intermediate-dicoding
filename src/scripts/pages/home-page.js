import StoryApi from '../data/api.js';
import * as L from 'leaflet';

class HomePage extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.markers = {};
  }

  connectedCallback() {
    this.render();
    this._initMap();
    this._fetchStories();
  }

  render() {
    this.innerHTML = `
      <h2>Halaman Utama (Home)</h2>
      <p>Selamat datang! Ini adalah daftar cerita.</p>
      
      <div class="home-container">
        <div id="story-list-container" class="story-list">
          <p>Memuat cerita...</p>
        </div>
        <div id="map" class="story-map"></div>
      </div>
    `;
    
    this._addMapStyles();
  }

  _addMapStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      .home-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      #map {
        height: 500px;
        width: 100%;
        border-radius: 8px;
        z-index: 10;
      }
      
      .story-list {
        height: 500px;
        overflow-y: auto;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 0.5rem;
      }
      
      .story-item {
        border-bottom: 1px solid #eee;
        padding: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .story-item:hover,
      .story-item:focus {
        background-color: #f0f0f0;
        outline: 2px solid #333;
        outline-offset: -2px;
      }
      
      .story-item img {
        width: 100%;
        max-height: 200px;
        object-fit: cover;
        border-radius: 4px;
      }

      @media (min-width: 768px) {
        .home-container {
          grid-template-columns: 1fr 1fr;
        }
      }
    `;
    this.appendChild(style);
  }

  _initMap() {
    this.map = L.map('map').setView([-6.200000, 106.816666], 10);

    const mainTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    
    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    mainTile.addTo(this.map);

    const baseLayers = {
      "Standard": mainTile,
      "Satelit": satelliteTile
    };

    L.control.layers(baseLayers).addTo(this.map);
  }

  async _fetchStories() {
    const listContainer = this.querySelector('#story-list-container');
    try {
      const response = await StoryApi.getAllStories();
      const stories = response.listStory;

      if (stories.length === 0) {
        listContainer.innerHTML = '<p>Belum ada cerita untuk ditampilkan.</p>';
        return;
      }

      listContainer.innerHTML = '';
      
      stories.forEach(story => {
        if (story.lat && story.lon) {
          this._renderStoryItem(listContainer, story);
          this._addMarkerToMap(story);
        }
      });
      
      this._setupListInteractivity();

    } catch (error) {
      listContainer.innerHTML = `<p>Gagal memuat cerita: ${error.message}</p>`;
    }
  }

  _renderStoryItem(container, story) {
    const storyItem = document.createElement('div');
    storyItem.className = 'story-item';
    storyItem.setAttribute('data-id', story.id);
    
    storyItem.setAttribute('tabindex', '0');
    storyItem.setAttribute('role', 'button');
    
    storyItem.innerHTML = `
      <img src="${story.photoUrl}" alt="Foto oleh ${story.name}">
      <h4>${story.name}</h4>
      <p>${story.description.substring(0, 100)}...</p>
      <small>${new Date(story.createdAt).toLocaleString()}</small>
    `;
    container.appendChild(storyItem);
  }

  _addMarkerToMap(story) {
    const marker = L.marker([story.lat, story.lon])
      .addTo(this.map)
      .bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 50)}...`);
      
    this.markers[story.id] = marker;
  }
  
  _setupListInteractivity() {
    const listContainer = this.querySelector('#story-list-container');
    
    const handleInteraction = (storyId) => {
      const marker = this.markers[storyId];
      if (marker) {
        this.map.flyTo(marker.getLatLng(), 15);
        marker.openPopup();
      }
    };

    listContainer.addEventListener('click', (event) => {
      const storyItem = event.target.closest('.story-item');
      if (!storyItem) return;
      
      const storyId = storyItem.getAttribute('data-id');
      handleInteraction(storyId);
    });
    
    listContainer.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const storyItem = event.target.closest('.story-item');
        if (!storyItem) return;

        event.preventDefault();
        const storyId = storyItem.getAttribute('data-id');
        handleInteraction(storyId);
      }
    });
  }
}

customElements.define('home-page', HomePage);
export default HomePage;