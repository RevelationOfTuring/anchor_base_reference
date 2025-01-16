import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { InitIfNeeded } from "../target/types/init_if_needed";
import { Keypair } from "@solana/web3.js";
import assert from "assert";
import { createMint, getAccount, getAssociatedTokenAddress } from "@solana/spl-token"

describe("init_if_needed", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.InitIfNeeded as Program<InitIfNeeded>;
  const accountKey = new Keypair();

  const i = 64;

  it("Create + initialize account", async () => {
    const txSig = await program.methods
      .initialize(i).
      accounts({
        signerMichael: wallet.publicKey,
        newAccount: accountKey.publicKey,
      })
      .signers([accountKey])
      .rpc();

    console.log("Your transaction signature", txSig);

    // fetch account data
    const accData = await program.account.accountData.fetch(
      accountKey.publicKey,
    )

    assert.equal(accData.i, i);
    assert(accData.isInitialized);
  });

  it("Account exists and no stored data changes", async () => {
    const updateI = 64 * 2;
    const txSig = await program.methods
      .initialize(updateI)
      .accounts({
        signerMichael: wallet.publicKey,
        newAccount: accountKey.publicKey,
      })
      .signers([accountKey])
      .rpc();

    console.log("Your transaction signature", txSig);

    // fetch account data
    const accData = await program.account.accountData.fetch(
      accountKey.publicKey,
    )

    assert.equal(accData.i, i);
    assert(accData.isInitialized);
    assert.notEqual(accData, updateI);
  })

  it("Initialize Associated Token Account if needed", async () => {
    // Create a new mint account
    const mintPk = await createMint(
      provider.connection,
      // pay keypair
      wallet.payer,
      // mint authority
      wallet.publicKey,
      // freeze authority
      wallet.publicKey,
      // decimals
      9
    );

    // Derive associated token account address locally
    const associatedTokenAddress = await getAssociatedTokenAddress(
      // mint account pubkey
      mintPk,
      // owner pubkey
      wallet.publicKey,
    )

    // Create associated token account
    let txSig = await program.methods
      .intializeTokenAccount()
      .accounts({
        signerMichael: wallet.publicKey,
        associatedToken: associatedTokenAddress,
        mint: mintPk,
      })
      .rpc()

    console.log("Your transaction signature", txSig);

    // check token account created
    let tokenAccount = await getAccount(
      provider.connection,
      associatedTokenAddress
    );

    assert.equal(tokenAccount.address.toBase58(), associatedTokenAddress.toBase58());
    assert.equal(tokenAccount.mint.toBase58(), mintPk.toBase58());
    assert.equal(tokenAccount.owner.toBase58(), wallet.publicKey.toBase58());

    // Invoke initializeTokenAccount again
    // Instruction proceeds without error, even though the associated token account already exists
    txSig = await program.methods
      .intializeTokenAccount()
      .accounts({
        signerMichael: wallet.publicKey,
        associatedToken: associatedTokenAddress,
        mint: mintPk,
      })
      .rpc()

    console.log("Your transaction signature", txSig);

    // data not changed
    tokenAccount = await getAccount(
      provider.connection,
      associatedTokenAddress
    );

    assert.equal(tokenAccount.address.toBase58(), associatedTokenAddress.toBase58());
    assert.equal(tokenAccount.mint.toBase58(), mintPk.toBase58());
    assert.equal(tokenAccount.owner.toBase58(), wallet.publicKey.toBase58());
  })
});
