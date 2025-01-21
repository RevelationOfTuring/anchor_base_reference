import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Realloc } from "../target/types/realloc";
import { Keypair, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import assert from "assert";
import { createHash } from 'crypto';

describe("realloc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const connetion = provider.connection;
  let accKey;

  const program = anchor.workspace.Realloc as Program<Realloc>;

  beforeEach(async () => {
    accKey = new Keypair();
    const s = "michael";
    await program.methods.initialize(s)
      .accounts({
        signer: wallet.publicKey,
        newAccount: accKey.publicKey,
      })
      .signers([accKey])
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, 8 + 4 + s.length);
  })

  it("Realloc to expand with zero and not fill", async () => {
    // account before realloc
    const originalAccountInfo = await connetion.getAccountInfo(accKey.publicKey);
    // 3 bytes more than the orignal one
    const s = "michael123"
    await program.methods.reallocZero(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, originalAccountInfo.data.length + 3);

    // expected data: original data + [0,0,0]
    const expectedData = Buffer.concat([originalAccountInfo.data, Buffer.from([0, 0, 0])]);
    assert(accountInfo.data.equals(expectedData));
  });

  it("Realloc to expand with zero and fill", async () => {
    // account before realloc
    const originalAccountInfo = await connetion.getAccountInfo(accKey.publicKey);
    // 3 bytes more than the orignal one
    const s = "michael123"
    await program.methods.reallocZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, originalAccountInfo.data.length + 3);

    // expected raw data
    const accountDiscriminator = createHash("sha256").update("account:AccountData").digest().subarray(0, 8);
    const stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    const expectedRawData = Buffer.concat([accountDiscriminator, stringLength, Buffer.from(s)]);
    assert(accountInfo.data.equals(expectedRawData))

    // check data in program account
    const accountData = await program.account.accountData.fetch(accKey.publicKey);
    assert.equal(accountData.data, s);
  });

  it("Realloc to shrink with zero and not fill", async () => {
    // 3 bytes less than the orignal one
    const s = "mich";

    // the space shrinks 3 bytes but the strength of string in the raw data is still 7
    try {
      await program.methods.reallocZero(s)
        .accounts({
          signer: wallet.publicKey,
          account: accKey.publicKey,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: account. Error Code: AccountDidNotSerialize. Error Number: 3004. Error Message: Failed to serialize the account."
      )
    }
  });

  it("Realloc to shrink with zero and fill", async () => {
    // account before realloc
    const originalAccountInfo = await connetion.getAccountInfo(accKey.publicKey);
    // 3 bytes less than the orignal one
    const s = "mich";

    await program.methods.reallocZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, originalAccountInfo.data.length - 3);

    // expected raw data
    const accountDiscriminator = createHash("sha256").update("account:AccountData").digest().subarray(0, 8);
    const stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    const expectedRawData = Buffer.concat([accountDiscriminator, stringLength, Buffer.from(s)]);
    assert(accountInfo.data.equals(expectedRawData))

    // check data in program account
    const accountData = await program.account.accountData.fetch(accKey.publicKey);
    assert.equal(accountData.data, s);
  });

  it("Realloc to expand(fill)-> shrink(fill) -> expand(not fill) with zero", async () => {
    const originalData = (await connetion.getAccountInfo(accKey.publicKey)).data;
    const discriminator = originalData.subarray(0, 8);
    let s = "michael123";
    // 1. expand and fill
    await program.methods.reallocZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();


    let stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    // discriminator + 10(4 bytes with little endian) + "michael123"
    let expectData = Buffer.concat([discriminator, stringLength, Buffer.from(s)]);
    assert(
      (await connetion.getAccountInfo(accKey.publicKey)).data.equals(expectData)
    );

    // 2. shrink and fill
    s = "m";
    await program.methods.reallocZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    // discriminator + 1(4 bytes with little endian) + "m"
    expectData = Buffer.concat([discriminator, stringLength, Buffer.from(s)]);
    const data = (await connetion.getAccountInfo(accKey.publicKey)).data;
    assert(
      data.equals(expectData)
    );

    // 3. expand(not fill)
    s = "michael123";
    await program.methods.reallocZero(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    // discriminator + 1(4 bytes with little endian) + "m" + [0,0,0,0,0,0,0,0,0] (9 zeros)
    // NOTE: the part before the zeros doesn't change because we only expanded and not filled
    expectData = Buffer.concat([data, Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0])]);
    assert(
      (await connetion.getAccountInfo(accKey.publicKey)).data.equals(expectData)
    );
  });

  it("Realloc to expand with non-zero and not fill", async () => {
    // account before realloc
    const originalAccountInfo = await connetion.getAccountInfo(accKey.publicKey);
    // 3 bytes more than the orignal one
    const s = "michael123"
    await program.methods.reallocNonZero(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, originalAccountInfo.data.length + 3);

    // expected data: original data + [0,0,0] (runtime will automatically zero-initialize the expanded space)
    const expectedData = Buffer.concat([originalAccountInfo.data, Buffer.from([0, 0, 0])]);
    assert(accountInfo.data.equals(expectedData));
  });

  it("Realloc to expand with non-zero and fill", async () => {
    // account before realloc
    const originalAccountInfo = await connetion.getAccountInfo(accKey.publicKey);
    // 3 bytes more than the orignal one
    const s = "michael123"
    await program.methods.reallocNonZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, originalAccountInfo.data.length + 3);

    // expected raw data
    const accountDiscriminator = createHash("sha256").update("account:AccountData").digest().subarray(0, 8);
    const stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    const expectedRawData = Buffer.concat([accountDiscriminator, stringLength, Buffer.from(s)]);
    assert(accountInfo.data.equals(expectedRawData))

    // check data in program account
    const accountData = await program.account.accountData.fetch(accKey.publicKey);
    assert.equal(accountData.data, s);
  });

  it("Realloc to shrink with non-zero and not fill", async () => {
    // 3 bytes less than the orignal one
    const s = "mich";

    // the space shrinks 3 bytes but the strength of string in the raw data is still 7
    try {
      await program.methods.reallocNonZero(s)
        .accounts({
          signer: wallet.publicKey,
          account: accKey.publicKey,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: account. Error Code: AccountDidNotSerialize. Error Number: 3004. Error Message: Failed to serialize the account."
      )
    }
  });

  it("Realloc to shrink with non-zero and fill", async () => {
    // account before realloc
    const originalAccountInfo = await connetion.getAccountInfo(accKey.publicKey);
    // 3 bytes less than the orignal one
    const s = "mich";

    await program.methods.reallocNonZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    const accountInfo = await connetion.getAccountInfo(accKey.publicKey);
    assert.equal(accountInfo.data.length, originalAccountInfo.data.length - 3);

    // expected raw data
    const accountDiscriminator = createHash("sha256").update("account:AccountData").digest().subarray(0, 8);
    const stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    const expectedRawData = Buffer.concat([accountDiscriminator, stringLength, Buffer.from(s)]);
    assert(accountInfo.data.equals(expectedRawData))

    // check data in program account
    const accountData = await program.account.accountData.fetch(accKey.publicKey);
    assert.equal(accountData.data, s);
  });

  it("Realloc to expand(fill)-> shrink(fill) -> expand(not fill) with non-zero", async () => {
    const originalData = (await connetion.getAccountInfo(accKey.publicKey)).data;
    const discriminator = originalData.subarray(0, 8);
    let s = "michael123";
    // 1. expand and fill
    await program.methods.reallocNonZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    let stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    // discriminator + 10(4 bytes with little endian) + "michael123"
    let expectData = Buffer.concat([discriminator, stringLength, Buffer.from(s)]);
    let data = (await connetion.getAccountInfo(accKey.publicKey)).data;
    assert(
      data.equals(expectData)
    );

    // 2. shrink and fill
    s = "m";
    await program.methods.reallocNonZeroAndFill(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    // discriminator + 1(4 bytes with little endian) + "m"
    expectData = Buffer.concat([discriminator, stringLength, Buffer.from(s)]);
    data = (await connetion.getAccountInfo(accKey.publicKey)).data;
    assert(
      data.equals(expectData)
    );

    // 3. expand(not fill)
    s = "michael";
    await program.methods.reallocNonZero(s)
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey,
      })
      .rpc();

    stringLength = Buffer.allocUnsafe(4);
    stringLength.writeUint32LE(s.length);
    // discriminator + 1(4 bytes with little endian) + "m" + [0,0,0,0,0,0] (6 zeros)
    // NOTE: the part before the zeros doesn't change because we only expanded and not filled
    // WHY STILL ZEROs?
    // It's because that memory used to grow is already zero-initialized upon program entrypoint.
    expectData = Buffer.concat([data, Buffer.from([0, 0, 0, 0, 0, 0])]);
    assert(
      (await connetion.getAccountInfo(accKey.publicKey)).data.equals(expectData)
    );
  });
});
