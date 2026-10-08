import { AppRoutes } from '@/config/routes'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { getStoreInstance } from '@/store'

export const FeatureRoutes = {
  [AppRoutes.apps.index]: FEATURES.SAFE_APPS,
  [AppRoutes.swap]: FEATURES.NATIVE_SWAPS,
  [AppRoutes.stake]: FEATURES.STAKING,
  [AppRoutes.balances.nfts]: FEATURES.ERC721,
  [AppRoutes.settings.notifications]: FEATURES.PUSH_NOTIFICATIONS,
  [AppRoutes.bridge]: FEATURES.BRIDGE,
  [AppRoutes.earn]: FEATURES.EARN,
  [AppRoutes.balances.positions]: FEATURES.POSITIONS,
}

export const getBlockExplorerLink = (chain: Chain, address: string): { href: string; title: string } | undefined => {
  if (chain.blockExplorerUriTemplate) {
    return getExplorerLink(address, chain.blockExplorerUriTemplate)
  }
}

export const isRouteEnabled = (route: string, chain?: Chain) => {
  if (!chain) return false
  const featureRoute = FeatureRoutes[route]
  return !featureRoute || hasFeature(chain, featureRoute)
}

/**
 * Fetches chain configuration using RTK Query
 * @param chainId - The chain ID to fetch configuration for
 * @returns Promise that resolves to the Chain configuration
 * @throws Error if the chain configuration cannot be fetched
 */
export const getChainConfig = async (chainId: string): Promise<Chain> => {
  // 1. Manually intercept the BNB Chain Testnet ID (Chapel)
  if (chainId === '97') {
    return {
      chainId: '97',
      chainName: 'BNB Smart Chain Testnet',
      shortName: 'tbsc',
      description: 'BNB Smart Chain Testnet (Chapel)',
      rpcUri: { value: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545' }, 
      blockExplorerUriTemplate: {
        address: 'https://bscscan.com{{address}}',
        txHash: 'https://bscscan.com{{txHash}}',
      },
      nativeCurrency: {
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18,
      },
      // Leaving this empty forces the UI to process signatures locally via your file components!
      transactionService: '', 
      // Added 'SAFE_APPS' to render your dynamic iframe workspace panel natively
      features: ['CONTRACT_INTERACTION', 'SAFE_APPS'], 
      recommendedMasterCopyVersion: '1.4.1'
    } as any; // Cast as any to bypass strict auto-generated TypeScript schema type mismatches
  }

  // 2. Fallback: Leave the rest of Safe's existing background network fetching code untouched
  const store = getStoreInstance()

  const queryThunk = cgwApi.endpoints.chainsGetChainV2.initiate(
    { chainId, serviceKey: CONFIG_SERVICE_KEY },
    {
      forceRefetch: true,
    },
  )
  const queryAction = store.dispatch(queryThunk)

  try {
    return await queryAction.unwrap()
  } finally {
    queryAction.unsubscribe()
  }
}
