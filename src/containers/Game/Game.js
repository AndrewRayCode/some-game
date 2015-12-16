import 'babel/polyfill';
import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import CANNON from 'cannon/src/Cannon';

const radius = 20;
const speed = 0.1;
const clock = new THREE.Clock();

const height = 400;
const width = 400;

const shadowD = 20;
const boxes = 10;

const timeStep = 1 / 60;

const KeyCodes = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40
};

function without( obj, ...keys ) {

  return Object.keys( obj ).reduce( ( memo, key ) => {
    if( keys.indexOf( parseFloat( key ) ) === -1 ) {
      memo[ key ] = obj[ key ];
    }
    return memo;
  }, {} );

}

export default class Game extends Component {

  constructor(props, context) {
    super(props, context);

    this.keysDown = {};

    this.state = {
      cameraTarget: new THREE.Vector3(0, 0, 0),
      cameraPosition: new THREE.Vector3(0, 10, 0),
      cameraQuaternion: new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
      cubeRotation: new THREE.Euler(),
      lightPosition: new THREE.Vector3(),
      meshStates: []
    };

    this.world = new CANNON.World();
    const world = this.world;

    this.bodies = [];
    const bodies = this.bodies;

    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    world.gravity.set(0, -10, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    const mass = 5;

    const playerBody = new CANNON.Body({ mass });
    this.playerBody = playerBody;

    const playerShape = new CANNON.Sphere( 0.25 );
    this.playerShape = playerShape;

    playerBody.addShape(playerShape);
    playerBody.position.set( 0, 0, 0 );
    world.addBody(playerBody);
    bodies.push({
      geometry: 'playerGeometry',
      body: playerBody
    });

    const boxShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25));

    for( let i = 0; i < boxes; ++i ) {
      const boxBody = new CANNON.Body({ mass });

      boxBody.addShape(boxShape);
      boxBody.position.set(-2.5 + Math.random() * 5, 2.5 + Math.random() * 5, -2.5 + Math.random() * 5);
      world.addBody(boxBody);
      bodies.push({
        geometry: 'cubeGeo',
        body: boxBody
      });

    }

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({mass: 0});

    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

    world.addBody(groundBody);

    const shape = new CANNON.Sphere(0.1);
    const jointBody = new CANNON.Body({mass: 0});
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;

    world.addBody(jointBody);

    this.jointBody = jointBody;

    this.onKeyDown = this.onKeyDown.bind( this );
    this.onKeyUp = this.onKeyUp.bind( this );
    this.updatePhysics = this.updatePhysics.bind( this );
    this._onAnimate = this._onAnimate.bind( this );
    this._getMeshStates = this._getMeshStates.bind( this );

  }

  componentDidMount() {

    if( typeof window !== 'undefined' ) {

      window.addEventListener( 'keydown', this.onKeyDown );
      window.addEventListener( 'keyup', this.onKeyUp );

    }

  }

  componentWillUnmount() {

    if( typeof window !== 'undefined' ) {

      window.removeEventListener( 'keydown', this.onKeyDown );
      window.removeEventListener( 'keyup', this.onKeyUp );

    }

  }

  updatePhysics() {

    let forceX = 0;
    const forceY = 0;
    let forceZ = 0;

    if( KeyCodes.LEFT in this.keysDown ) {
      forceZ += 1;
    }
    if( KeyCodes.RIGHT in this.keysDown ) {
      forceZ -= 1;
    }
    if( KeyCodes.UP in this.keysDown ) {
      forceX -= 1;
    }
    if( KeyCodes.DOWN in this.keysDown ) {
      forceX += 1;
    }

    this.playerBody.applyImpulse( new CANNON.Vec3( forceX, forceY, forceZ ), this.playerBody.position );

    // Step the physics world
    this.world.step(timeStep);

  }

  _getMeshStates() {
    return this.bodies.map( ( { geometry, body }, bodyIndex) => {
      const { position, quaternion } = body;
      return {
        geometry,
        position: new THREE.Vector3().copy(position),
        quaternion: new THREE.Quaternion().copy(quaternion)
      };
    });
  }

  _onAnimate() {

    this.updatePhysics();

    this.setState({
      meshStates: this._getMeshStates(),
      lightPosition: new THREE.Vector3(
        radius * Math.sin( clock.getElapsedTime() * speed ),
        10,
        radius * Math.cos( clock.getElapsedTime() * speed )
      ),
      cubeRotation: new THREE.Euler(
        this.state.cubeRotation.x + 0.01,
        this.state.cubeRotation.y + 0.01,
        0
      )
    });
  }

  onKeyDown( event ) {

    const which = { [ event.which ]: true };
    this.keysDown = Object.assign( {}, this.keysDown, which );

  }

  onKeyUp( event ) {

    this.keysDown = without( this.keysDown, event.which );

  }

  render() {

    if ( typeof window === 'undefined' ) {
      return <div />;
    }

    const { meshStates } = this.state;

    const cubeMeshes = meshStates.map( ( { geometry, position, quaternion }, i ) => {
        return <mesh
            key={i}
            position={position}
            quaternion={quaternion}
            castShadow
        >
            <geometryResource
                resourceId={ geometry }
            />
            <materialResource
                resourceId="cubeMaterial"
            />
        </mesh>;
    });

    return (<React3
      mainCamera="camera"
      width={width}
      height={height}

      onAnimate={this._onAnimate}
    >
      <scene>
        <perspectiveCamera
          name="camera"
          fov={75}
          aspect={width / height}
          near={0.1}
          far={1000}
          lookAt={this.state.cameraTarget}
          position={this.state.cameraPosition}
          quaternion={this.state.cameraQuaternion}
          ref="camera"
        />

        <resources>
          <sphereGeometry
            resourceId="playerGeometry"

            radius={0.5}

            widthSegments={10}
            heightSegments={10}
          />
          <boxGeometry
            resourceId="cubeGeo"

            width={0.5}
            height={0.5}
            depth={0.5}

            widthSegments={10}
            heightSegments={10}
          />
          <meshPhongMaterial
            resourceId="cubeMaterial"

            color={0x888888}
          />
        </resources>

        <directionalLight
          color={0xffffff}
          intensity={1.75}

          castShadow

          shadowMapWidth={1024}
          shadowMapHeight={1024}

          shadowCameraLeft={-shadowD}
          shadowCameraRight={shadowD}
          shadowCameraTop={shadowD}
          shadowCameraBottom={-shadowD}

          shadowCameraFar={3 * shadowD}
          shadowCameraNear={shadowD}
          shadowDarkness={0.5}

          position={this.state.lightPosition}
        />

        {cubeMeshes}

        <mesh
          rotation={this.state.cubeRotation}
          position={ new THREE.Vector3( 5, 0, 0 ) }
        >
          <boxGeometry
            width={1}
            height={1}
            depth={1}
          />
          <meshPhongMaterial
            color={0x00ff00}
          />
        </mesh>
      </scene>
    </React3>);
  }

}
