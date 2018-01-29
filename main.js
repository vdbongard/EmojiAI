const canvas = document.getElementById('main')
const ctx = canvas.getContext('2d')
ctx.fillStyle = 'rgba(0,0,0,0.87)'

const gridCount = 32

const canvasSize = canvas.parentElement.clientWidth - (canvas.parentElement.clientWidth % gridCount)
canvas.width = canvas.height = canvasSize

const cellSize = canvasSize / gridCount

const cells = new Array(gridCount * gridCount).fill(0)

let down = false

window.addEventListener('pointerdown', e => {
  drawRect(e)
  down = true
})

window.addEventListener('pointermove', e => {
  if (down) {
    drawRect(e)
  }
})

window.addEventListener('pointerup', () => {
  down = false
})

function drawRect (e) {
  const x = e.clientX + window.scrollX - canvas.offsetLeft
  const y = e.clientY + window.scrollY - canvas.offsetTop

  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
    const cellNumberX = Math.floor(x / cellSize)
    const cellNumberY = Math.floor(y / cellSize)

    if (!cells[cellNumberX * gridCount + cellNumberY]) {
      ctx.fillRect(cellNumberX * cellSize, cellNumberY * cellSize, cellSize, cellSize)

      cells[cellNumberX * gridCount + cellNumberY] = 1
    }
  }
}

function test () {
  nn.test(cells)
}

function train1 () {
  nn.addTrainingData(cells.slice(0), 0)
}

function train2 () {
  nn.addTrainingData(cells.slice(0), 1)
}

function clearCanvas () {
  cells.fill(0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

// Neural Network

function sigmoid (x, derivative) {
  if (derivative) {
    return numeric.mul(x, numeric.sub(1, x))
  }
  return numeric.div(1, numeric.add(1, numeric.exp(numeric.neg(x))))
}

class MyNeuralNetwork {
  constructor () {
    this.inputNeurons = gridCount * gridCount
    this.hiddenNeurons = 6
    this.outputNeurons = 2
    this.weights0 = []
    this.weights1 = []
    this.input = []
    this.output = []

    this.initWeights()
  }

  initWeights () {
    const tmpRandom = Math.random
    Math.random = () => {
      return 2 * tmpRandom() - 1
    }

    this.weights0 = numeric.random([this.inputNeurons, this.hiddenNeurons])
    this.weights1 = numeric.random([this.hiddenNeurons, this.outputNeurons])

    Math.random = tmpRandom
  }

  addTrainingData (input, output) {
    this.input.push(input)

    if (output === 0) {
      this.output.push([1, 0])
    } else if (output === 1) {
      this.output.push([0, 1])
    }

    this.train()
  }

  train () {
    for (let i = 0; i < 1000; i++) {
      let l0 = this.input
      let l1 = sigmoid(numeric.dot(l0, this.weights0))
      let l2 = sigmoid(numeric.dot(l1, this.weights1))

      const l2_error = numeric.sub(this.output, l2)

      if ((i % 100) === 0) {
        let sum_avg = 0
        for (let j = 0; j < l2_error.length; j ++) {
          const abs = numeric.abs(l2_error[j])

          let sum = 0
          for (let k = 0; k < abs.length; k++) {
            sum += abs[k]
          }
          sum_avg += sum / abs.length
        }
        const avg = sum_avg / l2_error.length

        console.log('Error: ', avg)
      }

      const l2_delta = numeric.mul(l2_error, sigmoid(l2, true))

      const l1_error = numeric.dot(l2_delta, numeric.transpose(this.weights1))

      const l1_delta = numeric.dot(l1_error, sigmoid(l1, true))

      this.weights1 = numeric.add(this.weights1, numeric.dot(numeric.transpose(l1), l2_delta))
      this.weights0 = numeric.add(this.weights0, numeric.dot(numeric.transpose(l0), l1_delta))

    }

    let l0 = this.input
    let l1 = sigmoid(numeric.dot(l0, this.weights0))
    let l2 = sigmoid(numeric.dot(l1, this.weights1))

    console.log('output after training: ', l2)
  }

  test (input) {
    let l0 = input
    let l1 = sigmoid(numeric.dot(l0, this.weights0))
    let l2 = sigmoid(numeric.dot(l1, this.weights1))

    console.log(l2)

    return l2
  }
}

const nn = new MyNeuralNetwork()

