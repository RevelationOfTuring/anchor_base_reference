import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreateMint } from "../target/types/create_mint";
import { createMint, getMint } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";
import assert from "assert";

describe("create_mint", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;
  const accKey = new Keypair();

  const program = anchor.workspace.CreateMint as Program<CreateMint>;

  it("Create a mint account", async () => {
    await program.methods.createMint()
      .accounts({
        signer: wallet.publicKey,
        mint: accKey.publicKey
      })
      .signers([accKey])
      .rpc();

    // get mint account
    const mintAccount = await getMint(
      connection,
      accKey.publicKey
    );

    assert(mintAccount.address.equals(accKey.publicKey));
    assert(mintAccount.mintAuthority.equals(wallet.publicKey));
    assert(mintAccount.freezeAuthority.equals(wallet.publicKey));
    assert.equal(mintAccount.supply, 0);
    assert.equal(mintAccount.decimals, 9);
  });

  it("Pass the validation of the mint account", async () => {
    await program.methods.validateMint()
      .accounts({
        signer: wallet.publicKey,
        mint: accKey.publicKey,
      })
      .rpc();
  });


  it("Fail with the authority check of the mint account", async () => {
    const other = new Keypair();

    try {
      await program.methods.validateMint()
        .accounts({
          signer: other.publicKey,
          mint: accKey.publicKey,
        })
        .signers([other])
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError occurred. Error Code: ConstraintMintMintAuthority. Error Number: 2016. Error Message: A mint mint authority constraint was violated."
      );
    }
  });

  it("Fail with the freeze_authority check of the mint account", async () => {
    const other = new Keypair();
    // create a new mint account
    const otherMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      other.publicKey,
      9
    );

    try {
      await program.methods.validateMint()
        .accounts({
          signer: wallet.publicKey,
          mint: otherMint,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError occurred. Error Code: ConstraintMintFreezeAuthority. Error Number: 2017. Error Message: A mint freeze authority constraint was violated."
      );
    }
  });
});
