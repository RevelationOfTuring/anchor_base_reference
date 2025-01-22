import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountInfo } from "../target/types/account_info";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("account-info", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.AccountInfo as Program<AccountInfo>;

  it("Pass with nonexistent account", async () => {
    const randomKey = new Keypair();
    assert.isNull(await connection.getAccountInfo(randomKey.publicKey));

    await program.methods.checkAccountInfo()
      .accounts({
        uncheckedAccount: randomKey.publicKey,
      })
      .rpc();
  });

  it("Pass with existing account", async () => {
    await program.methods.checkAccountInfo()
      .accounts({
        uncheckedAccount: wallet.publicKey,
      })
      .rpc();
  });

  it("Pass with program account", async () => {
    await program.methods.checkAccountInfo()
      .accounts({
        uncheckedAccount: program.programId,
      })
      .rpc();
  });

  it("Pass with system program", async () => {
    await program.methods.checkAccountInfo()
      .accounts({
        uncheckedAccount: SystemProgram.programId,
      })
      .rpc();
  });
});
