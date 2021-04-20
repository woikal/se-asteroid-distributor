
class AsteroidField {
    constructor(
        amount,
        {
            distribution: type,
            center: center = Vector3.zero,
            dimension: dim = new Vector3(6000, 6000, 6000), // km
            maxRadius: radius = 100,
            voxelMaps: maps = [],
            intervals: itv = 5,
            sectionAngle: angle = 36, // °
            maxWidth: width = 0.5,
            maxHeight: height = 0.5,
            maxOffset: offset = 0
        }
    ) {
        this.amount = amount;
        this.distribution = type;
        this.asteroids = [];
        this.center = center;
        this.dimension = dim;
        this.maxRadius = radius;
        this.voxelMaps = maps;
        this.intervals = itv;
        this.sectionAngle = angle;
        this.maxWidth = width;
        this.maxHeight = height;
        this.maxOffset = offset;
    }

    getField() {
        if (!this.asteroids.length) {
            switch (this.distribution) {
                case 'quader':
                    this.createQuader(); break;
                case 'ellipsoid':
                    this.createEllipsoid(); break;
                case 'spiral':
                    this.createSpiral(); break;
                case 'spiral2':
                    this.createSpiral2(); break;
                case 'testPlane':
                    this.createTestPlane('xy'); break;
                case 'sphere':
                default:
                    this.createSphere(); break;
            }
        }
        return { asteroids: this.asteroids, center: this.center, dimension: this.dimension };
    }

    getXML(indent = 0) {
        let xml = [];
        for (let a of this.asteroids) {
            xml.push(a.getXML(4));
        }
        return xml.join('\n\n');
    }

    scale(factor) {
        for (let a of this.asteroids) {
            a.move(this.center.getInverted());
            a.position.set(a.position.scale(factor));
            a.move(this.center);
        }
    }

    set center(offset) {
        for (a of this.asteroids) {
            a.move(this._center.getInverted());
            a.move(offset);
        }
        this._center = offset;
    }

    get center() { return this._center(); }

    createQuader() {
        for (let i = 0; i < this.amount; i++) {
            let x = Math.floor(getPoweredRandom(2) * this.dimension.x);
            let y = Math.floor(getPoweredRandom(2) * this.dimension.y);
            let z = Math.floor(getPoweredRandom(3) * this.dimension.z);
            // let clusterSize = getRandomIndex(0.11, 0.15, 0.18, 0.20, 1.0);

            this.asteroids.push(new Asteroid(new Vector3(x, y, z)), this.randomVoxelMap());
        }
        this.roundPositions();
    }

    createSphere() {
        const [a, b, c] = [this.dimension.x / 2, this.dimension.y / 2, this.dimension.z / 2];
        const [a2, b2, c2] = [a * a, b * b, c * c];
        let radius, phi, theta;
        let x, y, z;

        for (let i = 0; i < this.amount; i++) {
            radius = Math.sqrt(getRandom()) * this.maxRadius;
            phi = Math.PI * 2 * getRandom();
            theta = Math.PI * getRandom();

            x = radius * Math.cos(phi) * Math.cos(theta) + this.center.x;
            y = radius * Math.sin(theta) + this.center.y;
            z = radius * Math.sin(phi) * Math.cos(theta) + this.center.z;


            this.asteroids.push(new Asteroid(new Vector3(x, y, z), this.randomVoxelMap()));
        }
        this.roundPositions();
    }

    createSpiral() {
        const rHole = 0.12;
        const rInner = 0.2;
        const sector = 360 / this.intervals;

        let radius, phi, rnd;
        let [rMin, rMax] = [1, 0];


        for (let i = 0; i < this.amount; i++) {
            phi = sector * (i % this.intervals);
            rnd = (getRandom()) * (1 - rHole) + rHole;

            // if (rnd < rInner) {
            if (rnd < 0) {
                // CDF: (x-a)^2 / (b-a)(c-a)
                radius = rnd;
                phi += sector * getRandom();
            } else {
                // CDF: 1- (b-x)^2 / (b-a)(b-c)
                radius = 1 - (1 - rnd) * (1 - rnd) / (1 - rInner);
                phi += (1 - (radius - rInner) / (1 - rInner)) * sector * this.maxWidth * getSummedRandom(2);
                phi += this.maxOffset * (radius - rInner) / (1 - rInner);
            }

            radius *= this.maxRadius;
            phi *= Math.PI / 180;
            let x = Math.cos(phi) * radius + this.center.x;
            let y = this.dimension.y * getSummedRandom(3) - this.dimension.y / 2 + this.center.y;
            let z = Math.sin(phi) * radius + this.center.z;
            console.log({ rnd: rnd, r: radius, phi: phi });

            this.asteroids.push(new Asteroid(new Vector3(x, y, z), this.randomVoxelMap()));

            rMin = Math.min(rMin, rnd);
            rMax = Math.max(rMax, rnd);
        }

        console.log({ min: rMin, max: rMax });
        this.roundPositions();
    }


    createSpiral2() {
        const rCenter = 20;
        const sector = 360 / this.intervals;
        const [a, b, c] = [this.dimension.x / 4 - rCenter, this.maxHeight / 2, this.maxWidth / 2];
        const [a2, b2, c2] = [a * a, b * b, c * c];

        let x, y, z, distance, phi, cos, sin, pos;

        for (let i = 0; i < this.amount; i++) {
            do {
                x = getRandom() * a * 2 - a;
                y = getRandom() * b * 2 - b;
                z = getRandom() * c * 2 - c;
            } while (x * x / a2 + y * y / b2 + z * z / c2 > 1)
            x += a + rCenter;

            let distance = Math.sqrt(x * x + y * y) / 2 / a;
            phi = sector * (i % this.intervals);
            phi += this.maxOffset * (1 - distance);
            phi *= Math.PI / 180;

            [cos, sin] = [Math.cos(phi), Math.sin(phi)];
            pos = new Vector3(x * cos - z * sin, y, z * cos + x * sin);
            this.asteroids.push(new Asteroid(pos, this.randomVoxelMap()));

            console.log({ pos: pos, r: distance < 1, phi: phi });
        }
        this.roundPositions();
    }


    createTestPlane(orientation) {
        this.amount = this.voxelMaps.length;
        let cols = Math.floor(Math.sqrt(this.amount)) | 1;
        let distance = 250; //m
        let getPosition = function (i) {
            let col = (i % cols) * distance;
            let row = -Math.floor(i / cols) * distance;
            return [col, row];
        }
        switch (orientation) {
            case 'xy':
                let z = 0;
                for (let i = 0; i < this.amount; i++) {
                    let [x, y] = getPosition(i);
                    asteroids.push(new Asteroid(new Vector3(x, y, z), this.voxelMaps[i]));
                }
                break;
            case 'yz':
                let x = 0;
                for (let i = 0; i < this.amount; i++) {
                    let y = (i % cols) * distance;
                    let z = -Math.floor(i / cols) * distance;
                    asteroids.push(new Asteroid(new Vector3(x, y, z), this.voxelMaps[i]));
                }
                break;
            case 'xz':
            default:
                let y = 0;
                for (let i = 0; i < this.amount; i++) {
                    let x = (i % cols) * distance;
                    let z = -Math.floor(i / cols) * distance;
                    asteroids.push(new Asteroid(new Vector3(x, y, z), this.voxelMaps[i]));
                }
        }
    }

    randomVoxelMap() {
        return this.voxelMaps.length > 0 ? this.voxelMaps[getRandomInt(this.voxelMaps.length)] : 'custom_asteroid';
    }

    roundPositions() {
        for (let a of this.asteroids) {
            a.position.x = Math.round(a.position.x);
            a.position.y = Math.round(a.position.y);
            a.position.z = Math.round(a.position.z);
        }
    }
}



class Asteroid {
    static get counter() {
        return Asteroid._counter;
    }

    constructor(position, voxelMap) {
        Asteroid._counter = (++Asteroid._counter || 0);
        this.id = 42000 + Asteroid._counter;
        this.voxelMap = voxelMap;
        this.position = position;
    }

    getXML(indent = 0) {
        let lead = '';
        for (let i = 0; i < indent; i++) {
            lead += ' ';
        }
        return '' +
            lead + '<MyObjectBuilder_EntityBase xsi:type="MyObjectBuilder_VoxelMap">\n' +
            lead + '  <SubtypeName />\n' +
            lead + `  <EntityId>${this.id}</EntityId>\n` +
            lead + '  <PersistentFlags>CastShadows InScene</PersistentFlags>\n' +
            lead + '  <PositionAndOrientation>\n' +
            lead + `    <Position x="${this.position.x * 1000}" y="${this.position.y * 1000}" z="${this.position.z * 1000}" />\n` +
            lead + '    <Forward x="-0" y="-0" z="-1" />\n' +
            lead + '    <Up x="0" y="1" z="0" />\n' +
            lead + '    <Orientation>\n' +
            lead + '      <X>0</X>\n' +
            lead + '      <Y>0</Y>\n' +
            lead + '      <Z>0</Z>\n' +
            lead + '      <W>1</W>\n' +
            lead + '    </Orientation>\n' +
            lead + '  </PositionAndOrientation>\n' +
            lead + '  <ContentChanged>false</ContentChanged>\n' +
            lead + `  <StorageName>${this.voxelMap}</StorageName>\n` +
            lead + '</MyObjectBuilder_EntityBase>';
    }

    toString() {
        return (`file: ${this.voxelMap}_${this.id}.vx: \t${this.position}\n`);
    }
}

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    toArray() { return [this.x, this.y, this.z] };

    static zero() { return new Vector3(0, 0, 0); }
    static one() { return new Vector3(1, 1, 1); }

    sqrMagnitude() {
        let [x, y, z] = [this.x, this.y, this.z];
        return x * x + y * y + z * z;
    }

    magnitude() {
        return Math.sqrt(this.magnitude);
    }


    scale(factor) {
        if (factor && typeof (fasctor) == 'number') {
            this.x *= factor;
            this.y *= factor;
            this.z *= factor;
        } else {
            this.x *= factor.x;
            this.y *= factor.y;
            this.z *= factor.z;
        }
        return this;
    }

    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        this.z += vec.z;
        return this;
    }

    getInverted() {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    getDifference(base) {
        return new Vector3(this.x - base.x, this.y - base.y, this.z - base.z)
    }

    toString() {
        return (`x: ${this.x} \ty: ${this.y} \tz: ${this.z}`);
    }
}

function toRadians(angle) {
    return angle * Math.PI / 180;
}

function getRandom() {
    return Math.random();
}

function getSummedRandom(num) {
    // based on center theorem
    let rand = 0;
    for (let i = 0; i < num; i++) {
        rand += getRandom();
    }
    return rand / num;
}

function getWeightedRandom(pow) {
    let rand = getRandom();
    for (let i = 1; i < pow; i++) {
        rand *= rand;
    }
    return rand;
}
function getInversedRandom() {
    return Math.sqrt(getRandom());
}

function getRandomInt(bound = 2) {
    return Math.floor(Math.max(bound, 1) * getRandom());
}