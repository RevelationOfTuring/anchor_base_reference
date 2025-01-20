import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Close } from "../target/types/close";
import { Keypair } from "@solana/web3.js";
import assert from "assert";

describe("close", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;
  const program = anchor.workspace.Close as Program<Close>;
  const accKey = new Keypair();
  const other = new Keypair();

  before(async () => {
    await program.methods.initialize(new BN(1024))
      .accounts({
        signer: wallet.publicKey,
        account: accKey.publicKey
      })
      .signers([accKey])
      .rpc();
  })

  it("close the account", async () => {
    const accountInfo = await connection.getAccountInfo(accKey.publicKey);
    await program.methods.close()
      .accounts({
        account: accKey.publicKey,
        receiver: other.publicKey,
      })
      .rpc();

    // check the destination of the rent in the account closed
    const otherAccountInfo = await connection.getAccountInfo(other.publicKey);
    assert.equal(otherAccountInfo.lamports, accountInfo.lamports);

    // check the account closed
    assert.equal(await connection.getAccountInfo(accKey.publicKey), null);
    try {
      await program.account.accountData.fetch(accKey.publicKey);
    } catch (err) {
      assert.strictEqual(
        err.message,
        `Account does not exist or has no data ${accKey.publicKey}`
      );
    }
  });
});
