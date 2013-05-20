function initScene(camera) {
    var scene = createScene();
    geometries = new Geometries();
    addPlayer(scene, camera);
    addLightsTo(scene);
    addGroundTo(scene);
    addSpinnerTo(scene);
    //walls(scene);
    scene.add(this.compass());
    scene.add(building());
    scene.add(bouncingBall());
    crashing(scene);
    var gunFactory = new GunFactory();
    var bulletFactory = new BulletFactory();
    var gun1 = gunFactory.createGun({ scene: scene, position: new THREE.Vector3(15, 1, 1.5), name: "gun1", bulletFactory: bulletFactory });
    var gun2 = gunFactory.createGun({ scene: scene, position: new THREE.Vector3(10, 11, -51), name: "gun2", bulletFactory: bulletFactory });
    world.objects.push(gun1, gun2);
    world.objects.push(createJeep({ scene: scene, x: 10, z: 2, move: 0.1, rot: 1.57 }));
    world.objects.push(createJeep({ scene: scene, x: 50, z: 2, move: -0.1, rot: -1.57 }));
    return scene;
}

function addSpinnerTo(scene) {
    var spinGeom = new THREE.CylinderGeometry(0.1, 0.6, 20, 32, 16);
    var spinMat = new THREE.MeshPhongMaterial({ color: 0x25256F,
        specular: 0x20205F, shininess: 90, opacity: 0.5, transparent: true });
    var spinMesh = new THREE.Mesh(spinGeom, spinMat);
    spinMesh.rotation.x = 1.57;
    var spinner = new THREE.Object3D();
    spinner.add(spinMesh);
    spinner.position.set(0, 5, 10);
    scene.add(spinner);
    var angle = 0;
    var Spinner = function() {
        this.update = function(delta) {
            angle += 1.57
            angle *= delta;
            angle = angle  % (Math.PI *2);
            spinner.rotation.y += angle;
            console.log(spinner.rotation.y);
        }
    };
    Spinner.prototype = new GameEntity();
    world.objects.push(new Spinner());
}

function addPlayer(scene, f) {
    var Player = function() {
        var playerBody = geometries.createJeepGeometry();
        var playerObject = new THREE.Object3D();
        playerObject.add(playerBody);
        playerObject.position.x = 0;
        playerObject.position.z = 50;
        scene.add(playerObject);
        var forward = false;
        var left = false;
        var right = false;
        var movementSpeed = 50;

        this.moveForward = function() {
            forward = !forward;
        }

        this.turnLeft = function() {
            left = !left;
        }

        this.turnRight = function() {
            right = !right;
        }

        this.position = function() {
            return playerObject.position;
        }

        this.update = function(delta) {
            var rotationMatrix = new THREE.Matrix4();
            var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second

            if (forward) {
                playerObject.translateZ(-movementSpeed * delta);
            }
            if (left) {
                rotationMatrix = new THREE.Matrix4().makeRotationY(rotateAngle);
            }
            if (right) {
                rotationMatrix = new THREE.Matrix4().makeRotationY(-rotateAngle);
            }
            if (left || right) {
                playerObject.matrix.multiply(rotationMatrix);
                playerObject.rotation.setEulerFromRotationMatrix(playerObject.matrix);
            }
            var relativeCameraOffset = new THREE.Vector3(0,5,25);

            var cameraOffset = relativeCameraOffset.applyMatrix4(playerObject.matrixWorld);
            camera.position.x = cameraOffset.x;
            camera.position.y = cameraOffset.y;
            camera.position.z = cameraOffset.z;
            camera.lookAt(playerObject.position);
        }
    }
    Player.prototype = new GameEntity();
    player = new Player();
    world.objects.push(player);
}

function createJeep(spec) {

    var Jeep = function() {
        var jeepBody = geometries.createJeepGeometry();
        jeepBody.addEventListener("collision", function(other, a, b) {
            console.log("CRAPOLA!");
        });
        var jeep = new THREE.Object3D();
        jeep.add(jeepBody);
        jeep.position.x = spec.x;
        jeep.position.z = spec.z;
        jeep.rotation.y = spec.rot;
        spec.scene.add(jeep);

        this.update = function(delta) {
            jeep.position.x += spec.move;
        }
    };
    Jeep.prototype = new GameEntity();
    return new Jeep();
}

function playSound(sound, distanceFromPlayer) {
    sound.volume = Math.min(Math.max(0, (10 / distanceFromPlayer)), 1);
    sound.play();
}

function GameEntity() {
    return {
        getRotationToPlayer: function(source, target, elevation) {
            var tgt = new THREE.Vector3().copy(target.position());
            tgt.y -= 1;
            var vectorToTarget = new THREE.Vector3().subVectors(tgt, source.position()).normalize();
            var angle = Math.acos(vectorToTarget.dot(new THREE.Vector3(0, 0, 1).normalize()));
            var axis = new THREE.Vector3().crossVectors(vectorToTarget, new THREE.Vector3(0, 0, 1)).normalize().negate();
            var t = elevation || { x: 0, y: 1, z: 0 };
            var translate = new THREE.Matrix4().makeTranslation(t.x, t.y, t.z);
            var rotate = new THREE.Matrix4().makeRotationAxis(axis, angle);
            var matrix = new THREE.Matrix4().multiplyMatrices(translate, rotate);
            return matrix;
        }
    }
}

function BulletFactory() {
    this.createBullet = function(shooter, direction) {
        var bullet = geometries.createBulletGeometry();
        var theBullet = new THREE.Object3D();
        theBullet.add(bullet);
        theBullet.matrixAutoUpdate = false;
        theBullet.matrix = direction;

        bullet.setCcdMotionThreshold(1);
        bullet.setCcdSweptSphereRadius(0.1);

        bullet.addEventListener( 'collision', function( other_object, linear_velocity, angular_velocity ) {
            // `this` is the mesh with the event listener
            // other_object is the object `this` collided with
            // linear_velocity and angular_velocity are Vector3 objects which represent the velocity of the collision
            console.log(other_object + " " + linear_velocity + " " + angular_velocity);
        });
        scene.add(theBullet);
        var Bullet = function() {
            var owner = shooter;
            var startPosition = shooter.position();
            this.update = function(delta) {
                if (startPosition.distanceTo(bullet.position) > 80) {
                    world.objects.splice(world.objects.indexOf(this), 1);
                    scene.remove(theBullet);
                }
                bullet.position.z += 50 * delta;
                theBullet.__dirtyPosition = true;
            }
        };
        Bullet.prototype = new GameEntity();
        return new Bullet();
    }
}

function cannonSound() {
    var sound = new Audio("sounds/cannon.mp3");
    sound.addEventListener("ended", function () {
        sound.currentTime = 0;
    }, false);
    return sound;
}

function GunFactory() {
    this.createGun = function(spec) {
        var gunGeom = geometries.createGunGeometry();
        var gun = gunGeom.gun;
        var turret = gunGeom.turret;
        gun.name = spec.name;
        gun.position.copy(spec.position);
        gun.firingSound = cannonSound();
        gun.lastFired = Date.now();
        spec.scene.add(gun);
        var Gun = function() {
            this.shoot = function() {
                var now = Date.now();
                if (now - gun.lastFired > 3000) {
                    world.objects.push(spec.bulletFactory.createBullet(this, turret.matrixWorld));
                    playSound(gun.firingSound, gun.position.distanceTo(camera.position));
                    gun.lastFired = now;
                }
            };
            this.update = function(delta) {
                if (gun.position.distanceTo(camera.position) <= 50) {
                    this.shoot();
                }
                var matrix = this.getRotationToPlayer(this, player);
                turret.matrix = matrix;
                turret.updateMatrixWorld(true);
            };
            this.position = function() {
                return gun.position;
            };
            this.name = function() {
                return gun.name;
            };

        };
        Gun.prototype = new GameEntity();
        return new Gun();
    }
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
        console.log("Ouch!  I hit something!");
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
    crash1.position.set(50, 2, -3);
    crash1.velocity = 0.5;
    crash1.addEventListener("collision", function(other, linear, angular) {
        if (other == crash2) {
            crash1.velocity = 0;
        }
    });
    crash1.update = function(delta) {
        crash1.translateX(crash1.velocity);
        crash1.__dirtyPosition = crash1.velocity > 0;
    };
    var crash2 = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
    crash2.position.set(100, 2, -3);
    crash2.velocity = 0.3;
    crash2.addEventListener("collision", function(other, linear, angular) {
        console.log("CRRAASSHH");
        if (other == crash1) {
            crash2.velocity = 0;
        }
    });
    crash2.update = function(delta) {
        crash2.position.x -= crash2.velocity;
        crash2.__dirtyPosition = crash2.velocity > 0;
    };
    var crash3 = new Physijs.SphereMesh(bouncingBallGeometry, bouncingMaterial, 1);
    crash3.position.set(30, 2, -3);
    crash3.velocity = 0.3;
    crash3.addEventListener("collision", function(other, linear, angular) {
        console.log("Hit the wall");
    });
    crash3.update = function(delta) {
        crash3.position.x -= crash3.velocity;
        crash3.__dirtyPosition = crash3.velocity > 0;
    };
    scene.add(crash1);
    scene.add(crash2);
    scene.add(crash3);
    world.objects.push(crash1, crash2, crash3);
}

function addGroundTo(scene) {
    var groundHeight = 1
    var groundGeometry = new THREE.CubeGeometry(1000, groundHeight, 1000, 100, 1, 100);
    var groundMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
    groundMaterial.map.repeat.set( 10, 10 );
    var ground = new Physijs.BoxMesh(groundGeometry, groundMaterial, 0);
    ground.receiveShadow = true;
    ground.position.set(0, -groundHeight/2, 0);
    ground.receiveShadow = true;
    scene.add( ground );

    var gridGeometry = new THREE.Geometry();
    for (var i= -5; i <= 5; i++) {
        gridGeometry.vertices.push(new THREE.Vector3(i, 5, 0));
        gridGeometry.vertices.push(new THREE.Vector3(i, -5, 0));

        gridGeometry.vertices.push(new THREE.Vector3(-5, i, 0));
        gridGeometry.vertices.push(new THREE.Vector3(5, i, 0));
    }
    var gridMaterial = new THREE.LineBasicMaterial({ color: 0x0 });
    var grid = new THREE.Line(gridGeometry, gridMaterial, THREE.LinePieces);
    scene.add(grid);
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
    wall1.position.set(-5, 2.5, 0);
    scene.add(wall1);
    var wall2 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall2.position.set(-5, 2.5, -5);
    scene.add(wall2);
    var wall3 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall3.position.set(-5, 2.5, -10);
    scene.add(wall3);
    var wall4 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall4.position.set(0, 2.5, -10);
    scene.add(wall4);
    var wall5 = new Physijs.BoxMesh(wallGeometry, wallMaterial, 0);
    wall5.position.set(5, 2.5, -10);
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
    var yPointMesh = new Physijs.CylinderMesh(pointGeometry, yBarGeometryMaterial, 1);
    yPointMesh.position.y = 10;

    var yPointer = new THREE.Object3D();
    yPointer.add(m);
    yPointer.add(yPointMesh);

    var xBarGeometryMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0xCC0000 }), 0.8, 0.6);
    var m2 = new Physijs.CylinderMesh(barGeometry, xBarGeometryMaterial, 1);
    m2.rotation.z = 90 * (Math.PI/180);
    m2.position.x = 5;
    var xPointMesh = new Physijs.CylinderMesh(pointGeometry, xBarGeometryMaterial, 1);
    xPointMesh.rotation.z = -90 * (Math.PI/180);
    xPointMesh.position.x = 10;

    var xPointer = new THREE.Object3D();
    xPointer.add(m2);
    xPointer.add(xPointMesh);

    var zBarGeometryMaterial = new Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0x0033CC }), 0.8, 0.6);
    var m3 = new Physijs.CylinderMesh(barGeometry, zBarGeometryMaterial, 1);
    m3.rotation.x = 90 * (Math.PI/180);
    m3.position.z = 5;
    //scene.add(m3);
    var zPointMesh = new Physijs.CylinderMesh(pointGeometry, zBarGeometryMaterial, 1);
    zPointMesh.rotation.x = 90 * (Math.PI/180);
    zPointMesh.position.z = 10;

    var zPointer = new THREE.Object3D();
    zPointer.add(m3);
    zPointer.add(zPointMesh);

    globe.add(xPointer);
    globe.add(yPointer);
    globe.add(zPointer);
    return globe;
}
