#!/usr/bin/env bash
# 部署 Faucet 到指定测试网
# 用法: ./scripts/deploy-faucet.sh sepolia|base_sepolia|bsc_testnet

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

set -a
source .env
set +a

NETWORK="${1:-}"

if [[ -z "$NETWORK" ]]; then
  echo "用法: $0 <sepolia|base_sepolia|bsc_testnet>"
  exit 1
fi

forge script script/Deploy.s.sol:DeployFaucet --rpc-url "$NETWORK" --broadcast -vv

case "$NETWORK" in
  sepolia) CHAIN_ID=11155111; ENV_KEY=NEXT_PUBLIC_FAUCET_ADDRESS_SEPOLIA ;;
  base_sepolia) CHAIN_ID=84532; ENV_KEY=NEXT_PUBLIC_FAUCET_ADDRESS_BASE_SEPOLIA ;;
  bsc_testnet) CHAIN_ID=97; ENV_KEY=NEXT_PUBLIC_FAUCET_ADDRESS_BSC_TESTNET ;;
  *) echo "未知网络: $NETWORK"; exit 1 ;;
esac

RUN_FILE="broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"
CONTRACT=$(python3 -c "import json; print(json.load(open('$RUN_FILE'))['transactions'][0]['contractAddress'])")

echo ""
echo "部署成功: $CONTRACT"
echo "写入 .env.local:"
echo "$ENV_KEY=$CONTRACT"
echo ""
echo "充值示例:"
echo "cast send $CONTRACT \"deposit()\" --value 1ether --private-key 0x\${PK} --rpc-url \$(${NETWORK^^}_URL 2>/dev/null || echo RPC_URL)"
