import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Account } from "../target/types/account";
import assert from "assert";
import { createAccount, createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

describe("account", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.Account as Program<Account>;

  let mint;
  let associateTokenAddress;
  let customAccount1Key = new Keypair();
  let customAccount2Key = new Keypair();

  before(async () => {
    // create mint
    mint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      9
    );

    // create token account
    associateTokenAddress = await createAccount(
      connection,
      wallet.payer,
      mint,
      wallet.publicKey,
    );

    await program.methods.createAccount(new BN(1024), new BN(2048))
      .accounts({
        signer: wallet.publicKey,
        newAccount1: customAccount1Key.publicKey,
        newAccount2: customAccount2Key.publicKey,
      })
      .signers([customAccount1Key, customAccount2Key])
      .rpc();
  });

  it("Pass the check of Account", async () => {
    await program.methods.checkAccount()
      .accounts({
        myAccount1: customAccount1Key.publicKey,
        mintAccount: mint,
        tokenAccount: associateTokenAddress
      })
      .rpc();
  });

  it("Fail with the check of Account with different data struct && same owner (program)", async () => {
    const customAccount1 = await connection.getAccountInfo(customAccount1Key.publicKey);
    const customAccount2 = await connection.getAccountInfo(customAccount2Key.publicKey);
    assert(customAccount1.owner.equals(customAccount2.owner));
    assert(customAccount1.owner.equals(program.programId));

    try {
      await program.methods.checkAccount()
        .accounts({
          myAccount1: customAccount2Key.publicKey,
          mintAccount: mint,
          tokenAccount: associateTokenAddress
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: my_account1. Error Code: AccountDiscriminatorMismatch. Error Number: 3002. Error Message: 8 byte discriminator did not match what was expected."
      );
    }
  });

  it("Fail with the check of Account with invalid owner (not the program)", async () => {
    const customAccount1 = await connection.getAccountInfo(customAccount1Key.publicKey);
    const mintAccount = await connection.getAccountInfo(mint);
    assert(customAccount1.owner.equals(program.programId));
    assert(mintAccount.owner.equals(TOKEN_PROGRAM_ID));

    try {
      await program.methods.checkAccount()
        .accounts({
          myAccount1: mint,
          mintAccount: mint,
          tokenAccount: associateTokenAddress
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: my_account1. Error Code: AccountOwnedByWrongProgram. Error Number: 3007. Error Message: The given account is owned by a different program than expected."
      );
    }
  });

  it("Fail if pass token account as mint", async () => {
    const tokenAccount = await connection.getAccountInfo(associateTokenAddress);
    const mintAccount = await connection.getAccountInfo(mint);
    // token account and mint account has a single owner
    assert(tokenAccount.owner.equals(mintAccount.owner));
    assert(mintAccount.owner.equals(TOKEN_PROGRAM_ID));

    try {
      await program.methods.checkAccount()
        .accounts({
          myAccount1: customAccount1Key.publicKey,
          // pass a token account as a mint account
          mintAccount: associateTokenAddress,
          tokenAccount: associateTokenAddress
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: ProgramError caused by account: mint_account. Error Code: InvalidAccountData. Error Number: 17179869184. Error Message: An account's data contents was invalid."
      );
    }
  });
});
