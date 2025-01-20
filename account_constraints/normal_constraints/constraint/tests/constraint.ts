import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Constraint } from "../target/types/constraint";
import { Keypair } from "@solana/web3.js";
import assert from "assert";

describe("constraint", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.Constraint as Program<Constraint>;

  const key1 = new Keypair();
  const key2 = new Keypair();

  before(async () => {
    // initialize two accounts
    await program.methods.initialize(32, 64)
      .accounts({
        signer: wallet.publicKey,
        account1: key1.publicKey,
        account2: key2.publicKey,
      }).signers([key1, key2])
      .rpc();
  })


  it("Pass the cumstom constraint", async () => {
    assert(
      (await program.account.accountData.fetch(key1.publicKey)).i < (await program.account.accountData.fetch(key2.publicKey)).i
    );

    await program.methods.customConstraint()
      .accounts({
        account1: key1.publicKey,
        account2: key2.publicKey,
      })
      .rpc();
  });

  it("Fail with the cumstom constraint", async () => {
    try {
      await program.methods.customConstraint()
        .accounts({
          account1: key2.publicKey,
          account2: key1.publicKey,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: account1. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated."
      )
    }
  });
});
