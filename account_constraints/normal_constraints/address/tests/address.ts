import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Address } from "../target/types/address";
import "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import assert from "assert";

describe("address", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Address as Program<Address>;
  const accountKey = new Keypair();

  it("initialized account and update data", async () => {
    const i = new BN(1024);
    await program.methods.initialize(i)
      .accounts({
        signer: wallet.publicKey,
        newAccount: accountKey.publicKey,
      })
      .signers([accountKey])
      .rpc();

    let accountData = await program.account.accountData.fetch(accountKey.publicKey);
    assert(accountData.i.eq(i));
    assert(accountData.pubkey.equals(wallet.publicKey));

    const new_i = new BN(2048);
    await program.methods.updateData(new_i)
      .accounts({
        signer: wallet.publicKey,
        existingAccount: accountKey.publicKey,
      })
      .rpc();

    accountData = await program.account.accountData.fetch(accountKey.publicKey);
    assert(accountData.i.eq(new_i));
    assert(accountData.pubkey.equals(wallet.publicKey));
  });

  it("Fail with violating the address constraint", async () => {
    const other = new Keypair();
    try {
      await program.methods.updateData(new BN(0))
        .accounts({
          signer: other.publicKey,
          existingAccount: accountKey.publicKey,
        })
        .signers([other])
        .rpc();
    } catch (err) {
      assert.strictEqual(err.logs[2], `Program log: AnchorError caused by account: signer. Error Code: ConstraintAddress. Error Number: 2012. Error Message: An address constraint was violated.`)
    }
  });

  it("Pass the address constraint for hardcoded pubkey", async () => {
    const hardcodedPk = new PublicKey("2T1aDaVU4TFABpGUYipPQACLsL8WfAcMaUQuRK8B4itX");
    assert(wallet.publicKey.equals(hardcodedPk));

    await program.methods.onlyHardcoded()
      .accounts({
        signer: wallet.publicKey,
        existingAccount: accountKey.publicKey,
      })
      .rpc();
  });

  it("Fail with the address constraint for hardcoded pubkey", async () => {
    const other = new Keypair();

    try {
      await program.methods.onlyHardcoded()
        .accounts({
          account: other.publicKey
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(err.logs[2], `Program log: AnchorError caused by account: account. Error Code: ConstraintAddress. Error Number: 2012. Error Message: An address constraint was violated.`)
    }
  });
});
