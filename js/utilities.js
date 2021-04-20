function getRandom() {
    return Math.random();
}

function getPoweredRandom(pow) {
    // based on center theorem
    let rand = 0;
    for (let i = 0; i < pow; i++) {
        rand += getRandom();
    }
    return rand / pow;
}

function getRandomIndex(num = 2) {
    const rand = getRandom();
    for (let i = 0; i < arguments.length; i++) {
        if (arguments[i] > rand) {
            return arguments.length - i;
        }
    }
    return 1;
}