import { createHash } from 'crypto'
import { Network } from '../network/Network'
import { RingMember } from '../privacy/RingSignature'
import { Transaction } from '../Transactions'
import { Block } from './Block'
import { MINING_DIFFICULTY, MINING_INTERVAL, MINING_REWARD } from '../../app/config'

export class Blockchain {
  private network: Network
  public chain: Block[]
  public totalSupply: number
  public miningReward = MINING_REWARD
  public miningDifficulty = MINING_DIFFICULTY
  public miningInterval = MINING_INTERVAL
  public balances: { [key: string]: number } = {}
  public pendingTransactions: Transaction[]
  genesisMember: RingMember

  constructor(genesisMember: RingMember, network: Network) {
    this.network = network
    this.genesisMember = genesisMember
    this.totalSupply = 10000000
    this.pendingTransactions = []
    this.chain = [this.createGenesisBlock()]
  }

  // Method to create the Genesis block (initial block)
  public createGenesisBlock(): Block {
    const genesisTransaction = new Transaction(this.genesisMember, this.genesisMember, 0, [], '')
    const genesisBlock = new Block(0, Date.now(), [genesisTransaction], '', '', 0)
    this.balances = {
      [genesisTransaction.sender.publicKey]: this.totalSupply,
    }
    return genesisBlock
  }

  public createCoinbaseTransaction(miner: RingMember, reward: number): Transaction {
    return new Transaction(this.genesisMember, miner, reward, [miner], '')
  }

  // Method to get the latest block in the chain
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  // Method to add a new block to the chain
  public addBlock(newBlock: Block): void {
    newBlock.previousHash = this.getLatestBlock().hash
    newBlock.hash = newBlock.calculateHash()
    this.chain.push(newBlock)

    // Update the balances of the ring members based on the transactions in the new block
    newBlock.transactions.forEach(transaction => {
      this.balances[transaction.sender.publicKey] -= transaction.amount
      // this.balances[transaction.receiver.publicKey]
      if (!this.balances[transaction.receiver.publicKey]) {
        this.balances[transaction.receiver.publicKey] = transaction.amount
      } else this.balances[transaction.receiver.publicKey] += transaction.amount
    })

    // Add new block to the list of blocks
    this.chain.push(newBlock)
    this.network.broadcastLatest()
  }

  /**
   * This method iterates over the transactions in the block and concatenates the transaction
   * data into a string. It then calculates the hash of the block by hashing the block's
   * index, previous hash, timestamp, transaction data, and nonce using the createHash function.
   */
  public calculateHashForBlock(block: Block): string {
    let transactionData = ''
    for (const transaction of block.transactions) {
      transactionData +=
        transaction.sender.publicKey + transaction.receiver.publicKey + transaction.amount + transaction.mask + transaction.signature
    }
    return createHash('sha256')
      .update(block.index + block.previousHash + block.timestamp + transactionData + block.nonce)
      .digest('hex')
  }

  // Method to check if the chain is valid
  public isValidChain(chain: Block[]): boolean {
    // Check if the chain is empty
    if (chain.length === 0) {
      return false
    }

    // Check if the first block in the chain is the Genesis block
    if (chain[0].hash !== this.createGenesisBlock().hash) {
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

  // Method to mine new blocks
  public mineBlock(miner: RingMember) {
    const lastBlockTimestamp = this.getLatestBlock().timestamp
    if (Date.now() - lastBlockTimestamp >= this.miningInterval) {
      const coinbaseTransaction = this.createCoinbaseTransaction(miner, this.miningReward)
      this.pendingTransactions.unshift(coinbaseTransaction)
      const newBlock = new Block(
        this.getLatestBlock().index + 1,
        Date.now(),
        this.pendingTransactions,
        this.getLatestBlock().hash,
        '',
        0,
      )

      // Proof of Work
      let nonce = 0
      console.time('proof-of-work')
      while (!this.isValidProof(newBlock.hash, nonce)) {
        nonce++
        newBlock.nonce = nonce
        newBlock.hash = newBlock.calculateHash()
      }
      console.timeEnd('proof-of-work')
      console.log(`Block mined: ${newBlock.hash}`)
      this.addBlock(newBlock)
      this.pendingTransactions = []
      return newBlock
    } else {
      console.log('Block time is less than 10 minutes, wait for next block...')
    }
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
    } else if (this.calculateHashForBlock(block) !== block.hash) {
      console.log(`${block.hash} ${this.calculateHashForBlock(block)} Invalid hash:`)
      return false
    } else if (!this.isValidProof(block.hash, block.nonce)) {
      console.log('Invalid proof')
      return false
    }
    return true
  }

  // Method to check if a block hash satisfies the difficulty requirement
  public isValidProof(hash: string, nonce: number): boolean {
    const guess = `${hash}${nonce}`
    const guessHash = createHash('sha256').update(guess).digest('hex')
    return guessHash.substring(0, this.miningDifficulty) === '0'.repeat(this.miningDifficulty)
  }

  public isValidTransaction(transaction: Transaction): boolean {
    // check if the transaction has a valid signature
    if (!transaction.verifySignature()) {
      console.log('Invalid signature')
      return false
    }

    // check if the sender has enough balance to send the amount
    if (this.balances[transaction.sender.publicKey] < transaction.amount) {
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

    if (this.balances[transaction.sender.publicKey] < transaction.amount) {
      console.log('Insufficient funds')
      return false
    }

    // Other validation checks here

    this.pendingTransactions.push(transaction)
    return true
  }
}
