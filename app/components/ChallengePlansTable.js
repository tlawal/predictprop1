'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const ChallengePlansTable = () => {
  const [evaluationType, setEvaluationType] = useState('one-phase');

  // Challenge plan data with prediction-specific parameters
  const challengePlans = {
    'one-phase': [
      { 
        size: '$5,000', 
        fee: '$65',
        profitTarget: '10% Realized ROI on 10 Resolved Markets', 
        dailyLoss: '70% Win Rate Required', 
        drawdown: '<5% Max Drawdown', 
        exposureCap: '$500 Exposure Cap',
        description: 'Perfect for beginners starting their prediction market journey'
      },
      { 
        size: '$10,000', 
        fee: '$200',
        profitTarget: '10% Realized ROI on 10 Resolved Markets', 
        dailyLoss: '70% Win Rate Required', 
        drawdown: '<5% Max Drawdown', 
        exposureCap: '$1,000 Exposure Cap',
        description: 'Most popular choice for serious traders',
        featured: true
      },
      { 
        size: '$25,000', 
        fee: '$450',
        profitTarget: '10% Realized ROI on 10 Resolved Markets', 
        dailyLoss: '70% Win Rate Required', 
        drawdown: '<5% Max Drawdown', 
        exposureCap: '$2,500 Exposure Cap',
        description: 'For experienced prediction market traders'
      },
      { 
        size: '$50,000', 
        fee: '$750',
        profitTarget: '10% Realized ROI on 10 Resolved Markets', 
        dailyLoss: '70% Win Rate Required', 
        drawdown: '<5% Max Drawdown', 
        exposureCap: '$5,000 Exposure Cap',
        description: 'Advanced traders ready for larger capital'
      },
      { 
        size: '$100,000', 
        fee: '$1,000',
        profitTarget: '10% Realized ROI on 10 Resolved Markets', 
        dailyLoss: '70% Win Rate Required', 
        drawdown: '<5% Max Drawdown', 
        exposureCap: '$10,000 Exposure Cap',
        description: 'Elite traders with proven track records'
      }
    ],
    'two-phase': [
      { 
        size: '$5,000', 
        fee: '$65',
        profitTarget: 'Phase 1: 6% Projected ROI on 5+ Positions', 
        dailyLoss: 'Phase 2: 8% Realized ROI on 10+ Resolved', 
        drawdown: 'Phase 1: <4% Drawdown | Phase 2: <5% Cluster Drawdown', 
        exposureCap: 'Phase 1: $300 Cap | Phase 2: $400 Cap',
        description: 'Two-phase evaluation for careful progression'
      },
      { 
        size: '$10,000', 
        fee: '$200',
        profitTarget: 'Phase 1: 6% Projected ROI on 5+ Positions', 
        dailyLoss: 'Phase 2: 8% Realized ROI on 10+ Resolved', 
        drawdown: 'Phase 1: <4% Drawdown | Phase 2: <5% Cluster Drawdown', 
        exposureCap: 'Phase 1: $600 Cap | Phase 2: $800 Cap',
        description: 'Most popular two-phase option',
        featured: true
      },
      { 
        size: '$25,000', 
        fee: '$450',
        profitTarget: 'Phase 1: 6% Projected ROI on 5+ Positions', 
        dailyLoss: 'Phase 2: 8% Realized ROI on 10+ Resolved', 
        drawdown: 'Phase 1: <4% Drawdown | Phase 2: <5% Cluster Drawdown', 
        exposureCap: 'Phase 1: $1,500 Cap | Phase 2: $2,000 Cap',
        description: 'For experienced traders who prefer gradual progression'
      },
      { 
        size: '$50,000', 
        fee: '$750',
        profitTarget: 'Phase 1: 6% Projected ROI on 5+ Positions', 
        dailyLoss: 'Phase 2: 8% Realized ROI on 10+ Resolved', 
        drawdown: 'Phase 1: <4% Drawdown | Phase 2: <5% Cluster Drawdown', 
        exposureCap: 'Phase 1: $3,000 Cap | Phase 2: $4,000 Cap',
        description: 'Advanced two-phase evaluation'
      },
      { 
        size: '$100,000', 
        fee: '$1,000',
        profitTarget: 'Phase 1: 6% Projected ROI on 5+ Positions', 
        dailyLoss: 'Phase 2: 8% Realized ROI on 10+ Resolved', 
        drawdown: 'Phase 1: <4% Drawdown | Phase 2: <5% Cluster Drawdown', 
        exposureCap: 'Phase 1: $6,000 Cap | Phase 2: $8,000 Cap',
        description: 'Elite two-phase evaluation for top traders'
      }
    ]
  };

  const formatAccountSize = (size) => {
    return size.replace('$', '').replace(',', '');
  };

  const getStepNumber = (type) => {
    return type === 'one-phase' ? '1' : '2';
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
              <h3>{plan.size}</h3>
              <div className={styles.planPrice}>{plan.fee}</div>
            </div>
            
            <div className={styles.planDescription}>
              <p>{plan.description}</p>
            </div>
            
            <div className={styles.planFeatures}>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Profit Target</span>
                <span className={styles.featureValue}>{plan.profitTarget}</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Win Rate</span>
                <span className={styles.featureValue}>{plan.dailyLoss}</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Max Drawdown</span>
                <span className={styles.featureValue}>{plan.drawdown}</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Exposure Cap</span>
                <span className={styles.featureValue}>{plan.exposureCap}</span>
              </div>
            </div>
            
            <div className={styles.planFooter}>
              <Link href={`/traders?size=${formatAccountSize(plan.size)}&step=${getStepNumber(evaluationType)}`}>
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
