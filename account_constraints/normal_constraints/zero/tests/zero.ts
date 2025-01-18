import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Zero } from "../target/types/zero";
import { Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import assert from "assert";

describe("zero", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.Zero as Program<Zero>;

  const accKey = new Keypair();

  it("Calculate the rent for an account with max size", async () => {
    // 1KB = 1024 byte
    // 1MB = 1024 kb = 1024*1024 = 1048576 byte
    // max size for an account is 10MB
    const maxSizeForAccount = 1048576 * 10;
    // 72.98178048 SOL
    const rentForMaxSizeAccount = await connection.getMinimumBalanceForRentExemption(maxSizeForAccount);
    console.log(`rent for an account with max size: ${rentForMaxSizeAccount / LAMPORTS_PER_SOL} SOL`)
  });

  it("Initialize large zero copy account", async () => {
    // discriminator + account data length
    const space = 8 + 10240;

    // Get the min balance for the account space
    const rent = await connection.getMinimumBalanceForRentExemption(space);

    // Instruction to create an account
    const instructionCreateAccount = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: accKey.publicKey,
      lamports: rent,
      space: space,
      // Public key of the program to assign as the owner of the created account
      programId: program.programId,
    });

    // Instruction to initialize the zero copy account (adds account discriminator)
    const instructionInitialize = await program.methods.initialize()
      .accounts({
        account: accKey.publicKey,
      })
      .instruction();

    // Build transaction
    const transaction = new Transaction().add(
      instructionCreateAccount,
      instructionInitialize
    );

    const txSig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.payer, accKey]
    );

    console.log(`tx signature [${txSig}]`);
  });

  it("Fail with zero constraint", async () => {
    const accountInfo = await connection.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, 8 + 10240);
    assert(accountInfo.owner.equals(program.programId));

    // accountInfo.data is not all zero and first 8 bytes have been set discriminator
    assert.notEqual(accountInfo.data.compare(
      // zero bytes with length 8
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      0,
      8,
      0,
      8
    ), 0);

    try {
      await program.methods.initialize()
        .accounts({
          account: accKey.publicKey,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(err.logs[2], "Program log: AnchorError caused by account: account. Error Code: ConstraintZero. Error Number: 2013. Error Message: Expected zero account discriminant.")
    }
  });

  it("Update data at specific index", async () => {
    const i = 255;
    const index = 4;
    const start = 2;
    const end = 8;
    await program.methods.update(index, i, start, end)
      .accounts({
        existingAccount: accKey.publicKey,
      })
      .rpc();

    // Check the updated value
    const accData = await program.account.accountData.fetch(accKey.publicKey);
    assert.strictEqual(i, accData.data[index]);
  })
});
