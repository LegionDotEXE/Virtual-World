// World.js
// Main file - shaders, setup, render loop, input handlers

    // Vertex shader
    var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_UV;\n' +
    'varying vec2 v_UV;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjectionMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '  v_UV = a_UV;\n' +
    '}\n';

    // Fragment shader
    var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec2 v_UV;\n' +
    'uniform vec4 u_FragColor;\n' +
    'uniform sampler2D u_Sampler0;\n' +
    'uniform sampler2D u_Sampler1;\n' +
    'uniform sampler2D u_Sampler2;\n' +
    'uniform sampler2D u_Sampler3;\n' +
    'uniform sampler2D u_Sampler4;\n' +
    'uniform int u_whichTexture;\n' +
    'void main() {\n' +
    '  if (u_whichTexture == -1) {\n' +
    '    gl_FragColor = u_FragColor;\n' +             // solid color
    '  } else if (u_whichTexture == 0) {\n' +
    '    gl_FragColor = texture2D(u_Sampler0, v_UV);\n' + // grass
    '  } else if (u_whichTexture == 1) {\n' +
    '    gl_FragColor = texture2D(u_Sampler1, v_UV);\n' + // wall
    '  } else if (u_whichTexture == 2) {\n' +
    '    gl_FragColor = texture2D(u_Sampler2, v_UV);\n' + // stone
    '  } else if (u_whichTexture == 3) {\n' +
    '    gl_FragColor = texture2D(u_Sampler3, v_UV);\n' + // sky
    '  } else if (u_whichTexture == 4) {\n' +
    '    gl_FragColor = texture2D(u_Sampler4, v_UV);\n' + // sand
    '  } else {\n' +
    '    gl_FragColor = vec4(1, 0.2, 0.2, 1);\n' +   // error red
    '  }\n' +
    '}\n';

    // WebGL globals
    let canvas;
    let gl;
    let a_Position;
    let a_UV;
    let u_FragColor;
    let u_ModelMatrix;
    let u_ViewMatrix;
    let u_ProjectionMatrix;
    let u_whichTexture;
    let u_Sampler0;
    let u_Sampler1;
    let u_Sampler2;
    let u_Sampler3;
    let u_Sampler4;

    // Camera
    var camera;

    // Goat
    var g_goat;
    var g_babyGoat;
    var g_foundKid = false;

    // Time
    var g_startTime = performance.now() / 1000.0;
    var g_seconds = 0;

    // Mouse
    var g_mouseDown = false;
    var g_lastMouseX = 0;
    var g_lastMouseY = 0;

    function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get WebGL context');
        return;
    }
    gl.enable(gl.DEPTH_TEST);

    // resize canvas to fill window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
    }

    // --- Texture Loading ---

    function initTextures() {
    // load each texture into its own texture unit
    loadTexture('textures/grass.png', 0);
    loadTexture('textures/wall.png', 1);
    loadTexture('textures/stone.png', 2);
    loadTexture('textures/sky.png', 3);
    loadTexture('textures/sand.png', 4);
    }

    function loadTexture(path, texUnit) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create texture object for ' + path);
        return;
    }

    var image = new Image();
    image.onload = function() {
        // flip image y axis
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

        // activate the right texture unit
        gl.activeTexture(gl.TEXTURE0 + texUnit);

        // bind the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // send image to GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // tell the shader which sampler to use
        if (texUnit == 0) gl.uniform1i(u_Sampler0, 0);
        if (texUnit == 1) gl.uniform1i(u_Sampler1, 1);
        if (texUnit == 2) gl.uniform1i(u_Sampler2, 2);
        if (texUnit == 3) gl.uniform1i(u_Sampler3, 3);
        if (texUnit == 4) gl.uniform1i(u_Sampler4, 4);

        console.log('Loaded texture: ' + path);
    };
    image.src = path;
    }

    // --- Keyboard Input ---

    function setupKeyHandlers() {
    document.onkeydown = function(ev) {
        switch(ev.key) {
        case 'w': case 'W': camera.moveForward();  break;
        case 's': case 'S': camera.moveBackwards(); break;
        case 'a': case 'A': camera.moveLeft();      break;
        case 'd': case 'D': camera.moveRight();     break;
        case 'q': case 'Q': camera.panLeft();       break;
        case 'e': case 'E': camera.panRight();      break;
        }
    };
    }

    // --- Mouse Input ---

    function setupMouseHandlers() {
    canvas.onmousedown = function(ev) {
        // shift+click to remove block, regular click to add block
        if (ev.shiftKey) {
        removeBlock();
        } else {
        addBlock();
        }
        // also start mouse look
        g_mouseDown = true;
        g_lastMouseX = ev.clientX;
        g_lastMouseY = ev.clientY;
    };

    canvas.onmouseup = function(ev) {
        g_mouseDown = false;
    };

    canvas.onmousemove = function(ev) {
        if (!g_mouseDown) return;
        var dx = ev.clientX - g_lastMouseX;
        var dy = ev.clientY - g_lastMouseY;

        // rotate camera based on mouse movement
        camera.panLeft(dx * 0.2);
        camera.panUp(dy * 0.2);

        g_lastMouseX = ev.clientX;
        g_lastMouseY = ev.clientY;
    };

    // also support pointer lock for smoother mouse look
    canvas.onclick = function() {
        canvas.requestPointerLock();
    };

    document.addEventListener('pointerlockchange', function() {
        if (document.pointerLockElement === canvas) {
        document.onmousemove = function(ev) {
            camera.panLeft(ev.movementX * 0.15);
            camera.panUp(ev.movementY * 0.15);
        };
        } else {
        document.onmousemove = null;
        }
    });
    }

    // --- Add/Delete Blocks ---

    function getBlockInFront() {
    // figure out which map cell is right in front of the camera
    var f = new Vector3();
    f.set(camera.at);
    f.sub(camera.eye);
    f.normalize();
    f.mul(2); // look 2 units ahead

    var targetX = Math.floor(camera.eye.elements[0] + f.elements[0] + 16);
    var targetZ = Math.floor(camera.eye.elements[2] + f.elements[2] + 16);

    // clamp to map bounds
    targetX = Math.max(0, Math.min(31, targetX));
    targetZ = Math.max(0, Math.min(31, targetZ));

    return [targetX, targetZ];
    }

    function addBlock() {
    var pos = getBlockInFront();
    var x = pos[0];
    var z = pos[1];
    if (g_map[x][z] < 4) {
        g_map[x][z] += 1;
    }
    }

    function removeBlock() {
    var pos = getBlockInFront();
    var x = pos[0];
    var z = pos[1];
    if (g_map[x][z] > 0) {
        g_map[x][z] -= 1;
    }
    }

    // --- Story: Check if player found the kid ---

    function checkStory() {
    var px = Math.floor(camera.eye.elements[0] + 16);
    var pz = Math.floor(camera.eye.elements[2] + 16);

    var kx = g_kidLocation[0];
    var kz = g_kidLocation[1];

    var dist = Math.sqrt((px - kx) * (px - kx) + (pz - kz) * (pz - kz));

    if (dist < 2 && !g_foundKid) {
        g_foundKid = true;
        document.getElementById('story').innerHTML = "You found the Lost Kid!";

        // fade out message after 3 seconds
        setTimeout(function() {
        document.getElementById('story').innerHTML = "";
        }, 3000);
    }
    }

    // --- Render Scene ---

    function renderScene() {
    var startTime = performance.now();

    // pass camera matrices to shader
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- Sky ---
    var sky = new Cube();
    sky.color = [0.5, 0.7, 1.0, 1.0];
    sky.textureNum = 3; // sky texture
    sky.matrix.setTranslate(-50, -50, -50);
    sky.matrix.scale(100, 100, 100);
    sky.render();

    // --- Ground ---
    var ground = new Cube();
    ground.color = [0.4, 0.8, 0.3, 1.0];
    ground.textureNum = 0; // grass texture
    ground.matrix.setTranslate(-16, -0.01, -16);
    ground.matrix.scale(32, 0, 32);
    ground.render();

    // --- Sand path under ground (second ground layer) ---
    var sand = new Cube();
    sand.color = [0.9, 0.85, 0.6, 1.0];
    sand.textureNum = 4; // sand texture
    sand.matrix.setTranslate(-16, -0.02, -16);
    sand.matrix.scale(32, 0, 32);
    sand.render();

    // --- Walls from map ---
    drawMap();

    // --- Golden block (the lost kid marker) ---
    if (!g_foundKid) {
        var marker = new Cube();
        marker.color = [1.0, 0.85, 0.0, 1.0];
        marker.textureNum = -1; // solid gold color
        marker.matrix.setTranslate(g_kidLocation[0] - 16, 0, g_kidLocation[1] - 16);
        marker.matrix.scale(0.5, 0.5, 0.5);
        // make it bob up and down
        marker.matrix.translate(0, 0.3 + 0.2 * Math.sin(g_seconds * 3), 0);
        marker.render();
    }

    // --- Mother Goat ---
    g_goat.updateAnimation(g_seconds);
    g_goat.render();

    // --- Baby Goat (appears after found) ---
    if (g_foundKid) {
        g_babyGoat.updateAnimation(g_seconds);
        g_babyGoat.render();
    }

    // check story progress
    checkStory();

    // Performance display
    var duration = performance.now() - startTime;
    sendTextToHTML("ms: " + Math.floor(duration) + "  fps: " + Math.floor(1000 / duration), "perf");
    }

    function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) return;
    htmlElm.innerHTML = text;
    }

    // --- Animation Loop ---

    function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    renderScene();
    requestAnimationFrame(tick);
    }

    // --- Main ---

    function main() {
    setupWebGL();
    connectVariablesToGLSL();

    initTextures();

    setupKeyHandlers();
    setupMouseHandlers();

    // create camera - start position in the open area
    camera = new Camera();
    camera.eye = new Vector3([2, 0.5, 2]);
    camera.at = new Vector3([2, 0.5, 1]);
    camera.updateView();

    // create mother goat - placed in the world
    g_goat = new Goat();
    g_goat.position = [5, 0.35, -5];
    g_goat.rotation = 45;
    g_goat.scale = 2.0;

    // create baby goat - hidden until found
    g_babyGoat = new Goat();
    g_babyGoat.position = [5.5, 0.2, -4.5];
    g_babyGoat.rotation = 30;
    g_babyGoat.scale = 1.0;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    tick();
    }

    main();