import React from 'react';
import domUtils from './domUtils';
import CustomPropTypes from './CustomPropTypes';

function getContainerDimensions(containerNode) {
  let width, height, scroll;

  if (containerNode.tagName === 'BODY') {
    width = window.innerWidth;
    height = window.innerHeight;
    scroll =
      domUtils.ownerDocument(containerNode).documentElement.scrollTop ||
      containerNode.scrollTop;
  } else {
    width = containerNode.offsetWidth;
    height = containerNode.offsetHeight;
    scroll = containerNode.scrollTop;
  }

  return {width, height, scroll};
}

function getTopDelta(top, overlayHeight, container, padding) {
  const containerDimensions = getContainerDimensions(container);
  const containerScroll = containerDimensions.scroll;
  const containerHeight = containerDimensions.height;

  const topEdgeOffset = top - padding - containerScroll;
  const bottomEdgeOffset = top + padding - containerScroll + overlayHeight;

  if (topEdgeOffset < 0) {
    return -topEdgeOffset;
  } else if (bottomEdgeOffset > containerHeight) {
    return containerHeight - bottomEdgeOffset;
  } else {
    return 0;
  }
}

function getLeftDelta(left, overlayWidth, container, padding) {
  const containerDimensions = getContainerDimensions(container);
  const containerWidth = containerDimensions.width;

  const leftEdgeOffset = left - padding;
  const rightEdgeOffset = left + padding + overlayWidth;

  if (leftEdgeOffset < 0) {
    return -leftEdgeOffset;
  } else if (rightEdgeOffset > containerWidth) {
    return containerWidth - rightEdgeOffset;
  } else {
    return 0;
  }
}


function getPosition(target, container) {
  const offset = container.tagName === 'BODY' ?
    domUtils.getOffset(target) : domUtils.getPosition(target, container);

  return {
    ...offset, // eslint-disable-line object-shorthand
    height: target.offsetHeight,
    width: target.offsetWidth
  };
}

function calcOverlayPosition(placement, overlayNode, target, container, padding) {
  const childOffset = getPosition(target, container);

  const overlayHeight = overlayNode.offsetHeight;
  const overlayWidth = overlayNode.offsetWidth;

  let positionLeft, positionTop, arrowOffsetLeft, arrowOffsetTop;

  if (placement === 'left' || placement === 'right') {
    positionTop = childOffset.top + (childOffset.height - overlayHeight) / 2;

    if (placement === 'left') {
      positionLeft = childOffset.left - overlayWidth;
    } else {
      positionLeft = childOffset.left + childOffset.width;
    }

    const topDelta = getTopDelta(positionTop, overlayHeight, container, padding);

    positionTop += topDelta;
    arrowOffsetTop = 50 * (1 - 2 * topDelta / overlayHeight) + '%';
    arrowOffsetLeft = null;

  } else if (placement === 'top' || placement === 'bottom') {
    positionLeft = childOffset.left + (childOffset.width - overlayWidth) / 2;

    if (placement === 'top') {
      positionTop = childOffset.top - overlayHeight;
    } else {
      positionTop = childOffset.top + childOffset.height;
    }

    const leftDelta = getLeftDelta(positionLeft, overlayWidth, container, padding);
    positionLeft += leftDelta;
    arrowOffsetLeft = 50 * (1 - 2 * leftDelta / overlayWidth) + '%';
    arrowOffsetTop = null;
  } else {
    throw new Error(
      `calcOverlayPosition(): No such placement of "${placement }" found.`
    );
  }

  return {positionLeft, positionTop, arrowOffsetLeft, arrowOffsetTop};
}


let createPositionedComponent = Component => {

  class PositionedComponent extends React.Component {

    constructor(props, context){
      super(props, context);
      this.state = {
        positionLeft: null,
        positionTop: null,
        arrowOffsetLeft: null,
        arrowOffsetTop: null
      };
    }

    componentWillMount(){
      this._needsflush = true;
    }

    componentWillRecieveProps(){
      this._needsflush = true;
    }

    componentDidMount(){
      if ( !this._needsflush ) { return; }
      this._needsflush = false;
      this._updatePosition();
    }
    componentDidUpate(){
      if ( !this._needsflush ) { return; }
      this._needsflush = false;
      this._updatePosition();
    }

    render() {
      let { container, target, ...props } = this.props;

      return <Component {...this.state} {...props}/>;
    }

    _updatePosition() {
      if ( this.props.target == null ){
        return;
      }

      let target = React.findDOMNode(this.props.target(this.props))
        , container = React.findDOMNode(this.props.container);

      this.setState(
        calcOverlayPosition(
            this.props.placement
          , React.findDOMNode(this)
          , target
          , container
          , this.props.containerPadding));
    }
  }

  PositionedComponent.propTypes = {
    target:           React.PropTypes.func,
    container:        CustomPropTypes.mountable,
    containerPadding: React.PropTypes.number,
    placement:        React.PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
  };

  return PositionedComponent;
};

export default createPositionedComponent;
