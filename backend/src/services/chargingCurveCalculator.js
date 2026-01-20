/**
 * Calculates realistic charging duration and energy consumption based on EV battery characteristics
 * Implements a charging curve that reduces power after 80% SOC
 */

/**
 * Calculate charging power based on SOC using a realistic curve
 * @param {number} soc - State of Charge (0-100)
 * @param {number} maxPower - Maximum charging power in kW
 * @returns {number} Actual charging power at current SOC
 */
export function calculateChargingPower(soc, maxPower) {
  // After 80% SOC, charging power drops significantly
  if (soc >= 80) {
    // Exponential decay function for realistic charging curve
    const decayFactor = Math.exp(-(soc - 80) / 10); // Adjust decay rate as needed
    return maxPower * decayFactor * 0.2; // Max 20% of max power after 80%
  }
  return maxPower;
}

/**
 * Calculate charging duration for a given SOC range
 * @param {number} startSOC - Starting State of Charge (0-100)
 * @param {number} targetSOC - Target State of Charge (0-100)
 * @param {number} batteryCapacity - Battery capacity in kWh
 * @param {number} maxPower - Maximum charging power in kW
 * @param {number} interval - Calculation interval in SOC percentage (default 1%)
 * @returns {object} Object containing duration in minutes and energy in kWh
 */
export function calculateChargingDuration(startSOC, targetSOC, batteryCapacity, maxPower, interval = 1) {
  let totalEnergy = 0; // kWh
  let totalTime = 0; // minutes
  
  // Validate inputs
  if (startSOC >= targetSOC || startSOC < 0 || targetSOC > 100) {
    return { duration: 0, energy: 0 };
  }
  
  // Calculate energy needed (kWh)
  const energyNeeded = batteryCapacity * (targetSOC - startSOC) / 100;
  
  // Simulate charging in small SOC intervals for accuracy
  for (let soc = startSOC; soc < targetSOC; soc += interval) {
    // Calculate power at current SOC
    const currentPower = calculateChargingPower(soc, maxPower);
    
    // Calculate energy for this interval (kWh)
    const intervalEnergy = batteryCapacity * interval / 100;
    
    // Calculate time for this interval (hours)
    const intervalTime = intervalEnergy / currentPower;
    
    // Add to totals
    totalEnergy += intervalEnergy;
    totalTime += intervalTime * 60; // Convert to minutes
  }
  
  return {
    duration: Math.round(totalTime),
    energy: parseFloat(totalEnergy.toFixed(2))
  };
}

/**
 * Get dynamic pricing multiplier based on time of day
 * @param {Date} time - Time to evaluate pricing for
 * @returns {object} Object containing multiplier and period name
 */
export function getDynamicPricingMultiplier(time) {
  const hour = time.getHours();
  
  // Peak hours (5 PM - 10 PM): 1.5x
  if (hour >= 17 && hour < 22) {
    return { multiplier: 1.5, period: 'peak' };
  }
  // Off-peak hours (10 PM - 10 AM): 0.8x
  else if (hour >= 22 || hour < 10) {
    return { multiplier: 0.8, period: 'off_peak' };
  }
  // Shoulder hours (10 AM - 5 PM): 1.2x
  else {
    return { multiplier: 1.2, period: 'shoulder' };
  }
}

/**
 * Calculate cost with dynamic pricing
 * @param {number} energyConsumed - Energy consumed in kWh
 * @param {Date} startTime - Start time of charging
 * @param {object} pricingConfig - Station pricing configuration
 * @returns {object} Object containing cost and pricing details
 */
export function calculateDynamicChargingCost(energyConsumed, startTime, pricingConfig) {
  // Default pricing if not provided
  const basePrice = pricingConfig?.basePrice || pricingConfig?.pricePerMinute || 10;
  const pricingModel = pricingConfig?.model || 'per_kwh';
  
  if (pricingModel === 'per_kwh') {
    const pricingInfo = getDynamicPricingMultiplier(startTime);
    const finalCost = energyConsumed * basePrice * pricingInfo.multiplier;
    
    return {
      cost: parseFloat(finalCost.toFixed(2)),
      basePrice: basePrice,
      multiplier: pricingInfo.multiplier,
      period: pricingInfo.period,
      energy: energyConsumed
    };
  } else {
    // For per-minute pricing, we still apply time-based multipliers
    const pricingInfo = getDynamicPricingMultiplier(startTime);
    // Estimate energy for per-minute pricing
    const estimatedEnergy = (energyConsumed > 0) ? energyConsumed : 7; // Default 7kW
    const finalCost = estimatedEnergy * basePrice * pricingInfo.multiplier;
    
    return {
      cost: parseFloat(finalCost.toFixed(2)),
      basePrice: basePrice,
      multiplier: pricingInfo.multiplier,
      period: pricingInfo.period,
      energy: estimatedEnergy
    };
  }
}

export default {
  calculateChargingPower,
  calculateChargingDuration,
  calculateDynamicChargingCost,
  getDynamicPricingMultiplier
};