use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

// The Program ID must be updated in Anchor.toml after running anchor build once
declare_id!("BBh9yqqreatuAtzcaJEGKaPSZjjk5CYwEVF2ActQwCEk");

// Define the PDA seed constant for generating the Escrow account address
const ESCROW_PDA_SEED: &[u8] = b"escrow";

#[program]
pub mod escrow {
    use super::*;

    /// Initializes the escrow state account and transfers Token A from the seller
    /// to the PDA-owned temporary token account (vault).
    pub fn initialize(
        ctx: Context<Initialize>,
        initializer_amount: u64,
        taker_expected_amount: u64,
    ) -> Result<()> {
        // 1. Set the Escrow State data
        let escrow_account = &mut ctx.accounts.escrow_state;
        escrow_account.initializer_key = *ctx.accounts.initializer.key;
        escrow_account.initializer_deposit_token_mint = *ctx
            .accounts
            .initializer_deposit_token_mint
            .to_account_info()
            .key;
        escrow_account.taker_expected_token_mint =
            *ctx.accounts.taker_expected_token_mint.to_account_info().key;
        escrow_account.initializer_amount = initializer_amount;
        escrow_account.taker_expected_amount = taker_expected_amount;
        escrow_account.initializer_receive_token_account = *ctx
            .accounts
            .initializer_receive_token_account
            .to_account_info()
            .key;

        // Correctly accessing the bump using direct field access
        escrow_account.bump = ctx.bumps.escrow_state;

        // 2. Transfer Token A (Initializer's tokens) into the PDA-owned vault
        let cpi_accounts = Transfer {
            from: ctx
                .accounts
                .initializer_deposit_token_account
                .to_account_info(),
            to: ctx.accounts.vault_account.to_account_info(),
            authority: ctx.accounts.initializer.to_account_info(), // Initializer signs this transfer
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_context, initializer_amount)?;

        Ok(())
    }

    /// Allows the Taker (buyer) to exchange their Token B for the Initializer's Token A.
    /// This instruction validates the expected amounts, performs two transfers, and closes
    /// both the vault and the escrow state accounts.
    pub fn exchange(ctx: Context<Exchange>) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;

        // Constraint check: Ensure the taker sends the exact amount requested
        if ctx.accounts.taker_deposit_token_account.amount != escrow_state.taker_expected_amount {
            return Err(ErrorCode::InvalidExchangeAmount.into());
        }

        // --- CPI 1: Taker sends Token B to Initializer (Seller) ---
        let cpi_accounts_taker_transfer = Transfer {
            from: ctx.accounts.taker_deposit_token_account.to_account_info(),
            to: ctx
                .accounts
                .initializer_receive_token_account
                .to_account_info(),
            authority: ctx.accounts.taker.to_account_info(), // Taker signs this transfer
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context_taker_transfer = CpiContext::new(cpi_program, cpi_accounts_taker_transfer);

        token::transfer(
            cpi_context_taker_transfer,
            escrow_state.taker_expected_amount,
        )?;

        // --- CPI 2: Escrow PDA sends Token A to Taker (Buyer) ---
        // Define the seeds used to sign the transfer from the PDA
        let authority_seeds = &[
            ESCROW_PDA_SEED,
            escrow_state.to_account_info().key.as_ref(), // Use the Escrow account key as an additional seed
            &[escrow_state.bump],
        ];
        let signer_seeds = &[&authority_seeds[..]];

        let cpi_accounts_initializer_transfer = Transfer {
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx.accounts.taker_receive_token_account.to_account_info(),
            authority: ctx.accounts.escrow_state.to_account_info(), // PDA signs this transfer
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context_initializer_transfer = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts_initializer_transfer,
            signer_seeds,
        );

        token::transfer(
            cpi_context_initializer_transfer,
            escrow_state.initializer_amount,
        )?;

        // --- CPI 3: Close the PDA-owned Vault Account ---
        let cpi_accounts_close = CloseAccount {
            account: ctx.accounts.vault_account.to_account_info(),
            destination: ctx.accounts.taker.to_account_info(), // Refund rent to the Taker
            authority: ctx.accounts.escrow_state.to_account_info(), // PDA signs the close
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context_close =
            CpiContext::new_with_signer(cpi_program, cpi_accounts_close, signer_seeds);

        token::close_account(cpi_context_close)?;

        // The escrow_state account is closed via the #[account(close = taker)] constraint
        Ok(())
    }

    /// Allows the Initializer (Seller) to cancel the escrow and retrieve their Token A.
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;

        // --- CPI 1: Return Token A from the vault to the Initializer ---
        let authority_seeds = &[
            ESCROW_PDA_SEED,
            escrow_state.to_account_info().key.as_ref(),
            &[escrow_state.bump],
        ];
        let signer_seeds = &[&authority_seeds[..]];

        let cpi_accounts_transfer = Transfer {
            from: ctx.accounts.vault_account.to_account_info(),
            to: ctx
                .accounts
                .initializer_deposit_token_account
                .to_account_info(),
            authority: ctx.accounts.escrow_state.to_account_info(), // PDA signs this transfer
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context_transfer =
            CpiContext::new_with_signer(cpi_program, cpi_accounts_transfer, signer_seeds);

        token::transfer(cpi_context_transfer, ctx.accounts.vault_account.amount)?;

        // --- CPI 2: Close the PDA-owned Vault Account ---
        let cpi_accounts_close = CloseAccount {
            account: ctx.accounts.vault_account.to_account_info(),
            destination: ctx.accounts.initializer.to_account_info(), // Refund rent to Initializer
            authority: ctx.accounts.escrow_state.to_account_info(),  // PDA signs the close
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context_close =
            CpiContext::new_with_signer(cpi_program, cpi_accounts_close, signer_seeds);

        token::close_account(cpi_context_close)?;

        // The escrow_state account is closed via the #[account(close = initializer)] constraint
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

    // The canonical bump seed for the EscrowState PDA
    pub bump: u8,
}

// ----------------------------------------------------------------
// ACCOUNT STRUCTS
// ----------------------------------------------------------------

// Space calculation: 8 (discriminator) + 32*4 (Pubkeys) + 8*2 (u64 amounts) + 1 (bump) = 153 bytes.
const ESCROW_ACCOUNT_SPACE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 32 + 1;

/// Accounts for the `initialize` instruction
#[derive(Accounts)]
#[instruction(initializer_amount: u64, taker_expected_amount: u64)]
pub struct Initialize<'info> {
    /// The user creating the escrow (Seller). Must sign the transaction.
    #[account(mut)]
    pub initializer: Signer<'info>,

    /// The token account belonging to the initializer that holds Token A (the token being offered).
    /// Initializer's tokens will be transferred from here.
    #[account(mut, constraint = initializer_deposit_token_account.amount >= initializer_amount @ErrorCode::InsufficientFunds)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,

    /// The Mint account for Token A (the token being offered). Used for cross-checking.
    pub initializer_deposit_token_mint: Account<'info, Mint>,

    /// The Mint account for Token B (the token the seller expects in return). Used for cross-checking.
    pub taker_expected_token_mint: Account<'info, Mint>,

    /// The Initializer's account where they will receive the Token B if the trade is completed.
    /// This account must already exist.
    #[account(mut, constraint = initializer_receive_token_account.owner == initializer.key() @ErrorCode::InvalidOwner)]
    pub initializer_receive_token_account: Account<'info, TokenAccount>,

    /// The Escrow State PDA account. Stores the details of the trade.
    #[account(
        init,
        // Escrow account is seeded by the Initializer's key and a static string
        seeds = [ESCROW_PDA_SEED, initializer.key().as_ref()],
        bump,
        payer = initializer,
        space = ESCROW_ACCOUNT_SPACE,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    /// The PDA-owned token account (Vault) that will hold the Initializer's deposited tokens (Token A).
    /// This vault is also a PDA, derived from the escrow state account.
    #[account(
        init,
        token::mint = initializer_deposit_token_mint,
        token::authority = escrow_state, // The EscrowState PDA is the authority of the vault
        payer = initializer,
    )]
    pub vault_account: Account<'info, TokenAccount>,

    /// Required standard programs and sysvars
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

/// Accounts for the `exchange` instruction
#[derive(Accounts)]
pub struct Exchange<'info> {
    /// The user accepting the escrow (Buyer). Must sign the transaction.
    #[account(mut)]
    pub taker: Signer<'info>,

    /// The Taker's token account that holds Token B (the token being offered).
    /// Taker's tokens will be transferred from here.
    #[account(mut, constraint = taker_deposit_token_account.mint == escrow_state.taker_expected_token_mint @ErrorCode::InvalidMint)]
    pub taker_deposit_token_account: Account<'info, TokenAccount>,

    /// The Taker's token account where they will receive Token A (the token being bought).
    #[account(mut, constraint = taker_receive_token_account.mint == escrow_state.initializer_deposit_token_mint @ErrorCode::InvalidMint)]
    pub taker_receive_token_account: Account<'info, TokenAccount>,

    /// The Initializer's token account where they receive the Taker's Token B.
    /// Constraint ensures it matches the address saved in the escrow state.
    #[account(mut, constraint = initializer_receive_token_account.key() == escrow_state.initializer_receive_token_account @ErrorCode::InvalidAccount)]
    pub initializer_receive_token_account: Account<'info, TokenAccount>,

    /// The Escrow State PDA account. Check bump seed for security and close it after trade.
    #[account(
        mut,
        seeds = [ESCROW_PDA_SEED, escrow_state.initializer_key.as_ref()],
        bump = escrow_state.bump,
        close = taker, // Refund rent to the Taker, as they complete the trade
        has_one = initializer_key, // Ensure initializer key matches the state
    )]
    pub escrow_state: Account<'info, EscrowState>,

    /// The PDA-owned token account (Vault) holding the deposited Token A.
    #[account(mut, token::authority = escrow_state)]
    pub vault_account: Account<'info, TokenAccount>,

    /// The original Initializer (Seller) account. Only used for the `has_one` constraint check.
    /// This account is NOT mutable.
    /// CHECK: This field is used only for has_one constraint checking in Exchange context.
    pub initializer_key: AccountInfo<'info>,

    /// Required standard programs
    pub token_program: Program<'info, Token>,
}

/// Accounts for the `cancel` instruction
#[derive(Accounts)]
pub struct Cancel<'info> {
    /// The user who initialized the escrow (Seller). Must sign and be mutable to receive rent back.
    #[account(mut)]
    pub initializer: Signer<'info>,

    /// The Initializer's token account where the refunded Token A is returned.
    #[account(mut, constraint = initializer_deposit_token_account.owner == initializer.key() @ErrorCode::InvalidOwner)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,

    /// The PDA-owned token account (Vault) holding the deposited Token A.
    /// The authority is the escrow state account.
    #[account(mut, token::authority = escrow_state)]
    pub vault_account: Account<'info, TokenAccount>,

    /// The Escrow State PDA account. Check bump seed for security and close it.
    #[account(
        mut,
        seeds = [ESCROW_PDA_SEED, initializer.key().as_ref()],
        bump = escrow_state.bump,
        close = initializer, // Refund rent to the Initializer upon cancellation
    )]
    pub escrow_state: Account<'info, EscrowState>,

    /// Required standard program
    pub token_program: Program<'info, Token>,
}

// ----------------------------------------------------------------
// ERRORS
// ----------------------------------------------------------------

#[error_code]
pub enum ErrorCode {
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
}
