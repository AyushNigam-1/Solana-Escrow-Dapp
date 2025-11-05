use anyhow::Result;
use chrono::{Duration, Utc};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};

#[derive(Debug, Clone)]
pub struct Escrow {
    pub pubkey: Pubkey,
    pub expires_at: i64, // Unix timestamp
}

#[derive(Clone)]
pub struct SolanaService {
    pub rpc: RpcClient,
    pub payer: Keypair,
    pub program_id: Pubkey,
}

impl SolanaService {
    pub fn new(rpc_url: &str, payer: Keypair, program_id: Pubkey) -> Self {
        let rpc = RpcClient::new(rpc_url.to_string());
        Self {
            rpc,
            payer,
            program_id,
        }
    }

    pub async fn get_expired_escrows(&self) -> Result<Vec<Escrow>> {
        // 🔹 In real implementation: fetch escrow accounts from Solana
        // For now, mock data:
        let now = Utc::now().timestamp();
        let example = Escrow {
            pubkey: Pubkey::new_unique(),
            expires_at: now - 60, // expired 1 min ago
        };
        Ok(vec![example])
    }

    pub async fn cancel_if_expired(&self, escrow: &Escrow) -> Result<()> {
        let now = Utc::now().timestamp();
        if now < escrow.expires_at {
            return Ok(()); // Not yet expired
        }

        // 🔹 In real code: call your Anchor "cancel" instruction
        // Here, we just simulate a transaction:
        let ix = system_instruction::transfer(
            &self.payer.pubkey(),
            &self.program_id,
            1, // just placeholder lamports
        );

        let blockhash = self.rpc.get_latest_blockhash()?;
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            blockhash,
        );

        match self.rpc.send_and_confirm_transaction(&tx) {
            Ok(sig) => {
                tracing::info!("Escrow {:?} cancelled, tx {:?}", escrow.pubkey, sig);
                Ok(())
            }
            Err(e) => {
                tracing::error!("Cancel failed: {:?}", e);
                Err(e.into())
            }
        }
    }
}
