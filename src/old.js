import React, { Component } from 'react';
import _ from 'underscore'
import './App.css';
import EventListener from 'react-event-listener';

const I = { blocks: [0x0F00, 0x2222, 0x00F0, 0x4444]};
const J = { blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20]};
const L = { blocks: [0x4460, 0x0E80, 0xC440, 0x2E00]};
const O = { blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00]};
const S = { blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620]};
const T = { blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640]};
const Z = { blocks: [0x0C60, 0x4C80, 0xC600, 0x2640]};


class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      width: 12,
      height: 25,
      interval: 0,
      time: 0,
      board: [],
      x: 0,
      y: 0,
      piece: I,
      oldPieceCells: [],
      dir: 0,
      isRunning: true,
      score: 0,
    }
  }

  checkPlacement = (x, y, width, height, board) => {
      return (x >= 0
        && x < width
        && y >= 0
        && y < height
        && board[y][x] === 0)
    }

  pieceCells = (x, y, piece, width, height, board, dir) => {
    const cells = []
    const orgX = x
    let count = 0
    for (let bit = 0x8000; bit > 0; bit = bit >> 1) {
      if (bit & piece.blocks[dir])
      {
        if (this.checkPlacement(x, y, width, height, board) === false)
          return false
        cells.push([x, y])
      }
      x++;
      if (++count % 4 === 0) {
        x = orgX
        y++
      }
    }
    return cells
  }

  placeCells = (board, cells, numToPlace) => {
    cells.forEach(cell => {
      board[cell[1]][cell[0]] = numToPlace
    })
  }

  newPiece = () => {
    return [I, J, L, O, S, T, Z][Math.floor(Math.random() * 7)]
  }

  removeFilledLines = (board, width, height) => {
    let b = board.filter(row => row.includes(0))
    const points = (height - b.length) * width
    while (b.length < height)
      b.unshift(_.map(_.range(0, width), () => 0))
    return {pointsScored: points, newBoard: b}
  }

  update = (xInc, yInc) => (prevState) => {
    const {x, y, width, height, board, piece, oldPieceCells, dir, score} = prevState 
    this.placeCells(board, oldPieceCells, 0)
    const cells = this.pieceCells(x + xInc, y + yInc, piece, width, height, board, dir)
    if (cells === false && xInc) {
      this.placeCells(board, oldPieceCells, 1)
    }
    else if (cells === false && yInc) {
      this.placeCells(board, oldPieceCells, 1)
      const {pointsScored, newBoard} = this.removeFilledLines(board, width, height)
      return ({
        board: newBoard,
        piece: this.newPiece(),
        x: width / 2,
        y: 0,
        oldPieceCells: [],
        score: score + pointsScored
      })
    }
    else {
      this.placeCells(board, cells, 1)
      return ({
        x: x + xInc,
        y: y + yInc,
        oldPieceCells: cells,
      })
    }
  }

  createBoard = (width, height) =>
    _.map(_.range(0, height), () =>
            _.map(_.range(0, width), () => 0))

  componentDidMount() {
    const {width, height} = this.state
    this.setState(() => {
      return ({
        x: width / 2,
        board: this.createBoard(width, height),
        interval: setInterval(() => this.setState(this.update(0, 1)), 1000),
        piece: this.newPiece(),
      })
      }
    )
  }

  componentWillUnmount() {
    this.pauseGame()
  }

  switchPieceDir = () => (prevState) => {
    const {x, y, piece, width, height, board, dir, oldPieceCells} = prevState
    const newDir = (dir + 1) % 4
    this.placeCells(board, oldPieceCells, 0)
    var r = this.pieceCells(x, y, piece, width, height, board, newDir)
    this.placeCells(board, oldPieceCells, 1)
    return {dir: r ? newDir : dir}
  }

  toggleRunning = () => (prevState) => {
    return {isRunning: !prevState.isRunning}
  }

  handleSpacebar = () => {
    this.setState(this.toggleRunning())
    this.state.isRunning ? this.startGame() : this.pauseGame()
  }

  handleAllKeysButSpacebar = (e) => {
    if (e.keyCode === 37)
      this.setState(this.update(-1, 0))
    else if (e.keyCode === 38)
      this.setState(this.switchPieceDir())
    else if (e.keyCode === 39)
      this.setState(this.update(1, 0))
    else if (e.keyCode === 40)
      this.setState(this.update(0, 1))
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 32)
      this.handleSpacebar()
    else if (this.state.isRunning)
      this.handleAllKeysButSpacebar(e)
  }

  startGame = () => {
    this.setState({
      interval: setInterval(() => this.setState(this.update(0, 1)), 1000),
      isRunning: true
    })
  }

  pauseGame = () => {
    clearInterval(this.state.interval);
    this.setState({isRunning: false})
  }

  render() {
    return (
      <div className='App'>
      <EventListener target='window' onKeyDown={(e) => this.handleKeyDown(e)}/>
      <h1>{this.state.score}</h1>
        <div className='board' onKeyDown={(e) => this.onKey(e)}>
          <Board
            width={this.state.width}
            height={this.state.height}
            board={this.state.board}
          >
          </Board>
        </div>
      </div>
    )
  }
}

const Boxes = (width, y, board) =>
  _.map(_.range(0, width), (x) =>
    <div
      className='box'
      key={width + x}
      style={{background: board && board[y] && board[y][x] ? 'blue' : 'white'}}
      >
    </div>)

const Board = ({width, height, board}) =>
  _.map(_.range(0, height), (y) =>
    <div
      className='row'
      key={y}
    >
      {Boxes(width, y, board)}
    </div>)


export default App;
