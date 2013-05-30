function Geometries() {
    var jeepCounter = 0;
    // Bullet
    var bulletGeom = new THREE.CylinderGeometry(0.0, 0.1, 0.3, 32, 16);
    var bulletMaterial = new THREE.MeshPhongMaterial({
        color: 0xF7A30B, specular: 0x111111, shininess: 90
    });

    // Gun
    var barrelGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 32, 16);
    var barrelMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000, specular: 0x866C6C, shininess: 30, opacity: 1
    });
    var innerBarrelGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 32, 16);
    var innerBarrelMaterial = new THREE.MeshBasicMaterial({ color: 0x0 });
    var turretGeom = new THREE.SphereGeometry(1, 32, 16);
    var turretMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000, specular: 0x866C6C, shininess: 30, opacity: 1
    });
    var gunGeom = new THREE.CylinderGeometry(0, 1, 2, 32, 16);
    var gunMaterial = new THREE.MeshPhongMaterial({
        color: 0x3344E8, specular: 0x111111, shininess: 30, opacity: 1
    });

    // Jeep
    var jeepBodyGeom = new THREE.CubeGeometry(2.5, 0.6, 4);
    var wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32, 16);
    var wheelMat = new THREE.MeshPhongMaterial({
        color: 0x0, specular: 0x0, shininess: 90
    });
    var windShieldGeom = new THREE.CubeGeometry(2.5, 0.5, 0.1);
    var windShieldMat = new THREE.MeshPhongMaterial({
        color: 0x25256F, specular: 0x20205F, shininess: 90, opacity: 0.3, transparent: true
    });

    return {
        createJeepGeometry: function() {
            var jeepBodyMat = new THREE.MeshPhongMaterial({
                color: 0x8DA23E, specular: 0x8DA23E, ambient: 0xFFFFFF, shininess: 90
            });
            var jeepBody = new THREE.Mesh(jeepBodyGeom, jeepBodyMat);
            jeepBody.position.y = 0.6;
            var lfWheel = new THREE.Mesh(wheelGeom, wheelMat);
            lfWheel.rotation.z = 1.57;
            lfWheel.position.set(1.25, -0.3, 1);
            jeepBody.add(lfWheel);
            var rfWheel = new THREE.Mesh(wheelGeom, wheelMat);
            rfWheel.rotation.z = 1.57;
            rfWheel.position.set(-1.25, -0.3, 1);
            jeepBody.add(rfWheel);
            var lrWheel = new THREE.Mesh(wheelGeom, wheelMat);
            lrWheel.rotation.z = 1.57;
            lrWheel.position.set(1.25, -0.3, -1);
            jeepBody.add(lrWheel);
            var rrWheel = new THREE.Mesh(wheelGeom, wheelMat);
            rrWheel.rotation.z = 1.57;
            rrWheel.position.set(-1.25, -0.3, -1);
            jeepBody.add(rrWheel);
            var windShield = new THREE.Mesh(windShieldGeom, windShieldMat);
            windShield.rotation.x = -30 * (Math.PI / 180);
            windShield.position.y = 0.5;
            windShield.position.z = 0.5;
            jeepBody.add(windShield);

            var jeepPhysMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 0.3, transparent: true }), 0, 0 );
            var jeepPhysMesh = new Physijs.SphereMesh(new THREE.CubeGeometry(2.5, 0.6, 4), jeepPhysMaterial , 1000);
            //jeepPhysMesh.visible = false;
            jeepPhysMesh.gameId = "Jeep" + ++jeepCounter;

            return {
                jeep: jeepBody,
                physics: jeepPhysMesh
            };
        },

        createBulletGeometry: function() {
            var bullet = new THREE.Mesh(bulletGeom, bulletMaterial);
            bullet.rotation.x = 1.57;
            return bullet;
        },

        createGunGeometry: function() {
            var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
            barrel.position.z = 1.5;
            barrel.rotation.x = 1.57;
            var innerBarrel = new THREE.Mesh(innerBarrelGeom, innerBarrelMaterial);
            innerBarrel.position.z = 1.51;
            innerBarrel.rotation.x = 1.57;
            innerBarrel.name = "innerBarrel";
            var turret = new THREE.Mesh(turretGeom, turretMaterial);
            turret.name = "barrel";
            turret.matrixAutoUpdate = false;
            turret.add(barrel);
            turret.add(innerBarrel);
            var gun = new THREE.Mesh(gunGeom, gunMaterial);
            gun.add(turret);
            return {
                gun: gun,
                turret: turret
            }
        }
    }
}