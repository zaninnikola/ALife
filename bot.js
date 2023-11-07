//кастомные функции для нейронки, но в основе все тот же перцептрон с хабра
let nfuncs = {
    //обычная функция с сигмоидальной активацией
    's': function(input, weights) {
        let non_activated = 0
        let enabled = 0
        for (let i = 0; i < input.length; i++) {
            if (weights[i] != -2) {
                non_activated += input[i] * weights[i]
                enabled += 1
            }
        }
        if (enabled != 0) {
            return activation_sigmoid(non_activated / enabled);
        } else {
            return 0
        }
    },
    //функция с рандомным выводом
    'r':function(input, weights) {
        let non_activated = 0
        let enabled = 0
        for (let i = 0; i < input.length; i++) {
            if (weights[i] != -2) {
                non_activated += input[i] * weights[i]
                enabled += 1
            }
        }
        if (enabled != 0) {
            return getRandomFloat(activation_sigmoid(non_activated / enabled), 1)
        } else {
            return getRandomFloat(0, 1)
        }
    },
    //пороговая функция
    'p':function(input, weights) {
        let non_activated = 0
        let enabled = 0
        for (let i = 0; i < input.length; i++) {
            if (weights[i] != -2) {
                non_activated += input[i] * weights[i]
                enabled += 1
            }
        }
        if (enabled != 0) {
            if (non_activated / enabled >= 0) {
                return 1;
            } else {
                return 0
            }
        } else {
            return 0
        }
    }
}
class creature {
    constructor(x, y, o, id, energy, weights, weights2, resists, hidden, rold) {
        this.old = rold
        this.rold = rold
        this.x = x
        this.y = y
        this.o = o
        this.id = id
        this.energy = energy
        this.weights = weights
        this.weights2 = weights2
        this.hidden = hidden
        this.fillStyle = `rgb(${(asum(weights[0]) + asum(weights2[0])) * 11}, ${(asum(weights[1]) + asum(weights2[1])) * 11}, ${(asum(weights[2]) + asum(weights2[2])) * 11})`
        this.strokeStyle = `rgb(${sum(weights[5]) * 80}, ${sum(weights[3]) * 80}, ${(sum(weights[6]) + sum(weights[7])) * 80})`
        this.resists = resists
        this.last = 'рождение'
    }
    // земля под ногами
    goo(world) {
        return world[this.x - 1][this.y - 1]
    }
    // зрение
    see(emap) {
        return emap[rotations[this.o](this.x, this.y).x - 1][rotations[this.o](this.x, this.y).y - 1]
    }
    //земля впереди
    seegoo(world) {
        return world[rotations[this.o](this.x, this.y).x - 1][rotations[this.o](this.x, this.y).y - 1]
    }
    //повороты
    left() {
        this.energy -= 0.1
        switch (this.o) {
            case 1:
                this.o = 4
                break
            case 2:
                this.o = 3
                break
            case 3:
                this.o = 1
                break
            case 4:
                this.o = 2
                break
        }
    }
    right() {
        this.energy -= 0.1
        switch (this.o) {
            case 4:
                this.o = 1
                break
            case 3:
                this.o = 2
                break
            case 1:
                this.o = 3
                break
            case 2:
                this.o = 4
                break
        }
    }
    //движение
    forward(emap) {
        this.energy -= 0.1
        if (this.see(emap) == -1) {
            this.x = rotations[this.o](this.x, this.y).x
            this.y = rotations[this.o](this.x, this.y).y
        }
    }
    //фотосинтез
    photo(world) {
        let goo = this.goo(world)
        if (goo[2] >= 10 && CO2 >= 0.00001) {
            world[this.x - 1][this.y - 1][2] -= 10
            this.energy += 2.5 * light * temps[this.y - 1] //фотосинтез и разложение органики лучше в тепле
            O2 = Math.min(O2 + 0.00001, 1)
            CO2 -= 0.00001
            this.last = 'фотосинтез'
        }
    }
    //хемосинтез
    chemo(world) {
        let goo = this.goo(world)
        if (goo[0] >= 10 && O2 >= 0.00001) {
            world[this.x - 1][this.y - 1][0] -= 10
            this.energy += 2.5 / temps[this.y - 1] //а хемосинтез-наоборот
            CO2 = Math.min(CO2 + 0.00001, 1)
            O2 -= 0.00001
            this.last = 'хемосинтез'
        }
    }
    //разложение
    detrit(world) {
        let goo = this.goo(world)
        if (goo[1] >= 10 && O2 >= 0.00001) {
            world[this.x - 1][this.y - 1][1] -= 10
            world[this.x - 1][this.y - 1][0] = Math.min(world[this.x - 1][this.y - 1][0] + 5, 255)
            world[this.x - 1][this.y - 1][2] = Math.min(world[this.x - 1][this.y - 1][2] + 5, 255)
            this.energy += 2.5 * temps[this.y - 1]
            CO2 = Math.min(CO2 + 0.00001, 1)
            O2 -= 0.00001
            this.last = 'разложение органики'
        }
    }
    //охота
    ambush(emap, creatures) {
        if (this.see(emap) != -1 && typeof (this.see(emap))) {
            for (let i = 0; i < creatures.length; i++) {
                if (creatures[i].id == this.see(emap)) {
                    this.energy += creatures[i].energy / 2
                    delete creatures[i]
                    creatures.splice(i, 1)
                    this.last = 'съел товарища'
                    break
                }
            }

        }
    }
    //размножение
    mitos(emap, id) {
        if (this.see(emap) == -1) {
            this.energy /= 2
            //мутация резистов
            let newresists
            let value = randint(0, 3)
            if (value != 0) {
                newresists = this.resists.slice(0)
            }
            else {
                newresists = [0, 0, 0, 0, 0]
                newresists[randint(0, 4)] = 1
            }

            //копия нейросети
            let newweights = []
            for (let i = 0; i < 8; i++) {
                let subweight = this.weights[i].slice(0)
                newweights.push(subweight)
            }
            let newweights2 = []
            for (let i = 0; i < 8; i++) {
                let subweight = this.weights2[i].slice(0)
                newweights2.push(subweight)
            }
            //мутация нейросети
            let rand = randint(0, 2)
            let hidden = this.hidden.slice(0)
            if (rand == 1) {
                let x = randint(0, 7)
                let y = randint(0, 10)
                let randweight = getRandomFloat(-1, 1)
                newweights[x][y] = [randweight, randweight, -2][randint(0, 2)]//отрицательные веса и отключенные синапсы появляются только в ходе эволюции
            } else if (rand == 0) {
                let x = randint(0, 7)
                let y = randint(0, 7)
                let randweight = getRandomFloat(-1, 1)
                newweights2[x][y] = [randweight, randweight, -2][randint(0, 2)]//скрытый слой также мутирует только в ходе эволюции
            } else {
                hidden[randint(0, 7)] = ["s", "p", "r"][randint(0, 2)]
            }
            //создаем существо впереди себя
            return new creature(rotations[this.o](this.x, this.y).x, rotations[this.o](this.x, this.y).y, randint(1, 4), id,
                this.energy, newweights, newweights2, newresists, hidden, [this.rold, this.rold, this.rold, randint(100, 500)][randint[0, 3]])
        }
    }
    //запуск нейросети
    neuro(world, emap) {
        let prediction = []
        let prediction2 = []
        let goo = this.goo(world)
        let seegoo = this.seegoo(world)
        let sensors = [Number(this.see(emap) != -1 && this.see(emap) != "a"), goo[0] / 256, goo[1] / 256, goo[2] / 256, this.energy / 20, light / 2, seegoo[0] / 256, seegoo[1] / 256, seegoo[2] / 256, O2, CO2]
        for (let i = 0; i < 8; i++) {
            
            prediction.push(nfuncs[this.hidden[i]](sensors, this.weights[i]))
        }
        for (let i = 0; i < 8; i++) {
            
            prediction2.push(nfuncs['s'](prediction, this.weights2[i]))

        }
        return prediction2.indexOf(Math.max.apply(null, prediction2))
    }
}
//нейрон для скрытого слоя
class neuron {
    constructor(type, weights) {
        this.weights = weights
    }
    predict() {

    }
}
//стороны, в которые может смотреть бот
let rotations = {
    1: function (x, y) {
        if (x < height) {
            return { x: x + 1, y: y }
        }
        else {
            return { x: 1, y: y }
        }
    },
    2: function (x, y) {
        if (x > 1) {
            return { x: x - 1, y: y }
        }
        else {
            return { x: height, y: y }
        }
    },
    3: function (x, y) {
        if (y < width) {
            return { x: x, y: y + 1 }
        }
        else {
            return { x: x, y: 1 }
        }
    },
    4: function (x, y) {
        if (y > 1) {
            return { x: x, y: y - 1 }
        }
        else {
            return { x: x, y: width }
        }
    }
}