/**
 * Asset Loader
 * 
 * Simple Promise-based image loader with caching for sprites.
 */

export const ASSET_MANIFEST = [
  // { key: 'sword_sprite', src: 'assets/sprites/sword.png' },
  // { key: 'shield_sprite', src: 'assets/sprites/shield.png' },
];

class AssetLoader {
  constructor() {
    /** @type {Map<string, HTMLImageElement>} */
    this.cache = new Map();
  }

  /**
   * Load single image
   * @param {string} key 
   * @param {string} src 
   * @returns {Promise<HTMLImageElement|null>}
   */
  load(key, src) {
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(key, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`AssetLoader: Failed to load image at ${src}`);
        resolve(null);
      };
      img.src = src;
    });
  }

  /**
   * Load array of assets
   * @param {Array<{key: string, src: string}>} manifest 
   * @returns {Promise<Array<HTMLImageElement|null>>}
   */
  loadAll(manifest) {
    const promises = manifest.map(asset => this.load(asset.key, asset.src));
    return Promise.all(promises);
  }

  /**
   * Get cached image
   * @param {string} key 
   * @returns {HTMLImageElement|null}
   */
  get(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Check if asset is loaded
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }
}

export const assets = new AssetLoader();
