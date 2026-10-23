// src/components/common/FluidBackground.tsx
import { useEffect, useRef } from "react";

export const FluidBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanupSim: (() => void) | null = null;

    try {
      cleanupSim = fluidSimulation(canvas);
    } catch (e) {
      console.warn("WebGL fluid simulation initialization error:", e);
    }

    return () => {
      if (cleanupSim) {
        cleanupSim();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* 1. Fluid Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {/* 2. Flowstate Radial Scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(115% 95% at 50% 46%, var(--scrim-strong) 0%, var(--scrim-strong) 24%, var(--scrim) 52%, var(--scrim-soft) 100%)",
        }}
      />
    </div>
  );
};

export interface TextureFormat {
  internalFormat: number;
  format: number;
}

export interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  attach: (id: number) => number;
}

export interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

export interface WebGLExtensions {
  formatRGBA: TextureFormat;
  formatRG: TextureFormat;
  formatR: TextureFormat;
  halfFloatTexType: number;
  supportLinearFiltering: boolean;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

// Pavel Dobryakov's WebGL fluid solver tuned for Flowstate
function fluidSimulation(canvas: HTMLCanvasElement) {
  const initW = canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1920);
  const initH = canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 1080);
  canvas.width = initW;
  canvas.height = initH;

  const config = {
    SIM_RESOLUTION: 200,
    DYE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.958,
    VELOCITY_DISSIPATION: 0.96,
    PRESSURE_DISSIPATION: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 42,
    SPLAT_RADIUS: 0.22,
    SHADING: true,
    COLORFUL: true,
    PAUSED: false,
    BACK_COLOR: { r: 4, g: 5, b: 12 },
    TRANSPARENT: false,
    BLOOM: false,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.8,
    BLOOM_SOFT_KNEE: 0.7,
  };

  class Pointer {
    id = -1;
    x = 0;
    y = 0;
    dx = 0;
    dy = 0;
    down = false;
    moved = false;
    color: ColorRGB = { r: 30, g: 0, b: 300 };
    everMoved = false;
  }

  const pointers: Pointer[] = [new Pointer()];
  const splatStack: number[] = [];
  const bloomFramebuffers: FBO[] = [];

  const contextData = getWebGLContext(canvas);
  if (!contextData) return () => {};
  const { gl, ext } = contextData;

  if (isMobile()) config.SHADING = false;
  if (!ext.supportLinearFiltering) {
    config.SHADING = false;
    config.BLOOM = false;
  }

  function getWebGLContext(canv: HTMLCanvasElement): {
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    ext: WebGLExtensions;
  } | null {
    const params: WebGLContextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let g: WebGLRenderingContext | WebGL2RenderingContext | null = canv.getContext("webgl2", params);
    const isWebGL2 = g !== null;
    if (!isWebGL2) {
      g = canv.getContext("webgl", params) || (canv.getContext("experimental-webgl", params) as WebGLRenderingContext | null);
    }

    if (!g) return null;

    let halfFloat: OES_texture_half_float | null = null;
    let supportLinearFiltering: OES_texture_float_linear | OES_texture_half_float_linear | null = null;
    if (isWebGL2) {
      g.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = g.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = g.getExtension("OES_texture_half_float");
      supportLinearFiltering = g.getExtension("OES_texture_half_float_linear");
    }

    g.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2
      ? (g as WebGL2RenderingContext).HALF_FLOAT
      : (halfFloat ? halfFloat.HALF_FLOAT_OES : g.FLOAT);
    let formatRGBA: TextureFormat | null;
    let formatRG: TextureFormat | null;
    let formatR: TextureFormat | null;

    if (isWebGL2) {
      const gl2 = g as WebGL2RenderingContext;
      formatRGBA = getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl2, gl2.RG16F, gl2.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl2, gl2.R16F, gl2.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(g, g.RGBA, g.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(g, g.RGBA, g.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(g, g.RGBA, g.RGBA, halfFloatTexType);
    }

    return {
      gl: g,
      ext: {
        formatRGBA: formatRGBA || { internalFormat: g.RGBA, format: g.RGBA },
        formatRG: formatRG || { internalFormat: g.RGBA, format: g.RGBA },
        formatR: formatR || { internalFormat: g.RGBA, format: g.RGBA },
        halfFloatTexType,
        supportLinearFiltering: !!supportLinearFiltering,
      },
    };
  }

  function getSupportedFormat(
    g: WebGLRenderingContext | WebGL2RenderingContext,
    internalFormat: number,
    format: number,
    type: number
  ): TextureFormat | null {
    if (!supportRenderTextureFormat(g, internalFormat, format, type)) {
      const gl2 = g as WebGL2RenderingContext;
      switch (internalFormat) {
        case gl2.R16F:
          return getSupportedFormat(g, gl2.RG16F, gl2.RG, type);
        case gl2.RG16F:
          return getSupportedFormat(g, gl2.RGBA16F, gl2.RGBA, type);
        default:
          return null;
      }
    }
    return { internalFormat, format };
  }

  function supportRenderTextureFormat(
    g: WebGLRenderingContext | WebGL2RenderingContext,
    internalFormat: number,
    format: number,
    type: number
  ): boolean {
    const texture = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, texture);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    const fbo = g.createFramebuffer();
    g.bindFramebuffer(g.FRAMEBUFFER, fbo);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);

    const status = g.checkFramebufferStatus(g.FRAMEBUFFER);
    return status === g.FRAMEBUFFER_COMPLETE;
  }

  function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  class GLProgram {
    uniforms: Record<string, WebGLUniformLocation | null> = {};
    program: WebGLProgram;

    constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(this.program);
      }

      const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniformName = gl.getActiveUniform(this.program, i)!.name;
        this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
      }
    }

    bind() {
      gl.useProgram(this.program);
    }
  }

  function compileShader(type: number, source: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }
    return shader;
  }

  const baseVertexShader = compileShader(
    gl.VERTEX_SHADER,
    `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `
  );

  const clearShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
          gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `
  );

  const colorShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      uniform vec4 color;
      void main () {
          gl_FragColor = color;
      }
    `
  );

  const backgroundShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float aspectRatio;
      #define SCALE 25.0
      void main () {
          vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
          float v = mod(uv.x + uv.y, 2.0);
          v = v * 0.1 + 0.8;
          gl_FragColor = vec4(vec3(v), 1.0);
      }
    `
  );

  const displayShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main () {
          vec3 C = texture2D(uTexture, vUv).rgb;
          float a = max(C.r, max(C.g, C.b));
          gl_FragColor = vec4(C, a);
      }
    `
  );

  const displayBloomShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform sampler2D uBloom;
      uniform sampler2D uDithering;
      uniform vec2 ditherScale;
      void main () {
          vec3 C = texture2D(uTexture, vUv).rgb;
          vec3 bloom = texture2D(uBloom, vUv).rgb;
          vec3 noise = texture2D(uDithering, vUv * ditherScale).rgb;
          noise = noise * 2.0 - 1.0;
          bloom += noise / 800.0;
          bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
          C += bloom;
          float a = max(C.r, max(C.g, C.b));
          gl_FragColor = vec4(C, a);
      }
    `
  );

  const displayShadingShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform vec2 texelSize;
      void main () {
          vec3 L = texture2D(uTexture, vL).rgb;
          vec3 R = texture2D(uTexture, vR).rgb;
          vec3 T = texture2D(uTexture, vT).rgb;
          vec3 B = texture2D(uTexture, vB).rgb;
          vec3 C = texture2D(uTexture, vUv).rgb;
          float dx = length(R) - length(L);
          float dy = length(T) - length(B);
          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);
          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          C.rgb *= diffuse;
          float a = max(C.r, max(C.g, C.b));
          gl_FragColor = vec4(C, a);
      }
    `
  );

  const displayBloomShadingShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform sampler2D uBloom;
      uniform sampler2D uDithering;
      uniform vec2 ditherScale;
      uniform vec2 texelSize;
      void main () {
          vec3 L = texture2D(uTexture, vL).rgb;
          vec3 R = texture2D(uTexture, vR).rgb;
          vec3 T = texture2D(uTexture, vT).rgb;
          vec3 B = texture2D(uTexture, vB).rgb;
          vec3 C = texture2D(uTexture, vUv).rgb;
          float dx = length(R) - length(L);
          float dy = length(T) - length(B);
          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);
          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          C *= diffuse;
          vec3 bloom = texture2D(uBloom, vUv).rgb;
          vec3 noise = texture2D(uDithering, vUv * ditherScale).rgb;
          noise = noise * 2.0 - 1.0;
          bloom += noise / 800.0;
          bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
          C += bloom;
          float a = max(C.r, max(C.g, C.b));
          gl_FragColor = vec4(C, a);
      }
    `
  );

  const bloomPrefilterShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec3 curve;
      uniform float threshold;
      void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          float br = max(c.r, max(c.g, c.b));
          float rq = clamp(br - curve.x, 0.0, curve.y);
          rq = curve.z * rq * rq;
          c *= max(rq, br - threshold) / max(br, 0.0001);
          gl_FragColor = vec4(c, 0.0);
      }
    `
  );

  const bloomBlurShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      void main () {
          vec4 sum = vec4(0.0);
          sum += texture2D(uTexture, vL);
          sum += texture2D(uTexture, vR);
          sum += texture2D(uTexture, vT);
          sum += texture2D(uTexture, vB);
          sum *= 0.25;
          gl_FragColor = sum;
      }
    `
  );

  const bloomFinalShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform float intensity;
      void main () {
          vec4 sum = vec4(0.0);
          sum += texture2D(uTexture, vL);
          sum += texture2D(uTexture, vR);
          sum += texture2D(uTexture, vT);
          sum += texture2D(uTexture, vB);
          sum *= 0.25;
          gl_FragColor = sum * intensity;
      }
    `
  );

  const splatShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
          vec2 p = vUv - point.xy;
          p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          vec3 base = texture2D(uTarget, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.0);
      }
    `
  );

  const advectionManualFilteringShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
          vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
          gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
          gl_FragColor.a = 1.0;
      }
    `
  );

  const advectionShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;
      void main () {
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          gl_FragColor = dissipation * texture2D(uSource, coord);
          gl_FragColor.a = 1.0;
      }
    `
  );

  const divergenceShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uVelocity, vL).x;
          float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y;
          float B = texture2D(uVelocity, vB).y;
          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; }
          if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; }
          if (vB.y < 0.0) { B = -C.y; }
          float div = 0.5 * (R - L + T - B);
          gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `
  );

  const curlShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
          float L = texture2D(uVelocity, vL).y;
          float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x;
          float B = texture2D(uVelocity, vB).x;
          float vorticity = R - L - T + B;
          gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `
  );

  const vorticityShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
          float L = texture2D(uCurl, vL).x;
          float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x;
          float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;
          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001;
          force *= curl * C;
          force.y *= -1.0;
          vec2 vel = texture2D(uVelocity, vUv).xy;
          gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `
  );

  const pressureShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      vec2 boundary (vec2 uv) {
          return uv;
      }
      void main () {
          float L = texture2D(uPressure, boundary(vL)).x;
          float R = texture2D(uPressure, boundary(vR)).x;
          float T = texture2D(uPressure, boundary(vT)).x;
          float B = texture2D(uPressure, boundary(vB)).x;
          float C = texture2D(uPressure, vUv).x;
          float divergence = texture2D(uDivergence, vUv).x;
          float pressure = (L + R + B + T - divergence) * 0.25;
          gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `
  );

  const gradientSubtractShader = compileShader(
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      vec2 boundary (vec2 uv) {
          return uv;
      }
      void main () {
          float L = texture2D(uPressure, boundary(vL)).x;
          float R = texture2D(uPressure, boundary(vR)).x;
          float T = texture2D(uPressure, boundary(vT)).x;
          float B = texture2D(uPressure, boundary(vB)).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `
  );

  const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (destination: WebGLFramebuffer | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  })();

  let simWidth: number;
  let simHeight: number;
  let dyeWidth: number;
  let dyeHeight: number;
  let density: DoubleFBO;
  let velocity: DoubleFBO;
  let divergence: FBO;
  let curl: FBO;
  let pressure: DoubleFBO;
  let bloom: FBO;

  const ditheringTexture = createNoiseTexture(256);
  void ditheringTexture;

  const clearProgram = new GLProgram(baseVertexShader, clearShader);
  const colorProgram = new GLProgram(baseVertexShader, colorShader);
  const backgroundProgram = new GLProgram(baseVertexShader, backgroundShader);
  const displayProgram = new GLProgram(baseVertexShader, displayShader);
  const displayBloomProgram = new GLProgram(baseVertexShader, displayBloomShader);
  const displayShadingProgram = new GLProgram(baseVertexShader, displayShadingShader);
  const displayBloomShadingProgram = new GLProgram(
    baseVertexShader,
    displayBloomShadingShader
  );
  const bloomPrefilterProgram = new GLProgram(baseVertexShader, bloomPrefilterShader);
  const bloomBlurProgram = new GLProgram(baseVertexShader, bloomBlurShader);
  const bloomFinalProgram = new GLProgram(baseVertexShader, bloomFinalShader);
  const splatProgram = new GLProgram(baseVertexShader, splatShader);
  const advectionProgram = new GLProgram(
    baseVertexShader,
    ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader
  );
  const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
  const curlProgram = new GLProgram(baseVertexShader, curlShader);
  const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
  const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
  const gradienSubtractProgram = new GLProgram(
    baseVertexShader,
    gradientSubtractShader
  );

  function initFramebuffers() {
    const simRes = getResolution(config.SIM_RESOLUTION);
    const dyeRes = getResolution(config.DYE_RESOLUTION);

    simWidth = simRes.width;
    simHeight = simRes.height;
    dyeWidth = dyeRes.width;
    dyeHeight = dyeRes.height;

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    if (density == null)
      density = createDoubleFBO(
        dyeWidth,
        dyeHeight,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
    else
      density = resizeDoubleFBO(
        density,
        dyeWidth,
        dyeHeight,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );

    if (velocity == null)
      velocity = createDoubleFBO(
        simWidth,
        simHeight,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );
    else
      velocity = resizeDoubleFBO(
        velocity,
        simWidth,
        simHeight,
        rg.internalFormat,
        rg.format,
        texType,
        filtering
      );

    if (divergence?.texture) gl.deleteTexture(divergence.texture);
    if (divergence?.fbo) gl.deleteFramebuffer(divergence.fbo);
    divergence = createFBO(
      simWidth,
      simHeight,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );

    if (curl?.texture) gl.deleteTexture(curl.texture);
    if (curl?.fbo) gl.deleteFramebuffer(curl.fbo);
    curl = createFBO(
      simWidth,
      simHeight,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );

    if (pressure?.read?.texture) gl.deleteTexture(pressure.read.texture);
    if (pressure?.read?.fbo) gl.deleteFramebuffer(pressure.read.fbo);
    if (pressure?.write?.texture) gl.deleteTexture(pressure.write.texture);
    if (pressure?.write?.fbo) gl.deleteFramebuffer(pressure.write.fbo);
    pressure = createDoubleFBO(
      simWidth,
      simHeight,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST
    );

    initBloomFramebuffers();
  }

  function initBloomFramebuffers() {
    const res = getResolution(config.BLOOM_RESOLUTION);
    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    if (bloom?.texture) gl.deleteTexture(bloom.texture);
    if (bloom?.fbo) gl.deleteFramebuffer(bloom.fbo);
    bloom = createFBO(
      res.width,
      res.height,
      rgba.internalFormat,
      rgba.format,
      texType,
      filtering
    );

    for (const b of bloomFramebuffers) {
      if (b?.texture) gl.deleteTexture(b.texture);
      if (b?.fbo) gl.deleteFramebuffer(b.fbo);
    }
    bloomFramebuffers.length = 0;
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
      const width = res.width >> (i + 1);
      const height = res.height >> (i + 1);
      if (width < 2 || height < 2) break;
      const fbo = createFBO(
        width,
        height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering
      );
      bloomFramebuffers.push(fbo);
    }
  }

  function createFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): FBO {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width: w,
      height: h,
      attach(id: number) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): DoubleFBO {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
      get read() {
        return fbo1;
      },
      set read(value: FBO) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value: FBO) {
        fbo2 = value;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  function resizeFBO(
    target: FBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): FBO {
    const newFBO = createFBO(w, h, internalFormat, format, type, param);
    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, 1);
    blit(newFBO.fbo);
    return newFBO;
  }

  function resizeDoubleFBO(
    target: DoubleFBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number
  ): DoubleFBO {
    target.read = resizeFBO(
      target.read,
      w,
      h,
      internalFormat,
      format,
      type,
      param
    );
    target.write = createFBO(w, h, internalFormat, format, type, param);
    return target;
  }

  function createNoiseTexture(size: number) {
    const data = new Uint8Array(size * size * 3);
    for (let i = 0; i < data.length; i++) data[i] = Math.floor(Math.random() * 256);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      size,
      size,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      data
    );
    return {
      texture,
      width: size,
      height: size,
      attach(id: number) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  initFramebuffers();
  multipleSplats(34);
  for (let i = 0; i < 8; i++) splatStack.push(10 + Math.floor(Math.random() * 10));

  let lastColorChangeTime = Date.now();
  let virtualSeeded = false;
  let orbitAngle = 0;
  let vPrevX = 0,
    vPrevY = 0;
  let virtualColor: ColorRGB | null = null;
  let lastVColorTime = 0;
  const engineStart = Date.now();
  const ORBIT_RADIUS = 300;
  const ORBIT_SPEED = 0.026;
  const ORBIT_START_DELAY = 700;

  let rafHandle = 0;
  let destroyed = false;

  update();

  function update() {
    if (destroyed) return;
    resizeCanvas();
    driveVirtualPointer();
    input();
    if (!config.PAUSED) step(0.016);
    render(null);
    rafHandle = requestAnimationFrame(update);
  }

  function driveVirtualPointer() {
    if (Date.now() - engineStart < ORBIT_START_DELAY) return;
    const cw = canvas.width > 0 ? canvas.width : (typeof window !== "undefined" ? window.innerWidth : 1920);
    const ch = canvas.height > 0 ? canvas.height : (typeof window !== "undefined" ? window.innerHeight : 1080);
    const cx = cw / 2;
    const cy = ch / 2;
    const base = Math.min(ORBIT_RADIUS, cw * 0.35, ch * 0.35);
    const r = base * (0.72 + 0.28 * Math.sin(orbitAngle * 0.37));
    orbitAngle += ORBIT_SPEED;
    const x = cx + Math.cos(orbitAngle) * r;
    const y = cy + Math.sin(orbitAngle) * r;
    if (!virtualSeeded) {
      virtualSeeded = true;
      vPrevX = x;
      vPrevY = y;
      return;
    }
    if (!virtualColor || Date.now() - lastVColorTime > 120) {
      virtualColor = generateColor();
      virtualColor.r *= 3.2;
      virtualColor.g *= 3.2;
      virtualColor.b *= 3.2;
      lastVColorTime = Date.now();
    }
    const dx = (x - vPrevX) * 9.0;
    const dy = (y - vPrevY) * 9.0;
    vPrevX = x;
    vPrevY = y;
    splat(x, y, dx, dy, virtualColor);
  }

  function input() {
    if (splatStack.length > 0) multipleSplats(splatStack.pop()!);

    for (let i = 0; i < pointers.length; i++) {
      const p = pointers[i];
      if (p.moved) {
        splat(p.x, p.y, p.dx, p.dy, p.color);
        p.moved = false;
      }
    }

    if (!config.COLORFUL) return;

    if (lastColorChangeTime + 100 < Date.now()) {
      lastColorChangeTime = Date.now();
      for (let i = 0; i < pointers.length; i++) {
        pointers[i].color = generateColor();
      }
    }
  }

  function step(dt: number) {
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, simWidth, simHeight);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl.fbo);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write.fbo);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence.fbo);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
    blit(pressure.write.fbo);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write.fbo);
      pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(
      gradienSubtractProgram.uniforms.texelSize,
      1.0 / simWidth,
      1.0 / simHeight
    );
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write.fbo);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
    if (!ext.supportLinearFiltering)
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        1.0 / simWidth,
        1.0 / simHeight
      );
    const velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dyeWidth, dyeHeight);
    if (!ext.supportLinearFiltering)
      gl.uniform2f(
        advectionProgram.uniforms.dyeTexelSize,
        1.0 / dyeWidth,
        1.0 / dyeHeight
      );
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(density.write.fbo);
    density.swap();
  }

  function render(target: WebGLFramebuffer | null) {
    if (config.BLOOM) applyBloom(density.read, bloom);

    if (target == null || !config.TRANSPARENT) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }

    const width = target == null ? gl.drawingBufferWidth : dyeWidth;
    const height = target == null ? gl.drawingBufferHeight : dyeHeight;
    gl.viewport(0, 0, width, height);

    if (!config.TRANSPARENT) {
      colorProgram.bind();
      const bc = config.BACK_COLOR;
      gl.uniform4f(colorProgram.uniforms.color, bc.r / 255, bc.g / 255, bc.b / 255, 1);
      blit(target);
    }

    if (target == null && config.TRANSPARENT) {
      backgroundProgram.bind();
      gl.uniform1f(backgroundProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      blit(null);
    }

    if (config.SHADING) {
      const program = config.BLOOM ? displayBloomShadingProgram : displayShadingProgram;
      program.bind();
      gl.uniform2f(program.uniforms.texelSize, 1.0 / width, 1.0 / height);
      gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
    } else {
      const program = config.BLOOM ? displayBloomProgram : displayProgram;
      program.bind();
      gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
    }

    blit(target);
  }

  function applyBloom(source: FBO, destination: FBO) {
    if (bloomFramebuffers.length < 2) return;
    let last = destination;
    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    const knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    const curve0 = config.BLOOM_THRESHOLD - knee;
    const curve1 = knee * 2;
    const curve2 = 0.25 / knee;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    gl.viewport(0, 0, last.width, last.height);
    blit(last.fbo);

    bloomBlurProgram.bind();
    for (let i = 0; i < bloomFramebuffers.length; i++) {
      const dest = bloomFramebuffers[i];
      gl.uniform2f(bloomBlurProgram.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, dest.width, dest.height);
      blit(dest.fbo);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
      const baseTex = bloomFramebuffers[i];
      gl.uniform2f(bloomBlurProgram.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      blit(baseTex.fbo);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(bloomFinalProgram.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    gl.viewport(0, 0, destination.width, destination.height);
    blit(destination.fbo);
  }

  function splat(x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) {
    const cw = canvas.width > 0 ? canvas.width : (typeof window !== "undefined" ? window.innerWidth : 1920);
    const ch = canvas.height > 0 ? canvas.height : (typeof window !== "undefined" ? window.innerHeight : 1080);
    gl.viewport(0, 0, simWidth, simHeight);
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, cw / ch);
    gl.uniform2f(splatProgram.uniforms.point, x / cw, 1.0 - y / ch);
    gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
    gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100.0);
    blit(velocity.write.fbo);
    velocity.swap();

    gl.viewport(0, 0, dyeWidth, dyeHeight);
    gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(density.write.fbo);
    density.swap();
  }

  function multipleSplats(amount: number) {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      const x = canvas.width * Math.random();
      const y = canvas.height * Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      splat(x, y, dx, dy, color);
    }
  }

  function resizeCanvas() {
    const w = canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 1920);
    const h = canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 1080);
    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
      initFramebuffers();
    }
  }

  function pointerPos(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  const teardown: Array<() => void> = [];
  function on<E extends Event = Event>(
    target: EventTarget,
    type: string,
    handler: (e: E) => void,
    opts?: boolean | AddEventListenerOptions
  ) {
    const listener: EventListener = (e: Event) => handler(e as E);
    target.addEventListener(type, listener, opts);
    teardown.push(() => target.removeEventListener(type, listener, opts));
  }

  on(window, "mousemove", (e: MouseEvent) => {
    const { x, y } = pointerPos(e.clientX, e.clientY);
    const p = pointers[0];
    if (!p.everMoved) {
      p.everMoved = true;
      p.x = x;
      p.y = y;
      p.down = true;
      return;
    }
    p.down = true;
    p.moved = true;
    p.dx = (x - p.x) * 5.0;
    p.dy = (y - p.y) * 5.0;
    p.x = x;
    p.y = y;
    p.color = generateColor();
  });

  on(
    window,
    "touchmove",
    (e: TouchEvent) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        if (i >= pointers.length) pointers.push(new Pointer());
        const p = pointers[i];
        const { x, y } = pointerPos(touches[i].clientX, touches[i].clientY);
        p.down = true;
        p.moved = p.everMoved === true;
        p.everMoved = true;
        p.dx = (x - p.x) * 8.0;
        p.dy = (y - p.y) * 8.0;
        p.x = x;
        p.y = y;
      }
    },
    { passive: true }
  );

  on(
    window,
    "touchstart",
    (e: TouchEvent) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        if (i >= pointers.length) pointers.push(new Pointer());
        const p = pointers[i];
        const { x, y } = pointerPos(touches[i].clientX, touches[i].clientY);
        p.id = touches[i].identifier;
        p.down = true;
        p.x = x;
        p.y = y;
        p.color = generateColor();
      }
    },
    { passive: true }
  );

  on(window, "mouseup", () => {
    pointers[0].down = false;
  });

  on(window, "touchend", (e: TouchEvent) => {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++)
      for (let j = 0; j < pointers.length; j++)
        if (touches[i].identifier === pointers[j].id) pointers[j].down = false;
  });

  on(canvas, "webglcontextlost", (e: Event) => {
    e.preventDefault();
    destroyed = true;
    if (rafHandle) cancelAnimationFrame(rafHandle);
  });

  return function destroy() {
    destroyed = true;
    if (rafHandle) cancelAnimationFrame(rafHandle);
    for (const off of teardown) off();
    try {
      if (density?.read?.texture) gl.deleteTexture(density.read.texture);
      if (density?.read?.fbo) gl.deleteFramebuffer(density.read.fbo);
      if (density?.write?.texture) gl.deleteTexture(density.write.texture);
      if (density?.write?.fbo) gl.deleteFramebuffer(density.write.fbo);
      if (velocity?.read?.texture) gl.deleteTexture(velocity.read.texture);
      if (velocity?.read?.fbo) gl.deleteFramebuffer(velocity.read.fbo);
      if (velocity?.write?.texture) gl.deleteTexture(velocity.write.texture);
      if (velocity?.write?.fbo) gl.deleteFramebuffer(velocity.write.fbo);
      if (pressure?.read?.texture) gl.deleteTexture(pressure.read.texture);
      if (pressure?.read?.fbo) gl.deleteFramebuffer(pressure.read.fbo);
      if (pressure?.write?.texture) gl.deleteTexture(pressure.write.texture);
      if (pressure?.write?.fbo) gl.deleteFramebuffer(pressure.write.fbo);
      if (divergence?.texture) gl.deleteTexture(divergence.texture);
      if (divergence?.fbo) gl.deleteFramebuffer(divergence.fbo);
      if (curl?.texture) gl.deleteTexture(curl.texture);
      if (curl?.fbo) gl.deleteFramebuffer(curl.fbo);
      if (bloom?.texture) gl.deleteTexture(bloom.texture);
      if (bloom?.fbo) gl.deleteFramebuffer(bloom.fbo);
      for (const b of bloomFramebuffers) {
        if (b?.texture) gl.deleteTexture(b.texture);
        if (b?.fbo) gl.deleteFramebuffer(b.fbo);
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  function generateColor() {
    const h = 0.5 + Math.random() * 0.42;
    const c = HSVtoRGB(h, 0.95, 1.0);
    c.r *= 0.92;
    c.g *= 0.92;
    c.b *= 0.92;
    return c;
  }

  function HSVtoRGB(h: number, s: number, v: number) {
    let r = 0,
      g = 0,
      b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return { r, g, b };
  }

  function getResolution(resolution: number) {
    const dbw = gl.drawingBufferWidth > 0 ? gl.drawingBufferWidth : (canvas.clientWidth || 1920);
    const dbh = gl.drawingBufferHeight > 0 ? gl.drawingBufferHeight : (canvas.clientHeight || 1080);
    let aspectRatio = dbw / dbh;
    if (!isFinite(aspectRatio) || isNaN(aspectRatio) || aspectRatio <= 0) {
      aspectRatio = 16 / 9;
    }
    if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
    const max = Math.max(2, Math.round(resolution * aspectRatio));
    const min = Math.max(2, Math.round(resolution));
    if (dbw > dbh) return { width: max, height: min };
    return { width: min, height: max };
  }
}
