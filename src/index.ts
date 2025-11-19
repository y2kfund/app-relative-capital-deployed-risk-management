// src/index.ts
import relativeCapitalDeployed from './views/RelativeCapitalDeployed.vue'

// Named export
export { relativeCapitalDeployed }

// Default export (optional)
export default relativeCapitalDeployed

// Props interface
export interface relativeCapitalDeployedProps {
  userId?: string | null    // Current user ID for access control
}
