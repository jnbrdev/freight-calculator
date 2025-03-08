let scene, camera, renderer, labelRenderer, box, dimensions, controls;

function initThreeJS() {
    scene = new THREE.Scene();

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(6, 6, 6);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visualization').appendChild(renderer.domElement);

    // Label renderer
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    document.getElementById('visualization').appendChild(labelRenderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Create box
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0x3498db,
        transparent: true,
        opacity: 0.8
    });
    box = new THREE.Mesh(geometry, material);
    scene.add(box);

    // Initialize dimensions
    updateBoxDimensions(100, 100, 100);

    // OrbitControls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = MIN_ZOOM;
    controls.maxDistance = MAX_ZOOM;
    controls.enablePan = false;


    document.getElementById('zoomOut').addEventListener('click', () => handleZoom(-1));
    document.getElementById('zoomIn').addEventListener('click', () => handleZoom(1));
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }
    animate();

    // Window resize handler
    window.addEventListener('resize', onWindowResize, false);
}

function createDimensionLabel(text, position) {
    const div = document.createElement('div');
    div.className = 'dimension-label';
    div.textContent = text;
    const label = new THREE.CSS2DObject(div);
    label.position.set(position.x, position.y, position.z);
    return label;
}

function updateBoxDimensions(length, width, height) {
    // Remove old dimensions
    if (dimensions) {
        dimensions.lines.forEach(line => scene.remove(line));
        dimensions.labels.forEach(label => scene.remove(label));
    }

    // Convert cm to meters
    const l = length / 100;  // X-axis
    const w = width / 100;   // Z-axis (now width)
    const h = height / 100;  // Y-axis (vertical height)

    // Swap Y and Z axes for scaling
    box.scale.set(l, h, w);  // X, Y, Z -> length, height, width

    // Create dimension lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });

    // Length line (X-axis)
    const lengthLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-l / 2, -h / 2, -w / 2),
            new THREE.Vector3(l / 2, -h / 2, -w / 2)
        ]),
        lineMaterial
    );

    // Width line (Z-axis)
    const widthLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-l / 2, -h / 2, -w / 2),
            new THREE.Vector3(-l / 2, -h / 2, w / 2)
        ]),
        lineMaterial
    );

    // Height line (Y-axis)
    const heightLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-l / 2, -h / 2, -w / 2),
            new THREE.Vector3(-l / 2, h / 2, -w / 2)
        ]),
        lineMaterial
    );

    // Create labels (positions updated for new axes)
    const lengthLabel = createDimensionLabel(`L=${length}cm`, new THREE.Vector3(l / 2 + 0.1, -h / 2, -w / 2));
    const widthLabel = createDimensionLabel(`W=${width}cm`, new THREE.Vector3(-l / 2, -h / 2, w / 2 + 0.1));
    const heightLabel = createDimensionLabel(`H=${height}cm`, new THREE.Vector3(-l / 2, h / 2 + 0.1, -w / 2));

    // Add to scene
    scene.add(lengthLine, widthLine, heightLine);
    scene.add(lengthLabel, widthLabel, heightLabel);

    dimensions = {
        lines: [lengthLine, widthLine, heightLine],
        labels: [lengthLabel, widthLabel, heightLabel]
    };
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function calculateFreight() {
    const length = parseFloat(document.getElementById('length').value) || 0;
    const width = parseFloat(document.getElementById('width').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    const weight = parseFloat(document.getElementById('weight').value) || 0;

    updateBoxDimensions(length, width, height);

    const volume = length * width * height;
    const volumetricWeight = volume / 5000;
    const chargeableWeight = Math.max(volumetricWeight, weight);
    const cost = chargeableWeight * 5;

    document.getElementById('result').innerHTML = `
        <div style="position: relative;">
            
            <div class="tooltip">
                <div class="">
                    <strong>Calculations:</strong><br>
                     Volume = ${volume.toFixed(2)} cm³<br>
                     Volume Weight = ${volumetricWeight.toFixed(2)} kg<br>
                     Actual Weight = ${weight.toFixed(2)} kg
                </div>
            </div>
            <p style="font-weight: bold; margin-top: 15px; color: #2ecc71;">Total Cost: $${cost.toFixed(2)}</p>
        </div>
    `;
}
// Update zoom constants
const ZOOM_SPEED = 0.5;
const MIN_ZOOM = 3;
const MAX_ZOOM = 15;

function handleZoom(direction) {
    // Calculate zoom direction
    const delta = direction * ZOOM_SPEED;

    // Get camera's current distance from center
    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));

    // Calculate new distance
    const newDistance = cameraDistance - delta; // Subtract because moving towards center

    // Apply constraints
    if (newDistance >= MIN_ZOOM && newDistance <= MAX_ZOOM) {
        // Move camera along current direction vector
        const direction = new THREE.Vector3()
            .subVectors(new THREE.Vector3(0, 0, 0), camera.position)
            .normalize();

        camera.position.addScaledVector(direction, delta);
        controls.update();
    }
}

// In your OrbitControls initialization:


window.onload = initThreeJS;
