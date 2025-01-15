import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { MutConstraint } from "../target/types/mut_constraint";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import assert from "assert";

describe("mut_constraint", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.MutConstraint as Program<MutConstraint>;

  it("Mut constraint", async () => {
    const toKey = new Keypair();
    const transferAmount = new BN(1 * LAMPORTS_PER_SOL);

    const txSig = await program.methods
      .mutConstraint(transferAmount)
      .accounts({
        from: wallet.publicKey,
        to: toKey.publicKey,
      })
      .rpc();

    console.log("Your transaction signature", txSig);

    const balance = await provider.connection.getBalance(toKey.publicKey);
    console.log(`${toKey.publicKey} balance: ${balance}`);
    assert.equal(balance, transferAmount);
  });
});
