import {
  ethers,
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
    verifyingContract: '0x2d02956B201889A00CFf7B20bDEff13E69EcF1f4',
  };

  const TYPES: Record<string, TypedDataField[]> = {
    ClaimRequest: [
      { name: 'questId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
  };

  export const generateEIP712Signature = async (
    uuid: string,
    address: string
  ): Promise<string> => {
    try {
      const signingKey = process.env.PRIVATE_KEY;

      console.log('Signing key', signingKey);

      if (!signingKey) {
        throw new Error('Private key is required for signature generation');
      }

      const provider = new JsonRpcProvider(CONFIG.PARSING.ARBITRUM.RPC_URL);
      const wallet = new Wallet(signingKey, provider);

      const message = {
        questId: ethers.keccak256(ethers.toUtf8Bytes(uuid)),
        user: address,
      };

      const signature = await wallet.signTypedData(DOMAIN, TYPES, message);

      return signature;
    } catch (error) {
      console.error('Error generating EIP-712 signature:', error);
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
