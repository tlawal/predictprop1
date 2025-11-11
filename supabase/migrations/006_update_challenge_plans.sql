BEGIN;

-- Update default params structure to empty JSON as new plans supply full configs
ALTER TABLE plans
  ALTER COLUMN params SET DEFAULT '{}'::jsonb;

-- Replace existing plans with the four new tiered account sizes for both evaluation types
DELETE FROM plans;

INSERT INTO plans (id, type, size, description, params, fee) VALUES
  (
    'd6af2a85-492f-4410-b487-3f6bc5f78064',
    '1-step',
    100,
    'Entry account to learn discipline with strict risk controls.',
    '{
      "starting_balance": 100,
      "accuracy_target": 70,
      "win_rate": 70,
      "min_days": 5,
      "profit_target": { "percent": 0.1, "amount": 10 },
      "drawdown_max": { "percent": 0.05, "amount": 5 },
      "exposure_cap": { "percent": 0.15, "amount": 15 }
    }'::jsonb,
    10
  ),
  (
    '6b6cc7f5-0f96-4d69-95f7-3d9c3627be0a',
    '1-step',
    500,
    'Scale up from micro stakes while keeping risk managed.',
    '{
      "starting_balance": 500,
      "accuracy_target": 70,
      "win_rate": 70,
      "min_days": 5,
      "profit_target": { "percent": 0.1, "amount": 50 },
      "drawdown_max": { "percent": 0.05, "amount": 25 },
      "exposure_cap": { "percent": 0.15, "amount": 75 }
    }'::jsonb,
    50
  ),
  (
    '9d7d6ffb-2c83-4d9b-ae22-7217e6c98f01',
    '1-step',
    5000,
    'Popular account size for serious traders targeting funding.',
    '{
      "starting_balance": 5000,
      "accuracy_target": 70,
      "win_rate": 70,
      "min_days": 5,
      "profit_target": { "percent": 0.1, "amount": 500 },
      "drawdown_max": { "percent": 0.05, "amount": 250 },
      "exposure_cap": { "percent": 0.15, "amount": 750 }
    }'::jsonb,
    250
  ),
  (
    '57d628c1-4d7f-4976-9f61-07e0f3b50bd8',
    '1-step',
    10000,
    'Advanced capital for confident traders ready to scale.',
    '{
      "starting_balance": 10000,
      "accuracy_target": 70,
      "win_rate": 70,
      "min_days": 5,
      "profit_target": { "percent": 0.1, "amount": 1000 },
      "drawdown_max": { "percent": 0.05, "amount": 500 },
      "exposure_cap": { "percent": 0.15, "amount": 1500 }
    }'::jsonb,
    400
  ),
  (
    '3ac0f07f-6b1d-4a82-9a1d-167afb46cc38',
    '2-step',
    100,
    'Gradual two-phase build-up for new traders proving consistency.',
    '{
      "starting_balance": 100,
      "accuracy_target": 70,
      "win_rate": 70,
      "phases": {
        "phase1": {
          "min_days": 5,
          "profit_target": { "percent": 0.06, "amount": 6 },
          "drawdown_max": { "percent": 0.04, "amount": 4 },
          "exposure_cap": { "percent": 0.1, "amount": 10 }
        },
        "phase2": {
          "min_days": 5,
          "profit_target": { "percent": 0.08, "amount": 8 },
          "drawdown_max": { "percent": 0.05, "amount": 5 },
          "exposure_cap": { "percent": 0.15, "amount": 15 }
        }
      }
    }'::jsonb,
    10
  ),
  (
    '617f8a0f-2db3-492c-b4e9-5d8d88f5f1a0',
    '2-step',
    500,
    'Balanced progression path to reinforce winning habits.',
    '{
      "starting_balance": 500,
      "accuracy_target": 70,
      "win_rate": 70,
      "phases": {
        "phase1": {
          "min_days": 5,
          "profit_target": { "percent": 0.06, "amount": 30 },
          "drawdown_max": { "percent": 0.04, "amount": 20 },
          "exposure_cap": { "percent": 0.1, "amount": 50 }
        },
        "phase2": {
          "min_days": 5,
          "profit_target": { "percent": 0.08, "amount": 40 },
          "drawdown_max": { "percent": 0.05, "amount": 25 },
          "exposure_cap": { "percent": 0.15, "amount": 75 }
        }
      }
    }'::jsonb,
    50
  ),
  (
    '1b8ed6ab-5ce1-45b5-857f-5fa1313dcd89',
    '2-step',
    5000,
    'Structured route for experienced traders who like checkpoints.',
    '{
      "starting_balance": 5000,
      "accuracy_target": 70,
      "win_rate": 70,
      "phases": {
        "phase1": {
          "min_days": 5,
          "profit_target": { "percent": 0.06, "amount": 300 },
          "drawdown_max": { "percent": 0.04, "amount": 200 },
          "exposure_cap": { "percent": 0.1, "amount": 500 }
        },
        "phase2": {
          "min_days": 5,
          "profit_target": { "percent": 0.08, "amount": 400 },
          "drawdown_max": { "percent": 0.05, "amount": 250 },
          "exposure_cap": { "percent": 0.15, "amount": 750 }
        }
      }
    }'::jsonb,
    250
  ),
  (
    '44f6dc89-02cf-456c-8b25-9592afc9897d',
    '2-step',
    10000,
    'Two-phase evaluation supporting larger strategic positions.',
    '{
      "starting_balance": 10000,
      "accuracy_target": 70,
      "win_rate": 70,
      "phases": {
        "phase1": {
          "min_days": 5,
          "profit_target": { "percent": 0.06, "amount": 600 },
          "drawdown_max": { "percent": 0.04, "amount": 400 },
          "exposure_cap": { "percent": 0.1, "amount": 1000 }
        },
        "phase2": {
          "min_days": 5,
          "profit_target": { "percent": 0.08, "amount": 800 },
          "drawdown_max": { "percent": 0.05, "amount": 500 },
          "exposure_cap": { "percent": 0.15, "amount": 1500 }
        }
      }
    }'::jsonb,
    400
  );

COMMIT;
