import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Owner } from "../target/types/owner";
import { Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import assert from "assert";

describe("owner", () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Owner as Program<Owner>;
  const accKey = new Keypair();

  before(async () => {
    // Get the minimum balance needed to exempt an account with 0 byte space from rent
    const rent = await connection.getMinimumBalanceForRentExemption(0);
    // Build the instruction to create a new account and set the program as its owner
    const instruction = SystemProgram.createAccount({
      // The account that will transfer lamports to the created account */
      fromPubkey: wallet.publicKey,
      // Public key of the created account
      newAccountPubkey: accKey.publicKey,
      // Amount of lamports to transfer to the created account
      lamports: rent,
      // Amount of space in bytes to allocate to the created account
      space: 0,
      // Public key of the program to assign as the owner of the created account
      programId: program.programId,
    });

    // Build transaction and send it
    const transaction = new Transaction().add(instruction);
    await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer, accKey],
    );
  });

  it("Pass owner constraint 1", async () => {
    await program.methods.ownerConstraint1()
      .accounts({
        account: accKey.publicKey,
      })
      .rpc();
  });

  it("Fail with owner constraint 1", async () => {
    // the owner of normal sol account is system program 11111111111111111111111111111111
    try {
      await program.methods.ownerConstraint1()
        .accounts({
          account: wallet.publicKey
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: account. Error Code: ConstraintOwner. Error Number: 2004. Error Message: An owner constraint was violated."
      );
    }
  });

  it("Pass owner constraint 2", async () => {
    // the owner of normal sol account is system program 11111111111111111111111111111111
    await program.methods.ownerConstraint2()
      .accounts({
        account: wallet.publicKey,
      })
      .rpc();
  });

  it("Fail with owner constraint 2", async () => {
    // the owner of account 'accKey' is current program
    try {
      await program.methods.ownerConstraint2()
        .accounts({
          account: accKey.publicKey
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: account. Error Code: ConstraintOwner. Error Number: 2004. Error Message: An owner constraint was violated."
      );
    }
  });
});
