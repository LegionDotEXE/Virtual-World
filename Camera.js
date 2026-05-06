// Camera.js

// WASD movements and mouse vertical look for a first-person camera

class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([0, 0.5, 3]);
        this.at = new Vector3([0, 0.5, 2]);
        this.up = new Vector3([0, 1, 0]);

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.speed = 0.2;
        this.alpha = 3;   

        this.updateView();
        this.updateProjection();
    }

    updateView() {
        this.viewMatrix.setLookAt(
        this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
        this.at.elements[0], this.at.elements[1], this.at.elements[2],
        this.up.elements[0], this.up.elements[1], this.up.elements[2],
        //this.up.elements[2], this.up.elemetns[1], this.up.elements[0]
        );
    }

    updateProjection() {
        var canvas = document.getElementById('webgl');
        this.projectionMatrix.setPerspective(
        this.fov,
        canvas.width / canvas.height,
        0.1,
        1000
        );
    }

    moveForward() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(this.speed);
        this.eye.add(f);
        this.at.add(f);
        this.updateView();
    }

    moveBackwards() {
        var b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        b.normalize();
        b.mul(this.speed);
        this.eye.add(b);
        this.at.add(b);
        this.updateView();
    }

    moveLeft() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        var s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(this.speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateView();
    }

    moveRight() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        var s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(this.speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateView();
    }

    panLeft(degrees) {
        var deg = degrees || this.alpha;
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

        var f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye);
        this.at.add(f_prime);
        this.updateView();
    }

    panRight(degrees) {
        var deg = degrees || this.alpha;
        this.panLeft(-deg);
    }

    // for mouse look
    panUp(degrees) {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        // get the right vector to rotate around
        var right = Vector3.cross(f, this.up);
        right.normalize();

        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(degrees, right.elements[0], right.elements[1], right.elements[2]);

        var f_prime = rotationMatrix.multiplyVector3(f);
        this.at.set(this.eye);
        this.at.add(f_prime);
        this.updateView();
    }
}