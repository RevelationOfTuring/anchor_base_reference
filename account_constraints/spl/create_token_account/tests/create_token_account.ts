import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreateTokenAccount } from "../target/types/create_token_account";
import { createMint, getAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import assert from "assert";


describe("create_token_account", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.CreateTokenAccount as Program<CreateTokenAccount>;
  const accKey = new Keypair();
  let mint;

  it("Create a token account", async () => {
    // create a new mint account
    mint = await createMint(
      connection,
      // payer
      wallet.payer,
      // mint authority
      wallet.publicKey,
      // freeze authority
      wallet.publicKey,
      // decimals
      9
    );

    // create token account
    await program.methods.createTokenAccount()
      .accounts({
        signer: wallet.publicKey,
        tokenAccount: accKey.publicKey,
        mint,
      })
      .signers([accKey])
      .rpc();

    // get token account
    const tokenAccount = await getAccount(
      connection,
      accKey.publicKey,
    );

    assert(tokenAccount.mint.equals(mint));
    assert(tokenAccount.owner.equals(wallet.publicKey));
    assert(tokenAccount.address.equals(accKey.publicKey));
    assert.equal(tokenAccount.amount, 0);
  });

  it("Pass the check of the token account", async () => {
    await program.methods.valdateTokenAccount()
      .accounts({
        signer: wallet.publicKey,
        tokenAccount: accKey.publicKey,
        mint,
      })
      .rpc();
  });

  it("Fail with the authority check of token account", async () => {
    const other = new Keypair();
    try {
      await program.methods.valdateTokenAccount()
        .accounts({
          signer: other.publicKey,
          tokenAccount: accKey.publicKey,
          mint,
        })
        .signers([other])
        .rpc();
    } catch (err) {
      assert.strictEqual(err.logs[2], "Program log: AnchorError occurred. Error Code: ConstraintTokenOwner. Error Number: 2015. Error Message: A token owner constraint was violated.");
    }
  });

  it("Fail with the mint check of token account", async () => {
    const otherMint = await createMint(
      connection,
      // payer
      wallet.payer,
      // mint authority
      wallet.publicKey,
      // freeze authority
      wallet.publicKey,
      // decimals
      9
    );

    try {
      await program.methods.valdateTokenAccount()
        .accounts({
          signer: wallet.publicKey,
          tokenAccount: accKey.publicKey,
          mint: otherMint,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(err.logs[2], "Program log: AnchorError occurred. Error Code: ConstraintTokenMint. Error Number: 2014. Error Message: A token mint constraint was violated.");
    }
  });
});
