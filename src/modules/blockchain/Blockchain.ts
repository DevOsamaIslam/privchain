import { INITIAL_SUPPLY, MINING_INTERVAL, MINING_REWARD } from '../../app/config'
import { IBalances } from '../../lib/@types/blockchain'
import { getTimestamp } from '../../lib/helpers/timestamp'
import { RingMember } from '../privacy/RingSignature'
import { Block } from './Block'
import { Transaction } from './Transactions'

export class Blockchain {
  public chain: Block[]
  public initialSupply: number
  public miningReward = MINING_REWARD
  public miningDifficulty = 5
  public balances: IBalances = {}
  public mempool: Transaction[]
  static genesisMember: RingMember = new RingMember("Tovia's private key")
  private static instance: Blockchain

  static getInstance() {
    if (Blockchain.instance) {
      return Blockchain.instance
    }

    return new Blockchain()
  }
  private constructor() {
    this.initialSupply = INITIAL_SUPPLY
    this.mempool = []
    this.chain = [this.createGenesisBlock()]
  }

  // Method to create the Genesis block (initial block)
  public createGenesisBlock(): Block {
    const genesisTransaction = new Transaction(Blockchain.genesisMember, Blockchain.genesisMember, 0, [], '')
    const genesisBlock = new Block({
      index: 0,
      timestamp: getTimestamp(),
      transactions: [genesisTransaction],
      previousHash: '0'.repeat(64),
      hash: '',
      nonce: 0,
    })
    genesisBlock.hash = genesisBlock.calculateHash()
    genesisBlock.mine()
    this.balances = {
      [genesisTransaction.sender.getPublicKey()]: this.initialSupply,
    }
    return genesisBlock
  }

  public createCoinbaseTransaction(miner: RingMember): Transaction {
    return new Transaction(Blockchain.genesisMember, miner, this.miningReward, [miner], '')
  }

  // Method to get the latest block in the chain
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  // Method to mine new blocks
  public async mineBlock(miner: RingMember) {
    const coinbaseTransaction = this.createCoinbaseTransaction(miner)
    this.mempool.unshift(coinbaseTransaction)

    // Proof of Work
    let nonce = 0
    let timesFound = 0
    let proofFound = false
    let newBlock: Block | undefined = undefined
    const startTime = Date.now()
    console.time('proof-of-work')
    while (!proofFound || timesFound < this.miningDifficulty) {
      nonce++
      newBlock = new Block({
        index: this.getLatestBlock().index + 1,
        timestamp: getTimestamp(),
        transactions: [...this.mempool],
        previousHash: this.getLatestBlock().hash,
        hash: '',
        nonce,
      })
      newBlock.hash = newBlock.calculateHash()
      proofFound = this.isValidProof(newBlock.hash)
      if (proofFound) {
        timesFound++
      }
    }

    if (!newBlock) return

    console.timeEnd('proof-of-work')
    console.log(`Block mined: ${newBlock.hash} x${timesFound}`)
    if (Date.now() - startTime < MINING_INTERVAL) this.miningDifficulty++
    newBlock.transactions = [...this.mempool]
    this.addBlock(newBlock)
    this.mempool = []
    return newBlock
  }

  // Method to add a new block to the chain
  public addBlock(newBlock: Block): void {
    newBlock.previousHash = this.getLatestBlock().hash
    newBlock.hash = newBlock.calculateHash()

    // Update the balances of the ring members based on the transactions in the new block
    newBlock.transactions.forEach(transaction => {
      this.balances[transaction.sender.getPublicKey()] -= transaction.amount
      // this.balances[transaction.receiver.getPublicKey()]
      if (!this.balances[transaction.receiver.getPublicKey()]) {
        this.balances[transaction.receiver.getPublicKey()] = transaction.amount
      } else this.balances[transaction.receiver.getPublicKey()] += transaction.amount
    })

    // Add new block to the list of blocks
    this.chain.push(newBlock)
  }

  // Method to check if the chain is valid
  public isValidChain(chain: Block[]): boolean {
    // Check if the chain is empty
    if (chain.length === 0) {
      return false
    }

    // Check if the first block in the chain is the Genesis block
    if (chain[0].hash !== this.chain[0].hash) {
      return false
    }

    // Iterate through the chain and check that each block is correctly linked to the previous block
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i]
      const previousBlock = chain[i - 1]

      // Check if the previousHash of the current block matches the hash of the previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false
      }

      // Check if the current block's hash is correct
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false
      }
    }

    return true
  }

  // Method to check if a block is valid
  public isValidBlock(block: Block): boolean {
    const previousBlock = this.getLatestBlock()
    if (previousBlock.index + 1 !== block.index) {
      console.log('Invalid index')
      return false
    } else if (previousBlock.hash !== block.previousHash) {
      console.log('Invalid previous hash')
      return false
    } else if (block.calculateHash() !== block.hash) {
      console.log(`Invalid hash`)
      return false
    } else if (!this.isValidProof(block.hash)) {
      console.log('Invalid proof')
      return false
    }
    return true
  }

  // Method to check if a block hash satisfies the difficulty requirement
  public isValidProof(hash: string): boolean {
    return hash.startsWith('000')
  }

  public isValidTransaction(transaction: Transaction): boolean {
    // check if the transaction has a valid signature
    if (!transaction.verifySignature()) {
      console.log('Invalid signature')
      return false
    }

    // check if the sender has enough balance to send the amount
    if (this.balances[transaction.sender.getPublicKey()] < transaction.amount) {
      console.log('Sender has insufficient funds')
      return false
    }

    // check if the transaction has already been included in a previous block
    for (const block of this.chain) {
      for (const t of block.transactions) {
        if (transaction.signature === t.signature) {
          console.log('Transaction has already been included in a previous block')
          return false
        }
      }
    }
    return true
  }

  public addTransaction(transaction: Transaction): boolean {
    if (!transaction.verifySignature()) {
      console.log('Invalid signature')
      return false
    }

    if (this.balances[transaction.sender.getPublicKey()] < transaction.amount) {
      console.log('Insufficient funds')
      return false
    }

    // Other validation checks here

    this.mempool.push(transaction)
    return true
  }
}
