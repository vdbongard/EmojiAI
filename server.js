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

function sigmoid (x, derivative) {
  if (derivative) {
    return numeric.mul(x, numeric.sub(1, x))
  }
  return numeric.div(1, numeric.add(1, numeric.exp(numeric.neg(x))))
}

class MyNeuralNetwork {
  constructor () {
    this.inputNeurons = gridCount * gridCount
    this.hiddenNeurons = 15
    this.outputNeurons = 7
    this.learningRate = 0.1
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
        avg = sum_avg / l2_error.length

        console.log('Error: ', avg)
      }

      const l2_delta = numeric.mul(l2_error, sigmoid(l2, true))

      const l1_error = numeric.dot(l2_delta, numeric.transpose(this.weights1))

      const l1_delta = numeric.dot(l1_error, sigmoid(l1, true))

      this.weights1 = numeric.add(this.weights1, numeric.mul(this.learningRate, numeric.dot(numeric.transpose(l1), l2_delta)))
      this.weights0 = numeric.add(this.weights0, numeric.mul(this.learningRate, numeric.dot(numeric.transpose(l0), l1_delta)))

    }

    console.log('finished training')
    return avg
  }

  test (input) {
    let l0 = input
    let l1 = sigmoid(numeric.dot(l0, this.weights0))
    let l2 = sigmoid(numeric.dot(l1, this.weights1))

    console.log(l2)

    return l2
  }
}

let nn = new MyNeuralNetwork()