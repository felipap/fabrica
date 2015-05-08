
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
		this.camera = new THREE.PerspectiveCamera(45, 700/400, 1, 1000);
		this.camera.position.set(3, 0.15, 5);
		// this.camera.position.z = 5;

		// setup renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: false });
		this.renderer.setSize(700, 400);
		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.shadowMapEnabled = true;
		this.renderer.shadowMapCullFace = THREE.CullFaceBack;
		// window.addEventListener('resize', onWindowResize, false);
		this.refs.container.getDOMNode().appendChild(this.renderer.domElement);
		// this.renderer.setClearColor( this.scene.fog.color );
		// this.renderer.setPixelRatio(window.devicePixelRatio);

		// setup controls
		this.controls = new THREE.TrackballControls(this.camera);
		this.controls.rotateSpeed = 4.0;
		this.controls.zoomSpeed = 5.2;
		this.controls.panSpeed = 0.8;
		// this.controls.noZoom = false;
		this.controls.noPan = false;
		this.controls.staticMoving = true;
		this.controls.dynamicDampingFactor = 0.3;
		this.controls.keys = [65, 83, 68];
		this.controls.addEventListener('change', this._render);

		// Add plane
		var plane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(40, 40),
			new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 })
		);
		plane.rotation.x = -Math.PI/2;
		// plane.receiveShadow = true;
		// plane.position.y = 0;
		this.scene.add(plane);

		// Add cube
		var cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
		this.scene.add(cube);

		var cameraTarget = new THREE.Vector3(0, -0.25, 0);

		var loader = new THREE.STLLoader();
		loader.load(this.props.file, (geometry) => {

			var material = new THREE.MeshPhongMaterial({
				color: 0xff5533,
				specular: 0x111111,
				shininess: 200,
			});
			var mesh = new THREE.Mesh(geometry, material);
			window.m = mesh;

			window.position = function (mesh) {
				var b = m.geometry.boundingBox;
				mesh.applyMatrix(
					new THREE.Matrix4().makeTranslation(
						-(b.max.x + b.min.x)/4,
						(b.max.y - b.min.y)/4,
						-(b.max.z + b.min.z)/4
					)
				);
			}

			position(m)

			// CENTER!
			// mesh.position.set(g.boundingBox.max.x/2, -g.boundingBox.min.y/2, 0);
			// mesh.rotation.set( 0, - Math.PI / 2, 0 );
			mesh.scale.set( 0.5, 0.5, 0.5 );
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			this.scene.add(mesh);
		});

		this.scene.add(new THREE.AmbientLight(0x777777));

		addShadowedLight( 1, 1, 1, 0xffffff, 1.35 );
		addShadowedLight( 0.5, 1, -1, 0xffaa00, 1 );
	},

	_onWindowResize: function() {
		this.controls.handleResize();
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
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

	render: function() {
		return (
			<div className="STLRenderer">
				<div ref="container"></div>
				<div id="StatsWrapper"></div>
			</div>
		);
	}

});

module.exports = STLRenderer;