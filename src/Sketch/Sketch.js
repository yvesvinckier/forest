import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";
import gsap from "gsap";
import maskURL from "../img/mask.jpg";
import assets from "./assets";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { CurtainShader } from "./Effects/curtainShader";
import { RGBAShader } from "./Effects/rgbaShader";

const createInputEvents = require("simple-input-events");

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.targetElement;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);

    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      1,
      3000
    );

    this.event = createInputEvents(this.renderer.domElement);

    this.camera.position.set(0, 0, 900);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;

    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();

    this.isPlaying = true;
    this.setPostProcess();
    this.setObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.events();
    // this.settings();
    this.imageIndex = 0;

    setInterval(() => {
      this.imageIndex = this.imageIndex % 15;
      // 6 is equal to assets.length
      this.imageIndex = this.imageIndex + 1 === 6 ? 0 : ++this.imageIndex;
      this.runAnimation();
    }, 5000);
  }

  setPostProcess() {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.curtainShader = new ShaderPass(CurtainShader);
    this.composer.addPass(this.curtainShader);

    this.rgbaShader = new ShaderPass(RGBAShader);
    this.composer.addPass(this.rgbaShader);
  }

  events() {
    this.event.on("move", ({ uv }) => {
      // -0.5 to nomalize the uv
      this.mouse.x = uv[0] - 0.5;
      this.mouse.y = uv[1] - 0.5;
      // console.log(this.mouse);
    });
  }

  settings() {
    this.settings = {
      progress: 0,
      progress1: 0,
      runAnimation: () => {
        this.runAnimation();
      },
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "progress1", 0, 1, 0.01).onChange((val) => {
      this.effectPass.uniforms.uProgress.value = val;
    });
    this.gui.add(this.settings, "runAnimation");
  }

  runAnimation() {
    console.log(this.imageIndex);
    let tl = gsap.timeline();

    // camera position
    tl.to(this.camera.position, {
      x: 2500 * this.imageIndex,
      duration: 1.5,
      ease: "power4.inOut",
    });
    tl.to(
      this.camera.position,
      {
        z: 700,
        duration: 1,
        ease: "power4.inOut",
      },
      0
    );
    tl.to(
      this.camera.position,
      {
        z: 900,
        duration: 1,
        ease: "power4.inOut",
      },
      1
    );

    // post procesing
    tl.to(
      this.curtainShader.uniforms.uProgress,
      {
        value: 1,
        duration: 1,
        ease: "power3.inOut",
      },
      0
    );
    tl.to(
      this.curtainShader.uniforms.uProgress,
      {
        value: 0,
        duration: 1,
        ease: "power3.inOut",
      },
      1
    );
    tl.to(
      this.rgbaShader.uniforms.uProgress,
      {
        value: 1,
        duration: 1,
        ease: "power3.inOut",
      },
      0
    );
    tl.to(
      this.rgbaShader.uniforms.uProgress,
      {
        value: 0,
        duration: 1,
        ease: "power3.inOut",
      },
      1
    );
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  setObjects() {
    this.geometry = new THREE.PlaneGeometry(1920, 1080, 1, 1);

    this.textures = assets;
    this.maskTexture = new THREE.TextureLoader().load(maskURL);
    this.textures = this.textures.map((t) =>
      new THREE.TextureLoader().load(t.image)
    );
    // console.log(this.textures);

    this.groups = [];

    this.textures.forEach((t, j) => {
      let group = new THREE.Group();

      this.scene.add(group);
      this.groups.push(group);

      for (let i = 0; i < 3; i++) {
        let m = new THREE.MeshBasicMaterial({
          map: t,
        });

        if (i > 0) {
          m = new THREE.MeshBasicMaterial({
            map: t,
            alphaMap: this.maskTexture,
            transparent: true,
          });
        }

        let mesh = new THREE.Mesh(this.geometry, m);
        mesh.position.z = (i + 1) * 300;
        group.add(mesh);
        group.position.x = j * 2500;
      }
    });
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    this.oscillator = Math.sin(this.time * 0.1) * 0.5 + 0.5;

    // lerp give perfect inertia for mouse movement
    this.mouseTarget.lerp(this.mouse, 0.1);

    this.groups.forEach((g) => {
      g.rotation.x = -this.mouseTarget.y * 0.3;
      g.rotation.y = -this.mouseTarget.x * 0.3;

      g.children.forEach((m, i) => {
        m.position.z = (i + 1) * 100 - this.oscillator * 200;
      });
    });

    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}
