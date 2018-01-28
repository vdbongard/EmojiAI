const canvas = document.getElementById('main')
const ctx = canvas.getContext('2d')

const gridCount = 32
const canvasSize = canvas.parentElement.clientWidth - (canvas.parentElement.clientWidth % gridCount)

canvas.width = canvas.height = canvasSize

const cellSize = canvasSize / gridCount

ctx.fillStyle = 'rgba(0,0,0,0.87)'

const cells = []

let pointerdown = false

window.addEventListener('pointerdown', (e) => {
  drawRect(e)
  pointerdown = true
})

window.addEventListener('pointermove', (e) => {
  if (pointerdown) {
    drawRect(e)
  }
})

window.addEventListener('pointerup', (e) => {
  pointerdown = false
})

function drawRect (e) {
  const x = e.clientX + window.scrollX - canvas.offsetLeft
  const y = e.clientY + window.scrollY - canvas.offsetTop

  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
    const cellNumberX = Math.max(0, Math.min(gridCount, Math.floor(x / cellSize)))
    const cellNumberY = Math.max(0, Math.min(gridCount, Math.floor(y / cellSize)))

    if (!cells[cellNumberX*gridCount+cellNumberY]) {
      console.log(cellNumberX, cellNumberY, cellNumberX*gridCount+cellNumberY)

      ctx.fillRect(cellNumberX*cellSize, cellNumberY*cellSize, cellSize, cellSize)
      cells[cellNumberX*gridCount+cellNumberY] = 1
    }
  }
}