
/**
 *
 * TODO:
 * Ideally, we should look into replacing Trackball controls for our own
 * solution in the near future (perhaps a lite version?), ala the github STL
 * visualizer.
 * Aside from it being slower than we would like, I haven't found a good way to
 * lock the rotation of the x axis.
 * See: https://github.com/mrdoob/three.js/issues/1230
 */

"use strict";

var React = require('react');

var stats = null;

function startStats() {
	var container = document.querySelector('#StatsWrapper');
	if (!container) {
		console.warn("Wrapper for stats not found. Quitting.");
		return
	}
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);
}

var Panel = React.createClass({

	getInitialState: function() {
		return {
			state: 'solid',
		};
	},

	render: function() {
		var toSolidMaterial = () => {
			this.setState({ state: 'solid' });
			this.props.parent.toSolidMaterial();
		};
		var toNormalMaterial = () => {
			this.setState({ state: 'normal' });
			this.props.parent.toNormalMaterial();
		};
		var toWireframeMaterial = () => {
			this.setState({ state: 'wireframe' });
			this.props.parent.toWireframeMaterial();
		};

		return (
			<div className="panel">
				<button className={this.state.state==="solid"?"active":""}
					onClick={toSolidMaterial}>
					Sólido
				</button>
				<button className={this.state.state==="normal"?"active":""}
					onClick={toNormalMaterial}>
					Normal
				</button>
				<button className={this.state.state==="wireframe"?"active":""}
					onClick={toWireframeMaterial}>
					Wireframe
				</button>
			</div>
		);
	}
});

var STLRenderer = React.createClass({

	componentDidMount: function() {
		startStats();
		this._init();
		this._animate();
	},

	_init: function () {
		if (!Detector.webgl) {
			Detector.addGetWebGLMessage();
		}

		var width = $(this.getDOMNode().parentElement).innerWidth()-15; // magic num
		var height = $(this.getDOMNode().parentElement.parentElement).height();

		var addShadowedLight = (x, y, z, color, intensity) => {
			var directionalLight = new THREE.DirectionalLight(color, intensity);
			directionalLight.position.set(x, y, z);
			this.scene.add(directionalLight);
			directionalLight.castShadow = true;
			// directionalLight.shadowCameraVisible = true;
			var d = 1;
			directionalLight.shadowCameraLeft = -d;
			directionalLight.shadowCameraRight = d;
			directionalLight.shadowCameraTop = d;
			directionalLight.shadowCameraBottom = -d;
			directionalLight.shadowCameraNear = 1;
			directionalLight.shadowCameraFar = 4;
			directionalLight.shadowMapWidth = 1024;
			directionalLight.shadowMapHeight = 1024;
			directionalLight.shadowBias = -0.005;
			directionalLight.shadowDarkness = 0.15;
		}

		// setup scene and camera
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(45, width/height, 1, 1000);
		// this.camera.position.set(3, 0.15, 5);
		this.camera.position.z = 5;

		// setup renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: false });
		this.renderer.setSize(width, height);
		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.shadowMapEnabled = true;
		this.renderer.shadowMapCullFace = THREE.CullFaceBack;
		window.addEventListener('resize', this._onWindowResize, false);
		this.refs.container.getDOMNode().appendChild(this.renderer.domElement);
		this.renderer.setClearColor(0xDDDDDD);
		// this.renderer.setPixelRatio(window.devicePixelRatio);

		// setup controls
		this.controls = new THREE.TrackballControls(this.camera,
			this.refs.container.getDOMNode());
		this.controls.rotateSpeed = 6.0;
		this.controls.zoomSpeed = 5.2;
		this.controls.panSpeed = 5;
		// this.controls.noZoom = false;
		this.controls.noPan = false;
		this.controls.staticMoving = true;
		this.controls.dynamicDampingFactor = 0.3;
		this.controls.keys = [65, 83, 68];
		this.controls.addEventListener('change', this._render);

		// Add plane
		this.plane = new THREE.GridHelper(100, 10);
		this.plane.rotation.x = -Math.PI/2;
		// this.plane.position.y = 0;
		// this.plane.receiveShadow = true;
		this.scene.add(this.plane);

		// Add cube
		var cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
		this.scene.add(cube);

		var cameraTarget = new THREE.Vector3(0, -0.25, 0);

		var loader = new THREE.STLLoader();
		loader.load(this.props.file, (geometry) => {
			function position(mesh, plane) {
				mesh.geometry.computeBoundingBox()
				var b = mesh.geometry.boundingBox;
				mesh.applyMatrix(
					new THREE.Matrix4().makeTranslation(
						-(b.max.x + b.min.x)/4,
						-(b.max.y + b.min.y)/4,
						-(b.max.z + b.min.z)/4
					)
				);
				plane.position.z = -(b.max.z - b.min.z)/2;
			}

			this.normalMaterial = new THREE.MeshPhongMaterial({
				color: 0xff5533,
				specular: 0x111111,
				shininess: 200,
			});

			this.model = new THREE.Mesh(geometry, this.normalMaterial);
			window.r = this;
			// this.model.position.set(g.boundingBox.max.x/2, -g.boundingBox.min.y/2, 0);
			// this.model.rotation.set( 0, - Math.PI / 2, 0 );
			this.model.scale.set(0.5, 0.5, 0.5);
			position(this.model, this.plane); // CENTER!

			this.model.castShadow = true;
			this.model.receiveShadow = true;

			this.scene.add(this.model);
		});

		this.scene.add(new THREE.AmbientLight(0x777777));

		addShadowedLight(1, 1, 1, 0xffffff, 1.35);
		addShadowedLight(0.5, 1, -1, 0xffaa00, 1);
	},

	_onWindowResize: function() {
		var width = $(this.getDOMNode().parentElement).innerWidth()-15;
		var height = $(this.getDOMNode().parentElement.parentElement).height();

		this.controls.handleResize();
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	},

	_animate: function() {
		requestAnimationFrame(this._animate);
		if (stats) {
			stats.update();
		}
		this.controls.update();
		this._render();
	},

	_render: function() {
		// rendering below
		var timer = Date.now() * 0.0005;
		// this.camera.position.x = Math.cos( timer ) * 3;
		// this.camera.position.z = Math.sin( timer ) * 3;
		// this.camera.lookAt(cameraTarget);
		this.renderer.render(this.scene, this.camera);
	},

	setColor: function(color) {
		this.normalMaterial.color = new THREE.Color(color);
		this.toSolidMaterial();
	},

	toNormalMaterial: function() {
		this.model.material = new THREE.MeshNormalMaterial({
		  color: this.model.material.color,
		  specular: 10066329,
		  transparent: false,
		  opacity: 0,
		});
	},

	toWireframeMaterial: function() {
		this.model.material = this.normalMaterial;
		this.model.material.wireframe = true;
	},

	toSolidMaterial: function() {
		this.model.material = this.normalMaterial;
		this.model.material.wireframe = false;
	},

	render: function() {

		return (
			<div className="STLRenderer">
				<div ref="container"></div>
				<div id="StatsWrapper"></div>
				<Panel parent={this} />
			</div>
		);
	}

});

module.exports = STLRenderer;