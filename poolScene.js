function initScene(camera) {
    var scene = createScene();
    addLightsTo(scene);
    addGroundTo(scene);
    addBallTo(scene);
    return scene;
}
function createScene() {
    var scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -30, 0));
    scene.addEventListener(
        'update',
        function () {
            scene.simulate(undefined, 1);
        }
    );
    var loader = new THREE.JSONLoader();
    loader.load('scene.json', function(geom) {
        debugger;
        console.log(geom);
    });
    return scene;
}

function addGroundTo(scene) {
    var groundGeometry1 = new THREE.CubeGeometry(30, 10, 50, 3, 1, 5);
    var groundGeometry2 = new THREE.CubeGeometry(50, 10, 15, 5, 1, 3);
    var groundGeometry3 = new THREE.CubeGeometry(30, 10, 20, 3, 1, 2);
    var groundGeometry4 = new THREE.CubeGeometry(50, 10, 15, 5, 1, 3);
    var groundMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/wall-1.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
    scene.add(createGround(groundGeometry1, groundMaterial, -25, 0));
    scene.add(createGround(groundGeometry2, groundMaterial, 15, 17.5));
    scene.add(createGround(groundGeometry3, groundMaterial, 25, 0));
    scene.add(createGround(groundGeometry4, groundMaterial, 15, -17.5));

    var bodyMaterial = new THREE.MeshPhongMaterial( { shininess: 75, opacity: 0.9, transparent: true } );
    bodyMaterial.color.setRGB( 31/255, 86/255, 169/255 );
    bodyMaterial.specular.setRGB( 0.5, 0.5, 0.5 );
    var waterGeometry = new THREE.CubeGeometry(20, 3, 20, 2, 1, 2);
    var water = new Physijs.BoxMesh(waterGeometry, bodyMaterial, 0);
    water.position.y = -4.5;
    scene.add(water);
}

function createGround(geom, material, x, z) {
    var ground = new Physijs.BoxMesh(geom, material, 0);
    ground.receiveShadow = true;
    ground.position.set(x, -6, z);
    ground.receiveShadow = true;
    return ground;
}

function addLightsTo(scene) {
    var ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add(ambientLight);
    var hemisphere = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.6);
    scene.add(hemisphere);
    var pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 50);
    pointLight.position.set(0,10,0);
    scene.add(pointLight);
    //var pointLight2= new THREE.DirectionalLight(0xFFFFFF, 1.5);// , 90);
    //pointLight2.position.set(50, 0, 0);
    //scene.add(pointLight2);
    //var spotLight = new THREE.SpotLight( 0xffffff );
    //spotLight.position.set( 0, 100, 0 );
    //spotLight.castShadow = true;
    //scene.add(spotLight);
    //var light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    // light.position.set( 0, 50, 10 );
    //scene.add(light);
}

function addBallTo(scene) {
    var bouncingBallGeometry = new THREE.SphereGeometry(2, 32, 32);
    var bouncingMaterial = new Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }), .2, 0.8);
    var crash1 = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
    crash1.position.set(-30, 5, 0);
    //crash1.velocity = 0.5;
    scene.doIt = function() {
        //crash1.position.x += crash1.velocity;
        //crash1.__dirtyPosition = true;
    };
    scene.add(crash1);
}