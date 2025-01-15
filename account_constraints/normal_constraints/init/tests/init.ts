import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Init } from "../target/types/init";
import { Keypair } from "@solana/web3.js";
import assert from "assert";

describe("init", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Init as Program<Init>;

  it("create account by init constraint", async () => {
    // account key
    const accountKey = new Keypair();
    console.log(`new account address: ${accountKey.publicKey}`);

    const i = new BN(1024);
    const a = new BN(2048);

    const txSig = await program.methods
      .initialize(i, a)
      .accounts({
        signer: wallet.publicKey,
        newAccount: accountKey.publicKey,
      })
      .signers([accountKey])
      .rpc();
    console.log("Your transaction signature", txSig);

    // get the account data from the new account
    const accData = await program.account.accountData.fetch(
      accountKey.publicKey
    );

    assert(accData.a.eq(a));
    assert(accData.i.eq(i));
  });
});
