import { createHash } from 'crypto'
import { getTimestamp } from '../../lib/helpers/timestamp'
import { Transaction } from './Transactions'

export interface IBlock {
  index: number
  timestamp: number
  transactions: Transaction[]
  previousHash: string
  hash: string
  nonce: number
}

export class Block {
  // Properties of a block
  public index: number
  public timestamp: number
  public transactions: Transaction[]
  public previousHash: string
  public hash: string
  public nonce: number

  constructor({ index, timestamp, transactions, previousHash, hash, nonce }: IBlock) {
    this.index = index
    this.timestamp = timestamp
    this.transactions = transactions
    this.previousHash = previousHash
    this.hash = hash
    this.nonce = nonce
  }

  /**
   * This method iterates over the transactions in the block and concatenates the transaction
   * data into a string. It then calculates the hash of the block by hashing the block's
   * index, previous hash, timestamp, transaction data, and nonce using the createHash function.
   */
  public calculateHash(): string {
    let transactionData = ''
    for (const transaction of this.transactions) {
      transactionData +=
        transaction.sender.getPublicKey() +
        transaction.receiver.getPublicKey() +
        transaction.amount +
        transaction.mask +
        transaction.signature +
        getTimestamp() +
        this.nonce
    }
    return createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + transactionData + this.nonce)
      .digest('hex')
  }

  mine() {
    while (!this.hash.startsWith('000')) {
      this.nonce++
      this.hash = this.calculateHash()
    }
    return this
  }
}
