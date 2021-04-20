class AsteroidMap {
    constructor(data, perspective = 'yz', margin = 20) {
        this.asteroids = data.asteroids;
        this.dimension = data.dimension;
        this.center = data.center;
        this.perspective = perspective;
        this.margin = margin;
        this.initCanvas();
        this.data = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }


    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.deriveSize();
        this.ctx = this.canvas.getContext("2d");
    }
    setSize(width, height) {
        this.canvas.width = width + this.margin * 2;
        this.canvas.height = height + this.margin * 2;
    }

    deriveSize() {
        let w, h;
        switch (this.perspective) {
            case "xy": // front
                w = this.dimension.x;
                h = this.dimension.y;
                break;
            case "yz": // side
                w = this.dimension.z;
                h = this.dimension.y;
                break;
            case "xz": // top
            default:
                w = this.dimension.x;
                h = this.dimension.z;
                break;
        }
        this.setSize(w, h);
    }

    draw() {
        const MIN_ALPHA = 0.25;
        let mapX, mapY, alpha;
        let [dimX, dimY, dimZ] = [this.dimension.x / 2, this.dimension.y / 2, this.dimension.z / 2];
        for (let a of this.asteroids) {
            switch (this.perspective) {
                case "xy": // front
                    mapX = a.position.x + dimX;
                    mapY = a.position.y + dimY;
                    alpha = (a.position.z + dimZ) / this.dimension.z;
                    break;
                case "yz": // side
                    mapX = a.position.z + dimZ;
                    mapY = a.position.y + dimY;
                    alpha = (a.position.x + dimX) / this.dimension.x;
                    break;
                case "xz": // top
                default:
                    mapX = a.position.x + dimX;
                    mapY = a.position.z + dimZ;
                    alpha = (a.position.y + dimY) / this.dimension.y;
                    break;
            }
            mapX += this.margin;
            mapY += this.margin;
            alpha = alpha * (1 - MIN_ALPHA) + MIN_ALPHA;

            this.drawCross(mapX, mapY, `rgba(60, 140, 255, ${alpha}`);
        }
        //   map.write(title);
    }

    drawCross(x, y, col) {
        const size = 4;

        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = col;
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x + size, y);
        this.ctx.stroke();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x, y + size);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawCircle(x, y, col) {
        const size = 4;

        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = col;
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    write(label) {
        this.ctx.font = "12px Arial";
        this.ctx.fillStyle = "rgb(60,120,255)";
        this.ctx.fillText(label, 10, 12);
    }

    setPixel(x, y, r, g, b) {
        let off = (x + y * this.width) * 4;

        this.data.data[off + 0] = r;
        this.data.data[off + 1] = g;
        this.data.data[off + 2] = b;
        this.data.data[off + 3] = 1;
    }

    update() {
        this.ctx.putImageData(this.data, 0, 0);
    }

    getCanvas() {
        return this.canvas;
    }

}

