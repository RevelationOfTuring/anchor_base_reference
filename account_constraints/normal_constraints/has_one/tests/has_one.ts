import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { HasOne } from "../target/types/has_one";
import assert from "assert"
import { Keypair, sendAndConfirmTransaction } from "@solana/web3.js";

describe("has_one", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.HasOne as Program<HasOne>;

  const accountKey = new Keypair();

  it("Initialize account and update data", async () => {
    const i = new BN(1024);
    await program.methods.initialize(i)
      .accounts({
        signer: wallet.publicKey,
        newAccount: accountKey.publicKey,
      })
      .signers([accountKey])
      .rpc();

    const newI = new BN(2048);
    await program.methods.updateData(newI)
      .accounts({
        owner: wallet.publicKey,
        existingAccount: accountKey.publicKey,
      })
      .rpc();

    const accData = await program.account.accountData.fetch(accountKey.publicKey);
    assert(accData.i.eq(newI));
    assert.equal(accData.owner.toBase58(), wallet.publicKey.toBase58());
  });

  it("Fail to update with has_one constraint", async () => {
    const other = new Keypair();
    // build transaction
    const transaction = await program.methods.updateData(new BN(1))
      .accounts({
        owner: other.publicKey,
        existingAccount: accountKey.publicKey,
      })
      .transaction();

    try {
      await sendAndConfirmTransaction(
        provider.connection,
        transaction,
        [
          // transaction fee payer
          wallet.payer,
          // include as 'owner' to satisfy signer check
          other,
        ]
      );
    } catch (err) {
      assert.strictEqual(
        err.transactionLogs[2],
        "Program log: AnchorError caused by account: existing_account. Error Code: ConstraintHasOne. Error Number: 2001. Error Message: A has one constraint was violated."
      );
    }
  })
});
