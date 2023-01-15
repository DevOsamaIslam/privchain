import { createHash } from 'crypto'
import { ec } from 'elliptic'
import { RingMember } from './privacy/RingSignature'

const elliptic = new ec('secp256k1')

// A class to represent a transaction
export class Transaction {
  public sender: RingMember
  public receiver: RingMember
  public amount: number
  public ring: RingMember[]
  public mask: string
  public signature: ec.Signature

  constructor(sender: RingMember, receiver: RingMember, amount: number, ring: RingMember[], mask: string) {
    this.sender = sender
    this.receiver = receiver
    this.amount = amount
    this.ring = ring
    this.mask = mask
    this.signature = this.createSignature()
  }

  public createSignature(): ec.Signature {
    const hash = createHash('sha256')
      .update(this.sender.publicKey + this.mask + this.ring.map(member => member.publicKey).join(','))
      .digest(`hex`)

    return elliptic.sign(hash, this.sender.keypair)
  }

  public verifySignature(): boolean {
    const hash = createHash('sha256')
      .update(this.sender.publicKey + this.mask + this.ring.map(member => member.publicKey).join(','))
      .digest('hex')
    return elliptic.verify(hash, this.signature, this.sender.keypair)
  }
}
