import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OverrideTokenProgram } from "../target/types/override_token_program";
import { Keypair } from "@solana/web3.js";
import { createMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import assert from "assert";

describe("override_token_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.OverrideTokenProgram as Program<OverrideTokenProgram>;

  let mintTokenProgram;
  let mintToken2022Program;

  before(async () => {
    // Create a mint with token program
    mintTokenProgram = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      9
    );

    // Create a mint with token 2022 program
    mintToken2022Program = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      wallet.publicKey,
      9,
      new Keypair(),
      null,
      TOKEN_2022_PROGRAM_ID
    );
  })

  it("Pass the token_program constraint check", async () => {
    await program.methods.checkTokenProgram()
      .accounts({
        mint: mintTokenProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await program.methods.checkTokenProgram()
      .accounts({
        mint: mintToken2022Program,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
  });

  it("Fail with the token_program constraint check", async () => {
    try {
      await program.methods.checkTokenProgram()
        .accounts({
          mint: mintTokenProgram,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError occurred. Error Code: ConstraintMintTokenProgram. Error Number: 2022. Error Message: A mint token program constraint was violated."
      );
    }

    try {
      await program.methods.checkTokenProgram()
        .accounts({
          mint: mintToken2022Program,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError occurred. Error Code: ConstraintMintTokenProgram. Error Number: 2022. Error Message: A mint token program constraint was violated."
      );
    }
  });
});
