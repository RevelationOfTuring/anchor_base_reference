import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreateAssociateToken } from "../target/types/create_associate_token";
import { createMint, getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import assert from "assert";

describe("create_associate_token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.CreateAssociateToken as Program<CreateAssociateToken>;
  
  let associatedTokenAddress;
  let mintAddress;

  it("Create an associated token account", async () => {
    // Create a mint account
    mintAddress = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      9
    );

    // Derive an associated token account address
    associatedTokenAddress = getAssociatedTokenAddressSync(
      // mint
      mintAddress,
      // owner anuthority
      wallet.publicKey,
    );

    await program.methods.createAssociateToken()
      .accounts({
        signer: wallet.publicKey,
        associatedToken: associatedTokenAddress,
        mint: mintAddress,
      })
      .rpc();

    const associatedTokenAccount = await getAccount(
      connection,
      associatedTokenAddress,
    );

    assert(associatedTokenAccount.address.equals(associatedTokenAddress));
    assert(associatedTokenAccount.mint.equals(mintAddress));
    assert(associatedTokenAccount.owner.equals(wallet.publicKey));
    assert.equal(associatedTokenAccount.amount, 0);
  });

  it("Pass the check of associated token account", async () => {
    await program.methods.validateAssociateToken()
      .accounts({
        signer: wallet.publicKey,
        associatedToken: associatedTokenAddress,
        mint: mintAddress,
      })
      .rpc();
  });

  it("Fail with the mint check of the associated token account", async () => {
    const otherMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      9
    );

    try {
      await program.methods.validateAssociateToken()
        .accounts({
          signer: wallet.publicKey,
          associatedToken: associatedTokenAddress,
          mint: otherMint,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: associated_token. Error Code: ConstraintAssociated. Error Number: 2009. Error Message: An associated constraint was violated."
      )
    }
  });

  it("Fail with the authority check of the associated token account", async () => {
    const other = new Keypair();
    try {
      await program.methods.validateAssociateToken()
        .accounts({
          signer: other.publicKey,
          associatedToken: associatedTokenAddress,
          mint: mintAddress,
        })
        .signers([other])
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: associated_token. Error Code: ConstraintTokenOwner. Error Number: 2015. Error Message: A token owner constraint was violated."
      );
    }
  });
});
