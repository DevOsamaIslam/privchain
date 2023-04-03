import { Block } from '../../modules/blockchain/Block'
import { IBalances } from './blockchain'

export const MESSAGE_TYPES = {
  JOIN: 'join',
  MEMPOOL: 'mempool',
  NEW_TRANSACTION: 'new-transaction',
  CHAIN: 'chain',
  NEW_BLOCK: 'new-block',
  BLOCKS: 'blocks',
} as const

export interface IMessage<T = any> {
  type: keyof typeof MESSAGE_TYPES
  payload: T
}

export interface IChainPayload {
  chain: Block[]
  balances: IBalances
}
