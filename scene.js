function initScene(camera) {
    var scene = createScene();
    addLightsTo(scene);
    addGroundTo(scene);
    //walls(scene);
    var compass = this.compass();
    camera.lookAt(compass.position);
    scene.add(compass);
    scene.add(building());
    scene.add(bouncingBall());
    var gun1 = gun(new THREE.Vector3(15, 0, 1.5), "gun1");
    world.objects.push(gun1);
    scene.add(gun1);
    var gun2 = gun(new THREE.Vector3(10, 9, -51), "gun2");
    gun2.firingSound = cannonSound();
    gun2.lastFired = Date.now();
    gun2.update = function() {
        trackTarget(this);
        var now = Date.now();
        if (now - this.lastFired > 3000) {
            this.firingSound.volume = Math.min(Math.max(0, (10 / this.position.distanceTo(camera.position))), 1);
            console.log(this.firingSound.volume);
            this.firingSound.play();
            this.lastFired = now;
        }
    };
    world.objects.push(gun2);
    scene.add(gun2);
    crashing(scene);
    return scene;
}

function shootBullet() {
    var gun = scene.getObjectByName("gun1", true);
    var bullet = this.bullet(gun);
    bullet.owner = gun;
    var vectorToTarget = new THREE.Vector3().subVectors(camera.position, gun.position).normalize();
    var angle = Math.acos(vectorToTarget.dot(new THREE.Vector3(0,0,1).normalize()));
    var axis = new THREE.Vector3().crossVectors(vectorToTarget, new THREE.Vector3(0, 0, 1)).normalize().negate();
    var translate = new THREE.Matrix4().makeTranslation(gun.position.x, gun.position.y + 1, gun.position.z);
    var rotate = new THREE.Matrix4().makeRotationAxis(axis, angle);
    var matrix = new THREE.Matrix4().multiplyMatrices(translate, rotate);
    bullet.heading = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix).normalize();
    bullet.matrix = matrix;
    world.objects.push(bullet);
    scene.add(bullet);
}

function bullet(shooter) {
    var bulletGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 32, 16);
    var bulletMaterial = new THREE.MeshPhongMaterial({
        color: 0xF7A30B, specular: 0x111111, shininess: 90
    });
    var bullet = new THREE.Mesh(bulletGeom, bulletMaterial);
    bullet.rotation.x = 1.57;
    var theBullet = new THREE.Object3D();
    theBullet.add(bullet);
    theBullet.matrixAutoUpdate = false;
    theBullet.update = function() {
        if (new THREE.Vector3().distanceTo(bullet.position) > 20) {
            world.objects.splice(world.objects.indexOf(theBullet), 1);
            scene.remove(theBullet);
        }
        bullet.position.z += 0.1;
    };
    return theBullet;
}

function cannonSound() {
    var sound = new Audio("sounds/cannon.mp3");
    sound.addEventListener("ended", function () {
        sound.currentTime = 0;
    }, false);
    return sound;
}

function trackTarget(gun) {
    var vectorToTarget = new THREE.Vector3().subVectors(camera.position, gun.position).normalize();
    var angle = Math.acos(vectorToTarget.dot(new THREE.Vector3(0, 0, 1).normalize()));
    var translate = new THREE.Matrix4().makeTranslation(0, 1, 0);
    var axis = new THREE.Vector3().crossVectors(vectorToTarget,
        new THREE.Vector3(0, 0, 1)).normalize().negate();
    var rotate = new THREE.Matrix4().makeRotationAxis(axis, angle);
    var matrix = new THREE.Matrix4().multiplyMatrices(translate, rotate);
    var turret = gun.getObjectByName("turret");
    turret.matrix = matrix;
    turret.updateMatrixWorld(true);
}

function gun(position, name) {
    var turretGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 32, 16);
    var turretMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: 0x000000, specular: 0x866C6C,
        shininess: 30, opacity: 1, wireframe: true
    }), 1, 1);
    var turret = new Physijs.CylinderMesh(turretGeom, turretMaterial, 1000);
    turret.position.z = 1.5;
    turret.rotation.x = 1.57;

    var barrelGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 32, 16);
    var barrelMaterial = new Physijs.createMaterial(
        new THREE.MeshBasicMaterial({color: 0x0, wireframe: true  }), 1, 1);
    var barrel = new Physijs.CylinderMesh(barrelGeom, barrelMaterial, 1000);
    barrel.position.z = 1.51;
    barrel.rotation.x = 1.57;
    barrel.name = "barrel";

    var ballGeom = new THREE.SphereGeometry(1, 32, 16);
    var ballMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: 0x000000, specular: 0x866C6C,
        shininess: 30, opacity: 1, wireframe: true
    }), 1, 1);
    var ball = new Physijs.SphereMesh(ballGeom, ballMaterial, 1000);
    ball.name = "turret";
    ball.matrixAutoUpdate = false;
    ball.add(turret);
    ball.add(barrel);

    var baseGeom = new THREE.CylinderGeometry(0, 1, 2, 32, 16);
    var baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x3344E8, specular: 0x111111,
        shininess: 30, opacity: 1, wireframe: true
    });
    baseMesh = new THREE.Mesh(baseGeom, baseMaterial);
    baseMesh.add(ball);
    baseMesh.name = name;
    baseMesh.position.copy(position);
    baseMesh.update = function() {
        trackTarget(this);
    };
    return baseMesh;
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
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ), wireframe: true }),
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
    building.position.set(10, 3, -60);
    return building;
}

function addLightsTo(scene) {
    var ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add(ambientLight);
    var hemisphere = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.6);
    scene.add(hemisphere);
    var pointLight = new THREE.DirectionalLight(0xFFFFFF, 1.5, 50);
    pointLight.position.set(100,10,0);
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
