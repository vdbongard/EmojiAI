const express = require('express')
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const numeric = require('numeric')

const app = express()
let db

app.use(bodyParser.json())

MongoClient.connect('mongodb://emoji-ai:mongodatabasepasswordemojiai@ds245238.mlab.com:45238/emoji-ai', (err, client) => {
  if (err) return console.log(err)

  db = client.db('emoji-ai')

  db.collection('emojis').find().toArray((err, docs) => {
    console.log('Training ' + docs.length + ' emojis.')

    nn = new MyNeuralNetwork()

    for (let emoji of docs) {
      nn.addTrainingData(emoji.input, emoji.output)
    }

    nn.train()
  })

  app.listen(3000, function () {
    console.log('listening on 3000')
  })
})

app.use(express.static('public'))

app.post('/add-training-sample', (req, res) => {
  db.collection('emojis').insert(req.body, (err) => {
    if (err) return console.log(err)
    console.log('saved emoji')
    res.sendStatus(200)
  })
})

app.post('/test', (req, res) => {
  const result = nn.test(req.body)
  res.send({result: result})
})

app.get('/train', (req, res) => {
  db.collection('emojis').find().toArray((err, docs) => {
    console.log('Training ' + docs.length + ' emojis.')

    nn = new MyNeuralNetwork()

    for (let emoji of docs) {
      nn.addTrainingData(emoji.input, emoji.output)
    }

    const error = nn.train()

    res.send({ error: error})
  })
})

// Neural Network
const gridCount = 32

function linear (x, derivative) {
  if (derivative) {
    return numeric.rep(numeric.dim(x), 1)
  }
  return x
}

function logistic (x, derivative) {
  if (derivative) {
    return numeric.mul(x, numeric.sub(1, x))
  }
  return numeric.div(1, numeric.add(1, numeric.exp(numeric.neg(x))))
}

function tanh (x, derivative) {
  if (derivative) {
    return numeric.sub(1, numeric.mul(tanh(x, false), tanh(x, false)))
  }
  return numeric.div(numeric.sub(numeric.exp(x), numeric.exp(numeric.neg(x))),
                     numeric.add(numeric.exp(x), numeric.exp(numeric.neg(x))))
}

activation = logistic

class MyNeuralNetwork {
  constructor () {
    this.inputNeurons = gridCount * gridCount
    this.hiddenNeurons = 15
    this.outputNeurons = 7
    this.learningRate = 0.01
    this.iterations = 2001
    this.errorThreshold = 0.01
    this.momentum = 0.75
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
    this.output.push(output)
  }

  train () {
    let avg
    let w1_delta, w0_delta, w1_delta_prev, w0_delta_prev
    for (let i = 0; i < this.iterations; i++) {
      let l0 = this.input
      let l1 = activation(numeric.dot(l0, this.weights0))
      let l2 = activation(numeric.dot(l1, this.weights1))

      const l2_error = numeric.sub(this.output, l2)

      if (((i) % 100) === 0) {
        let sum_avg = 0
        for (let j = 0; j < l2_error.length; j ++) {
          const abs = numeric.abs(l2_error[j])

          let sum = 0
          for (let k = 0; k < abs.length; k++) {
            sum += abs[k]
          }
          sum_avg += sum / abs.length
        }
        avg = sum_avg / l2_error.length

        console.log('Error: ', avg, ' Iteration: ', i)

        if (avg < this.errorThreshold) {
          return;
        }
      }

      const l2_delta = numeric.mul(l2_error, activation(l2, true))

      const l1_error = numeric.dot(l2_delta, numeric.transpose(this.weights1))

      const l1_delta = numeric.dot(l1_error, activation(l1, true))

      w1_delta = numeric.mul(this.learningRate, numeric.dot(numeric.transpose(l1), l2_delta))
      w0_delta = numeric.mul(this.learningRate, numeric.dot(numeric.transpose(l0), l1_delta))

      if (this.momentum > 0 && w1_delta_prev && w0_delta_prev) {
        w1_delta = numeric.add(w1_delta, numeric.mul(this.momentum, w1_delta_prev))
        w0_delta = numeric.add(w0_delta, numeric.mul(this.momentum, w0_delta_prev))

        w1_delta_prev = w1_delta
        w0_delta_prev = w0_delta
      }

      this.weights1 = numeric.add(this.weights1, w1_delta)
      this.weights0 = numeric.add(this.weights0, w0_delta)
    }

    console.log('finished training')
    return avg
  }

  test (input) {
    let l0 = input
    let l1 = activation(numeric.dot(l0, this.weights0))
    let l2 = activation(numeric.dot(l1, this.weights1))

    console.log(l2)

    return l2
  }
}

let nn = new MyNeuralNetwork()