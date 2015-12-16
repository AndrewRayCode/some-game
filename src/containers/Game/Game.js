import React, { Component } from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three.js';
import CANNON from 'cannon/src/Cannon';

import physijs from 'physijs-browserify';
const Physijs = physijs( THREE );

const radius = 20;
const speed = 0.1;
const clock = new THREE.Clock();

Physijs.scripts.worker = '/libs/physi-worker.js';
Physijs.scripts.ammo = '/libs/ammo.js';

const height = 400;
const width = 400;

const shadowD = 20;
const boxes = 10;

export default class Game extends Component {

  constructor(props, context) {
    super(props, context);


    this.state = {
      cameraPosition: new THREE.Vector3(10, 2, 0),
      cameraQuaternion: new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
      cubeRotation: new THREE.Euler(),
      lightPosition: new THREE.Vector3(),
      meshStates: []
    };

    const world = new CANNON.World();

    const bodies = [];
    const meshRefs = [];

    let constrainedBody;
    let pivot;

    const initCannon = () => {
      world.quatNormalizeSkip = 0;
      world.quatNormalizeFast = false;

      world.gravity.set(0, -10, 0);
      world.broadphase = new CANNON.NaiveBroadphase();

      const mass = 5;

      const boxShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25));

      for( let i = 0; i < boxes; ++i ) {
        const boxBody = new CANNON.Body({ mass });

        boxBody.addShape(boxShape);
        boxBody.position.set(-2.5 + Math.random() * 5, 2.5 + Math.random() * 5, -2.5 + Math.random() * 5);
        world.addBody(boxBody);
        bodies.push(boxBody);

        meshRefs.push((mesh) => {
          if (mesh) {
            mesh.userData._bodyIndex = i;

            this.meshes.push(mesh);
          }
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
    };

    initCannon();

    const timeStep = 1 / 60;
    const updatePhysics = () => {
      // Step the physics world
      world.step(timeStep);
    };

    const _getMeshStates = () => {
      return bodies.map(({position, quaternion}, bodyIndex) => {
        return {
          position: new THREE.Vector3().copy(position),
          quaternion: new THREE.Quaternion().copy(quaternion),
          ref: meshRefs[bodyIndex]
        };
      });
    };

    this._onAnimate = () => {

      updatePhysics();

      this.setState({
        meshStates: _getMeshStates(),
        lightPosition: new THREE.Vector3(
          radius * Math.sin( clock.getElapsedTime() * speed ),
          radius * Math.cos( clock.getElapsedTime() * speed ),
          radius * Math.sin( clock.getElapsedTime() * speed )
        ),
        cubeRotation: new THREE.Euler(
          this.state.cubeRotation.x + 0.01,
          this.state.cubeRotation.y + 0.01,
          0
        )
      });
    };
  }

  render() {

    if ( typeof window === 'undefined' ) {
      return <div />;
    }

    const { meshStates } = this.state;

    const cubeMeshes = meshStates.map(({position, quaternion}, i) => {
        return <mesh
            key={i}
            position={position}
            quaternion={quaternion}
            castShadow
        >
            <geometryResource
                resourceId="cubeGeo"
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
          position={this.state.cameraPosition}
          quaternion={this.state.cameraQuaternion}
          ref="camera"
        />

        <resources>
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
