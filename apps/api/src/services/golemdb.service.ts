import {
  createClient,
  type GolemBaseClient,
  type GolemBaseCreate,
  type GolemBaseUpdate,
  Annotation,
  Tagged,
} from 'golem-base-sdk';
import { randomUUID } from 'node:crypto';
import { CONFIG } from '../config';

// TextEncoder and TextDecoder for data conversion
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export namespace GolemDbService {
  let clientInstance: GolemBaseClient | null = null;

  /**
   * Initialize GolemDB client with environment configuration
   */
  export const initializeClient = async (): Promise<GolemBaseClient> => {
    if (clientInstance) {
      return clientInstance;
    }

    try {
      // Get environment variables
      const rawKey = process.env.PRIVATE_KEY ?? '';
      const chainId = CONFIG.GOLEM.CHAIN_ID;
      const rpcUrl = CONFIG.GOLEM.RPC_URL;
      const wsUrl = CONFIG.GOLEM.WS_URL;

      if (!rawKey || !rpcUrl || !wsUrl) {
        throw new Error(
          'PRIVATE_KEY, RPC_URL, and WS_URL environment variables are required'
        );
      }

      // Prepare the private key
      const privateKeyHex = rawKey.replace(/^0x/, '');
      const privateKey = new Uint8Array(
        privateKeyHex
          .match(/.{1,2}/g)
          ?.map((byte) => Number.parseInt(byte, 16)) || []
      );

      // Create client
      clientInstance = await createClient(
        chainId,
        new Tagged('privatekey', privateKey),
        rpcUrl,
        wsUrl
      );

      console.log('Connected to Golem DB on ETHWarsaw testnet!');

      // Get owner address
      const ownerAddress = await clientInstance.getOwnerAddress();
      console.log(`Connected with address: ${ownerAddress}`);

      return clientInstance;
    } catch (error) {
      console.error('Failed to initialize GolemDB client:', error);
      throw error;
    }
  };

  /**
   * Get the GolemDB client instance (initializes if not already done)
   */
  export const getClient = async (): Promise<GolemBaseClient> => {
    if (!clientInstance) {
      return await initializeClient();
    }
    return clientInstance;
  };

  /**
   * Get the owner address of the connected account
   */
  export const getOwnerAddress = async (): Promise<string> => {
    const client = await getClient();
    return await client.getOwnerAddress();
  };

  /**
   * Create entities in GolemDB
   */
  export const createEntities = async (entities: GolemBaseCreate[]) => {
    const client = await getClient();
    return await client.createEntities(entities);
  };

  /**
   * Create a single entity in GolemDB
   */
  export const createEntity = async (entity: GolemBaseCreate) => {
    const receipts = await createEntities([entity]);
    return receipts[0];
  };

  /**
   * Update entities in GolemDB
   */
  export const updateEntities = async (updates: GolemBaseUpdate[]) => {
    const client = await getClient();
    return await client.updateEntities(updates);
  };

  /**
   * Update a single entity in GolemDB
   */
  export const updateEntity = async (update: GolemBaseUpdate) => {
    const receipts = await updateEntities([update]);
    return receipts[0];
  };

  /**
   * Query entities in GolemDB using annotation-based queries
   */
  export const queryEntities = async (query: string) => {
    const client = await getClient();
    return await client.queryEntities(query);
  };

  /**
   * Delete entities from GolemDB by entity keys
   */
  export const deleteEntities = async (entityKeys: `0x${string}`[]) => {
    const client = await getClient();
    return await client.deleteEntities(entityKeys);
  };

  /**
   * Delete a single entity from GolemDB
   */
  export const deleteEntity = async (entityKey: `0x${string}`) => {
    const receipts = await deleteEntities([entityKey]);
    return receipts[0];
  };

  /**
   * Get entity metadata
   */
  export const getEntityMetadata = async (entityKey: `0x${string}`) => {
    const client = await getClient();
    return await client.getEntityMetaData(entityKey);
  };

  /**
   * Extend entity BTL (blocks to live)
   */
  export const extendEntities = async (
    extensions: { entityKey: `0x${string}`; numberOfBlocks: number }[]
  ) => {
    const client = await getClient();
    return await client.extendEntities(extensions);
  };

  /**
   * Extend a single entity BTL
   */
  export const extendEntity = async (
    entityKey: `0x${string}`,
    numberOfBlocks: number
  ) => {
    const receipts = await extendEntities([{ entityKey, numberOfBlocks }]);
    return receipts[0];
  };

  /**
   * Get client account balance
   */
  export const getAccountBalance = async (): Promise<number> => {
    const client = await getClient();
    const ownerAddress = await client.getOwnerAddress();
    const balanceBigint = await client
      .getRawClient()
      .httpClient.getBalance({ address: ownerAddress });
    return Number(balanceBigint) / 10 ** 18;
  };

  /**
   * Watch for real-time events
   */
  export const watchLogs = async (options: {
    fromBlock?: bigint;
    onCreated?: (args: unknown) => void;
    onUpdated?: (args: unknown) => void;
    onExtended?: (args: unknown) => void;
    onDeleted?: (args: unknown) => void;
    onError?: (error: unknown) => void;
    pollingInterval?: number;
    transport?: 'websocket' | 'http';
  }) => {
    const client = await getClient();
    const currentBlock = await client
      .getRawClient()
      .httpClient.getBlockNumber();

    return client.watchLogs({
      fromBlock: options.fromBlock || BigInt(currentBlock),
      onCreated: options.onCreated || (() => {}),
      onUpdated: options.onUpdated || (() => {}),
      onExtended: options.onExtended || (() => {}),
      onDeleted: options.onDeleted || (() => {}),
      onError:
        options.onError || ((error) => console.error('Watch error:', error)),
      pollingInterval: options.pollingInterval || 1000,
      transport: options.transport || 'websocket',
    });
  };

  /**
   * Create an annotation helper
   */
  export const createAnnotation = (key: string, value: string | number) => {
    return new Annotation(key, value);
  };

  /**
   * Helper to create a simple entity with JSON data
   */
  export const createJsonEntity = (
    data: unknown,
    btl = 300,
    stringAnnotations: { key: string; value: string }[] = [],
    numericAnnotations: { key: string; value: number }[] = []
  ): GolemBaseCreate => {
    return {
      data: encoder.encode(JSON.stringify(data)),
      btl,
      stringAnnotations: stringAnnotations.map(
        (ann) => new Annotation(ann.key, ann.value)
      ),
      numericAnnotations: numericAnnotations.map(
        (ann) => new Annotation(ann.key, ann.value)
      ),
    };
  };

  /**
   * Helper to decode JSON data from query results
   */
  export const decodeJsonFromResults = (
    results: { storageValue: Uint8Array }[]
  ): unknown[] => {
    return results
      .map((result) => {
        try {
          return JSON.parse(decoder.decode(result.storageValue));
        } catch (error) {
          console.error('Failed to decode JSON:', error);
          return null;
        }
      })
      .filter(Boolean);
  };

  /**
   * Utility functions for data encoding/decoding
   */
  export const utils = {
    encode: (data: string): Uint8Array => encoder.encode(data),
    decode: (data: Uint8Array): string => decoder.decode(data),
    generateId: (): string => randomUUID(),
    encodeJson: (data: unknown): Uint8Array =>
      encoder.encode(JSON.stringify(data)),
    decodeJson: (data: Uint8Array): unknown => JSON.parse(decoder.decode(data)),
  };

  /**
   * Close the client connection (cleanup)
   */
  export const closeConnection = (): void => {
    if (clientInstance) {
      // If the client has a close method, call it
      // clientInstance.close?.();
      clientInstance = null;
      console.log('GolemDB connection closed');
    }
  };
}
