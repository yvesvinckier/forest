import { Vector2 } from "three";

const RGBAShader = {
  uniforms: {
    uProgress: { value: 0.0 },
    tDiffuse: { value: null },
    tSize: { value: new Vector2(256, 256) },
    center: { value: new Vector2(0.5, 0.5) },
    angle: { value: 1.57 },
    scale: { value: 1.0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform vec2 center;
		uniform float uProgress;
		uniform float scale;
		uniform vec2 tSize;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		

		void main() {

      vec2 p = vUv;
            
      vec4 cr = texture2D( tDiffuse, p + uProgress * vec2(0.1, 0.0));
      vec4 cg = texture2D( tDiffuse, p);
      vec4 cb = texture2D( tDiffuse, p - uProgress * vec2(0.1, 0.0));

      // vec4 color = texture2D(tDiffuse, p);
      gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0);

		}`,
};

export { RGBAShader };
