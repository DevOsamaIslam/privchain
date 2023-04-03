import WebSocket from 'ws'
import { IChainPayload, MESSAGE_TYPES } from '../../lib/@types/websocket'
import { Block } from '../blockchain/Block'
import { Blockchain } from '../blockchain/Blockchain'
import { Transaction } from '../blockchain/Transactions'
import { RingMember } from '../privacy/RingSignature'

interface INetwork {
  member: string
  blockchain: Blockchain
}

export class Network {
  member: string
  members: string[] = ['ws://localhost:5555']
  blockchain: Blockchain
  mempool: Transaction[] = []
  server = new WebSocket.Server({
    port: Number(process.env.PORT) || 5555,
  })
  socket: WebSocket

  constructor({ member, blockchain }: INetwork) {
    this.member = member
    this.members = []
    this.blockchain = blockchain
    this.mempool = blockchain.mempool
    this.socket = new WebSocket(`ws://localhost:${process.env.PORT || 5555}`)
    this.server.on('connection', socket => this.onConnection.apply(this, [socket]))
  }

  onConnection(socket: WebSocket) {
    console.log('The current node has joined the network')

    this.socket.on(MESSAGE_TYPES.JOIN, (message: string) => this.onJoin(message))

    this.members.forEach(member => {
      
    })
  }

  onJoin(member: string) {
    if (!process.env.PORT) return
    console.log('A new node has joined the network')
    this.members.push(member)
    const socket = new WebSocket(member)
    socket.on(MESSAGE_TYPES.NEW_BLOCK, (socket: WebSocket, block: Block) => this.onMined(socket, block))

    // socket.on(MESSAGE_TYPES.NEW_TRANSACTION, (socket: WebSocket, ...args: any[]) => this.onConnection(socket, args))

    socket.on(MESSAGE_TYPES.BLOCKS, (socket: WebSocket, ...args: any[]) => this.sendBlocks(socket, args))

    socket.on(MESSAGE_TYPES.MEMPOOL, (socket: WebSocket, ...args: any[]) => this.sendMempool(socket, args))
  }

  onChain(socket: WebSocket, { balances, chain }: IChainPayload) {
    console.log('We received a chain', chain)
    if (!this.blockchain.isValidChain(chain)) return

    if (chain.length > this.blockchain.chain.length) {
      this.blockchain.chain = chain
      this.blockchain.balances = balances
    }
  }

  requestBlocks(socket: WebSocket, blockIndices: number[]) {
    this.socket.emit(MESSAGE_TYPES.BLOCKS, blockIndices)
  }

  sendBlocks(socket: WebSocket, blockIndices: number[]) {
    // find the requested blocks and send them
    this.socket.emit(MESSAGE_TYPES.BLOCKS, blockIndices)
  }

  onMined(socket: WebSocket, block: Block) {
    console.log('onMinedBlock', block)
    this.socket.emit(MESSAGE_TYPES.NEW_BLOCK)
  }

  onNewBlock(socket: WebSocket, block: Block) {
    console.log('onMinedBlock', block)
  }

  onNewTransaction(socket: WebSocket, tx: Transaction) {
    console.log('onNewTransaction', tx)
    this.mempool.push(tx)

    // if (this.mempool.length > 5) this.blockchain.mineBlock(this.member)
  }

  sendMempool(socket: WebSocket, ...args: any[]) {
    this.socket.emit(MESSAGE_TYPES.MEMPOOL, this.mempool)
  }

  requestMempool(socket: WebSocket, ...args: any[]) {
    this.socket.emit(MESSAGE_TYPES.MEMPOOL, this.mempool)
  }
}
