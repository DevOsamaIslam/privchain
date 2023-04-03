import { createHash } from 'crypto'
import { ec } from 'elliptic'
import { RingMember } from '../privacy/RingSignature'

const elliptic = new ec('secp256k1')

// A class to represent a transaction
export class Transaction {
  public sender: RingMember
  public receiver: RingMember
  public amount: number
  public ring: RingMember[]
  public mask: string
  public signature: ec.Signature | undefined

  constructor(sender: RingMember, receiver: RingMember, amount: number, ring: RingMember[], mask: string) {
    this.sender = sender
    this.receiver = receiver
    this.amount = amount
    this.ring = ring
    this.mask = mask
    const signature = this.createSignature()
    if (!signature) return

    this.signature = signature
  }

  public createSignature(): ec.Signature | undefined {
    if (this.sender.getPublicKey()) {
      const hash = createHash('sha256')
        .update(this.sender.getPublicKey() + this.mask + this.ring.map(member => member.getPublicKey()).join(','))
        .digest(`hex`)
      return this.sender.keypair.sign(hash, 'base64')
    }
  }

  public verifySignature(): boolean | undefined {
    if (!this.signature) return
    const hash = createHash('sha256')
      .update(this.sender.getPublicKey() + this.mask + this.ring.map(member => member.getPublicKey()).join(','))
      .digest('hex')
    return this.sender.keypair.verify(hash, this.signature)
  }
}
