"use client";

import { useRef, useEffect, useCallback } from "react";

interface AuroraBackgroundProps {
  /** Hour of day (0-23) to control sun direction */
  hour: number;
  /** Minute fraction (0-1) for smooth interpolation */
  minuteFraction?: number;
  /** Dark mode */
  dark?: boolean;
  className?: string;
}

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

// Atmospheric scattering shader inspired by motion-core/halo
// Simplified for performance as a background effect
const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uBackgroundColor;
  uniform float uRotationSpeed;
  uniform float uCameraDistance;
  uniform float uFov;
  uniform vec3 uSunDir;
  uniform float uIntensity;
  uniform float uHueShift;
  uniform vec3 uSunTint;

  const float PI = 3.14159265359;
  const float MAX_DIST = 10000.0;
  const float R_INNER = 1.0;
  const float R = 1.5;
  const int NUM_OUT_SCATTER = 5;
  const int NUM_IN_SCATTER = 20;

  vec2 raySphere(vec3 p, vec3 dir, float r) {
    float b = dot(p, dir);
    float c = dot(p, p) - r * r;
    float d = b * b - c;
    if (d < 0.0) return vec2(MAX_DIST, -MAX_DIST);
    d = sqrt(d);
    return vec2(-b - d, -b + d);
  }

  float phaseMie(float g, float c, float cc) {
    float gg = g * g;
    float a = (1.0 - gg) * (1.0 + cc);
    float b = 1.0 + gg - 2.0 * g * c;
    b *= sqrt(b);
    b *= 2.0 + gg;
    return (3.0 / 8.0 / PI) * a / b;
  }

  float phaseRay(float cc) {
    return (3.0 / 16.0 / PI) * (1.0 + cc);
  }

  float density(vec3 p, float ph) {
    return exp(-max(length(p) - R_INNER, 0.0) / ph);
  }

  float optic(vec3 p, vec3 q, float ph) {
    vec3 s = (q - p) / float(NUM_OUT_SCATTER);
    vec3 v = p + s * 0.5;
    float sum = 0.0;
    for (int i = 0; i < NUM_OUT_SCATTER; i++) {
      sum += density(v, ph);
      v += s;
    }
    return sum * length(s);
  }

  vec3 inScatter(vec3 o, vec3 dir, vec2 e, vec3 l) {
    const float phRay = 0.05;
    const float phMie = 0.02;
    const vec3 kRay = vec3(3.8, 13.5, 33.1);
    const vec3 kMie = vec3(21.0);
    const float kMieEx = 1.1;

    vec3 sumRay = vec3(0.0);
    vec3 sumMie = vec3(0.0);
    float nRay0 = 0.0;
    float nMie0 = 0.0;
    float len = (e.y - e.x) / float(NUM_IN_SCATTER);
    vec3 s = dir * len;
    vec3 v = o + dir * (e.x + len * 0.5);

    for (int i = 0; i < NUM_IN_SCATTER; i++) {
      float dRay = density(v, phRay) * len;
      float dMie = density(v, phMie) * len;
      nRay0 += dRay;
      nMie0 += dMie;

      vec2 f = raySphere(v, l, R);
      vec3 u = v + l * f.y;
      float nRay1 = optic(v, u, phRay);
      float nMie1 = optic(v, u, phMie);
      vec3 att = exp(-(nRay0 + nRay1) * kRay - (nMie0 + nMie1) * kMie * kMieEx);
      sumRay += dRay * att;
      sumMie += dMie * att;
      v += s;
    }

    float c = dot(dir, -l);
    float cc = c * c;
    return sumRay * kRay * phaseRay(cc) + sumMie * kMie * phaseMie(-0.78, c, cc);
  }

  mat3 rot3xy(vec2 angle) {
    vec2 c = cos(angle);
    vec2 s = sin(angle);
    return mat3(
      c.y,       0.0, -s.y,
      s.y * s.x, c.x,  c.y * s.x,
      s.y * c.x, -s.x, c.y * c.x
    );
  }

  vec3 rayDir(float fov, vec2 size, vec2 uv) {
    vec2 xy = uv * size - size * 0.5;
    float cotHalfFov = tan(radians(90.0 - fov * 0.5));
    float z = size.y * 0.5 * cotHalfFov;
    return normalize(vec3(xy, -z));
  }

  // RGB → HSV → shift hue → RGB for subtle color cycling
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec3 dir = rayDir(uFov, uResolution, vUv * uResolution);
    vec3 eye = vec3(0.0, 0.0, uCameraDistance);
    mat3 rot = rot3xy(vec2(0.0, uTime * uRotationSpeed));
    dir = rot * dir;
    eye = rot * eye;
    vec3 l = normalize(uSunDir);

    vec2 e = raySphere(eye, dir, R);
    if (e.x > e.y) {
      gl_FragColor = vec4(uBackgroundColor, 1.0);
      return;
    }

    vec2 f = raySphere(eye, dir, R_INNER);
    e.y = min(e.y, f.x);

    vec3 scatter = inScatter(eye, dir, e, l) * uIntensity * 10.0;

    // Apply subtle hue shift for living color
    vec3 scatterHsv = rgb2hsv(max(scatter, vec3(0.0001)));
    scatterHsv.x = fract(scatterHsv.x + uHueShift);
    scatter = hsv2rgb(scatterHsv);

    // Blend with background
    float lum = dot(scatter, vec3(0.2126, 0.7152, 0.0722));
    float softMask = 1.0 - exp(-1.2 * lum);
    float bgLum = dot(uBackgroundColor, vec3(0.2126, 0.7152, 0.0722));
    float lightBg = smoothstep(0.45, 0.95, bgLum);

    vec3 additive = uBackgroundColor + scatter;
    float maxC = max(max(scatter.r, scatter.g), scatter.b);
    vec3 hue = maxC > 0.00001 ? clamp(scatter / maxC, 0.0, 1.0) : vec3(1.0);
    vec3 tintTarget = mix(uBackgroundColor, hue, 0.85);
    vec3 tint = mix(uBackgroundColor, tintTarget, softMask);
    vec3 rgb = mix(additive, tint, lightBg);

    // Blend in sun tint (warm sunrise/sunset glow)
    float sunInfluence = softMask * (1.0 - lightBg);
    rgb = mix(rgb, rgb * uSunTint, sunInfluence * 0.4);

    gl_FragColor = vec4(rgb, 1.0);
  }
`;

// Map hour (0-23) to background color and sun direction
function getSceneParams(hour: number, minuteFraction: number, dark: boolean) {
  const t = hour + minuteFraction;

  // Sun direction: follows a circular path, sun below at night, above at day
  const sunAngle = ((t - 6) / 24) * Math.PI * 2; // 6am = sunrise
  const sunX = Math.sin(sunAngle) * 0.8;
  const sunY = Math.cos(sunAngle);
  const sunZ = 0.3;

  type ColorStop = [number, [number, number, number]];

  // Dark mode: deep space colors
  const darkColors: ColorStop[] = [
    [0, [0.01, 0.01, 0.04]],   // midnight — deep space
    [5, [0.02, 0.02, 0.06]],   // pre-dawn
    [6, [0.04, 0.03, 0.08]],   // dawn
    [7, [0.06, 0.05, 0.10]],   // sunrise
    [9, [0.05, 0.06, 0.12]],   // morning
    [12, [0.05, 0.07, 0.14]],  // noon — slightly brighter
    [16, [0.04, 0.06, 0.12]],  // afternoon
    [18, [0.04, 0.03, 0.09]],  // sunset
    [19, [0.03, 0.02, 0.07]],  // dusk
    [21, [0.02, 0.01, 0.05]],  // night
    [24, [0.01, 0.01, 0.04]],  // midnight wrap
  ];

  // Light mode: eggshell white
  const lightColors: ColorStop[] = [
    [0, [0.85, 0.83, 0.78]],
    [5, [0.88, 0.86, 0.80]],
    [6, [0.90, 0.88, 0.82]],
    [7, [0.92, 0.90, 0.83]],
    [9, [0.94, 0.92, 0.84]],
    [12, [0.95, 0.93, 0.85]],
    [16, [0.94, 0.92, 0.84]],
    [18, [0.92, 0.89, 0.82]],
    [19, [0.90, 0.87, 0.80]],
    [21, [0.87, 0.85, 0.79]],
    [24, [0.85, 0.83, 0.78]],
  ];

  const colors = dark ? darkColors : lightColors;

  // Interpolate colors
  let bg: [number, number, number] = colors[0][1];
  for (let i = 0; i < colors.length - 1; i++) {
    if (t >= colors[i][0] && t < colors[i + 1][0]) {
      const frac =
        (t - colors[i][0]) / (colors[i + 1][0] - colors[i][0]);
      bg = [
        colors[i][1][0] + (colors[i + 1][1][0] - colors[i][1][0]) * frac,
        colors[i][1][1] + (colors[i + 1][1][1] - colors[i][1][1]) * frac,
        colors[i][1][2] + (colors[i + 1][1][2] - colors[i][1][2]) * frac,
      ];
      break;
    }
  }

  // Intensity — more visible scattering in dark mode
  let intensity: number;
  if (dark) {
    intensity = 1.0;
    if (t >= 5 && t < 8) intensity = 1.6;
    else if (t >= 17 && t < 20) intensity = 1.4;
    else if (t >= 21 || t < 5) intensity = 0.8;
  } else {
    intensity = 0.5;
    if (t >= 5 && t < 8) intensity = 0.7;
    else if (t >= 17 && t < 20) intensity = 0.6;
    else if (t >= 21 || t < 5) intensity = 0.35;
  }

  return { sunX, sunY, sunZ, bg, intensity };
}

export function AuroraBackground({
  hour,
  minuteFraction = 0,
  dark = false,
  className,
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const paramsRef = useRef({ hour, minuteFraction, dark });

  paramsRef.current = { hour, minuteFraction, dark };

  const initGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return null;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fs));
      return null;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return null;
    }

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);

    // Cache uniform locations
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of [
      "uTime",
      "uResolution",
      "uBackgroundColor",
      "uRotationSpeed",
      "uCameraDistance",
      "uFov",
      "uSunDir",
      "uIntensity",
    ]) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    // Set static uniforms
    gl.uniform1f(uniforms.uCameraDistance, 3.5);
    gl.uniform1f(uniforms.uFov, 60.0);

    return { gl, program, uniforms };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const result = initGL(canvas);
    if (!result) return;

    const { gl, program, uniforms } = result;
    glRef.current = gl;
    programRef.current = program;
    uniformsRef.current = uniforms;
    startTimeRef.current = Date.now();

    function render() {
      const { hour: h, minuteFraction: mf, dark: d } = paramsRef.current;
      const params = getSceneParams(h, mf, d);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      // Resize canvas to match display
      const dpr = Math.min(window.devicePixelRatio, 1.5); // cap DPR for perf
      const w = canvas!.clientWidth * dpr;
      const h2 = canvas!.clientHeight * dpr;
      if (canvas!.width !== w || canvas!.height !== h2) {
        canvas!.width = w;
        canvas!.height = h2;
        gl.viewport(0, 0, w, h2);
      }

      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform2f(uniforms.uResolution, w, h2);
      gl.uniform3f(uniforms.uBackgroundColor, params.bg[0], params.bg[1], params.bg[2]);
      gl.uniform3f(uniforms.uSunDir, params.sunX, params.sunY, params.sunZ);

      // Breathing shimmer — subtle oscillation on intensity and rotation
      const breathe = Math.sin(elapsed * 0.15) * 0.12; // slow 40s cycle
      const drift = Math.sin(elapsed * 0.07) * 0.02;   // very slow drift
      gl.uniform1f(uniforms.uIntensity, params.intensity + breathe);
      gl.uniform1f(uniforms.uRotationSpeed, 0.08 + drift);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else {
        if (!rafRef.current) {
          startTimeRef.current = Date.now() - (Date.now() - startTimeRef.current);
          rafRef.current = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteProgram(program);
    };
  }, [initGL]);

  return (
    <canvas
      ref={canvasRef}
      role="presentation"
      aria-hidden="true"
      className={`pointer-events-none ${className ?? ""}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
