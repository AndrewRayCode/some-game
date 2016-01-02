import React from 'react';
import DraggableCube from './DraggableCube';
import THREE from 'three';

import PureRenderMixin from 'react/lib/ReactComponentWithPureRenderMixin';

const {PropTypes} = React;

import MouseInput from './MouseInput';

class AllCubes extends React.Component {
  static propTypes = {
    mouseInput: PropTypes.instanceOf(MouseInput),
    camera: PropTypes.instanceOf(THREE.PerspectiveCamera),

    onCubesMounted: PropTypes.func.isRequired,
    onHoverStart: PropTypes.func.isRequired,
    onHoverEnd: PropTypes.func.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,

    cursor: PropTypes.any,
  };

  constructor(props, context) {
    super(props, context);

    const gridPosition = new THREE.Vector3( 0, 0, 0 );
    this.gridPosition = gridPosition;
    this.cubes = [];

    this.mouse = new THREE.Vector2();
    this.offset = new THREE.Vector3();
    this.selected = null;

    this._hoveredCubes = 0;
    this._draggingCubes = 0;
  }

  componentDidMount() {
    const {
      onCubesMounted,
    } = this.props;

    onCubesMounted( this.cubes );
  }

  shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate;

  _onCubeMouseMove = (a,b) => {
      console.log(b);
  };

  _onCubeMouseEnter = () => {
    if (this._hoveredCubes === 0) {
      const {
        onHoverStart,
        } = this.props;

      onHoverStart();
    }

    this._hoveredCubes++;
  };

  _onCubeMouseLeave = () => {
    this._hoveredCubes--;

    if (this._hoveredCubes === 0) {
      const {
        onHoverEnd,
        } = this.props;

      onHoverEnd();
    }
  };

  _onCubeDragStart = () => {
    if (this._draggingCubes === 0) {
      const {
        onDragStart,
        } = this.props;

      onDragStart();
    }

    this._draggingCubes++;
  };

  _onCubeDragEnd = () => {
    this._draggingCubes--;

    if (this._draggingCubes === 0) {
      const {
        onDragEnd,
        } = this.props;

      onDragEnd();
    }
  };

  _onCubeCreate = (index, cube) => {
    this.cubes = [ cube ];
  };

  render() {
    const {
      mouseInput,
      camera,

      cursor,
      } = this.props;

    return <group>
        <DraggableCube
          mouseInput={mouseInput}
          camera={camera}

          onCreate={this._onCubeCreate.bind(this, 0)}
          initialPosition={this.gridPosition}
          onMouseEnter={this._onCubeMouseEnter}
          onMouseMove={this._onCubeMouseMove}
          onMouseLeave={this._onCubeMouseLeave}
          onDragStart={this._onCubeDragStart}
          onDragEnd={this._onCubeDragEnd}

          cursor={cursor}
        />
    </group>;
  }
}

export default AllCubes;
