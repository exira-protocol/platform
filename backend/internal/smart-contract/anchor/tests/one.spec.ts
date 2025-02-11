import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {One} from '../target/types/one'

describe('one', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.One as Program<One>

  const oneKeypair = Keypair.generate()

  it('Initialize One', async () => {
    await program.methods
      .initialize()
      .accounts({
        one: oneKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([oneKeypair])
      .rpc()

    const currentCount = await program.account.one.fetch(oneKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment One', async () => {
    await program.methods.increment().accounts({ one: oneKeypair.publicKey }).rpc()

    const currentCount = await program.account.one.fetch(oneKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment One Again', async () => {
    await program.methods.increment().accounts({ one: oneKeypair.publicKey }).rpc()

    const currentCount = await program.account.one.fetch(oneKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement One', async () => {
    await program.methods.decrement().accounts({ one: oneKeypair.publicKey }).rpc()

    const currentCount = await program.account.one.fetch(oneKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set one value', async () => {
    await program.methods.set(42).accounts({ one: oneKeypair.publicKey }).rpc()

    const currentCount = await program.account.one.fetch(oneKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the one account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        one: oneKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.one.fetchNullable(oneKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
