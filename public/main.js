const emojis = ['🙂', '🙁', '😯', '😐', '😛', '❤️', '👍🏼']

const buttonWrapper = document.getElementById('trainingSampleButtons')
const predictionWrapper = document.getElementById('predictionWrapper')

emojis.forEach((emoji, index) => {
  const node = document.createElement('button')
  const textNode = document.createTextNode(emoji)

  node.appendChild(textNode)
  node.classList.add('waves-effect', 'waves-light', 'btn', 'emoji')
  node.addEventListener('click', () => {
    const output = new Array(emojis.length).fill(0)
    output[index] = 1
    post('/add-training-sample', {input: cells, output: output})
    clearCanvas()
  })

  buttonWrapper.appendChild(node)
})

const canvas = document.getElementById('main')
const ctx = canvas.getContext('2d')
ctx.fillStyle = 'rgba(0,0,0,0.87)'

const gridCount = 32

const canvasSize = Math.min(500, canvas.parentElement.clientWidth - (canvas.parentElement.clientWidth % gridCount))
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
  post('/test', cells, (data) => {
    data = JSON.parse(data)
    const node = document.createElement('span')
    const textNode = document.createTextNode(
      emojis[data.result.indexOf(Math.max(...data.result))] + ' (' + Math.round(Math.max(...data.result) * 100) + '%)'
    )

    console.log(data.result)

    node.appendChild(textNode)
    node.classList.add('emoji')

    // remove all child nodes
    while (predictionWrapper.firstChild) {
      predictionWrapper.removeChild(predictionWrapper.firstChild)
    }

    // add new emoji child node
    predictionWrapper.appendChild(node)
  })
}

function train () {
  get('/train')
}

function clearCanvas () {
  cells.fill(0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function post (url, data, cb) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', url, true)
  xhr.setRequestHeader('Content-type', 'application/json')
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      if (cb) cb(xhr.responseText)
      else console.log(xhr.responseText)
    }
  }
  xhr.send(JSON.stringify(data))
}

function get (url) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.setRequestHeader('Content-type', 'application/json')
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText)
    }
  }
  xhr.send()
}