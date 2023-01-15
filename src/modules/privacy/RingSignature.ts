import { createHash } from 'crypto'
import ec from 'elliptic'

const elliptic = new ec.ec('secp256k1')
// TODO need the actual implementation
// A class to represent a member of the ring
export class RingMember {
  public keypair: ec.ec.KeyPair
  public publicKey: string
  constructor(privateKey: string) {
    this.keypair = elliptic.keyFromPrivate(privateKey, 'hex')
    this.publicKey = privateKey
  }

  public verify(data: string, signature: ec.ec.Signature): boolean {
    const hash = createHash('sha256').update(data).digest()
    return elliptic.verify(data, signature, this.keypair)
    //elliptic.verify(hash, sig, this.keypair)
  }

  public getPrivateKey(): string {
    return this.keypair.getPrivate().toString('hex')
  }
  public getPublicKey(): string {
    const pub = this.keypair.getPublic().encode('hex', true)
    return pub
  }
}
