use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer, read_keypair_file},
    transaction::Transaction,
};
use std::str::FromStr;

#[derive(Debug, Clone)]
pub struct EscrowAccount {
    pub pubkey: Pubkey,
    pub expires_at: i64,
}

pub struct SolanaClient {
    pub rpc: RpcClient,
    pub payer: Keypair,
    pub program_id: Pubkey,
}

impl SolanaClient {
    pub async fn new(rpc_url: &str, keypair_path: &str, program_id: &str) -> Self {
        let payer = read_keypair_file(keypair_path).expect("❌ Failed to read keypair file");

        let program_id = Pubkey::from_str(program_id).expect("❌ Invalid program ID");

        let rpc = RpcClient::new(rpc_url.to_string());

        Self {
            rpc,
            payer,
            program_id,
        }
    }

    /// Call the Anchor `cancel` instruction for a given escrow account
    pub async fn cancel_if_expired(&self, escrow: &EscrowAccount) -> anyhow::Result<()> {
        // You’d typically prepare the transaction with Anchor’s IDL here.
        // For now we’ll pseudo-illustrate the call:
        use solana_sdk::instruction::Instruction;

        let ix = Instruction {
            program_id: self.program_id,
            accounts: vec![], // fill with Cancel context accounts
            data: vec![],     // Anchor-encoded instruction data
        };

        let recent_blockhash = self.rpc.get_latest_blockhash().await?;
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            recent_blockhash,
        );

        self.rpc.send_and_confirm_transaction(&tx).await?;
        Ok(())
    }
}
