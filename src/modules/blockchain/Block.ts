import { createHash } from 'crypto'
import { Transaction } from '../Transactions'

export class Block {
  // Properties of a block
  public index: number
  public timestamp: number
  public transactions: Transaction[]
  public previousHash: string
  public hash: string
  public nonce: number

  constructor(index: number, timestamp: number, transactions: Transaction[], previousHash: string, hash: string, nonce: number) {
    this.index = index
    this.timestamp = timestamp
    this.transactions = []
    for (const transaction of transactions) {
      this.transactions.push(transaction)
    }
    this.previousHash = previousHash
    this.hash = hash
    this.nonce = nonce
  }

  // Method to calculate the hash of a block
  public calculateHash(): string {
    let transactionData = ''
    for (const transaction of this.transactions) {
      transactionData +=
        transaction.sender.publicKey + transaction.receiver.publicKey + transaction.amount + transaction.mask + transaction.signature
    }
    return createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + transactionData + this.nonce)
      .digest('hex')
  }
}
