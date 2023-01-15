import { IMessage } from '../../lib/@types/websocket'
import { Block } from '../blockchain/Block'
import { Blockchain } from '../blockchain/Blockchain'
import { Transaction } from '../Transactions'
import { WebSocketClient } from './WebSocketClient'

export class Network {
  private socketClient: WebSocketClient
  public blockchain: Blockchain | undefined
  private sockets: WebSocketClient[] = []
  constructor(peerUrl: string) {
    this.socketClient = new WebSocketClient(peerUrl)
    this.socketClient.onOpen(() => {
      console.log('WebSocket connection opened')
    })
    this.socketClient.onMessage(data => {
      console.log('Received message: ', data)
      this.handleMessage(data)
    })
    this.socketClient.onClose(() => {
      console.log('WebSocket connection closed')
    })
    this.connectToPeer('ws://example.com')
  }

  public attachBlockchain(blockchain: Blockchain) {
    this.blockchain = blockchain
  }

  // function to connect to a new peer
  public connectToPeer(peerUrl: string) {
    this.sockets.push(new WebSocketClient(peerUrl))
    this.sockets[this.sockets.length - 1].onOpen = () => {
      console.log(`Connected to ${peerUrl}`)
    }
    this.sockets[this.sockets.length - 1].onMessage = event => {
      // this.handleMessage()
    }
    this.sockets[this.sockets.length - 1].onClose = () => {
      console.log(`Disconnected from ${peerUrl}`)
    }
  }

  // function to broadcast the latest blockchain to all connected peers
  public broadcastLatest(): void {
    if (!this.blockchain) return
    const latestBlock = this.blockchain.getLatestBlock()
    const data = JSON.stringify({ type: 'block', data: latestBlock })
    this.sockets.forEach(socket => {
      socket.send(data)
    })
  }

  public handleNewBlock(block: Block) {
    if (!this.blockchain) return
    // check if the received block is valid and if it's a valid addition to the current chain
    if (this.blockchain.isValidBlock(block)) {
      // if so, add it to the chain
      this.blockchain.addBlock(block)
    }
    // else if (block.index > this.blockchain.getLatestBlock().index) {
    //   // if the received block has a greater index than the current chain, it means that it's a longer chain
    //   // in this case, we switch to the longer chain
    //   this.handleChainSwitch(block)
    // }
  }

  public handleChainSwitch(receivedChain: Block[]): void {
    if (!this.blockchain) return
    // Check if the received chain is longer than the current one
    if (receivedChain.length > this.blockchain.chain.length) {
      // Check if the received chain is valid
      if (this.blockchain.isValidChain(receivedChain)) {
        console.log('Received a valid chain. Switching to new chain...')
        this.blockchain.chain = receivedChain
        this.broadcastLatest()
      } else {
        console.log('Received an invalid chain. Keeping current chain...')
      }
    } else {
      console.log('Received chain is not longer than current chain. Keeping current chain...')
    }
  }

  public handleNewTransaction(transaction: Transaction) {
    if (!this.blockchain) return
    // validate the transaction
    if (!transaction.verifySignature()) {
      console.log('Invalid signature on transaction')
      return
    }

    if (!this.blockchain.isValidTransaction(transaction)) {
      console.log('Invalid transaction')
      return
    }

    // add it to the pending transactions pool
    this.blockchain.pendingTransactions.push(transaction)
    console.log(`Transaction added to pending pool: ${transaction}`)
  }

  private handleMessage(data: string) {
    const message: IMessage = JSON.parse(data)
    // switch (message.type) {
    //   case 'block':
    //     this.handleNewBlock(message.data)
    //     break
    //   case 'transaction':
    //     this.handleNewTransaction(message.data)
    //     break
    //   case 'chain':
    //     this.handleChainSwitch(message.data)
    //     break
    // }
  }
}
