'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const ChallengePlansTable = () => {
  const [evaluationType, setEvaluationType] = useState('one-phase');

  const formatCurrency = (value) => {
    const amount = Number(value);
    const hasCents = Math.round(amount * 100) % 100 !== 0;
    return `$${amount.toLocaleString(undefined, hasCents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value) => `${(value * 100).toFixed(0)}%`;

  const basePlans = useMemo(() => ([
    {
      size: 100,
      fee: 10,
      featured: false,
      descriptions: {
        one: 'Entry account to learn discipline with strict risk controls.',
        two: 'Gradual two-phase build-up for new traders proving consistency.'
      }
    },
    {
      size: 500,
      fee: 50,
      featured: false,
      descriptions: {
        one: 'Scale up from micro stakes while keeping risk managed.',
        two: 'Balanced progression path to reinforce winning habits.'
      }
    },
    {
      size: 5000,
      fee: 250,
      featured: true,
      descriptions: {
        one: 'Popular account size for serious traders targeting funding.',
        two: 'Structured route for experienced traders who like checkpoints.'
      }
    },
    {
      size: 10000,
      fee: 400,
      featured: false,
      descriptions: {
        one: 'Advanced capital for confident traders ready to scale.',
        two: 'Two-phase evaluation supporting larger strategic positions.'
      }
    }
  ]), []);

  const challengePlans = useMemo(() => {
    const ONE_STEP_ROI = 0.1;
    const ONE_STEP_DRAWDOWN = 0.05;
    const ONE_STEP_EXPOSURE = 0.15;
    const TWO_STEP_PHASE1_ROI = 0.06;
    const TWO_STEP_PHASE1_DRAWDOWN = 0.04;
    const TWO_STEP_PHASE1_EXPOSURE = 0.1;
    const TWO_STEP_PHASE2_ROI = 0.08;
    const TWO_STEP_PHASE2_DRAWDOWN = 0.05;
    const TWO_STEP_PHASE2_EXPOSURE = 0.15;

    const onePhase = basePlans.map((plan) => ({
      size: plan.size,
      fee: plan.fee,
      featured: plan.featured,
      description: plan.descriptions.one,
      metrics: [
        {
          label: 'Profit Target',
          value: `${formatPercentage(ONE_STEP_ROI)} (${formatCurrency(plan.size * ONE_STEP_ROI)} ROI)`
        },
        {
          label: 'Accuracy',
          value: '70% minimum'
        },
        {
          label: 'Exposure Cap',
          value: `${formatPercentage(ONE_STEP_EXPOSURE)} (${formatCurrency(plan.size * ONE_STEP_EXPOSURE)} max position)`
        }
      ]
    }));

    const twoPhase = basePlans.map((plan) => ({
      size: plan.size,
      fee: plan.fee,
      featured: plan.featured,
      description: plan.descriptions.two,
      metrics: [
        {
          label: 'Accuracy',
          value: '70% per phase'
        },
        {
          label: 'Phase 1 Profit Target',
          value: `${formatPercentage(TWO_STEP_PHASE1_ROI)} (${formatCurrency(plan.size * TWO_STEP_PHASE1_ROI)} ROI)`
        },
        {
          label: 'Phase 1 Exposure Cap',
          value: `${formatPercentage(TWO_STEP_PHASE1_EXPOSURE)} (${formatCurrency(plan.size * TWO_STEP_PHASE1_EXPOSURE)} max position)`
        },
        {
          label: 'Phase 2 Profit Target',
          value: `${formatPercentage(TWO_STEP_PHASE2_ROI)} (${formatCurrency(plan.size * TWO_STEP_PHASE2_ROI)} ROI)`
        },
        {
          label: 'Phase 2 Exposure Cap',
          value: `${formatPercentage(TWO_STEP_PHASE2_EXPOSURE)} (${formatCurrency(plan.size * TWO_STEP_PHASE2_EXPOSURE)} max position)`
        }
      ]
    }));

    return {
      'one-phase': onePhase,
      'two-phase': twoPhase
    };
  }, [basePlans, formatCurrency, formatPercentage]);

  const formatAccountSize = (size) => {
    if (typeof size === 'number') {
      return size;
    }
    return size.replace('$', '').replace(',', '');
  };

  return (
    <div className="w-full">
      {/* Evaluation Type Toggle */}
      <div className={styles.evaluationToggle}>
        <button
          className={`${styles.toggleButton} ${evaluationType === 'one-phase' ? styles.active : ''}`}
          onClick={() => setEvaluationType('one-phase')}
        >
          One-Phase Evaluation
        </button>
        <button
          className={`${styles.toggleButton} ${evaluationType === 'two-phase' ? styles.active : ''}`}
          onClick={() => setEvaluationType('two-phase')}
        >
          Two-Phase Evaluation
        </button>
      </div>

      {/* Plans Grid */}
      <div className={styles.plansGrid}>
        {challengePlans[evaluationType].map((plan, index) => (
          <div key={index} className={`${styles.planCard} ${plan.featured ? styles.featured : ''}`}>
            <div className={styles.planHeader}>
              <h3>{formatCurrency(plan.size)}</h3>
              <div className={styles.planPrice}>{formatCurrency(plan.fee)}</div>
            </div>

            <div className={styles.planDescription}>
              <p>{plan.description}</p>
            </div>

            <div className={styles.planFeatures}>
              {plan.metrics.map((metric, metricIndex) => (
                <div key={metricIndex} className={styles.featureItem}>
                  <span className={styles.featureLabel}>{metric.label}</span>
                  <span className={styles.featureValue}>{metric.value}</span>
                </div>
              ))}
            </div>

            <div className={styles.planFooter}>
              <Link href={`/purchase-new-evaluation?size=${formatAccountSize(plan.size)}&step=${evaluationType}`}>
                <button className={styles.planButton}>
                  Select Plan
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengePlansTable;
