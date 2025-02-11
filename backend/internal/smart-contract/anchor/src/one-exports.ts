// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import OneIDL from '../target/idl/one.json'
import type { One } from '../target/types/one'

// Re-export the generated IDL and type
export { One, OneIDL }

// The programId is imported from the program IDL.
export const ONE_PROGRAM_ID = new PublicKey(OneIDL.address)

// This is a helper function to get the One Anchor program.
export function getOneProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...OneIDL, address: address ? address.toBase58() : OneIDL.address } as One, provider)
}

// This is a helper function to get the program ID for the One program depending on the cluster.
export function getOneProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the One program on devnet and testnet.
      return new PublicKey('CsrCMpn2jbypJKptFtEoYwdUUoQwYfgia6gbCtS58D6H')
    case 'mainnet-beta':
    default:
      return ONE_PROGRAM_ID
  }
}
