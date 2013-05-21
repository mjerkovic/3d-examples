function initScene(camera) {
    var scene = new THREE.Scene();
    geometries = new Geometries();
    addPlayer(scene, camera);
    addLightsTo(scene);
    addGroundTo(scene);
    scene.add(building());
    var gunFactory = new GunFactory();
    var bulletFactory = new BulletFactory();
    var gun1 = gunFactory.createGun({ scene: scene, position: new THREE.Vector3(15, 1, 1.5), name: "gun1", bulletFactory: bulletFactory });
    var gun2 = gunFactory.createGun({ scene: scene, position: new THREE.Vector3(10, 11, -51), name: "gun2", bulletFactory: bulletFactory });
    world.objects.push(gun1, gun2);
    world.objects.push(createJeep({ scene: scene, x: 10, z: 2, move: 0.1, rot: 1.57 }));
    world.objects.push(createJeep({ scene: scene, x: 50, z: 2, move: -0.1, rot: -1.57 }));
    return scene;
}

function addPlayer(scene, camera) {
    var Player = function() {
        var playerBody = geometries.createJeepGeometry();
        var playerObject = new THREE.Object3D();
        playerObject.add(playerBody);
        playerObject.position.x = 0;
        playerObject.position.z = 50;
        playerObject.rotation.y = Math.PI;
        scene.add(playerObject);
        var movementSpeed = 50;
        var maxRotation = THREE.Math.degToRad(90);

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
            var rotateAngle = maxRotation * delta;   // pi/2 radians (90 degrees) per second
            var forward = keyboard.keyPressed("W");
            var left = keyboard.keyPressed("A");
            var right = keyboard.keyPressed("D");

            if (forward) {
                playerObject.translateZ(movementSpeed * delta);
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
            var relativeCameraOffset = new THREE.Vector3(0, 5, -25);

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
        var jeep = new THREE.Object3D();
        jeep.add(jeepBody);
        jeep.position.x = spec.x;
        jeep.position.z = spec.z;
        jeep.rotation.y = spec.rot;
        spec.scene.add(jeep);

        this.update = function(delta) {
            jeep.position.x += spec.move;
            jeepBody.__dirtyPosition = true;
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
        scene.add(theBullet);
        var Bullet = function() {
            var owner = shooter;
            var startPosition = shooter.position();
            this.update = function(delta) {
                if (startPosition.distanceTo(bullet.position) > 80) {
                    world.bullets.splice(world.bullets.indexOf(this), 1);
                    scene.remove(theBullet);
                }
                bullet.position.z += 50 * delta;
                bullet.__dirtyPosition = true;
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
                    world.bullets.push(spec.bulletFactory.createBullet(this, turret.matrixWorld));
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

function addGroundTo(scene) {
    var groundHeight = 1
    var groundGeometry = new THREE.CubeGeometry(1000, groundHeight, 1000, 100, 1, 100);
    var groundMaterial = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' )
    });
    groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
    groundMaterial.map.repeat.set( 10, 10 );
    var ground = new THREE.Mesh(groundGeometry, groundMaterial, 0);
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
    var building = new THREE.Mesh(buildingGeometry, new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }));
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