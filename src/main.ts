import { Block } from './modules/blockchain/Block'
import { Blockchain } from './modules/blockchain/Blockchain'
import { Network } from './modules/network/Network'
import { RingMember } from './modules/privacy/RingSignature'
import { Transaction } from './modules/blockchain/Transactions'

const Tovia = new RingMember("Tovia's private key")

const Paul = new RingMember("Paul's private key")

const christen = new RingMember('christen_private_key')
const lesley = new RingMember('lesleys_private_key')
const abid = new RingMember('abids_private_key')
const baboucarr = new RingMember('baboucarr_private_key')
const clive = new RingMember('clive_private_key')

const ring = [Tovia, Paul, abid, christen, lesley, baboucarr, clive]

const blockchain = Blockchain.getInstance()

const network = new Network({ member: `ws://localhost:${process.env.PORT}`, blockchain })
// for (let i = 0; i < 100; i++) {
//   const isTransactionValid =
//     blockchain.addTransaction(new Transaction(Tovia, Paul, i + 10, ring, '')) &&
//     blockchain.addTransaction(new Transaction(Tovia, Paul, i + 10, ring, '')) &&
//     blockchain.addTransaction(new Transaction(Tovia, Paul, i + 10, ring, '')) &&
//     blockchain.addTransaction(new Transaction(Tovia, Paul, i + 10, ring, '')) &&
//     blockchain.addTransaction(new Transaction(Tovia, Paul, i + 10, ring, ''))
//   if (isTransactionValid) {
//     blockchain.mineBlock(abid)
//   }
// }

console.log({ blockchain: blockchain.chain[0], isValid: blockchain.isValidChain(blockchain.chain) })
