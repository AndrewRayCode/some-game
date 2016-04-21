import THREE from 'three';

// Tried to do this in client.js but something loads this file first
// see http://stackoverflow.com/questions/24087757/three-js-and-loading-a-cross-domain-image
THREE.ImageUtils.crossOrigin = '';
THREE.TextureLoader.crossOrigin = '';
THREE.TextureLoader.prototype.crossOrigin = '';

const ThreeMaterials = __CLIENT__ ? {
    playerTexture: THREE.ImageUtils.loadTexture(
        require( '../images/charisma-face.jpg' )
    ),
    playerTextureLegs: THREE.ImageUtils.loadTexture(
        require( '../images/foot-texture.jpg' )
    ),
    playerTextureTail: THREE.ImageUtils.loadTexture(
        require( '../images/charisma-tail.jpg' )
    ),
    playerTextureSkin: THREE.ImageUtils.loadTexture(
        require( '../images/charisma-skin.jpg' )
    ),
    twinkleMaterial: THREE.ImageUtils.loadTexture(
        require( '../images/twinkle-particle.png' )
    ),
    glowTextureMaterial: THREE.ImageUtils.loadTexture(
        require( '../images/brick-pattern-1.png' )
    ),
    smokeParticle: THREE.ImageUtils.loadTexture(
        require( '../images/smoke-particle.png' )
    ),
} : {};

export default ThreeMaterials;
