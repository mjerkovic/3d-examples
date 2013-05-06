function initScene(camera) {
    var scene = createScene();
    addLightsTo(scene);
    addGroundTo(scene);
    walls(scene);
    var compass = this.compass();
    camera.lookAt(compass.position);
    scene.add(compass);
    scene.add(building());
    scene.add(bouncingBall());
    crashing(scene);

    return scene;
}
function createScene() {
    var scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -30, 0));
    scene.addEventListener(
        'update',
        function () {
            scene.simulate(undefined, 1);
            //physics_stats.update();
        }
    );
    //scene.fog = new THREE.Fog(0xEEEEEE, 1, 100);
    return scene;
}

function bouncingBall() {
    var bouncingBallGeometry = new THREE.SphereGeometry(2, 32, 32);
    var bouncingMaterial = new Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }), .8, 1);
    var bouncingBall = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
//				bouncingMesh.position.set(50, 30, -10);
    bouncingBall.position.set(0.2, 100, 0);
    bouncingBall.addEventListener("collision", function(other, a, b) {
        //console.log("linearVelocity = " + a.toArray().join());
        //console.log("angularVelocity = " + b.toArray().join());
    });
    return bouncingBall;
}

function crashing(scene) {
    var bouncingBallGeometry = new THREE.SphereGeometry(2, 32, 32);
    var bouncingMaterial = new Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }), .2, 0.8);
    var crash1 = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
    crash1.position.set(50, 0, -3);
    crash1.velocity = 0.5;
    crash1.addEventListener("collision", function(other, linear, angular) {
        if (other == crash2) {
            crash1.velocity = 0;
        }
    });
    var crash2 = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
    crash2.position.set(100, 0, -3);
    crash2.velocity = 0.3;
    crash2.addEventListener("collision", function(other, linear, angular) {
        console.log("CRRAASSHH");
        if (other == crash1) {
            crash2.velocity = 0;
        }
    });
    var crash3 = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
    crash3.position.set(30, 0, -3);
    crash3.velocity = 0.3;
    crash3.addEventListener("collision", function(other, linear, angular) {
        console.log("Hit the wall");
    });
    scene.doIt = function() {
        crash1.translateX(crash1.velocity);
        crash1.__dirtyPosition = crash1.velocity > 0;
        crash2.position.x -= crash2.velocity;
        crash2.__dirtyPosition = crash2.velocity > 0;
        crash3.position.x -= crash3.velocity;
        crash3.__dirtyPosition = crash3.velocity > 0;
    };
    scene.add(crash1);
    scene.add(crash2);
    scene.add(crash3);
}

function addGroundTo(scene) {
    var groundGeometry = new THREE.CubeGeometry(1000, 1, 1000, 100, 1, 100);
    var groundMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
    groundMaterial.map.repeat.set( 10, 10 );
    var ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
    ground.receiveShadow = true;
    //ground.rotation.x = -90 * (Math.PI/180);
    ground.position.y = -2.5;
    ground.receiveShadow = true;
    scene.add( ground );
}

function building() {
    var buildingGeometry = new THREE.CubeGeometry(10, 10, 20);
    var building = new THREE.Mesh(buildingGeometry, new Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }), .8, 0.1));
    building.position.set(10, 5, -60);
    return building;
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

function walls(scene) {
    var wallGeometry = new THREE.CubeGeometry(5, 15, 5);
    var wallMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/wall-1.jpg' ) }));
    wallMaterial.map.wrapS = wallMaterial.map.wrapT = THREE.RepeatWrapping;
    wallMaterial.map.repeat.set( 1, 1 );
    var wall1 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall1.position.set(-5, 0.5, 0);
    scene.add(wall1);
    var wall2 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall2.position.set(-5, 0.5, -5);
    scene.add(wall2);
    var wall3 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall3.position.set(-5, 0.5, -10);
    scene.add(wall3);
    var wall4 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall4.position.set(0, 0.5, -10);
    scene.add(wall4);
    var wall5 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall5.position.set(5, 0.5, -10);
    scene.add(wall5);

}

function compass() {
    var globeGeometry = new THREE.SphereGeometry(2, 32, 32);
    //var material = new THREE.MeshPhongMaterial({ color: 0x25256F,
    //	specular: 0x20205F, shininess: 90 });
    var globeMaterial = new Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }), 0.8, 0.1);
    var globe = new Physijs.SphereMesh(globeGeometry, globeMaterial, 1);
    globe.position.set(0, 10, 0);

    var barGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 64, 64);
    var pointGeometry = new THREE.CylinderGeometry(0, 1, 1.5, 32, 32);

    var yBarGeometryMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0x33CC00 }), 0.8, 0.6);
    var m = new Physijs.CylinderMesh(barGeometry, yBarGeometryMaterial, 1);
    m.position.y = 5;
    //scene.add(m);
    var yPointMesh = new Physijs.CylinderMesh(pointGeometry, yBarGeometryMaterial, 1);
    yPointMesh.position.y = 10;
    //scene.add(yPointMesh);

    var yPointer = new THREE.Object3D();
    yPointer.add(m);
    yPointer.add(yPointMesh);
    //scene.add(yPointer);

    var xBarGeometryMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0xCC0000 }), 0.8, 0.6);
    var m2 = new Physijs.CylinderMesh(barGeometry, xBarGeometryMaterial, 1);
    m2.rotation.z = 90 * (Math.PI/180);
    m2.position.x = 5;
    //scene.add(m2);
    var xPointMesh = new Physijs.CylinderMesh(pointGeometry, xBarGeometryMaterial, 1);
    xPointMesh.rotation.z = -90 * (Math.PI/180);
    xPointMesh.position.x = 10;
    //scene.add(xPointMesh);

    var xPointer = new THREE.Object3D();
    xPointer.add(m2);
    xPointer.add(xPointMesh);
    //scene.add(xPointer);

    var zBarGeometryMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0x0033CC }), 0.8, 0.6);
    var m3 = new Physijs.CylinderMesh(barGeometry, zBarGeometryMaterial, 1);
    m3.rotation.x = 90 * (Math.PI/180);
    m3.position.z = 5;
    //scene.add(m3);
    var zPointMesh = new Physijs.CylinderMesh(pointGeometry, zBarGeometryMaterial, 1);
    zPointMesh.rotation.x = 90 * (Math.PI/180);
    zPointMesh.position.z = 10;
    //scene.add(zPointMesh);

    var zPointer = new THREE.Object3D();
    zPointer.add(m3);
    zPointer.add(zPointMesh);
    //scene.add(zPointer);

    globe.add(xPointer);
    globe.add(yPointer);
    globe.add(zPointer);
    return globe;
}
