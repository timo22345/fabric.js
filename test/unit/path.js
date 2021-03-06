(function() {

  var REFERENCE_PATH_OBJECT = {
    'type':               'path',
    'originX':            'left',
    'originY':            'top',
    'left':               200,
    'top':                200,
    'width':              200,
    'height':             200,
    'fill':               'red',
    'stroke':             'blue',
    'strokeWidth':        1,
    'strokeDashArray':    null,
    'strokeLineCap':      'butt',
    'strokeLineJoin':     'miter',
    'strokeMiterLimit':   10,
    'scaleX':             1,
    'scaleY':             1,
    'angle':              0,
    'flipX':              false,
    'flipY':              false,
    'opacity':            1,
    'path':               [['M', 100, 100], ['L', 300, 100], ['L', 200, 300], ['z']],
    'shadow':             null,
    'visible':            true,
    'backgroundColor':    '',
    'clipTo':             null
  };

  var EXPECTED_PATH_OBJECT = {
  type: 'path',
  originX: 'left',
  originY: 'top',
  left: 99.5,
  top: 99.5,
  width: 200,
  height: 200,
  fill: 'red',
  stroke: 'blue',
  strokeWidth: 1,
  strokeDashArray: null,
  strokeLineCap: 'butt',
  strokeLineJoin: 'miter',
  strokeMiterLimit: 10,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  flipX: false,
  flipY: false,
  opacity: 1,
  shadow: null,
  visible: true,
  clipTo: null,
  backgroundColor: '',
  path: [[ 'M', 0, 0 ], [ 'L', 200, 0 ], [ 'L', 100, 200 ], [ 'Z' ]] 
  };
  
  function getPathElement(path) {
    var el = fabric.document.createElement('path');
    el.setAttribute('d', path);
    el.setAttribute('fill', 'red');
    el.setAttribute('stroke', 'blue');
    el.setAttribute('stroke-width', 1);
    el.setAttribute('stroke-linecap', 'butt');
    el.setAttribute('stroke-linejoin', 'miter');
    el.setAttribute('stroke-miterlimit', 10);
    return el;
  }

  function getPathObject(path, callback) {
    fabric.Path.fromElement(getPathElement(path), callback);
  }

  function makePathObject(callback) {
    getPathObject("M 100 100 L 300 100 L 200 300 z", callback);
  }

  QUnit.module('fabric.Path');

  asyncTest('constructor', function() {
    ok(fabric.Path);

    makePathObject(function(path) {
      ok(path instanceof fabric.Path);
      ok(path instanceof fabric.Object);

      equal(path.get('type'), 'path');

      var error;
      try {
        new fabric.Path();
      }
      catch(err) {
        error = err;
      }

      ok(error, 'should throw error');
      start();
    });
  });

  asyncTest('toString', function() {
    makePathObject(function(path) {
      ok(typeof path.toString == 'function');
      equal(path.toString(), '#<fabric.Path (4): { "top": 99.5, "left": 99.5 }>');
      start();
    });
  });

  asyncTest('toObject', function() {
    makePathObject(function(path) {
      ok(typeof path.toObject == 'function');
      deepEqual(path.toObject(), EXPECTED_PATH_OBJECT);
      start();
    });
  });

  asyncTest('path array not shared when cloned', function() {
    makePathObject(function(originalPath) {
      originalPath.clone(function(clonedPath) {

        clonedPath.path[0][1] = 200;
        equal(originalPath.path[0][1], 0);

        start();
      });
    });
  });

  asyncTest('toDatalessObject', function() {
    makePathObject(function(path) {
      ok(typeof path.toDatalessObject == 'function');
      deepEqual(path.toDatalessObject(), EXPECTED_PATH_OBJECT);

      var src = 'http://example.com/';
      path.setSourcePath(src);
      deepEqual(path.toDatalessObject(), fabric.util.object.extend(fabric.util.object.clone(EXPECTED_PATH_OBJECT), {
        path: src
      }));
      start();
    });
  });

  asyncTest('complexity', function() {
    makePathObject(function(path) {
      ok(typeof path.complexity == 'function');
      start();
    });
  });

  asyncTest('fromObject', function() {
    ok(typeof fabric.Path.fromObject == 'function');
    fabric.Path.fromObject(EXPECTED_PATH_OBJECT, function(path) {
      ok(path instanceof fabric.Path);
      deepEqual(path.toObject(), EXPECTED_PATH_OBJECT);
      start();
    });
  });

  asyncTest('fromElement', function() {
    ok(typeof fabric.Path.fromElement == 'function');
    var elPath = fabric.document.createElement('path');

    elPath.setAttribute('d', 'M 100 100 L 300 100 L 200 300 z');
    elPath.setAttribute('fill', 'red');
    elPath.setAttribute('opacity', '1');
    elPath.setAttribute('stroke', 'blue');
    elPath.setAttribute('stroke-width', '1');
    elPath.setAttribute('stroke-dasharray', '5, 2');
    elPath.setAttribute('stroke-linecap', 'round');
    elPath.setAttribute('stroke-linejoin', 'bevil');
    elPath.setAttribute('stroke-miterlimit', '5');

    // TODO (kangax): to support multiple transformation keywords, we need to do proper matrix multiplication
    //elPath.setAttribute('transform', 'scale(2) translate(10, -20)');
    elPath.setAttribute('transform', 'scale(2)');

    fabric.Path.fromElement(elPath, function(path) {
      ok(path instanceof fabric.Path);

      deepEqual(path.toObject(), fabric.util.object.extend(EXPECTED_PATH_OBJECT, {
        strokeDashArray:  [5, 2],
        strokeLineCap:    'round',
        strokeLineJoin:   'bevil',
        strokeMiterLimit: 5,
        transformMatrix:  [2, 0, 0, 2, 0, 0]
      }));

      var ANGLE = 90;

      elPath.setAttribute('transform', 'rotate(' + ANGLE + ')');
      fabric.Path.fromElement(elPath, function(path) {

        deepEqual(
          path.get('transformMatrix'),
          [ Math.cos(ANGLE), Math.sin(ANGLE), -Math.sin(ANGLE), Math.cos(ANGLE), 0, 0 ]
        );
        start();
      });
    });
  });

  asyncTest('multiple sequences in path commands', function() {
    var el = getPathElement('M100 100 l 200 200 300 300 400 -50 z');
    fabric.Path.fromElement(el, function(obj) {

      deepEqual(obj.path[0], ['M', 0, 0]);
      deepEqual(obj.path[1], ['L', 200, 200]);
      deepEqual(obj.path[2], ['L', 500, 500]);
      deepEqual(obj.path[3], ['L', 900, 450]);

      el = getPathElement('c 0,-53.25604 43.17254,-96.42858 96.42857,-96.42857 53.25603,0 96.42857,43.17254 96.42857,96.42857');
      fabric.Path.fromElement(el, function(obj) {

        deepEqual(obj.path[0], ['C', 0, 43.172529999999995, 43.17254, -0.000010000000003174137, 96.42857, 0]);
        deepEqual(obj.path[1], ['C', 149.6846, 0, 192.85714, 43.17254, 192.85714, 96.42857]);
        start();
      });
    });
  });

  asyncTest('compressed path commands', function() {
    var el = getPathElement('M56.224 84.12c-.047.132-.138.221-.322.215.046-.131.137-.221.322-.215z');
    fabric.Path.fromElement(el, function(obj) {

      deepEqual(obj.path[0], ['M', 0.32200000000000273, 0.0002829514169349068]);
      deepEqual(obj.path[1], ['C', 0.2750000000000057, 0.1322829514169399, 0.1840000000000046, 0.22128295141693854, 0, 0.21528295141693832]);
      deepEqual(obj.path[2], ['C', 0.045999999999999375, 0.08428295141693809, 0.13700000000000045, -0.005717048583065321, 0.32200000000000273, 0.0002829514169349068]);
      deepEqual(obj.path[3], ['Z']);
      start();
    });
  });

  asyncTest('compressed path commands with e^x', function() {
    var el = getPathElement('M56.224e2 84.12E-2c-.047.132-.138.221-.322.215.046-.131.137-.221.322-.215m-.050 -20.100z');
    fabric.Path.fromElement(el, function(obj) {

      deepEqual(obj.path[0], ['M', 0.3220000000001164, 20.1]);
      deepEqual(obj.path[1], ['C', 0.2750000000005457, 20.232, 0.18400000000019645, 20.321, 0, 20.315]);
      deepEqual(obj.path[2], ['C', 0.046000000000276486, 20.184, 0.13699999999971624, 20.094, 0.3220000000001164, 20.1]);
      deepEqual(obj.path[3], ['M', 0.2719999999999345, 0]);
      deepEqual(obj.path[4], ['Z']);
      start();
    });
  });
})();
