import { Blockchain } from './modules/blockchain/Blockchain'
import { Network } from './modules/network/Network'
import { RingMember } from './modules/privacy/RingSignature'
import { Transaction } from './modules/Transactions'

const Tovia = new RingMember("Tovia's private key")

const Paul = new RingMember("Paul's private key")

const christen = new RingMember('christen_private_key')
const lesley = new RingMember('lesleys_private_key')
const abid = new RingMember('abids_private_key')
const baboucarr = new RingMember('baboucarr_private_key')
const clive = new RingMember('clive_private_key')

const ring = [Tovia, Paul, abid]

const transaction = new Transaction(Tovia, Paul, 10, ring, '')

const network = new Network('ws://localhost:8000')

const blockchain = new Blockchain(Tovia, network)

network.attachBlockchain(blockchain)

// network.handleNewBlock(newBlock)
// network.handleNewTransaction(newTransaction)

const isTransactionValid = blockchain.addTransaction(transaction)
if (isTransactionValid) {
  blockchain.mineBlock(abid)
}
