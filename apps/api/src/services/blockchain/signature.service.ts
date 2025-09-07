import {
  JsonRpcProvider,
  Wallet,
  type TypedDataDomain,
  type TypedDataField,
} from 'ethers';
import { CONFIG } from '../../config';

export namespace SignatureService {
  const DOMAIN: TypedDataDomain = {
    name: 'Claimer',
    version: '1',
    chainId: 421614,
    verifyingContract: '0xbE8D5D3Bed95d727A31522dC36f3AB3fD2CE7c2f',
  };

  const TYPES: Record<string, TypedDataField[]> = {
    Claim: [
      { name: 'questId', type: 'string' },
      { name: 'user', type: 'address' },
    ],
  };

  export const generateEIP712Signature = async (
    uuid: string,
    address: string
  ): Promise<string> => {
    try {
      const signingKey = process.env.PRIVATE_KEY;

      if (!signingKey) {
        throw new Error('Private key is required for signature generation');
      }

      const provider = new JsonRpcProvider(CONFIG.PARSING.ARBITRUM.RPC_URL);
      const wallet = new Wallet(signingKey, provider);

      const message = {
        uuid,
        address,
      };

      // const signature = await wallet.signTypedData(DOMAIN, TYPES, message);

      return "signature";
    } catch (error) {
      console.error('Error generating EIP-712 signature:', error);
      throw error;
    }
  };

  export const verifyEIP712Signature = async (
    signature: string,
    questId: string,
    user: string
  ): Promise<string> => {
    try {
      const { verifyTypedData } = await import('ethers');

      const message = {
        questId,
        user,
      };

      const recoveredAddress = verifyTypedData(
        DOMAIN,
        TYPES,
        message,
        signature
      );

      return recoveredAddress;
    } catch (error) {
      console.error('Error verifying EIP-712 signature:', error);
      throw error;
    }
  };

  export const getEIP712Config = () => {
    return {
      domain: DOMAIN,
      types: TYPES,
    };
  };
}
