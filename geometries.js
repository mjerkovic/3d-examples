function Geometries() {

    // Bullet
    var bulletGeom = new THREE.CylinderGeometry(0.0, 0.1, 0.3, 32, 16);
    var bulletMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: 0xF7A30B, specular: 0x111111, shininess: 90
    }), 0.1, 0.1);

    // Gun
    var barrelGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 32, 16);
    var barrelMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: 0x000000, specular: 0x866C6C, shininess: 30, opacity: 1
    }), 1, 1);
    var innerBarrelGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 32, 16);
    var innerBarrelMaterial = new Physijs.createMaterial(
        new THREE.MeshBasicMaterial({ color: 0x0 }), 1, 1);
    var turretGeom = new THREE.SphereGeometry(1, 32, 16);
    var turretMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: 0x000000, specular: 0x866C6C, shininess: 30, opacity: 1
    }), 1, 1);
    var gunGeom = new THREE.CylinderGeometry(0, 1, 2, 32, 16);
    var gunMaterial = new THREE.MeshPhongMaterial({
        color: 0x3344E8, specular: 0x111111, shininess: 30, opacity: 1
    });

    // Jeep
    var jeepBodyGeom = new THREE.CubeGeometry(2.5, 0.6, 4);
    var jeepBodyMat = new THREE.MeshPhongMaterial({ color: 0x8DA23E,
        specular: 0x8DA23E, ambient: 0xFFFFFF, shininess: 90 });
    var wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32, 16);
    var wheelMat = new THREE.MeshPhongMaterial({ color: 0x0,
        specular: 0x0, shininess: 90 });
    var windShieldGeom = new THREE.CubeGeometry(2.5, 0.5, 0.1);
    var windShieldMat = new THREE.MeshPhongMaterial({ color: 0x25256F,
        specular: 0x20205F, shininess: 90, opacity: 0.3, transparent: true });

    return {
        createJeepGeometry: function() {
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
            return jeepBody;
        },

        createBulletGeometry: function() {
            var bullet = new Physijs.CylinderMesh(bulletGeom, bulletMaterial, 0.1);
            bullet.rotation.x = 1.57;
            return bullet;
        },

        createGunGeometry: function() {
            var barrel = new Physijs.CylinderMesh(barrelGeom, barrelMaterial, 1000);
            barrel.position.z = 1.5;
            barrel.rotation.x = 1.57;
            var innerBarrel = new Physijs.CylinderMesh(innerBarrelGeom, innerBarrelMaterial, 1000);
            innerBarrel.position.z = 1.51;
            innerBarrel.rotation.x = 1.57;
            innerBarrel.name = "innerBarrel";
            var turret = new Physijs.SphereMesh(turretGeom, turretMaterial, 1000);
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