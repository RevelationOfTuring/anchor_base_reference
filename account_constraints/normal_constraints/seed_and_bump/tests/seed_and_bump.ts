import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SeedAndBump } from "../target/types/seed_and_bump";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import assert from "assert";

describe("seed_and_bump", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.SeedAndBump as Program<SeedAndBump>;

  // calculate the PDA we will use as the address of the account we will create
  const seeds = [Buffer.from("my custom seed"), wallet.publicKey.toBuffer()];
  const [pda, bump] = PublicKey.findProgramAddressSync(
    seeds,
    program.programId
  );
  console.log(`pda: ${pda}
bump: ${bump}`);

  const wrongSeeds = [Buffer.from("wrong seed"), wallet.publicKey.toBuffer()];
  const [wrongPda, _] = PublicKey.findProgramAddressSync(
    wrongSeeds,
    program.programId
  );

  it("Create a pda", async () => {
    const i = 1024;

    const txSig = await program.methods
      .initialize(i)
      .accounts({
        signer: wallet.publicKey,
        newAccount: pda,
      })
      .rpc();

    console.log("Your transaction signature", txSig);

    // check account data
    const accData = await program.account.accountData.fetch(
      pda
    );

    assert.equal(accData.i, i);
    assert.equal(accData.bump, bump);
  });

  it("Fail to create the pda with a wrong seed", async () => {
    const i = 1024;

    try {
      await program.methods
        .initialize(i)
        .accounts({
          signer: wallet.publicKey,
          newAccount: wrongPda,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(err.message, `AnchorError caused by account: new_account. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
Program log: Left:
Program log: ${wrongPda}
Program log: Right:
Program log: ${pda}`);
    }
  });

  it("Update data", async () => {
    const newI = 2048;
    await program.methods
      .update(newI)
      .accounts({
        signer: wallet.publicKey,
        existingAccount: pda,
      })
      .rpc()

    const accData = await program.account.accountData.fetch(pda);
    assert.equal(accData.bump, bump);
    assert.equal(accData.i, newI);
  })

  it("Fail to update data with the uninitialized wrong pda", async () => {
    const newI = 2048;

    try {
      await program.methods
        .update(newI)
        .accounts({
          signer: wallet.publicKey,
          existingAccount: wrongPda,
        })
        .rpc()
    } catch (err) {
      assert.strictEqual(
        err.message,
        `AnchorError caused by account: existing_account. Error Code: AccountNotInitialized. Error Number: 3012. Error Message: The program expected this account to be already initialized.`)
    }
  })

  it("Fail to update data with the initialized wrong pda", async () => {
    const newI = 2048;

    const other = new Keypair();
    const seeds = [Buffer.from("my custom seed"), other.publicKey.toBuffer()];
    const [otherPda, _] = PublicKey.findProgramAddressSync(
      seeds,
      program.programId
    );

    // transfer sol to other
    const instruction = SystemProgram.transfer(
      {
        fromPubkey: wallet.publicKey,
        toPubkey: other.publicKey,
        lamports: LAMPORTS_PER_SOL,
      }
    );
    const transaction = new Transaction().add(instruction);

    await sendAndConfirmTransaction(
      provider.connection,
      transaction,
      [wallet.payer]
    )

    assert.equal(await provider.connection.getBalance(other.publicKey), LAMPORTS_PER_SOL);

    // create and initialize the pda of other's
    await program.methods
      .initialize(1024)
      .accounts({
        signer: other.publicKey,
        newAccount: otherPda,
      })
      .signers([other])
      .rpc()

    try {
      await program.methods
        .update(newI)
        .accounts({
          signer: wallet.publicKey,
          existingAccount: otherPda,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.message,
        `AnchorError caused by account: existing_account. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.`)
    }
  })
});
