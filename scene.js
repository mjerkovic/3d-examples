function initScene() {
    var scene = createScene();
    addLightsTo(scene);
    addGroundTo(scene);
    scene.add(compass());
    scene.add(building());
    scene.add(bouncingBall());

    return scene;
}
function createScene() {
    var scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -9.82, 0));
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
    bouncingBall.position.set(0, 100, 0);
    bouncingBall.addEventListener("collision", function(other, a, b) {
        console.log("linearVelocity = " + a.toArray().join());
        console.log("angularVelocity = " + b.toArray().join());
    });
    return bouncingBall;
}

function addGroundTo(scene) {
    var groundGeometry = new THREE.PlaneGeometry(1000,1000,100,100);
    var groundMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
    groundMaterial.map.repeat.set( 10, 10 );
    var ground = new Physijs.PlaneMesh(groundGeometry, groundMaterial, 0);
    ground.receiveShadow = true;
    ground.rotation.x = -90 * (Math.PI/180);
    ground.position.y = -2;
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

function compass() {
    var globeGeometry = new THREE.SphereGeometry(2, 32, 32);
    //var material = new THREE.MeshPhongMaterial({ color: 0x25256F,
    //	specular: 0x20205F, shininess: 90 });
    var globeMaterial = new Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }), .8, 0.1);
    //material.ambient.setRGB(material.color.r*0.4, material.color.g*0.4,
    //	material.color.b*0.4);
    var globe = new Physijs.SphereMesh(globeGeometry, globeMaterial, 1);
    globe.position.set(0, 10, 0);

    var barGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 64, 64);
    var pointGeometry = new THREE.CylinderGeometry(0, 1, 1.5, 32, 32);

    var yBarGeometryMaterial = new THREE.MeshLambertMaterial({ color: 0x33CC00 });
    var m = new THREE.Mesh(barGeometry, yBarGeometryMaterial);
    m.position.y = 5;
    //scene.add(m);
    var yPointMesh = new THREE.Mesh(pointGeometry, yBarGeometryMaterial);
    yPointMesh.position.y = 10;
    //scene.add(yPointMesh);

    var yPointer = new THREE.Object3D();
    yPointer.add(m);
    yPointer.add(yPointMesh);
    //scene.add(yPointer);

    var xBarGeometryMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var m2 = new THREE.Mesh(barGeometry, xBarGeometryMaterial);
    m2.rotation.z = 90 * (Math.PI/180);
    m2.position.x = 5;
    //scene.add(m2);
    var xPointMesh = new THREE.Mesh(pointGeometry, xBarGeometryMaterial);
    xPointMesh.rotation.z = -90 * (Math.PI/180);
    xPointMesh.position.x = 10;
    //scene.add(xPointMesh);

    var xPointer = new THREE.Object3D();
    xPointer.add(m2);
    xPointer.add(xPointMesh);
    //scene.add(xPointer);

    var zBarGeometryMaterial = new THREE.MeshLambertMaterial({ color: 0x0033CC });
    var m3 = new THREE.Mesh(barGeometry, zBarGeometryMaterial);
    m3.rotation.x = 90 * (Math.PI/180);
    m3.position.z = 5;
    //scene.add(m3);
    var zPointMesh = new THREE.Mesh(pointGeometry, zBarGeometryMaterial);
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
