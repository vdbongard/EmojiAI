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
}

function train () {

}

function clearCanvas () {
  cells.fill(0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}
