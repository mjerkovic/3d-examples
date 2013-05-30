function initScene(camera) {
    var scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -30, 0));
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
    var newPlayer = geometries.createJeepGeometry();
    var playerBody = newPlayer.jeep;
    var playerPhysics = newPlayer.physics;
    playerPhysics.addEventListener("collision", function(otherObject, linearVelocity, angularVelocity) {
        console.log("Player collision");
    });

    var Player = function() {
        var playerObject = new THREE.Object3D();
        playerObject.add(playerBody);
        playerObject.position.x = 0;
        playerObject.position.z = 50;
        playerObject.rotation.y = Math.PI;
        scene.add(playerObject);
        scene.add(playerPhysics);
        var movementSpeed = 20;
        var maxRotation = THREE.Math.degToRad(45);
        var acceleration = 5; // m/s
        var velocity = 0;

        this.position = function() {
            return playerObject.position;
        }

        this.update = function(delta) {
            var rotationMatrix = new THREE.Matrix4();
            var rotateAngle = maxRotation * delta;   // pi/2 radians (90 degrees) per second
            var forward = keyboard.keyPressed("W");
            var left = keyboard.keyPressed("A");
            var right = keyboard.keyPressed("D");
            var backward = keyboard.keyPressed("S");

            velocity += acceleration * delta;
            velocity = Math.min(Math.max(0, velocity), movementSpeed);

            if (forward) {
                playerObject.translateZ(velocity * delta);
                //playerPhysics.translateZ(velocity * delta);
            }
            if (backward) {
                playerObject.translateZ(-velocity * delta);
                //playerPhysics.translateZ(-velocity * delta);
            }

            playerPhysics.position.copy(playerObject.position);
            playerPhysics.__dirtyPosition = forward || backward;

            if (left) {
                rotationMatrix = new THREE.Matrix4().makeRotationY(backward ? -rotateAngle : rotateAngle);
            }
            if (right) {
                rotationMatrix = new THREE.Matrix4().makeRotationY(backward ? rotateAngle : -rotateAngle);
            }
            if (left || right) {
                playerObject.matrix.multiply(rotationMatrix);
                playerObject.rotation.setEulerFromRotationMatrix(playerObject.matrix);
                playerPhysics.matrix.multiply(rotationMatrix);
                playerPhysics.rotation.setEulerFromRotationMatrix(playerPhysics.matrix);
                playerPhysics.__dirtyRotation = true;
            }
            var relativeCameraOffset = new THREE.Vector3(0, 5, -25);

            var cameraOffset = relativeCameraOffset.applyMatrix4(playerObject.matrixWorld);
            camera.position.x = cameraOffset.x;
            camera.position.y = cameraOffset.y;
            camera.position.z = cameraOffset.z;
            camera.lookAt(playerObject.position);
        }
    }
    Player.prototype = new GameEntity(2, playerBody);
    player = new Player();
    world.objects.push(player);
}

function createJeep(spec) {
    var newJeep = geometries.createJeepGeometry();
    var jeepBody = newJeep.jeep;
    var jeepPhysics = newJeep.physics;
    jeepPhysics.addEventListener("collision", function(otherObject, linearVelocity, angularVelocity) {
        if (otherObject.gameId) {
            console.log(jeepPhysics.gameId + " collided with " + otherObject.gameId);
        } else {
            console.log(jeepPhysics.gameId + " collided with something");
        }
    });

    var Jeep = function() {
        var jeep = new THREE.Object3D();
        jeep.add(jeepBody);
        jeep.position.x = spec.x;
        jeep.position.z = spec.z;
        jeep.rotation.y = spec.rot;
        spec.scene.add(jeep);
        spec.scene.add(jeepPhysics);

        this.update = function(delta) {
            jeep.position.x += spec.move;
            jeepPhysics.position.copy(jeep.position);
            jeepPhysics.__dirtyPosition = true;
        }

        this.position = function() {
            return jeep.position;
        }

    };
    Jeep.prototype = new GameEntity(2, jeepBody);
    return new Jeep();
}

function playSound(sound, distanceFromPlayer) {
    sound.volume = Math.min(Math.max(0, (10 / distanceFromPlayer)), 1);
    sound.play();
}

function GameEntity(entityRadius, objectMesh) {
    var health = 1;

    this.getRotationToPlayer = function(source, target, elevation) {
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

    this.hit = function() {
        health = Math.min(0, health - 0.1);
    },

    this.radius = function() {
        return entityRadius;
    }

    this.mesh = function() {
        return objectMesh;
    }
}

THREE.Vector3.prototype.toString = function() {
    return this.x + ", " + this.y + ", " + this.z;
};

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
            var remove = function() {
                world.bullets.splice(world.bullets.indexOf(this), 1);
                scene.remove(theBullet);
            }
            var bulletHit = function(that) {
                return world.objects.some(function(obj) {
                    if (theBullet.position.distanceTo(obj.position()) <= (that.radius() + obj.radius())) {
                        obj.hit();
                        console.log("HIT!");
                        return true;
                    }
                    return false;
                });
            }
            var maxDistanceTravelled = function() {
                return startPosition.distanceTo(bullet.position) > 80;
            }

            this.update = function(delta) {
                var m = new THREE.Matrix4().extractRotation(theBullet.matrixWorld);
                var rayOrigin = new THREE.Vector3().applyMatrix4(new THREE.Matrix4().copyPosition(bullet.matrixWorld));
                var rayDirection = new THREE.Vector3(0, 0, 1).applyMatrix4(m).normalize();
                var rayCaster = new THREE.Raycaster(rayOrigin, rayDirection);
                var entities = world.objects.map(function(object) {
                    return object.mesh();
                });
                var contacts = rayCaster.intersectObjects(entities);
                if (contacts.length > 0) {
                    var contact = contacts[0];
                    if (contact.distance <= this.radius() + 2 + (50 * delta)) {
                        console.log("Hit detected by raycaster!");
                        var color = contact.object.material.color;
                        var newR = color.r;
                        newR = newR - (newR * 0.1);
                        var newG = color.g;
                        newG = newG - (newG * 0.1);
                        var newB = color.b;
                        newB = newB - (newB * 0.1);
                        contact.object.material.color.setRGB(newR, newG, newB);
                        remove();
                        return;
                    }
                    //var posX =  new THREE.Vector3().applyMatrix4(new THREE.Matrix4().copyPosition(bullet.matrixWorld))
                    //console.log("Distance = " + contact.distance + "ContactPos = " + contact.object.position + "rayOrigin = " + rayOrigin);
                }
                rayDirection.negate();
                rayCaster = new THREE.Raycaster(rayOrigin, rayDirection);
                var contacts = rayCaster.intersectObjects(entities);
                if (contacts.length > 0) {
                    var contact = contacts[0];
                    if (contact.distance <= this.radius() + 10) {
                        console.log("Hit detected by raycaster on the backside!");
                        remove();
                        return;
                    }
                }

                if (maxDistanceTravelled() || bulletHit(this)) {
                    remove();
                } else {
                    bullet.position.z += 10 * delta;
                }

            }
        };
        Bullet.prototype = new GameEntity(0.1, bullet);
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
        Gun.prototype = new GameEntity(1, gunGeom);
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
}

function building() {
    var buildingGeometry = new THREE.CubeGeometry(10, 10, 20);
    var building = new THREE.Mesh(buildingGeometry, new THREE.MeshPhongMaterial({ color: 0x25256F,
            specular: 0x20205F, shininess: 90 }));
    building.position.set(10, 5, -60);
    return building;
}

function addLightsTo(scene) {
    var light = new THREE.DirectionalLight( 0xffffff, 1.0 );
    light.position.set( 200, 400, 500 );
    scene.add(light);
    var ambientLight = new THREE.AmbientLight( 0x00000A );
    scene.add(ambientLight);
    var pointLight = new THREE.DirectionalLight(0xFFFFFF, 1.5, 50);
    pointLight.position.set(100,10,0);
    scene.add(pointLight);
}