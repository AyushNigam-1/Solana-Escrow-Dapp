use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked}; 
use spl_token::ID as TOKEN_PROGRAM_ID;
use spl_token_2022::ID as TOKEN_2022_PROGRAM_ID;

declare_id!("7LbBHo3GD4ZJDiGAuK3uZKEzhvKXFhuJ4UFiZP1T7tJ7");

const ESCROW_PDA_SEED: &[u8] = b"escrow";

#[event]
pub struct InitializeEvent {
    pub initializer_key: String,
    pub initializer_deposit_token_account: String,
    pub initializer_deposit_token_mint: String,
    pub taker_expected_token_mint: String,
    pub initializer_amount:String,
    pub taker_expected_amount: String,
    pub initializer_receive_token_account: String,
    pub unique_seed: [u8; 8],
    pub expires_at: i64,
    pub bump: u8,
    pub escrow_pda: String,
    pub vault_account: String,
}

#[event]
pub struct ExchangeExecuted {
    pub initializer: Pubkey,
    pub taker: Pubkey,
    pub initializer_deposit_token_mint: Pubkey,
    pub taker_expected_token_mint: Pubkey,
    pub initializer_amount: u64,
    pub taker_expected_amount: u64,
    pub unique_seed: [u8; 8],
    pub timestamp: i64,
}

#[event]
pub struct EscrowCanceled {
    pub initializer: Pubkey,
    pub initializer_deposit_token_mint: Pubkey,
    pub canceled_amount: u64,
    pub unique_seed: [u8; 8],
    pub timestamp: i64,
}

// Helper function to check if the provided Pubkey is a valid token program ID
fn check_token_program_id(program_id: &Pubkey) -> Result<()> {
    if program_id.eq(&TOKEN_PROGRAM_ID) || program_id.eq(&TOKEN_2022_PROGRAM_ID) {
        Ok(())
    } else {
        Err(ErrorCode::InvalidTokenProgram.into())
    }
}

#[program]
pub mod escrow {
    use super::*;
    /// Initializes the escrow state account and transfers Token A from the seller
    /// to the PDA-owned temporary token account (vault).
    pub fn initialize_global_stats(ctx: Context<InitializeGlobalStats>) -> Result<()> {
    let stats = &mut ctx.accounts.global_stats;
    stats.total_escrows_created = 0;
    stats.total_escrows_completed = 0;
    stats.total_escrows_canceled = 0;
    stats.total_value_locked = 0;
    stats.total_value_released = 0;
    stats.bump = ctx.bumps.global_stats;
    Ok(())
}
    pub fn initialize(
        ctx: Context<Initialize>,
        initializer_amount: u64,
        taker_expected_amount: u64,
        duration_in_seconds: i64,
        unique_seed: [u8; 8], // ← FIX: Added missing argument
    ) -> Result<()> {
        check_token_program_id(&ctx.accounts.token_program.key)?;
        // 1. Set the Escrow State data
        let escrow_account = &mut ctx.accounts.escrow_state;
        escrow_account.initializer_key = *ctx.accounts.initializer.key;
       let clock = Clock::get()?.unix_timestamp;

        let expires_at = clock
            .checked_add(duration_in_seconds) 
            .ok_or(ErrorCode::Overflow)?;
        escrow_account.expires_at = expires_at; 
        escrow_account.initializer_deposit_token_mint = ctx
            .accounts
            .initializer_deposit_token_mint
            .key();  // ← FIXED: Call key()
        escrow_account.initializer_deposit_token_account = ctx.accounts.initializer_deposit_token_account.key();
        escrow_account.taker_expected_token_mint =
            ctx.accounts.taker_expected_token_mint.key();  // ← FIXED: Call key()
        escrow_account.initializer_amount = initializer_amount;
        escrow_account.taker_expected_amount = taker_expected_amount;
        escrow_account.initializer_receive_token_account = ctx
            .accounts
            .initializer_receive_token_account
            .key();  // ← FIXED: Call key()
        escrow_account.unique_seed = unique_seed;  // ← FIXED: Save unique seed
        escrow_account.bump = ctx.bumps.escrow_state;

        let cpi_accounts = TransferChecked {
            from: ctx.accounts.initializer_deposit_token_account.to_account_info(),
            mint: ctx.accounts.initializer_deposit_token_mint.to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
            authority: ctx.accounts.initializer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        token_interface::transfer_checked(
            cpi_context,
            initializer_amount,
            ctx.accounts.initializer_deposit_token_mint.decimals,
        )?;
        let global_stats = &mut ctx.accounts.global_stats;
            global_stats.total_escrows_created = global_stats.total_escrows_created.checked_add(1).unwrap();
            global_stats.total_value_locked = global_stats
                .total_value_locked
                .checked_add(initializer_amount)
                .unwrap();

    // Optional: Track unique active users
    // global_stats.last_active_user = ctx.accounts.initializer.key();
       emit!(InitializeEvent {
        initializer_key: ctx.accounts.initializer.key().to_string(),
        initializer_deposit_token_account: ctx.accounts.initializer_deposit_token_account.key().to_string(),
        initializer_deposit_token_mint: ctx.accounts.initializer_deposit_token_mint.key().to_string(),
        taker_expected_token_mint: ctx.accounts.taker_expected_token_mint.key().to_string(),
        initializer_amount: initializer_amount.to_string(),
        taker_expected_amount: taker_expected_amount.to_string(),
        initializer_receive_token_account: ctx.accounts.initializer_receive_token_account.key().to_string(),
        unique_seed,
        expires_at,
        bump: ctx.bumps.escrow_state,
        escrow_pda: ctx.accounts.escrow_state.key().to_string(),
        vault_account: ctx.accounts.vault_account.key().to_string(),
    });

        Ok(())
    }

    /// Allows the Taker (buyer) to exchange their Token B for the Initializer's Token A.
    pub fn exchange(ctx: Context<Exchange>) -> Result<()> {
        check_token_program_id(&ctx.accounts.token_program.key())?;

        let escrow_state = &ctx.accounts.escrow_state;

        // --- CPI 1: Taker sends Token B to Initializer ---
        {
            let cpi_accounts_taker_transfer = TransferChecked {
                from: ctx.accounts.taker_deposit_token_account.to_account_info(),
                mint: ctx.accounts.taker_expected_mint.to_account_info(),
                to: ctx.accounts.initializer_receive_token_account.to_account_info(),
                authority: ctx.accounts.taker.to_account_info(),
            };

            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts_taker_transfer);

            token_interface::transfer_checked(
                cpi_ctx,
                escrow_state.taker_expected_amount,
                ctx.accounts.taker_expected_mint.decimals,
            )?;
        }

        // --- CPI 2: Escrow PDA sends Token A to Taker ---
        {
            let authority_seeds = &[
                ESCROW_PDA_SEED,
                escrow_state.initializer_key.as_ref(),
                escrow_state.unique_seed.as_ref(),
                &[escrow_state.bump],
            ];
            let signer_seeds = &[&authority_seeds[..]];

            let cpi_accounts_initializer_transfer = TransferChecked {
                from: ctx.accounts.vault_account.to_account_info(),
                mint: ctx.accounts.initializer_deposit_mint.to_account_info(),
                to: ctx.accounts.taker_receive_token_account.to_account_info(),
                authority: ctx.accounts.escrow_state.to_account_info(),
            };

            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts_initializer_transfer, signer_seeds);

            token_interface::transfer_checked(
                cpi_ctx,
                escrow_state.initializer_amount,
                ctx.accounts.initializer_deposit_mint.decimals,
            )?;
        }

        // --- CPI 3: Close Vault ---
        {
            let authority_seeds = &[
                ESCROW_PDA_SEED,
                escrow_state.initializer_key.as_ref(),
                escrow_state.unique_seed.as_ref(),
                &[escrow_state.bump],
            ];
            let signer_seeds = &[&authority_seeds[..]];

            let cpi_accounts_close = CloseAccount {
                account: ctx.accounts.vault_account.to_account_info(),
                destination: ctx.accounts.taker.to_account_info(),
                authority: ctx.accounts.escrow_state.to_account_info(),
            };

            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts_close, signer_seeds);

            token_interface::close_account(cpi_ctx)?;
        }
        {
            let global_stats = &mut ctx.accounts.global_stats;

            // Increment total completed escrows
            global_stats.total_escrows_completed = global_stats
                .total_escrows_completed
                .checked_add(1)
                .unwrap();

            // Add to total value released
            global_stats.total_value_released = global_stats
                .total_value_released
                .checked_add(escrow_state.initializer_amount)
                .unwrap();

            // Subtract from TVL (since escrow funds are released)
            if global_stats.total_value_locked >= escrow_state.initializer_amount {
                global_stats.total_value_locked -= escrow_state.initializer_amount;
            } else {
                global_stats.total_value_locked = 0;
            }

                // Optionally track the most recent successful trade pair
        }
        // --- Emit Event ---
        emit!(ExchangeExecuted {
            initializer: escrow_state.initializer_key,
            taker: ctx.accounts.taker.key(),
            initializer_deposit_token_mint: escrow_state.initializer_deposit_token_mint,
            taker_expected_token_mint: escrow_state.taker_expected_token_mint,
            initializer_amount: escrow_state.initializer_amount,
            taker_expected_amount: escrow_state.taker_expected_amount,
            unique_seed: escrow_state.unique_seed,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }


    /// Allows the Initializer (Seller) to cancel the escrow and retrieve their Token A.
            pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
            check_token_program_id(&ctx.accounts.token_program.key())?;

            let escrow_state = &ctx.accounts.escrow_state;

            // --- CPI 1: Return Token A from the vault to the Initializer ---
            let authority_seeds = &[
                ESCROW_PDA_SEED,
                escrow_state.initializer_key.as_ref(),
                escrow_state.unique_seed.as_ref(),
                &[escrow_state.bump],
            ];
            let signer_seeds = &[&authority_seeds[..]];

            let cpi_accounts_transfer = TransferChecked {
                from: ctx.accounts.vault_account.to_account_info(),
                mint: ctx.accounts.initializer_deposit_mint.to_account_info(),
                to: ctx.accounts.initializer_deposit_token_account.to_account_info(),
                authority: ctx.accounts.escrow_state.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context_transfer =
                CpiContext::new_with_signer(cpi_program, cpi_accounts_transfer, signer_seeds);

            token_interface::transfer_checked(
                cpi_context_transfer,
                escrow_state.initializer_amount,
                ctx.accounts.initializer_deposit_mint.decimals,
            )?;

            // --- CPI 2: Close the PDA-owned Vault Account ---
            let cpi_accounts_close = CloseAccount {
                account: ctx.accounts.vault_account.to_account_info(),
                destination: ctx.accounts.initializer.to_account_info(), // Refund rent to Initializer
                authority: ctx.accounts.escrow_state.to_account_info(),  // PDA signs the close
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context_close =
                CpiContext::new_with_signer(cpi_program, cpi_accounts_close, signer_seeds);

            token_interface::close_account(cpi_context_close)?;
            {
                let global_stats = &mut ctx.accounts.global_stats;

                // Use checked arithmetic with manual error handling
                global_stats.total_escrows_canceled = global_stats
                    .total_escrows_canceled
                    .checked_add(1)
                    .ok_or_else(|| error!(ErrorCode::NumericalOverflow))?;

                global_stats.total_value_released = global_stats
                    .total_value_released
                    .checked_add(escrow_state.initializer_amount)
                    .ok_or_else(|| error!(ErrorCode::NumericalOverflow))?;
            }

            // --- Emit Event ---
            emit!(EscrowCanceled {
                initializer: escrow_state.initializer_key,
                initializer_deposit_token_mint: escrow_state.initializer_deposit_token_mint,
                canceled_amount: escrow_state.initializer_amount,
                unique_seed: escrow_state.unique_seed,
                timestamp: Clock::get()?.unix_timestamp,
            });

            Ok(())
        }

}

// ----------------------------------------------------------------
// STATE
// ----------------------------------------------------------------

/// Defines the data stored in the Escrow State PDA account.
#[account]
pub struct EscrowState {
    // The Pubkey of the user who initiated the escrow (Seller)
    pub initializer_key: Pubkey,
    pub initializer_deposit_token_account: Pubkey, // <-- ADD THIS

    // The Mint of the token the initializer is offering (Token A)
    pub initializer_deposit_token_mint: Pubkey,

    // The Mint of the token the initializer expects to receive (Token B)
    pub taker_expected_token_mint: Pubkey,

    // The amount of Token A that the initializer deposited
    pub initializer_amount: u64,

    // The amount of Token B that the taker is expected to deposit
    pub taker_expected_amount: u64,

    // The token account where the initializer expects to receive Token B
    pub initializer_receive_token_account: Pubkey,

    // The unique 8-byte seed used to derive this PDA
    pub unique_seed: [u8; 8], // ← FIXED: Added unique seed to state
    pub expires_at: i64,

    // The canonical bump seed for the EscrowState PDA
    pub bump: u8,
}

// Space calculation: 
// 8 (discriminator) + 32*4 (Pubkeys) + 8*2 (u64 amounts) + 8 (unique_seed) + 1 (bump) = 161 bytes.
const ESCROW_ACCOUNT_SPACE: usize = 201; 

// ----------------------------------------------------------------
// ACCOUNT STRUCTS
// ----------------------------------------------------------------
#[account]
pub struct GlobalStats {
    pub total_escrows_created: u64,
    pub total_escrows_completed: u64,
    pub total_escrows_canceled: u64,
    pub total_value_locked: u64,
    pub total_value_released: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeGlobalStats<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,  // payer and initializer

    #[account(
        init,
        seeds = [b"global-stats"],
        bump,
        payer = admin,
        space = 8 + 8*5 + 1, // account discriminator + fields
    )]
    pub global_stats: Account<'info, GlobalStats>,

    pub system_program: Program<'info, System>,
}

/// Accounts for the `initialize` instruction
#[derive(Accounts)]
#[instruction(
    initializer_amount: u64, // ← FIXED: Corrected to match function args
    taker_expected_amount: u64,
     duration_in_seconds:i64,
    unique_seed: [u8; 8] // ← FIXED: Added unique seed arg
)] 
pub struct Initialize<'info> {
    /// The user creating the escrow (Seller). Must sign the transaction.
    #[account(mut)]
    pub initializer: Signer<'info>,

    /// The token account belonging to the initializer that holds Token A (the token being offered).
    /// Initializer's tokens will be transferred from here.
    #[account(
        mut, 
        constraint = initializer_deposit_token_account.amount >= initializer_amount @ErrorCode::InsufficientFunds,
        token::token_program = token_program
    )]
    pub initializer_deposit_token_account: InterfaceAccount<'info, TokenAccount>,  // ← FIXED: InterfaceAccount for dynamic

    /// The Mint account for Token A (the token being offered). Used for cross-checking.
    pub initializer_deposit_token_mint: InterfaceAccount<'info, Mint>,  // ← FIXED: InterfaceAccount

    /// The Mint account for Token B (the token the seller expects in return). Used for cross-checking.
    pub taker_expected_token_mint: InterfaceAccount<'info, Mint>,  // ← FIXED: InterfaceAccount

    /// The Initializer's account where they will receive the Token B if the trade is completed.
    /// This account must already exist.
    #[account(
        mut, 
        constraint = initializer_receive_token_account.owner == initializer.key() @ErrorCode::InvalidOwner,
        token::token_program = token_program
    )]
    pub initializer_receive_token_account: InterfaceAccount<'info, TokenAccount>,  // ← FIXED: InterfaceAccount
    #[account(
            mut,
            seeds = [b"global-stats"], 
            bump = global_stats.bump
        )]
    pub global_stats: Account<'info, GlobalStats>, // ← new addition
    /// The Escrow State PDA account. Stores the details of the trade.
    #[account(
        init,
        seeds = [ESCROW_PDA_SEED, initializer.key().as_ref(), unique_seed.as_ref()],  // ← FIXED: All seeds
        bump,
        payer = initializer,
        space = ESCROW_ACCOUNT_SPACE,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    /// The PDA-owned token account (Vault) that will hold the Initializer's deposited tokens (Token A).
    #[account(
        init,
        token::mint = initializer_deposit_token_mint,
        token::authority = escrow_state,
        token::token_program = token_program, 
        payer = initializer,
        seeds = [b"vault", escrow_state.key().as_ref()],  // ← FIXED: PDA for vault
        bump
    )]
    pub vault_account: InterfaceAccount<'info, TokenAccount>,  // ← FIXED: InterfaceAccount

    pub system_program: Program<'info, System>,

    pub token_program: Interface<'info, TokenInterface>,  // ← FIXED: Interface for dynamic

    pub rent: Sysvar<'info, Rent>,
}

/// Accounts for the `exchange` instruction
#[derive(Accounts)]
pub struct Exchange<'info> {
    /// Buyer (taker) — must sign
    #[account(mut)]
    pub taker: Signer<'info>,

    /// Taker's account holding Token B (the one they're offering)
    #[account(
        mut,
        constraint = taker_deposit_token_account.mint == escrow_state.taker_expected_token_mint @ErrorCode::InvalidMint,
        token::token_program = token_program
    )]
    pub taker_deposit_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Taker's account receiving Token A
    #[account(
        mut,
        constraint = taker_receive_token_account.mint == escrow_state.initializer_deposit_token_mint @ErrorCode::InvalidMint,
        token::token_program = token_program
    )]
    pub taker_receive_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Initializer's receiving account for Token B
    #[account(
        mut,
        constraint = initializer_receive_token_account.key() == escrow_state.initializer_receive_token_account @ErrorCode::InvalidAccount,
        token::token_program = token_program
    )]
    pub initializer_receive_token_account: InterfaceAccount<'info, TokenAccount>,

    /// PDA holding the escrow state
    #[account(
        mut,
        seeds = [ESCROW_PDA_SEED, escrow_state.initializer_key.as_ref(), escrow_state.unique_seed.as_ref()],
        bump = escrow_state.bump,
        close = taker,
        has_one = initializer_key,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    /// PDA vault that holds Token A
    #[account(
        mut,
        token::authority = escrow_state,
        token::token_program = token_program
    )]
    pub vault_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
            mut,
            seeds = [b"global-stats"],
            bump = global_stats.bump
        )]
    pub global_stats: Account<'info, GlobalStats>,
    /// Mint for Token A (initializer’s deposited token)
    #[account(
        token::token_program = token_program
    )]
    pub initializer_deposit_mint: InterfaceAccount<'info, Mint>,
    #[account(
            token::token_program = token_program
        )]
    /// Mint for Token B (taker’s offered token)
    pub taker_expected_mint: InterfaceAccount<'info, Mint>,

    /// Just for validation (has_one)
    /// CHECK: Used only for matching initializer
    pub initializer_key: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}


/// Accounts for the `cancel` instruction
#[derive(Accounts)]
pub struct Cancel<'info> {
    /// The user who initialized the escrow (Seller)
    #[account(mut)]
    pub initializer: Signer<'info>,

    /// The Initializer's token account to refund Token A into
    #[account(
        mut, 
        constraint = initializer_deposit_token_account.owner == initializer.key() @ErrorCode::InvalidOwner,
        token::token_program = token_program
    )]
    pub initializer_deposit_token_account: InterfaceAccount<'info, TokenAccount>,

    /// PDA-owned vault holding Token A
    #[account(
        mut,
        token::authority = escrow_state,
        token::token_program = token_program
    )]
    pub vault_account: InterfaceAccount<'info, TokenAccount>,

    /// Mint of the deposited token (Token A)
    pub initializer_deposit_mint: InterfaceAccount<'info, Mint>,

    /// Escrow state PDA
    #[account(
        mut,
        seeds = [ESCROW_PDA_SEED, initializer.key().as_ref(), escrow_state.unique_seed.as_ref()],
        bump = escrow_state.bump,
        close = initializer,
    )]
    pub escrow_state: Account<'info, EscrowState>,
 #[account(
            mut,
            seeds = [b"global-stats"], 
            bump = global_stats.bump
        )]
    pub global_stats: Account<'info, GlobalStats>,
    pub token_program: Interface<'info, TokenInterface>,
}


// ----------------------------------------------------------------
// ERRORS
// ----------------------------------------------------------------

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow occurred during calculation")]
    Overflow,
    #[msg("Insufficient funds in the initializer's deposit token account.")]
    InsufficientFunds,
    #[msg("The provided account does not belong to the correct owner.")]
    InvalidOwner,
    #[msg("The token mint in the provided account does not match the expected mint.")]
    InvalidMint,
    #[msg("The provided account key does not match the expected account in the escrow state.")]
    InvalidAccount,
    #[msg("The taker did not send the exact amount of expected tokens.")]
    InvalidExchangeAmount,
    #[msg("The token program provided is neither the Standard SPL Token Program nor the Token-2022 Program.")]
    InvalidTokenProgram,
    #[msg("Numerical overflow occurred.")]
    NumericalOverflow,
}