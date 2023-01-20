import { createHash } from 'crypto'
import ec from 'elliptic'

const elliptic = new ec.ec('secp256k1')

// TODO need the actual implementation
// A class to represent a member of the ring
export class RingMember {
  public keypair: ec.ec.KeyPair
  constructor(privateKey: string) {
    this.keypair = elliptic.keyFromPrivate(privateKey, 'hex')
  }
  public getPublicKey(): string {
    return this.keypair.getPublic('hex')
  }
}
