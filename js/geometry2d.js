// import 'gemometry';

function translatePoint(point, vector) {
    point.x + vector.x;
    point.y + vector.y;
}

function translatePoints(points, verctor) {
    for (p in points) {
        translatePoint(p, vector);
    }
}

function scalePoint(point, factor) {
    point.x *= factor;
    point.y *= factor;
}

function scalePoints(points, factor) {
    for (p in points) {
        scalePoint(p, factor);
    }
}

function rotatePoint(point, angle) {
    let radius = angle * Math.PI / 180;
    let c = Math.cos(radius);
    let s = Math.sin(radius);
    point.x *= c - point.y * s;
    point.y *= c + point.x * s;
}

function rotatePointByBase(point, base, angle) {
    translate(point, inv(base));
    rotatePoint(point, angle);
    translate(point, base);
}

function rotatePointsByBase(points, base, angel) {
    for (p in points) {
        rotatePointByBase(p, base, angle);
    }
}

function inv(vector){
    return {x: -vector.x, y: -vector.y};
}