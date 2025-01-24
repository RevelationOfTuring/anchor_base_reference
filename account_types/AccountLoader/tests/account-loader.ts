import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountLoader } from "../target/types/account_loader";
import { Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { assert } from "chai";
import { createHash } from "crypto";

describe("account-loader", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;
  const program = anchor.workspace.AccountLoader as Program<AccountLoader>;
  const accKey = new Keypair();
  const initValue = 16;

  it("Create a large data account", async () => {
    // Create a new large account
    const space = 8 + 1 * 4096
    const rent = await connection.getMinimumBalanceForRentExemption(space);
    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: accKey.publicKey,
        lamports: rent,
        space: space,
        programId: program.programId,
      })
    );

    await sendAndConfirmTransaction(
      connection,
      tx,
      [wallet.payer, accKey],
    );

    // All zero in data
    assert((await connection.getAccountInfo(accKey.publicKey)).data.equals(Buffer.alloc(space)))

    // Initialize the account of zero data
    await program.methods.initialize(initValue)
      .accounts({
        newAccount: accKey.publicKey,
      })
      .rpc();

    // Check the data after initialized
    const accountInfo = await connection.getAccountInfo(accKey.publicKey);
    const accountDiscriminator = createHash("sha256").update("account:LargeData").digest().subarray(0, 8);
    // [dscriminator, 0, initValue, 0...0]
    const expectedData = Buffer.alloc(space)
    Buffer.concat([accountDiscriminator, Buffer.from([0, initValue])]).copy(expectedData, 0, 0, 10);
    assert(accountInfo.data.equals(expectedData));
  });

  it("Pass: update a large data account", async () => {
    const valueToUpdate = 32;
    await program.methods.update(valueToUpdate)
      .accounts({
        existingAccount: accKey.publicKey,
      })
      .rpc();

    const largeDataAccount = await program.account.largeData.fetch(accKey.publicKey);
    assert.equal(largeDataAccount.data[1], valueToUpdate);
  })
});
