(function () {
  const canvas = document.getElementById('glCanvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.background = '#070e1a'; return; }

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);

  const VS = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

  const FS = `
precision mediump float;
uniform float T;
uniform vec2  R;
uniform float THR;
uniform float SAFE;

float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);
}

void main(){
  vec2 uv=(gl_FragCoord.xy/R)*2.-1.;
  uv.x*=R.x/R.y;
  float t=T*0.25;

  vec3 baseBlue  = vec3(0.027,0.055,0.1);
  vec3 baseGreen = vec3(0.02, 0.08, 0.03);
  vec3 baseRed   = vec3(0.055,0.02, 0.02);
  vec3 col = mix(mix(baseBlue, baseGreen, SAFE), baseRed, THR);

  for(int i=0;i<8;i++){
    float fi=float(i);
    vec2 q=uv+vec2(sin(t*0.55+fi*1.35),cos(t*0.42+fi*1.05))*0.3;
    float no=n(q*3.+t*0.15);
    float r=length(q*0.9)-(0.1+fi*0.062+sin(t+fi*0.85)*0.022);
    float ring=smoothstep(0.02,0.,abs(r)-no*0.03);
    vec3 ringBlue  = vec3(0.04,0.19,0.44);
    vec3 ringGreen = vec3(0.04,0.45,0.18);
    vec3 ringRed   = vec3(0.5, 0.07,0.07);
    col+=ring*mix(mix(ringBlue, ringGreen, SAFE), ringRed, THR)*0.58;
  }

  vec2 gv=fract(uv*10.+t*0.035)-.5;
  float g=0.;
  g+=smoothstep(0.015,0.,abs(gv.x)-0.49)*0.055;
  g+=smoothstep(0.015,0.,abs(gv.y)-0.49)*0.055;
  vec3 gridBlue  = vec3(0.04,0.16,0.34);
  vec3 gridGreen = vec3(0.03,0.3, 0.1);
  vec3 gridRed   = vec3(0.3, 0.04,0.04);
  col+=mix(mix(gridBlue, gridGreen, SAFE), gridRed, THR)*g;

  for(int j=0;j<18;j++){
    float fj=float(j);
    vec2 pp=vec2((h(vec2(fj,0.))*2.-1.)*(R.x/R.y),fract(h(vec2(fj,1.))-t*(0.1+h(vec2(fj,2.))*0.18))*2.-1.);
    float d=length(uv-pp);
    vec3 partBlue  = vec3(0.08,0.44,0.88);
    vec3 partGreen = vec3(0.08,0.88,0.35);
    vec3 partRed   = vec3(0.88,0.16,0.16);
    col+=smoothstep(0.026,0.,d)*mix(mix(partBlue, partGreen, SAFE), partRed, THR)*0.52;
  }

  for(int k=0;k<6;k++){
    float fk=float(k);
    float xo=(h(vec2(fk,5.))*2.-1.)*(R.x/R.y);
    float yp=fract(h(vec2(fk,6.))+t*(0.2+h(vec2(fk,7.))*0.28))*2.-1.;
    float dx=abs(uv.x-xo);
    float dy=abs(uv.y-yp);
    vec3 streamBlue  = vec3(0.12,0.55,1.);
    vec3 streamGreen = vec3(0.1, 0.9, 0.35);
    vec3 streamRed   = vec3(1.,  0.22,0.22);
    col+=smoothstep(0.004,0.,dx)*smoothstep(0.07,0.,dy)*mix(mix(streamBlue, streamGreen, SAFE), streamRed, THR)*0.38;
  }

  col*=1.-smoothstep(0.4,1.45,length(uv*vec2(0.62,0.82)));
  gl_FragColor=vec4(col,1.);
}`;

  function mk(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  const uT    = gl.getUniformLocation(prog, 'T');
  const uR    = gl.getUniformLocation(prog, 'R');
  const uTHR  = gl.getUniformLocation(prog, 'THR');
  const uSAFE = gl.getUniformLocation(prog, 'SAFE');

  window.glThreat = { current: 0, target: 0 };
  window.glSafe   = { current: 0, target: 0 };
  const t0 = performance.now();

  (function loop() {
    window.glThreat.current += (window.glThreat.target - window.glThreat.current) * 0.022;
    window.glSafe.current   += (window.glSafe.target   - window.glSafe.current)   * 0.022;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uT,    (performance.now() - t0) / 1000);
    gl.uniform2f(uR,    canvas.width, canvas.height);
    gl.uniform1f(uTHR,  window.glThreat.current);
    gl.uniform1f(uSAFE, window.glSafe.current);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(loop);
  })();
})();
