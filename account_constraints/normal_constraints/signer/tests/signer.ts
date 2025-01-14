import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Signer } from "../target/types/signer";
import { sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import assert from "assert";

describe("signer", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;
  const program = anchor.workspace.Signer as Program<Signer>;

  it("signer check pass", async () => {
    // wallet address as the "signer" account in the instruction
    const tx = await program.methods
      .signerCheck()
      .accounts({
        signer: wallet.publicKey,
      })
      .transaction();

    // send the tx with the wallet as the signer
    const txSig = await sendAndConfirmTransaction(
      connection,
      tx,
      [wallet.payer]
    );

    console.log(`tx signature: ${txSig}`)
  });

  it("signer check fail", async () => {
    // random address as the "signer" account in the instruction
    const randomKey = new Keypair();
    const tx = await program.methods
      .signerCheck()
      .accounts({
        signer: randomKey.publicKey,
      })
      .transaction();

    try {
      // send the tx with the wallet as the signer
      await sendAndConfirmTransaction(
        connection,
        tx,
        [wallet.payer]
      );
    } catch (err) {
      assert.strictEqual(err.message, `Signature verification failed.
Missing signature for public key [\`${randomKey.publicKey}\`].`);
    }
  });
});
