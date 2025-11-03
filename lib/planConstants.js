export const PLAN_DEFINITIONS = [
  {
    id: 'd6af2a85-492f-4410-b487-3f6bc5f78064',
    type: '1-step',
    size: 100,
    fee: 10,
    description: 'Entry account to learn discipline with strict risk controls.',
    params: {
      starting_balance: 100,
      win_rate: 70,
      min_days: 5,
      profit_target: {
        percent: 0.1,
        amount: 10
      },
      drawdown_max: {
        percent: 0.05,
        amount: 5
      },
      exposure_cap: {
        percent: 0.15,
        amount: 15
      }
    }
  },
  {
    id: '6b6cc7f5-0f96-4d69-95f7-3d9c3627be0a',
    type: '1-step',
    size: 500,
    fee: 50,
    description: 'Scale up from micro stakes while keeping risk managed.',
    params: {
      starting_balance: 500,
      win_rate: 70,
      min_days: 5,
      profit_target: {
        percent: 0.1,
        amount: 50
      },
      drawdown_max: {
        percent: 0.05,
        amount: 25
      },
      exposure_cap: {
        percent: 0.15,
        amount: 75
      }
    }
  },
  {
    id: '9d7d6ffb-2c83-4d9b-ae22-7217e6c98f01',
    type: '1-step',
    size: 5000,
    fee: 250,
    description: 'Popular account size for serious traders targeting funding.',
    params: {
      starting_balance: 5000,
      win_rate: 70,
      min_days: 5,
      profit_target: {
        percent: 0.1,
        amount: 500
      },
      drawdown_max: {
        percent: 0.05,
        amount: 250
      },
      exposure_cap: {
        percent: 0.15,
        amount: 750
      }
    }
  },
  {
    id: '57d628c1-4d7f-4976-9f61-07e0f3b50bd8',
    type: '1-step',
    size: 10000,
    fee: 400,
    description: 'Advanced capital for confident traders ready to scale.',
    params: {
      starting_balance: 10000,
      win_rate: 70,
      min_days: 5,
      profit_target: {
        percent: 0.1,
        amount: 1000
      },
      drawdown_max: {
        percent: 0.05,
        amount: 500
      },
      exposure_cap: {
        percent: 0.15,
        amount: 1500
      }
    }
  },
  {
    id: '3ac0f07f-6b1d-4a82-9a1d-167afb46cc38',
    type: '2-step',
    size: 100,
    fee: 10,
    description: 'Gradual two-phase build-up for new traders proving consistency.',
    params: {
      starting_balance: 100,
      win_rate: 70,
      phases: {
        phase1: {
          min_days: 5,
          profit_target: {
            percent: 0.06,
            amount: 6
          },
          drawdown_max: {
            percent: 0.04,
            amount: 4
          },
          exposure_cap: {
            percent: 0.1,
            amount: 10
          }
        },
        phase2: {
          min_days: 5,
          profit_target: {
            percent: 0.08,
            amount: 8
          },
          drawdown_max: {
            percent: 0.05,
            amount: 5
          },
          exposure_cap: {
            percent: 0.15,
            amount: 15
          }
        }
      }
    }
  },
  {
    id: '617f8a0f-2db3-492c-b4e9-5d8d88f5f1a0',
    type: '2-step',
    size: 500,
    fee: 50,
    description: 'Balanced progression path to reinforce winning habits.',
    params: {
      starting_balance: 500,
      win_rate: 70,
      phases: {
        phase1: {
          min_days: 5,
          profit_target: {
            percent: 0.06,
            amount: 30
          },
          drawdown_max: {
            percent: 0.04,
            amount: 20
          },
          exposure_cap: {
            percent: 0.1,
            amount: 50
          }
        },
        phase2: {
          min_days: 5,
          profit_target: {
            percent: 0.08,
            amount: 40
          },
          drawdown_max: {
            percent: 0.05,
            amount: 25
          },
          exposure_cap: {
            percent: 0.15,
            amount: 75
          }
        }
      }
    }
  },
  {
    id: '1b8ed6ab-5ce1-45b5-857f-5fa1313dcd89',
    type: '2-step',
    size: 5000,
    fee: 250,
    description: 'Structured route for experienced traders who like checkpoints.',
    params: {
      starting_balance: 5000,
      win_rate: 70,
      phases: {
        phase1: {
          min_days: 5,
          profit_target: {
            percent: 0.06,
            amount: 300
          },
          drawdown_max: {
            percent: 0.04,
            amount: 200
          },
          exposure_cap: {
            percent: 0.1,
            amount: 500
          }
        },
        phase2: {
          min_days: 5,
          profit_target: {
            percent: 0.08,
            amount: 400
          },
          drawdown_max: {
            percent: 0.05,
            amount: 250
          },
          exposure_cap: {
            percent: 0.15,
            amount: 750
          }
        }
      }
    }
  },
  {
    id: '44f6dc89-02cf-456c-8b25-9592afc9897d',
    type: '2-step',
    size: 10000,
    fee: 400,
    description: 'Two-phase evaluation supporting larger strategic positions.',
    params: {
      starting_balance: 10000,
      win_rate: 70,
      phases: {
        phase1: {
          min_days: 5,
          profit_target: {
            percent: 0.06,
            amount: 600
          },
          drawdown_max: {
            percent: 0.04,
            amount: 400
          },
          exposure_cap: {
            percent: 0.1,
            amount: 1000
          }
        },
        phase2: {
          min_days: 5,
          profit_target: {
            percent: 0.08,
            amount: 800
          },
          drawdown_max: {
            percent: 0.05,
            amount: 500
          },
          exposure_cap: {
            percent: 0.15,
            amount: 1500
          }
        }
      }
    }
  }
];

export const FEATURED_PLAN_SIZE = 5000;
