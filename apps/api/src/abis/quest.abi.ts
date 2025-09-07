export const QUEST_CONTRACT = {
  address: '0x89eE43418e49d19ff902Ac08A7cF6DaA88Bb8F19',
  abi: [
    {
      inputs: [
        { internalType: 'address', name: 'initialAdmin', type: 'address' },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    { inputs: [], name: 'AccessControlBadConfirmation', type: 'error' },
    {
      inputs: [
        { internalType: 'address', name: 'account', type: 'address' },
        { internalType: 'bytes32', name: 'neededRole', type: 'bytes32' },
      ],
      name: 'AccessControlUnauthorizedAccount',
      type: 'error',
    },
    {
      inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
      name: 'QuestNotStarted',
      type: 'error',
    },
    {
      inputs: [{ internalType: 'address', name: 'address_', type: 'address' }],
      name: 'UnacceptableAddress',
      type: 'error',
    },
    {
      inputs: [{ internalType: 'uint32', name: 'expiry', type: 'uint32' }],
      name: 'UnacceptableExpiry',
      type: 'error',
    },
    {
      inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
      name: 'UnacceptableId',
      type: 'error',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'reward', type: 'uint256' }],
      name: 'UnacceptableReward',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: 'string', name: 'id', type: 'string' },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'reward',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'contract IERC20',
          name: 'rewardToken',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint32',
          name: 'expiry',
          type: 'uint32',
        },
        {
          indexed: false,
          internalType: 'uint32',
          name: 'startsAt',
          type: 'uint32',
        },
      ],
      name: 'QuestCreated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: 'string', name: 'id', type: 'string' },
      ],
      name: 'QuestRemoved',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'previousAdminRole',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'newAdminRole',
          type: 'bytes32',
        },
      ],
      name: 'RoleAdminChanged',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
      ],
      name: 'RoleGranted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
      ],
      name: 'RoleRevoked',
      type: 'event',
    },
    {
      inputs: [],
      name: 'DEFAULT_ADMIN_ROLE',
      outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'MANAGER_ROLE',
      outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'string', name: '_id', type: 'string' },
        { internalType: 'uint256', name: '_reward', type: 'uint256' },
        {
          internalType: 'contract IERC20',
          name: '_rewardToken',
          type: 'address',
        },
        { internalType: 'uint32', name: '_expiry', type: 'uint32' },
        { internalType: 'uint32', name: '_startsAt', type: 'uint32' },
      ],
      name: 'createQuest',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: '_id', type: 'string' }],
      name: 'getQuest',
      outputs: [
        {
          components: [
            { internalType: 'string', name: 'id', type: 'string' },
            { internalType: 'uint256', name: 'reward', type: 'uint256' },
            {
              internalType: 'contract IERC20',
              name: 'rewardToken',
              type: 'address',
            },
            { internalType: 'uint32', name: 'expiry', type: 'uint32' },
            { internalType: 'uint32', name: 'startsAt', type: 'uint32' },
          ],
          internalType: 'struct Types.Quest',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
      name: 'getRoleAdmin',
      outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'bytes32', name: 'role', type: 'bytes32' },
        { internalType: 'address', name: 'account', type: 'address' },
      ],
      name: 'grantRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'bytes32', name: 'role', type: 'bytes32' },
        { internalType: 'address', name: 'account', type: 'address' },
      ],
      name: 'hasRole',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
      name: 'quests',
      outputs: [
        { internalType: 'string', name: 'id', type: 'string' },
        { internalType: 'uint256', name: 'reward', type: 'uint256' },
        {
          internalType: 'contract IERC20',
          name: 'rewardToken',
          type: 'address',
        },
        { internalType: 'uint32', name: 'expiry', type: 'uint32' },
        { internalType: 'uint32', name: 'startsAt', type: 'uint32' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'string', name: '_id', type: 'string' }],
      name: 'removeQuest',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'bytes32', name: 'role', type: 'bytes32' },
        {
          internalType: 'address',
          name: 'callerConfirmation',
          type: 'address',
        },
      ],
      name: 'renounceRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'bytes32', name: 'role', type: 'bytes32' },
        { internalType: 'address', name: 'account', type: 'address' },
      ],
      name: 'revokeRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
      name: 'supportsInterface',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
};
